# 2. Error handling

How to handle errors so that failures stay visible and traceable. These rules apply in any language; the examples are TypeScript. For TypeScript-specific forms, see [TS-11](../typescript/11-errors.md).

Each rule says whether it rests on evidence or on convention. Sources and their limits are in the [appendix](appendix.md#evidence).

## GEN-ERR-1 Never ignore an error. Not even with a log line and carry on.

An empty handler, a `TODO`, or a log line followed by normal execution turns a failure into wrong behavior that nobody can trace. Either recover in a way you can name, or let the error propagate.

Evidence: in a study of 198 user-reported failures in Cassandra, HBase, HDFS, MapReduce and Redis, 92% of the catastrophic ones came from incorrect handling of non-fatal errors the code had explicitly signaled. Typical causes were handlers that ignored the error, only logged it, or were left as `TODO` (Yuan et al., 2014).

```ts
// bad
try { await chargeCard(order); } catch (e) { logger.warn(e); }
markOrderPaid(order);
// good
try {
  await chargeCard(order);
} catch (e) {
  throw new PaymentError(`Charging order ${order.id} failed`, { cause: e });
}
markOrderPaid(order);
```

## GEN-ERR-2 Catch only the errors you can handle. Not everything.

A catch-all handler also catches bugs you did not anticipate and handles them as if they were the failure you expected. Catch-all belongs only at a top-level boundary (request handler, job runner, `main`) whose job is to report and contain.

Evidence: generic catch blocks and empty "dummy" handlers are common in Java and C# projects and are associated with more post-release defects (de Pádua & Shang, 2017 and 2018). The link is a correlation.

```ts
// bad: a typo in parse() is reported as "file missing"
try { config = parse(await readFile(path)); } catch { config = defaults; }
// good
try {
  config = parse(await readFile(path));
} catch (e) {
  if (!isFileNotFound(e)) throw e;
  config = defaults;
}
```

## GEN-ERR-3 When you wrap an error, keep the original as its cause.

Replacing an error with a new one ("destructive wrapping") throws away the stack and message that say what actually went wrong. Add context; don't replace it. See [TS-11.3](../typescript/11-errors.md) for the TypeScript form.

Evidence: destructive wrapping is one of the anti-patterns de Pádua & Shang (2017) found most often.

```ts
// bad
try { loadConfig(path); } catch { throw new Error('Failed to load config'); }
// good
try { loadConfig(path); } catch (e) { throw new Error(`Failed to load config from ${path}`, { cause: e }); }
```

## GEN-ERR-4 Handle each error once: either handle it or pass it on. Not both.

Logging an error and then rethrowing it means every layer logs it again. One failure then shows up as five log entries with different messages. Let the boundary that finally handles the error log it, with the context added on the way up.

Convention: common advice in the Go community and elsewhere; not measured.

```ts
// bad
try { await saveDraft(draft); } catch (e) { logger.error(e, 'save failed'); throw e; }
// good: add context and propagate; the request handler logs it once
try { await saveDraft(draft); } catch (e) { throw new Error(`Saving draft ${draft.id} failed`, { cause: e }); }
```

## GEN-ERR-5 Return expected failures as values; throw (or panic) for bugs and conditions the caller cannot handle.

A failure the caller is expected to handle (invalid input, not found, payment declined) belongs in the return type, so the caller can see it and has to deal with it. A broken invariant should stop the current operation loudly.

Contested: Google's style guides prefer exceptions; Rust, Go and functional codebases return errors as values. Recommended stance: values for failures a caller must branch on, exceptions or panics for everything else. See [TS-11.4](../typescript/11-errors.md).

```ts
// bad: a declined card is expected, but the signature hides it
function charge(card: Card, amount: Money): Receipt {}
// good
function charge(card: Card, amount: Money): Result<Receipt, CardDeclined> {}
```

## GEN-ERR-6 Validate configuration and inputs at the boundary, and fail fast.

An invalid value that gets past the boundary fails later, far from the cause, often after partial work has been done. Check config at startup and request input on arrival; refuse to start or reject the request with a clear message. See [TS-19.5](../typescript/19-runtime.md).

Convention.

```ts
// bad: fails on the first request that sends an email, hours after deploy
const sender = new Mailer(process.env.SMTP_URL);
// good: fails at startup with a message that names the setting
const config = parseConfig(process.env); // throws "SMTP_URL is required"
```

## GEN-ERR-7 Make error messages say what failed and for which input. Leave out secrets and personal data.

"Something went wrong" helps nobody. Name the operation and the identifier it ran on. Do not include passwords, tokens, or personal data: error messages end up in logs, alerts and bug trackers.

Convention.

```ts
// bad
throw new Error('Invalid');
throw new Error(`Login failed for ${email} with password ${password}`);
// good
throw new Error(`Invoice ${invoiceId}: total ${total} does not match line items (${sum})`);
```
