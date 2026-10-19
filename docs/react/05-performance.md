# 5. Performance

Where React apps get slow and what to do about it. Measure before and after; most of these rules matter only when a measurement says they do.

Each rule says whether it is official React team guidance, other official guidance (web.dev), or convention. Sources are in the [appendix](appendix.md#sources).

## REACT-PERF-1 Let React Compiler memoize. Not manual `useMemo`, `useCallback` and `memo`.

With the compiler on ([REACT-SETUP-3](01-setup.md#react-setup-3-turn-on-react-compiler-in-new-projects)), hand-written memoization is noise in new code: the compiler usually memoizes at least as precisely, including after early returns where hooks can't be used. Keep `useMemo`/`useCallback` as escape hatches, mainly to keep a value used as an Effect dependency stable.

Official: React Compiler v1.0 post (2025): "For new code, we recommend relying on the compiler for memoization and using `useMemo`/`useCallback` where needed to achieve precise control." Without the compiler, the old advice still holds: memoize only what a profile shows is slow.

```tsx
// bad (compiler on)
const sorted = useMemo(() => sortBy(items, key), [items, key]);
const handleClick = useCallback(() => select(id), [id]);
// good
const sorted = sortBy(items, key);
const handleClick = () => select(id);
```

## REACT-PERF-2 In existing code, leave manual memoization in place unless you test its removal.

Removing `useMemo` or `useCallback` can change what the compiler outputs, and an Effect that depended on a stable reference may start firing repeatedly. Remove it in a separate change, with tests, not as part of a feature.

Official: React Compiler v1.0 post.

```text
// bad
"Enable compiler + delete every useMemo in the codebase" as one PR

// good
PR 1: enable the compiler.
PR 2..n: remove memoization module by module, with the module's tests passing.
```

## REACT-PERF-3 Measure interaction latency (INP) in the field. Keep it at 200 ms or less at the 75th percentile.

Interaction to Next Paint is the Core Web Vital for responsiveness, and slow React renders show up there. Lab profiling on a fast laptop hides problems that real users on mid-range phones hit. Collect it from real users, split by mobile and desktop.

Official (web.dev): INP is "good" at 200 ms or less and "poor" above 500 ms, measured at the 75th percentile of page loads.

```text
// bad
"It feels fast on my machine."

// good
web-vitals reports INP from production; the dashboard shows p75 mobile INP per route, with an alert at 200 ms.
```

## REACT-PERF-4 Mark non-urgent updates as Transitions so typing and clicking stay responsive.

An update that renders a lot (filtering a big list, switching tabs) blocks the next keystroke unless React knows it can be interrupted. `startTransition` or `useDeferredValue` lets urgent updates go first. The same marking also controls `<ViewTransition>` animations (React 19.3) and lets `<Suspense>` keep the old UI visible instead of falling back.

Official: react.dev `useTransition` and `useDeferredValue` references; React 19.3 release post.

```tsx
// bad: every keystroke re-renders 5,000 rows before the input updates
<>
  <input value={query} onChange={(e) => setQuery(e.target.value)} />
  <Results query={query} />
</>;
// good
const deferredQuery = useDeferredValue(query);
<>
  <input value={query} onChange={(e) => setQuery(e.target.value)} />
  <Results query={deferredQuery} />
</>;
```

## REACT-PERF-5 Virtualize long lists. Don't render thousands of rows.

The DOM's size drives the cost of every render and every interaction. A virtualized list renders only the rows on screen. For long static content, CSS `content-visibility: auto` skips rendering what is off screen.

Official (web.dev, *Optimize INP*): a large DOM slows rendering both at load and after interactions. The choice of library is convention.

```tsx
// bad
<ul>{logLines.map((line) => <LogRow key={line.id} line={line} />)}</ul>;
// good
const virtualizer = useVirtualizer({ count: logLines.length, getScrollElement: () => parentRef.current, estimateSize: () => 24 });
```

## REACT-PERF-6 Split code by route, and lazy-load heavy components that aren't needed at first paint.

One bundle makes users download and evaluate code for pages they never visit, and evaluating a large script blocks the main thread. Frameworks split by route automatically; use `lazy()` with `<Suspense>` for large components behind an interaction (an editor, a chart).

Official: react.dev `lazy` reference and *Sunsetting Create React App* (lack of code splitting is one of CRA's listed gaps); web.dev on long tasks from script evaluation.

```tsx
// bad
import { RichTextEditor } from './RichTextEditor';
// good
const RichTextEditor = lazy(() => import('./RichTextEditor'));
<Suspense fallback={<EditorSkeleton />}>{isEditing && <RichTextEditor />}</Suspense>;
```

## REACT-PERF-7 Use `<Activity mode="hidden">` to keep or pre-render UI the user is likely to return to.

Unmounting a tab throws away its state and DOM; hiding it with CSS keeps its Effects running. `<Activity>` (React 19.2) keeps the state, re-renders hidden content at low priority, and tears down its Effects while hidden. DOM side effects such as a playing `<video>` keep going unless an Effect cleanup stops them. Pre-rendering only loads data fetched through Suspense, not data fetched in Effects.

Official: React 19.2 release post and `Activity` reference. The team gives no benchmarks; measure before relying on it for performance.

```tsx
// bad: switching tabs loses the draft and refetches
<>{tab === 'compose' && <Compose />}</>;
// good
<Activity mode={tab === 'compose' ? 'visible' : 'hidden'}><Compose /></Activity>;
```
