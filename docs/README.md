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

## PHP

Modern, framework-agnostic PHP: versions, typing, objects, language features, errors, security, runtime config, testing. Current as of PHP 8.5.

| ID prefix | Topic |
|---|---|
| `PHP-SETUP` | [Setup: versions, Composer, formatting, static analysis](php/01-setup.md) |
| `PHP-TYPES` | [Types](php/02-types.md) |
| `PHP-OOP` | [Classes and objects](php/03-objects.md) |
| `PHP-LANG` | [Language features](php/04-language.md) |
| `PHP-ERR` | [Error handling](php/05-errors.md) |
| `PHP-SEC` | [Security](php/06-security.md) |
| `PHP-RUN` | [Configuration and runtime](php/07-runtime.md) |
| `PHP-TEST` | [Testing](php/08-testing.md) |
| (none) | [Appendix: status, outdated advice, sources](php/appendix.md) |

## Node.js

Node.js runtime and tooling: versions, package managers, modules, async and errors, performance, supply-chain security, runtime and containers, testing. Current as of Node.js 24 LTS and 26.

| ID prefix | Topic |
|---|---|
| `NODE-SETUP` | [Setup: versions, package managers, modules, TypeScript, built-ins](node/01-setup.md) |
| `NODE-ERR` | [Async and errors](node/02-errors.md) |
| `NODE-PERF` | [Performance](node/03-performance.md) |
| `NODE-SEC` | [Security and supply chain](node/04-security.md) |
| `NODE-RUN` | [Configuration and runtime](node/05-runtime.md) |
| `NODE-TEST` | [Testing](node/06-testing.md) |
| (none) | [Appendix: status, outdated advice, sources](node/appendix.md) |

## Database

Relational databases, with PostgreSQL as the reference engine: versions, schema, indexes, queries, transactions, migrations, operations, testing. Current as of PostgreSQL 18. Language-neutral; the same rules apply through an ORM.

| ID prefix | Topic |
|---|---|
| `DB-SETUP` | [Setup: versions, patching, monitoring, authentication](database/01-setup.md) |
| `DB-SCHEMA` | [Schema: types, keys, constraints, naming](database/02-schema.md) |
| `DB-INDEX` | [Indexes](database/03-indexes.md) |
| `DB-QUERY` | [Queries](database/04-queries.md) |
| `DB-TX` | [Transactions](database/05-transactions.md) |
| `DB-MIG` | [Migrations](database/06-migrations.md) |
| `DB-OPS` | [Operations: pooling, roles, vacuum, backups, upgrades](database/07-operations.md) |
| `DB-TEST` | [Testing](database/08-testing.md) |
| (none) | [Appendix: status, outdated advice, sources](database/appendix.md) |

## API design

HTTP/JSON API design: the OpenAPI contract, resources and URLs, methods and idempotency, status codes and errors, bodies, collections, evolution and versioning, HTTP features, and security. Current as of RFC 9110, RFC 9457, RFC 9745, RFC 10008, OpenAPI 3.2 and the OWASP API Security Top 10 2023. Language-neutral.

| ID prefix | Topic |
|---|---|
| `API-SPEC` | [Contract: OpenAPI, linting, generation](api-design/01-contract.md) |
| `API-URL` | [Resources and URLs](api-design/02-resources.md) |
| `API-METHOD` | [Methods and idempotency](api-design/03-methods.md) |
| `API-ERR` | [Status codes and errors](api-design/04-errors.md) |
| `API-BODY` | [Request and response bodies](api-design/05-bodies.md) |
| `API-LIST` | [Collections: pagination, filtering, sorting](api-design/06-collections.md) |
| `API-VER` | [Evolution and versioning](api-design/07-evolution.md) |
| `API-HTTP` | [HTTP features: conditional requests, caching, rate limits](api-design/08-http.md) |
| `API-SEC` | [Security](api-design/09-security.md) |
| (none) | [Appendix: status, outdated advice, sources](api-design/appendix.md) |

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
