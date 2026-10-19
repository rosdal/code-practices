# Contributing

## Adding or changing a rule

1. **Edit the doc first.** Rules live in `docs/<topic>/`. Copy [`docs/_template.md`](docs/_template.md) for a new section.
2. **Give it an ID** (`TS-2.3`, `GEN-NAME-1`). IDs are permanent: never renumber. If a rule is removed, mark it `~~TS-2.3~~ (removed)` instead of deleting the heading.
3. **Update the matching skill** in `skills/<topic>/SKILL.md`. Use the same ID, one line, imperative.
4. **Bump `version`** in `.claude-plugin/plugin.json` when skills change.

## Writing style

| | `docs/` (human) | `skills/` (agent) |
|---|---|---|
| Tone | Explain *why* | State *what*, briefly |
| Format | Rule -> reason -> bad/good example | `- [ID] Do X. Not Y.` |
| Examples | Always | Only when the rule is ambiguous without one |
| Length | As long as needed | Keep `SKILL.md` under ~500 lines; move detail to `references/` |

## Skill format

Every skill folder needs a `SKILL.md` with frontmatter:

```yaml
---
name: kebab-case-name        # must match the folder name
description: When to use this skill. This is what decides if an agent loads it, so be specific about triggers.
---
```
