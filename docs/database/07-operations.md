# 7. Operations

Connections and pooling, roles and row-level security, vacuum, backups and major upgrades.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## DB-OPS-1 Put a pooler in front of PostgreSQL. Under PgBouncer transaction mode, keep no session state.

Each PostgreSQL connection is a separate server process, so thousands of short-lived connections from serverless functions or many app instances overwhelm the server. In transaction mode, PgBouncer lends a server connection only for one transaction. Anything that lives in the session then breaks or leaks to another client: `SET`, `LISTEN`, `WITH HOLD` cursors, SQL-level `PREPARE`, temporary tables kept across transactions, and session advisory locks. Use `SET LOCAL`, `pg_advisory_xact_lock` and role-level settings instead. Protocol-level prepared statements, which most drivers use, have worked since PgBouncer 1.21 and are on by default since 1.24 (`max_prepared_statements = 200`). Run migrations, `pg_dump` and other admin work over a direct connection.

Official: PgBouncer *Features* and *Configuration* docs and changelog; Neon *Connection pooling* docs.

```sql
-- bad: through a transaction-mode pooler
SET search_path = tenant_42;
SELECT pg_advisory_lock(42);

-- good
BEGIN;
SET LOCAL search_path = tenant_42;
SELECT pg_advisory_xact_lock(42);
COMMIT;
```

## DB-OPS-2 Size pools so all of them together stay under `max_connections`.

Every app instance's pool adds up: 20 instances × a pool of 20 = 400 server connections. A pooler's client limit (Neon accepts 10,000) is not a concurrency limit; concurrent transactions are capped by the server-side pool. More active connections than CPU cores mostly adds contention. Start small (a handful of connections per instance), measure wait time for a connection, and keep headroom for migrations and admin sessions.

Convention. PgBouncer's `default_pool_size` is 20 per user/database pair. No primary source in this research gave a sizing formula.

```text
// bad
40 instances × pool 50 = 2,000 connections against max_connections = 200

// good
40 instances × pool 5 -> PgBouncer -> default_pool_size 40 server connections
```

## DB-OPS-3 Connect the app as a least-privilege role that owns nothing. Run migrations as a separate owner role.

OWASP: never give the application account admin rights, and rarely if ever create or drop rights. If the app's role owns the tables, a SQL injection can drop them, and row-level security doesn't apply to it. Grant the app role only `SELECT`/`INSERT`/`UPDATE`/`DELETE` on what it uses. Since PostgreSQL 15, ordinary users can no longer create objects in `public` by default; keep it that way.

Official: OWASP *SQL Injection Prevention Cheat Sheet* (least privilege); PostgreSQL docs, *Schemas: usage patterns*.

```sql
-- bad
-- app connects as postgres, or as the owner of every table

-- good
CREATE ROLE app_owner NOLOGIN;
CREATE ROLE migrator LOGIN IN ROLE app_owner;
CREATE ROLE app LOGIN;
GRANT USAGE ON SCHEMA app TO app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA app TO app;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app;
```

## DB-OPS-4 With row-level security, `FORCE` it, and connect as a role without `BYPASSRLS`.

RLS with no policy denies everything, which is a safe default. But superusers and `BYPASSRLS` roles always bypass it, and so does the table owner unless the table has `FORCE ROW LEVEL SECURITY`. An app that connects as the owner silently sees every tenant's rows. Integrity checks (unique and foreign keys) ignore RLS, so they can reveal that a row exists. Set the tenant per transaction with `SET LOCAL` (DB-OPS-1).

Official: PostgreSQL docs, *Row Security Policies*.

```sql
-- bad
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;  -- app connects as the owner

-- good
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
  USING (tenant_id = current_setting('app.tenant_id')::bigint);
```

## DB-OPS-5 Tune autovacuum per busy table. Never turn it off.

Every `UPDATE` and `DELETE` leaves a dead row behind. Autovacuum removes them and keeps the visibility map current, and index-only scans depend on that map. With the defaults, a large table waits for 20% of its rows to die before vacuum starts, and vacuum then runs throttled. For busy tables, lower `autovacuum_vacuum_scale_factor` and raise the cost limit, per table. Long-running or idle-in-transaction sessions stop vacuum from removing anything, whatever its settings (DB-TX-1, DB-TX-3).

Cybertec, *Tuning autovacuum for PostgreSQL*. Per-table settings are from the PostgreSQL docs, *Storage Parameters*.

```sql
-- bad
ALTER TABLE events SET (autovacuum_enabled = false);

-- good
ALTER TABLE events SET (autovacuum_vacuum_scale_factor = 0.01, autovacuum_vacuum_cost_limit = 2000);
```

## DB-OPS-6 Back up with continuous WAL archiving and point-in-time recovery, and test restores on a schedule.

A nightly `pg_dump` can lose up to a day of data, and it is slow to restore a large database from one. A base backup plus archived WAL can restore to any moment, such as just before a bad `DELETE`. pgBackRest does full, differential and incremental backups, with encryption, object storage and retention. PostgreSQL 17 added incremental base backups with `pg_basebackup --incremental` and `pg_combinebackup`. A backup you have never restored is not a backup.

Official: PostgreSQL docs, *Continuous Archiving and PITR*; pgBackRest user guide. Restore drills are convention.

```text
// bad
cron: pg_dump nightly to the same disk; never restored

// good
pgBackRest: weekly full, daily incremental, WAL archived continuously to object storage
monthly: restore to a scratch instance at a chosen timestamp and run checks
```

## DB-OPS-7 Do major upgrades with `pg_upgrade --check` first, then refresh statistics.

`pg_upgrade` upgrades from 9.2 or later straight to the current major, so you can skip versions. `--check` (with the transfer mode you'll use) reports problems without changing anything, even while the old server runs. Since PostgreSQL 18 most planner statistics carry over. Extended and cumulative statistics don't, so run `vacuumdb --all --analyze-in-stages --missing-stats-only`, then `vacuumdb --all --analyze-only`. Logical replication slots survive only when the old cluster is 17 or later; older ones are dropped without warning.

Official: PostgreSQL docs, *pg_upgrade*; Cybertec on PG18 statistics.

```text
// bad
pg_upgrade directly in production; no ANALYZE afterwards; queries plan badly for hours

// good
pg_upgrade --check --link ...    (on a copy first)
pg_upgrade --link ...
vacuumdb --all --analyze-in-stages --missing-stats-only
vacuumdb --all --analyze-only
```
