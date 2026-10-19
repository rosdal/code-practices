# 5. Request and response bodies

JSON conventions: casing, top-level shape, dates, IDs, money, enums and null.

Each rule says whether it is a standard, official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## API-BODY-1 Use one casing for every JSON property and query parameter in the API. This guide uses camelCase.

Mixed casing makes every client guess, and generated clients end up with `created_at` next to `updatedAt`. The guides disagree on which casing: Zalando requires `snake_case`; Microsoft requires camelCase; Google writes `snake_case` in protos but sends camelCase in JSON. camelCase matches JavaScript and TypeScript clients without a mapping layer. An existing API keeps its casing: consistency within one API beats this default.

Official: Microsoft Azure guidelines ("DO use camel case for all JSON field names"); Zalando rule 118 says the opposite. Contested; see the [appendix](appendix.md#contested-points-and-recommended-stances). Database columns stay `snake_case` ([DB-SCHEMA-11](../database/02-schema.md)); map at the boundary.

```jsonc
// bad
{ "order_id": "ord_42", "createdAt": "2026-10-19T08:30:00Z", "CustomerID": "cus_7" }

// good
{ "orderId": "ord_42", "createdAt": "2026-10-19T08:30:00Z", "customerId": "cus_7" }
```

## API-BODY-2 Return a JSON object at the top level. Never a bare array.

An array has no room for anything else. When the list later needs a page token, a warning or metadata, a bare array can only change by breaking every client. An object takes new members additively (API-VER-1).

Convention. Zalando, Google and Azure all wrap list responses in an object (API-LIST-3).

```text
// bad
[{ "id": "ord_1" }, { "id": "ord_2" }]

// good
{ "items": [{ "id": "ord_1" }, { "id": "ord_2" }] }
```

## API-BODY-3 Send timestamps as RFC 3339 strings in UTC with an uppercase `T` and `Z`. Send dates as `YYYY-MM-DD`.

Epoch numbers don't say their unit (seconds or milliseconds) and are unreadable in logs. Local formats and missing offsets are ambiguous. RFC 3339 strings sort correctly as text and every language parses them. RFC 9557 (April 2024) keeps this format and adds an optional zone suffix such as `[Europe/Amsterdam]`; send a zone name only where it matters, such as a future local event ([DB-SCHEMA-1](../database/02-schema.md)).

Standard: RFC 3339, updated by RFC 9557. Official: Zalando rule 169 (RFC 3339, uppercase `T` and `Z`).

```jsonc
// bad
{ "createdAt": 1760862600, "dueDate": "19/10/2026", "startsAt": "2026-10-19 10:30:00" }

// good
{
  "createdAt": "2026-10-19T08:30:00Z",
  "dueDate": "2026-10-19",
  "startsAt": "2026-11-02T09:00:00+01:00[Europe/Amsterdam]"
}
```

## API-BODY-4 Make IDs opaque strings, even when the database key is a number.

A JSON number above 2^53 loses precision in JavaScript, so a `bigint` key ([DB-SCHEMA-5](../database/02-schema.md)) can silently become a different ID in the browser. Strings also let you change the key type later, and a type prefix (`ord_`, `cus_`) makes IDs pasted into a ticket self-describing. Clients must not parse an ID or assume its format.

Official: Zalando rule 174 (`id` values "must be opaque strings and not numbers"). Prefixes are convention, as used by Stripe.

```jsonc
// bad
{ "id": 9007199254740993, "customerId": 7 }

// good
{ "id": "ord_9007199254740993", "customerId": "cus_7" }
```

## API-BODY-5 Send money as a decimal string or integer minor units, with an ISO 4217 currency code. Never a fractional JSON number.

Many JSON parsers read numbers as binary floats, where `0.1 + 0.2` isn't `0.3`. An amount without a currency is a bug waiting for the second currency. Pick one representation per API: a decimal string (`"12.50"`) or integer minor units (`1250`, as Stripe does); minor units need the currency's exponent to display.

Convention. Matches [DB-SCHEMA-3](../database/02-schema.md).

```jsonc
// bad
{ "total": 12.5 }

// good
{ "total": { "amount": "12.50", "currency": "EUR" } }
```

## API-BODY-6 Send enum values as strings, and tell clients to expect values they don't know.

Strings survive logs and reordering; numeric codes need a lookup table. Adding a value is normal API growth, but a client with an exhaustive `switch` breaks on it, so document every enum as extensible and handle an unknown value in clients with a default branch (API-VER-2). Pick one casing for values; this guide uses lowercase `snake_case`.

Official: Zalando rule 240 (it uses `UPPER_SNAKE_CASE`) and its `x-extensible-enum`. Lowercase values follow Stripe and GitHub. Casing is convention.

```jsonc
// bad
{ "status": 3 }

// good
{ "status": "past_due" }
```

## API-BODY-7 Give `null` and an absent field the same meaning in responses. Omit fields that have no value.

If `null` and absent mean different things, every client has to handle both cases and keep them apart, and generated types get `T | null | undefined`. Omit empty fields from responses and treat a `null` from older servers the same way. The one place `null` means something is a JSON Merge Patch request, where it deletes the field (API-METHOD-3).

Official: Zalando rule 123 (*MUST use same semantics for null and absent properties*); Microsoft Azure guidelines ("DO NOT send JSON fields with a null value from the service to the client").

```jsonc
// bad: three states for "no phone number"
{ "id": "cus_7", "phone": null, "fax": "" }

// good
{ "id": "cus_7" }
```
