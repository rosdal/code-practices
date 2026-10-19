# 1. Compiler configuration

Which `tsconfig.json` options to set, and why. A complete config that combines them is at the end.

## TS-1.1 Enable `strict`, and set it explicitly.

Strict mode turns on `strictNullChecks`, `noImplicitAny`, `useUnknownInCatchVariables`, and friends. TS 6.0 made `strict: true` the default, but stating it explicitly documents intent and protects against tools that read the config literally.

```jsonc
// bad
{ "compilerOptions": { "noImplicitAny": true } }
// good
{ "compilerOptions": { "strict": true } }
```

## TS-1.2 Enable `noUncheckedIndexedAccess`.

Index signatures and array indexing can return `undefined` at runtime; without this flag the compiler lies about it.

```ts
// bad (flag off): compiles, crashes when list is empty
const first: string = list[0].toUpperCase();
// good (flag on): forced to handle the missing case
const first = list[0]?.toUpperCase() ?? '';
```

## TS-1.3 Enable `exactOptionalPropertyTypes`.

It distinguishes "property absent" from "property present with `undefined`", which matters for `Object.keys`, spreads, `in` checks, and PATCH-style APIs.

```ts
interface Prefs { theme?: 'dark' | 'light' }
// bad (flag off): silently allowed, later `'theme' in prefs` is true
const p: Prefs = { theme: undefined };
// good: omit the key, or declare `theme?: 'dark' | 'light' | undefined` if you mean it
const p: Prefs = {};
```

## TS-1.4 Enable `noImplicitOverride`.

Requiring `override` catches methods that silently stop overriding after a base-class rename.

```ts
// bad
class Admin extends User { save() {} }
// good
class Admin extends User { override save() {} }
```

## TS-1.5 Enable `verbatimModuleSyntax`.

What you write is what is emitted: type-only imports must say `type`, so transpilers and Node type stripping never need type information to elide imports.

```ts
// bad
import { User, createUser } from './user.ts';
// good
import { type User, createUser } from './user.ts';
```

## TS-1.6 Enable `erasableSyntaxOnly` (TS 5.8+).

It errors on enums, runtime namespaces, parameter properties, and `import =` aliases, constructs that Node type stripping, ts-blank-space, and Amaro cannot erase. TS-2.7, TS-6.3, and TS-8.2 cover the replacements.

```ts
// bad
enum Role { Admin, User }
// good
const Role = { Admin: 'admin', User: 'user' } as const;
type Role = (typeof Role)[keyof typeof Role];
```

## TS-1.7 Set `module`/`moduleResolution` to `nodenext` for Node, or `preserve` + `bundler` for bundled code.

`node10` and `classic` are deprecated in 6.0 and removed in 7.0; only `nodenext` and `bundler` model modern resolution.

```jsonc
// bad
{ "module": "commonjs", "moduleResolution": "node" }
// good (Node service or library)
{ "module": "nodenext" }
// good (Vite / Next / bundled app)
{ "module": "preserve", "moduleResolution": "bundler" }
```

## TS-1.8 Do not use `baseUrl`; write `paths` relative to the tsconfig, or prefer `package.json#imports`.

`baseUrl` is deprecated in 6.0, removed in 7.0, and made bare imports resolve to files that would never resolve at runtime. Node ignores tsconfig, so an alias that only `paths` knows compiles and then fails with `ERR_MODULE_NOT_FOUND`. Subpath imports work in Node, bundlers, and TypeScript without extra config; TS 6.0 supports `#/` under `nodenext` and `bundler`.

```jsonc
// bad
{ "baseUrl": "./src", "paths": { "@app/*": ["app/*"] } }
// good
{ "paths": { "@app/*": ["./src/app/*"] } }
// better (package.json)
{ "imports": { "#/*": "./src/*" } }
```

## TS-1.9 List global type packages explicitly in `types`.

Since 6.0, `types` defaults to `[]`; explicit lists are faster and stop test globals (`describe`, `it`) leaking into production code.

```jsonc
// bad
{ "types": ["*"] }
// good (app tsconfig)
{ "types": ["node"] }
// good (test tsconfig)
{ "types": ["node", "vitest/globals"] }
```

## TS-1.10 Set `rootDir` explicitly when sources live in a subfolder.

6.0 changed the default to the tsconfig directory, so builds otherwise emit `dist/src/index.js` instead of `dist/index.js`.

```jsonc
// bad (implicit)
{ "outDir": "dist", "include": ["src"] }
// good
{ "rootDir": "./src", "outDir": "dist", "include": ["src"] }
```

## TS-1.11 Do not use deprecated options or `ignoreDeprecations`.

TS 7.0 hard-errors on `target: es5`, `downlevelIteration`, `outFile`, `module: amd|umd|systemjs|none`, `esModuleInterop: false`, `allowSyntheticDefaultImports: false`, `alwaysStrict: false`, `import ... asserts`, and `module Foo {}` namespace syntax. `"ignoreDeprecations": "6.0"` only postpones the break.

```jsonc
// bad
{ "target": "es5", "ignoreDeprecations": "6.0" }
// good
{ "target": "es2024" }
```

## ~~TS-1.12~~ (removed)

Moved to [TS-2.14](02-types.md#ts-214-use--ts-expect-error-with-a-reason-never--ts-ignore-or--ts-nocheck).

## TS-1.13 Set `moduleDetection: "force"`.

Every file is then a module, even without imports or exports. Together with the `isolatedModules` that `verbatimModuleSyntax` already turns on (TS-1.5), each file can be transpiled alone by esbuild, SWC, Babel, or Node.

```jsonc
// bad
{ "moduleDetection": "auto" }
// good
{ "verbatimModuleSyntax": true, "moduleDetection": "force" }
```

## TS-1.14 Keep `skipLibCheck: true` in apps; test library declarations separately.

Re-checking every `.d.ts` in `node_modules` is slow and surfaces errors you cannot fix; library authors should validate their own output with attw and type tests instead (TS-16.2).

```jsonc
// bad (app tsconfig)
{ "skipLibCheck": false }
// good
{ "skipLibCheck": true }
```

## TS-1.15 Prefer `noUnusedLocals`/`noUnusedParameters` in the linter, not the compiler.

As compiler errors they block builds during refactors; `@typescript-eslint/no-unused-vars` gives the same signal with `_`-prefix escape hatches.

Contested: `@tsconfig/strictest` turns them on, while Matt Pocock's TSConfig Cheat Sheet lists `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch` as options he considers "too noisy". This guide keeps `noFallthroughCasesInSwitch` on anyway (TS-1.17).

```jsonc
// bad (tsconfig)
{ "noUnusedLocals": true, "noUnusedParameters": true }
// good (eslint config)
{ "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }] }
```

## ~~TS-1.16~~ (removed)

Migration-only advice; moved to the [appendix](appendix.md#migrating-from-ts-6-to-ts-7).

## TS-1.17 Enable `noFallthroughCasesInSwitch`.

An accidental fallthrough runs the next case's code silently. Unlike unused variables (TS-1.15), it is rarely intentional and never a refactoring leftover, so it is worth a compiler error.

```ts
// bad (flag off): 'admin' also gets the 'user' greeting
switch (role) {
  case 'admin':
    log('admin');
  case 'user':
    log('user');
}
// good
switch (role) {
  case 'admin':
    log('admin');
    break;
  case 'user':
    log('user');
    break;
}
```

## Recommended config

A shared base (TS-17.1), plus one config per kind of project. Comments link each option to its rule. The linter side of TS-1.15 lives in the [recommended lint config](06-modules-tooling.md#recommended-lint-config).

### `tsconfig.base.json` (shared)

```jsonc
{
  "$schema": "https://www.schemastore.org/tsconfig",
  "compilerOptions": {
    // Language & environment
    "target": "es2024",                        // TS-1.11
    "lib": ["es2024"],
    "moduleDetection": "force",                // TS-1.13
    "skipLibCheck": true,                      // TS-1.14
    "resolveJsonModule": true,

    // Strictness
    "strict": true,                            // TS-1.1
    "noUncheckedIndexedAccess": true,          // TS-1.2
    "exactOptionalPropertyTypes": true,        // TS-1.3
    "noImplicitOverride": true,                // TS-1.4
    "noFallthroughCasesInSwitch": true,        // TS-1.17
    "useUnknownInCatchVariables": true,        // implied by strict; TS-4.4

    // Erasable, transpiler-friendly output
    "verbatimModuleSyntax": true,              // TS-1.5
    "erasableSyntaxOnly": true,                // TS-1.6
    "isolatedModules": true,                   // implied by verbatimModuleSyntax; TS-1.13
    "noUncheckedSideEffectImports": true,

    // Explicit, fast program
    "types": [],                               // TS-1.9
    "forceConsistentCasingInFileNames": true
  }
}
```

### Node service or library (`tsconfig.json`)

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "nodenext",                      // TS-1.7
    "types": ["node"],                         // TS-1.9
    "rootDir": "./src",                        // TS-1.10
    "outDir": "./dist",
    "rewriteRelativeImportExtensions": true,   // TS-6.4
    "allowImportingTsExtensions": true,        // TS-6.4
    "sourceMap": true,
    // Libraries only
    "declaration": true,                       // TS-16.2
    "declarationMap": true,                    // TS-16.2
    "isolatedDeclarations": true,              // TS-16.1
    // Monorepo packages only
    "composite": true                          // TS-17.2
  },
  "include": ["src"]
}
```

### Bundled React app (Vite / Next.js)

```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "preserve",                      // TS-1.7
    "moduleResolution": "bundler",             // TS-1.7
    "lib": ["es2024", "dom"],
    "types": ["vite/client"],                  // Vite only; TS-1.9
    "jsx": "react-jsx",
    "noEmit": true,
    "allowImportingTsExtensions": true
  },
  "include": ["src"]
}
```

Notes:

- In TS 6.0+, `lib: ["dom"]` already includes `dom.iterable`.
- `@tsconfig/strictest` additionally enables `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`, `noPropertyAccessFromIndexSignature`, `allowUnusedLabels: false`, and `allowUnreachableCode: false`. Adopt them if your team accepts the noise (TS-1.15).

