# 3. State

What to keep in state, where to keep it, and how to shape it.

Each rule says whether it is official React team guidance or convention. Sources are in the [appendix](appendix.md#sources).

## REACT-STATE-1 Compute derived values during render. Don't store them in state.

A value you can calculate from props or other state is a second copy of the truth, and sooner or later one copy gets updated without the other. Calculate it during render; if the calculation is expensive, the compiler (or `useMemo`) caches it.

Official: react.dev, *Choosing the State Structure*: "state shouldn't contain redundant or duplicated information." The compiler-powered lint rules flag the Effect version of this ([REACT-SETUP-4](01-setup.md#react-setup-4-use-eslint-plugin-react-hooks-latest-with-its-recommended-preset-remove-eslint-plugin-react-compiler)).

```tsx
// bad
const [fullName, setFullName] = useState('');
useEffect(() => { setFullName(`${firstName} ${lastName}`); }, [firstName, lastName]);
// good
const fullName = `${firstName} ${lastName}`;
```

## REACT-STATE-2 Don't copy a prop into state unless you mean to ignore later changes. Then name it `initialX`.

`useState(prop)` reads the prop only on the first render, so the component silently ignores every later value. If that is the intent, the name should say so.

Official: react.dev, *Choosing the State Structure*.

```tsx
// bad
function Message({ color }: { color: string }) {
  const [messageColor] = useState(color); // never updates when color changes
}
// good
function Message({ color }: { color: string }) {
  return <p style={{ color }} />;
}
function ColorPicker({ initialColor }: { initialColor: string }) {
  const [color, setColor] = useState(initialColor);
}
```

## REACT-STATE-3 Model mutually exclusive states as one status value. Not several booleans.

`isSending` and `isSent` can both be `true`, a state the UI was never designed for. One `status` value with the valid options makes impossible states unrepresentable. See [TS-2.5](../typescript/02-types.md) for the typed form.

Official: react.dev, *Choosing the State Structure*.

```tsx
// bad
const [isSending, setIsSending] = useState(false);
const [isSent, setIsSent] = useState(false);
// good
const [status, setStatus] = useState<'typing' | 'sending' | 'sent'>('typing');
```

## REACT-STATE-4 Store IDs, not copies of objects that live elsewhere in state.

A copy of the selected item goes stale when the item in the list is edited. Store the ID and look the item up during render.

Official: react.dev, *Choosing the State Structure*. The same page recommends flat (normalized) state over deep nesting.

```tsx
// bad
const [selectedItem, setSelectedItem] = useState(items[0]);
// good
const [selectedId, setSelectedId] = useState(items[0]?.id);
const selectedItem = items.find((item) => item.id === selectedId);
```

## REACT-STATE-5 Keep state as close as possible to where it is used. Lift it to the closest common parent only when siblings must share it.

State at the top of the app re-renders the whole tree on every change and couples unrelated components. When two components must always agree, move the state to their closest common parent and pass it down.

Official: react.dev, *Sharing State Between Components* ("lifting state up").

```tsx
// bad: search text in a global store, read by one component
const query = useAppStore((s) => s.searchQuery);
// good
function SearchPanel() {
  const [query, setQuery] = useState('');
  return <><SearchBox query={query} onChange={setQuery} /><Results query={query} /></>;
}
```

## REACT-STATE-6 Reset state by changing the `key`. Not with an Effect.

When a component should start fresh for a different entity (another user's profile, another chat), giving it a different `key` makes React treat it as a new component. Resetting fields in an Effect renders once with the stale state first and misses any field you forget.

Official: react.dev, *You Might Not Need an Effect* and *Preserving and Resetting State*.

```tsx
// bad
useEffect(() => { setDraft(''); }, [contactId]);
// good
<Chat key={contact.id} contact={contact} />;
```

## REACT-STATE-7 Move state logic spread across many handlers into a reducer.

When many event handlers each update several pieces of state, the rules for valid transitions are scattered. A reducer puts them in one function that you can test without rendering. Pair it with context when deep descendants need to dispatch. See [TS-13.9](../typescript/13-react.md) for typing reducers.

Official: react.dev, *Extracting State Logic into a Reducer* and *Scaling Up with Reducer and Context*.

```tsx
// bad
function handleAdd(text: string) { setTasks([...tasks, newTask(text)]); setCount(count + 1); setLastAction('add'); }
// good
function handleAdd(text: string) { dispatch({ type: 'added', text }); }
```

## REACT-STATE-8 Use built-in state first. Reach for an external store only for state that really is global and changes often.

`useState`, `useReducer` and context cover most apps. An external store (Zustand, Redux, Jotai) earns its place when many distant components read and write the same frequently changing data and context would re-render too much. Server data belongs in the framework's loader or a data library, not in a client store.

Contested: react.dev recommends built-in state "when possible" and says nothing for or against specific store libraries. Recommended stance: built-in state and context by default; a store library when you can name the re-render or coupling problem it solves.

```tsx
// bad: a global store holding a modal's open flag and a copy of server data
const { isModalOpen, users } = useStore();
// good
const [isModalOpen, setIsModalOpen] = useState(false);
const users = useLoaderData(); // or a query library for client-fetched data
```
