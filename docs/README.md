# Docs

Human-readable practices. Each rule has a stable ID, a short reason, and a bad/good example. `pnpm check` type-checks every example.

## General

Language-agnostic practices. Each rule is labeled as evidence, contested, or convention; the [appendix](general/appendix.md) lists the sources and how strong they are.

| ID prefix | Topic |
|---|---|
| `GEN-NAME` | [Naming](general/01-naming.md) |
| `GEN-ERR` | [Error handling](general/02-errors.md) |
| `GEN-TEST` | [Testing](general/03-testing.md) |
| `GEN-GIT` | [Git & commits](general/04-git.md) |
| `GEN-REV` | [Code review](general/05-review.md) |
| (none) | [Appendix: evidence, contested points, open questions](general/appendix.md) |

## React

React itself: setup, APIs, state, Effects, performance, forms, Server Components, testing. Current as of React 19.3 and React Compiler 1.x. For typing React code, see [TS-13](typescript/13-react.md).

| ID prefix | Topic |
|---|---|
| `REACT-SETUP` | [Setup: framework, compiler, lint, patching](react/01-setup.md) |
| `REACT-API` | [Components and APIs](react/02-components.md) |
| `REACT-STATE` | [State](react/03-state.md) |
| `REACT-EFFECT` | [Effects](react/04-effects.md) |
| `REACT-PERF` | [Performance](react/05-performance.md) |
| `REACT-FORM` | [Forms and Actions](react/06-forms-actions.md) |
| `REACT-SERVER` | [Server Components and Server Functions](react/07-server.md) |
| `REACT-TEST` | [Testing](react/08-testing.md) |
| (none) | [Appendix: status, outdated advice, sources](react/appendix.md) |

## TypeScript

| ID prefix | Topic |
|---|---|
| `TS-1` | [Compiler config](typescript/01-config.md) |
| `TS-2` | [Types](typescript/02-types.md) |
| `TS-3` | [Null & optional](typescript/03-null-optional.md) |
| `TS-4` | [Functions](typescript/04-functions.md) |
| `TS-5` | [Generics](typescript/05-generics.md) |
| `TS-6` | [Modules & tooling](typescript/06-modules-tooling.md) |
| `TS-7` | [Naming conventions](typescript/07-naming.md) |
| `TS-8` | [Objects, interfaces & classes](typescript/08-objects-classes.md) |
| `TS-9` | [Arrays, tuples & collections](typescript/09-collections.md) |
| `TS-10` | [Async & promises](typescript/10-async.md) |
| `TS-11` | [Error handling](typescript/11-errors.md) |
| `TS-12` | [Immutability](typescript/12-immutability.md) |
| `TS-13` | [React / TSX](typescript/13-react.md) |
| `TS-14` | [Utility & advanced types](typescript/14-advanced-types.md) |
| `TS-15` | [Type-level restraint & checker performance](typescript/15-type-performance.md) |
| `TS-16` | [Declaration files & library authoring](typescript/16-library-authoring.md) |
| `TS-17` | [Project structure, monorepos & project references](typescript/17-project-structure.md) |
| `TS-18` | [Testing types](typescript/18-testing-types.md) |
| `TS-19` | [Runtime vs compile-time](typescript/19-runtime.md) |
| `TS-20` | [Documentation (TSDoc)](typescript/20-tsdoc.md) |
| `TS-21` | [Security-relevant practices](typescript/21-security.md) |
| (none) | [Appendix: tooling status, contested points, caveats](typescript/appendix.md) |
