# 8. Testing

Testing code that talks to a database. General testing rules are in [GEN-TEST](../general/03-testing.md).

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## DB-TEST-1 Test queries against the same PostgreSQL major as production. Not mocks, and not SQLite.

A mock can show that your code called `query()`. It can't show that the SQL parses, that a constraint fires or that `ON CONFLICT` hits the index you meant. SQLite behaves differently in exactly the places that matter: types, `NULL` handling in unique constraints, locking and transactional DDL. Run tests against a real PostgreSQL, such as Testcontainers or a CI service container, pinned to production's version. Use the dynamically mapped port, not a hard-coded 5432.

Convention, widely held; see the appendix for sources.

```yaml
# bad
DATABASE_URL: sqlite::memory:

# good
services:
  postgres:
    image: postgres:18.6
```

## DB-TEST-2 Build the test schema by running your real migrations.

A hand-written `CREATE TABLE` in the test setup drifts from production, and hides broken migrations, wrong ordering and SQL the target version doesn't support. Apply the migrations once per test run or container, then load fixtures.

Convention.

```ts
// bad
await db.query('CREATE TABLE users (id serial, email text)');

// good
await migrate(db, { directory: 'migrations' });
```

## DB-TEST-3 Isolate tests with a rolled-back transaction where you can, and a fresh database where you can't.

Wrapping each test in a transaction that is rolled back afterwards is the fastest way to reset. It breaks when the code under test commits on purpose, opens a second connection (pools, background workers), or uses advisory locks. For those tests, `TRUNCATE ... RESTART IDENTITY CASCADE` before each test, or create each test's database from a template, which is fast. Nothing may be connected to the template while you copy it. Reusing containers across unrelated runs weakens the clean-state assumption, so don't do it in CI.

Convention.

```sql
-- per test, when code commits or uses several connections
TRUNCATE users, orders RESTART IDENTITY CASCADE;

-- or: one migrated template, copied per test
CREATE DATABASE test_17 TEMPLATE app_template;
```
