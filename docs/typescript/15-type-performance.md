# 15. Type-level restraint & checker performance

How much type-level machinery to write, and how to keep the checker fast.

## TS-15.1 Write the simplest type that prevents the bug; type-level code must earn its complexity.

Every conditional or recursive type is code your team must maintain and the checker must evaluate.

```ts
// bad: a recursive route parser for an app with three routes
type Params<S> = S extends `${string}:${infer P}/${infer R}` ? P | Params<R>
  : S extends `${string}:${infer P}` ? P : never;
function link<R extends string>(route: R, params: Record<Params<R>, string>): string {}
// good
function userLink(id: UserId): string {}
```

## ~~TS-15.2~~ (removed)

Covered by [TS-2.9](02-types.md).

## ~~TS-15.3~~ (removed)

Covered by [TS-2.4](02-types.md).

## TS-15.4 Prefer base types over huge unions; avoid unions of hundreds of members in hot paths.

Union-to-union assignability is quadratic.

```ts
// bad
type IconName = 'add' | 'alarm' | 'archive' /* ... 900 more */;
// good: validate at the boundary, brand the result (TS-2.8)
type IconName = string & { readonly __brand: 'IconName' };
```

## TS-15.5 Bound recursive types (depth counters) and avoid recursion over arbitrary string lengths.

Unbounded recursion hits the instantiation limit ("Type instantiation is excessively deep") or slows every file that uses the type.

```ts
// bad
type Paths<T> = T extends object
  ? { [K in keyof T & string]: K | `${K}.${Paths<T[K]>}` }[keyof T & string]
  : never;
// good: stops at depth 5
type Paths<T, D extends unknown[] = []> = D['length'] extends 5 ? never : T extends object
  ? { [K in keyof T & string]: K | `${K}.${Paths<T[K], [...D, unknown]>}` }[keyof T & string]
  : never;
```

## TS-15.6 Diagnose slowness with `tsc --extendedDiagnostics` and `--generateTrace`; tune TS 7's `--checkers`/`--builders` in CI by core count.

Measure before changing types. Microsoft notes that varying `--checkers` "may surface order-dependent results" in rare cases, so pin it across environments.

```jsonc
// bad (package.json): checker count varies per machine
{ "scripts": { "typecheck": "tsc --noEmit --checkers $(nproc)" } }
// good: one pinned value everywhere, plus a script for diagnosis
{ "scripts": {
  "typecheck": "tsc --noEmit --checkers 4",
  "typecheck:trace": "tsc --noEmit --extendedDiagnostics --generateTrace trace"
} }
```
