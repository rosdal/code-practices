# 7. Naming conventions

How to case and name types, values, booleans, and private members.

## TS-7.1 Use UpperCamelCase for types, interfaces, classes, type parameters, and React components; lowerCamelCase for values, functions, and properties.

This matches Google's naming table. Enforce with `@typescript-eslint/naming-convention` if desired.

```ts
// bad
interface user_profile { First_Name: string }
function GetUser() {}
// good
interface UserProfile { firstName: string }
function getUser() {}
function UserCard() {} // React component
```

## TS-7.2 Do not prefix interfaces with `I` or type aliases with `T`.

Google and the TypeScript team's own coding guidelines reject Hungarian notation; whether something is an interface is an implementation detail. Type parameters are different: `TInput`, `TKey` (TS-5.3) are fine.

```ts
// bad
interface IUser {}
type TRole = 'admin' | 'user';
// good
interface User {}
type Role = 'admin' | 'user';
```

## TS-7.3 Use CONSTANT_CASE only for true module-level constants; keep `as const` lookup objects in UpperCamelCase when they double as a type.

CONSTANT_CASE signals "fixed value, never reassigned"; an object that is also a type (TS-2.7) follows type naming so value and type share one name.

```ts
// bad
export const maxRetries = 3;
export const HTTP_STATUS = { Ok: 200, NotFound: 404 } as const;
// good
export const MAX_RETRIES = 3;
export const HttpStatus = { Ok: 200, NotFound: 404 } as const;
export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];
```

## TS-7.4 Name booleans as predicates (`isX`, `hasX`, `canX`, `shouldX`).

A predicate name reads as a yes/no question at the call site, so `if (user.active)` cannot be mistaken for a timestamp or a status object.

```ts
// bad
const open = true;
function permission(user: User): boolean {}
// good
const isOpen = true;
function canEdit(user: User): boolean {}
```

## TS-7.5 Do not use a `_` prefix to signal privacy; use `private` or `#private`.

The compiler enforces `private` and the runtime enforces `#private`; an underscore enforces nothing. Reserve `_` for intentionally unused bindings (TS-1.15).

```ts
// bad
class Cache { _store = new Map<string, string>(); }
// good
class Cache { #store = new Map<string, string>(); }
```

## TS-7.6 Treat acronyms as words (`HttpClient`, `userId`, not `HTTPClient`, `userID`).

Google: "Treat abbreviations like acronyms in names as whole words." Word boundaries stay visible when acronyms meet (`XMLHTTPRequest` versus `XmlHttpRequest`).

```ts
// bad
class HTTPClient { userID = ''; }
// good
class HttpClient { userId = ''; }
```
