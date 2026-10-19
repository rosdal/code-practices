# 5. Error handling

How to raise, wrap and contain errors in PHP. For language-agnostic rules, see [GEN-ERR](../general/02-errors.md).

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources). None of these rules came through the verified research; they rest on the php.net manual and common practice.

## PHP-ERR-1 Throw exceptions for failures. Not `false`, `null` or error codes the caller can ignore.

A `false` return can be mistaken for a value, and nothing forces the caller to check it. An exception stops the operation unless someone handles it. Return `null` only when "not found" is a normal outcome and the return type says so (`?User`).

Convention, consistent with the php.net manual's *Exceptions* chapter.

```php
// bad
function loadConfig(string $path): array|false {}
// good
/** @throws ConfigException */
function loadConfig(string $path): Config {}
function findUser(int $id): ?User {} // not found is normal here
```

## PHP-ERR-2 Never suppress errors with `@`.

`@` hides the warning but not the failure: the code carries on with `false` or `null` and breaks somewhere else. Check the condition first, or let the error handler turn it into an exception ([PHP-ERR-4](#php-err-4-turn-warnings-and-notices-into-exceptions-with-an-error-handler)).

Convention. `@` is outdated advice.

```php
// bad
$contents = @file_get_contents($path);

// good
$contents = file_get_contents($path);
if ($contents === false) {
    throw new RuntimeException("Cannot read {$path}");
}
```

## PHP-ERR-3 Catch `Throwable` only at the outermost boundary. Catch specific exceptions everywhere else.

Since PHP 7, engine errors (`TypeError`, `ValueError`, `DivisionByZeroError`) are `Error`s, and `Throwable` covers both `Error` and `Exception`. Catching `Throwable` in business code handles bugs as if they were expected failures. The front controller, a queue worker loop and a CLI entry point are where a catch-all belongs: log it, return a 500 or fail the job, and keep the process healthy.

Official: php.net manual, *Errors in PHP 7* (the `Throwable` hierarchy). Placement is convention; see [GEN-ERR-2](../general/02-errors.md#gen-err-2-catch-only-the-errors-you-can-handle-not-everything).

```php
// bad
try {
    $invoice = $this->billing->charge($order);
} catch (\Throwable) {
    $invoice = null;
}

// good
try {
    $invoice = $this->billing->charge($order);
} catch (CardDeclined $e) {
    return PaymentResult::declined($e->reason);
}
```

## PHP-ERR-4 Turn warnings and notices into exceptions with an error handler.

PHP still reports many failures (unreadable file, undefined array key) as warnings that execution continues past. An error handler that throws `ErrorException` makes them stop the operation like any other failure. Most frameworks install one; plain PHP projects must do it themselves.

Convention.

```php
// bad: warnings are logged and execution carries on with bad data
// good
set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
    if ((error_reporting() & $severity) === 0) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});
```

## PHP-ERR-5 When wrapping an exception, pass the original as `previous`.

The original exception's message and stack trace say what actually failed. Without `previous`, logs show only the wrapper. See [GEN-ERR-3](../general/02-errors.md#gen-err-3-when-you-wrap-an-error-keep-the-original-as-its-cause).

Official: the `$previous` parameter of `Exception::__construct` (php.net manual).

```php
// bad
} catch (PDOException $e) {
    throw new OrderNotSavedException('Saving order failed');
}

// good
} catch (PDOException $e) {
    throw new OrderNotSavedException("Saving order {$order->id} failed", previous: $e);
}
```

## PHP-ERR-6 Define exception classes per failure your callers handle differently.

Callers branch on the exception type. One generic `RuntimeException` for everything forces them to parse messages. A small hierarchy per module (`PaymentException` with `CardDeclined`, `GatewayTimeout`) lets callers catch exactly what they can handle.

Convention.

```php
// bad
throw new Exception('card_declined');

// good
abstract class PaymentException extends RuntimeException {}
final class CardDeclined extends PaymentException
{
    public function __construct(public readonly string $reason, ?Throwable $previous = null)
    {
        parent::__construct("Card declined: {$reason}", previous: $previous);
    }
}
```
