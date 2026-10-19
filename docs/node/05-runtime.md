# 5. Configuration and runtime

`NODE_ENV`, configuration and secrets, logging, tracing, and running Node in a container.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## NODE-RUN-1 Set `NODE_ENV=production` in every deployed environment. Don't branch your own code on it.

Node itself has no production mode and ignores `NODE_ENV`. Some libraries read it and fall back to slower development behaviour when it is unset, so set it to `production` in staging too. The official guide calls any other value an antipattern, because staging and production then run different code and tests stop meaning anything. Control behaviour with explicit settings instead.

Official: nodejs.org *Node.js, the difference between development and production*.

```ts
// bad
const debug = process.env.NODE_ENV !== 'production';
// good
const debug = env.LOG_LEVEL === 'debug';
```

## NODE-RUN-2 Read configuration from environment variables, and validate it once at startup.

Environment variables keep the same build deployable everywhere (twelve-factor). Parse and validate them into a typed, frozen object at startup ([TS-19.5](../typescript/19-runtime.md)), so a missing value fails the boot rather than a request. For local development load `.env` with `--env-file` or `process.loadEnvFile()`, not `dotenv`. Never commit `.env`; production secrets come from the platform's secret store. `NODE_OPTIONS` set inside a `.env` file has no effect.

Official: nodejs.org Learn (twelve-factor) and *process* docs. Convention for secret storage.

```jsonc
// bad
{ "scripts": { "dev": "node -r dotenv/config src/server.ts" } }
// good
{ "scripts": { "dev": "node --env-file-if-exists=.env --watch src/server.ts" } }
```

## NODE-RUN-3 Log structured JSON to stdout. Do formatting and shipping outside the main thread.

JSON lines can be searched and filtered by field; `console.log` text cannot. Write to stdout and let the platform collect it, rather than managing files in the app. Pino's docs recommend doing transformation and transmission in a separate process (a log agent), or at least a worker thread (`pino.transport`). Use `pino-pretty` only in development. Log the error object under `err`, not its message alone.

Official: Pino documentation. Pino as the default logger is convention.

```ts
// bad
console.log(`order ${order.id} failed: ${String(err)}`);
// good
logger.error({ err, orderId: order.id }, 'order failed');
```

## NODE-RUN-4 Load OpenTelemetry with `--import` before the application.

Auto-instrumentation patches modules as they load, so it must run before the app imports `http`, `pg` or the framework. Put the SDK setup in its own file and load it with `node --import ./instrumentation.ts`, not as the first import of the app. Don't stack other `--require` or `--import` registrations in `NODE_OPTIONS` alongside it. Libraries emit events through `diagnostics_channel` (stable), which instrumentation subscribes to.

Official: OpenTelemetry JS *Getting started: Node.js*. The ESM loader hook it documents changes between releases; follow the current page.

```jsonc
// bad: SDK started from inside the app, after modules already loaded
{ "scripts": { "start": "node src/server.ts" } }
// good
{ "scripts": { "start": "node --import ./src/instrumentation.ts src/server.ts" } }
```

## NODE-RUN-5 In Docker, start `node` directly in exec form, run an init process, and run as the `node` user.

The kernel gives PID 1 no default signal handling, so Node running as PID 1 does not respond to `SIGTERM` or `SIGINT` unless it installs handlers. `docker run --init` (or `init: true` in Compose, or Tini in the image) fixes that and reaps zombie processes. `npm start` and shell-form `CMD` put a shell in between that doesn't forward `SIGTERM`, so graceful shutdown (NODE-ERR-8) never runs. The official images provide an unprivileged `node` user (uid 1000).

Official: nodejs/docker-node *Best practices*.

```dockerfile
# bad
FROM node:24
CMD npm start

# good
FROM node:24-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node . .
USER node
CMD ["node", "src/server.ts"]
# run with: docker run --init …
```
