# 2. Schema

Column types, keys, constraints and naming. Most type rules come from the PostgreSQL wiki's *Don't Do This* page, which is community-maintained rather than part of the official docs; where the manual says the same, the rule cites both.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## DB-SCHEMA-1 Store points in time as `timestamptz`. Not `timestamp`.

`timestamptz` stores an absolute moment (internally UTC) and converts to the session's time zone on output, so arithmetic and comparisons across zones are correct. Plain `timestamp` is just a date and clock reading: it silently drops any offset in the input, and nothing records whether a value meant UTC or local time. Writing `timestamp` alone means *without* time zone. For a future local event, such as a meeting at 09:00 in Amsterdam, also store the zone name, since offset rules can change before the date.

Official: PostgreSQL docs, *Date/Time Types*; wiki *Don't Do This*. Don't use `timetz` or `CURRENT_TIME` either.

```sql
-- bad
created_at timestamp NOT NULL DEFAULT now()

-- good
created_at timestamptz NOT NULL DEFAULT now()
```

## DB-SCHEMA-2 Use `text`, with a `CHECK` for real length limits. Not `varchar(n)` by default, and never `char(n)`.

In PostgreSQL `text`, `varchar` and `varchar(n)` store the same way and perform the same. A length limit is a business rule, and a `CHECK` constraint is easier to change: widening `varchar(n)` takes an `ACCESS EXCLUSIVE` lock. `char(n)` pads with spaces, which wastes space and breaks comparisons.

Official: PostgreSQL docs, *Character Types*; wiki *Don't Do This*. MySQL differs: there the declared `varchar` length affects row size and index limits, so keep lengths there.

```sql
-- bad
email varchar(255) NOT NULL,
country char(2)

-- good
email text NOT NULL CHECK (length(email) <= 320),
country text NOT NULL CHECK (country ~ '^[A-Z]{2}$')
```

## DB-SCHEMA-3 Store money as `numeric` (or integer minor units) with a currency column. Not `money` or floats.

The `money` type stores no currency, formats by the server's `lc_monetary` setting and has fixed precision. `real` and `double precision` cannot represent most decimal amounts exactly. `numeric(19,4)` or an integer number of cents is exact.

Official: wiki *Don't Do This*.

```sql
-- bad
price money,
total double precision

-- good
price_amount numeric(19,4) NOT NULL,
price_currency text NOT NULL CHECK (price_currency ~ '^[A-Z]{3}$')
```

## DB-SCHEMA-4 Generate integer keys with identity columns. Not `serial`.

`serial` is a non-standard shorthand: its sequence has separate permissions, and `CREATE TABLE ... LIKE` makes copies share it. `GENERATED ... AS IDENTITY` is the SQL-standard replacement. Use `bigint`, not `int`: running out of 32-bit IDs on a large table forces a painful migration.

Official: wiki *Don't Do This* ("For new applications, identity columns should be used instead"). Squawk flags both `serial` and `int` keys.

```sql
-- bad
id serial PRIMARY KEY

-- good
id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

## DB-SCHEMA-5 Default to `bigint` identity keys. Use UUIDv7 when IDs must be made outside the database. Never UUIDv4 as a primary key on a large table.

Use UUIDs when clients, other services or offline devices create IDs, or when IDs must be unguessable to enumerate. Random UUIDv4 values land all over the B-tree. In one benchmark that gave a primary-key index 26-27% larger, with frequent page splits, and inserting 50 million rows into an empty table took about 11 times as long. UUIDv7 starts with a timestamp, so it inserts in order like a sequence. PostgreSQL 18 generates it natively with `uuidv7()`. Its trade-off: anyone holding the ID can read when the row was created (`uuid_extract_timestamp()`).

Official: PostgreSQL 18 release notes (`uuidv7()`). The benchmark figures come from one secondary source (see the appendix). The choice between bigint and UUIDv7 is contested.

```sql
-- bad
id uuid PRIMARY KEY DEFAULT gen_random_uuid()

-- good
id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY
-- good: IDs created by clients or exposed in URLs
id uuid PRIMARY KEY DEFAULT uuidv7()
```

## DB-SCHEMA-6 Make columns `NOT NULL` unless "unknown" is a real state, and enforce rules with constraints.

A constraint holds for every writer: the app, a script, a migration, a support engineer in `psql`. Application validation only holds for the code that remembered to call it. `NOT NULL` plus `CHECK`, `UNIQUE` and foreign keys catch bad data at write time, when it is cheap to fix. `CHECK` can also relate columns to each other, such as `ends_at > starts_at`.

Convention, supported by the PostgreSQL docs on constraints and Crunchy Data. [GEN-ERR](../general/02-errors.md) covers validating at the boundary as well.

```sql
-- bad
status text,
ends_at timestamptz

-- good
status text NOT NULL CHECK (status IN ('pending', 'paid', 'shipped')),
starts_at timestamptz NOT NULL,
ends_at timestamptz NOT NULL CHECK (ends_at > starts_at)
```

## DB-SCHEMA-7 For a small set of states, use `text` with a `CHECK`. Use an enum only if values will never be removed. Use a lookup table when values carry their own data.

PostgreSQL enums are compact and easy to rename, but a value cannot be dropped. A `CHECK` list can be changed by replacing the constraint (NOT VALID, then VALIDATE; DB-MIG-3). A lookup table suits values that users manage or that carry attributes such as a label or sort order. Its cost is a join and worse row estimates.

Contested: Crunchy Data recommends trying `CHECK` first; Cybertec prefers enums when values never need removing. This guide defaults to `CHECK`.

```sql
-- bad: free text, anything goes
status text

-- good
status text NOT NULL CHECK (status IN ('draft', 'published', 'archived'))
```

## DB-SCHEMA-8 Use `jsonb` for data that really has no fixed shape. Move fields you filter or join on into real columns.

`jsonb` suits payloads you store and return whole, like webhook bodies or user settings. Fields buried in it get no type checks, no foreign keys and weak statistics. Large documents are TOASTed, and reading them is slow: in one test a filter took about 500 ms on 40 KB documents and under 10 ms on 40-byte ones. Extract hot fields into ordinary columns or `STORED` generated columns. A `VIRTUAL` one still has to read and decompress the whole document. Use `jsonb`, not `json`, unless you must keep the exact input text.

Official: PostgreSQL docs, *JSON Types*. The TOAST measurements come from one secondary source.

```sql
-- bad: every query digs into the document
SELECT * FROM orders WHERE (data->>'customer_id')::bigint = $1;

-- good
customer_id bigint NOT NULL REFERENCES customers (id),
data jsonb NOT NULL DEFAULT '{}'
```

## DB-SCHEMA-9 Decide how NULLs count in unique constraints, and say so with `NULLS NOT DISTINCT`.

By default a `UNIQUE` constraint treats NULLs as different from each other, so any number of rows can have NULL in a "unique" column. For multicolumn keys, `(1, NULL)` can then appear twice. Since PostgreSQL 15, `UNIQUE NULLS NOT DISTINCT` treats NULLs as equal. MySQL and SQLite also allow repeated NULLs and have no `NULLS NOT DISTINCT`; use a partial unique index there.

Official: PostgreSQL docs, *CREATE TABLE* and *Unique Indexes*.

```sql
-- bad: allows two rows with (42, NULL)
UNIQUE (account_id, external_ref)

-- good
UNIQUE NULLS NOT DISTINCT (account_id, external_ref)
```

## DB-SCHEMA-10 Always write `STORED` or `VIRTUAL` on generated columns.

PostgreSQL 18 added virtual generated columns, computed on read, and made them the default. On 17 and earlier, only `STORED` exists. The same DDL without a keyword therefore means different things on different versions. Virtual columns can't use user-defined functions or types, and only stored ones are logically replicated.

Official: PostgreSQL 18 docs, *Generated Columns*.

```sql
-- bad: virtual on 18, error or stored elsewhere
total numeric GENERATED ALWAYS AS (price * quantity)

-- good
total numeric GENERATED ALWAYS AS (price * quantity) STORED
```

## DB-SCHEMA-11 Name everything in lowercase `snake_case`. Use plural table names and `<table>_id` for foreign keys.

Unquoted identifiers fold to lowercase, so `CustomerId` only works if every query quotes it as `"CustomerId"`. Sticking to `a-z`, `0-9` and `_` means nothing ever needs quoting. Plural versus singular table names matter less than using one style throughout.

Official: wiki *Don't Do This* (no upper-case identifiers). Plural names and the `_id` suffix are convention.

```sql
-- bad
CREATE TABLE "OrderItem" ("OrderId" bigint, "Qty" int);

-- good
CREATE TABLE order_items (order_id bigint NOT NULL REFERENCES orders (id), quantity int NOT NULL);
```

## DB-SCHEMA-12 Prefer hard deletes, with an archive table if you need history. Use soft deletes only when undelete is a real feature.

A `deleted_at` column means every query must remember `deleted_at IS NULL`. Forgetting it once shows deleted data. Foreign keys stop protecting you, because "deleted" parents still exist. Retention pruning gets hard too. Brandur Leach reports that at Heroku and Stripe soft-deleted rows were almost never used to undelete anything. If you need history, copy the row into a `deleted_records` table (as `jsonb`) in the same transaction as the `DELETE`.

Contested; Brandur Leach, *Soft deletion probably isn't worth it*. If you do soft-delete, use partial indexes `WHERE deleted_at IS NULL` and a view for live rows.

```sql
-- bad: soft delete by default, filtered by convention
UPDATE users SET deleted_at = now() WHERE id = $1;

-- good
WITH gone AS (DELETE FROM users WHERE id = $1 RETURNING *)
INSERT INTO deleted_records (table_name, data) SELECT 'users', to_jsonb(gone) FROM gone;
```
