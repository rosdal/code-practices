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

It errors on enums, runtime namespaces, parameter properties, and `import =` aliases, constructs that Node type stripping, ts-blank-space, and Amaro cannot erase.

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

`baseUrl` is deprecated in 6.0, removed in 7.0, and made bare imports resolve to files that would never resolve at runtime. Subpath imports (now supporting `#/`) work in Node, bundlers, and TypeScript without extra config.

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

## TS-1.12 Moved to TS-2.14.

This rule is about suppression comments in source, not compiler configuration. See [TS-2.14](02-types.md#ts-214-use--ts-expect-error-with-a-reason-never--ts-ignore-or--ts-nocheck).

## TS-1.13 Set `moduleDetection: "force"`.

Every file is then a module, even without imports or exports. Together with the `isolatedModules` that `verbatimModuleSyntax` already turns on (TS-1.5), each file can be transpiled alone by esbuild, SWC, Babel, or Node.

```jsonc
// bad
{ "moduleDetection": "auto" }
// good
{ "verbatimModuleSyntax": true, "moduleDetection": "force" }
```

## TS-1.14 Keep `skipLibCheck: true` in apps; test library declarations separately.

Re-checking every `.d.ts` in `node_modules` is slow and surfaces errors you cannot fix; library authors should validate their own output with attw and type tests instead.

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

## TS-1.16 Use `stableTypeOrdering` only to diff 6.0 vs 7.0 output during migration.

The TS team warns it can slow 6.0 checking "up to 25%"; in 7.0 it is always on.

```jsonc
// bad (committed tsconfig)
{ "stableTypeOrdering": true }
// good: enable it in a throwaway run while comparing 6.0 and 7.0 output, then remove it
```

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

TS-1.1 to TS-1.17 combined, for a Node service. For a bundled app, replace `"module": "nodenext"` with `"module": "preserve", "moduleResolution": "bundler"` (TS-1.7). The linter side of TS-1.15 lives in the ESLint config.

```jsonc
{
  "compilerOptions": {
    // Type safety
    "strict": true,                       // TS-1.1
    "noUncheckedIndexedAccess": true,     // TS-1.2
    "exactOptionalPropertyTypes": true,   // TS-1.3
    "noImplicitOverride": true,           // TS-1.4
    "noFallthroughCasesInSwitch": true,   // TS-1.17

    // Emit and modules
    "verbatimModuleSyntax": true,         // TS-1.5
    "erasableSyntaxOnly": true,           // TS-1.6
    "module": "nodenext",                 // TS-1.7
    "moduleDetection": "force",           // TS-1.13
    "target": "es2024",                   // TS-1.11

    // Environment and output
    "types": ["node"],                    // TS-1.9
    "rootDir": "./src",                   // TS-1.10
    "outDir": "dist",
    "skipLibCheck": true                  // TS-1.14
  },
  "include": ["src"]
}
```

