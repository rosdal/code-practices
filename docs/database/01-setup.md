# 1. Setup

Which PostgreSQL version to run, how to stay patched, and which server features to turn on from day one. PostgreSQL is the reference engine for this guide; MySQL and SQLite differences are noted only where they change a rule.

Each rule says whether it is official guidance (postgresql.org docs, release notes, the PostgreSQL wiki) or convention. Sources are in the [appendix](appendix.md#sources).

## DB-SETUP-1 Run a supported PostgreSQL major. New projects: 18. Minimum: 15.

Each major is supported for five years, then gets no more fixes. A new major ships about once a year. Version 14 reaches end of life on 12 November 2026, so starting on it means upgrading within weeks. PostgreSQL 19 is at RC1 with general availability planned for 19 November 2026. Start on 18 and plan the move to 19 after its first minor releases.

Official: postgresql.org *Versioning Policy* (checked 2026-10-19):

| Major | Latest minor | Released | End of life |
|---|---|---|---|
| 18 | 18.6 | 25 Sep 2025 | 14 Nov 2030 |
| 17 | 17.11 | | 8 Nov 2029 |
| 16 | 16.15 | | 9 Nov 2028 |
| 15 | 15.19 | | 11 Nov 2027 |
| 14 | 14.24 | 30 Sep 2021 | 12 Nov 2026 |
| 13 | | | ended 13 Nov 2025 |

```yaml
# bad
image: postgres:latest   # changes major under you
image: postgres:14

# good
image: postgres:18.6
```

## DB-SETUP-2 Apply minor releases as they ship.

Minor releases contain only bug and security fixes, ship at least every three months, and need no dump or `pg_upgrade`: install the binaries and restart. The project recommends always running the current minor of your major. Managed services usually do this in a maintenance window; check that it's enabled.

Official: postgresql.org *Versioning Policy*.

```text
// bad
18.0 in production a year after 18.6 shipped

// good
minor updates applied within weeks; auto-minor-upgrade on for managed instances
```

## DB-SETUP-3 Enable `pg_stat_statements` before you need it.

It records execution counts, total and mean time and buffer use per normalised query, so you can see which queries cost the most overall. That is usually not the slowest single query. It has to be loaded at server start, so turning it on during an incident means a restart. Most managed services preload it.

Official: PostgreSQL docs, *pg_stat_statements*.

```sql
-- postgresql.conf: shared_preload_libraries = 'pg_stat_statements'
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- good: top queries by total time
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

## DB-SETUP-4 Authenticate with SCRAM over TLS. Not MD5, and never `trust` over the network.

PostgreSQL 18 deprecates MD5 password authentication and will remove it in a future major. `trust` lets anyone who can reach the port connect as any user. Store passwords as SCRAM-SHA-256 and require TLS for connections from other hosts. PostgreSQL 18 also adds OAuth authentication; it is new, so check your drivers and poolers support it before relying on it.

Official: PostgreSQL 18 release notes; PostgreSQL wiki *Don't Do This* ("Don't use trust authentication over TCP/IP").

```text
// bad (pg_hba.conf)
host    all  all  0.0.0.0/0  trust
host    all  all  0.0.0.0/0  md5

// good
hostssl all  all  10.0.0.0/8  scram-sha-256
password_encryption = scram-sha-256
```
