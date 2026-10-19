# 6. Collections

Pagination, filtering, sorting and field selection for list endpoints. For the SQL side, see [DB-QUERY-4](../database/04-queries.md) (keyset pagination) and [DB-INDEX](../database/03-indexes.md).

Each rule says whether it is a standard, official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## API-LIST-1 Paginate every collection endpoint from its first release.

Adding pagination later is a breaking change. Existing clients keep reading the first page and silently get a partial result, and auto-paginating client libraries break. A collection that is small today grows, and an unpaginated one is also a resource-exhaustion risk (API-SEC-4).

Official: Google AIP-158 ("must provide pagination at the outset"), including its note that adding it later breaks client libraries.

```http
# bad
GET /orders
-> 200 OK
{ "items": [ ...all 48,000 orders... ] }

# good
GET /orders?pageSize=50
-> 200 OK
{ "items": [ ...50 orders... ], "nextPageToken": "eyJr..." }
```

## API-LIST-2 Paginate with opaque cursor tokens. Not page numbers or offsets.

Offsets skip or repeat items when rows are inserted or deleted between pages, and `OFFSET 100000` makes the database read and discard 100,000 rows. A cursor encodes the position after the last item (the sort key plus a unique tiebreaker such as `id`), so the next page is a keyset query. Make the token opaque: clients must not parse or build it, and base64 of readable JSON invites them to. A token is never an authorization: check access on every page as on any request.

Official: Google AIP-158 ("Base-64 encoding an otherwise-transparent page token is not a sufficient obfuscation mechanism"); Zalando rule 160 (*SHOULD prefer cursor-based pagination, avoid offset-based pagination*). Stripe and GitHub also use cursors on large collections.

```http
# bad
GET /orders?page=2001&perPage=50

# good
GET /orders?pageSize=50&pageToken=eyJr...
```

## API-LIST-3 Use one page envelope across the API: `items`, `nextPageToken`, and a capped `pageSize`.

Every guide names the envelope differently (Azure `value` and `nextLink`, Google `next_page_token`, GitHub `Link` headers), so choose once and generate clients against it. Leave `nextPageToken` out on the last page; its absence is the end signal. Give `pageSize` a documented default and maximum, and lower requests above the maximum to it instead of failing. A `Link` header (RFC 8288) with `rel="next"` can be added alongside the body field for generic HTTP clients.

Official: Google AIP-132 and AIP-158 (default page size, coercion above the maximum, token only when more pages exist); Microsoft Azure guidelines ("DO NOT return the nextLink field at all when returning the last page"). Envelope names are convention.

```jsonc
// bad: a different shape per endpoint, and an end marker clients must remember to check
{ "data": [], "meta": { "page": 3, "lastPage": false, "next": null } }

// good
{
  "items": [{ "id": "ord_51" }, { "id": "ord_52" }],
  "nextPageToken": "eyJrIjoib3JkXzUyIn0"
}
```

## API-LIST-4 Don't return a total count by default.

An exact total runs a `COUNT(*)` over the whole filtered set on every page, which is often slower than fetching the page, and it is stale by the time the client reads it. Clients rarely need more than "is there another page", which `nextPageToken` answers. If a screen needs a total, offer it as an opt-in, and say whether it is an estimate.

Official: Zalando rule 254, *SHOULD avoid a total result count*.

```jsonc
// bad
{ "items": [], "total": 48211, "totalPages": 965 }

// good
{ "items": [], "nextPageToken": "eyJr..." }
```

## API-LIST-5 Filter with one query parameter per field and sort with `sort=-field,field`. Allow-list both.

Plain parameters (`?status=paid&customerId=cus_7`) are easy to document, validate and cache. A sort list with a `-` prefix for descending is short and ordered. Accept only fields you have listed and indexed: an arbitrary sort or filter field is an unindexed full scan someone can trigger on purpose (API-SEC-4), and passing a field name into SQL needs an allow-list anyway ([DB-QUERY-1](../database/04-queries.md)). Offer field selection (`fields=`) only for large resources. For queries too complex for parameters, see API-METHOD-5.

Official: Zalando rule 137 (*MUST stick to conventional query parameters*, including `sort` and `fields`). Google AIP-132 uses `order_by=foo desc,bar` and the AIP-160 filter language instead. The exact syntax is convention.

```http
# bad
GET /orders?where=status%3D'paid'%20OR%201%3D1&orderBy=anyColumn

# good
GET /orders?status=paid&customerId=cus_7&sort=-createdAt,id
```
