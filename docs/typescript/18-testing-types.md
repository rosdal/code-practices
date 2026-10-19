# 18. Testing types

How to test types themselves, and how to type test fixtures without giving up checking.

## TS-18.1 Test non-trivial generic and utility types with `expectTypeOf` (Vitest) in `*.test-d.ts` files and run `vitest --typecheck` in CI.

Vitest statically analyzes these files rather than running them, so a type that silently widens to `any` or `unknown` fails the build.

```ts
// bad: a runtime test passes even if pluck returns any
test('pluck', () => { expect(pluck({ a: 1 }, 'a')).toBe(1); });
// good (pluck.test-d.ts)
import { expectTypeOf, test } from 'vitest';
test('pluck', () => {
  expectTypeOf(pluck({ a: 1 }, 'a')).toEqualTypeOf<number>();
});
```

## TS-18.2 Assert that invalid usage fails with `// @ts-expect-error`.

If the error ever disappears, the directive itself becomes an error, so a type that grows too permissive breaks the test. Give the reason, as TS-2.14 requires.

```ts
// bad: only the happy path is tested
expectTypeOf(pluck({ a: 1 }, 'a')).toEqualTypeOf<number>();
// good
// @ts-expect-error -- 'b' is not a key of the object
pluck({ a: 1 }, 'b');
```

## TS-18.3 Use `tsd` or `@arethetypeswrong/cli` for published packages' emitted declarations.

Type tests against source do not catch broken `.d.ts` output or a wrong `exports` map (TS-16.2); these tools check what consumers actually install.

```jsonc
// bad (package.json): types are only checked against source
{ "scripts": { "test": "vitest --typecheck" } }
// good
{ "scripts": { "test": "vitest --typecheck", "check:package": "attw --pack . && publint" } }
```

## TS-18.4 Allow pragmatic casts in test fixtures, but build fixtures with factory functions typed against the real types, not `as any`.

A factory fails to compile when `User` gains a required field, so every fixture updates in one place. This is the test-fixture exception in TS-2.13.

```ts
// bad
const user = { id: '1' } as any as User;
// good
function makeUser(overrides: Partial<User> = {}): User {
  return { id: 'u1' as UserId, email: 'ada@example.com', ...overrides };
}
const user = makeUser({ email: 'grace@example.com' });
```
