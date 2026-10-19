---
name: database
description: Use when writing or reviewing SQL, a schema, a migration, or code that queries a relational database — especially PostgreSQL — through an ORM, a query builder, or raw SQL. Also use when choosing column types or primary keys, adding an index or constraint, changing a table that is live in production, paginating, upserting, writing a job queue or outbox, handling transactions, retries, or timeouts, setting up connection pooling or PgBouncer, roles or row-level security, backups or upgrades, and when tests need a database.
---

# Database

Each line is one rule from the Rosdal database guide (PostgreSQL 18 as reference). The ID links to the full rule, with its reason, source and examples, in `docs/database/` of https://github.com/rosdal/code-practices. Cite IDs in review comments ("see DB-MIG-4").

Language-neutral: in an ORM, use its mechanism for each rule and check the SQL it emits. For MySQL or SQLite, the guide notes where a rule differs. In an existing schema with its own conventions, consistency wins for naming; the safety rules (migrations, parameters, transactions) still apply. Check the server version before using PG 15/17/18 features.

## Judgment: apply while writing

### Queries

- [DB-QUERY-1] Bind every value as a parameter; map identifiers and sort direction through an allow-list. Never interpolate.
- [DB-QUERY-2] No N+1: one join or one `= ANY($1)` batch per relation.
- [DB-QUERY-3] Name columns; no `SELECT *` in application code.
- [DB-QUERY-4] Keyset pagination (`WHERE (created_at, id) < ($1, $2)`) with a matching index. Not large `OFFSET`.
- [DB-QUERY-5] Upsert with `INSERT ... ON CONFLICT`. Not select-then-insert; not `MERGE` under concurrency.
- [DB-QUERY-6] `NOT EXISTS`, not `NOT IN (subquery)`; half-open `>= / <` ranges, not `BETWEEN`, for time.
- [DB-QUERY-7] Diagnose with `EXPLAIN (ANALYZE, BUFFERS)` on production-like data; roll back writes.

### Transactions

- [DB-TX-1] Keep transactions short; no network calls or waiting on users inside them.
- [DB-TX-2] Under `REPEATABLE READ`/`SERIALIZABLE`, retry the whole transaction on `40001`/`40P01`, bounded, with jitter.
- [DB-TX-3] `statement_timeout`, `lock_timeout` (lower), `idle_in_transaction_session_timeout` per role; `SET LOCAL` overrides. Never global, never 0.
- [DB-TX-4] Job queues: `FOR UPDATE SKIP LOCKED` with `LIMIT` (not `OFFSET`), locking clause inside the CTE.
- [DB-TX-5] Publish events/jobs via an outbox table in the same transaction; consumers idempotent.
- [DB-TX-6] Idempotency keys under `UNIQUE (user_id, key)`; expire them.

### Schema

- [DB-SCHEMA-1] `timestamptz` for points in time. Never `timestamp`, `timetz`.
- [DB-SCHEMA-2] `text` + `CHECK` for length. Not `varchar(n)` by default; never `char(n)` (MySQL: keep lengths).
- [DB-SCHEMA-3] Money as `numeric` or integer minor units plus a currency column. Never `money` or floats.
- [DB-SCHEMA-4] `bigint GENERATED ALWAYS AS IDENTITY`. Not `serial`, not `int`.
- [DB-SCHEMA-5] bigint keys by default; `uuidv7()` when IDs are made outside the DB or exposed. Never UUIDv4 PKs on large tables.
- [DB-SCHEMA-6] `NOT NULL` by default; enforce rules with `CHECK`, `UNIQUE`, foreign keys.
- [DB-SCHEMA-7] Small state sets: `text` + `CHECK`; enum only if values are never removed; lookup table when values carry data.
- [DB-SCHEMA-8] `jsonb` for shapeless payloads; extract filtered/joined fields into columns (`STORED` generated). Not `json`.
- [DB-SCHEMA-9] Decide NULL handling in unique keys; `UNIQUE NULLS NOT DISTINCT` (PG15+).
- [DB-SCHEMA-10] Always write `STORED` or `VIRTUAL` on generated columns.
- [DB-SCHEMA-11] Lowercase `snake_case`, plural tables, `<table>_id` foreign keys. No quoted identifiers.
- [DB-SCHEMA-12] Hard delete plus archive table; soft delete only when undelete is a real feature.

### Indexes

- [DB-INDEX-1] Index foreign key columns (Postgres doesn't).
- [DB-INDEX-2] Multicolumn: equality columns first, then range/sort column.
- [DB-INDEX-3] Partial and expression indexes matching the query exactly.
- [DB-INDEX-4] B-tree default; GIN for `jsonb` containment/arrays/full-text; BRIN for huge append-only tables.
- [DB-INDEX-5] `INCLUDE` only for hot index-only scans; narrow columns.
- [DB-INDEX-6] Drop unused (`idx_scan = 0` over a full cycle, all replicas) and duplicate indexes.

### Migrations

- [DB-MIG-1] Know each statement's lock; `SET lock_timeout` in every migration and retry.
- [DB-MIG-2] Expand/contract across deploys; never rename/drop a column running code uses.
- [DB-MIG-3] Constraints `NOT VALID`, then `VALIDATE CONSTRAINT` separately (PG18: also `NOT NULL`).
- [DB-MIG-4] `CREATE/DROP INDEX CONCURRENTLY`, outside a transaction; drop `INVALID` leftovers.
- [DB-MIG-5] Backfill in small batches as a background job, not in the migration.
- [DB-MIG-6] Roll forward in production; lint migrations in CI (Squawk, strong_migrations).

### Testing

- [DB-TEST-1] Test against real PostgreSQL of production's major (Testcontainers/CI service). Not mocks, not SQLite.
- [DB-TEST-2] Build the test schema by running the real migrations.
- [DB-TEST-3] Rolled-back transaction per test; truncate or template DB when code commits or uses several connections.

## Setup and operations: when configuring servers, connections, roles

- [DB-SETUP-1] Supported major: 18 for new projects, 15 minimum (14 EOL 12 Nov 2026; 19 GA planned 19 Nov 2026).
- [DB-SETUP-2] Apply minor releases within weeks.
- [DB-SETUP-3] Preload `pg_stat_statements`.
- [DB-SETUP-4] `scram-sha-256` over TLS. No `md5`, no `trust` over the network.
- [DB-OPS-1] Pool connections; under PgBouncer transaction mode no session state (`SET`, `LISTEN`, session advisory locks, SQL `PREPARE`); `SET LOCAL` instead. Migrations over a direct connection.
- [DB-OPS-2] Sum of all pools stays under `max_connections`; start small and measure.
- [DB-OPS-3] App role owns nothing and has only DML grants; migrations run as the owner role.
- [DB-OPS-4] RLS: `FORCE ROW LEVEL SECURITY`; app role without `BYPASSRLS`, not the owner.
- [DB-OPS-5] Tune autovacuum per busy table; never disable it.
- [DB-OPS-6] WAL archiving + PITR (pgBackRest or PG17 incremental `pg_basebackup`); test restores.
- [DB-OPS-7] `pg_upgrade --check` first; afterwards `vacuumdb --analyze-in-stages --missing-stats-only`.
