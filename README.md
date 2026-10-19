# code-practices

How we write code: the rules, the reasons behind them, and examples of each.

This repo is a style guide first. It's written for people: to read when you join, to point at in a code review, and to settle "how do we do this?" without a long discussion. The same rules are also packaged as [agent skills](#for-ai-agents), so AI coding tools follow them too.

---

## Start here

| If you want to… | Read |
|---|---|
| Write better TypeScript | [TypeScript guide](docs/typescript/01-config.md) |
| Know what reviewers look for | [Code review](docs/general/code-review.md) |
| Name things well | [Naming](docs/general/naming.md) |
| Handle errors consistently | [Error handling](docs/general/error-handling.md) |
| Write useful tests | [Testing](docs/general/testing.md) |
| Write good commits and PRs | [Git & commits](docs/general/git.md) |

Or browse the full index in [`docs/`](docs/README.md).

## How to read a rule

Every rule follows the same shape: an ID, the rule itself, a short reason, and an example.

> ### TS-3.1 Use `?.` and `??` instead of `&&` chains and `||`
>
> `||` treats `0`, `''` and `false` as missing.
>
> ```ts
> // bad
> const port = config.port || 3000;  // port 0 -> 3000
>
> // good
> const port = config.port ?? 3000;
> ```

**Rule IDs are permanent.** `TS-3.1` will always mean this rule, so you can reference it in a review comment ("see TS-3.1") and the link won't rot. IDs are never renumbered or reused.

| Prefix | Area |
|---|---|
| `TS-1` … `TS-6` | TypeScript: config, types, null handling, functions, generics, tooling |
| `GEN-NAME` | Naming |
| `GEN-ERR` | Error handling |
| `GEN-TEST` | Testing |
| `GEN-GIT` | Git & commits |
| `GEN-REV` | Code review |

## What these rules are (and aren't)

- **Defaults, not laws.** If a rule makes a specific piece of code worse, break it and leave a comment saying why. A rule you keep needing to break is a rule that should change, so open a PR.
- **Explained, not just stated.** Every rule says why it exists. If the reason doesn't hold in your situation, the rule probably doesn't either.
- **The existing codebase wins.** In an older project with its own conventions, consistency beats these rules. Use them for new code and when refactoring anyway.
- **Tooling enforces what it can.** Anything a linter or compiler can check should be checked there, not in review. These docs cover the judgment calls tools can't make.

## Contributing

Disagree with a rule, or have one to add? Open a PR. The short version:

1. Edit the rule in `docs/`. That's the source of truth.
2. Update the matching line in `skills/` using the same ID.
3. Explain the *why* in the PR. Rules without a reason don't get merged.

Full details in [CONTRIBUTING.md](CONTRIBUTING.md).

---

## For AI agents

The rules in `docs/` are mirrored in [`skills/`](skills/) as short, imperative checklists in the [Agent Skills](https://agentskills.io) format. Agents load them automatically when they edit matching files.

| Skill | Used when the agent.. |
|---|---|
| `typescript` | writes or reviews `.ts`/`.tsx`, or sets up tsconfig |
| `code-review` | reviews a diff or PR, or finishes a change |

**Install in Claude Code:**

```bash
/plugin marketplace add <owner>/code-practices
/plugin install code-practices@code-practices
```

**Without the plugin:** copy a folder from `skills/` into your project's `.claude/skills/`. Other tools that support Agent Skills or `AGENTS.md` (Codex, Cursor and others) can read `skills/<name>/SKILL.md` directly.

## Repository layout

```
code-practices/
|-- docs/              Human guide: the source of truth
|   |-- general/       Language-agnostic practices
|   |-- typescript/    TypeScript, one file per section
|-- skills/            Agent versions of the same rules
|-- .claude-plugin/    Claude Code plugin manifest
|-- AGENTS.md          Instructions for agents editing this repo
|-- CONTRIBUTING.md    How to add or change a rule
```