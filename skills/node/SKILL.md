---
name: node
description: Use when writing, reviewing, or running Node.js server, CLI, or library code, and when setting up or changing package.json, a lockfile, .npmrc, pnpm-workspace.yaml, .nvmrc/.node-version, a Dockerfile for a Node app, or CI that installs or publishes npm packages. Also use when choosing a Node version, a package manager, or a test runner, when adding a dependency a built-in might replace, when handling process signals, unhandled rejections, streams, or timeouts, and when blocking work, worker threads, cluster, or container memory come up.
---

# Node.js

Each line is one rule from the Rosdal Node.js guide (Node 24/26). The ID links to the full rule, with its reason, source and examples, in `docs/node/` of https://github.com/rosdal/code-practices. Cite IDs in review comments ("see NODE-ERR-5").

Framework-agnostic: in Express, Fastify, NestJS or similar, use the framework's mechanism for each rule. For TypeScript itself use the `typescript` skill. In an existing codebase with its own conventions, consistency wins: apply these to new code and when refactoring. Check the project's Node version before using 24/26 features.

## Judgment: apply while writing

### Async and errors

- [NODE-ERR-1] Use promise APIs (`node:fs/promises`, `node:stream/promises`, `node:timers/promises`, `events.once`). Not callbacks.
- [NODE-ERR-2] Let unhandled rejections crash (default `throw`). No handler that only logs; never `--unhandled-rejections=warn|none`.
- [NODE-ERR-3] After `uncaughtException`: log, synchronous cleanup, `process.exit(1)`. Never resume.
- [NODE-ERR-4] Attach an `'error'` listener to every emitter/stream/child process you create.
- [NODE-ERR-5] Connect streams with `pipeline` from `node:stream/promises`. Not `.pipe()`.
- [NODE-ERR-6] Give every outgoing call a timeout: `AbortSignal.timeout()`, combined via `AbortSignal.any()`.
- [NODE-ERR-7] Set `process.exitCode`; no `process.exit()` in normal code.
- [NODE-ERR-8] On `SIGTERM`: `server.close()`, `closeAllConnections()` after a deadline, close pools, exit.

### Performance

- [NODE-PERF-1] Never block the event loop: no `*Sync` APIs, unbounded `JSON.parse`, or ReDoS-prone regexes on request paths.
- [NODE-PERF-2] CPU-heavy JS goes to a fixed worker-thread pool (e.g. Piscina). Not the main thread, not one worker per task.
- [NODE-PERF-3] Scale with replicas behind the orchestrator. Not `cluster`.
- [NODE-PERF-4] In containers, set `--max-old-space-size` to about 75% of the memory limit; never raise it to hide a leak.

### Security

- [NODE-SEC-1] Apply Node security releases within days (`nodejs-sec` list); don't pin a patch tag forever.
- [NODE-SEC-2] Block dependency install scripts; allow by name (pnpm `allowBuilds`, npm `ignore-scripts=true`).
- [NODE-SEC-3] Keep pnpm's `minimumReleaseAge` (1 day) and `blockExoticSubdeps`; exempt single packages only.
- [NODE-SEC-4] Publish with npm trusted publishing (OIDC). No long-lived tokens in CI.
- [NODE-SEC-5] Fail CI on `npm audit`/`pnpm audit --audit-level=high`.
- [NODE-SEC-6] `--permission` is defence in depth, not a sandbox for untrusted code.

### Runtime

- [NODE-RUN-1] `NODE_ENV=production` in every deployed environment, staging included; never branch app code on it.
- [NODE-RUN-2] Config from env vars, validated once at startup; `--env-file`/`process.loadEnvFile()` locally, not `dotenv`; never commit `.env`.
- [NODE-RUN-3] Structured JSON logs (pino) to stdout; transports off the main thread; log errors as `{ err }`.
- [NODE-RUN-4] Load OpenTelemetry with `node --import ./instrumentation.ts` before the app.

### Testing

- [NODE-TEST-1] `node:test` by default; Vitest when you need stable coverage or module mocks; not Jest for new ESM projects.
- [NODE-TEST-2] CI on the production Node version; libraries on every `engines` line plus the next.

## Setup: when creating or changing project config

- [NODE-SETUP-1] Production on LTS only. New apps: Node 26; minimum 24. Libraries may keep `^22.12.0` until April 2027. No `engines` floor that allows 20 or 25.
- [NODE-SETUP-2] Pin the Node major in `.nvmrc`/`.node-version`; use it in CI and the image tag. Never `node:latest`.
- [NODE-SETUP-3] Commit the lockfile; `npm ci` / `pnpm install --frozen-lockfile` in CI and deploys.
- [NODE-SETUP-4] One package manager, pinned in `packageManager`; install it explicitly (Corepack isn't bundled from v25).
- [NODE-SETUP-5] Write ESM with explicit `"type": "module"`; CJS consumers can `require()` it (no top-level await).
- [NODE-SETUP-6] Run `.ts` with Node type stripping (erasable syntax only), not ts-node; keep `tsc --noEmit` in CI.
- [NODE-SETUP-7] Import built-ins with `node:`.
- [NODE-SETUP-8] Prefer stable built-ins: `--watch`, `--env-file`, `fetch`, `util.parseArgs`, `util.styleText`, `fs.glob`, `node:test`. `node:sqlite` is not stable yet.
- [NODE-RUN-5] Docker: exec-form `CMD ["node", …]` (not `npm start`), `--init`/Tini, `USER node`, `NODE_ENV=production`.
