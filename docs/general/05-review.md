# 5. Code review

What to send for review, how fast to respond, what to look for, and how to write comments.

Each rule says whether it rests on evidence or on convention. Sources and their limits are in the [appendix](appendix.md#evidence).

## GEN-REV-1 Send changes small enough to review in one sitting. Separate refactors from behavior changes.

Reviewers give fewer useful comments and take longer as a change grows. A rename mixed into a bug fix hides the fix among hundreds of mechanical lines. Large deletions and automated refactorings are the exception: their size is not the hard part.

Evidence: at Google the median change touches 24 lines, and over a third touch a single file. Studies at Microsoft and in open source found that useful comments decrease and review time increases as change size grows (Sadowski et al., 2018). These are correlations from 2014-2016 data.

```text
// bad
"Fix rounding in invoice totals" — 1,900 lines across 46 files, including a module rename

// good
PR 1: "Rename billing/legacy to billing/invoices" — 46 files, no behavior change
PR 2: "Fix rounding in invoice totals" — 3 files, 40 lines
```

## GEN-REV-2 Respond to a review request within one business day.

Slow reviews make authors batch up work, which makes changes larger, which makes reviews slower. The first response doesn't have to be the full review; saying when you will get to it unblocks the author's planning.

Evidence: at Google the median time to first feedback is under an hour for small changes and the median full review under four hours (Sadowski et al., 2018). That is one company's data from 2016; the one-business-day maximum is Google's published guidance, not a measured threshold.

```text
// bad
PR waits three days with no response.

// good
Within a few hours: "Looking at this after lunch. The migration part might need a second reviewer."
```

## GEN-REV-3 Review for design, readability and shared understanding as well as bugs.

Most of the value of code review is not defects found. It is code the next person can understand, knowledge spread across the team, and better alternatives found. A review that only hunts for bugs misses most of what review is good at.

Evidence: at Microsoft, developers named finding defects as the main reason for review, but reviews turned up fewer defects than expected and delivered knowledge transfer, team awareness and alternative solutions instead (Bacchelli & Bird, 2013). Google introduced code review mainly to improve understandability and maintainability (Sadowski et al., 2018).

```text
// bad
"LGTM, no bugs spotted."

// good
"No bugs spotted. I had to read applyRules() three times to see that order matters;
could the name or a comment say that? Also, billing/discounts.ts already has a
helper for this."
```

## GEN-REV-4 Leave formatting and style to tools.

Every review comment about indentation or quote style is one a formatter or linter could have made instantly, and it pulls attention away from what tools can't check. If a style point keeps coming up, add a lint rule.

Convention: the same principle as this guide's "tooling enforces what it can".

```text
// bad
"Missing semicolon." "Use single quotes." "Line too long."

// good
CI runs the formatter and linter; review comments are about behavior and design.
```

## GEN-REV-5 Say how much each comment matters.

Without a label, authors can't tell a blocking problem from a passing preference, so they either argue with everything or change everything. Mark comments as blocking, a suggestion, a question, or a nit.

Convention: Google's guide uses a "Nit:" prefix; [Conventional Comments](https://conventionalcomments.org/) defines a fuller set of labels. Either works; pick one per team.

```text
// bad
"This should be a map."

// good
"suggestion (non-blocking): a Map would make the lookup O(1), but the list has
five items, so this is fine as is."
"issue (blocking): this deletes the user's drafts when the request times out."
```

## GEN-REV-6 Approve when the change improves the code. Not when it is perfect.

Holding a change for polish that doesn't affect correctness or clarity slows the team and makes changes larger. If the change makes the codebase better overall and has no blocking issues, approve it; ask for follow-ups in a ticket.

Convention: Google's eng-practices guide, *The Standard of Code Review*.

```text
// bad
Fourth round of requested changes, all about naming preferences.

// good
"Approved. The naming nits are optional; the retry policy deserves its own
ticket, so I filed PAY-431."
```

## GEN-REV-7 As the author, explain what and why in the description, and review your own diff first.

The reviewer can see the diff but not the reason for it. A description that says what problem this solves, what you chose not to do, and how you tested it saves a round of questions. Reading your own diff before requesting review catches debug code and stray changes.

Convention.

```text
// bad
Title: "Updates"
Description: (empty)

// good
Title: "Retry webhook delivery on 503 responses"
Description: "The provider returns 503 during nightly maintenance and we dropped
those events. They now go to the retry queue. Tested by replaying last week's
failed events in staging."
```

## GEN-REV-8 Review AI-written code like any other code. A human approves, and the author can explain it.

AI tools generate large changes quickly, which makes small batches ([GEN-GIT-1](04-git.md#gen-git-1-integrate-small-changes-into-the-main-branch-at-least-once-a-day)) and careful review more important, not less. Treat AI review comments as suggestions for a human to accept or reject. An author who can't explain a line they are submitting is not ready to submit it.

Evidence, limited: DORA's 2025 AI Capabilities Model finds that small batches and frequent commits strengthen the benefit of AI-assisted development (survey moderation effects, no effect sizes published). At Google, authors resolve 7.5% of reviewer comments by applying an ML-suggested edit to a comment a human wrote, with a human deciding (Frömmgen et al., 2024). There is no good data yet on review bots that write their own comments.

```text
// bad
3,000-line AI-generated PR; the author approves the bot's review and merges.

// good
The same work split into five PRs; the author has read every line, and a human
reviewer approves each one.
```

## GEN-REV-9 Comment on the code, not the person, and give the reason.

"Why would you do this?" puts the author on the defensive; "this runs the query once per item; one query with `IN` would avoid that" gives them something to act on. A reason also lets the author push back if your assumption is wrong.

Convention: Google's eng-practices guide, *How to write code review comments*.

```text
// bad
"You clearly didn't think about concurrency."

// good
"Two requests can both pass this check before either writes. A unique index
on email would make the second one fail cleanly."
```
