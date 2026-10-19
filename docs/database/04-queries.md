# 4. Queries

How application code builds and sends SQL: parameters, query shapes that are correct and fast, pagination, upserts, and how to find out why a query is slow. Language-neutral; the same rules apply to an ORM, a query builder or raw SQL.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## DB-QUERY-1 Pass every value as a bound parameter. Map identifiers through an allow-list.

Parameterized queries send the SQL and the values separately, so a value can never become code. OWASP lists them as the first defence against SQL injection. Escaping input is "strongly discouraged", and validation doesn't make string-building safe. Table names, column names and `ASC`/`DESC` can't be parameters; map user input to identifiers defined in your code. ORMs are safe until someone uses their raw-SQL escape hatch with interpolation.

Official: OWASP *SQL Injection Prevention Cheat Sheet*. See also [TS-21.4](../typescript/21-security.md) and [PHP-SEC-1](../php/06-security.md).

```ts
// bad
await db.query(`SELECT * FROM users WHERE email = '${email}' ORDER BY ${sort}`);

// good
const SORT_COLUMNS = new Map([['newest', 'created_at DESC'], ['name', 'name ASC']]);
const orderBy = SORT_COLUMNS.get(sort) ?? 'created_at DESC';
await db.query(`SELECT id, name FROM users WHERE email = $1 ORDER BY ${orderBy}`, [email]);
```

## DB-QUERY-2 Load related rows in one query per relation. Not one query per row (N+1).

Fetching 50 orders and then each order's customer separately sends 51 queries. Each pays a network round trip, which usually costs more than the query itself. Use a join, or one batched query with `= ANY($1)`, or the ORM's eager-loading option. N+1 often hides in loops and template code, so watch the query count per request in development and tests.

Convention.

```ts
// bad
for (const order of orders) {
  order.customer = await db.one('SELECT * FROM customers WHERE id = $1', [order.customerId]);
}

// good
const customers = await db.many('SELECT id, name FROM customers WHERE id = ANY($1)', [orders.map((o) => o.customerId)]);
```

## DB-QUERY-3 Name the columns you need. Not `SELECT *` in application code.

`SELECT *` reads wide and TOASTed columns you then throw away, prevents index-only scans, and changes what the code receives whenever someone adds a column. Ad-hoc queries in `psql` are fine.

Convention. TOAST cost: see DB-SCHEMA-8.

```sql
-- bad
SELECT * FROM orders WHERE customer_id = $1;

-- good
SELECT id, status, total, created_at FROM orders WHERE customer_id = $1;
```

## DB-QUERY-4 Paginate with keyset (`WHERE (created_at, id) < ($1, $2)`). Not large `OFFSET`s.

`OFFSET 5000` makes the database produce 5,000 rows and throw them away, so every page costs more than the last. In one measurement page 100 read 1,915 buffers against 25 for page 1, while keyset stayed flat. Rows inserted or deleted between requests also shift `OFFSET` pages, so users see duplicates or miss rows. Keyset needs a unique tiebreaker and an index that matches the sort. Its cost: no "jump to page 37". `OFFSET` is fine for small admin lists.

Official: PostgreSQL docs, *LIMIT and OFFSET* (rows skipped by `OFFSET` still have to be computed). The measurements are from Cybertec.

```sql
-- bad
SELECT id, title FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 4980;

-- good: pass the last row's (created_at, id) from the previous page
SELECT id, title, created_at FROM posts
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT 20;
-- index: (created_at DESC, id DESC)
```

## DB-QUERY-5 Upsert with `INSERT ... ON CONFLICT`. Not "select, then insert or update", and not `MERGE` for concurrent upserts.

Checking with a `SELECT` and then inserting is a race: two requests both see "missing" and one fails or creates a duplicate. `ON CONFLICT DO UPDATE` guarantees an insert or an update even under concurrency. `MERGE` (PostgreSQL 15+, with `RETURNING` since 17) doesn't: a concurrent `MERGE` can still fail with a unique violation. Keep `MERGE` for batch synchronisation where you control concurrency. `DO NOTHING ... RETURNING` returns only the new rows. PostgreSQL 19 adds `ON CONFLICT DO SELECT` to return the existing ones too.

Official: PostgreSQL docs, *INSERT* and *MERGE*. The concurrency comparison is from a secondary source.

```sql
-- bad
SELECT id FROM tags WHERE name = $1;   -- then INSERT if missing

-- good
INSERT INTO tags (name) VALUES ($1)
ON CONFLICT (name) DO UPDATE SET updated_at = now()
RETURNING id;
```

## DB-QUERY-6 Write `NOT EXISTS`, not `NOT IN (subquery)`, and half-open ranges, not `BETWEEN`, for time.

`x NOT IN (SELECT ...)` returns no rows at all if the subquery yields a single NULL, and it plans badly. `BETWEEN` includes both ends, so a row at exactly midnight falls into two adjacent days.

Official: wiki *Don't Do This*.

```sql
-- bad
SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM orders);
SELECT count(*) FROM orders WHERE created_at BETWEEN '2026-10-01' AND '2026-10-02';

-- good
SELECT id FROM users u WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id);
SELECT count(*) FROM orders WHERE created_at >= '2026-10-01' AND created_at < '2026-10-02';
```

## DB-QUERY-7 Diagnose slow queries with `EXPLAIN (ANALYZE, BUFFERS)` on production-like data.

`EXPLAIN` alone shows estimates. `ANALYZE` runs the query and shows real row counts and timings, so a big gap between estimated and actual rows points to bad statistics. `BUFFERS` (on by default with `ANALYZE` since PostgreSQL 18) shows pages read. Buffer counts are a steadier measure than timings, which vary with caching. A plan from a 1,000-row dev database says little about a 50-million-row table. `ANALYZE` really executes the statement, so wrap writes in a transaction you roll back.

Official: PostgreSQL docs, *EXPLAIN*; PostgreSQL 18 release notes. Find what to examine with `pg_stat_statements` (DB-SETUP-3).

```sql
-- bad: estimates only, on a dev database
EXPLAIN SELECT ...;

-- good
BEGIN;
EXPLAIN (ANALYZE, BUFFERS) UPDATE orders SET status = 'paid' WHERE id = 42;
ROLLBACK;
```
