---
name: typescript
description: Use when writing, reviewing, or refactoring TypeScript or TSX (.ts, .tsx, .mts, .cts), and when setting up or changing a tsconfig, a typescript-eslint config, a published TypeScript package, or a TypeScript monorepo. Also use when choosing between interface and type, any and unknown, a cast and a schema, enums and unions, or exceptions and Result types.
---

# TypeScript

Each line is one rule from the Rosdal TypeScript guide. The ID links to the full rule, with its reason and examples, in `docs/typescript/` of https://github.com/rosdal/code-practices. Cite IDs in review comments ("see TS-3.1").

In an existing codebase with its own conventions, consistency wins: apply these to new code and when refactoring.

Rules are ordered by where your attention matters. The first section is judgment the tools cannot make; spend your effort there. The last section is already enforced by the compiler or linter once a project uses the recommended configs.

## Judgment: apply while writing

### Types and boundaries

- [TS-2.1] Type values of unknown shape as `unknown` and narrow. Not `any`.
- [TS-2.2] Parse every runtime boundary (HTTP bodies, env, storage, queue messages, third-party responses) with a schema and derive the type from it. Not `as User`.
- [TS-2.3] Check a value against a type with `satisfies`. Not `as`.
- [TS-2.5] Model variants as discriminated unions with a literal tag. Not a bag of optional fields.
- [TS-2.8] Brand IDs and validated strings that must not be mixed (`UserId`, `OrderId`).
- [TS-2.11] Use literal and template-literal types when the domain is finite. Not plain `string`.
- [TS-2.12] Use `as const` on static config and lookup tables; derive unions from them.
- [TS-2.13] Avoid `as unknown as T` outside test fixtures and typed adapters; parse instead.
- [TS-19.1] Make runtime decisions on values (tags, schemas, `instanceof` on classes). Not on types, which are erased.
- [TS-19.5] Validate env vars once at startup into a typed, frozen config object. Not `process.env.X` scattered through the code.

### Null and optional

- [TS-3.3] Use `undefined` for "absent" in your own APIs; accept `null` only at boundaries and normalize it.

### Functions

- [TS-4.1] Use an options object past two parameters or for any boolean flag. Not positional booleans.
- [TS-4.2] Put reusable narrowing in a type guard (`x is T`) or assertion function (`asserts x is T`).
- [TS-4.3] Mark array and object parameters `readonly` when the function does not mutate them.
- [TS-4.4] Narrow caught values from `unknown`; return a `Result` for expected failures.
- [TS-4.5] Use overloads only when the return type depends on the argument type in a way a union or generic cannot express.
- [TS-4.6] Type ignored callback returns as `void`. Do not pass async callbacks where `void` is expected.
- [TS-4.7] Use function declarations for named top-level functions; arrows for callbacks.
- [TS-4.8] Wrap callbacks in an arrow (`xs.map((s) => parseInt(s, 10))`). Not bare references to functions with optional parameters.

### Generics

- [TS-5.2] Constrain type parameters with `extends` as narrowly as the body needs.
- [TS-5.3] Name a single type parameter `T`; name several descriptively (`TKey`, `TValue`).
- [TS-5.4] Use `const` type parameters instead of asking callers for `as const`.
- [TS-5.5] Use `NoInfer<T>` to stop an argument from widening an inferred type.
- [TS-5.7] Give type parameters of public generic types defaults.

### Modules

- [TS-6.5] Export functions or consts. Not `export let`.
- [TS-6.6] Import from the defining file inside an app. Barrel `index.ts` files only as a package's public entry point.

### Naming

- [TS-7.1] UpperCamelCase for types, interfaces, classes, type parameters, and components; lowerCamelCase for values, functions, and properties.
- [TS-7.2] No `I` prefix on interfaces, no `T` prefix on type aliases.
- [TS-7.3] CONSTANT_CASE only for true module-level constants; UpperCamelCase for `as const` objects that double as a type.
- [TS-7.4] Name booleans as predicates: `isX`, `hasX`, `canX`, `shouldX`.
- [TS-7.5] Use `#private` or `private` for privacy. `_` only for intentionally unused bindings.
- [TS-7.6] Treat acronyms as words: `HttpClient`, `userId`. Not `HTTPClient`, `userID`.

### Objects and classes

- [TS-8.1] Use plain objects and functions for data; classes for stateful services with identity.
- [TS-8.3] Use `#private` for real privacy; `private` only when tests must reach the field.
- [TS-8.6] Initialize fields at declaration; never add or delete properties after construction.
- [TS-8.7] Use `Record<K, V>` or `Map` for dictionaries. Not index signatures on domain types.
- [TS-8.9] Declare `implements` on classes that fulfill a contract.

### Collections

- [TS-9.2] Use `readonly T[]` for inputs and data that must not change.
- [TS-9.3] Name tuple members, and use tuples only for short positional data; prefer an interface past two fields.
- [TS-9.4] Use `Map`/`Set` for dynamic keys and membership; plain objects for fixed shapes.
- [TS-9.5] Handle a possibly missing element with `.at()`, a default, or a check. Not `!`.
- [TS-9.6] Filter nullable arrays with a predicate (`x != null`) or `flatMap`. Not `filter(Boolean) as T[]`.
- [TS-9.7] Use `toSorted`, `toReversed`, `toSpliced`, `with` on shared arrays. Not `sort`, `reverse`, `splice`.

### Async

- [TS-10.5] Run independent work with `Promise.all` (or `allSettled` if partial failure is fine). Not `await` in a loop.
- [TS-10.6] Accept an `AbortSignal` in cancellable async APIs and honor it.

### Errors

- [TS-11.2] Give domain error classes a literal `name`/`code`. Not message-string matching.
- [TS-11.3] Wrap with `new Error(msg, { cause })`. Not a new error that drops the original.
- [TS-11.4] Return a `Result` for expected, recoverable failures at domain boundaries; throw for bugs.
- [TS-11.6] Log with context or rethrow. Never an empty `catch`.

### Immutability

- [TS-12.1] Default to `const`, `readonly` properties, and readonly arrays; mutate only local, unshared values.
- [TS-12.2] `Readonly<T>` is shallow; use `as const` for deep immutability of static data.
- [TS-12.3] Return new objects from reducers and state updates. Never mutate arguments.

### React

- [TS-13.1] Type components as plain functions with a typed props parameter. Not `React.FC`.
- [TS-13.2] Declare props as an exported `XProps` interface; use `type` only for union props.
- [TS-13.3] Extend native element props with `ComponentProps<'button'>`.
- [TS-13.4] In React 19, take `ref` as a prop and use parameter defaults. Not `forwardRef` or `defaultProps`.
- [TS-13.5] Type `children` as `React.ReactNode`.
- [TS-13.6] Model mutually exclusive props as a discriminated union.
- [TS-13.7] Annotate `useState` only when inference cannot (`useState<User>()`); `useRef<HTMLDivElement>(null)` for DOM refs.
- [TS-13.8] Type handlers with React's event types, or let the JSX attribute infer them.
- [TS-13.9] Type reducers with discriminated-union actions and an exhaustive `switch`.
- [TS-13.10] Make reusable collection components generic (`List<T>`). Not `any`.

### Advanced types

- [TS-14.1] Use built-in utilities (`Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited`, ...). Not hand-rolled equivalents.
- [TS-14.2] Derive types from one source of truth: schemas, `as const` data, function signatures.
- [TS-14.3] Use mapped types with `as` remapping for systematic transformations.
- [TS-14.4] Use conditional types with `infer` sparingly and name them; wrap in `[T]` to stop distribution.
- [TS-14.5] Use template-literal types for string protocols (event names, routes, CSS vars).
- [TS-14.6] Declare a named interface instead of deep `Omit`/`Pick`/`&` chains.
- [TS-15.1] Write the simplest type that prevents the bug; type-level code must earn its complexity.
- [TS-15.4] Avoid unions of hundreds of members in hot paths; use a base or branded type.
- [TS-15.5] Bound recursive types with a depth counter.

### Testing types

- [TS-18.1] Test non-trivial generic types with `expectTypeOf` in `*.test-d.ts`; run `vitest --typecheck` in CI.
- [TS-18.2] Assert invalid usage fails with `// @ts-expect-error -- reason`.
- [TS-18.4] Build fixtures with factories typed against the real types. Not `as any`.

### Docs

- [TS-20.1] Document exported APIs with TSDoc that states intent, edge cases, and failure modes. Not the types again.
- [TS-20.2] Give every `@deprecated` its replacement.
- [TS-20.3] No JSDoc type tags (`@param {string}`) in `.ts` files.
- [TS-20.4] Document each prop on component props interfaces.

### Security

- [TS-21.2] Strip or reject unknown keys when parsing input objects. Never write `req.body` to the database as is.
- [TS-21.3] Never `obj[userKey] = ...` without an allow-list; use `Map` or `Object.create(null)` for untrusted keys.
- [TS-21.4] Brand sanitized strings (`SafeHtml`, `SqlIdentifier`) so only the sanitizer can produce them.

## Setup: when creating or changing project config

Use the recommended configs in `docs/typescript/01-config.md` (tsconfig) and `docs/typescript/06-modules-tooling.md` (ESLint) rather than assembling options by hand.

- [TS-1.1] Set `strict: true` explicitly.
- [TS-1.2] Enable `noUncheckedIndexedAccess`.
- [TS-1.3] Enable `exactOptionalPropertyTypes`.
- [TS-1.4] Enable `noImplicitOverride`.
- [TS-1.5] Enable `verbatimModuleSyntax`.
- [TS-1.6] Enable `erasableSyntaxOnly`.
- [TS-1.7] Use `module: nodenext` for Node, or `module: preserve` + `moduleResolution: bundler` for bundled code. Not `node10` or `classic`.
- [TS-1.8] No `baseUrl`; use `package.json#imports` (`#/*`) for aliases. Node ignores tsconfig `paths`.
- [TS-1.9] List global type packages explicitly in `types`, per environment.
- [TS-1.10] Set `rootDir` when sources live in a subfolder.
- [TS-1.11] No deprecated options and no `ignoreDeprecations`.
- [TS-1.13] Set `moduleDetection: "force"`.
- [TS-1.14] Keep `skipLibCheck: true` in apps.
- [TS-1.15] Report unused variables through the linter. Not `noUnusedLocals`/`noUnusedParameters`.
- [TS-1.17] Enable `noFallthroughCasesInSwitch`.
- [TS-6.7] Run `tsc --noEmit` (or `tsc -b`) in CI as a blocking step. Bundlers and `node file.ts` do not type-check.
- [TS-6.8] Lint with typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` and `projectService`.
- [TS-6.9] Pin one exact TypeScript version per repo.
- [TS-15.6] Diagnose slow checks with `--extendedDiagnostics` / `--generateTrace`; pin TS 7's `--checkers` across environments.
- [TS-16.1] Enable `isolatedDeclarations` for publishable packages.
- [TS-16.2] Ship `.d.ts` and `declarationMap` with a `types`-first `exports` map; validate with attw and publint.
- [TS-16.3] Publish compiled JS + `.d.ts`. Not raw `.ts` as the only entry point.
- [TS-16.4] Export every type that appears in a public signature.
- [TS-16.5] Publish new libraries ESM-only for Node >= 20.19 / 22.12; dual-publish only if consumers need CJS.
- [TS-16.6] Extend third-party types with module augmentation. Never edit `node_modules`.
- [TS-16.7] Put ambient declarations in `.d.ts` files only; `declare global` only for real globals.
- [TS-17.1] Share one base tsconfig and `extends` it in every package.
- [TS-17.2] Use project references (`composite`, `references`) and `tsc -b` in monorepos.
- [TS-17.3] Split tsconfigs by environment (app, test, scripts).
- [TS-17.4] Import workspace packages by package name. Not relative paths into another package's `src`.
- [TS-18.3] Check published declarations with attw or tsd.

## Enforced by tooling once set up

With the recommended configs these fail the build or lint. Flag them in review only when the project lacks those configs.

- [TS-2.4] Annotate exported function signatures; let locals infer. (`explicit-module-boundary-types`)
- [TS-2.6] Make switches over unions exhaustive with a `never` check. (`switch-exhaustiveness-check`)
- [TS-2.7] No `enum` or `const enum`; use `as const` objects or unions. (`erasableSyntaxOnly`, `no-restricted-syntax`)
- [TS-2.9] `interface` for extendable object shapes, `type` for the rest. (`consistent-type-definitions`)
- [TS-2.10] No `String`, `Number`, `Boolean`, `Object`, `{}`, or `Function` as types. (typescript-eslint presets)
- [TS-2.14] `// @ts-expect-error -- reason`. Never `@ts-ignore` or `@ts-nocheck`. (`ban-ts-comment`)
- [TS-3.1] `?.` and `??`. Not `&&` chains or `||` defaults. (`prefer-optional-chain`, `prefer-nullish-coalescing`)
- [TS-3.2] No non-null assertion `!`; narrow or throw. (`no-non-null-assertion`)
- [TS-3.4] Compare numbers and strings explicitly. Not truthiness. (`strict-boolean-expressions`)
- [TS-5.1] Add a type parameter only when it relates two positions. (`no-unnecessary-type-parameters`)
- [TS-5.6] No explicit type arguments where inference works. (`no-unnecessary-type-arguments`)
- [TS-6.1] `import type` / `export type` for type-only imports and re-exports. (`verbatimModuleSyntax`, `consistent-type-imports`)
- [TS-6.2] Named exports only, except framework files. (`no-restricted-exports`)
- [TS-6.3] No `namespace` or `module Foo {}`. (`erasableSyntaxOnly`)
- [TS-6.4] Real file extensions in relative imports under `nodenext`. (compiler)
- [TS-8.2] No parameter properties; declare fields. (`erasableSyntaxOnly`)
- [TS-8.4] `readonly` on fields never reassigned. (`prefer-readonly`)
- [TS-8.5] No `public` modifier. (`explicit-member-accessibility`)
- [TS-8.8] No classes of only static members; export functions. (`no-extraneous-class`)
- [TS-9.1] `T[]` for simple element types, `Array<T>` for complex ones. (`array-type`)
- [TS-10.1] Never leave a promise floating; `void` marks deliberate fire-and-forget. (`no-floating-promises`)
- [TS-10.2] No async functions where a void callback is expected. (`no-misused-promises`)
- [TS-10.3] No promises in conditions. (`no-misused-promises`)
- [TS-10.4] `await` only thenables; no `async` without `await`. (`await-thenable`, `require-await`)
- [TS-10.7] `return await` inside `try`. (`return-await`)
- [TS-11.1] Throw only `Error` instances. (`only-throw-error`)
- [TS-11.5] Type `.catch` callback parameters as `unknown`. (`use-unknown-in-catch-callback-variable`)
- [TS-21.5] No `eval`, `new Function`, or string `setTimeout`; no `dangerouslySetInnerHTML` with unsanitized data. (`no-implied-eval`)
- [TS-21.6] No objects or `undefined` in template strings or `+`. (`restrict-template-expressions`, `restrict-plus-operands`)
