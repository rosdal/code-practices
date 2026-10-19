---
name: react
description: Use when writing, reviewing, or refactoring React components, hooks, or pages (.jsx, .tsx), and when setting up a React project, enabling React Compiler, configuring eslint-plugin-react-hooks, or working with Server Components and Server Functions. Also use when a useEffect, useMemo, useCallback, or memo is being added, when choosing where state lives, when handling a form submission, when a list or interaction is slow, and when writing React Testing Library tests.
---

# React

Each line is one rule from the Rosdal React guide (React 19.3, React Compiler 1.x). The ID links to the full rule, with its reason, source and examples, in `docs/react/` of https://github.com/rosdal/code-practices. Cite IDs in review comments ("see REACT-EFFECT-1").

For typing components, props, hooks and events, also load the `typescript` skill (TS-13). In an existing codebase with its own conventions, consistency wins: apply these to new code and when refactoring.

## Judgment: apply while writing

### Effects

- [REACT-EFFECT-1] Use an Effect only to sync with something outside React. Not to compute values or copy props/state into state.
- [REACT-EFFECT-2] Put logic caused by a user action in its event handler. Not in an Effect watching state.
- [REACT-EFFECT-3] Subscribe to external stores and browser values with `useSyncExternalStore`, with `subscribe` declared outside the component.
- [REACT-EFFECT-4] Fetch through the framework, a Server Component, or a query library. If fetching in an Effect, ignore stale responses in the cleanup.
- [REACT-EFFECT-5] Use `useEffectEvent` for non-reactive logic inside an Effect. Never to silence `exhaustive-deps`.
- [REACT-EFFECT-6] Never disable `exhaustive-deps`; restructure the Effect.

### State

- [REACT-STATE-1] Compute derived values during render. Not in state.
- [REACT-STATE-2] Don't copy a prop into state unless later changes should be ignored; then name it `initialX`.
- [REACT-STATE-3] Model mutually exclusive states as one `status` value. Not several booleans.
- [REACT-STATE-4] Store IDs, not copies of objects held elsewhere in state. Prefer flat state.
- [REACT-STATE-5] Keep state close to where it is used; lift it to the closest common parent only when siblings share it.
- [REACT-STATE-6] Reset a component's state by changing its `key`. Not with an Effect.
- [REACT-STATE-7] Move state logic spread across many handlers into a reducer; add context when deep children dispatch.
- [REACT-STATE-8] Use built-in state and context first. An external store only for a named re-render or coupling problem. Server data never goes in a client store.

### Components and APIs

- [REACT-API-1] Write function components. Not classes (except error boundaries).
- [REACT-API-2] Take `ref` as a prop; use parameter defaults. Not `forwardRef`, `defaultProps` or `propTypes`.
- [REACT-API-3] Render `<Context value>` as the provider. Not `<Context.Provider>`.
- [REACT-API-4] Declare components at module top level. Never inside another component.
- [REACT-API-5] Key list items by a stable ID from the data. Not the index when items can move.
- [REACT-API-6] Pass `use()` a promise created outside render (loader, parent, Server Component, cache). Handle rejection with an error boundary.

### Forms and Actions

- [REACT-FORM-1] Handle submissions with an Action and `useActionState`. Not hand-rolled loading/error state. Never `ReactDOM.useFormState`.
- [REACT-FORM-2] Show optimistic results with `useOptimistic`. Not manual write-then-undo.
- [REACT-FORM-3] Give every input a visible `<label>`, tie errors with `aria-describedby`, announce them with `role="alert"`, and use native elements.

### Server Components and Server Functions

- [REACT-SERVER-1] Keep components on the server by default; put `'use client'` as low in the tree as possible.
- [REACT-SERVER-2] Use `'use server'` only for Server Functions, and only for mutations. Not for reading data, and not to mark Server Components.
- [REACT-SERVER-3] Validate every Server Function argument and check authorization inside the function. It is a public endpoint.
- [REACT-SERVER-4] Pass Server Functions to `<form action>` for progressive enhancement; outside forms, call them in a Transition.
- [REACT-SERVER-5] Never hardcode secrets in server code; read them from runtime config.
- [REACT-SERVER-6] Give each independently loading section its own `<Suspense>` and error boundary; start independent requests in parallel.

### Performance

- [REACT-PERF-1] With the compiler on, don't write `useMemo`/`useCallback`/`memo` in new code, except to keep an Effect dependency stable.
- [REACT-PERF-2] In existing code, keep manual memoization; remove it only in separate, tested changes.
- [REACT-PERF-3] Measure INP from real users; target 200 ms or less at p75, split by mobile and desktop.
- [REACT-PERF-4] Mark heavy, non-urgent updates with `startTransition` or `useDeferredValue`. `<ViewTransition>` only animates Transition updates.
- [REACT-PERF-5] Virtualize long lists.
- [REACT-PERF-6] Split by route; `lazy()` heavy components not needed at first paint.
- [REACT-PERF-7] Use `<Activity mode="hidden">` to keep or pre-render UI the user will return to; clean up DOM side effects in Effects.

### Testing

- [REACT-TEST-1] Query by role first; `getByTestId` last.
- [REACT-TEST-2] Wait for async UI with `findBy`; use `queryBy` only to assert absence; query through `screen`.
- [REACT-TEST-3] Simulate interactions with `userEvent.setup()`. Not `fireEvent`.
- [REACT-TEST-4] Test what the component renders and does. Don't mock your own child components or inspect state; mock the network at the boundary.
- [REACT-TEST-5] Cover a few critical flows with browser E2E tests.

## Setup: when creating or changing project config

- [REACT-SETUP-1] Start new apps with a framework: Next.js, React Router (framework mode), or Expo.
- [REACT-SETUP-2] Without a framework, use Vite, Parcel or Rsbuild. Never Create React App.
- [REACT-SETUP-3] Enable React Compiler in new projects.
- [REACT-SETUP-4] Use `eslint-plugin-react-hooks@latest` with its recommended preset; remove `eslint-plugin-react-compiler`. Don't turn its rules off.
- [REACT-SETUP-5] Pin React Server Components framework packages exactly and patch the day an advisory ships. Hosting firewall rules are not a fix.
