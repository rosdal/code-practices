# 4. Effects

When to use `useEffect`, and what to use instead. Most Effects in most codebases don't need to exist.

Each rule says whether it is official React team guidance or convention. Sources are in the [appendix](appendix.md#sources).

## REACT-EFFECT-1 Use an Effect only to synchronize with something outside React.

An Effect runs after render, so anything it computes shows up one render late, and a `setState` in it triggers a second render. Effects are for systems React doesn't control: a WebSocket, a third-party widget, a browser API, an analytics call because the component was shown. Derived values belong in render ([REACT-STATE-1](03-state.md#react-state-1-compute-derived-values-during-render-dont-store-them-in-state)); responses to user actions belong in event handlers ([REACT-EFFECT-2](#react-effect-2-put-logic-caused-by-a-user-action-in-the-event-handler-not-in-an-effect)).

Official: react.dev, *You Might Not Need an Effect*. The `set-state-in-effect` lint rule flags the common misuse.

```tsx
// bad
const [visibleTodos, setVisibleTodos] = useState([]);
useEffect(() => { setVisibleTodos(todos.filter((t) => !t.done)); }, [todos]);
// good
const visibleTodos = todos.filter((t) => !t.done);
useEffect(() => {
  const connection = createConnection(roomId);
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);
```

## REACT-EFFECT-2 Put logic caused by a user action in the event handler. Not in an Effect.

If the code runs because the user clicked or submitted, it belongs in that handler. Moving it into an Effect that watches state makes it run at other times too: on remount, in Strict Mode's double invoke, or when the state changes for another reason.

Official: react.dev, *You Might Not Need an Effect*: "If this logic is caused by a particular interaction, keep it in the event handler."

```tsx
// bad
useEffect(() => { if (submitted) post('/api/register', form); }, [submitted, form]);
// good
function handleSubmit() { post('/api/register', form); }
```

## REACT-EFFECT-3 Subscribe to external stores with `useSyncExternalStore`. Not an Effect that copies into state.

A store or browser value (`navigator.onLine`, a non-React store) can change without React knowing. Copying it into state in an Effect can tear: different components show different values during one render. Declare `subscribe` outside the component so React doesn't resubscribe every render, and provide `getServerSnapshot` when server rendering.

Official: react.dev `useSyncExternalStore` reference.

```tsx
// bad
const [isOnline, setIsOnline] = useState(true);
useEffect(() => {
  const update = () => setIsOnline(navigator.onLine);
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
}, []);
// good
function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => { window.removeEventListener('online', callback); window.removeEventListener('offline', callback); };
}
const isOnline = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
```

## REACT-EFFECT-4 Fetch data through the framework or a data library. If you must fetch in an Effect, ignore stale responses.

An Effect fetch starts only after the component renders, so nested components fetch one after another (a waterfall), and there is no caching or deduplication. When you have no alternative, the cleanup must stop a slow earlier response from overwriting a newer one.

Official: react.dev, *You Might Not Need an Effect* and *Sunsetting Create React App*, which say that frameworks provide more efficient data fetching than Effects.

```tsx
// bad
useEffect(() => { fetchResults(query).then(setResults); }, [query]);
// good: a framework loader, a Server Component, or a query library
const { data: results } = useQuery({ queryKey: ['search', query], queryFn: () => fetchResults(query) });
// acceptable when there is no alternative
useEffect(() => {
  let ignore = false;
  fetchResults(query).then((r) => { if (!ignore) setResults(r); });
  return () => { ignore = true; };
}, [query]);
```

## REACT-EFFECT-5 Use `useEffectEvent` for non-reactive logic inside an Effect. Not to silence the dependency lint.

Sometimes an Effect needs the latest value of something (the current theme for a notification) without re-running when it changes. `useEffectEvent` wraps that logic. Declare it in the same component as the Effect and leave it out of the dependency array. Wrapping a real dependency in it to make the lint go away hides a bug: the Effect stops reacting to a value it depends on.

Official: React 19.2 release post (October 2025). Requires `eslint-plugin-react-hooks@latest`, which knows not to ask for Effect Events as dependencies.

```tsx
// bad
useEffect(() => {
  const connection = createConnection(roomId);
  connection.on('connected', () => showNotification('Connected', theme));
  connection.connect();
  return () => connection.disconnect();
}, [roomId, theme]); // reconnects whenever the theme changes
// good
const onConnected = useEffectEvent(() => showNotification('Connected', theme));
useEffect(() => {
  const connection = createConnection(roomId);
  connection.on('connected', () => onConnected());
  connection.connect();
  return () => connection.disconnect();
}, [roomId]);
```

## REACT-EFFECT-6 Never disable `exhaustive-deps`. Fix the Effect instead.

A missing dependency means the Effect reads a stale value. The fix is one of: move the logic out of the Effect (REACT-EFFECT-1, -2), move the value inside it, or split non-reactive parts out with `useEffectEvent` (REACT-EFFECT-5).

Official: react.dev, *Removing Effect Dependencies*.

```tsx
// bad
useEffect(() => { connect(roomId, options); }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps
// good
useEffect(() => {
  const options = { serverUrl, roomId };
  connect(options);
}, [serverUrl, roomId]);
```
