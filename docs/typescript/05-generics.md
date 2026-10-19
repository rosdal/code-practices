# 5. Generics

When to add a type parameter, how to constrain and name it, and how to steer inference.

## TS-5.1 Add a type parameter only when it relates two or more positions (inputs to outputs or inputs to each other).

A type parameter used once is just a disguised `any`/`unknown`; `no-unnecessary-type-parameters` flags it.

```ts
// bad
function log<T>(value: T): void {}
// good
function log(value: unknown): void {}
function first<T>(xs: readonly T[]): T | undefined { return xs[0]; }
```

## TS-5.2 Constrain type parameters with `extends` as narrowly as the body needs.

Without a constraint the body needs casts to do anything useful, and callers get no error for bad arguments.

```ts
// bad
function pluck<T>(obj: T, key: string): unknown { return (obj as Record<string, unknown>)[key]; }
// good
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }
```

## TS-5.3 Name single type parameters `T`; name multiple or domain-specific ones descriptively (`TInput`, `TKey`).

Google: type parameters are UpperCamelCase; single letters are fine when the meaning is obvious. Past one parameter, letters stop telling the reader which is which.

```ts
// bad
interface Cache<K, V, E> { get(key: K): V | E }
// good
interface Cache<TKey, TValue, TError> { get(key: TKey): TValue | TError }
```

## TS-5.4 Use `const` type parameters (TS 5.0+) instead of asking callers for `as const`.

Callers forget `as const`, and the literal types silently widen to `string[]`.

```ts
// bad
function route<T extends readonly string[]>(parts: T) {}
route(['users', 'id'] as const);
// good
function route<const T extends readonly string[]>(parts: T) {}
route(['users', 'id']); // T = readonly ['users', 'id']
```

## TS-5.5 Use `NoInfer<T>` (TS 5.4+) to stop a parameter from widening an inferred type.

Otherwise every argument contributes to inference, so a typo becomes a new valid member instead of an error.

```ts
// bad
function createFSM<S extends string>(states: S[], initial: S) {}
createFSM(['idle', 'run'], 'jump'); // compiles, S = 'idle' | 'run' | 'jump'
// good
function createFSM<S extends string>(states: S[], initial: NoInfer<S>) {}
createFSM(['idle', 'run'], 'jump'); // error, as intended
```

## TS-5.6 Do not pass explicit type arguments where inference works; do pass them when inference picks the wrong type.

`no-unnecessary-type-arguments` flags redundant ones. TS 6.0 notes that some generic calls "may need an explicit type argument" after its inference changes.

```ts
// bad
const tags = new Set<string>(['a', 'b']);
// good
const tags = new Set(['a', 'b']);   // inferred Set<string>
const seen = new Set<string>();     // nothing to infer from
```

## TS-5.7 Provide defaults for type parameters in public generic types.

Callers can then write `ApiResponse<User>` without spelling out parameters they do not care about.

```ts
// bad
type ApiResponse<TData, TError> = { ok: true; data: TData } | { ok: false; error: TError };
// good
type ApiResponse<TData = unknown, TError = Error> =
  | { ok: true; data: TData }
  | { ok: false; error: TError };
```
