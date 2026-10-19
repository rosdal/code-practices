# 3. Classes and objects

How to write classes with PHP 8.4 and 8.5 features instead of the boilerplate and magic methods older code relies on.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## PHP-OOP-1 Use constructor promotion and `readonly` for values that don't change after construction.

Promotion declares, types and assigns a property in one place. `readonly` stops it from being reassigned later. `final readonly class` makes every property readonly. Note that readonly is shallow: an object stored in a readonly property can still be changed internally.

Official: php.net manual, *Properties* (readonly since 8.1, readonly classes since 8.2). In 8.4, readonly properties are implicitly `protected(set)`.

```php
// bad
final class Money
{
    private int $amount;
    private string $currency;

    public function __construct(int $amount, string $currency)
    {
        $this->amount = $amount;
        $this->currency = $currency;
    }

    public function getAmount(): int { return $this->amount; }
}

// good
final readonly class Money
{
    public function __construct(
        public int $amount,
        public string $currency,
    ) {}
}
```

## PHP-OOP-2 Use asymmetric visibility for properties others may read but not write. Not a private property plus a getter.

`public private(set)` makes a property readable everywhere and writable only inside the class, which replaces most trivial getters. Keep a method when it does more than return the field: a defensive copy of a mutable object, or an interface contract.

Official: PHP 8.4 release page and RFC *Asymmetric visibility v2*. The release page says this "reduces" boilerplate getters, not that it removes the need for them.

```php
// bad
final class Order
{
    private OrderStatus $status;
    public function getStatus(): OrderStatus { return $this->status; }
}

// good
final class Order
{
    public private(set) OrderStatus $status = OrderStatus::Pending;

    public function markPaid(): void { $this->status = OrderStatus::Paid; }
}
```

## PHP-OOP-3 Use property hooks for validation and computed properties. Not `__get`/`__set` magic.

Magic accessors hide which properties exist, so IDEs and analysers can't see them and every typo is a runtime problem. A property hook is declared on the property itself, typed, and visible to tools.

Official: PHP 8.4 release page and RFC *Property access hooks*. PHPStan supports hooks from 2.1. In 8.4, hooks can't be combined with `readonly` (a readonly class can't have hooked properties); check the current RFC status before relying on a change.

```php
// bad
final class User
{
    private array $data = [];
    public function __get(string $name): mixed { return $this->data[$name] ?? null; }
    public function __set(string $name, mixed $value): void { $this->data[$name] = $value; }
}

// good
final class User
{
    public string $email {
        set(string $value) {
            if (filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
                throw new InvalidArgumentException("Invalid email: {$value}");
            }
            $this->email = strtolower($value);
        }
    }

    public string $displayName {
        get => "{$this->firstName} {$this->lastName}";
    }

    public function __construct(
        public string $firstName,
        public string $lastName,
        string $email,
    ) {
        $this->email = $email;
    }
}
```

## PHP-OOP-4 Write "with-ers" on readonly classes with `clone()` and property updates.

Immutable objects change by returning a modified copy. Before 8.5 that meant calling the constructor with every field again; `clone($this, [...])` copies the object and changes only the named properties.

Official: PHP 8.5 release page (RFC *Clone with v2*). Readonly properties can only be updated this way from inside the class's own scope.

```php
// bad (8.5+)
public function withAmount(int $amount): self
{
    return new self($amount, $this->currency, $this->precision, $this->rounding);
}

// good
public function withAmount(int $amount): self
{
    return clone($this, ['amount' => $amount]);
}
```

## PHP-OOP-5 Mark overriding methods with `#[\Override]`.

If the parent method is renamed or removed, the child method silently becomes a new, uncalled method. With `#[\Override]`, PHP refuses to compile the class instead. Since 8.5 it also works on properties.

Official: PHP 8.3 (`#[\Override]`), PHP 8.5 release page (properties).

```php
// bad
final class CachedRepository extends Repository
{
    public function findAll(): array {} // parent renamed it to all(); nobody notices
}

// good
final class CachedRepository extends Repository
{
    #[\Override]
    public function findAll(): array {} // fatal error once the parent method is gone
}
```

## PHP-OOP-6 Make classes `final` unless they are designed for extension.

Inheritance couples a subclass to every internal detail of its parent. `final` keeps that decision explicit: when someone needs to extend a class, they remove `final` deliberately and the parent is reviewed for it. Prefer composition and interfaces.

Contested: common in modern PHP codebases and libraries; some argue it gets in the way of mocking and extension. Recommended stance: `final` by default, and mock interfaces, not concrete classes.

```php
// bad
class InvoiceMailer {}
// good
final class InvoiceMailer implements Mailer {}
```

## PHP-OOP-7 Mark deprecated APIs with `#[\Deprecated]`. Not only a docblock.

The attribute makes PHP emit a deprecation notice at the call site, so callers see it in logs and tests, not only in an IDE.

Official: PHP 8.4 release page.

```php
// bad
/** @deprecated use sendInvoice() */
public function mailInvoice(): void {}

// good
#[\Deprecated(message: 'use sendInvoice()', since: '2.3')]
public function mailInvoice(): void {}
```
