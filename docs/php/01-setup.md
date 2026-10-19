# 1. Setup

Which PHP version to target and how to set up Composer, formatting, static analysis and upgrades. Framework-agnostic: Laravel and Symfony projects follow the same rules with their own tool wrappers.

Each rule says whether it is official guidance (php.net, RFCs, PHP-FIG, tool docs) or convention. Sources are in the [appendix](appendix.md#sources).

## PHP-SETUP-1 Target a PHP branch that php.net still supports. New projects: 8.5. Minimum: 8.4.

Unsupported branches get no security fixes. Each branch gets two years of active support and two more of security fixes only, with each phase ending on 31 December. Plan the upgrade before the security phase ends, not after.

Official: php.net *Supported Versions* (checked 2026-10-19):

| Branch | Released | Active support until | Security fixes until |
|---|---|---|---|
| 8.5 | 20 Nov 2025 | 31 Dec 2027 | 31 Dec 2029 |
| 8.4 | 21 Nov 2024 | 31 Dec 2026 | 31 Dec 2028 |
| 8.3 | 23 Nov 2023 | ended 31 Dec 2025 | 31 Dec 2027 |
| 8.2 | | ended | 31 Dec 2026 |

No 8.6 or 9.0 release is listed yet. Re-check this table when it changes; that is the trigger for updating this guide.

```jsonc
// bad
{ "require": { "php": ">=7.4" } }
// good
{ "require": { "php": "^8.4" } }
```

## PHP-SETUP-2 Commit `composer.lock`, and install from it everywhere.

Without a lock file, `composer install` resolves versions afresh, so CI, staging and production can run different code from what you tested. Never edit the lock file by hand; regenerate it with `composer update`.

Official: Composer documentation; Nils Adermann (Composer co-author), Laracon EU 2026: "The lock file exists to be committed!"

```text
// bad
.gitignore: composer.lock

// good
composer.lock committed; CI and deploys run `composer install`, never `composer update`.
```

## PHP-SETUP-3 Pin the production PHP version in `config.platform`, and check platform requirements on deploy.

A developer on a newer PHP than production can lock a package version that production cannot run. `config.platform.php` makes Composer resolve as if it were on the production version. `composer check-platform-reqs` on deploy catches a missing extension before traffic does.

Official: Composer documentation and Laracon EU 2026 talk. To test on a newer PHP, use `--ignore-platform-req=php+` (ignores only the upper bound), not the blanket `--ignore-platform-reqs`.

```jsonc
// bad: no platform config; the lock depends on whoever ran `composer update`
{ "require": { "php": "^8.4" } }
// good
{ "require": { "php": "^8.4" }, "config": { "platform": { "php": "8.4.0" } } }
```

## PHP-SETUP-4 Run `composer audit` in CI, and allow plugins explicitly.

`composer audit` checks the locked packages against known security advisories and exits non-zero, so it can fail the build. Since Composer 2.2 every plugin must be listed in `config.allow-plugins`, because a plugin runs code during install; review a new entry like any other code change.

Official: Composer documentation (audit since 2.4, allow-plugins since 2.2). Composer 2.9 also blocks known-vulnerable versions during resolution; the research found conflicting reports about its default, so keep the explicit CI step.

```jsonc
// bad
{ "config": { "allow-plugins": true } }
// good
{ "config": { "allow-plugins": { "phpstan/extension-installer": true } } }
```

## PHP-SETUP-5 Autoload with PSR-4. Never `require` class files by hand.

One namespace prefix maps to one directory, so every class has exactly one predictable file. In production, install with `--no-dev --optimize-autoloader` (or `--classmap-authoritative`).

Official: PHP-FIG PSR-4.

```jsonc
// bad
{ "autoload": { "files": ["src/User.php", "src/Order.php"] } }
// good
{ "autoload": { "psr-4": { "App\\": "src/" } }, "autoload-dev": { "psr-4": { "App\\Tests\\": "tests/" } } }
```

## PHP-SETUP-6 Format with PER Coding Style 3.1, enforced by one tool in CI.

PER Coding Style is PHP-FIG's living coding standard. Version 3.1 "extends, expands and replaces PSR-12" and covers syntax PSR-12 never knew: property hooks, asymmetric visibility and the pipe operator. Pick one formatter: PHP-CS-Fixer (PER-CS rule set), PHP_CodeSniffer (PHPCSStandards), or Laravel Pint in Laravel projects. Running two leads to conflicting fixes.

Official: PHP-FIG, *PER Coding Style 3.1*. PSR-2 and PSR-12 are outdated. Tool choice is convention.

```text
// bad
phpcs.xml with <rule ref="PSR2"/>, plus Pint, plus the IDE's own formatter.

// good
.php-cs-fixer.dist.php with the PER-CS rule set; CI runs it with --dry-run --diff.
```

## PHP-SETUP-7 Run a static analyser in CI at a high level: PHPStan level 9 or 10, or Psalm's strictest.

PHP checks types only at runtime, and only where they are declared. A static analyser checks every path, PHPDoc generics included ([PHP-TYPES-4](02-types.md#php-types-4-put-generics-and-array-shapes-in-phpdoc-and-let-the-analyser-check-them)). For existing code, generate a baseline and raise the level over time instead of starting low forever.

Official: PHPStan 2.0 (November 2024) added level 10, which also reports implicit `mixed` (for example from untyped vendor code); 2.1 added property-hook support. Psalm 6 (May 2025) supports PHP 8.4. The target level is convention.

```neon
# bad
parameters:
    level: 3
# good
parameters:
    level: 10
    paths: [src, tests]
includes:
    - phpstan-baseline.neon
```

## PHP-SETUP-8 Upgrade PHP versions and fix deprecations with Rector.

Rector rewrites code mechanically: implicit nullable types, annotations to attributes, new syntax for a new PHP version, PHPUnit upgrades. Run it as its own change, review the diff, then run the tests.

Convention: Rector is the standard PHP upgrade tool; not part of the verified research.

```text
// bad
Fixing 400 implicit-nullable deprecations by hand across a feature PR.

// good
PR: "Apply Rector PHP 8.4 set" — mechanical diff only, tests green.
```
