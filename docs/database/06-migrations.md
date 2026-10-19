# 6. Migrations

Changing the schema of a live database without downtime: lock levels, the expand/contract pattern, constraints and indexes, backfills, and tooling.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## DB-MIG-1 Know the lock every DDL statement takes, and set `lock_timeout` in every migration.

`ALTER TABLE` takes an `ACCESS EXCLUSIVE` lock, which blocks reads as well as writes, unless the docs name a weaker lock for that subcommand. Combining subcommands in one statement takes the strictest lock any of them needs. Even an instant `ALTER` is dangerous: while it waits behind one long-running query, every new query on the table queues behind it. GoCardless lost about 15 seconds of API traffic this way. A short `lock_timeout` makes the migration give up instead. GitLab retries such attempts in a loop with a pause between them.

Official: PostgreSQL docs, *ALTER TABLE* and *Explicit Locking*. Retry loop: GitLab *Migration style guide*.

```sql
-- bad: waits indefinitely, and blocks the table while it waits
ALTER TABLE orders ADD COLUMN note text;

-- good
SET lock_timeout = '2s';
ALTER TABLE orders ADD COLUMN note text;
-- on lock timeout: wait, retry a few times, then fail the deploy
```

## DB-MIG-2 Change columns in expand/contract steps, each deployed separately. Never rename or drop a column the running code still uses.

During a deploy, old and new versions of the app run at once, and both must work against the schema. To rename `name` to `full_name`:

1. Add `full_name`.
2. Deploy code that writes both columns.
3. Backfill `full_name` (DB-MIG-5).
4. Deploy code that reads `full_name`.
5. Stop writing `name`.
6. Drop `name`.

A rename or drop in one step breaks every instance still running the old code. Since PostgreSQL 11, adding a column with a constant default is instant; a volatile default such as `clock_timestamp()` still rewrites the table.

Official: PostgreSQL docs, *ALTER TABLE* (fast defaults since 11). The expand/contract sequence is convention, used in GitLab's and Squawk's guidance (`renaming-column`, `ban-drop-column`).

```sql
-- bad: one deploy
ALTER TABLE users RENAME COLUMN name TO full_name;

-- good: first of several deploys
ALTER TABLE users ADD COLUMN full_name text;
```

## DB-MIG-3 Add constraints `NOT VALID`, then `VALIDATE CONSTRAINT` in a separate step.

Adding a `CHECK` or foreign key normally scans the whole table while holding a strong lock. `NOT VALID` skips the scan, and new writes are still checked. `VALIDATE CONSTRAINT` then checks existing rows under `SHARE UPDATE EXCLUSIVE`, which lets reads and writes continue. The `ADD` step still takes a brief strong lock (`ACCESS EXCLUSIVE` for `CHECK`, `SHARE ROW EXCLUSIVE` on both tables for a foreign key), so run it under `lock_timeout`. On PostgreSQL 18 this also works for `NOT NULL`. On 12 to 17, add `CHECK (col IS NOT NULL) NOT VALID`, validate it, `SET NOT NULL` (which skips the scan because of the valid check), then drop the check.

Official: PostgreSQL 18 docs, *ALTER TABLE*; Álvaro Herrera (EDB), *Changes to NOT NULL in Postgres 18*.

```sql
-- bad: full scan under a strong lock
ALTER TABLE orders ADD FOREIGN KEY (customer_id) REFERENCES customers (id);
ALTER TABLE orders ALTER COLUMN customer_id SET NOT NULL;

-- good: PostgreSQL 18
ALTER TABLE orders ADD CONSTRAINT orders_customer_fk
  FOREIGN KEY (customer_id) REFERENCES customers (id) NOT VALID;
ALTER TABLE orders ADD CONSTRAINT orders_customer_nn NOT NULL customer_id NOT VALID;
-- later migration
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_fk;
ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_nn;
```

## DB-MIG-4 Create and drop indexes `CONCURRENTLY`, outside a transaction.

A plain `CREATE INDEX` blocks all writes to the table for the whole build. `CONCURRENTLY` lets writes continue at the cost of a slower build. It can't run inside a transaction block, so turn off your migration tool's transaction for that migration (`disable_ddl_transaction!` in Rails, `atomic = False` in Django). If the build fails, it leaves an `INVALID` index; drop it and try again. Add a unique constraint by building the unique index concurrently first, then `ADD CONSTRAINT ... UNIQUE USING INDEX`.

Official: PostgreSQL docs, *CREATE INDEX*. GitLab and Squawk (`require-concurrent-index-creation`) enforce it.

```sql
-- bad
CREATE INDEX orders_customer_id_idx ON orders (customer_id);

-- good
CREATE INDEX CONCURRENTLY orders_customer_id_idx ON orders (customer_id);
```

## DB-MIG-5 Backfill in small batches, outside the schema migration.

One `UPDATE` across millions of rows holds row locks for its whole run, produces a burst of WAL that replicas must replay, and leaves dead rows for vacuum. Update a few thousand rows per transaction by key range, pausing between batches. Run it as a background job, not in the deploy. GitLab caps regular migrations at 3 minutes and sends longer data changes to batched background migrations.

Convention; GitLab *Migration style guide*.

```sql
-- bad
UPDATE users SET full_name = name;

-- good: repeat until no rows are updated
UPDATE users SET full_name = name
WHERE id IN (SELECT id FROM users WHERE full_name IS NULL ORDER BY id LIMIT 5000);
```

## DB-MIG-6 Roll forward in production. Lint every migration in CI.

A down migration that drops a new column also deletes the data written to it since the deploy, and few teams test them. GitLab keeps migrations reversible for development but fixes production by deploying a new migration, not by running `db:rollback`. A migration linter catches blocking DDL before review: Squawk for SQL files, strong_migrations for Rails.

Convention; GitLab *Migration style guide*; Squawk (2.70.0, 15 October 2026).

```text
// bad
production incident -> run down migrations

// good
production incident -> new forward migration
CI: squawk migrations/*.sql
```
