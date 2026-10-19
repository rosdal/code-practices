# 1. Naming

How to choose names that a reader understands without opening the definition. These rules apply in any language; the examples are TypeScript. For casing and TypeScript-specific forms, see [TS-7](../typescript/07-naming.md).

Each rule says whether it rests on evidence or on convention. Sources and their limits are in the [appendix](appendix.md#evidence).

## GEN-NAME-1 Use full words in names. Not abbreviations.

Readers understand full-word names faster. Abbreviations that are more familiar than the full word (`id`, `url`, `html`, `db`) are fine.

Evidence: in a controlled experiment, 72 professional developers found defects about 19% faster in code with full-word identifiers than with letters or abbreviations (Hofmeister et al., 2017). The effect is real but modest, so this is a default, not an absolute.

```ts
// bad
function calcTtlPrc(qty: number, unitPrc: number, dscPct: number) {}
// good
function calculateTotalPrice(quantity: number, unitPrice: number, discountPercent: number) {}
```

## GEN-NAME-2 Name things for what they mean in the domain. Not for their type or container.

`data`, `list`, `info` and `result` tell the reader the shape, which the type already says. The name should say what the value *is*.

Evidence: developers found semantic defects about 14% faster with descriptive compound names than with short, generic ones (Schankin et al., 2018). The benefit did not extend to syntax errors: good names help with meaning, not with typos.

```ts
// bad
const list = invoices.filter((x) => x.paidAt === undefined);
// good
const unpaidInvoices = invoices.filter((invoice) => invoice.paidAt === undefined);
```

## GEN-NAME-3 Make a name's length fit its scope.

A loop index read on the next line can be `i`. A value read 50 lines away or in another file needs a descriptive name. Single letters with a conventional role (`i`, `j` for indices, `x`, `y` for coordinates, `n` for a count) are clear to most readers.

Evidence: experiments that changed only variable names found no significant effect for conventional single letters (Beniamini et al., 2017). The cost of short names shows up when the scope is long or the role is unconventional.

```ts
// bad: `d` lives across the whole function and means something specific
const d = daysBetween(order.createdAt, now);
// good
for (let i = 0; i < rows.length; i++) {}
const daysSinceOrder = daysBetween(order.createdAt, now);
```

## GEN-NAME-4 Use one word per concept across the codebase.

If `fetchUser`, `getOrder` and `loadInvoice` all do the same kind of thing, readers start looking for a difference that isn't there. Pick one verb and use it everywhere; use a different verb only when the behavior is different.

Convention: widely recommended (for example *Clean Code*, ch. 2) but not measured.

```ts
// bad: three verbs, same behavior
async function fetchUser(id: string) {}
async function getOrder(id: string) {}
async function loadInvoice(id: string) {}
// good
async function getUser(id: string) {}
async function getOrder(id: string) {}
async function getInvoice(id: string) {}
```

## GEN-NAME-5 Put the unit in names for quantities whose type does not carry one.

A bare `timeout: number` makes every caller guess between seconds and milliseconds. If the language has a duration or money type, use that instead; then the type carries the unit.

Convention.

```ts
// bad
const timeout = 30;
setTimeout(retry, timeout); // 30 ms, not 30 s
// good
const timeoutMs = 30_000;
setTimeout(retry, timeoutMs);
```

## GEN-NAME-6 Name booleans as positive predicates. Not negations.

`isEnabled` reads correctly; `isNotDisabled` makes the reader undo a negative, and `!isNotDisabled` makes them undo two. See [TS-7.4](../typescript/07-naming.md) for the `is`/`has`/`can`/`should` prefixes.

Convention.

```ts
// bad
if (!isNotVisible) {}
// good
if (isVisible) {}
```
