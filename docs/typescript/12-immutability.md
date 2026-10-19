# 12. Immutability

Which values may change, and how to update data without mutating what others hold.

## TS-12.1 Default to `const`, `readonly` properties, and readonly arrays; mutate only local, unshared values.

Data that cannot change cannot be changed behind your back. ESLint's `prefer-const` covers bindings; TS-8.4 and TS-9.2 cover fields and arrays.

```ts
// bad
let url = `${base}/users`;
interface Config { apiUrl: string; retries: number }
// good
const url = `${base}/users`;
interface Config { readonly apiUrl: string; readonly retries: number }
```

## TS-12.2 Use `as const` for static data and `Readonly<T>`/`ReadonlyArray<T>` for inputs. Remember that `Readonly<T>` is shallow.

`as const` freezes the type all the way down (TS-2.12); `Readonly<T>` only protects the top level, so nested objects and arrays stay mutable.

```ts
// bad: nested data is still writable
function render(settings: Readonly<Settings>) { settings.theme.colors.push('red'); } // compiles
// good
const DEFAULTS = { theme: { colors: ['blue', 'gray'] } } as const;
function render(settings: Readonly<Settings>) { const colors = [...settings.theme.colors, 'red']; }
```

## TS-12.3 Return new objects from reducers and state updates; never mutate arguments.

The caller's object stays intact, and identity checks (React, memoization) see the change. For arrays, see TS-9.7.

```ts
// bad
function addTag(post: Post, tag: string) { post.tags.push(tag); return post; }
// good
function addTag(post: Post, tag: string): Post { return { ...post, tags: [...post.tags, tag] }; }
```
