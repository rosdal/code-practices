# 3. Testing

What to test, how to judge a test suite, and what to do when tests misbehave. These rules apply in any language; the examples are TypeScript with a Vitest/Jest-style API. For testing types, see [TS-18](../typescript/18-testing-types.md).

Each rule says whether it rests on evidence or on convention. Sources and their limits are in the [appendix](appendix.md#evidence).

## GEN-TEST-1 Use coverage to find untested code. Not as a target.

Coverage measures which lines ran, not whether anything checked the result. Once a number is a target, tests get written to hit it. Look at coverage of the changed lines during review and ask whether the uncovered lines matter.

Evidence: across 31,000 generated test suites for five Java systems, coverage correlated only low to moderately with fault detection once suite size was controlled for, and the authors concluded a fixed coverage target "is unlikely to produce an effective test suite" (Inozemtseva & Holmes, 2014). Other studies report stronger correlations, so do not claim coverage is meaningless. Google does not mandate a coverage percentage and shows coverage of the changed code in review (Ivanković et al., 2019).

```ts
// bad: 100% line coverage, nothing verified
test('formatPrice', () => {
  formatPrice(1999, 'EUR');
});
// good
test('formatPrice formats cents as a currency string', () => {
  expect(formatPrice(1999, 'EUR')).toBe('€19.99');
});
```

## GEN-TEST-2 Fix or delete a flaky test. Don't retry it forever.

A test that sometimes fails for no reason teaches the team to re-run CI instead of reading failures, and then real failures get ignored too. Quarantine a flaky test with an owner and a deadline; after that, fix it or delete it.

Evidence: at Google about 1.5% of test runs report a flaky result, and almost 16% of tests show some flakiness. Automatic retries cut false alarms but "encourage developers to ignore flakiness" (Google Testing Blog, 2016).

```ts
// bad
test('syncs the cart', { retry: 5 }, async () => {});
// good: quarantined with an owner and a deadline
test.skip('syncs the cart', async () => {}); // flaky: TICKET-123, owner @ana, fix by 2026-11-01
```

## GEN-TEST-3 Test the error-handling paths, not only the happy path.

Error handlers run rarely, so they are where untested code hides, and they run exactly when something has already gone wrong. Write at least one test for each handler that does more than rethrow. See [GEN-ERR-1](02-errors.md#gen-err-1-never-ignore-an-error-not-even-with-a-log-line-and-carry-on).

Evidence: Yuan et al. (2014) found that in 58% of the catastrophic failures they studied, the fault could have been caught by simple tests of the error-handling code.

```ts
// bad: only the success case
test('uploads the file', async () => {});
// good
test('uploads the file', async () => {});
test('keeps the local copy when the upload fails', async () => {});
```

## GEN-TEST-4 Test behavior through the public interface. Not implementation details.

A test that reads private fields or checks which internal helper was called breaks on every refactor, even when behavior stays the same. Tests should fail when behavior breaks and pass when it doesn't.

Convention: the position of *Software Engineering at Google* (ch. 12) and most testing literature; not measured.

```ts
// bad
cart.add(book);
expect(cart['items'].length).toBe(1);
// good
cart.add(book);
expect(cart.total()).toEqual(book.price);
```

## GEN-TEST-5 Prefer real implementations and fakes. Mock only at boundaries you don't control.

A mock asserts how your code talks to a dependency, so it fails when the conversation changes and passes when the dependency's real behavior changes. Use the real object when it is fast and deterministic, a fake (in-memory database, fake clock) when it isn't, and a mock for third-party services and the network.

Contested: *Software Engineering at Google* (ch. 13) prefers real implementations, then fakes, then mocks; the "London school" of TDD mocks every collaborator by design. No study settles it. Recommended stance: the Google order.

```ts
// bad: the test passes as long as save() is called, whatever it does
const repo = { save: vi.fn() };
await registerUser(repo, input);
expect(repo.save).toHaveBeenCalled();
// good
const repo = new InMemoryUserRepository();
await registerUser(repo, input);
expect(await repo.findByEmail(input.email)).toBeDefined();
```

## GEN-TEST-6 Choose test levels by confidence per second. Not by a shape.

The test pyramid, the testing trophy and the honeycomb are opinions about the right mix; none has outcome data behind it. Most tests should be fast enough to run on every save and should use real collaborators where they can. Keep a small number of end-to-end tests for the paths that would hurt most if they broke.

Contested: see the [appendix](appendix.md#contested-points-and-recommended-stances).

```text
// bad
"We need 70% unit, 20% integration, 10% E2E."
// good
"Checkout, login and signup each have one E2E test. Everything else is covered by
fast tests against an in-memory database, which run in under 10 seconds."
```

## GEN-TEST-7 Give each test one behavior, and name the test for it.

When a test named `test2` or `works` fails, the reader has to open it to learn what broke. A name that states the behavior is the failure message.

Convention.

```ts
// bad
test('cart', () => {});
// good
test('applies the discount once even when the code is entered twice', () => {});
```

## GEN-TEST-8 Ship every bug fix with a test that fails without the fix.

The test proves the fix works and stops the same bug from coming back. Write it first and watch it fail; a test that never failed may not test the bug.

Convention.

```text
// bad
fix: handle empty cart in checkout

// good
fix: handle empty cart in checkout

Adds "rejects checkout with an empty cart", which failed before this change.
```

## GEN-TEST-9 Consider mutation testing on the changed code when coverage is not enough.

Mutation testing changes the code (flips a `<`, deletes a line) and checks whether any test fails. It measures whether tests check results, which coverage does not. Running it on the whole codebase is slow; running it on the diff during review is practical.

Evidence: Google runs mutation testing on changed code during code review for more than 24,000 developers (Petrović et al., 2021). This is one company's system; whether it pays off for small teams has not been measured.

```text
// bad
Mutation-test the whole repository nightly; nobody reads the 4,000 surviving mutants.

// good
Run a mutation tool on the files a PR changes and show the surviving mutants in review.
```
