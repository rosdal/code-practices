# 10. Async & promises

How to handle promises so that rejections are never lost and independent work runs concurrently.

## TS-10.1 Never leave a promise floating: `await` it, return it, or handle it with `.catch`; mark deliberate fire-and-forget with `void`.

Floating promises lose rejections and break sequencing. typescript-eslint's `no-floating-promises` (in `recommendedTypeChecked`) enforces this.

```ts
// bad
saveAudit(event);
// good
await saveAudit(event);
void saveAudit(event).catch(reportError); // deliberate fire-and-forget
```

## TS-10.2 Do not pass async functions where a void-returning callback is expected (event handlers, `forEach`, `setTimeout`).

Errors become unhandled rejections; `no-misused-promises` catches this. See also TS-4.6.

```ts
// bad
items.forEach(async (i) => { await save(i); });
// good (order matters)
for (const i of items) await save(i);
// good (independent)
await Promise.all(items.map((i) => save(i)));
```

## TS-10.3 Do not use promises in conditions.

A promise object is always truthy, so the check never fails. `no-misused-promises` flags it.

```ts
// bad
if (isAllowed(user)) {}            // always truthy: isAllowed is async
// good
if (await isAllowed(user)) {}
```

## TS-10.4 Only `await` thenables (`await-thenable`), and do not mark functions `async` that never `await` (`require-await`) unless they must return a promise.

Awaiting a plain value suggests asynchrony that is not there, and a needless `async` turns synchronous throws into rejections.

```ts
// bad
const name = await user.name;
async function getName(user: User): Promise<string> { return user.name; }
// good
const name = user.name;
function getName(user: User): string { return user.name; }
```

## TS-10.5 Use `Promise.all` for independent work, `Promise.allSettled` when partial failure is acceptable, and never `await` in a loop for independent operations.

Sequential awaits add up every latency; concurrent ones cost only the slowest. ESLint's `no-await-in-loop` flags the loop form.

```ts
// bad
for (const id of ids) users.push(await fetchUser(id));
// good
const users = await Promise.all(ids.map((id) => fetchUser(id)));
const results = await Promise.allSettled(ids.map((id) => notify(id))); // some may fail
```

## TS-10.6 Pass an `AbortSignal` to cancellable async APIs and honor it.

Without a signal, work keeps running after the caller has given up: the user navigated away, the request timed out.

```ts
// bad
async function fetchUser(id: UserId): Promise<Response> {
  return fetch(`/api/users/${id}`);
}
// good
async function fetchUser(id: UserId, { signal }: { signal?: AbortSignal } = {}): Promise<Response> {
  signal?.throwIfAborted();
  return fetch(`/api/users/${id}`, { signal: signal ?? null });
}
```

## TS-10.7 Use `return await` inside `try` blocks (`return-await`: `in-try-catch`).

Without it, rejections bypass the local `catch`/`finally`.

```ts
// bad: a rejection skips the catch
try { return fetchUser(id); } catch (e) { report(e); return fallback; }
// good
try { return await fetchUser(id); } catch (e) { report(e); return fallback; }
```
