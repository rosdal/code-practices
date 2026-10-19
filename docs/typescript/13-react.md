# 13. React / TSX

How to type components, props, hooks, and events in React 19 code.

## TS-13.1 Type components as plain functions with a typed props parameter; do not use `React.FC`.

The React TypeScript Cheatsheet: "the general consensus today is that React.FunctionComponent (or the shorthand React.FC) is not needed." A function declaration also follows TS-4.7.

```tsx
// bad
const Card: React.FC<CardProps> = ({ title }) => <h2>{title}</h2>;
// good
export function Card({ title }: CardProps) { return <h2>{title}</h2>; }
```

## TS-13.2 Declare props as an interface named `XProps` and export it when consumers wrap the component.

One predictable name per component makes props easy to find, extend, and reuse in wrappers. Use `type` only when props are a union (TS-13.6).

```tsx
// bad
export function Avatar(props: { src: string; size: number }) {}
// good
export interface AvatarProps { src: string; size: number }
export function Avatar({ src, size }: AvatarProps) {}
```

## TS-13.3 Extend native element props with `ComponentProps<'button'>`.

Callers then get every native attribute (`disabled`, `aria-*`, `onClick`) for free. In React 19 `ref` is a regular prop; use `ComponentPropsWithoutRef` only to strip it.

```tsx
// bad
interface ButtonProps { variant: 'primary' | 'ghost'; onClick?: () => void; disabled?: boolean }
// good
interface ButtonProps extends React.ComponentProps<'button'> { variant: 'primary' | 'ghost' }
export function Button({ variant, ...rest }: ButtonProps) { return <button data-variant={variant} {...rest} />; }
```

## TS-13.4 Do not use `forwardRef` or `defaultProps` in React 19 code; take `ref` as a prop and use parameter defaults.

React 19 ignores `defaultProps`/`propTypes` on function components.

```tsx
// bad
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => <input ref={ref} {...props} />);
Input.defaultProps = { type: 'text' };
// good
export function Input({ type = 'text', ...rest }: React.ComponentProps<'input'>) {
  return <input type={type} {...rest} />;
}
```

## TS-13.5 Type `children` explicitly as `React.ReactNode`.

Since React 18, `children` is no longer implied; `ReactNode` accepts everything React can render (elements, strings, numbers, arrays, `null`).

```tsx
// bad
interface PanelProps { children: JSX.Element }
// good
interface PanelProps { children: React.ReactNode }
```

## TS-13.6 Model mutually exclusive props as discriminated unions.

The compiler then rejects a link with an `onClick` and a button with an `href` (TS-2.5).

```tsx
// bad
interface LinkProps { as: 'a' | 'button'; href?: string; onClick?: () => void }
// good
type LinkProps = { as: 'a'; href: string } | { as: 'button'; onClick: () => void };
```

## TS-13.7 Type `useState` only when inference cannot; type `useRef<HTMLDivElement>(null)` for DOM refs.

Inference covers any state with a non-empty initial value. Empty initial state and DOM refs are the cases it cannot work out.

```tsx
// bad
const [count, setCount] = useState<number>(0);
const ref = useRef(null);                       // RefObject<null>
// good
const [count, setCount] = useState(0);
const [user, setUser] = useState<User>();       // User | undefined (TS-3.3)
const ref = useRef<HTMLDivElement>(null);
```

## TS-13.8 Type event handlers with React's event types (`React.ChangeEvent<HTMLInputElement>`) or by inline inference from the JSX attribute.

Untyped handlers give `any` events; DOM event types (`Event`) lack React's synthetic-event fields.

```tsx
// bad
function onChange(e: any) { setName(e.target.value); }
// good
function onChange(e: React.ChangeEvent<HTMLInputElement>) { setName(e.target.value); }
<input onChange={(e) => setName(e.target.value)} />  // inferred
```

## TS-13.9 Type reducers with discriminated-union actions and exhaustive `switch`.

Each action carries exactly its own payload, and a new action type fails compilation until handled (TS-2.6).

```tsx
// bad
function reducer(state: State, action: { type: string; payload?: any }): State {}
// good
type Action = { type: 'add'; item: Item } | { type: 'remove'; id: ItemId };
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add': return { ...state, items: [...state.items, action.item] };
    case 'remove': return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    default: return assertNever(action);
  }
}
```

## TS-13.10 Use generic components (`function List<T>(props: ListProps<T>)`) instead of `any` for reusable collections.

The item type then flows from `items` into `renderItem`, so callers get checked callbacks.

```tsx
// bad
interface ListProps { items: any[]; renderItem: (item: any) => React.ReactNode }
// good
interface ListProps<T> {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
}
export function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return <ul>{items.map((item) => <li key={getKey(item)}>{renderItem(item)}</li>)}</ul>;
}
```
