# 4. Security

Patching Node itself, defending against compromised packages, publishing safely, and what the permission model does and doesn't do. For input validation and injection, see [TS-21](../typescript/21-security.md) and [TS-19.5](../typescript/19-runtime.md).

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## NODE-SEC-1 Subscribe to `nodejs-sec`, and ship Node security releases within days.

The Node.js project pre-announces security releases about a week ahead on the low-volume `nodejs-sec` mailing list and publishes an advisory on nodejs.org/en/blog/vulnerability. Releases cover every supported line at once (for example March, June and July 2026, and one due on 21 October 2026), and end-of-life lines are always counted as affected. Rebuild images on the new patch version; a pinned `node:24.18.0` tag never receives fixes.

Official: nodejs.org security release announcements.

```text
// bad
FROM node:24.18.0   (pinned patch, never updated)

// good
FROM node:24-bookworm-slim, rebuilt when a security release ships
Renovate or Dependabot opens the update; nodejs-sec announces it
```

## NODE-SEC-2 Don't let dependencies run install scripts unless you allowed them by name.

A `postinstall` script runs arbitrary code on every developer machine and CI runner that installs the package. That is how the Shai-Hulud worm (September 2025, with a larger wave in November) stole tokens and spread through more than 500 packages. pnpm 10+ no longer runs dependency scripts automatically, and pnpm 11 uses an `allowBuilds` allowlist. With npm, set `ignore-scripts=true` and run the scripts you need yourself.

Official: GitHub's Shai-Hulud post-mortem; pnpm *Supply chain security* docs. The npm setting is from the npm docs, not this research run.

```yaml
# bad (pnpm-workspace.yaml): allow everything
allowBuilds:
  '*': true

# good
allowBuilds:
  esbuild: true
  sharp: true
```

## NODE-SEC-3 Don't install package versions published in the last day.

Compromised versions are usually detected and pulled within hours. Waiting a day before installing a new version keeps most of them out. pnpm 11 does this by default (`minimumReleaseAge: 1440`, in minutes) and blocks dependencies from git or tarball URLs (`blockExoticSubdeps`). Don't turn either off globally; list exceptions for a security fix you need now.

Official: pnpm 11 docs. Whether npm has an equivalent setting was not verified.

```yaml
# bad (pnpm-workspace.yaml)
minimumReleaseAge: 0

# good: keep the default; exempt one urgent fix
minimumReleaseAgeExclude:
  - some-package
```

## NODE-SEC-4 Publish packages with npm trusted publishing (OIDC). No long-lived tokens in CI.

A token stored in CI is exactly what the 2025 worms stole. Trusted publishing (generally available since 31 July 2025) lets CI publish with a short-lived OIDC identity and adds provenance automatically. It needs npm CLI 11.5.1+ and runs on GitHub Actions, GitLab.com and CircleCI. npm revoked all classic tokens in November and December 2025; granular write tokens now last at most 90 days and enforce 2FA by default.

Official: GitHub changelog and npm *Trusted publishers* docs.

```yaml
# bad (GitHub Actions)
- run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

# good: package configured for trusted publishing on npmjs.com
permissions:
  id-token: write
steps:
  - run: npm publish
```

## NODE-SEC-5 Fail CI on known-vulnerable dependencies.

`npm audit` and `pnpm audit` check the locked versions against the GitHub Advisory Database and exit non-zero. Fail on `high` and above, and review the rest on a schedule, so the build doesn't get ignored for noise.

Convention; the commands are from npm and pnpm docs.

```text
// bad
no audit step; advisories are noticed when someone reads the news

// good
CI: pnpm audit --audit-level=high   (or npm audit --audit-level=high)
```

## NODE-SEC-6 Treat the permission model as a seat belt, not a sandbox.

`--permission` is stable since v23.5.0 and v22.13.0. It denies file system, child process, worker, network, addon and WASI access unless you allow it (`--allow-fs-read=…`, `--allow-net`, …). The docs say it "does not protect against malicious code": it follows symlinks outside granted paths, existing file descriptors bypass it, and worker threads don't inherit it. Use it to catch your own code reaching where it shouldn't. Isolating untrusted code takes a container or VM.

Official: Node.js *Permissions* docs. Three permission-model CVEs were fixed in July 2026.

```text
// bad: running an untrusted plugin with --permission and calling it isolated

// good: defence in depth for your own service
node --permission --allow-fs-read=/app --allow-net src/server.ts
```
