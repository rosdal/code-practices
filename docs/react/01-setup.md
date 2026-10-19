# 1. Setup

How to start and configure a React project in 2026: framework, build tool, compiler, and lint rules. For TypeScript config, see [TS-1](../typescript/01-config.md).

Each rule says whether it is official React team guidance or convention. Sources are in the [appendix](appendix.md#sources).

## REACT-SETUP-1 Start new apps with a framework: Next.js, React Router, or Expo.

Routing, data fetching, code splitting and server rendering are problems every real app hits, and a framework solves them together. Building them yourself on a bare bundler usually ends with data fetched in Effects (network waterfalls) and one large bundle.

Official: react.dev recommends "starting with a framework" and names Next.js (App Router), React Router (v7, framework mode, on Vite) and Expo (native and web). TanStack Start and RedwoodSDK are listed as up-and-coming.

```text
// bad
npm create vite@latest my-app -- --template react   (then add routing, data loading, SSR by hand)

// good
npx create-next-app@latest
npx create-react-router@latest
npx create-expo-app@latest
```

## REACT-SETUP-2 Without a framework, use Vite, Parcel or Rsbuild. Never Create React App.

The React team deprecated Create React App for new apps on 14 February 2025. It has no active maintainers and only runs in maintenance mode. Migrate existing CRA apps to a framework or to Vite.

Official: React blog, *Sunsetting Create React App* (2025).

```text
// bad
npx create-react-app my-app

// good: a widget embedded in an existing page, so no framework
npm create vite@latest my-widget -- --template react-ts
```

## REACT-SETUP-3 Turn on React Compiler in new projects.

The compiler memoizes components and hooks at build time, so you don't have to decide where `useMemo`, `useCallback` and `memo` go (see [REACT-PERF-1](05-performance.md#react-perf-1-let-react-compiler-memoize-not-manual-usememo-usecallback-and-memo)). It works with React 17 and up; versions before 19 need a `target` setting and the `react-compiler-runtime` package.

Official: React Compiler 1.0 has been stable since 7 October 2025. The React team calls it production-ready and says it has been tested on major apps at Meta. That is the team's own assessment of its own tool. Meta reports up to 12% faster initial loads in one app; independent tests have found smaller gains.

```jsonc
// bad: compiler off, memoization by hand everywhere
// good: babel.config.json (Next.js and Expo have their own switch for this)
{ "plugins": ["babel-plugin-react-compiler"] }
```

## REACT-SETUP-4 Use `eslint-plugin-react-hooks@latest` with its recommended preset. Remove `eslint-plugin-react-compiler`.

The recommended preset includes the classic `rules-of-hooks` and `exhaustive-deps` rules plus compiler-powered rules (such as `set-state-in-render`, `set-state-in-effect` and `refs`) that flag the patterns in [REACT-EFFECT](04-effects.md). The linter works without the compiler installed, so every project can upgrade.

Official: React blog, *React Compiler v1.0* (2025): "We recommend everyone upgrade today." The separate `eslint-plugin-react-compiler` is now redundant.

```text
// bad
eslint-plugin-react-compiler installed alongside an old eslint-plugin-react-hooks,
with react-hooks/exhaustive-deps turned off.

// good
eslint-plugin-react-hooks@latest, its recommended preset extended as the plugin's
README shows for your config format, and no rules from it turned off.
```

## REACT-SETUP-5 Patch React Server Components packages as soon as an advisory ships.

RSC frameworks parse requests from the network on the server, so a bug there is a server vulnerability, not a UI bug. The bundler-level packages (`react-server-dom-*`) do not follow semver, so pin exact versions and update deliberately. Hosting-provider firewall rules are not a fix.

Official: CVE-2025-55182 (December 2025) was unauthenticated remote code execution, CVSS 10.0, in any app that supports Server Components, even one with no Server Functions. Affected: `next`, `react-router`, `waku`, `@parcel/rsc`, `@vitejs/plugin-rsc`, `rwsdk`. Follow-ups CVE-2025-55183, CVE-2025-55184, CVE-2025-67779 and CVE-2026-23864 (source exposure and denial of service) followed into January 2026. The React team: "You should not depend on these [hosting mitigations] to secure your app, and still update immediately."

```text
// bad
"next": "^15.0.0"     and a WAF rule instead of an upgrade

// good
"next": "<exact>"     exact pin, Dependabot/Renovate security alerts on,
                      patched version deployed the day an advisory ships
```
