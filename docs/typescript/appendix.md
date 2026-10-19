# Appendix

Tooling status, contested points, and caveats behind the TypeScript rules. This page has no rule IDs; it records where the ecosystem stands and why the guide chose what it did. The recommended configs live with their rules: [tsconfig](01-config.md#recommended-config) and [ESLint](06-modules-tooling.md#recommended-lint-config).

## TypeScript 7 + ESLint

typescript-eslint needs the TypeScript JS API, which TS 7 does not have until 7.1. Until then, install TS 7 under an alias and keep TS 6 as `typescript`:

```jsonc
// package.json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

`npx tsc` then runs TS 7, because only the TS 7 package provides a `tsc` binary (`@typescript/typescript6` ships `tsc6`). typescript-eslint imports `typescript` and gets the TS 6 API. Re-check this setup when TS 7.1 ships.

## Migrating from TS 6 to TS 7

Use `stableTypeOrdering` only to diff 6.0 vs 7.0 output during migration (formerly TS-1.16). The TS team warns it can slow 6.0 checking "up to 25%"; in 7.0 it is always on. Enable it in a throwaway run while comparing 6.0 and 7.0 output, then remove it; never commit it.

## Tooling status (October 2026)

Last reviewed 2026-10-19. Re-check when TS 7.1 or typescript-eslint 9 ships.

| Tool | Status | Recommendation |
|---|---|---|
| TypeScript 7.0.x (Go, `tsc`) | GA July 8, 2026; no JS API until 7.1 | Use for `tsc --noEmit` and builds now |
| TypeScript 6.0.x | Last JS-based release; API needed by tooling | Keep via the `@typescript/typescript6` alias |
| typescript-eslint 8.71.x | TS peer `>=4.8.4 <6.1.0`; TS 7 support tracked for >= 7.1 | Primary linter; run on the TS 6 API |
| Oxlint + tsgolint v7 | Stable; 59/61 type-aware rules; needs TS 7; `--type-check` can report compiler errors | Strong option for speed or dual-linting; typescript-eslint itself recommends "dual linting" with native linters |
| Biome 2.x | Own type inference (not tsc); type-aware rules still in nursery | Fine as formatter and syntactic linter; do not rely on it for promise safety |
| Node.js type stripping | Stable since v24.12.0 / v25.2.0; no type check | Use for scripts and dev; keep `tsc` in CI (TS-6.7) |

## Contested points and recommended stances

| Topic | Positions | Recommended stance |
|---|---|---|
| `interface` vs `type` | TS wiki and handbook favor interfaces for objects (performance, display); many devs prefer `type` everywhere | `interface` for object shapes, `type` for everything else; enforce via `consistent-type-definitions` (TS-2.9) |
| Enums | Google allows plain `enum` (bans `const enum`); Total TypeScript and `erasableSyntaxOnly` reject them | Ban; use `as const` objects or unions (TS-2.7) |
| Default exports | Google bans them; frameworks (Next.js, Storybook) require them | Ban, with a path-scoped exception for framework files (TS-6.2) |
| Explicit return types | Inference camp vs. annotate-everything; `isolatedDeclarations` requires them on exports | Required on exported functions (`explicit-module-boundary-types`); inferred for locals and callbacks (TS-2.4) |
| `I` prefix | Legacy C# style vs. Google and the TypeScript team's coding guidelines | Never (TS-7.2) |
| Parameter properties | Google recommends them; non-erasable | Ban (TS-8.2) |
| `#private` vs `private` | Google bans `#private` (down-level cost) | Prefer `#private` at ES2022+ targets for real privacy (TS-8.3) |
| `null` vs `undefined` | Mixed | `undefined` internally; normalize `null` at boundaries (TS-3.3) |
| `noUnusedLocals`/`Parameters`, `noImplicitReturns` | `@tsconfig/strictest` turns them on; Matt Pocock's TSConfig Cheat Sheet calls them "too noisy" | Enforce via lint (`no-unused-vars`), not the compiler (TS-1.15) |
| `strict-type-checked` vs `recommended-type-checked` | typescript-eslint: strict only if most devs are proficient; not semver-stable | Use strict for this guide's audience; pin the version (TS-6.8) |
| Result types vs exceptions | Google prefers exceptions; FP community prefers Result | Result for expected domain failures, exceptions for bugs (TS-11.4) |
| Barrel files | Convenient public API vs. performance and cycles | Only as a package's public entry point (TS-6.6) |

## Caveats

- **Source quality.** TS 6.0/7.0 facts, flags, and benchmarks come from Microsoft's official release posts. typescript-eslint config placement comes from typescript-eslint.io; the `switch-exhaustiveness-check` preset status was inferred from its rule page, not the table. Oxlint coverage numbers come from oxc.rs. Biome's own v2 "Biotype" post says `noFloatingPromises` detects floating promises "in about 75% of the cases that would be detected by using typescript-eslint".
- **Ecosystem flux.** typescript-eslint TS 7 support, the TS 7.1 API, and Vue/Svelte/Astro template checking on TS 7 are all pending; re-check the alias setup when TS 7.1 ships.
- **Opinionated choices.** Banning parameter properties and `enum` diverges from Google's guide; the justification is erasability and Node type stripping, which Google's internal toolchain does not depend on.
