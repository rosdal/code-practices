# AGENTS.md

Instructions for AI agents working **on this repository**. (The practices themselves are in `skills/`.)

## Layout

- `docs/` is the source of truth for every rule. Human-facing.
- `skills/` holds agent-facing versions of the same rules, in Agent Skills format.
- Rule IDs (e.g. `TS-2.3`) link the two. Never renumber or reuse an ID.

## When changing a rule

1. Change `docs/` first.
2. Mirror the change in the matching `skills/*/SKILL.md`, using the same ID.
3. Bump `version` in `.claude-plugin/plugin.json`.
4. Run `pnpm check`; it type-checks every example in `docs/`.

## Conventions

- Markdown only, no HTML.
- Code examples use `// bad` / `// good` comments.
- Skill `name` in frontmatter must equal its folder name.
