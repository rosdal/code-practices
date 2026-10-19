# 3. Indexes

Which indexes to create, which type, column order, and removing the ones that cost more than they help. Every index slows down writes and takes space; add one for a query you can name.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## DB-INDEX-1 Index foreign key columns.

PostgreSQL indexes primary keys and unique constraints automatically, but not the referencing side of a foreign key. Without that index, deleting or updating a parent row scans the whole child table to check references, and joins from parent to children can't use an index. Skip it only for tiny child tables, or when parents are never deleted and you never query from parent to children. MySQL/InnoDB creates these indexes automatically.

Official: pgsql-general (no automatic index on referencing columns); PostgreSQL docs, *Foreign Keys*.

```sql
-- bad
CREATE TABLE order_items (order_id bigint NOT NULL REFERENCES orders (id));

-- good
CREATE TABLE order_items (order_id bigint NOT NULL REFERENCES orders (id));
CREATE INDEX order_items_order_id_idx ON order_items (order_id);
```

## DB-INDEX-2 In a multicolumn B-tree, put equality columns first, then the range or sort column.

A B-tree on `(a, b)` is sorted by `a`, then by `b` within each `a`. It serves `a = ? AND b > ?` and `a = ? ORDER BY b` directly. With the columns the other way round, the index has to scan every `b` in the range. One index on `(a, b)` also covers queries on `a` alone, so a separate index on `a` is a duplicate. PostgreSQL 18's skip scan can use an index without a condition on its leading column, but it is slower than the right column order.

Official: PostgreSQL docs, *Multicolumn Indexes*; PostgreSQL 18 release notes (skip scan).

```sql
-- query: WHERE account_id = $1 AND created_at >= $2 ORDER BY created_at
-- bad
CREATE INDEX ON events (created_at, account_id);

-- good
CREATE INDEX ON events (account_id, created_at);
```

## DB-INDEX-3 Use partial and expression indexes to match how you query.

A partial index (`WHERE ...`) covers only the rows queries actually look for, such as unprocessed jobs or live rows, so it stays small. An expression index serves a query only when the query uses the exact same expression: `lower(email)`, or `(data->>'total')::numeric`, where casting to `::float` instead misses the index. A partial unique index can also enforce rules a constraint can't, such as one active subscription per user.

Official: PostgreSQL docs, *Partial Indexes* and *Indexes on Expressions*.

```sql
-- bad: whole-table index for a query that only wants pending rows
CREATE INDEX ON jobs (status);

-- good
CREATE INDEX jobs_pending_idx ON jobs (run_at) WHERE status = 'pending';
CREATE UNIQUE INDEX users_email_key ON users (lower(email));
```

## DB-INDEX-4 Pick the index type for the operator. B-tree by default, GIN for `jsonb` containment, arrays and full-text, BRIN for huge append-only tables.

`CREATE INDEX` builds a B-tree unless you say otherwise. B-tree handles `=`, ranges, sorting and `LIKE 'prefix%'`, though prefix matching needs `text_pattern_ops` in a non-C locale. GIN indexes the parts of a value: `@>` and `?` on `jsonb`, `&&` on arrays, `@@` on `tsvector`, and trigram search with `pg_trgm`. It can't serve `->>` equality or prefix matches, and it costs more on writes. BRIN stores min and max per block range, so it is tiny, but it only helps columns that follow physical row order, like `created_at` on an append-only log.

Official: PostgreSQL 18 docs, *Index Types*.

```sql
-- bad: GIN on the whole document when queries only read one key
CREATE INDEX ON orders USING gin (data);   -- for WHERE data->>'sku' = $1

-- good
CREATE INDEX ON orders ((data->>'sku'));            -- equality on one key
CREATE INDEX ON events USING gin (tags);            -- WHERE tags && $1
CREATE INDEX ON log_lines USING brin (created_at);  -- append-only, billions of rows
```

## DB-INDEX-5 Add `INCLUDE` columns only for a hot query that should be an index-only scan, and keep them narrow.

A covering index (`INCLUDE (...)`) stores extra columns so the query never visits the table. That only pays off when most pages are marked all-visible, which means a slowly changing table that vacuum keeps up with. Extra columns make the index bigger and slower, and a too-wide entry makes inserts fail. With `UNIQUE`, uniqueness applies to the key columns only.

Official: PostgreSQL docs, *Index-Only Scans and Covering Indexes*.

```sql
-- bad
CREATE INDEX ON orders (customer_id) INCLUDE (notes, shipping_address, data);

-- good: SELECT status, total FROM orders WHERE customer_id = $1
CREATE INDEX ON orders (customer_id) INCLUDE (status, total);
```

## DB-INDEX-6 Find unused and duplicate indexes, and drop them.

Every index is updated on every write, and it blocks HOT updates of the columns it covers. `pg_stat_user_indexes.idx_scan` counts how often each index was used. An index still at zero after a full business cycle (month-end, reports) is a candidate to drop, as is one whose columns are a leading prefix of another index. Check replicas too, since statistics are per server. Don't drop indexes that back constraints.

Convention, built on the PostgreSQL docs' *Cumulative Statistics System*.

```sql
SELECT relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
JOIN pg_index USING (indexrelid)
WHERE idx_scan = 0 AND NOT indisunique
ORDER BY pg_relation_size(indexrelid) DESC;
```
