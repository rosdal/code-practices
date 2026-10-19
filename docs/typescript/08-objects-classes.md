# 8. Objects, interfaces & classes

When to reach for a class, how to declare its members, and how to shape plain objects.

## TS-8.1 Prefer plain objects + functions over classes for data; use classes for stateful services with identity or when a framework needs them.

Plain data serializes, spreads, and structurally types cleanly.

```ts
// bad
class Money {
  amount: number;
  currency: string;
  constructor(amount: number, currency: string) { this.amount = amount; this.currency = currency; }
}
JSON.parse(JSON.stringify(new Money(5, 'EUR'))) instanceof Money; // false
// good
interface Money { readonly amount: number; readonly currency: string }
function addMoney(a: Money, b: Money): Money { return { amount: a.amount + b.amount, currency: a.currency }; }
```

## TS-8.2 Do not use parameter properties (`constructor(private x: X)`); declare fields explicitly.

They are non-erasable (blocked by `erasableSyntaxOnly`, TS-1.6).

Contested: Google recommends them, but Google's guide predates type stripping.

```ts
// bad
class Repo { constructor(private readonly db: Db) {} }
// good
class Repo {
  readonly #db: Db;
  constructor(db: Db) { this.#db = db; }
}
```

## TS-8.3 Use `#private` for real runtime privacy; use `private` only when tests must reach the field.

`private` is erased and reachable via `obj['x']`; `#x` is enforced by the engine. Google bans `#private` because of down-leveling cost, which is irrelevant at ES2022+ targets (TS-1.11).

```ts
// bad
class Session { private token = ''; }
session['token']; // compiles
// good
class Session { #token = ''; }
session.#token; // syntax error outside the class
```

## TS-8.4 Mark fields that are never reassigned `readonly`.

It documents intent and turns an accidental reassignment into a compile error. `@typescript-eslint/prefer-readonly` flags private fields that could be `readonly`.

```ts
// bad
class Client { #baseUrl: string; constructor(url: string) { this.#baseUrl = url; } }
// good
class Client { readonly #baseUrl: string; constructor(url: string) { this.#baseUrl = url; } }
```

## TS-8.5 Omit the `public` modifier (it is the default).

Google: "Never use the `public` modifier except when declaring non-readonly public parameter properties." This guide bans parameter properties (TS-8.2), so the exception never applies. Enforce with `explicit-member-accessibility` set to `no-public`.

```ts
// bad
class Timer { public start(): void {} }
// good
class Timer { start(): void {} }
```

## TS-8.6 Initialize fields at declaration; never add or delete properties after construction.

This keeps object shapes stable for the type checker and the JS engine.

```ts
// bad
const user: Partial<User> = {};
user.name = 'Ada';
delete user.email;
// good
const user: User = { name: 'Ada', email: 'ada@example.com' };
const { email, ...withoutEmail } = user; // new object instead of delete
```

## TS-8.7 Use `Record<K, V>` or `Map` for dictionaries; avoid ad-hoc index signatures on domain types.

An index signature on a domain type accepts any key, so typos in real property names compile.

```ts
// bad
interface User { name: string; [key: string]: unknown }
// good
interface User { name: string; metadata: Record<string, unknown> }
```

## TS-8.8 Do not create container classes of static members for namespacing; export functions from a module.

Google: "Do not create container classes with static methods or properties for the sake of namespacing." The module already is the namespace, and unused functions tree-shake.

```ts
// bad
export class StringUtils { static slugify(s: string): string {} }
// good
export function slugify(s: string): string {}
```

## TS-8.9 Implement interfaces explicitly (`implements`) for classes that fulfill a contract.

Errors then appear at the class, not at distant call sites.

```ts
// bad: a missing method only surfaces where the instance is passed as a Logger
class ConsoleLogger { info(msg: string): void {} }
// good
class ConsoleLogger implements Logger { info(msg: string): void {} }
```
