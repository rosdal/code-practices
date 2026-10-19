# 7. Evolution and versioning

Changing an API without breaking its clients, versioning when a break can't be avoided, and retiring old endpoints.

Each rule says whether it is a standard, official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## API-VER-1 Evolve additively. Treat every change in this list as breaking.

Every guide agrees on the goal: clients written against today's API keep working tomorrow. Adding an optional request field, a response field, an endpoint or an error `type` is compatible. These are breaking, and need API-VER-3 or a new endpoint:

- removing or renaming a field, parameter, endpoint or enum value
- changing a field's type, format or meaning, or making it nullable
- adding a required request field or parameter, or tightening validation
- changing a default, a status code, an error `type` or the pagination envelope
- adding a value to an enum that the spec didn't declare extensible (API-BODY-6)

Convention, shared by Zalando's compatibility rules, Google's AIP-180 and Stripe's versioning policy. `oasdiff` checks most of the list in CI (API-SPEC-3).

```jsonc
// bad: v1 response, then "renamed for clarity" in place
{ "total": "12.50" }
// good: keep the old field, add the new one, deprecate the old one in the spec
{ "total": "12.50", "totalInclVat": "12.50" }
```

## API-VER-2 Write clients that ignore unknown fields and handle unknown enum values.

Additive evolution only works if clients tolerate what they didn't expect. A client that fails on an unknown property, or that throws in the `default` branch of an enum `switch`, turns every compatible change into an outage. Validate the fields you use; ignore the rest.

Official: Zalando rule 108 (*MUST prepare clients to accept compatible API extensions*). For TypeScript, parse responses at the boundary ([TS-19.1](../typescript/19-runtime.md)) with a schema that doesn't reject extra keys. That is the opposite of request bodies, where unknown keys are rejected (API-SEC-2).

```ts
// bad
switch (order.status) {
  case 'pending': return 'Pending';
  case 'paid': return 'Paid';
  default: throw new Error(`unknown status ${order.status}`);
}

// good
switch (order.status) {
  case 'pending': return 'Pending';
  case 'paid': return 'Paid';
  default: return 'Unknown status';
}
```

## API-VER-3 When a break is unavoidable, add a new major version in the path and run both. Don't version per change.

Versioning is contested. Zalando avoids versions and forbids `/v1/` in URLs, using media-type versions when it must. Stripe pins a dated version per account and per request with a `Stripe-Version` header, which takes considerable machinery to support. Azure uses an `api-version` query parameter. For a team API, a major version in the path (`/v1/`, `/v2/`) is the simplest to route, log, monitor and document. Make it rare: most changes fit API-VER-1. Run the old version until its `Sunset` date (API-VER-4).

Convention. See the [appendix](appendix.md#contested-points-and-recommended-stances) for the alternatives.

```http
# bad: a version per release, or a silent break in place
GET /v7/orders
GET /orders   (response shape changed on Tuesday)

# good
GET /v1/orders
GET /v2/orders   (only after a breaking change; v1 keeps running until its Sunset date)
```

## API-VER-4 Announce deprecation with `Deprecation`, `Sunset` and a `Link` to the migration guide. Watch who still calls before removing.

Clients rarely read changelogs, but their HTTP libraries and gateways can surface headers. `Deprecation` (RFC 9745, March 2025) takes a Structured Field date (`@` plus Unix seconds) and doesn't change behaviour. `Sunset` (RFC 8594) gives the HTTP-date after which the endpoint may stop working, and must not be earlier than the `Deprecation` date. `Link: <…>; rel="deprecation"` points to human-readable docs. Before the sunset date, check logs or metrics for remaining callers and contact them.

Standard: RFC 9745, RFC 8594. Official: Zalando rules 189 and 190 (monitor usage of deprecated APIs; add `Deprecation` and `Sunset`). Older drafts used `Deprecation: true` or an HTTP-date; that form is outdated.

```http
# bad
Deprecation: true
Warning: 299 - "This endpoint is deprecated"

# good
Deprecation: @1767225600
Sunset: Wed, 30 Jun 2027 23:59:59 GMT
Link: <https://api.example.com/docs/migrate-orders-v2>; rel="deprecation"; type="text/html"
```
