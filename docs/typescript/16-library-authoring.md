# 16. Declaration files & library authoring

How to publish a TypeScript package whose types work for every consumer, and how to extend types you do not own.

## TS-16.1 Enable `isolatedDeclarations` (TS 5.5+) for publishable packages.

It "require[s] sufficient annotation on exports so other tools can trivially generate declaration files", which enables parallel `.d.ts` emit (and TS 7's faster project-reference builds). See also TS-2.4.

```ts
// bad (error under isolatedDeclarations)
export function makeClient(url: string) { return new Client(url); }
// good
export function makeClient(url: string): Client { return new Client(url); }
```

## TS-16.2 Ship `.d.ts`, `declarationMap`, and an `exports` map with `types` conditions; validate with `@arethetypeswrong/cli` and `publint`.

Without a `types` condition, consumers on `nodenext` or `bundler` resolution (TS-1.7) get no types or the wrong ones. `types` must come first in each condition block. `declarationMap` makes go-to-definition land in your source, not the `.d.ts`.

```jsonc
// bad (package.json): top-level fields only, ignored once "exports" exists
{ "main": "./dist/index.js", "types": "./dist/index.d.ts" }
// good
{ "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } } }
```

## TS-16.3 Do not publish raw `.ts` as the only entry point.

Node refuses to strip types inside `node_modules`; ship compiled JS + `.d.ts`.

```jsonc
// bad (package.json)
{ "exports": { ".": "./src/index.ts" } }
// good
{ "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } } }
```

## TS-16.4 Export every type that appears in a public signature.

Otherwise consumers cannot name it, and declaration emit may fail.

```ts
// bad: callers cannot write a variable of type ClientOptions
interface ClientOptions { baseUrl: string }
export function makeClient(options: ClientOptions): Client {}
// good
export interface ClientOptions { baseUrl: string }
export function makeClient(options: ClientOptions): Client {}
```

## TS-16.5 Prefer ESM-only packages for new libraries targeting Node >= 20.19 / 22.12 (where `require(esm)` works); dual-publish only if consumers need CJS.

Since those versions CJS callers can `require()` an ESM package, so a second CJS build only adds the dual-package hazard (two copies of module state) and doubles what you test.

```jsonc
// bad (package.json): dual build by default
{ "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" } } }
// good
{
  "type": "module",
  "engines": { "node": ">=20.19" },
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }
}
```

## TS-16.6 Use module augmentation (`declare module 'x' { interface ... }`) for extending third-party types; never edit `node_modules` types.

Edits in `node_modules` vanish on the next install; an augmentation lives in your repo and merges with the library's own declarations.

```ts
// bad: hand-edited node_modules/@types/express-serve-static-core/index.d.ts

// good (src/types/express.d.ts)
declare module 'express-serve-static-core' {
  interface Request { user?: User }
}
```

## TS-16.7 Write ambient declarations in `.d.ts` files only, never mixed into implementation files; avoid `declare global` except for genuine globals.

Ambient declarations in implementation files are easy to miss and get pulled in by accident; a global is visible in every file of the program.

```ts
// bad (src/app.ts)
declare global { var currentUser: User }
// good (src/types/env.d.ts), for a value the runtime really injects
export {};
declare global { interface Window { __APP_VERSION__: string } }
```
