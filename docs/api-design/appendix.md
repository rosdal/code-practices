# Appendix

Standards status, outdated advice, sources and contested points behind the API design rules. This page has no rule IDs.

Last reviewed 2026-10-19. Re-check when the RateLimit draft expires or is published (24 November 2026), when the Idempotency-Key draft is revived, when OpenAPI 3.3 or 4.0 ships, and when OWASP publishes a new API Security Top 10.

## Status (October 2026)

| Item | Status | Rules |
|---|---|---|
| RFC 9110 *HTTP Semantics* | Internet Standard (June 2022); obsoletes RFC 7231 and related | API-METHOD-1, API-ERR-4, API-HTTP-1, -2 |
| RFC 9457 *Problem Details* | Proposed Standard (July 2023); obsoletes RFC 7807, same wire format | API-ERR-1, -2, -3 |
| RFC 9745 `Deprecation` | Proposed Standard (March 2025); value is a Structured Field date, registers `rel="deprecation"` | API-VER-4 |
| RFC 8594 `Sunset` | Informational (May 2019) | API-VER-4 |
| RFC 10008 `QUERY` method | Proposed Standard (June 2026); support in frameworks, proxies and CDNs still arriving | API-METHOD-5 |
| RFC 9557 (extends RFC 3339) | Proposed Standard (April 2024); optional `[Zone/Name]` suffix; `Z` now means "UTC known, local offset unknown" | API-BODY-3 |
| `RateLimit` / `RateLimit-Policy` | Internet-Draft `-11` (23 May 2026), expires 24 November 2026; early review of `-10` marked "Not ready" | API-HTTP-4 |
| `Idempotency-Key` | Internet-Draft `-07` (15 October 2025), **expired**, no intended status | API-METHOD-4 |
| OpenAPI | 3.2.0 announced 23 September 2025; 3.2.1 current; 3.1.2 still maintained; no 3.3 or 4.0 | API-SPEC-2 |
| OWASP API Security Top 10 | 2023 edition current; no newer edition | API-SEC-1 to -9 |

## Outdated advice

| Outdated | Instead |
|---|---|
| Citing RFC 7807 for errors | RFC 9457 (same format) (API-ERR-1) |
| Citing RFC 7230-7235 for HTTP semantics | RFC 9110, RFC 9111 (API-METHOD-1, API-HTTP-3) |
| `Deprecation: true` or an HTTP-date value | `Deprecation: @<unix-seconds>` (API-VER-4) |
| `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` | `429` + `Retry-After`; optionally `RateLimit` + `RateLimit-Policy` from draft `-11` (API-HTTP-4) |
| `Warning: 299` deprecation notices | `Warning` is obsoleted by RFC 9111; use `Deprecation`/`Sunset` (API-VER-4) |
| `GET` with a request body for complex search | `QUERY` (RFC 10008) or `POST …/search` (API-METHOD-5) |
| OpenAPI 3.0 `nullable: true` | OpenAPI 3.1 `type: [T, 'null']` (API-SPEC-2) |
| Offset/page-number pagination with `total` | Opaque cursor tokens, no total by default (API-LIST-2, -4) |
| `X-` prefixed custom headers for new conventions | Registered fields where they exist; plain names otherwise (RFC 6648) |
| `422 Unprocessable Entity` (WebDAV, RFC 4918) | Same code, now `422 Unprocessable Content` in RFC 9110 (API-ERR-4) |

## Sources

How each source was checked (one research run plus targeted fetches, 2026-10-19):

- **Adversarially verified** (3 independent checks against the fetched text, all 3-0): RFC 9457; RFC 9745; Datatracker and draft text for `draft-ietf-httpapi-ratelimit-headers-11`; Datatracker and draft text for `draft-ietf-httpapi-idempotency-key-header-07`; Google AIP-158 and AIP-193; Zalando RESTful API Guidelines rules 113-115, 118, 160, 176, 177, 189, 190, 254; Microsoft Azure REST API Guidelines (camelCase); Google AIP-140; TypeSpec Azure `list-response-envelope` linter rule; Stripe *Versioning* docs.
- **Quoted from the fetched page, not separately verified**: RFC 9110 §9.2, §13.1.1, §15.3.2-15.3.5, §15.5 (401, 403, 404, 405, 409, 412, 415, 422), §15.6.4 (`Retry-After` on 503); RFC 10008; RFC 9557; OpenAPI Initiative specification index and 3.2 announcement; OWASP API Security Top 10 2023 list; Stripe *Idempotent requests* docs (24-hour retention, replay including `500`, parameter comparison, 255-character keys); Stripe blog *Designing robust and predictable APIs with idempotency*; GitHub *Using pagination in the REST API* (`Link` header, `per_page` max 100, `before`/`after`); Google AIP-132 (page size default 50, max 1000, coercion, `order_by`); Microsoft Azure guidelines (`api-version`, `201`/`200` on PUT, `202` + `Operation-Location`, JSON Merge Patch, `412` on `If-Match`, `x-ms-client-request-id`, no nulls from the service, `nextLink` absent on the last page); Zalando rules 100, 108, 123, 129, 130, 134, 136, 137, 141, 152, 153, 157, 169, 174, 182, 229, 230, 240.
- **From general knowledge, not the research run**: RFC 7396 (JSON Merge Patch), RFC 6902 (JSON Patch), RFC 6901 (JSON Pointer), RFC 6585 (`428`, `429`), RFC 8288 (`Link`), RFC 9111 (caching), RFC 6750 §5.3, RFC 6648, W3C Trace Context; Google AIP-136 (custom methods) and AIP-180 (compatibility); the JavaScript 2^53 integer limit; Spectral, Redocly CLI, `oasdiff` and TypeSpec as tools; Stripe-style ID prefixes and minor-unit amounts; the list of breaking changes in API-VER-1; the SSRF, CORS and third-party-response checks in API-SEC-6, -7, -9; the OWASP item descriptions beyond their titles; GitHub's and Stripe's lowercase enum values; tooling readiness for OpenAPI 3.2 and `QUERY`.

Refuted during research and deliberately left out:

- "Stripe names versions with a date plus a codename, and the current version is `2026-09-30.endive`" (0-3). API-VER-3 mentions only that Stripe uses dated versions selected with `Stripe-Version`.

Gaps: the research run produced no verified claims on URL naming, status-code choice, filtering and sorting, ETags, date formats, OpenAPI tooling or OWASP. Those rules rest on the primary sources fetched afterwards (quoted, not voted on) and on general knowledge, as listed above.

TypeScript and JSONC examples are checked by `pnpm check`. `http`, YAML and `text` blocks are not.

## Contested points and recommended stances

| Topic | Positions | Recommended stance |
|---|---|---|
| Error format | RFC 9457 (Zalando, IETF); `google.rpc.Status` + `ErrorInfo` (Google); `{ error: { code, message } }` (Azure) | RFC 9457, with `type` as the stable identifier Google's `reason` plays (API-ERR-1, -2) |
| `400` vs `422` for validation | Google (`INVALID_ARGUMENT`) and Stripe use `400` for validation errors; RFC 9110 defines `422` for well-formed but invalid content | `400` for malformed, `422` for invalid content; one rule per API (API-ERR-4) |
| JSON casing | `snake_case` (Zalando, Stripe, GitHub); camelCase (Azure, Google JSON mapping) | camelCase for new APIs; an existing API keeps its casing (API-BODY-1) |
| Enum value casing | `UPPER_SNAKE_CASE` (Zalando, Google); lowercase (Stripe, GitHub) | lowercase `snake_case` (API-BODY-6) |
| Versioning | No versions, media-type versions (Zalando); dated header versions (Stripe `Stripe-Version`, GitHub `X-GitHub-Api-Version`); `api-version` query (Azure); path major version (Google `v1`, many public APIs) | Additive evolution; path major version only for unavoidable breaks (API-VER-1, -3) |
| Pagination envelope | `value` + `nextLink` (Azure); `next_page_token` (Google); `Link` header (GitHub); `has_more` + `starting_after` (Stripe) | `items` + `nextPageToken`, optional `Link` (API-LIST-3) |
| Page size above the maximum | Coerce to max (Google, GitHub); reject with `400` | Coerce and document (API-LIST-3) |
| Partial update | JSON Merge Patch (Azure, Zalando); field masks (Google); JSON Patch | Merge Patch; JSON Patch only for array edits (API-METHOD-3) |
| Non-CRUD actions | `POST /orders/42:cancel` (Google); `POST /orders/42/cancel`; state change via `PATCH` | Sub-resource `POST` (API-URL-4) |
| Spec-first vs code-first | Spec-first (Zalando "API first"); code-first with generated specs; TypeSpec | Either; the committed, reviewed spec is the contract (API-SPEC-1) |
| `RateLimit` headers | Adopt the draft now; keep `X-RateLimit-*`; send only `Retry-After` | `429` + `Retry-After` required; draft fields optional (API-HTTP-4) |
| `QUERY` vs `POST …/search` | `QUERY` is now an RFC; tooling support is uneven | `QUERY` where the whole stack supports it, else `POST …/search` (API-METHOD-5) |

## Open questions

- Will the RateLimit draft be published as an RFC before it expires on 24 November 2026, and with the same `q`/`r`/`t`/`w` parameters?
- Will the Idempotency-Key draft be revived, and will it keep `422` for key reuse and `409` for concurrent retries?
- Which gateways, CDNs and frameworks support `QUERY` today, and does OpenAPI tooling (generators, Spectral, Redocly) handle 3.2 well enough to make it the default?
- Should API-HTTP-5 name a standard header for request IDs? None is registered; `Request-Id`, `X-Request-Id` and vendor-specific names are all common.
