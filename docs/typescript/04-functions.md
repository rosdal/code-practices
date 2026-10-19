# 4. Functions

How to shape function signatures, parameters, callbacks, and failure paths.

## TS-4.1 Use an options object once a function has more than two parameters or any boolean flag.

Positional booleans are unreadable at call sites and break on reordering.

```ts
// bad
createUser('a@b.c', true, false, 3);
// good
createUser({ email: 'a@b.c', admin: true, verified: false, retries: 3 });
```

## TS-4.2 Write user-defined type guards (`x is T`) or assertion functions (`asserts x is T`) for reusable narrowing.

Narrowing logic then lives in one tested place. Prefer TS 5.5+ inferred predicates for simple `filter` cases.

```ts
// bad: the same check copied into every caller
if (typeof v === 'object' && v !== null && 'id' in v && 'email' in v) save(v as User);
// good
function isUser(v: unknown): v is User { return UserSchema.safeParse(v).success; }
function assertUser(v: unknown): asserts v is User { UserSchema.parse(v); }
const defined = items.filter((x) => x !== undefined); // TS 5.5+ infers the predicate
```

## TS-4.3 Mark array and object parameters `readonly` when the function does not mutate them.

It documents purity and lets callers pass readonly data.

```ts
// bad
function sum(xs: number[]) {}
// good
function sum(xs: readonly number[]) {}
```

## TS-4.4 Type catch variables as `unknown` and narrow; return `Result` types for expected failures.

Anything can be thrown; expected failures (validation, not-found) belong in the return type. With `strict` (TS-1.1), catch variables are already `unknown`.

```ts
// bad
try { run(); } catch (e: any) { log(e.message); }
// good
try { run(); } catch (e) { log(e instanceof Error ? e.message : String(e)); }

// bad: callers cannot see that this fails
function parseAge(s: string): number { /* throws on bad input */ }
// good: Result from TS-2.9
function parseAge(s: string): Result<number> { /* returns { ok: false, error } on bad input */ }
```

## TS-4.5 Use function overloads only when the return type depends on the argument type in ways a union or generic cannot express; otherwise use a union parameter.

Overloads are hard to implement correctly: the body is only checked against the wider implementation signature, not against each overload. typescript-eslint's `unified-signatures` flags mergeable overloads.

```ts
// bad
function len(x: string): number;
function len(x: unknown[]): number;
function len(x: string | unknown[]): number { return x.length; }
// good
function len(x: string | readonly unknown[]): number { return x.length; }
```

## TS-4.6 Declare callback types with `void` returns when the return value is ignored.

`() => void` accepts functions that return values, which is the safe direction. Use `no-misused-promises` to catch async callbacks passed where `void` is expected, since their rejections go unhandled.

```ts
// bad
function onEach(items: readonly Item[], cb: (item: Item) => any) {}
items.forEach(async (item) => save(item)); // rejections are lost
// good
function onEach(items: readonly Item[], cb: (item: Item) => void) {}
await Promise.all(items.map((item) => save(item)));
```

## TS-4.7 Use function declarations for named top-level functions; arrow functions for callbacks.

Google's TS guide: "Prefer function declarations over arrow functions or function expressions when defining named functions." Declarations hoist and give clearer stack traces.

```ts
// bad
export const total = (items: readonly LineItem[]): number => items.reduce((s, i) => s + i.price, 0);
// good
export function total(items: readonly LineItem[]): number {
  return items.reduce((s, i) => s + i.price, 0);
}
```

## TS-4.8 Pass arrow wrappers, not bare references, as callbacks to functions with optional parameters.

`map` passes `(value, index, array)`, so a function with optional extra parameters silently receives the index and array.

```ts
// bad
['11', '5', '10'].map(parseInt); // [11, NaN, 2]
// good
['11', '5', '10'].map((s) => Number.parseInt(s, 10));
```
