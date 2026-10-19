# 9. Arrays, tuples & collections

How to type arrays and tuples, when to use `Map` and `Set`, and how to read and transform collections safely.

## TS-9.1 Use `T[]` for simple element types and `Array<T>`/`ReadonlyArray<T>` for complex ones, or pick one style and enforce it.

typescript-eslint's `array-type` with `array-simple` enforces this split. `string | number[]` reads ambiguously; `Array<string | number>` does not.

```ts
// bad
let ids: Array<string>;
let values: (string | number)[];
// good
let ids: string[];
let values: Array<string | number>;
```

## TS-9.2 Use `readonly T[]` for inputs and for data that must not change.

Mutation then becomes a compile error instead of a shared-state bug. See TS-4.3 for parameters.

```ts
// bad
export const DEFAULT_TAGS: string[] = ['new', 'sale'];
DEFAULT_TAGS.push('oops'); // every importer now sees 'oops'
// good
export const DEFAULT_TAGS: readonly string[] = ['new', 'sale'];
```

## TS-9.3 Use named tuple members, and use tuples only for short fixed-length positional data.

Names show up in editor hints and error messages; past two or three positions, nobody remembers which is which.

```ts
// bad
type Range = [number, number];
// good
type Range = [start: number, end: number];
// better once it grows or leaves a local scope
interface Range { start: number; end: number }
```

## TS-9.4 Use `Map`/`Set` for dynamic keys and membership; plain objects for fixed shapes.

`Map` has no prototype-key hazards and typed `.get()` returns `V | undefined`. TS 6.0 adds types for `Map.prototype.getOrInsert`/`getOrInsertComputed` (`esnext` lib).

```ts
// bad
const seen: Record<string, boolean> = {};
seen['constructor']; // a function from the prototype, not undefined
// good
const seen = new Set<string>();
seen.has('constructor'); // false
```

## TS-9.5 Narrow array access with `noUncheckedIndexedAccess`, `.at()`, or destructuring with defaults rather than `!`.

The index may be out of range at runtime; `!` hides that (TS-3.2), the alternatives make you handle it (TS-1.2).

```ts
// bad
const last = items[items.length - 1]!;
// good
const last = items.at(-1);               // T | undefined
const [first = fallback] = items;
```

## TS-9.6 Use type predicates or `flatMap` to filter nullable arrays, not `as`.

`filter(Boolean)` does not narrow, so the cast hides any mistake. Since TS 5.5 a plain `x != null` callback infers the predicate (TS-4.2).

```ts
// bad
const ids = maybe.filter(Boolean) as string[];
// good
const ids = maybe.filter((x) => x != null);          // string[], TS 5.5+
const ids = maybe.filter((x): x is string => x != null);
const ids = maybe.flatMap((x) => x ?? []);
```

## TS-9.7 Prefer the non-mutating array methods `toSorted`, `toReversed`, `toSpliced`, and `with` (ES2023) on shared arrays.

`sort`, `reverse`, and `splice` change the array in place, which breaks every other holder of the reference, including React state.

```ts
// bad
const ranked = users.sort(byScore); // users is now sorted too
// good
const ranked = users.toSorted(byScore);
```
