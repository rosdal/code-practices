# 8. HTTP features

Conditional requests, caching, rate limiting and request IDs.

Each rule says whether it is a standard, official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## API-HTTP-1 Send an `ETag` on single resources, and answer `If-None-Match` with `304 Not Modified`.

An `ETag` lets a client revalidate a cached copy without downloading it again, and it is what API-HTTP-2 builds on. Derive it from a version column or a hash of the representation, not from a timestamp with one-second resolution.

Standard: RFC 9110 §8.8.3 and §13.1.2. Official: Microsoft Azure guidelines (honour `If-Match`, `If-None-Match`); Zalando rule 182 makes it a MAY.

```http
# good
GET /orders/ord_42
-> 200 OK
   ETag: "v17"

GET /orders/ord_42
If-None-Match: "v17"
-> 304 Not Modified
```

## API-HTTP-2 Prevent lost updates with `If-Match` on `PUT`, `PATCH` and `DELETE`. Return `412` when it doesn't match.

Two users load the same order and both save; without a check the second save silently overwrites the first. With `If-Match`, the server applies the change only if the resource still has the ETag the client read; otherwise it returns `412 Precondition Failed` and the client reloads. Servers must use strong comparison for `If-Match`. Where lost updates matter, require the header and return `428 Precondition Required` when it is missing.

Standard: RFC 9110 §13.1.1 ("prevent the method from being applied if there have been any changes to the representation data"); RFC 6585 for `428`. Official: Microsoft Azure guidelines (`412` when `If-Match` doesn't equal the latest ETag).

```http
# bad: last write wins
PATCH /orders/ord_42
{ "note": "Leave at the door" }

# good
PATCH /orders/ord_42
If-Match: "v17"
Content-Type: application/merge-patch+json
{ "note": "Leave at the door" }
-> 412 Precondition Failed   (someone else saved v18 first)
```

## API-HTTP-3 Set `Cache-Control` on every response. Use `no-store` for personal or authenticated data unless you designed it to be cached.

Without `Cache-Control`, caches apply heuristics, and a shared proxy or CDN can serve one user's response to another. Decide per endpoint: `no-store` for account and personal data, `private, max-age=…` for per-user data that may sit in the browser cache, `public, max-age=…` only for data that is the same for everyone.

Standard: RFC 9111, *HTTP Caching*. Defaults per endpoint are convention.

```http
# bad
GET /me
-> 200 OK
   (no Cache-Control)

# good
GET /me
-> 200 OK
   Cache-Control: no-store
GET /countries
-> 200 OK
   Cache-Control: public, max-age=86400
```

## API-HTTP-4 Rate limit with `429 Too Many Requests` and `Retry-After`. Treat the `RateLimit` headers as a draft.

`429` with `Retry-After` is standard, and clients and SDKs already back off on it. The IETF `RateLimit` and `RateLimit-Policy` fields are still an Internet-Draft (`-11`, May 2026, expires November 2026). You may send them, but don't make clients depend on them, and don't use the older `RateLimit-Limit` / `-Remaining` / `-Reset` triple from earlier drafts. Body the `429` as Problem Details (API-ERR-1).

Standard: RFC 6585 (`429`), RFC 9110 §10.2.3 (`Retry-After`). Draft: `draft-ietf-httpapi-ratelimit-headers-11`. Official: Zalando rule 153 (*MUST use code 429 with headers for rate limits*).

```http
# bad
-> 503 Service Unavailable
   X-RateLimit-Reset: 1760862600

# good
-> 429 Too Many Requests
   Retry-After: 30
   RateLimit-Policy: "default";q=100;w=60
   RateLimit: "default";r=0;t=30
   Content-Type: application/problem+json
```

## API-HTTP-5 Return a request ID on every response, and propagate the caller's trace context.

When a client reports a failure, a request ID is the only thing that connects their screenshot to your logs. Return it in a header and in error bodies (API-ERR-5). Accept the W3C `traceparent` header so a trace continues across services instead of starting again at your edge.

Standard: W3C Trace Context. Official: Microsoft Azure guidelines (log the caller's `x-ms-client-request-id`, return a unique request ID). The header name is convention.

```http
# good
GET /orders/ord_42
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
-> 200 OK
   Request-Id: req_7f3a9c
```
