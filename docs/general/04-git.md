# 4. Git & commits

How big changes should be, how they reach the main branch, and how to write the history.

Each rule says whether it rests on evidence or on convention. Sources and their limits are in the [appendix](appendix.md#evidence).

## GEN-GIT-1 Integrate small changes into the main branch at least once a day.

Small batches are easier to review, test and revert, and they shorten the time between writing code and learning it is wrong. Anything that takes more than a week to get onto the main branch is too big; split it.

Evidence: DORA's research finds that working in small batches predicts better software delivery and organizational performance (DORA, *Working in small batches*, updated 2025). The research is survey-based, so this is an association. The "daily" and "one week" limits are DORA's practitioner guidance, not measured cutoffs. DORA's 2025 AI Capabilities Model adds that small batches strengthen the benefit of AI-assisted development (see [GEN-REV-8](05-review.md#gen-rev-8-review-ai-written-code-like-any-other-code-a-human-approves-and-the-author-can-explain-it)).

```text
// bad
feature/new-checkout   open 3 weeks, 4,800 lines, merged in one go

// good
checkout-address-form    1 day,   180 lines
checkout-payment-step    1 day,   240 lines (behind the new-checkout flag)
checkout-enable-flag     2 hours,  12 lines
```

## GEN-GIT-2 Use trunk-based development. Not long-lived develop and release branches.

With one main branch and short-lived branches off it, everyone integrates continuously and conflicts stay small. GitFlow's long-lived `develop` and `release/*` branches delay integration until a merge phase.

Evidence: DORA defines trunk-based development as three or fewer active branches, merging to trunk at least daily, and no code freezes or integration phases, and found it associated with higher delivery and operational performance (DORA, data from 2016-2017). The exception is software where you must maintain several released versions at once (installed products, libraries with LTS lines); release branches are justified there.

```text
// bad
main <- release/2.4 <- develop <- feature/* (weeks)

// good
main <- short-lived branches (hours to a day or two)
```

## GEN-GIT-3 Hide unfinished work behind a flag. Not on a branch.

A feature flag lets incomplete code merge to the main branch without being used, which is what makes [GEN-GIT-1](#gen-git-1-integrate-small-changes-into-the-main-branch-at-least-once-a-day) possible for features that take weeks. Remove the flag once the feature is fully live.

Convention: the standard companion practice to trunk-based development; not measured separately.

```ts
// bad: the work lives on a branch until it is finished
// good
if (flags.isEnabled('new-checkout', user)) {
  return renderNewCheckout(cart);
}
return renderCheckout(cart);
```

## GEN-GIT-4 Make each commit one logical change that builds and passes tests.

A commit that does one thing can be reviewed, reverted and found with `git bisect` on its own. A commit that mixes a refactor, a fix and a formatting change cannot be reverted without losing the parts you wanted.

Convention: supported indirectly by the small-batch evidence and by git's own guidance in `SubmittingPatches`.

```text
// bad
a1b2c3  fix login bug, rename helpers, reformat auth module

// good
a1b2c3  Rename session helpers to match the new auth module
d4e5f6  Reject expired refresh tokens at login
```

## GEN-GIT-5 Write commit messages as a short imperative summary, a blank line, and a body that says why.

The summary is what `git log --oneline`, PR lists and release notes show, so keep it under about 72 characters. The diff shows *what* changed; the body is the only place to record *why*.

Convention: git's documentation asks for the imperative mood ("make xyzzy do frotz", not "made" or "makes").

```text
// bad
fixed stuff

// good
Retry webhook delivery on 503 responses

The payment provider returns 503 during its nightly maintenance window.
We dropped those events; now they go to the retry queue like timeouts do.
```

## GEN-GIT-6 Use Conventional Commits only if a tool reads them, and then enforce them in CI.

`feat:`, `fix:` and `feat!:` prefixes pay off when a tool generates the changelog or the version number from them. Without that tool they are ceremony. A convention that is optional ends up used inconsistently, which breaks the tool that relies on it.

Contested: the [Conventional Commits](https://www.conventionalcommits.org/) spec is widely adopted; critics say the type prefix mostly serves tools and that a good summary already implies it. No study measures either side. Recommended stance: if you squash-merge, enforce the format on the PR title, which becomes the commit.

```text
// bad: prefixes nobody consumes, used on some commits but not others
feat: add export
Fix typo
chore: stuff

// good: release tooling reads these, and CI rejects a PR title that doesn't match
feat(export): add CSV export for invoices
fix(auth): reject expired refresh tokens
```

## GEN-GIT-7 Choose one merge strategy per repository and write down why.

- **Squash-merge** gives one commit per PR and spares authors from curating their history, but loses the individual commits.
- **Merge commits** keep each commit and make it easy to revert or bisect parts of a PR, which only helps if the commits are well written ([GEN-GIT-4](#gen-git-4-make-each-commit-one-logical-change-that-builds-and-passes-tests)).
- **Rebase-merge** keeps a linear history with each commit, but on GitHub it produces unsigned commits (see [GEN-GIT-8](#gen-git-8-if-you-require-signed-commits-pick-a-merge-strategy-that-keeps-them-signed)).

Contested: these are documented tradeoffs, not a measured best practice. Recommended stance: squash-merge by default, with the PR title and description written as the commit message. Use merge commits for teams that curate their commits.

```text
// bad
Some PRs squashed, some merged, some rebased, depending on who clicked the button.

// good
CONTRIBUTING.md: "We squash-merge. The PR title becomes the commit summary and the
PR description becomes the body, so write both as a commit message."
```

## GEN-GIT-8 If you require signed commits, pick a merge strategy that keeps them signed.

On GitHub, rebase-and-merge creates new commits that GitHub cannot sign as you, so they show as unverified and fail a "require signed commits" rule. Use squash or merge commits, or rebase and sign locally. Decide what signing protects (release tags, maintainer commits, protected branches) before requiring it for every contributor.

Low evidence: GitHub's documentation confirms the rebase limitation. Whether to require signing is a security tradeoff; OpenBao, for example, stopped requiring it from casual contributors while keeping it for maintainers.

```text
// bad
Branch protection: "Require signed commits" + "Allow rebase merging"

// good
Branch protection: "Require signed commits" + "Allow squash merging" only
```

## GEN-GIT-9 Never rewrite history others have pulled. Force-push only your own branch, with `--force-with-lease`.

Rewriting a shared branch makes everyone else's copy diverge, and a plain `--force` overwrites commits someone pushed after you last fetched. `--force-with-lease` refuses if the remote moved.

Convention.

```text
// bad
git push --force origin main

// good
git push --force-with-lease origin my-branch
```

## GEN-GIT-10 Name branches with the ticket and a short description.

The branch name shows up in PR lists, CI logs and deploy previews. A ticket ID links it to the reason it exists; a few words say what it is.

Convention: no evidence favors one scheme. Pick one and use it everywhere.

```text
// bad
mark-test-2
// good
PAY-412-retry-webhooks
```
