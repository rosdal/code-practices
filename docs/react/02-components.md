# 2. Components and APIs

Which React APIs to use in React 19 code, and which ones are outdated. For typing components and props, see [TS-13](../typescript/13-react.md).

Each rule says whether it is official React team guidance or convention. Sources are in the [appendix](appendix.md#sources).

## REACT-API-1 Write function components. Not class components.

Hooks, the compiler, Server Components and every API added since 2019 are built for function components. Class components still work, so don't rewrite them for their own sake; convert them when you change them substantially. The only remaining case for a class is an error boundary, which most projects get from a library.

Official: the react.dev `Component` reference recommends defining components as functions instead.

```tsx
// bad
class Greeting extends React.Component<{ name: string }> {
  render() { return <h1>Hello, {this.props.name}</h1>; }
}
// good
function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}
```

## REACT-API-2 Take `ref` as a regular prop and use parameter defaults. Not `forwardRef`, `defaultProps` or `propTypes`.

In React 19, function components receive `ref` as a prop, `defaultProps` on function components is removed, and `propTypes` checks are silently ignored. Codemods exist for all three. See [TS-13.4](../typescript/13-react.md) for the typed form.

Official: React 19 release post and upgrade guide (2024). `forwardRef` is "no longer necessary" and will be deprecated in a future version; no date is set.

```tsx
// bad
const Input = forwardRef((props, ref) => <input ref={ref} {...props} />);
Input.propTypes = { type: PropTypes.string };
// good
function Input({ type = 'text', ref, ...rest }: React.ComponentProps<'input'>) {
  return <input type={type} ref={ref} {...rest} />;
}
```

## REACT-API-3 Render `<Context>` as the provider. Not `<Context.Provider>`.

React 19 lets the context object itself be the provider. `<Context.Provider>` still works but will be deprecated; a codemod converts it.

Official: React 19 release post.

```tsx
// bad
<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
// good
<ThemeContext value={theme}>{children}</ThemeContext>;
```

## REACT-API-4 Declare components at the top level of a module. Never inside another component.

A component defined inside another one is a new type on every render, so React unmounts and remounts it each time: its state is lost (typed input disappears) and its DOM is rebuilt.

Official: react.dev, *Preserving and Resetting State*: "always declare component functions at the top level, and don't nest their definitions."

```tsx
// bad
function Form() {
  function Field() { return <input />; }
  return <Field />;
}
// good
function Field() { return <input />; }
function Form() { return <Field />; }
```

## REACT-API-5 Give list items a stable key from the data. Not the array index when items can move.

React matches list items between renders by key. An index key attaches one item's state (input text, focus, animation) to whichever item ends up at that index after an insert, delete or sort. Keys only need to be unique among siblings.

Official: react.dev, *Rendering Lists* and *Preserving and Resetting State*.

```tsx
// bad
todos.map((todo, index) => <TodoRow key={index} todo={todo} />);
// good
todos.map((todo) => <TodoRow key={todo.id} todo={todo} />);
```

## REACT-API-6 Use `use()` only with a promise created outside render.

`use()` reads a promise (suspending until it resolves) or a context, and unlike hooks it may be called conditionally. A promise created during render is a new promise every render, so the component suspends forever or keeps showing its fallback. Get the promise from a framework loader, a Server Component prop, a Suspense-enabled library, or a cache. Handle rejections with an error boundary, not `try`/`catch`.

Official: react.dev `use` reference.

```tsx
// bad
function Comments({ postId }: { postId: string }) {
  const comments = use(fetchComments(postId)); // new promise every render
}
// good: the promise is started by the parent (or a loader) and passed down
function Comments({ commentsPromise }: { commentsPromise: Promise<Comment[]> }) {
  const comments = use(commentsPromise);
}
```
