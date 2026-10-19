# 2. Resources and URLs

How to name resources and lay out paths. Rules about secrets in URLs are in [security](09-security.md).

Each rule says whether it is a standard, official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## API-URL-1 Name collections with plural nouns. Keep verbs out of paths.

The HTTP method is the verb. `GET /orders/42` and `DELETE /orders/42` read as operations on one resource; `/getOrder` and `/deleteOrder` duplicate the method, and every new operation adds a path instead of reusing one.

Official: Zalando rules 134 (*MUST pluralize resource names*) and 141 (*MUST keep URLs verb-free*).

```http
# bad
GET  /getOrder?id=42
POST /createOrder
POST /order/42/delete

# good
GET    /orders/42
POST   /orders
DELETE /orders/42
```

## API-URL-2 Write path segments in lowercase kebab-case, with no trailing slash and no file extension.

Paths are case-sensitive, and `/orders/` and `/orders` are different URLs to caches and routers. One normalized form avoids duplicate cache entries and routes that work only with or without the slash. Format comes from `Accept`, not `.json`.

Official: Zalando rules 129 (*MUST use kebab-case for path segments*) and 136 (*MUST use normalized paths without empty path segments and trailing slashes*).

```http
# bad
GET /shippingAddresses/
GET /shipping_addresses/7.json

# good
GET /shipping-addresses/7
```

## API-URL-3 Nest one level, and only for ownership. Give every resource its own canonical URL.

`/customers/7/orders` is a useful filtered view because an order belongs to a customer. Deeper paths (`/customers/7/orders/42/lines/3/discounts`) force callers to know every parent ID before they can touch a child, and break when a parent changes. Once an object has its own ID, address it directly.

Convention.

```http
# bad
GET /customers/7/orders/42/lines/3

# good
GET /customers/7/orders
GET /orders/42
GET /order-lines/3
```

## API-URL-4 Model actions that aren't CRUD as a POST to a sub-resource named after the action.

Some operations don't fit create, read, update or delete: cancel, refund, resend. Encoding them as a `PATCH` of a `status` field hides the business rules and the side effects behind a generic update. A `POST` to a named sub-resource is explicit and gets its own authorization check (API-SEC-3). When the action produces a record of its own, such as a refund, create that resource instead.

Convention. Google AIP-136 writes the same idea as a custom method, `POST /orders/42:cancel`; pick one form per API.

```http
# bad
PATCH /orders/42
{ "status": "cancelled" }

# good
POST /orders/42/cancel
POST /refunds
{ "orderId": "ord_42", "amount": "12.50", "currency": "EUR" }
```
