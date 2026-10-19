# Appendix

Version status, outdated advice, sources and caveats behind the database rules. This page has no rule IDs.

Last reviewed 2026-10-19. Re-check when PostgreSQL 14 reaches end of life (12 November 2026) and when PostgreSQL 19 ships (planned 19 November 2026; RC2 on 12 November). Also re-check when a new PgBouncer minor changes defaults.

## Status (October 2026)

| Item | Status | Rules |
|---|---|---|
| PostgreSQL 18 | Newest GA (25 Sep 2025), 18.6; EOL 14 Nov 2030 | DB-SETUP-1 |
| PostgreSQL 19 | RC1 (15 Oct 2026); GA planned 19 Nov 2026. Adds `REPACK (CONCURRENTLY)`, parallel autovacuum, `ON CONFLICT DO SELECT` | DB-SETUP-1, DB-QUERY-5 |
| PostgreSQL 14 | EOL 12 Nov 2026 | DB-SETUP-1 |
| PG18 features used here | `uuidv7()`, virtual generated columns (default), `NOT NULL ... NOT VALID`, `BUFFERS` default in `EXPLAIN ANALYZE`, B-tree skip scan, statistics kept by `pg_upgrade`, MD5 deprecated, OAuth, data checksums on by default | DB-SCHEMA-5, -10, DB-MIG-3, DB-QUERY-7, DB-INDEX-2, DB-OPS-7, DB-SETUP-4 |
| PgBouncer | 1.26.1 (14 Oct 2026); prepared statements on by default since 1.24; 1.26 tracks all reported parameters | DB-OPS-1 |
| Squawk | 2.70.0 (15 Oct 2026) | DB-MIG-6 |

## Outdated advice

| Outdated | Instead |
|---|---|
| `serial` / `bigserial` | `bigint GENERATED ALWAYS AS IDENTITY` (DB-SCHEMA-4) |
| `varchar(255)` everywhere | `text` plus `CHECK` (DB-SCHEMA-2) |
| `timestamp` "because we store UTC" | `timestamptz` (DB-SCHEMA-1) |
| `money` type, floats for amounts | `numeric` plus currency (DB-SCHEMA-3) |
| UUIDv4 primary keys, or app-side UUIDv7 libraries on PG18 | `bigint` identity, or `uuidv7()` (DB-SCHEMA-5) |
| "PgBouncer transaction mode can't do prepared statements" | Protocol-level prepared statements work since 1.21, on by default since 1.24 (DB-OPS-1) |
| CHECK-then-`SET NOT NULL` dance on PG18 | `ADD CONSTRAINT ... NOT NULL col NOT VALID` + `VALIDATE` (DB-MIG-3) |
| "Adding a column with a default rewrites the table" | Only for volatile defaults since PG11 (DB-MIG-2) |
| `ON CONFLICT DO UPDATE SET col = col` to get existing IDs | PG19 `ON CONFLICT DO SELECT`; before that, a follow-up `SELECT` (DB-QUERY-5) |
| `EXPLAIN ANALYZE` without `BUFFERS` | `EXPLAIN (ANALYZE, BUFFERS)`; default on PG18 (DB-QUERY-7) |
| `md5` in `pg_hba.conf` | `scram-sha-256` (DB-SETUP-4) |
| Manual `ANALYZE` of everything after `pg_upgrade` on PG18 | `vacuumdb --analyze-in-stages --missing-stats-only` (DB-OPS-7) |
| SQLite or mocks as a test database | Real PostgreSQL (DB-TEST-1) |

## Sources

How each source was checked (two research runs, 2026-10-19):

- **Adversarially verified** (3 independent checks against the fetched text): postgresql.org *Versioning Policy*; PostgreSQL 19 RC1 announcement; PostgreSQL 18 release notes; docs *Generated Columns*, *Character Types*, *CREATE TABLE*, *Unique Indexes*, *Index Types*, *Index-Only Scans and Covering Indexes*, *BRIN*, *Client Connection Defaults*, *Row Security Policies*, *ALTER TABLE*, *CREATE INDEX*, *Serialization Failure Handling*; feature matrix *UNIQUE NULLS NOT DISTINCT*; PostgreSQL wiki *Don't Do This*; PgBouncer *Features*, *Configuration* and changelog; GitLab *Migration style guide*; Squawk rule docs; EDB (Álvaro Herrera), *Changes to NOT NULL in Postgres 18*; Neon *Connection pooling* (vendor; one Neon claim was refuted, so the session-feature list cites PgBouncer).
- **Quoted from the fetched page, not separately verified**: Crunchy Data on CHECK vs enum; Cybertec on enums vs lookup tables, keyset pagination, autovacuum tuning, `idle_in_transaction_session_timeout` and PG18 upgrade statistics; a UUIDv4 vs UUIDv7 benchmark (one author, naive single runs); a JSONB/TOAST benchmark; a GIN-on-JSONB article; pgsql-general thread on FK indexes; docs *pg_upgrade*, *SELECT* locking clause, *Date/Time Types*; pgBackRest user guide; OWASP *SQL Injection Prevention Cheat Sheet*; GoCardless on lock queues; Brandur Leach on soft deletes, idempotency keys and transactionally staged job drains; Use The Index, Luke on pagination; an article on `ON CONFLICT DO SELECT` and MERGE races; Testcontainers-based testing articles; depesz on the wiki list.
- **From general knowledge, not the research run**: `pg_stat_statements` setup (DB-SETUP-3); multicolumn column order (DB-INDEX-2); `pg_stat_user_indexes` query (DB-INDEX-6); N+1 and `SELECT *` (DB-QUERY-2, -3); `MERGE` in PG15 and `RETURNING` in PG17; fast column defaults in PG11; PG15 revoking `CREATE` on `public`; `pg_basebackup --incremental` in PG17; `ADD CONSTRAINT ... USING INDEX`; Rails/Django transaction opt-outs; strong_migrations; pool sizing (DB-OPS-2).

Refuted during research: Neon's list of session features unsupported in transaction mode (1-2), likely because it lists `LISTEN/NOTIFY` together. PgBouncer's own page says `NOTIFY` works and `LISTEN` does not. The first research run had no refuted claims.

SQL, YAML and `text` examples are not checked by `pnpm check`; the TypeScript examples are.

## Contested points and recommended stances

| Topic | Positions | Recommended stance |
|---|---|---|
| bigint vs UUIDv7 keys | bigint is smaller and simpler; UUIDv7 lets clients make IDs and hides counts, but leaks creation time | bigint by default; UUIDv7 when IDs are made outside the DB or exposed (DB-SCHEMA-5) |
| Enum vs CHECK vs lookup table | Crunchy: try CHECK first. Cybertec: enum if values are never removed | CHECK by default (DB-SCHEMA-7) |
| Soft deletes | Common in frameworks; Brandur: rarely worth it | Hard delete plus archive table (DB-SCHEMA-12) |
| Plural vs singular table names | Both widespread | Plural; consistency matters more (DB-SCHEMA-11) |
| Down migrations | Some teams require and run them | Keep for development; roll forward in production (DB-MIG-6) |
| ORM vs query builder vs raw SQL | All workable; ORMs hide N+1 and lock behaviour | Any, if the team can read the SQL it produces (DB-QUERY-2, -7) |
| Postgres as a job queue | `SKIP LOCKED` is enough for most loads; very busy queues suffer from long transactions | Table queue until it hurts; then drain into a dedicated queue via the outbox (DB-TX-4, -5) |

## Open questions

- Should new projects starting after 19 November 2026 begin on PostgreSQL 19 straight away?
- Is PostgreSQL 18's OAuth authentication ready to recommend for application connections (driver and pooler support)?
- What pool-sizing guidance is current and well sourced?
- How should `statement_timeout` be split between role defaults and `SET LOCAL` per transaction behind a transaction-mode pooler?
