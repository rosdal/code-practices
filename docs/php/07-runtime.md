# 7. Configuration and runtime

Production `php.ini` settings, OPcache and JIT, and long-running application servers.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## PHP-RUN-1 In production, log every error and display none.

Errors shown to users leak file paths, queries and sometimes credentials. Errors not logged are invisible to you. `expose_php = Off` stops advertising the PHP version in response headers.

Official: OWASP *PHP Configuration Cheat Sheet*.

```ini
; bad
display_errors = On
error_reporting = E_ALL & ~E_NOTICE & ~E_WARNING

; good
error_reporting = E_ALL
display_errors = Off
display_startup_errors = Off
log_errors = On
expose_php = Off
```

## PHP-RUN-2 Turn off remote file inclusion, and disable functions you don't use.

`allow_url_include` lets `include` load code from a URL, which turns a path-injection bug into remote code execution. `disable_functions` removes shell and introspection functions from an app that never calls them, so an attacker who gets code execution has fewer tools.

Official: OWASP *PHP Configuration Cheat Sheet*. Turn off `allow_url_fopen` too if the app makes no HTTP requests through file functions.

```ini
; bad
allow_url_include = On

; good
allow_url_include = Off
allow_url_fopen = Off
disable_functions = exec,passthru,shell_exec,system,proc_open,popen,phpinfo,show_source
```

## PHP-RUN-3 Run OPcache in production, and stop it checking file timestamps.

OPcache keeps compiled scripts in memory, so PHP doesn't recompile every file on every request. With `validate_timestamps = 0` it also stops checking whether files changed; deploys must then reset the cache (restart PHP-FPM or call `opcache_reset()`).

Official: OPcache is a non-optional part of PHP since 8.5 (RFC). `validate_timestamps = 0` is convention for immutable deploys.

```ini
; bad
opcache.enable = 0

; good
opcache.enable = 1
opcache.validate_timestamps = 0
opcache.memory_consumption = 256
```

## PHP-RUN-4 Treat JIT as opt-in. Enable it only after measuring a gain.

JIT speeds up CPU-heavy code (image processing, math) but does little for typical web requests that wait on a database. It is off by default. Since 8.4 it is turned off by `opcache.jit = disable`, so setting only `opcache.jit_buffer_size` (the old way to enable it) no longer turns it on.

Official: RFC *Change how JIT is disabled by default* (PHP 8.4, accepted 17-0); PHP 8.4 also ships a new JIT built on the IR framework.

```ini
; bad: copied from a pre-8.4 blog post; does nothing on 8.4+
opcache.jit_buffer_size = 100M

; good: only after a benchmark showed a gain
opcache.jit = tracing
opcache.jit_buffer_size = 64M
```

## PHP-RUN-5 In worker mode (FrankenPHP, RoadRunner, Swoole), keep no request data in static or long-lived state.

Classic PHP throws everything away after each request. A worker keeps the application in memory across requests, which is where its speed comes from, but anything stored in a static property, singleton or service field leaks into the next request, possibly another user's. Reset per-request state explicitly, and watch memory over time.

Official: the PHP Foundation has supported FrankenPHP since May 2025; PHP-FPM remains fully supported. Laravel, Symfony and Yii have official worker-mode integrations. Performance figures (80% faster responses in one Sylius analysis) are vendor-reported. The state rule is convention.

```php
// bad: the second request sees the first user's data
final class CurrentUser
{
    private static ?User $user = null;
    public static function set(User $user): void { self::$user = $user; }
}

// good: request-scoped, created per request by the container
final class CurrentUser
{
    public function __construct(public readonly ?User $user) {}
}
```
