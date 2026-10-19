# 20. Documentation (TSDoc)

What to write in doc comments, and what to leave to the types.

## TS-20.1 Document exported APIs with `/** TSDoc */` comments describing intent, not repeating types.

The signature already says what the types are; the comment should say what the signature cannot: edge cases, failure modes, side effects.

```ts
// bad
/** @param id the id */
export function loadUser(id: UserId): Promise<User | undefined> {}
// good
/** Loads a user, or `undefined` if the account was deleted. Throws on network failure. */
export function loadUser(id: UserId): Promise<User | undefined> {}
```

## TS-20.2 Use `@deprecated` with a replacement.

Editors strike the name through and `@typescript-eslint/no-deprecated` flags every call, so callers learn about it where they use it, with the fix in hand.

```ts
// bad
/** @deprecated */
export function getUser(id: string): User {}
// good
/** @deprecated Use {@link loadUser}, which handles deleted accounts. */
export function getUser(id: string): User {}
```

## TS-20.3 Do not duplicate type information in JSDoc tags (`@param {string}`) in `.ts` files.

TypeScript ignores JSDoc types in `.ts` files, so they are never checked and drift from the real signature.

```ts
// bad
/** @param {string} id @returns {Promise<User>} */
export function loadUser(id: UserId): Promise<User | undefined> {}
// good
/** @param id - Must belong to an active tenant. */
export function loadUser(id: UserId): Promise<User | undefined> {}
```

## TS-20.4 Document each prop on component props interfaces with TSDoc so it shows up in editor hovers.

Consumers read props in the editor, not in the component source; a line per prop answers "what does this do" at the call site.

```tsx
// bad
interface ButtonProps { variant: 'primary' | 'ghost'; loading?: boolean }
// good
interface ButtonProps {
  /** Visual weight. Use `primary` once per view. */
  variant: 'primary' | 'ghost';
  /** Shows a spinner and blocks clicks while true. */
  loading?: boolean;
}
```
