---
name: api-design
description: Use when designing, adding, changing or reviewing an HTTP/REST endpoint or its OpenAPI description — naming a resource or path, choosing a method or status code, shaping a request, response or error body, paginating, filtering or sorting a list, adding idempotency keys, ETags, caching or rate limits, versioning or deprecating an endpoint, and checking authorization, mass assignment or resource limits. Also use when a client is about to depend on a response shape, and when a change might break existing clients.
---

# API design

Each line is one rule from the Rosdal API design guide (HTTP/JSON APIs, October 2026). The ID links to the full rule, with its reason, source and examples, in `docs/api-design/` of https://github.com/rosdal/code-practices. Cite IDs in review comments ("see API-ERR-2").

Framework-agnostic: use the framework's mechanism for each rule. For SQL behind list endpoints use the `database` skill; for code-level security use the language skill. In an existing API with its own conventions, consistency within that API wins for naming, casing and envelopes; the security and compatibility rules still apply. Rules marked (C) are contested, with the stance stated; (D) rests on an IETF draft, not an RFC.

## Contract

- [API-SPEC-1] Commit an OpenAPI description and review its diff as the API change; spec-first or code-first, one source.
- [API-SPEC-2] OpenAPI 3.1 (`type: [T, 'null']`, not 3.0 `nullable`); 3.2 only when all tooling supports it.
- [API-SPEC-3] Lint the spec and fail CI on breaking changes (`oasdiff`).
- [API-SPEC-4] Generate validators and client types from the spec (or the spec from validators). Never maintain both by hand.

## Resources and URLs

- [API-URL-1] Plural nouns, no verbs: `POST /orders`, not `/createOrder`.
- [API-URL-2] Lowercase kebab-case segments, no trailing slash, no `.json`.
- [API-URL-3] Nest one level, only for ownership; every resource has its own canonical URL.
- [API-URL-4] (C) Non-CRUD actions: `POST /orders/{id}/cancel` or a new resource (`POST /refunds`), not a `PATCH` of `status`.

## Methods and idempotency

- [API-METHOD-1] Follow RFC 9110: GET/HEAD/OPTIONS safe; PUT/DELETE idempotent; GET never changes state.
- [API-METHOD-2] Create: `POST` to the collection, `201` + `Location` + body. `PUT` only for client-chosen IDs.
- [API-METHOD-3] Update: `PATCH` with JSON Merge Patch (`application/merge-patch+json`); `null` deletes.
- [API-METHOD-4] (D) `Idempotency-Key` on side-effecting POSTs: store key + request fingerprint + response ≥24h; different body → `422`, concurrent retry → `409`.
- [API-METHOD-5] Large queries: `QUERY` (RFC 10008) where the stack supports it, else `POST …/search`. Never GET with a body.
- [API-METHOD-6] Long-running work: `202` + `Location` of an operation resource. Don't hold the request open.

## Status codes and errors

- [API-ERR-1] Errors are RFC 9457 Problem Details, `application/problem+json`. Not ad-hoc shapes; RFC 7807 is obsolete.
- [API-ERR-2] Stable `type` URI per error, listed in the spec; clients branch on `type` and extension members, never on `title`/`detail`.
- [API-ERR-3] All validation failures in one response: `errors: [{ detail, pointer: "#/field" }]`.
- [API-ERR-4] (C) Status by RFC 9110: `400` malformed, `401` no/bad credentials, `403` not allowed, `404` missing or hidden, `409` state conflict, `412` precondition, `422` invalid content, `429` rate limited, `5xx` only for server faults. Never `200` with an error.
- [API-ERR-5] No stack traces, SQL, hostnames or exception text in responses; return a request ID instead.

## Bodies

- [API-BODY-1] (C) One casing for all JSON properties and query params; camelCase for new APIs.
- [API-BODY-2] Top-level JSON object, never a bare array.
- [API-BODY-3] Timestamps RFC 3339 UTC with `T` and `Z`; dates `YYYY-MM-DD`; zone suffix (RFC 9557) only where it matters. No epoch numbers.
- [API-BODY-4] IDs are opaque strings, even for `bigint` keys; prefixes (`ord_`) optional.
- [API-BODY-5] Money as decimal string or integer minor units plus ISO 4217 currency. Never a fractional number.
- [API-BODY-6] (C) Enums as lowercase `snake_case` strings, documented as extensible.
- [API-BODY-7] `null` and absent mean the same in responses; omit empty fields. `null` only matters in Merge Patch.

## Collections

- [API-LIST-1] Paginate every collection from its first release; adding it later breaks clients.
- [API-LIST-2] Opaque cursor tokens (keyset underneath, unique tiebreaker). Not offsets or page numbers. A token never grants access.
- [API-LIST-3] One envelope: `{ items, nextPageToken }`, token absent on the last page; `pageSize` with default and max, coerced above max.
- [API-LIST-4] No total count by default; opt-in only.
- [API-LIST-5] Filters as one param per field; `sort=-createdAt,id`; allow-list (and index) every filter and sort field.

## Evolution and versioning

- [API-VER-1] Evolve additively. Breaking: remove/rename, change type or meaning, new required input, tighter validation, changed defaults/status/error type, new value in a non-extensible enum.
- [API-VER-2] Clients ignore unknown fields and have a default branch for unknown enum values.
- [API-VER-3] (C) Unavoidable break: new major version in the path (`/v2/`), run both until Sunset. Not a version per change.
- [API-VER-4] Deprecate with `Deprecation: @<unix-seconds>` (RFC 9745), `Sunset` (RFC 8594, not earlier), `Link rel="deprecation"`; check remaining callers before removal.

## HTTP features

- [API-HTTP-1] `ETag` on single resources; `If-None-Match` → `304`.
- [API-HTTP-2] `If-Match` on PUT/PATCH/DELETE (strong comparison); mismatch → `412`; required but missing → `428`.
- [API-HTTP-3] `Cache-Control` on every response; `no-store` for personal/authenticated data unless designed to cache.
- [API-HTTP-4] (D) Rate limits: `429` + `Retry-After`, Problem Details body. `RateLimit`/`RateLimit-Policy` (draft -11) optional; never the old `RateLimit-Limit/-Remaining/-Reset`.
- [API-HTTP-5] Return a request ID on every response; accept and propagate W3C `traceparent`.

## Security (OWASP API Top 10 2023)

- [API-SEC-1] Object-level authorization on every request with an ID; scope the query to the caller; `404` when they may not know it exists.
- [API-SEC-2] Bind requests through a schema of writable fields (reject unknown/read-only with `422`); build responses from a schema of readable fields.
- [API-SEC-3] Authorization per operation by role/scope, deny by default; hidden endpoints are not protected.
- [API-SEC-4] Limit everything: page size, body size, `maxLength`/`maxItems` in the spec, sort fields, paid side effects, abusable business flows.
- [API-SEC-5] Credentials only in `Authorization` over HTTPS; never tokens or personal data in URLs.
- [API-SEC-6] Fetch user-supplied URLs only after allow-list, scheme and IP-range checks; no blind redirects.
- [API-SEC-7] CORS: explicit origin list; never reflect `Origin`, never `*` with credentials.
- [API-SEC-8] Inventory every host and version; switch off what is past Sunset; no public staging with real data.
- [API-SEC-9] Validate third-party API responses like user input, with timeouts and size limits.
