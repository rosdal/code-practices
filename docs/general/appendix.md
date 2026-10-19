# Appendix

Evidence, contested points, and caveats behind the general rules. This page has no rule IDs; it records what the rules are based on and how strong that basis is.

Last reviewed 2026-10-19.

## Evidence

Each rule is labeled in its section:

- **Evidence**: backed by a primary study or by DORA's research. Strength and limits are given here.
- **Contested**: credible sources disagree. The rule states the recommended stance.
- **Convention**: expert opinion or common practice without measured outcomes. Still worth following; just don't present it as proven.

| Rule | Source | Strength | Limits |
|---|---|---|---|
| GEN-NAME-1 | Hofmeister, Siegmund & Holt, *Shorter identifier names take longer to comprehend*, SANER 2017 | Controlled experiment, 72 professionals, ~19% faster | One language (C#), modest effect |
| GEN-NAME-2 | Schankin et al., *Descriptive compound identifier names improve source code comprehension*, ICPC 2018 | Controlled experiment, ~14% faster for semantic defects | No effect on syntax errors |
| GEN-NAME-3 | Beniamini et al., *Meaningful identifier names: the case of single-letter variables*, ICPC 2017 | Experiments found no significant effect for conventional single letters | Small samples |
| GEN-ERR-1, GEN-TEST-3 | Yuan et al., *Simple testing can prevent most critical failures*, OSDI 2014 | 198 production failures in 5 distributed systems; 92% of catastrophic ones from mishandled signaled errors; 58% catchable by simple error-path tests | Java distributed systems only |
| GEN-ERR-2, GEN-ERR-3 | de Pádua & Shang, ICPC 2017 (prevalence) and follow-up on post-release defects, 2018 | Anti-patterns common in all 16 projects studied; generic and dummy handlers correlated with defects | Java and C#; correlation |
| GEN-TEST-1 | Inozemtseva & Holmes, *Coverage is not strongly correlated with test suite effectiveness*, ICSE 2014; Ivanković et al., *Code coverage at Google*, FSE 2019 | Large study, ICSE Most Influential Paper 2024; industrial survey of 512 developers | Java; other studies find stronger correlations |
| GEN-TEST-2 | Micco, *Flaky tests at Google and how we mitigate them*, Google Testing Blog, 2016 | ~1.5% of runs flaky, ~16% of tests show flakiness | One company, one blog post, 2016 |
| GEN-TEST-9 | Petrović et al., *Practical mutation testing at scale*, IEEE TSE 2021 | 24,000+ developers, 1,000+ projects | One company's tooling |
| GEN-GIT-1 | DORA, [*Working in small batches*](https://dora.dev/capabilities/working-in-small-batches/), updated 2025 | Multi-year survey research | Correlational; thresholds are guidance |
| GEN-GIT-2 | DORA, [*Trunk-based development*](https://dora.dev/capabilities/trunk-based-development/) | Survey research | Data from 2016-2017 |
| GEN-GIT-8 | GitHub, [*About commit signature verification*](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification); OpenBao signed-commits RFC | Vendor documentation | Signing policy is a tradeoff |
| GEN-REV-1, GEN-REV-2, GEN-REV-3 | Sadowski et al., *Modern code review: a case study at Google*, ICSE-SEIP 2018 | Large-scale log data plus interviews | One company, 2014-2016 data |
| GEN-REV-3 | Bacchelli & Bird, *Expectations, outcomes, and challenges of modern code review*, ICSE 2013 | Microsoft interviews, surveys and comment analysis | 2013 |
| GEN-REV-8, GEN-GIT-1 | DORA, *AI Capabilities Model*, September 2025; Frömmgen et al., *Resolving code review comments with ML*, ICSE-SEIP 2024 | Recent | Survey moderation effects without effect sizes; one company's tool |

The DORA, Google review, Microsoft review, coverage, flakiness, mutation-testing and signing sources passed an adversarial check against the original text. The naming and error-handling papers, the one-business-day guidance (GEN-REV-2), the 2024 DORA stability finding, and *Productive coverage* (2024) were collected but not put through that check. Their figures are quoted from the papers but have not been verified independently.

### What these sources can't tell you

- **Most figures are old.** The Google review data is from 2014-2016, the coverage and error-handling studies from 2014, the flakiness data from 2016. Cite them with source and year, not as current benchmarks.
- **Much of it is from Google.** One company, a monorepo, unusual tooling. The direction of the findings has been replicated elsewhere; the exact numbers may not transfer.
- **DORA is correlational.** "Predicts" and "is associated with" are the right verbs. Don't write "causes".

## Contested points and recommended stances

| Topic | Positions | Recommended stance |
|---|---|---|
| Exceptions vs error values | Google style guides prefer exceptions; Rust, Go, functional codebases return errors | Values for failures callers must branch on; exceptions or panics otherwise (GEN-ERR-5) |
| Test pyramid vs trophy vs honeycomb | Each has advocates; none has outcome data | Choose by confidence per second of runtime; few E2E tests for critical paths (GEN-TEST-6) |
| Mocks vs fakes vs real objects | *Software Engineering at Google* prefers real, then fakes, then mocks; London-school TDD mocks collaborators | The Google order; mock at boundaries you don't control (GEN-TEST-5) |
| Conventional Commits | Widely adopted for changelog and semver tooling; critics call the prefix redundant | Only with tooling that reads it, enforced in CI (GEN-GIT-6) |
| Squash vs merge vs rebase | Tradeoffs between simple history and per-commit history | Squash by default; merge commits for teams that curate commits; one strategy per repo (GEN-GIT-7) |
| Required commit signing | Supply-chain security vs contributor friction | Decide what it protects; don't combine with rebase-merge on GitHub (GEN-GIT-8) |
| GitFlow | Fits products with several supported releases; delays integration otherwise | Trunk-based by default; release branches only for multiple supported versions (GEN-GIT-2) |

## What changed recently

- **AI and batch size.** DORA's 2024 report found AI adoption associated with lower delivery stability. Its 2025 report (renamed *State of AI-assisted Software Development*) found that small batches and frequent commits strengthen AI's benefits, and its small-batches guidance now warns against the large PRs AI tools tend to produce. This is why GEN-GIT-1 and GEN-REV-8 matter more now, not less.
- **Coverage in review.** Google's later work (*Productive coverage*, 2024) found that showing uncovered lines in review is not reliably actionable on its own; the point is to ask which uncovered lines matter.

## Open questions

Re-check these when new research appears:

- Do the findings on small changes and review speed still hold for AI-generated changes?
- How do review bots that write their own comments (rather than suggesting edits for human comments) affect defects that reach production, review time and reviewer attention?
- Does any test-level mix or mocking strategy have measured outcome data?
