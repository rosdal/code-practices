# 5. Transactions

Keeping transactions short, isolation levels and retries, timeouts, job queues, and making writes safe to repeat.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## DB-TX-1 Keep transactions short. No network calls, file uploads or user think-time inside one.

An open transaction holds its row locks and stops VACUUM from removing rows that died after it started, so a slow transaction blocks other writers and bloats tables. A call to a payment API inside a transaction also can't be undone by `ROLLBACK`. Do the external work before or after the transaction, and record its outcome in a short one.

Official: PostgreSQL docs, `idle_in_transaction_session_timeout` (an open transaction "prevents vacuuming away recently-dead tuples"). Ordering external calls around transactions: Brandur Leach, *Implementing Stripe-like idempotency keys in Postgres*.

```ts
// bad
await db.transaction(async (tx) => {
  await tx.query('UPDATE orders SET status = $1 WHERE id = $2', ['paying', id]);
  await paymentApi.charge(order); // seconds of network inside the transaction
  await tx.query('UPDATE orders SET status = $1 WHERE id = $2', ['paid', id]);
});

// good
await db.query('UPDATE orders SET status = $1 WHERE id = $2', ['paying', id]);
const charge = await paymentApi.charge(order, { idempotencyKey: order.id });
await db.query('UPDATE orders SET status = $1, charge_id = $2 WHERE id = $3', ['paid', charge.id, id]);
```

## DB-TX-2 Under `REPEATABLE READ` or `SERIALIZABLE`, retry the whole transaction on `40001` and `40P01`.

Both levels abort a transaction rather than allow an anomaly, with SQLSTATE `40001` (serialization failure). PostgreSQL never retries for you. Re-run the complete transaction, including the code that decided what to write, because the data it read may have changed. Deadlocks (`40P01`) are worth retrying at any level. Bound the retries and add jitter, since under heavy contention a transaction can fail several times. The default level is Read Committed; raise it only for the transactions that need it.

Official: PostgreSQL 18 docs, *Serialization Failure Handling*.

```ts
declare function isPgError(err: unknown): err is { code: string };

// bad: retries one statement, or never retries
try { await tx.query(sql); } catch { await tx.query(sql); }

// good
for (let attempt = 1; ; attempt++) {
  try {
    return await db.transaction({ isolation: 'serializable' }, work);
  } catch (err) {
    const retryable = isPgError(err) && (err.code === '40001' || err.code === '40P01');
    if (!retryable || attempt === 5) throw err;
    await sleep(2 ** attempt * 10 + Math.random() * 10);
  }
}
```

## DB-TX-3 Set `statement_timeout` and `idle_in_transaction_session_timeout` per role. Not in `postgresql.conf`, and not left at 0.

All three timeouts default to 0, which means disabled: a runaway query or a forgotten open transaction can run for days. The docs advise against setting `statement_timeout` or `lock_timeout` globally, because that also hits maintenance, migrations and backups. Set them on the application role, and override per transaction with `SET LOCAL` for known slow jobs. `SET LOCAL` is also the form that works through a transaction-mode pooler (DB-OPS-1). Keep `lock_timeout` below `statement_timeout`, or it never fires first.

Official: PostgreSQL docs, *Client Connection Defaults*.

```sql
-- bad
-- postgresql.conf: statement_timeout = 0 (the default), nothing set anywhere

-- good
ALTER ROLE app SET statement_timeout = '5s';
ALTER ROLE app SET lock_timeout = '2s';
ALTER ROLE app SET idle_in_transaction_session_timeout = '30s';

BEGIN;
SET LOCAL statement_timeout = '5min';  -- one known-slow report
```

## DB-TX-4 Claim jobs from a table queue with `FOR UPDATE SKIP LOCKED` and `LIMIT`.

`SKIP LOCKED` lets many workers each grab different rows without waiting on each other. The docs say it gives an inconsistent view of the data, which is acceptable for a queue and nowhere else. Use `LIMIT`, not `OFFSET`, because rows skipped by `OFFSET` get locked too. In a CTE, the locking clause must be inside the `WITH` query. Pair it with a partial index on pending rows (DB-INDEX-3). Long transactions elsewhere slow these queues down, which is one more reason for DB-TX-1.

Official: PostgreSQL docs, *SELECT: The Locking Clause*.

```sql
-- bad: every worker blocks on the same first row
SELECT id FROM jobs WHERE status = 'pending' ORDER BY run_at LIMIT 1 FOR UPDATE;

-- good
WITH next AS (
  SELECT id FROM jobs
  WHERE status = 'pending' AND run_at <= now()
  ORDER BY run_at
  LIMIT 10
  FOR UPDATE SKIP LOCKED
)
UPDATE jobs SET status = 'running', started_at = now()
FROM next WHERE jobs.id = next.id
RETURNING jobs.id, jobs.payload;
```

## DB-TX-5 Publish events and jobs through an outbox table written in the same transaction. Not by calling the queue from inside or after the transaction.

Sending a job to Redis or a broker inside the transaction lets a fast worker pick it up before the data is committed, or after a rollback, when it can never succeed. Sending after commit loses the job if the process dies in between. Insert the message into an `outbox` table in the same transaction, and have a separate relay read committed rows, send them and then delete them. That gives at-least-once delivery, so consumers must be idempotent.

Brandur Leach, *Transactionally staged job drains in Postgres*. Convention (the transactional outbox pattern).

```ts
// bad
await db.transaction(async (tx) => {
  await tx.query('INSERT INTO orders ...');
  await queue.publish('order.created', { id }); // seen before commit, or never undone
});

// good
await db.transaction(async (tx) => {
  await tx.query('INSERT INTO orders ...');
  await tx.query('INSERT INTO outbox (topic, payload) VALUES ($1, $2)', ['order.created', { id }]);
});
```

## DB-TX-6 Make retried writes safe with an idempotency key under a unique constraint.

Clients, proxies and job runners retry after timeouts, and without protection a retry charges the card twice. Store the client's key with `UNIQUE (user_id, idempotency_key)`, so only one of several concurrent attempts can insert. The others find the stored result and return it. Keys are for short-term correctness: expire and delete them after a window, such as 24 hours.

Brandur Leach, *Implementing Stripe-like idempotency keys in Postgres*. Convention.

```sql
-- bad: dedupe by checking in application code first (racy)

-- good
CREATE TABLE idempotency_keys (
  user_id bigint NOT NULL REFERENCES users (id),
  idempotency_key text NOT NULL,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, idempotency_key)
);
```
