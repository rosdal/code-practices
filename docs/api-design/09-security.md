# 9. Security

Design rules for the OWASP API Security Top 10 (2023 edition). Code-level rules are in the language guides: [TS-21](../typescript/21-security.md), [PHP-SEC](../php/06-security.md), [NODE-SEC](../node/04-security.md).

Each rule says whether it is a standard, official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## API-SEC-1 Check that the caller may access the object on every request that takes an ID. Return `404` when they may not know it exists.

Broken object level authorization is first on the OWASP list: change `/orders/42` to `/orders/43` and read someone else's order. Authentication says who the caller is; it says nothing about this object. Scope the lookup itself to what the caller may see, so a missing check fails closed. Returning `404` for objects outside their scope also stops callers from probing which IDs exist. Unguessable IDs help, but are not access control.

Official: OWASP API1:2023, *Broken Object Level Authorization*. Standard: RFC 9110 §15.5.4 (a server may answer `404` to hide a forbidden resource).

```ts
// bad
const order = await db.orders.findById(params.orderId);

// good
const order = await db.orders.findOne({ id: params.orderId, accountId: session.accountId });
if (!order) return notFound();
```

## API-SEC-2 Bind requests through a schema of writable fields, and build responses from a schema of readable fields.

Mass assignment is a body like `{ "name": "Ada", "role": "admin" }` copied straight into the model. Over-exposure is the reverse: serializing the whole row, including `passwordHash` and internal flags, and relying on the client to hide them. Both are property-level authorization failures. Declare which fields each operation accepts and returns; reject unknown and read-only fields in requests with `422` so typos surface as well ([TS-21.2](../typescript/21-security.md)).

Official: OWASP API3:2023, *Broken Object Property Level Authorization*.

```ts
// bad
await db.users.update(session.userId, request.body);
return Response.json(user);

// good
const input = UpdateProfile.parse(request.body); // only name and phone; unknown keys rejected
await db.users.update(session.userId, input);
return Response.json(toProfileResponse(user));
```

## API-SEC-3 Authorize every operation by role or scope, deny by default. Don't rely on hidden or unlinked endpoints.

Admin endpoints are found by guessing (`/admin/users`, `DELETE` on a path that allows `GET`) or by reading the client bundle. Put the authorization decision on every route, from one policy, with a default of deny, so a new endpoint without a rule fails closed.

Official: OWASP API5:2023, *Broken Function Level Authorization*.

```ts
// bad
router.delete('/users/:id', deleteUser); // "only the admin UI links to it"

// good
router.delete('/users/:id', requireScope('users:delete'), deleteUser);
```

## API-SEC-4 Put a limit on everything a request can make the server do.

Every unbounded input is a cost or availability problem: page size, body size, string and array lengths, upload size, query complexity, sortable fields, and calls to paid services such as SMS or email. Set the limits in the OpenAPI schema (`maxLength`, `maxItems`, `maximum`) so they are validated and documented, and add per-caller rate limits (API-HTTP-4). Protect business flows that automation can abuse, such as sign-up, checkout or referral credit, with limits per account, device or payment method.

Official: OWASP API4:2023, *Unrestricted Resource Consumption*, and API6:2023, *Unrestricted Access to Sensitive Business Flows*.

```yaml
# bad
name: { type: string }
tags: { type: array, items: { type: string } }

# good
name: { type: string, maxLength: 200 }
tags: { type: array, maxItems: 20, items: { type: string, maxLength: 50 } }
```

## API-SEC-5 Send credentials only in the `Authorization` header, over HTTPS. Never in the URL.

URLs end up in access logs, proxy logs, browser history and `Referer` headers, so a token in `?access_token=` leaks to everyone who can read any of them. Serve the API over HTTPS only. Use short-lived bearer tokens from an established protocol (OAuth 2.0 / OpenID Connect) rather than a homemade scheme, and keep personal data out of paths and query strings for the same reason.

Official: OWASP API2:2023, *Broken Authentication*; RFC 6750 §5.3 advises against bearer tokens in page URLs.

```http
# bad
GET http://api.example.com/orders?access_token=eyJhbGci...&email=ada%40example.com

# good
GET https://api.example.com/orders
Authorization: Bearer eyJhbGci...
```

## API-SEC-6 Fetch a URL from a request only after checking it against an allow-list.

Webhooks, "import from URL" and avatar fetches make your server send requests on the caller's behalf. Without checks, a caller points them at `http://169.254.169.254/` (cloud metadata) or an internal admin service. Allow only `https`, resolve the host and reject private, loopback and link-local addresses (check again after redirects, or don't follow them), and prefer an allow-list of hosts where the set is known.

Official: OWASP API7:2023, *Server Side Request Forgery*.

```ts
// bad
const image = await fetch(body.avatarUrl);

// good
const url = await assertPublicHttpsUrl(body.avatarUrl); // scheme, DNS and IP-range checks
const image = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5_000) });
```

## API-SEC-7 Configure CORS with an explicit list of origins. Never reflect the `Origin` header or combine `*` with credentials.

A CORS policy that echoes any `Origin` back with `Access-Control-Allow-Credentials: true` lets any website make authenticated calls with your users' cookies and read the responses. List the origins that may call the API; an API used only server-to-server or with bearer tokens from native apps needs no CORS headers at all.

Official: OWASP API8:2023, *Security Misconfiguration*.

```http
# bad
Access-Control-Allow-Origin: https://evil.example   (copied from the request)
Access-Control-Allow-Credentials: true

# good
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin
```

## API-SEC-8 Keep an inventory of every host and version you run, and remove the ones you don't support.

Attackers find the old `v1`, the staging host with production data, and the debug endpoint nobody remembers, because those miss the fixes the current API got. Every deployed version and environment belongs in the inventory and the OpenAPI description (API-SPEC-1); anything past its `Sunset` date (API-VER-4) gets switched off.

Official: OWASP API9:2023, *Improper Inventory Management*.

```text
// bad
api.example.com/v2 (current), api.example.com/v1 (still up, unpatched),
beta-api.example.com (production database, no rate limits).

// good
api.example.com/v2 only; v1 returned 410 Gone after its Sunset date;
staging uses its own data and is not public.
```

## API-SEC-9 Validate responses from third-party APIs as you would user input.

Data from a partner, a payment provider or an AI service can be wrong, malicious or compromised upstream. Parse it against a schema, put timeouts and size limits on the call, follow redirects only where needed, and never pass its fields into SQL, shell commands or HTML without the same treatment as request input.

Official: OWASP API10:2023, *Unsafe Consumption of APIs*.

```ts
// bad
const partner = await (await fetch(partnerUrl)).json();
await db.query(`UPDATE shops SET name = '${partner.name}'`);

// good
const partner = PartnerShop.parse(await (await fetch(partnerUrl, { signal: AbortSignal.timeout(5_000) })).json());
await db.query('UPDATE shops SET name = $1 WHERE id = $2', [partner.name, shopId]);
```
