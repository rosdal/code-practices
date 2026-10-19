# 3. Null & optional

How to represent, check, and default values that may be absent.

## TS-3.1 Use `?.` and `??` instead of `&&` chains and `||` defaults.

`||` treats `0`, `''`, and `false` as missing; `&&` chains repeat every step of the path.

```ts
// bad
const port = config.port || 3000;
const city = user && user.address && user.address.city;
// good
const port = config.port ?? 3000;
const city = user?.address?.city;
```

## TS-3.2 Do not use the non-null assertion `!`.

It is an unchecked claim; narrow, throw, or restructure instead. `@typescript-eslint/no-non-null-assertion` enforces this.

```ts
// bad
const el = document.getElementById('app')!;
// good
const el = document.getElementById('app');
if (!el) throw new Error('#app not found');
```

## TS-3.3 Prefer `undefined` over `null` in your own APIs; accept both at boundaries.

Optional properties and parameters already produce `undefined`; using one "absent" value removes a whole class of checks.

Contested: some teams use `null` for "explicitly empty" in JSON and database layers. Whichever you choose, be consistent per layer.

```ts
// bad
function find(id: string): User | null | undefined {}
// good
function find(id: string): User | undefined {}
```

## TS-3.4 Narrow with `!= null` (or explicit checks) rather than truthiness for numbers and strings.

A truthiness check drops `0` and `''`, which are often valid values. `strict-boolean-expressions` flags `if (count)` for this reason.

```ts
// bad: skips an age of 0
if (user.age) render(user.age);
// good
if (user.age !== undefined) render(user.age);
```
