# 2. Types

How to write types, and how to handle the places where the type checker has to be overruled.

## TS-2.1 Use `unknown`, never `any`, for values of unknown shape.

`unknown` forces narrowing before use; `any` disables checking for everything it touches and spreads silently.

```ts
// bad
function parse(json: string): any { return JSON.parse(json); }
// good
function parse(json: string): unknown { return JSON.parse(json); }
```

## TS-2.2 Validate every runtime boundary with a schema (Zod, Valibot, ArkType) and derive the type from it.

HTTP bodies, env vars, `localStorage`, queue messages, and third-party responses are untyped at runtime; a cast is a lie. That includes a type annotation on `req.body`: the client decides what is really in it.

```ts
// bad
const user = (await res.json()) as User;
// good
const User = z.object({ id: z.uuid(), email: z.email() });
type User = z.infer<typeof User>;
const user = User.parse(await res.json());
```

## TS-2.3 Use `satisfies` to check a value against a type without widening it; avoid `as`.

`as` overrides the checker; `satisfies` checks while preserving the inferred type.

```ts
// bad
const routes = { home: '/', user: '/u/:id' } as Record<string, string>;
routes.nope; // compiles, undefined at runtime
// good
const routes = { home: '/', user: '/u/:id' } as const satisfies Record<string, string>;
routes.user; // type is still '/u/:id'
routes.nope; // error
```

## TS-2.4 Let inference work for locals; annotate exported function signatures and public APIs.

Annotations at module boundaries are documentation, catch errors at the definition instead of the call site, and are required by `isolatedDeclarations`. A named return type is also cheaper for the checker to emit and compare than a large inferred one (TS wiki: "Using Type Annotations").

```ts
// bad
const count: number = 0;
export function total(items) { return items.reduce((s, i) => s + i.price, 0); }
// good
const count = 0;
export function total(items: readonly LineItem[]): number {
  return items.reduce((s, i) => s + i.price, 0);
}
```

## TS-2.5 Model variants as discriminated unions with a literal `kind`/`type` tag.

Unions make illegal states unrepresentable; bags of optionals do not.

```ts
// bad
interface Req { status: string; data?: User; error?: Error }
// good
type Req =
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };
```

## TS-2.6 Make switches over unions exhaustive with a `never` check.

Adding a variant then breaks compilation at every unhandled site.

```ts
// bad: a new 'cancelled' status falls through to undefined, silently
switch (req.status) {
  case 'loading': return spinner();
  case 'success': return view(req.data);
  case 'error': return fail(req.error);
}
// good
function assertNever(x: never): never { throw new Error(`Unhandled: ${JSON.stringify(x)}`); }
switch (req.status) {
  case 'loading': return spinner();
  case 'success': return view(req.data);
  case 'error': return fail(req.error);
  default: return assertNever(req);
}
```

## TS-2.7 Do not use `enum` or `const enum`; use `as const` objects or string-literal unions.

Enums emit runtime code (non-erasable, see TS-1.6), numeric enums accept any number, and `const enum` breaks under isolated transpilation. Google's style guide also bans `const enum`.

```ts
// bad
enum Status { Active = 'active', Banned = 'banned' }
// good
type Status = 'active' | 'banned';
// good (when you need runtime values)
export const Status = { Active: 'active', Banned: 'banned' } as const;
export type Status = (typeof Status)[keyof typeof Status];
```

## TS-2.8 Brand primitive IDs and validated values that must not be mixed.

Structural typing treats every string alike; a brand makes `UserId` and `OrderId` incompatible at zero runtime cost.

```ts
// bad
function getOrder(id: string) {}
getOrder(user.id); // compiles
// good
type OrderId = string & { readonly __brand: 'OrderId' };
function getOrder(id: OrderId) {}
getOrder(user.id); // error: UserId is not OrderId
```

## TS-2.9 Use `interface` for object shapes you extend; use `type` for unions, tuples, functions, and mapped/conditional types.

Interfaces give flat, cached relationships and better error display (TS wiki: "Preferring Interfaces Over Intersections"); `type` is the only option for everything else. Enforce one style with `consistent-type-definitions`.

```ts
// bad
type Admin = User & { permissions: string[] };
// good
interface Admin extends User { permissions: string[] }
type Result<TValue, TError = Error> = { ok: true; value: TValue } | { ok: false; error: TError };
```

## TS-2.10 Never use the wrapper types `String`, `Number`, `Boolean`, `Object`, or `{}`/`Function` as types.

They accept far more than intended (`{}` accepts any non-nullish value); typescript-eslint's `no-wrapper-object-types`, `no-empty-object-type`, and `no-unsafe-function-type` enforce this.

```ts
// bad
function log(x: Object, cb: Function) {}
// good
function log(x: Record<string, unknown>, cb: (msg: string) => void) {}
```

## TS-2.11 Prefer literal and template-literal types over plain `string` when the domain is finite.

The compiler then rejects typos and invalid values at the call site instead of at runtime.

```ts
// bad
function setSize(size: string) {}
// good
type Size = 'sm' | 'md' | 'lg';
function setSize(size: Size) {}
type CssVar = `--${string}`;
```

## TS-2.12 Use `as const` on literal configuration and lookup tables.

It preserves literal types and readonly-ness so you can derive unions from data.

```ts
// bad
const LEVELS = ['debug', 'info', 'warn'];        // string[]
// good
const LEVELS = ['debug', 'info', 'warn'] as const;
type Level = (typeof LEVELS)[number];            // 'debug' | 'info' | 'warn'
```

## TS-2.13 Avoid double assertions (`as unknown as T`) outside test fixtures and typed adapters.

They are an explicit opt-out of type safety; isolate them behind a validated function (TS-2.2).

```ts
// bad
const cfg = raw as unknown as Config;
// good
const cfg = ConfigSchema.parse(raw);
```

## TS-2.14 Use `// @ts-expect-error` with a reason, never `// @ts-ignore` or `// @ts-nocheck`.

`@ts-expect-error` fails when the error disappears, so suppressions cannot rot; `ban-ts-comment` enforces a description. Formerly TS-1.12.

```ts
// bad
// @ts-ignore
legacy.call(x);
// good
// @ts-expect-error -- legacy SDK types omit the 2nd overload (tracked in #412)
legacy.call(x);
```
