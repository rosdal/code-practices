# 3. Methods and idempotency

HTTP method semantics, create and update, retries with idempotency keys, large queries and long-running work.

Each rule says whether it is a standard, official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## API-METHOD-1 Use each method for what RFC 9110 defines. GET and HEAD never change state.

Proxies, caches, browsers, crawlers and retry logic all act on method semantics. They prefetch and cache GETs, and they retry idempotent requests after a dropped connection. A GET that sends an email gets the email sent twice. RFC 9110 §9.2: "the GET, HEAD, OPTIONS, and TRACE methods are defined to be safe", and "PUT, DELETE, and safe request methods are idempotent". POST and PATCH are neither.

Standard: RFC 9110, *HTTP Semantics*, §9.2.

```http
# bad
GET /newsletter/subscribe?email=a%40example.com

# good
POST /newsletter-subscriptions
{ "email": "a@example.com" }
```

## API-METHOD-2 Create with `POST` to the collection. Return `201 Created`, a `Location` header and the new resource.

The `Location` header tells the client where the resource now lives ("identified by either a Location header field in the response or, if no Location header field is received, by the target URI"), and the body saves a second GET. Use `PUT /things/{id}` to create only when the client chooses the ID; then `201` for create and `200` for replace.

Standard: RFC 9110 §15.3.2. Official: Microsoft Azure guidelines (`201` for create, `200` for replace on PUT).

```http
# bad
POST /orders
-> 200 OK
{ "success": true }

# good
POST /orders
-> 201 Created
   Location: /orders/ord_01JA8X3Q
{ "id": "ord_01JA8X3Q", "status": "pending", "createdAt": "2026-10-19T08:30:00Z" }
```

## API-METHOD-3 Update with `PATCH` and JSON Merge Patch. A `null` value removes a field.

`PUT` replaces the whole representation, so a client that sends back an old copy wipes fields added since. JSON Merge Patch (RFC 7396, `application/merge-patch+json`) sends only the fields that change; absent means "leave alone", `null` means "remove". Use JSON Patch (RFC 6902) only when clients must edit arrays element by element.

Standard: RFC 7396. Official: Microsoft Azure guidelines ("create and update resources using PATCH [RFC 5789] with JSON Merge Patch"). Google uses field masks (`update_mask`) instead.

```http
# bad: client must send every field, and a stale copy overwrites newer data
PUT /customers/7
{ "name": "Ada", "email": "ada@example.com", "phone": "+31 20 123 4567", "note": null }

# good
PATCH /customers/7
Content-Type: application/merge-patch+json
{ "phone": null }
```

## API-METHOD-4 Accept an `Idempotency-Key` header on POST operations with side effects.

A client that times out on `POST /payments` can't tell whether the payment happened. With a key, it retries with the same key and gets the original response instead of a second charge. Store the key with a fingerprint of the request and the response, scoped to the caller and kept for at least 24 hours; enforce it with a unique constraint ([DB-TX-6](../database/05-transactions.md)). Reject the same key with a different body, and a retry that arrives while the first request is still running.

Draft: `draft-ietf-httpapi-idempotency-key-header-07` (October 2025, now expired) proposes `422` for key reuse with a different payload and `409` for a concurrent retry. Official practice: Stripe keeps keys for 24 hours, replays the saved status and body (including `500`s) and errors when parameters differ. Cite the draft as a draft.

```http
# bad: a retry after a timeout charges twice
POST /payments
{ "orderId": "ord_42", "amount": "12.50", "currency": "EUR" }

# good
POST /payments
Idempotency-Key: "8e03978e-40d5-43e8-bc93-6894a57f9324"
{ "orderId": "ord_42", "amount": "12.50", "currency": "EUR" }
-> 201 Created   (first attempt)
-> 201 Created   (retry: the saved response, no second charge)
```

## API-METHOD-5 For queries too large for a URL, use `QUERY` where your stack supports it, or `POST` to a `search` sub-resource. Never `GET` with a body.

RFC 9110 gives content in a GET request no defined semantics, and some proxies and clients drop it. `QUERY` (RFC 10008, June 2026) is safe and idempotent like GET but carries the query in the body, and caches must include the body in the cache key. It is new: check that your framework, gateway, CDN and OpenAPI tooling (3.2+) handle it before you depend on it. Until then, `POST /orders/search` works everywhere; document it as safe.

Standard: RFC 10008, *The HTTP QUERY Method*; RFC 9110 §9.3.1. Choosing `POST` as the fallback is convention.

```http
# bad
GET /orders
Content-Type: application/json
{ "status": ["pending", "paid"], "customerIds": ["cus_1", "cus_2"] }

# good
QUERY /orders
Content-Type: application/json
{ "status": ["pending", "paid"], "customerIds": ["cus_1", "cus_2"] }

# good: where QUERY isn't supported end to end
POST /orders/search
Content-Type: application/json
{ "status": ["pending", "paid"], "customerIds": ["cus_1", "cus_2"] }
```

## API-METHOD-6 Return `202 Accepted` with a status resource for long-running work. Don't hold the request open.

Requests that run for minutes hit proxy and load-balancer timeouts, and the client can't tell a slow success from a failure. Accept the work, return `202` with the URL of an operation resource, and let the client poll it (or receive a webhook). The operation resource reports its state and, when done, links to the result or carries a Problem Details error.

Standard: RFC 9110 §15.3.3 ("accepted for processing, but the processing has not been completed"). Official: Microsoft Azure guidelines (`202` plus an `Operation-Location` header). Using `Location` for the status URL is convention.

```http
# bad
POST /reports
-> (connection open for 4 minutes) 504 Gateway Timeout

# good
POST /reports
-> 202 Accepted
   Location: /operations/op_91
GET /operations/op_91
-> 200 OK
{ "id": "op_91", "status": "running" }
```
