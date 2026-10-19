# 17. Project structure, monorepos & project references

How to share configuration across packages, build them in order, and keep their boundaries intact.

## TS-17.1 Use one shared base tsconfig (`tsconfig.base.json` or a workspace package) and `extends` it in every package.

Settings like those in TS-1 then change in one place instead of drifting per package. `extends` accepts an array (TS 5.0+).

```jsonc
// bad (packages/api/tsconfig.json): every package copies the full option list
{ "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true, "module": "nodenext" /* ... */ } }
// good
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "rootDir": "./src", "outDir": "dist" } }
```

## TS-17.2 Use project references (`composite: true`, `references`) and `tsc -b` for monorepos with internal libraries.

Builds become incremental and ordered: an unchanged library is not re-checked. TS 7 parallelizes them with `--builders` (TS-15.6).

```jsonc
// bad (packages/api/tsconfig.json): reaches into the library's sources, re-checking them every build
{ "include": ["src", "../core/src"] }
// good (packages/core/tsconfig.json)
{ "extends": "../../tsconfig.base.json", "compilerOptions": { "composite": true } }
// good (packages/api/tsconfig.json)
{ "extends": "../../tsconfig.base.json", "references": [{ "path": "../core" }] }
```

## TS-17.3 Split tsconfigs by environment (app, test, node scripts) so DOM, Node, and test globals do not leak across.

One config for everything lets app code call `describe` or `process.env` and still compile. This extends TS-1.9 to whole configs.

```jsonc
// bad (tsconfig.json): one config covers src, tests, and scripts
{ "compilerOptions": { "lib": ["es2024", "dom"], "types": ["node", "vitest/globals"] }, "include": ["src", "test", "scripts"] }
// good (tsconfig.json): a solution file pointing at one config per environment
{ "files": [], "references": [
  { "path": "./tsconfig.app.json" },    // lib: dom, types: []
  { "path": "./tsconfig.test.json" },   // types: ["vitest/globals"]
  { "path": "./tsconfig.node.json" }    // types: ["node"]
] }
```

## TS-17.4 Import workspace packages by package name through their `exports`, not by relative paths into another package's `src`.

A relative path skips the package's public API, breaks once the package is built or published, and bypasses project references.

```ts
// bad
import { parseMoney } from '../../core/src/money.ts';
// good
import { parseMoney } from '@acme/core';
```

## ~~TS-17.5~~ (removed)

Covered by [TS-1.8](01-config.md).
