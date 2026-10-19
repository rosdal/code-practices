# 2. Async and errors

Promise APIs, process-level error handling, event emitters and streams, timeouts, and shutting down cleanly. For promise rules that apply to all TypeScript (floating promises, `Promise.all`, `return await`), see [TS-10](../typescript/10-async.md).

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## NODE-ERR-1 Use the promise versions of core APIs. Not callbacks.

Callback APIs need their own error check in every callback, and an error thrown inside one escapes `try`/`catch`. Each callback module has a promise version: `node:fs/promises`, `node:stream/promises`, `node:timers/promises`, `node:dns/promises`, plus `events.once` and `events.on`. Use `util.promisify` only for third-party callback APIs.

Official: Node.js API docs. Convention to use them exclusively.

```ts
// bad
import { readFile } from 'node:fs';
readFile(path, 'utf8', (err, text) => {
  if (err) throw err; // escapes every surrounding try/catch
  handle(text);
});

// good
import { readFile } from 'node:fs/promises';
const text = await readFile(path, 'utf8');
```

## NODE-ERR-2 Let unhandled rejections crash the process. Don't install a handler that swallows them.

Since v15 the default `--unhandled-rejections` mode is `throw`: a rejection nobody handles becomes an uncaught exception, and the process exits. That is the right outcome, because the program is in a state its author did not plan for. An `unhandledRejection` listener that only logs keeps a broken process serving traffic. Don't set `--unhandled-rejections=warn` or `none`.

Official: Node.js *process* and *CLI* docs.

```ts
// bad
process.on('unhandledRejection', (reason) => {
  console.error(reason); // and carry on
});

// good: no handler; or log, then rethrow so the default crash still happens
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled rejection');
  throw reason;
});
```

## NODE-ERR-3 After `uncaughtException`, log, clean up synchronously, and exit. Restart from outside the process.

The docs say it is not safe to resume normal operation after an uncaught exception. The handler is a last resort: write the log, release what must be released synchronously, and exit non-zero. The container runtime or process manager restarts the process.

Official: Node.js *process* docs, "Warning: Using `uncaughtException` correctly".

```ts
// bad
process.on('uncaughtException', (err) => {
  console.error(err); // keeps running in an unknown state
});

// good
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception'); // a synchronous write
  process.exit(1);
});
```

## NODE-ERR-4 Attach an `'error'` listener to every emitter and stream you create.

When an `EventEmitter` emits `'error'` and has no `'error'` listener, Node throws the error and the process exits. A listener on `events.errorMonitor` only observes; it does not prevent the crash. Sockets, streams, child processes and database clients are all emitters.

Official: Node.js *Events* docs.

```ts
// bad
const child = spawn('convert', args);
child.stdout.pipe(output);

// good
const child = spawn('convert', args);
child.on('error', (err) => {
  logger.error({ err }, 'convert failed to start');
});
```

## NODE-ERR-5 Connect streams with `pipeline` from `node:stream/promises`. Not `.pipe()`.

`.pipe()` does not forward errors and does not destroy the other streams when one fails, which leaks file descriptors and leaves requests hanging. `pipeline` destroys every stream on failure, rejects with the first error, and accepts an `AbortSignal`.

Official: Node.js *Stream* docs. (Not verified in this guide's research run; see the appendix.)

```ts
// bad
createReadStream(source).pipe(createGzip()).pipe(createWriteStream(target));

// good
import { pipeline } from 'node:stream/promises';
await pipeline(createReadStream(source), createGzip(), createWriteStream(target), { signal });
```

## NODE-ERR-6 Give every outgoing call a timeout with `AbortSignal.timeout()`. Combine signals with `AbortSignal.any()`.

`fetch` and most clients wait indefinitely by default, so one slow dependency holds requests, sockets and memory until the process falls over. `AbortSignal.timeout(ms)` (v17.3.0) aborts after a deadline, and `AbortSignal.any([...])` (v20.3.0) combines it with a caller's signal, such as the one for a request the client already abandoned. [TS-10.6](../typescript/10-async.md) covers passing signals through.

Official: Node.js *Globals: AbortSignal* docs.

```ts
// bad
const response = await fetch(url);

// good
const response = await fetch(url, { signal: AbortSignal.any([request.signal, AbortSignal.timeout(5_000)]) });
```

## NODE-ERR-7 Set `process.exitCode`. Don't call `process.exit()` in normal code.

`process.exit()` ends the process immediately, even while asynchronous writes are still pending, including log lines going to stdout. Set `process.exitCode` and stop scheduling work, so the process exits once the event loop drains. The exception is an `uncaughtException` handler (NODE-ERR-3), where the process must not keep running.

Official: Node.js *process* docs.

```ts
// bad
logger.error('config invalid');
process.exit(1); // the log line may never be written

// good
logger.error('config invalid');
process.exitCode = 1;
```

## NODE-ERR-8 On `SIGTERM`, stop accepting work, finish in-flight requests within a deadline, close resources, then exit.

Orchestrators send `SIGTERM` and kill the process a fixed time later (30 seconds by default in Kubernetes). `server.close()` stops new connections and, since v19, closes idle keep-alive connections. Call `server.closeAllConnections()` after it, once the deadline passes, to end requests that are still active. Adding a `SIGTERM` listener removes Node's default exit, so the handler must make the process end. In a container, Node only receives the signal if it runs correctly (NODE-RUN-5).

Official: Node.js *HTTP* and *process* docs. The deadline and ordering are convention.

```ts
// bad: no handler; in-flight requests are cut off when the process is killed

// good
import { setTimeout } from 'node:timers';

process.once('SIGTERM', () => {
  server.close(() => {
    void db.end();
  });
  setTimeout(() => {
    server.closeAllConnections();
  }, 10_000).unref();
});
```
