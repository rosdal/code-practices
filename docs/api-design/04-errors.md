# 4. Status codes and errors

Choosing a status code, and the shape of an error body. For how code raises and handles errors internally, see [GEN-ERR](../general/02-errors.md).

Each rule says whether it is a standard, official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## API-ERR-1 Return errors as Problem Details (RFC 9457) with `Content-Type: application/problem+json`.

One error shape across every endpoint lets clients write one error handler, and a standard shape works with existing libraries, gateways and docs tooling. RFC 9457 (July 2023) obsoletes RFC 7807; the format is the same, so guides that cite 7807 are only out of date in what they cite. The members are `type`, `title`, `status`, `detail` and `instance`; add extension members for machine-readable data. `status` is advisory and must match the real HTTP status.

Standard: RFC 9457. Official: Zalando rule 176, *MUST support problem JSON*. Google AIP-193 uses `google.rpc.Status` instead; see the [appendix](appendix.md#contested-points-and-recommended-stances).

```jsonc
// bad
{ "success": false, "error": "Something went wrong", "code": 5 }

// good: HTTP/1.1 403 Forbidden, Content-Type: application/problem+json
{
  "type": "https://api.example.com/problems/out-of-credit",
  "title": "You do not have enough credit.",
  "status": 403,
  "detail": "Your current balance is 30, but that costs 50.",
  "instance": "/accounts/12345/messages/abc",
  "balance": 30
}
```

## API-ERR-2 Give every error a stable `type` URI that clients can branch on. Clients never parse `title` or `detail`.

Messages get reworded and translated; a client that matches on `"detail": "Insufficient funds"` breaks when someone fixes a typo. The `type` URI is the stable identifier, and anything a client needs to act on (the balance, the limit, the conflicting ID) goes in an extension member. Point `type` at a page that documents the error, and list every `type` in the OpenAPI description. When `type` is absent it means `about:blank`: the status code is all there is.

Standard: RFC 9457 §3.1.4 ("Consumers SHOULD NOT parse the 'detail' member for information"). Google AIP-193 requires the same thing as a stable `reason` in `ErrorInfo`.

```ts
// bad
if (problem.detail?.includes('balance')) showTopUp();

// good
if (problem.type === 'https://api.example.com/problems/out-of-credit') showTopUp(problem.balance);
```

## API-ERR-3 Report every validation failure in one response, each with a JSON Pointer to the field.

Returning the first failure only makes a client fix and resubmit once per field. List all of them, and point at each field with a JSON Pointer (RFC 6901) so a form can mark the right input.

Standard: the `errors` array with `detail` and `pointer` is the example in RFC 9457 §3. The member name is an extension, so use the same one everywhere.

```jsonc
// bad
{ "type": "https://api.example.com/problems/validation-error", "title": "age is invalid" }

// good: HTTP/1.1 422 Unprocessable Content
{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Your request is not valid.",
  "status": 422,
  "errors": [
    { "detail": "must be a positive integer", "pointer": "#/age" },
    { "detail": "must be 'green', 'red' or 'blue'", "pointer": "#/profile/color" }
  ]
}
```

## API-ERR-4 Pick the status code by its RFC 9110 meaning. Never `200` with an error body.

Clients, retry logic, monitoring and caches act on the status code before they read the body. A `200 OK` with `"success": false` is cached, counted as a success and never retried. A `5xx` for a client mistake pages the on-call engineer and invites retries that can't succeed.

Standard: RFC 9110 §15; RFC 6585 for `428` and `429`. The `400` versus `422` split is contested; see the [appendix](appendix.md#contested-points-and-recommended-stances).

| Situation | Status |
|---|---|
| Body can't be parsed, wrong `Content-Type` structure, bad query syntax | `400 Bad Request` |
| No credentials, or invalid ones (send `WWW-Authenticate`) | `401 Unauthorized` |
| Authenticated, but not allowed to do this | `403 Forbidden` |
| Doesn't exist, or the caller may not know it exists (API-SEC-1) | `404 Not Found` |
| Method not supported on this resource (send `Allow`) | `405 Method Not Allowed` |
| Conflicts with current state: duplicate, invalid state transition | `409 Conflict` |
| `If-Match` or another precondition failed (API-HTTP-2) | `412 Precondition Failed` |
| Media type not supported | `415 Unsupported Media Type` |
| Well-formed, but fails validation or business rules | `422 Unprocessable Content` |
| Precondition required but missing | `428 Precondition Required` |
| Rate limit exceeded (API-HTTP-4) | `429 Too Many Requests` |
| A bug or an unavailable dependency on our side | `500` / `502` / `503` / `504` |

```http
# bad
POST /orders
-> 200 OK
{ "success": false, "error": "Order already paid" }

# good
POST /orders/ord_42/cancel
-> 409 Conflict
   Content-Type: application/problem+json
{ "type": "https://api.example.com/problems/order-already-paid", "title": "The order is already paid.", "status": 409 }
```

## API-ERR-5 Never put stack traces, SQL, internal hostnames or exception messages in an error response.

Internals in an error body tell an attacker your framework, schema and network layout (OWASP API8:2023, *Security Misconfiguration*), and they leak personal data from the failing input. Log the details server-side under a request ID, and return that ID so support can find the log line ([GEN-ERR-7](../general/02-errors.md)).

Official: Zalando rule 177, *MUST not expose stack traces*; OWASP API Security Top 10 2023.

```jsonc
// bad
{ "title": "error: duplicate key value violates unique constraint \"users_email_key\"", "stack": "at Pool.query (pg/lib/pool.js:45)" }

// good
{
  "type": "about:blank",
  "title": "Internal Server Error",
  "status": 500,
  "requestId": "req_7f3a9c"
}
```
