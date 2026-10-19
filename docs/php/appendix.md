# Appendix

Version status, outdated advice, sources and caveats behind the PHP rules. This page has no rule IDs.

Last reviewed 2026-10-19. Re-check when php.net's *Supported Versions* table changes (a new branch, or 8.4 moving to security-only on 31 December 2026), and when Psalm 7 or a new PHPUnit major ships.

## Status (October 2026)

| Item | Status | Rules |
|---|---|---|
| PHP 8.5 | Newest branch (20 Nov 2025); active support to 31 Dec 2027 | PHP-SETUP-1 |
| PHP 8.4 | Active support to 31 Dec 2026, security to 31 Dec 2028 | PHP-SETUP-1 |
| PHP 8.6 / 9.0 | Not listed on php.net. 9.0 removals are queued as pending RFCs (undefined variables become errors, `${}` interpolation removed, `Serializable` phased out) | |
| PER Coding Style | 3.1; replaces PSR-12 | PHP-SETUP-6 |
| PHPStan | 2.x; level 10 is the strictest; hooks supported from 2.1 | PHP-SETUP-7 |
| Psalm | 6.x stable (PHP 8.4 support); 7 in beta/RC | PHP-SETUP-7 |
| PHPUnit | 12 supported until 5 Feb 2027; requires PHP 8.3 | PHP-TEST-1 |
| Pest | 4 (on PHPUnit 12, PHP 8.3+); site announces 5 | PHP-TEST-1 |
| FrankenPHP | Supported by the PHP Foundation since May 2025 | PHP-RUN-5 |

## Outdated advice

| Outdated | Instead |
|---|---|
| PSR-2, PSR-12 | PER Coding Style 3.1 (PHP-SETUP-6) |
| `mysql_*` functions, string-built SQL | PDO prepared statements (PHP-SEC-1) |
| `md5`/`sha1`/`hash()` for passwords | `password_hash()`, Argon2id (PHP-SEC-2) |
| Docblock-only types | Native types; PHPDoc for generics only (PHP-TYPES-2, -4) |
| `T $x = null` | `?T $x = null` (PHP-TYPES-3) |
| `__get`/`__set` for everything, boilerplate getters | Property hooks, asymmetric visibility (PHP-OOP-2, -3) |
| `@` error suppression | Check the result or throw (PHP-ERR-2) |
| PHPUnit annotations | Attributes (PHP-TEST-2) |
| `mt_rand()`/`uniqid()` for tokens | `random_bytes()` (PHP-SEC-5) |
| `__sleep`/`__wakeup` | `__serialize`/`__unserialize` (soft-deprecated in 8.5) |
| Backticks, `(integer)`-style casts | `shell_exec()`/`proc_open`, `(int)` (PHP-LANG-8) |
| Enabling JIT with only `opcache.jit_buffer_size` | Set `opcache.jit` explicitly (PHP-RUN-4) |
| `session.sid_length`, `sid_bits_per_character` (still in OWASP's cheat sheet) | Deprecated in 8.4; leave unset |

## Sources

How each source was checked:

- **Adversarially verified** (3 independent checks against the fetched text): php.net *Supported Versions*; the PHP 8.4 and 8.5 release pages; the RFC index; RFCs *Asymmetric visibility v2* and *Deprecate implicitly nullable types*; the php.net manual's *Type declarations*; PHPStan's *Generics by examples* and 2.0 release post; Psalm 6 announcement; PHP-FIG *PER Coding Style 3.1* and its 3.0 migration notes.
- **Quoted from the fetched page, not separately verified**: Composer (Laracon EU 2026 talk by Nils Adermann; Packagist's Composer 2.9 post); OWASP *PHP Configuration* and *Password Storage* cheat sheets; RFCs *Session security defaults* and *JIT config defaults*; the PHPUnit 12 announcement; the Pest 4 upgrade guide and mutation-testing docs; the PHP Foundation's FrankenPHP post; the php.net manual's *Properties* page; the PHP internals discussion of readonly property hooks.
- **From general knowledge, not the research run**: PSR-4 (PHP-SETUP-5), Rector (PHP-SETUP-8), enums, typed constants, `match`, named arguments and first-class callables (8.0-8.3 features, well established), `Uri\WhatWg\Url::getAsciiHost()` (check the method name against the manual), the error-handling rules (PHP-ERR), OWASP's SQL injection, XSS and CSRF cheat sheets, `unserialize()`, `random_bytes()` and `hash_equals()` manual pages, OPcache `validate_timestamps`, and Infection's CLI flags.

Refuted during research and deliberately left out:

- "PHP 8.6 GA is scheduled for 19 November 2026" (1-2). The date is close; check php.net before relying on 8.5 being newest.
- "Composer 2.9 blocks insecure packages by default via `audit.block-insecure`" (0-3), although Packagist's post and the Laracon talk describe blocking. PHP-SETUP-4 keeps an explicit `composer audit` step either way.

PHP examples are not checked by `pnpm check`, which only handles TypeScript, JavaScript and JSONC. The JSONC examples (`composer.json` fragments) are checked.

## Contested points and recommended stances

| Topic | Positions | Recommended stance |
|---|---|---|
| `final` by default | Common in modern libraries; some find it blocks extension and mocking | `final` by default; mock interfaces (PHP-OOP-6) |
| PHPUnit vs Pest | Both maintained; Pest runs on PHPUnit | Team choice; same rules apply (PHP-TEST-1) |
| PHP-CS-Fixer vs PHPCS vs Pint | All can apply PER-CS; running two conflicts | One per project; Pint in Laravel (PHP-SETUP-6) |
| PHPStan vs Psalm | Both mature | Either, at the strictest level the codebase can reach with a baseline (PHP-SETUP-7) |
| Readonly with property hooks | Not allowed in 8.4; an RFC to allow it was debated for 8.5 | Don't combine them until the current PHP version allows it (PHP-OOP-3) |
| Pipe operator | New in 8.5; one-argument limit | Short linear chains only (PHP-LANG-5) |

## Open questions

- When is PHP 8.6 (or 9.0) scheduled?
- What is Composer 2.9's actual default for blocking insecure packages?
- Did the readonly property hooks RFC pass for 8.5 (set hooks only, or neither)?
