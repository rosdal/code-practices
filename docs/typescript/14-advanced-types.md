# 14. Utility & advanced types

How to derive types from other types, and how far to take mapped, conditional, and template-literal types.

## TS-14.1 Prefer built-in utilities (`Partial`, `Required`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `Awaited`, `NonNullable`) over hand-rolled equivalents.

Every TypeScript reader already knows them, and they handle edge cases (optional modifiers, `readonly`, unions) that hand-rolled versions often miss.

```ts
// bad
type MaybeUser = { [K in keyof User]?: User[K] };
type Unwrap<T> = T extends Promise<infer U> ? U : T;
// good
type MaybeUser = Partial<User>;
type Unwrap<T> = Awaited<T>;
```

## TS-14.2 Derive types from a single source of truth (schemas, `as const` data, function signatures) instead of duplicating them.

A duplicated type drifts from its source the first time only one of them changes. See TS-2.2 for schemas and TS-2.12 for `as const` data.

```ts
// bad
const Settings = z.object({ theme: z.enum(['dark', 'light']) });
interface Settings { theme: 'dark' | 'light' }  // must be kept in sync by hand
// good
const Settings = z.object({ theme: z.enum(['dark', 'light']) });
type Settings = z.infer<typeof Settings>;
type CreateUserInput = Parameters<typeof createUser>[0];
```

## TS-14.3 Use mapped types with `as` key remapping for systematic transformations.

One mapped type follows the source type automatically; a hand-written list has to be updated for every new key.

```ts
// bad
interface UserGetters { getName: () => string; getEmail: () => string }
// good
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type UserGetters = Getters<User>;
```

## TS-14.4 Use conditional types with `infer` sparingly and name them; distribute over unions deliberately (wrap in `[T]` to prevent distribution).

A named conditional type can be tested and reused; an inline one makes the signature unreadable. Accidental distribution over a union gives surprising results.

```ts
// bad
function head<T>(xs: T): T extends readonly (infer U)[] ? U | undefined : never {}
// good
type ElementOf<T> = T extends readonly (infer U)[] ? U : never;
type IsString<T> = [T] extends [string] ? true : false; // non-distributive
```

## TS-14.5 Use template-literal types for string protocols (event names, routes, CSS vars).

The compiler then checks the format, not just "some string" (TS-2.11). TS 7 treats Unicode code points as single units in template-literal inference.

```ts
// bad
function on(event: string, handler: () => void) {}
// good
type EventName = `${'user' | 'order'}:${'created' | 'deleted'}`;
function on(event: EventName, handler: () => void) {}
```

## TS-14.6 Prefer `Omit` on interfaces for derived shapes, but avoid deep chains of `Omit`/`Pick`/`&`; declare a named interface instead.

Long chains produce unreadable hover types and error messages; a named interface gives one stable name to read and extend (TS-2.9).

```ts
// bad
type AdminView = Omit<Pick<User, 'id' | 'name' | 'role'> & Permissions, 'role'> & { lastLogin: Date };
// good
interface AdminView extends Pick<User, 'id' | 'name'>, Permissions { lastLogin: Date }
```
