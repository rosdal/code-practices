# 8. Testing

How to set up and write PHP tests with PHPUnit or Pest. For language-agnostic rules, see [GEN-TEST](../general/03-testing.md).

Each rule says whether it is official guidance (tool docs) or convention. Sources are in the [appendix](appendix.md#sources).

## PHP-TEST-1 Use a supported major of PHPUnit (12 or newer) or Pest (4 or newer).

PHPUnit gives bug fixes to one major at a time: PHPUnit 11's ended on 6 February 2026, and PHPUnit 12's runs until 5 February 2027. PHPUnit 12 and Pest 4 need PHP 8.3 or later. Pest is built on PHPUnit (Pest 4 on PHPUnit 12), so PHPUnit's changes apply to Pest suites too.

Official: PHPUnit 12 announcement; Pest 4 upgrade guide. The Pest site announces Pest 5. PHPUnit or Pest is a team choice; both are maintained.

```jsonc
// bad
{ "require-dev": { "phpunit/phpunit": "^9.5" } }
// good
{ "require-dev": { "phpunit/phpunit": "^12.0" } }
```

## PHP-TEST-2 Use attributes for test metadata. Not docblock annotations.

PHPUnit 12 removed support for `@test`, `@dataProvider`, `@covers` and the other annotations; tests that still use them silently stop being configured. Attributes are real syntax that tools can check. Rector converts them.

Official: PHPUnit 12 announcement.

```php
// bad
/**
 * @test
 * @dataProvider invalidEmails
 */
public function it_rejects_invalid_emails(string $email): void {}

// good
#[Test]
#[DataProvider('invalidEmails')]
public function it_rejects_invalid_emails(string $email): void {}

public static function invalidEmails(): iterable
{
    yield 'missing at' => ['example.com'];
    yield 'missing domain' => ['user@'];
}
```

## PHP-TEST-3 Make data providers `static`, and name each case.

PHPUnit 11 and 12 require static data providers. Named cases (`yield 'missing at' => [...]`) show up in failure output, so you know which input failed without counting array indices.

Official: PHPUnit 11/12 upgrade notes (static providers). Naming cases is convention.

```php
// bad
public function amounts(): array { return [[0], [-1], [100]]; }
// good
public static function amounts(): iterable
{
    yield 'zero' => [0];
    yield 'negative' => [-1];
}
```

## PHP-TEST-4 Use `createStub()` for test doubles that only return values, and `createMock()` only when you assert calls.

PHPUnit 12 no longer lets you configure expectations on stubs, and removed mocks of abstract classes and traits. Most doubles only need to return something; reserve mocks for checking an interaction that is the point of the test. Prefer fakes over both ([GEN-TEST-5](../general/03-testing.md#gen-test-5-prefer-real-implementations-and-fakes-mock-only-at-boundaries-you-dont-control)).

Official: PHPUnit 12 announcement. Preference for fakes is convention.

```php
// bad
$clock = $this->createMock(Clock::class);
$clock->expects($this->any())->method('now')->willReturn($now);

// good
$clock = $this->createStub(Clock::class);
$clock->method('now')->willReturn($now);
// better: a fake
$clock = new FrozenClock($now);
```

## PHP-TEST-5 Run mutation testing on changed code: Infection, or Pest's `--mutate`.

Coverage shows which lines ran; mutation testing shows whether tests notice when those lines change ([GEN-TEST-9](../general/03-testing.md#gen-test-9-consider-mutation-testing-on-the-changed-code-when-coverage-is-not-enough)). Both tools need a coverage driver (Xdebug 3 or PCOV). Run them on the diff in CI, not the whole codebase.

Official: Pest docs, *Mutation Testing* (`--mutate`, `--parallel`, `--min`). Infection is the standalone tool for PHPUnit suites. Running on the diff is convention.

```text
// bad
A nightly whole-repo mutation run whose report nobody reads.

// good
CI: infection --git-diff-lines --git-diff-base=origin/main --min-msi=80
or: pest --mutate --parallel --min=80
```
