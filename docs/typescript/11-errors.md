# 11. Error handling

What to throw, what to return instead, and how to keep errors traceable.

## TS-11.1 Throw only `Error` instances (or subclasses).

Non-Errors have no stack. typescript-eslint's `only-throw-error` (in `recommendedTypeChecked`) enforces this; Google: "Only throw errors".

```ts
// bad
throw 'not found';
// good
throw new NotFoundError(`User ${id} not found`);
```

## TS-11.2 Define domain error classes with a literal `name`/`code` discriminant.

Callers can then branch on `error.code` with narrowing, instead of comparing message strings.

```ts
// bad
throw new Error('NOT_FOUND');
if (e instanceof Error && e.message === 'NOT_FOUND') {}
// good
export class NotFoundError extends Error {
  override readonly name = 'NotFoundError';
  readonly code = 'NOT_FOUND';
}
```

## TS-11.3 Preserve causes with `new Error(msg, { cause })` when wrapping.

The original stack and message stay attached, so logs show the root failure, not just the wrapper.

```ts
// bad
try { loadConfig(); } catch { throw new Error('Failed to load config'); }
// good
try { loadConfig(); } catch (e) { throw new Error('Failed to load config', { cause: e }); }
```

## TS-11.4 Return a `Result`/discriminated union for expected, recoverable failures; throw for bugs and truly exceptional conditions.

The return type then tells callers which failures to handle (TS-4.4).

Contested: Google prefers exceptions over "returning an object with an error property". Recommended stance: `Result` at domain/service boundaries where callers must branch, exceptions elsewhere.

```ts
type Result<TValue, TError = Error> =
  | { ok: true; value: TValue }
  | { ok: false; error: TError };

// bad: an invalid coupon is expected, not exceptional
function applyCoupon(code: string): Cart { throw new InvalidCouponError(code); }
// good
function applyCoupon(code: string): Result<Cart, InvalidCouponError> {}
```

## TS-11.5 In `.catch` callbacks, type the parameter as `unknown`.

Like a `catch` clause (TS-4.4), a rejection can carry any value; the default `any` hides that. `use-unknown-in-catch-callback-variable` enforces it.

```ts
// bad
fetchUser(id).catch((e) => log(e.message));
// good
fetchUser(id).catch((e: unknown) => log(e instanceof Error ? e.message : String(e)));
```

## TS-11.6 Never swallow errors silently; log with context or rethrow.

An empty `catch` turns a failure into wrong behavior with no trace of why.

```ts
// bad
try { await sync(); } catch {}
// good
try { await sync(); } catch (e) { logger.error({ err: e, userId }, 'sync failed'); }
```
