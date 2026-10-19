# 6. Modules & tooling

How to import and export, and which tools check the code before it ships.

## TS-6.1 Use `import type` / inline `type` modifiers for type-only imports and `export type` for type-only re-exports.

These are required by `verbatimModuleSyntax` (TS-1.5) and Node type stripping. Enforce with `consistent-type-imports` and `consistent-type-exports`.

```ts
// bad
import { User } from './user.ts';
export { Role } from './role.ts'; // Role is a type
// good
import type { User } from './user.ts';
export type { Role } from './role.ts';
```

## TS-6.2 Use named exports; do not use default exports (framework-required files excepted).

Google: default exports "provide no canonical name". Named exports also give better auto-import and refactoring. Exceptions are Next.js pages/layouts, Storybook CSF, and `React.lazy` targets.

```ts
// bad
export default function Button() {}
// good
export function Button() {}
```

## TS-6.3 Do not use `namespace` or `module Foo {}`; use ES modules.

Runtime namespaces are non-erasable (TS-1.6), and the `module Foo {}` spelling is a hard error in TS 7 (TS-1.11). Use `declare global` / `declare module 'x'` only in `.d.ts` augmentation.

```ts
// bad
namespace Billing { export function charge() {} }
// good (billing.ts)
export function charge() {}
```

## TS-6.4 Write real file extensions in relative imports for Node ESM (`./user.js`, or `./user.ts` with `rewriteRelativeImportExtensions`).

`nodenext` requires extensions. Node type stripping runs `.ts` specifiers directly, and `rewriteRelativeImportExtensions` (TS 5.7+) rewrites them to `.js` on emit.

```ts
// bad (nodenext)
import { db } from './db';
// good
import { db } from './db.ts';
```

## TS-6.5 Do not use `export let`; export functions or consts.

Mutable live bindings are confusing across re-exports; Google bans them.

```ts
// bad
export let count = 0;
// good
let count = 0;
export function increment(): number { return ++count; }
```

## TS-6.6 Avoid barrel files (`index.ts` that re-exports everything) inside applications.

They create import cycles, defeat tree-shaking in some bundlers, and slow type checking and tests. Use them only as a package's public entry point.

```ts
// bad
import { Button } from '#/components/index.ts';
// good
import { Button } from '#/components/button.ts';
```

## TS-6.7 Run `tsc --noEmit` (or `tsc -b`) in CI as a blocking step, independent of the bundler.

Vite, esbuild, SWC, and Node strip types without checking them, so a green build says nothing about types. Node docs: "Node.js will replace TypeScript syntax with whitespace, and no type checking is performed." Running `node file.ts` for scripts and dev is fine, as long as CI still runs `tsc`.

```jsonc
// bad (package.json): the only check is the bundler
{ "scripts": { "build": "vite build" } }
// good: CI runs `typecheck` and fails on errors
{ "scripts": { "typecheck": "tsc --noEmit", "build": "vite build" } }
```

## TS-6.8 Lint with typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` using `projectService`.

Type-aware rules (`no-floating-promises`, `no-misused-promises`, `no-unsafe-*`) catch the bugs that matter most. See the recommended lint config below.

```ts
// bad: syntax-only rules, no type information
export default defineConfig(tseslint.configs.recommended);
// good
export default defineConfig(
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  { languageOptions: { parserOptions: { projectService: true } } },
);
```

## TS-6.9 Pin one TypeScript version per repo (workspace root) and upgrade deliberately.

Minor versions can add errors (e.g., 5.9 inference changes, 6.0 defaults), so a caret range lets a fresh install break the build.

```jsonc
// bad (package.json)
{ "devDependencies": { "typescript": "^6.0.2" } }
// good
{ "devDependencies": { "typescript": "6.0.2" } }
```

## Recommended lint config

TS-6.8 in full. Comments link each rule to the rule in this guide that it enforces.

```js
// eslint.config.mjs
// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/**', 'coverage/**', '**/*.gen.ts'] },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,      // TS-6.8
      tseslint.configs.stylisticTypeChecked,   // TS-6.8
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Not in any preset: enable explicitly
      '@typescript-eslint/switch-exhaustiveness-check': ['error', { considerDefaultExhaustiveForUnions: false }], // TS-2.6
      '@typescript-eslint/strict-boolean-expressions': ['error', { allowNullableBoolean: true }],                // TS-3.4
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],             // TS-6.1
      '@typescript-eslint/consistent-type-exports': 'error',                                                    // TS-6.1
      '@typescript-eslint/no-import-type-side-effects': 'error',                                                // TS-6.1
      '@typescript-eslint/explicit-module-boundary-types': 'error',                                             // TS-2.4
      '@typescript-eslint/no-unsafe-type-assertion': 'warn',                                                    // TS-2.3, TS-2.13
      '@typescript-eslint/prefer-readonly': 'error',                                                            // TS-8.4
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],            // TS-8.5
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true, named: true } }],            // TS-6.2
      'no-restricted-syntax': ['error', { selector: 'TSEnumDeclaration', message: 'Use an `as const` object or a union (TS-2.7).' }],

      // In a preset, but set here to pin the options this guide relies on
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],                                // TS-2.9
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],                                             // TS-10.7
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],    // TS-1.15
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description' }],         // TS-2.14
      '@typescript-eslint/no-non-null-assertion': 'error',                                                      // TS-3.2
    },
  },
  // Framework files that must default-export (TS-6.2); adjust the globs to your framework
  { files: ['app/**/{page,layout}.tsx', '**/*.stories.tsx'], rules: { 'no-restricted-exports': 'off' } },
  { files: ['**/*.{js,mjs,cjs}'], extends: [tseslint.configs.disableTypeChecked] },
);
```

Where each rule lives (typescript-eslint v8.71.2 rules table):

- `no-floating-promises`, `no-misused-promises`, `only-throw-error`, `restrict-template-expressions`, and the `no-unsafe-*` family are in `recommended-type-checked`, and therefore in `strict-type-checked`.
- `no-unnecessary-condition` and `use-unknown-in-catch-callback-variable` are strict-only.
- `prefer-nullish-coalescing` is in `stylistic-type-checked`.
- `strict-boolean-expressions`, `consistent-type-imports`, `explicit-module-boundary-types`, and `no-unsafe-type-assertion` are in no preset.

typescript-eslint warns that `strict-type-checked` rules "may change outside of major version updates", so pin the package version (as TS-6.9 does for TypeScript). The official snippet sets only `projectService: true`; `tsconfigRootDir: import.meta.dirname` is an added safeguard for monorepos.