---
name: php
description: Use when writing, reviewing, or refactoring PHP (.php), and when setting up or changing composer.json, php.ini, PHPStan, Psalm, PHP-CS-Fixer, PHP_CodeSniffer, Pint, Rector, PHPUnit, or Pest config. Also use when upgrading a PHP version, handling passwords, SQL, sessions, or user output in PHP, when replacing arrays with objects, and when choosing between magic methods, getters, property hooks, and asymmetric visibility.
---

# PHP

Each line is one rule from the Rosdal PHP guide (PHP 8.4/8.5). The ID links to the full rule, with its reason, source and examples, in `docs/php/` of https://github.com/rosdal/code-practices. Cite IDs in review comments ("see PHP-SEC-1").

Framework-agnostic: in Laravel or Symfony, use the framework's built-in mechanism for each rule. In an existing codebase with its own conventions, consistency wins: apply these to new code and when refactoring. Check the project's PHP version before using 8.4/8.5 features.

## Judgment: apply while writing

### Security

- [PHP-SEC-1] Bind every SQL value as a parameter. Never concatenate or interpolate. Allow-list identifiers.
- [PHP-SEC-2] Hash passwords with `password_hash()` (Argon2id preferred), `password_verify()`, `password_needs_rehash()`. Never `md5`/`sha1`/`hash()`.
- [PHP-SEC-3] Escape output for its context (`htmlspecialchars`, `json_encode` with `JSON_HEX_*`, `rawurlencode`); keep template auto-escaping on.
- [PHP-SEC-4] Never `unserialize()` user-influenced data. Use JSON.
- [PHP-SEC-5] Generate tokens with `random_bytes()`/`random_int()`/`Random\Randomizer`. Never `rand`/`mt_rand`/`uniqid`.
- [PHP-SEC-6] Compare secrets with `hash_equals()`.
- [PHP-SEC-7] Session cookies: strict mode, `Secure`, `HttpOnly`, `SameSite`; cookies only; regenerate the ID at login.
- [PHP-SEC-8] Require a CSRF token on every state-changing request; never change state on GET.

### Types

- [PHP-TYPES-1] `declare(strict_types=1);` in every file.
- [PHP-TYPES-2] Native types on every parameter, return and property. Not docblock-only types. `mixed` only for truly unknown values.
- [PHP-TYPES-3] Write `?T $x = null`. Not implicit nullable `T $x = null` (deprecated in 8.4).
- [PHP-TYPES-4] Put generics and array shapes (`list<User>`, `array{id: int}`, `@template`) in PHPDoc for the analyser.
- [PHP-TYPES-5] Model structured data as (readonly) classes. Not associative arrays. Convert at the boundary.
- [PHP-TYPES-6] Use enums for fixed value sets. Not constants or strings.
- [PHP-TYPES-7] Declare every property; no dynamic properties.
- [PHP-TYPES-8] Type class constants.

### Classes and objects

- [PHP-OOP-1] Use constructor promotion and `readonly` (or `final readonly class`) for values. Readonly is shallow.
- [PHP-OOP-2] Use `public private(set)` for read-only-from-outside properties. Not private property plus trivial getter.
- [PHP-OOP-3] Use property hooks for validation and computed properties. Not `__get`/`__set`. Don't combine hooks with `readonly` on 8.4.
- [PHP-OOP-4] On 8.5, write with-ers as `clone($this, ['prop' => $value])`.
- [PHP-OOP-5] Mark overriding methods (and on 8.5, properties) with `#[\Override]`.
- [PHP-OOP-6] Make classes `final` unless designed for extension.
- [PHP-OOP-7] Mark deprecated APIs with `#[\Deprecated]`.

### Language features

- [PHP-LANG-1] Use `match`. Not `switch`.
- [PHP-LANG-2] Use `array_find`/`array_any`/`array_all` (8.4) and `array_first`/`array_last` (8.5) instead of search loops.
- [PHP-LANG-3] Use named arguments for booleans and skipped optional parameters.
- [PHP-LANG-4] Use first-class callables `foo(...)`. Not string or array callables.
- [PHP-LANG-5] Use `|>` for short linear chains; each step takes one argument; wrap others in parenthesized arrow functions.
- [PHP-LANG-6] On 8.5, parse URLs with `Uri\Rfc3986\Uri` or `Uri\WhatWg\Url`. Not `parse_url()`.
- [PHP-LANG-7] Mark functions whose result must be used with `#[\NoDiscard]`.
- [PHP-LANG-8] No backticks, `(integer)`/`(boolean)`/`(double)`/`(binary)` casts, or `null` array offsets.
- [PHP-LANG-9] Compare with `===`/`!==`.

### Errors

- [PHP-ERR-1] Throw exceptions for failures. Not `false` or error codes. `null` only for a normal "not found" with a nullable return type.
- [PHP-ERR-2] Never use `@` to suppress errors.
- [PHP-ERR-3] Catch `Throwable` only at the outermost boundary; catch specific exceptions elsewhere.
- [PHP-ERR-4] Install an error handler that throws `ErrorException` (frameworks usually do).
- [PHP-ERR-5] Pass the original exception as `previous:` when wrapping.
- [PHP-ERR-6] Define exception classes per failure callers handle differently.

### Testing

- [PHP-TEST-1] Use a supported PHPUnit (12+) or Pest (4+).
- [PHP-TEST-2] Use attributes (`#[Test]`, `#[DataProvider]`). Not annotations.
- [PHP-TEST-3] Make data providers `static` with named cases.
- [PHP-TEST-4] `createStub()` for return values; `createMock()` only to assert calls; prefer fakes.
- [PHP-TEST-5] Run mutation testing (Infection or `pest --mutate`) on changed code.

### Runtime

- [PHP-RUN-5] In worker mode (FrankenPHP, RoadRunner, Swoole), keep no request data in static or long-lived state.

## Setup: when creating or changing project config

- [PHP-SETUP-1] Target a php.net-supported branch: 8.5 for new projects, 8.4 minimum.
- [PHP-SETUP-2] Commit `composer.lock`; install from it; never edit it by hand.
- [PHP-SETUP-3] Set `config.platform.php` to the production version; run `composer check-platform-reqs` on deploy.
- [PHP-SETUP-4] Run `composer audit` in CI; list plugins explicitly in `config.allow-plugins`.
- [PHP-SETUP-5] Autoload with PSR-4; install with `--no-dev --optimize-autoloader` in production.
- [PHP-SETUP-6] Format with PER Coding Style 3.1 (not PSR-2/PSR-12), one formatter, enforced in CI.
- [PHP-SETUP-7] Run PHPStan level 9-10 (or Psalm strictest) in CI, with a baseline for legacy code.
- [PHP-SETUP-8] Apply PHP upgrades and deprecation fixes with Rector, as separate changes.
- [PHP-RUN-1] Production: `error_reporting = E_ALL`, `display_errors = Off`, `log_errors = On`, `expose_php = Off`.
- [PHP-RUN-2] `allow_url_include = Off`; disable unused shell and introspection functions.
- [PHP-RUN-3] OPcache on, `validate_timestamps = 0`, reset on deploy.
- [PHP-RUN-4] JIT only after measuring; on 8.4+ set `opcache.jit` explicitly.
