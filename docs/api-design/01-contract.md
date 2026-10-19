# 1. Contract

The OpenAPI description as the source of truth: which version, how it is reviewed, and how CI guards it.

Each rule says whether it is a standard, official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## API-SPEC-1 Keep an OpenAPI description in the repo and review it as the contract.

Clients depend on the shape of requests and responses, not on your handler code. A committed description makes that shape reviewable in a PR, gives you one place to see every endpoint (OWASP API9:2023, *Improper Inventory Management*), and lets you generate docs, client types and validators. Spec-first or code-first is a team choice: write the YAML first, or generate it from typed code (or TypeSpec). Either way, commit the generated file and review its diff, because that diff is the API change.

Official: Zalando rule 100, *MUST follow API first principle*. Spec-first versus code-first is contested; see the [appendix](appendix.md#contested-points-and-recommended-stances).

```text
// bad
The API is whatever the handlers return. Docs are a wiki page updated by hand.

// good
openapi/orders.yaml is committed, generated or hand-written, and every PR that
changes an endpoint shows the change in that file.
```

## API-SPEC-2 Write OpenAPI 3.1. Move to 3.2 when every tool in your chain supports it.

OpenAPI 3.1 aligns Schema Objects with JSON Schema 2020-12, so one schema validates the same way everywhere. 3.0 used its own dialect, with `nullable: true` instead of a `null` type. OpenAPI 3.2.0 (September 2025; 3.2.1 is the current patch) adds the `QUERY` method, streaming media types (SSE, JSON Lines), nested tags and the OAuth device flow. It is backwards compatible with 3.1, but generators, linters and gateways adopt it at different speeds.

Official: OpenAPI Initiative, published versions and the 3.2 announcement. Tooling readiness is a judgement; check yours.

```yaml
# bad: OpenAPI 3.0 dialect
openapi: 3.0.3
components:
  schemas:
    Order:
      properties:
        note: { type: string, nullable: true }

# good
openapi: 3.1.1
components:
  schemas:
    Order:
      properties:
        note: { type: [string, 'null'] }
```

## API-SPEC-3 Lint the description and fail CI on unintended breaking changes.

A linter (Spectral, Redocly) enforces the conventions in this guide mechanically: casing, error responses on every operation, pagination parameters. A diff tool such as `oasdiff` compares the PR's description with `main` and flags removed fields, new required parameters and narrowed types (API-VER-1), so a break needs an explicit decision.

Convention.

```yaml
# good: CI step
- run: npx @redocly/cli lint openapi/orders.yaml
- run: git show origin/main:openapi/orders.yaml > base.yaml
- run: oasdiff breaking base.yaml openapi/orders.yaml --fail-on ERR
```

## API-SPEC-4 Generate validation and client types from the description. Don't maintain them by hand next to it.

Hand-written request validators and client types drift from the description, and then the description lies. Generate types and runtime validators from the spec, or generate the spec from the validators (API-SPEC-1); either way there is one source. Validate requests at the boundary against it ([GEN-ERR-6](../general/02-errors.md)).

Convention.

```text
// bad
openapi.yaml, src/validation/order.ts and web/src/api/types.ts each describe Order.

// good
openapi.yaml -> generated server validators and generated client types.
```
