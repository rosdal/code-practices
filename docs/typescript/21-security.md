# 21. Security-relevant practices

How to use the type system and lint rules to keep untrusted data away from dangerous sinks.

## ~~TS-21.1~~ (removed)

Covered by [TS-2.2](02-types.md).

## TS-21.2 Strip or reject unknown keys when parsing input objects to avoid mass-assignment.

Zod's `z.object()` strips unknown keys by default; `z.strictObject()` rejects them. Either way, a client-supplied `role: 'admin'` never reaches the database.

```ts
// bad: every field the client sends is written
await db.user.update({ where: { id }, data: req.body });
// good
const UpdateProfile = z.object({ name: z.string(), bio: z.string() });
await db.user.update({ where: { id }, data: UpdateProfile.parse(req.body) });
```

## TS-21.3 Do not merge untrusted objects into prototypes or use untrusted keys on plain objects; use `Map` or `Object.create(null)`, and never `obj[userKey] = ...` without an allow-list.

With a key like `__proto__`, a nested write (`obj[a][b] = v`) lands on `Object.prototype` and changes every object in the process (prototype pollution).

```ts
// bad: section = '__proto__' pollutes every object
settings[section][key] = value;
// good
const ALLOWED = new Set(['theme', 'locale']);
if (ALLOWED.has(key)) settings.set(key, value); // settings is a Map
```

## TS-21.4 Use branded types for sanitized/validated strings (`SafeHtml`, `SqlIdentifier`) so unsanitized strings cannot reach sinks.

Only the sanitizer can produce the brand, so the compiler proves every value at the sink went through it (TS-2.8).

```ts
type SafeHtml = string & { readonly __brand: 'SafeHtml' };
function sanitize(raw: string): SafeHtml { return DOMPurify.sanitize(raw) as SafeHtml; }
function render(html: SafeHtml) {}
// bad
render(comment.body); // error: string is not SafeHtml
// good
render(sanitize(comment.body));
```

## TS-21.5 Do not use `eval`, `new Function`, or `dangerouslySetInnerHTML` with unsanitized data; `@typescript-eslint/no-implied-eval` must be on.

Each one executes or renders a string as code, so attacker-controlled input becomes script. `no-implied-eval` is in `recommendedTypeChecked`, so the TS-6.8 config already has it.

```tsx
// bad
<div dangerouslySetInnerHTML={{ __html: comment.body }} />
setTimeout(`refresh(${id})`, 1000);
// good
<div dangerouslySetInnerHTML={{ __html: sanitize(comment.body) }} />
setTimeout(() => refresh(id), 1000);
```

## TS-21.6 Use `restrict-template-expressions` and `restrict-plus-operands` to stop `[object Object]`/`undefined` leaking into logs, URLs, and queries.

Both rules reject non-string operands in string building, which is where unchecked values become malformed URLs and misleading log lines. Both are in `recommendedTypeChecked`.

```ts
// bad
const url = `/api/users/${user}`;     // "/api/users/[object Object]"
// good
const url = `/api/users/${user.id}`;
```
