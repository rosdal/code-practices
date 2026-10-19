---
name: general
description: Use when writing a commit message, choosing a branch or merge strategy, sizing or splitting a change, opening or reviewing a pull request, writing or fixing tests, deciding what to do about a flaky test or a coverage target, handling or wrapping an error, or naming something, in any language. Also use when a change is getting large, when AI-generated code is about to be submitted, and when a review comment needs wording.
---

# General practices

Each line is one rule from the Rosdal general guide. The ID links to the full rule, with its reason, evidence and examples, in `docs/general/` of https://github.com/rosdal/code-practices. Cite IDs in review comments ("see GEN-REV-1").

Rules marked (E) are backed by research; (C) are contested, with the recommended stance stated; the rest are convention. Do not present a convention as proven. In an existing codebase with its own conventions, consistency wins.

For TypeScript-specific forms of the naming and error rules, also load the `typescript` skill.

## Git & commits

- [GEN-GIT-1] (E) Integrate small changes into the main branch at least daily. Split anything that would take more than a week to land.
- [GEN-GIT-2] (E) Use trunk-based development with short-lived branches. Not long-lived `develop`/`release` branches, unless several released versions must be maintained.
- [GEN-GIT-3] Hide unfinished work behind a feature flag. Not on a long-lived branch. Remove the flag once live.
- [GEN-GIT-4] Make each commit one logical change that builds and passes tests. Not a mix of refactor, fix and reformat.
- [GEN-GIT-5] Write a short imperative summary (under ~72 chars), a blank line, then a body that says why.
- [GEN-GIT-6] (C) Use Conventional Commits only if a tool consumes them, and then enforce them in CI (on the PR title when squash-merging).
- [GEN-GIT-7] (C) Use one merge strategy per repo, written down. Default: squash-merge, with the PR title and description written as the commit message.
- [GEN-GIT-8] If signed commits are required on GitHub, do not allow rebase-merge; it produces unverified commits.
- [GEN-GIT-9] Never rewrite history others have pulled. Force-push only your own branch, with `--force-with-lease`.
- [GEN-GIT-10] Name branches `<ticket>-<short-description>`.

## Code review

- [GEN-REV-1] (E) Send changes small enough to review in one sitting. Put refactors and behavior changes in separate PRs.
- [GEN-REV-2] Respond to a review request within one business day, even if only to say when.
- [GEN-REV-3] (E) Review design, readability and shared understanding as well as correctness. Not only bugs.
- [GEN-REV-4] Leave formatting and style to formatters and linters. Do not comment on them.
- [GEN-REV-5] Label each comment's weight: blocking, suggestion, question, or nit.
- [GEN-REV-6] Approve when the change improves the code and has no blocking issues. Not only when it is perfect.
- [GEN-REV-7] As author, say what and why in the description, and read your own diff before requesting review.
- [GEN-REV-8] (E, limited) Review AI-written code like any other: keep it in small PRs, a human approves, and the author can explain every line. Treat AI review comments as suggestions.
- [GEN-REV-9] Comment on the code, not the person, and give the reason.

## Testing

- [GEN-TEST-1] (E) Use coverage to find untested code, especially on the diff. Never set a coverage percentage as a target.
- [GEN-TEST-2] (E) Fix or delete flaky tests. Quarantine with an owner and deadline. Not indefinite retries.
- [GEN-TEST-3] (E) Test error-handling paths, not only the happy path.
- [GEN-TEST-4] Test behavior through the public interface. Not private state or which helper was called.
- [GEN-TEST-5] (C) Prefer real implementations, then fakes, then mocks. Mock only boundaries you don't control.
- [GEN-TEST-6] (C) Choose test levels by confidence per second of runtime. Not by a pyramid or trophy ratio. Few E2E tests, for critical paths.
- [GEN-TEST-7] One behavior per test, with the behavior in the test name.
- [GEN-TEST-8] Ship every bug fix with a test that fails without the fix.
- [GEN-TEST-9] (E) Consider mutation testing on changed code when coverage is not a strong enough signal.

## Error handling

- [GEN-ERR-1] (E) Never ignore an error, including logging it and carrying on as if it succeeded. Recover in a way you can name, or propagate.
- [GEN-ERR-2] (E) Catch only the errors you can handle. Catch-all only at a top-level boundary.
- [GEN-ERR-3] (E) When wrapping an error, keep the original as its cause.
- [GEN-ERR-4] Handle each error once: handle it or propagate it with added context. Not log-and-rethrow.
- [GEN-ERR-5] (C) Return expected failures as values; throw or panic for bugs and conditions the caller cannot handle.
- [GEN-ERR-6] Validate config and inputs at the boundary and fail fast.
- [GEN-ERR-7] Make error messages name the operation and the input. Never include secrets or personal data.

## Naming

- [GEN-NAME-1] (E) Use full words. Not abbreviations, except ones more familiar than the full word (`id`, `url`).
- [GEN-NAME-2] (E) Name for domain meaning (`unpaidInvoices`). Not type or container (`list`, `data`).
- [GEN-NAME-3] (E) Make a name's length fit its scope. Conventional single letters (`i`, `x`, `n`) are fine in short scopes.
- [GEN-NAME-4] Use one word per concept across the codebase (`get` everywhere, not `get`/`fetch`/`load` for the same thing).
- [GEN-NAME-5] Put the unit in names for quantities whose type has none (`timeoutMs`, `sizeBytes`).
- [GEN-NAME-6] Name booleans as positive predicates (`isVisible`). Not negations (`isNotHidden`).
