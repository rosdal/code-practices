# Appendix

Sources, status, and caveats behind the React rules. This page has no rule IDs.

Last reviewed 2026-10-19. Re-check when React 19.4 or 20, or React Compiler 2, ships.

## Status (October 2026)

| Item | Status | Rules |
|---|---|---|
| React 19.3 | Current; npm `latest` is 19.3.1 (14 October 2026). `<ViewTransition>` and Fragment Refs stable | REACT-PERF-4 |
| React 19.2 (October 2025) | Added `<Activity>` and `useEffectEvent` | REACT-PERF-7, REACT-EFFECT-5 |
| React 19 (December 2024) | Actions, `useActionState`, `useOptimistic`, `use()`, `ref` as a prop, `<Context>` as provider, stable Server Components | REACT-API-2, -3, -6, REACT-FORM-1, -2, REACT-SERVER-* |
| React Compiler 1.0 | Stable since 7 October 2025; React 17+ | REACT-SETUP-3, REACT-PERF-1, -2 |
| `eslint-plugin-react-hooks@latest` | Compiler-powered rules in the recommended preset; `eslint-plugin-react-compiler` redundant | REACT-SETUP-4 |
| Create React App | Deprecated for new apps, 14 February 2025 | REACT-SETUP-2 |
| `forwardRef` | Not needed; deprecation announced, no date | REACT-API-2 |
| `<Context.Provider>` | Still works; deprecation announced, no date | REACT-API-3 |
| RSC advisories | CVE-2025-55182 (RCE, CVSS 10.0), CVE-2025-55183, -55184, -67779, CVE-2026-23864 | REACT-SETUP-5, REACT-SERVER-5 |

## Outdated advice

Don't follow these, even though they are still common in tutorials and older code:

| Outdated | Instead |
|---|---|
| Class components for new code | Function components (REACT-API-1) |
| `forwardRef`, `defaultProps`, `propTypes` on function components | `ref` as a prop, parameter defaults, TypeScript (REACT-API-2) |
| `ReactDOM.useFormState` | `useActionState` (REACT-FORM-1) |
| Create React App | A framework, or Vite/Parcel/Rsbuild (REACT-SETUP-1, -2) |
| `useMemo`/`useCallback`/`memo` everywhere | React Compiler (REACT-PERF-1) |
| `eslint-plugin-react-compiler` | `eslint-plugin-react-hooks@latest` (REACT-SETUP-4) |
| Fetching in `useEffect` as the default | Framework loaders, Server Components, or a data library (REACT-EFFECT-4) |

## Sources

Every rule labeled **Official** cites React team material (react.dev, the React blog) or, for the testing and INP rules, Testing Library's docs and web.dev. That makes the guidance authoritative but not independent: "production-ready" and "without impacting performance" are the vendor's own words.

How each source was checked:

- **Adversarially verified** (3 independent checks against the original text): React 19, 19.2 and 19.3 release posts; React Compiler v1.0 post; the `use`, `Activity`, `forwardRef` and `useActionState` references; the React 19 upgrade guide; *You Might Not Need an Effect*; the `'use server'` reference (for the "no directive for Server Components" point).
- **Quoted from the fetched page, not separately verified**: *Choosing the State Structure*, *Preserving and Resetting State*, *Managing State*, the `useSyncExternalStore` reference, the rest of the `'use server'` reference (untrusted arguments, mutations only, progressive enhancement), *Creating a React App*, *Sunsetting Create React App*, the two RSC security advisories, Testing Library's *About Queries*, and web.dev's *Optimize INP*. These are primary sources and the rules quote them, but the claims did not go through the 3-vote check.
- **From general knowledge, not the research run**: the `Component` reference's recommendation of function components (REACT-API-1), *Rendering Lists* on index keys (REACT-API-5), *Removing Effect Dependencies* (REACT-EFFECT-6), the `useTransition`/`useDeferredValue`/`lazy` references (REACT-PERF-4, -6), `user-event` over `fireEvent` (REACT-TEST-3), and WCAG (REACT-FORM-3). Check them against the current pages before citing them in a dispute.

Refuted during research and deliberately left out: the claim that `eslint-plugin-react-hooks` switched its `recommended` preset to flat config alongside React 19.2 and requires `recommended-legacy` for old configs (0-3). Check the plugin's README for the current config form.

## Contested points and recommended stances

| Topic | Positions | Recommended stance |
|---|---|---|
| External state libraries | react.dev prefers built-in state "when possible"; the ecosystem has many store libraries | Built-in state and context by default; a store when you can name the problem it solves (REACT-STATE-8) |
| Data fetching outside a framework | `use()` with a cached promise, TanStack Query, SWR, or Effects | A query library or framework loader; Effects only with stale-response handling (REACT-EFFECT-4) |
| Removing manual memoization | Compiler makes it redundant vs. removal can change behavior | Keep it in existing code; remove only in tested, separate changes (REACT-PERF-2) |
| `React.memo` with the compiler | The verified sources discuss `useMemo`/`useCallback`, not `memo` explicitly | Treat `memo` like the others: unnecessary in new compiled code |
| Suspense boundary placement | A design choice; no official rule | One boundary per independently loading section (REACT-SERVER-6) |

## Open questions

- Does react.dev now state explicitly whether `React.memo` is still needed with the compiler?
- Which compiler-powered lint rules are in the recommended preset beyond `set-state-in-render`, `set-state-in-effect` and `refs`?
- Will the React team publish guidance on data fetching outside frameworks (cached `use()` promises vs. libraries)?
