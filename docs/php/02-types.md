# 2. Types

How to use PHP's type system so that errors show up at the call site or in static analysis, not in production.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## PHP-TYPES-1 Start every file with `declare(strict_types=1);`.

Without it, PHP silently coerces scalars: `"5 apples"` passes an `int` parameter as `5` (with a warning) and `true` becomes `1`. Strict mode throws a `TypeError` instead; the only conversion it allows is `int` to `float`. The declaration applies to calls *made from* the file, not to functions declared in it, so it only protects you if every file has it. Enforce it with your formatter.

Official: php.net manual, *Type declarations*.

```php
// bad
<?php

function setQuantity(int $quantity): void {}
setQuantity('5'); // accepted as 5

// good
<?php

declare(strict_types=1);

function setQuantity(int $quantity): void {}
setQuantity('5'); // TypeError
```

## PHP-TYPES-2 Declare native types on every parameter, return value and property. Not PHPDoc-only types.

Native types are enforced at runtime and read by every tool. A `@param int` docblock is a comment: nothing stops a string from arriving. Use `void`, `never`, `static`, unions and intersections where they fit. Reserve `mixed` for values that really can be anything, such as a decoded JSON payload before parsing.

Official: php.net manual, *Type declarations*. Docblock-only types are outdated.

```php
// bad
/**
 * @param int $id
 * @return User|null
 */
function findUser($id) {}

// good
function findUser(int $id): ?User {}
function fail(string $message): never { throw new DomainException($message); }
```

## PHP-TYPES-3 Write nullable parameters as `?T` or `T|null`. Not `T $x = null`.

`T $x = null` makes the type nullable implicitly, which hides it from the signature and breaks type compatibility when a child class changes the default. It is deprecated since PHP 8.4 and slated for removal. PHP-CS-Fixer and Rector fix it automatically.

Official: RFC *Deprecate implicitly nullable parameter types* (PHP 8.4).

```php
// bad
function greet(string $name = null): string {}
// good
function greet(?string $name = null): string {}
```

## PHP-TYPES-4 Put generics and array shapes in PHPDoc, and let the analyser check them.

PHP has no native generics, so `array` and `Collection` say nothing about what's inside. `@template`, `list<User>`, `array<string, int>` and `array{id: int, name: string}` in PHPDoc fill that gap for PHPStan and Psalm. Write native types first; use PHPDoc only for what native types can't express.

Official: PHPStan, *Generics by examples*; Psalm docs. The PHP Foundation's 2024 *State of Generics and Collections* post explains why native generics are not coming soon.

```php
// bad
/** @return array */
function activeUsers(): array {}

// good
/** @return list<User> */
function activeUsers(): array {}

/**
 * @template T
 * @param class-string<T> $class
 * @return T
 */
function make(string $class): object {}
```

## PHP-TYPES-5 Model structured data as classes. Not associative arrays.

`$order['totl']` is a silent `null` plus a warning; `$order->totl` is an error the analyser catches. A readonly class names the shape once, types every field, and gives IDEs autocompletion. Keep arrays for lists and maps of uniform values. Convert arrays from JSON, forms and database rows into objects at the boundary.

Convention, widely held in modern PHP; the language features that make it cheap (constructor promotion, readonly classes) are official.

```php
// bad
function shippingCost(array $order): int { return $order['weight'] * $order['rate']; }

// good
final readonly class Shipment
{
    public function __construct(
        public int $weightGrams,
        public Money $ratePerKg,
    ) {}
}
function shippingCost(Shipment $shipment): Money {}
```

## PHP-TYPES-6 Use enums for fixed sets of values. Not class constants or strings.

A parameter typed `OrderStatus` accepts only valid statuses; a `string $status` accepts typos. Backed enums convert to and from stored values with `from()` (throws) and `tryFrom()` (returns `null`). Enums can have methods and implement interfaces.

Official: PHP 8.1 enums. Not re-verified in this research run.

```php
// bad
const STATUS_PAID = 'paid';
function ship(string $status): void {}

// good
enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Shipped = 'shipped';
}
function ship(OrderStatus $status): void {}
$status = OrderStatus::from($row['status']);
```

## PHP-TYPES-7 Declare every property. Don't create dynamic properties.

Assigning an undeclared property has been deprecated since PHP 8.2; it is usually a typo that creates a second, misspelled field. `#[\AllowDynamicProperties]` exists for legacy code; the manual calls it a last resort.

Official: php.net manual, *Properties*.

```php
// bad
$user = new User();
$user->emial = 'a@example.com'; // deprecated, and a typo nobody notices

// good
final class User
{
    public string $email;
}
```

## PHP-TYPES-8 Type class constants.

Since PHP 8.3 a constant can declare its type, so a subclass or interface implementation can't redefine it with a different one.

Official: PHP 8.3 typed class constants. Not re-verified in this research run.

```php
// bad
interface HasVersion { const VERSION = '1.0'; }
// good
interface HasVersion { public const string VERSION = '1.0'; }
```
