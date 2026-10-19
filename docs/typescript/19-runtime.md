# 19. Runtime vs compile-time

What survives to runtime, how TypeScript code is actually executed, and what that means for checks and config.

## TS-19.1 Remember that types are erased: never use types for runtime decisions; use values (tags, schemas, `instanceof`).

Interfaces, type aliases, and generics do not exist when the code runs, so a decision has to rest on something that does.

```ts
// bad: Admin is an interface; there is nothing to check at runtime
if (user instanceof Admin) grant();
function parse<T>(json: string): T { return JSON.parse(json); } // T checks nothing
// good
if (user.role === 'admin') grant();
const admin = AdminSchema.parse(JSON.parse(json));
```

## ~~TS-19.2~~ (removed)

Covered by [TS-1.6](01-config.md).

## ~~TS-19.3~~ (removed)

Covered by [TS-6.7](06-modules-tooling.md).

## ~~TS-19.4~~ (removed)

Covered by [TS-1.8](01-config.md).

## TS-19.5 Validate environment variables once at startup into a typed, frozen config object.

A missing or malformed variable then fails the boot with a clear message, instead of surfacing as `undefined` deep in a request. This applies TS-2.2 to `process.env`.

```ts
// bad: scattered, unvalidated, string | undefined
const port = Number(process.env.PORT);
// good (env.ts)
const EnvSchema = z.object({ PORT: z.coerce.number().int(), DATABASE_URL: z.url() });
export const env = Object.freeze(EnvSchema.parse(process.env));
```
