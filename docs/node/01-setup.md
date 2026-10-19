# 1. Setup

Which Node.js version to target, how to pin it and the package manager, module format, running TypeScript, and which built-ins replace dependencies. For `tsconfig` and lint setup, see the [TypeScript guide](../typescript/01-config.md); for publishing packages, [TS-16](../typescript/16-library-authoring.md).

Each rule says whether it is official guidance (nodejs.org docs, release notes, package manager docs) or convention. Sources are in the [appendix](appendix.md#sources).

## NODE-SETUP-1 Run production on an LTS line. New apps: Node 26. Minimum: Node 24.

Current releases change quickly, and end-of-life lines get no security fixes. Every security release counts EOL versions as affected. Node 26 becomes Active LTS on 28 October 2026 and is supported until April 2029. Node 24 moves to Maintenance on 20 October 2026. Node 22 gets only critical and security fixes until April 2027; support it in libraries, not in new apps.

Official: nodejs.org *Releases* ("Production applications should only use Active LTS or Maintenance LTS releases") and the Release WG schedule (checked 2026-10-19):

| Line | Status on 2026-10-19 | Active LTS from | Maintenance from | End of life |
|---|---|---|---|---|
| 26.x | Current | 28 Oct 2026 | 20 Oct 2027 | 30 Apr 2029 |
| 24.x (Krypton) | Active LTS | 28 Oct 2025 | 20 Oct 2026 | 30 Apr 2028 |
| 22.x (Jod) | Maintenance LTS | 29 Oct 2024 | 21 Oct 2025 | 30 Apr 2027 |
| 25.x | End of life (1 Jun 2026) | | | |
| 20.x | End of life (30 Apr 2026) | | | |

The schedule changes from Node 27. There will be one major release a year, and every major becomes LTS, so odd and even lines no longer differ. Each line starts with six months of Alpha (October to March). Alpha releases are for testing in CI, not for production. 27.0.0 is due on 22 April 2027 and becomes LTS on 20 October 2027. The project says this schedule "is not final and may be amended"; `schedule.json` in nodejs/Release is the authoritative record.

```jsonc
// bad: allows end-of-life lines
{ "engines": { "node": ">=18" } }
// good: app
{ "engines": { "node": ">=24" } }
// good: library that still supports 22
{ "engines": { "node": "^22.12.0 || >=24" } }
```

## NODE-SETUP-2 Pin the Node version in one file, and use it in development, CI and the container image.

When a developer runs 26 locally, CI runs 24 and the image uses `node:latest`, a bug can appear in only one of them. Keep the major in one version file (`.nvmrc` or `.node-version`; version managers and `actions/setup-node` read both), and use the same major in the image tag.

Convention.

```text
// bad
FROM node:latest
CI: node-version: 'lts/*'

// good
.node-version: 24
FROM node:24-bookworm-slim
CI: node-version-file: .node-version
```

## NODE-SETUP-3 Commit the lockfile, and install from it unchanged in CI and deploys.

Without a lockfile, every install resolves versions again, so CI and production can run code nobody tested. Use `npm ci` or `pnpm install --frozen-lockfile` (the default when pnpm runs in CI). Both fail when the lockfile and `package.json` disagree, instead of quietly rewriting the lockfile.

Official: npm and pnpm documentation.

```text
// bad
.gitignore: package-lock.json
CI: npm install

// good
package-lock.json (or pnpm-lock.yaml) committed
CI: npm ci (or pnpm install --frozen-lockfile)
```

## NODE-SETUP-4 Use one package manager, pinned in `packageManager`. Don't rely on Corepack being installed.

Mixing npm and pnpm produces two lockfiles that drift apart. Node stopped bundling Corepack in v25, so on Node 26 `corepack enable` is only available if you installed Corepack yourself. Pin the exact version in `packageManager`, and install that version explicitly in CI and in the image.

Official: Node.js v24 Corepack docs ("Corepack will no longer be distributed starting with Node.js v25"). Choosing pnpm is convention, but pnpm 11's defaults are the strongest supply-chain defaults of the three (NODE-SEC-2, NODE-SEC-3).

```jsonc
// bad: no pin; whatever is on PATH writes the lockfile
{ "name": "api" }
// good
{ "name": "api", "packageManager": "pnpm@11.10.0" }
```

## NODE-SETUP-5 Write ES modules and declare `"type": "module"`.

ESM is the standard module system. Since v22.12 (and 20.19), CommonJS code can `require()` an ES module without a flag, so writing ESM no longer locks out CommonJS consumers. That works unless the module graph uses top-level await (`ERR_REQUIRE_ASYNC_MODULE`). Declare `"type"` explicitly: without it, Node detects the syntax, which the release notes say costs ES modules a little speed.

Official: Node.js v20.19.0 and v22.12.0 release notes.

```jsonc
// bad: no "type"; .js files are guessed
{ "name": "api", "main": "index.js" }
// good
{ "name": "api", "type": "module", "exports": "./src/index.ts" }
```

## NODE-SETUP-6 Run TypeScript with Node's type stripping. Not ts-node.

Type stripping is stable since v24.12.0 and v25.2.0: `node src/server.ts` runs with no flag and no dependency. It only removes erasable syntax, so turn on `erasableSyntaxOnly` ([TS-1.6](../typescript/01-config.md)). Enums, namespaces and parameter properties still need `--experimental-transform-types`; don't use them. Node does not type-check, so `tsc --noEmit` stays a blocking CI step ([TS-6.7](../typescript/06-modules-tooling.md)).

Official: Node.js *Modules: TypeScript* (Stability 2).

```jsonc
// bad
{ "scripts": { "dev": "nodemon --exec ts-node src/server.ts" } }
// good
{ "scripts": { "dev": "node --watch src/server.ts", "typecheck": "tsc --noEmit" } }
```

## NODE-SETUP-7 Import built-in modules with the `node:` prefix.

The prefix makes it obvious that a module is built in, and a package on npm with the same name can never shadow it. Newer modules such as `node:test` and `node:sqlite` only exist under the prefix.

Official: Node.js docs ("This module is only available under the `node:` scheme").

```ts
// bad
import { readFile } from 'fs/promises';
// good
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
```

## NODE-SETUP-8 Use a stable built-in before adding a dependency for the same job.

Every dependency is code you must audit and update, and an account someone can compromise. The built-ins below are stable on Node 24 and 26. Don't depend on the release-candidate or experimental ones in production.

Official: stability indices in the Node.js API docs (v24.22.0 and v26.12.0, checked 2026-10-19):

| Instead of | Use | Stable since |
|---|---|---|
| `nodemon` | `node --watch` | v22.0.0, v20.13.0 |
| `dotenv` (local development) | `node --env-file=.env` or `process.loadEnvFile()` | `loadEnvFile`: v24.10.0, v22.21.0 |
| `node-fetch`, `axios` for simple calls | global `fetch` | v21.0.0 (global since v18) |
| `minimist`, `yargs` for simple CLIs | `util.parseArgs` | v20.0.0 |
| `chalk`, `kleur` | `util.styleText` (respects `NO_COLOR`) | v23.5.0, v22.13.0 |
| `glob`, `fast-glob` | `fs.glob`, `fsPromises.glob` | v24.0.0 |
| `mocha`, `tap` | `node:test` (NODE-TEST-1) | v20.0.0 |
| `node:sqlite` | Release candidate (1.2) since v25.7.0; not stable yet. It had a security fix in July 2026 | |

```ts
// bad
import chalk from 'chalk';
import { glob } from 'glob';
console.log(chalk.red('failed'));
for (const file of await glob('src/**/*.ts')) lint(file);

// good
import { glob } from 'node:fs/promises';
import { styleText } from 'node:util';
console.log(styleText('red', 'failed'));
for await (const file of glob('src/**/*.ts')) lint(file);
```
