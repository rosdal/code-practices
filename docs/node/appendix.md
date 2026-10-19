# Appendix

Version status, outdated advice, sources and caveats behind the Node.js rules. This page has no rule IDs.

Last reviewed 2026-10-19. Re-check when the Release WG schedule changes. Dates already due: 24.x enters Maintenance on 20 October 2026 and 26.x becomes Active LTS on 28 October 2026. Also re-check when Node 27's Alpha channel opens (28 October 2026), when `node:sqlite`, test coverage or `mock.module()` change stability, and when a new pnpm or Jest major ships.

## Status (October 2026)

| Item | Status | Rules |
|---|---|---|
| Node 26 | Current; Active LTS from 28 Oct 2026; EOL 30 Apr 2029; last line on the odd/even model | NODE-SETUP-1 |
| Node 24 | Active LTS; Maintenance from 20 Oct 2026; EOL 30 Apr 2028 | NODE-SETUP-1 |
| Node 22 | Maintenance LTS; EOL 30 Apr 2027 | NODE-SETUP-1 |
| Node 27 | Alpha from 28 Oct 2026; 27.0.0 on 22 Apr 2027; LTS 20 Oct 2027; EOL 30 Apr 2030 (provisional) | NODE-SETUP-1 |
| Type stripping | Stable since v25.2.0 / v24.12.0; `--experimental-transform-types` still experimental | NODE-SETUP-6 |
| `require(esm)` | Unflagged since v22.12.0 and v20.19.0; throws `ERR_REQUIRE_ASYNC_MODULE` for top-level await | NODE-SETUP-5 |
| Corepack | Not bundled from v25; Experimental in v24 | NODE-SETUP-4 |
| Permission model | Stable since v23.5.0 / v22.13.0; not a sandbox | NODE-SEC-6 |
| `node:sqlite` | Release candidate (1.2) since v25.7.0 | NODE-SETUP-8 |
| `node:test` | Stable since v20; snapshots stable since v23.4.0; mock timers stable since v23.1.0; coverage Experimental; `mock.module()` Early development; test watch mode Experimental | NODE-TEST-1 |
| `diagnostics_channel` | Stable since v19.2.0 / v18.13.0; `TracingChannel` and the built-in channels are Experimental | NODE-RUN-4 |
| pnpm | 11 (28 Apr 2026): `allowBuilds`, `minimumReleaseAge` 1 day by default, `blockExoticSubdeps` on, requires Node 22+ | NODE-SEC-2, -3 |
| npm tokens | Classic tokens revoked (Nov-Dec 2025); granular write tokens max 90 days with 2FA by default; `npm login` gives 2-hour sessions | NODE-SEC-4 |
| Jest | 30.x; ESM support still experimental | NODE-TEST-1 |

## Outdated advice

| Outdated | Instead |
|---|---|
| `nodemon` | `node --watch` (NODE-SETUP-6, -8) |
| `ts-node`, `tsx` for erasable code | Node type stripping (NODE-SETUP-6) |
| `dotenv` | `--env-file`, `process.loadEnvFile()` (NODE-RUN-2) |
| `node-fetch`, `request` | Global `fetch` (NODE-SETUP-8) |
| `chalk`, `glob`, `minimist` for simple cases | `util.styleText`, `fs.glob`, `util.parseArgs` (NODE-SETUP-8) |
| `NODE_ENV=development`/`staging` switches | `NODE_ENV=production` everywhere; explicit config (NODE-RUN-1) |
| `cluster` to use all cores | Replicas behind the orchestrator; worker threads for CPU work (NODE-PERF-2, -3) |
| `corepack enable` as the setup step | Install the pinned package manager explicitly (NODE-SETUP-4) |
| Long-lived `NPM_TOKEN` secrets | Trusted publishing (NODE-SEC-4) |
| `CMD npm start` | `CMD ["node", …]` with `--init` (NODE-RUN-5) |
| `process.on('unhandledRejection', log)` | Let it crash (NODE-ERR-2) |
| `--experimental-strip-types`, `--experimental-permission`, `--experimental-sqlite` | Not needed on 24/26; the first two are stable, sqlite is unflagged |
| `engines: ">=18"` or `">=20"` | `>=24` for apps; `^22.12.0 \|\| >=24` for libraries (NODE-SETUP-1) |

## Sources

How each source was checked (two research runs, 2026-10-19):

- **Adversarially verified** (3 independent checks against the fetched text): Release WG README and `schedule.json`; nodejs.org *Evolving the Node.js release schedule*; release notes for v20.13.0, v20.19.0, v21.7.0, v22.12.0 and v25.2.0; API docs *Modules: TypeScript*, *Permissions*, *SQLite*, *Util* (`parseArgs`, `styleText`), *File system* (`glob`), *process* (`loadEnvFile`, `uncaughtException`, `--unhandled-rejections`), *Events*, *Globals* (`AbortSignal.timeout`), *HTTP* (`close`, `closeAllConnections`), *Test runner*; v24 *Corepack* docs; nodejs.org *Difference between development and production*; GitHub's Shai-Hulud post and trusted-publishing changelog; npm *Trusted publishers*; nodejs/docker-node *Best practices*.
- **Verified 2-1** (one verifier dissented): Red Hat Developer, *Node.js 20 memory management in containers* (October 2025) (NODE-PERF-4); the "no runtime settings needed" reading of the NODE_ENV page.
- **Quoted from the fetched page, not separately verified**: nodejs.org *Don't Block the Event Loop*; Worker threads docs; `AbortSignal.any`, `events.on`, `process.exitCode` and `SIGTERM` default-handler sections; `diagnostics_channel` docs; pnpm 11 release notes and *Supply chain security* page; GitHub changelogs on npm classic-token revocation and granular-token limits; Node.js security release announcements (June, July and October 2026) and the `nodejs-sec` list; OpenTelemetry JS *Getting started: Node.js*; Pino *Transports* docs; Jest 30 *ECMAScript Modules* docs; nodejs.org *Releases* page; a blog post arguing against `cluster` (pavel-romanov.com).
- **From general knowledge, not the research run**: `stream.pipeline` vs `.pipe()` (NODE-ERR-5); `npm ci` and `--frozen-lockfile` behaviour (NODE-SETUP-3); npm `ignore-scripts` (NODE-SEC-2); `npm audit`/`pnpm audit` flags (NODE-SEC-5); `fetch` becoming stable in v21.0.0; `--env-file-if-exists` (seen in v20.19.0 notes, not verified); Kubernetes' 30-second grace period; Piscina; `os.availableParallelism()`; `pnpm minimumReleaseAgeExclude`.

Refuted during research and deliberately left out:

- "GitHub plans seven-day lifetimes for publishing tokens and disallows tokens for publishing by default" (0-3). What shipped is the 90-day cap and 2FA default in NODE-SEC-4.
- "Anyone relying on Corepack has to install it separately from the userland package" (0-3, apparently over wording). NODE-SETUP-4 says to install the package manager explicitly instead.
- A blog claim that `node:test` had no watch mode before v23. `node --test --watch` exists, though test-runner watch mode is still Experimental.

TypeScript and JSONC examples are checked by `pnpm check`. YAML, Dockerfile and `text` blocks are not.

## Contested points and recommended stances

| Topic | Positions | Recommended stance |
|---|---|---|
| Node 24 vs 26 for new apps | 26 is LTS from 28 Oct 2026 with a year more support; some advise waiting for 26.x to mature | 26 for new apps; 24 is fine until its Maintenance ends (NODE-SETUP-1) |
| npm vs pnpm vs Yarn | All maintained; pnpm 11 has the strongest supply-chain defaults | One per repo; pnpm for new projects (NODE-SETUP-4) |
| `cluster` | Some still recommend it for single-host deploys | Orchestrator replicas; `cluster` only without one (NODE-PERF-3) |
| `node:test` vs Vitest | Vitest has stable coverage and module mocking; `node:test` has no dependencies | `node:test` by default; Vitest when coverage or module mocks are needed (NODE-TEST-1) |
| Heap size | Default heap vs an explicit limit | Explicit, about 75% of the container limit (NODE-PERF-4) |
| Running `.ts` in production | Type stripping makes it possible; a build step gives faster start-up and one artefact | Either; keep `tsc --noEmit` in CI regardless (NODE-SETUP-6) |

## Open questions

- Does npm have a stable minimum-release-age setting equivalent to pnpm's?
- When will `node:test` coverage and `mock.module()` become stable, and will `node:sqlite` reach Stable in 26.x?
- What are the current stability levels of `node --run` and the `--env-file` flag (as opposed to `process.loadEnvFile()`)?
- [TS-16](../typescript/16-library-authoring.md) still shows `"engines": { "node": ">=20.19" }`; Node 20 is end of life.
