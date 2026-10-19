# 6. Security

The PHP-specific defenses against the most common vulnerabilities. Use a framework's built-in version of each (query builder, template auto-escaping, CSRF middleware) when you have one; these rules say what it must do.

Each rule says whether it is official guidance (php.net, OWASP) or convention. Sources are in the [appendix](appendix.md#sources).

## PHP-SEC-1 Pass every value into SQL as a bound parameter. Never concatenate or interpolate it.

A value concatenated into SQL can change the query. Prepared statements send the query and the values separately, so a value can never be read as SQL. Identifiers (table and column names) can't be bound; pick them from an allow-list.

Official: php.net manual, *Prepared statements and stored procedures* (PDO); OWASP *SQL Injection Prevention Cheat Sheet*. The `mysql_*` functions were removed in PHP 7.

```php
// bad
$rows = $pdo->query("SELECT * FROM users WHERE email = '{$email}' ORDER BY {$sort}");

// good
$sortColumn = match ($sort) {
    'name' => 'name',
    'created' => 'created_at',
    default => 'id',
};
$statement = $pdo->prepare("SELECT * FROM users WHERE email = :email ORDER BY {$sortColumn}");
$statement->execute(['email' => $email]);
```

## PHP-SEC-2 Hash passwords with `password_hash()`, preferably Argon2id. Never `md5`, `sha1` or `hash()`.

Fast hashes let an attacker test billions of guesses per second against a leaked database. `password_hash()` uses a slow, salted algorithm. Verify with `password_verify()` and upgrade old hashes at login with `password_needs_rehash()`.

Official: OWASP *Password Storage Cheat Sheet* prefers Argon2id (minimum 19 MiB memory, 2 iterations, parallelism 1) and accepts bcrypt for legacy systems. `PASSWORD_ARGON2ID` needs PHP built with Argon2 support; `PASSWORD_DEFAULT` (bcrypt) is the fallback. PHP 8.4 raised bcrypt's default cost.

```php
// bad
$hash = md5($password);
$hash = hash('sha256', $salt . $password);

// good
$hash = password_hash($password, PASSWORD_ARGON2ID);

if (!password_verify($password, $user->passwordHash)) {
    throw new InvalidCredentials();
}
if (password_needs_rehash($user->passwordHash, PASSWORD_ARGON2ID)) {
    $user->passwordHash = password_hash($password, PASSWORD_ARGON2ID);
}
```

## PHP-SEC-3 Escape output for the context it goes into. Prefer a template engine that does it automatically.

Unescaped user input in HTML is cross-site scripting. HTML body and quoted attributes need `htmlspecialchars()` (its defaults since PHP 8.1 escape both quote types and replace invalid UTF-8). JavaScript needs `json_encode()` with the `JSON_HEX_*` flags; URL parts need `rawurlencode()`. Twig, Blade and Latte escape by default; don't turn that off with `|raw` or `{!! !!}` for user data.

Official: php.net manual for `htmlspecialchars()`; OWASP *Cross Site Scripting Prevention Cheat Sheet*. Not part of the verified research.

```php
// bad
<p>Hello, <?= $name ?></p>
<script>const user = "<?= $name ?>";</script>

// good
<p>Hello, <?= htmlspecialchars($name) ?></p>
<script>const user = <?= json_encode($name, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>
```

## PHP-SEC-4 Never `unserialize()` data a user could have touched. Use JSON.

`unserialize()` can create objects of any loaded class and run their magic methods, which is a known path to remote code execution through "gadget chains" in common libraries. `allowed_classes => false` reduces the risk but doesn't remove it. Cookies, form fields, cache entries an attacker can write, and uploaded files all count as untrusted.

Official: php.net manual, `unserialize()`: "Do not pass untrusted user input to unserialize()". Not part of the verified research.

```php
// bad
$cart = unserialize($_COOKIE['cart']);
// good
$cart = Cart::fromArray(json_decode($_COOKIE['cart'], true, 512, JSON_THROW_ON_ERROR));
```

## PHP-SEC-5 Generate tokens and secrets with `random_bytes()`, `random_int()` or `Random\Randomizer`. Never `rand()`, `mt_rand()` or `uniqid()`.

`mt_rand()` and `uniqid()` are predictable: an attacker who sees a few outputs can predict the next. Password-reset tokens, session IDs, API keys and CSRF tokens need a cryptographically secure generator.

Official: php.net manual (`random_bytes`, `random_int`, the `Random` extension since 8.2). Not part of the verified research.

```php
// bad
$token = md5(uniqid((string) mt_rand(), true));
// good
$token = bin2hex(random_bytes(32));
```

## PHP-SEC-6 Compare secrets with `hash_equals()`. Not `===`.

`===` on strings returns as soon as a byte differs, so response time leaks how much of a guessed token was right. `hash_equals()` takes the same time regardless.

Official: php.net manual, `hash_equals()`. Not part of the verified research.

```php
// bad
if ($request->token === $storedToken) {}
// good
if (hash_equals($storedToken, $request->token)) {}
```

## PHP-SEC-7 Harden session cookies: strict mode, `Secure`, `HttpOnly`, `SameSite`. Regenerate the ID at login.

Strict mode rejects session IDs the server never issued (session fixation). `HttpOnly` keeps the cookie away from JavaScript, `Secure` keeps it off plain HTTP, and `SameSite` limits cross-site requests. Regenerating the ID at login means an ID captured before login is useless after. Pass session IDs only in cookies, never in URLs; GET/POST sessions are deprecated since 8.4.

Official: OWASP *PHP Configuration Cheat Sheet*. An accepted RFC makes strict mode, `HttpOnly` and `SameSite=Lax` the defaults in the next PHP release; `Secure` stays opt-in. Set all of them yourself on 8.5 and earlier. OWASP's `sid_length` and `sid_bits_per_character` advice is outdated: both settings are deprecated since 8.4.

```ini
; bad: PHP defaults before the session-defaults RFC
session.use_strict_mode = 0
session.cookie_httponly = 0

; good
session.use_strict_mode = 1
session.use_only_cookies = 1
session.cookie_secure = 1
session.cookie_httponly = 1
session.cookie_samesite = Lax
```

## PHP-SEC-8 Protect every state-changing request against CSRF.

A browser sends cookies with requests from any site, so a malicious page can submit a form to your app as the logged-in user. Require a per-session token on every POST, PUT, PATCH and DELETE, and never change state on GET. `SameSite` cookies ([PHP-SEC-7](#php-sec-7-harden-session-cookies-strict-mode-secure-httponly-samesite-regenerate-the-id-at-login)) help but are not a full defense.

Official: OWASP *Cross-Site Request Forgery Prevention Cheat Sheet*. Not part of the verified research.

```php
// bad
if ($_SERVER['REQUEST_METHOD'] === 'POST') { deleteAccount($userId); }

// good
if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'] ?? '')) {
    throw new CsrfTokenMismatch();
}
deleteAccount($userId);
```
