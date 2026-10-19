# 4. Language features

Which expressions and built-ins to prefer in PHP 8.4 and 8.5, and which old idioms are deprecated.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## PHP-LANG-1 Use `match` for value mapping. Not `switch`.

`match` is an expression, compares strictly (`===`), has no fall-through, and throws `UnhandledMatchError` when no arm matches. `switch` compares loosely and falls through when someone forgets a `break`.

Official: PHP 8.0 `match`. Not re-verified in this research run. Since 8.5, `case` labels ending in `;` are deprecated.

```php
// bad
switch ($status) {
    case 'paid':
        $label = 'Paid';
        break;
    case 'pending':
        $label = 'Pending';
}

// good
$label = match ($status) {
    OrderStatus::Paid => 'Paid',
    OrderStatus::Pending => 'Pending',
    OrderStatus::Shipped => 'Shipped',
};
```

## PHP-LANG-2 Use the array search helpers: `array_find`, `array_any`, `array_all`, `array_first`, `array_last`.

They say what the loop is for and stop at the first match. `array_find`, `array_find_key`, `array_any` and `array_all` are in 8.4; `array_first` and `array_last` in 8.5 return `null` on an empty array, which composes with `??`.

Official: PHP 8.4 and 8.5 release pages.

```php
// bad
$admin = null;
foreach ($users as $user) {
    if ($user->isAdmin()) { $admin = $user; break; }
}
$latest = end($events) ?: null;

// good
$admin = array_find($users, fn (User $user): bool => $user->isAdmin());
$latest = array_last($events);
```

## PHP-LANG-3 Use named arguments for booleans and skipped optional parameters.

`createUser($email, true, false)` says nothing at the call site. Named arguments do, and let you skip optional parameters without repeating their defaults. Parameter names become part of your public API once callers use them, so rename them as carefully as methods.

Official: PHP 8.0 named arguments. Not re-verified in this research run. See [TS-4.1](../typescript/04-functions.md) for the same idea in TypeScript.

```php
// bad
$user = createUser($email, true, false);
// good
$user = createUser($email, sendWelcomeEmail: true, isAdmin: false);
```

## PHP-LANG-4 Use first-class callable syntax `foo(...)`. Not string or array callables.

`'strtolower'` and `[$this, 'handle']` are strings and arrays that tools can't follow; a typo fails at runtime. `strtolower(...)` and `$this->handle(...)` are checked like normal calls.

Official: PHP 8.1 first-class callable syntax. Not re-verified in this research run.

```php
// bad
$names = array_map('strtolower', $names);
$router->on('order.paid', [$this, 'handlePaid']);
// good
$names = array_map(strtolower(...), $names);
$router->on('order.paid', $this->handlePaid(...));
```

## PHP-LANG-5 Use the pipe operator for short, linear transformations. Wrap multi-argument calls in arrow functions.

`|>` (8.5) passes a value left to right through callables, which reads in the order things happen. Each callable takes exactly one argument, so a function that needs more must be wrapped in a parenthesized arrow function. When most steps need wrapping, ordinary statements read better.

Official: PHP 8.5 release page. Formatting per PER-CS 3.1: spaces around `|>`, and when split, the operator starts the continuation line.

```php
// bad
$slug = str_replace(' ', '-', strtolower(trim($title)));

// good
$slug = $title
    |> trim(...)
    |> strtolower(...)
    |> (fn (string $s): string => str_replace(' ', '-', $s));
```

## PHP-LANG-6 Parse URLs with the URI extension. Not `parse_url()`.

`parse_url()` follows no standard, so it and the browser or HTTP client can disagree about which host a URL points to, which is how URL-based security checks get bypassed. PHP 8.5's always-available URI extension parses by RFC 3986 (`Uri\Rfc3986\Uri`) or the WHATWG URL standard (`Uri\WhatWg\Url`).

Official: PHP 8.5 release page. `parse_url()` is not deprecated; the release page presents the URI API as its replacement on 8.5+.

```php
// bad
$host = parse_url($input, PHP_URL_HOST);
// good
$host = (new Uri\WhatWg\Url($input))->getAsciiHost();
```

## PHP-LANG-7 Mark functions whose result must be used with `#[\NoDiscard]`.

Calling `$date->modify('+1 day')` on an immutable object and ignoring the result is a classic bug: nothing changes. `#[\NoDiscard]` (8.5) makes PHP warn when the return value is dropped; a `(void)` cast marks an intentional discard.

Official: PHP 8.5 release page.

```php
// bad
public function withTax(Money $tax): Money {}
$total->withTax($tax); // result thrown away, silently

// good
#[\NoDiscard]
public function withTax(Money $tax): Money {}
$total = $total->withTax($tax);
```

## PHP-LANG-8 Don't use deprecated syntax: backticks, non-canonical casts, `null` array offsets.

All are deprecated in 8.5 and will be removed. Backticks run a shell command and are easy to miss in review; use `shell_exec()` (or better, `proc_open` with an argument array). Use `(bool)`, `(int)`, `(float)`, `(string)` instead of `(boolean)`, `(integer)`, `(double)`, `(binary)`.

Official: PHP 8.5 release page.

```php
// bad
$files = `ls $dir`;
$count = (integer) $value;
// good
$files = scandir($dir);
$count = (int) $value;
```

## PHP-LANG-9 Compare with `===` and `!==`. Not `==`.

Loose comparison converts types by rules few people remember. PHP 8 fixed the worst case (`0 == 'abc'` is now `false`), but `'1e3' == '1000'` is still `true`.

Convention.

```php
// bad
if ($input == $storedCode) {}
// good
if ($input === $storedCode) {}
if (hash_equals($storedToken, $input)) {} // for secrets, see PHP-SEC-6
```
