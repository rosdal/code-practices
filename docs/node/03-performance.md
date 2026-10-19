# 3. Performance

Keeping the event loop free, where CPU-bound work goes, how to scale across cores, and memory limits in containers. Measure before optimizing; these rules are about not creating the problem in the first place.

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## NODE-PERF-1 Never block the event loop. No synchronous I/O, unbounded parsing or unsafe regexes on a request path.

One thread runs every callback. While one request runs a slow synchronous operation, every other request waits. The usual causes are `*Sync` APIs (`readFileSync`, `execSync`, `pbkdf2Sync`, `zlib.gzipSync`), `JSON.parse` on a large body (the docs measured 1.3 seconds for a 50 MB string) and regular expressions with catastrophic backtracking (ReDoS). Sync APIs are fine at startup and in CLIs.

Official: nodejs.org *Don't Block the Event Loop (or the Worker Pool)*.

```ts
// bad
app.post('/import', (req) => {
  const template = readFileSync('template.html', 'utf8');
  return render(template, JSON.parse(req.body));
});

// good: read once at startup, cap the body size, parse within that limit
const template = await readFile('template.html', 'utf8');
const MAX_BODY_BYTES = 1_000_000;
```

## NODE-PERF-2 Run CPU-heavy JavaScript in a pool of worker threads. Not on the main thread, and not one worker per task.

`worker_threads` (stable) runs JavaScript on other cores and can share memory through `SharedArrayBuffer`. Workers don't help with I/O, which Node already does asynchronously. Starting a worker is expensive, so use a fixed pool sized to the CPUs the process actually gets (`os.availableParallelism()`). Piscina is the common pool library.

Official: Node.js *Worker threads* docs ("use a pool of Workers for these kinds of tasks"). Piscina is convention.

```ts
// bad
app.post('/thumbnail', async (req) => new Worker('./resize.ts', { workerData: req.body }));

// good
const pool = new Piscina({ filename: new URL('./resize.ts', import.meta.url).href });
app.post('/thumbnail', async (req) => pool.run(req.body));
```

## NODE-PERF-3 Scale across cores and machines with more processes behind the orchestrator. Not the `cluster` module.

`cluster` forks workers on one machine and balances requests between them, which the container platform or load balancer already does better: health checks, rolling deploys, spreading across machines. One Node process per container, replicated, also keeps memory limits and metrics per process. Use `cluster` only where no orchestrator exists.

Convention, and contested (see the [appendix](appendix.md#contested-points-and-recommended-stances)). The old Node docs suggested `cluster` for CPU-heavy work; later guidance favours worker threads (NODE-PERF-2).

```text
// bad
one container: cluster.fork() × os.cpus().length

// good
N replicas of one Node process, each with its own CPU and memory limit
```

## NODE-PERF-4 In containers, set `--max-old-space-size` to fit the memory limit. Don't raise it to hide a leak.

Node sizes its default heap from the container's cgroup memory limit, but only to about half of it below 4 GiB, levelling off around 2 GiB. A 4 GiB container can then run out of heap with half its memory unused. Setting the heap to about 75% of the limit leaves room for buffers and native memory. A heap that keeps growing is a leak; a bigger limit only delays the crash.

Secondary source (Red Hat Developer, October 2025; one split verification). The 75% figure is convention.

```text
// bad: 4 GiB limit, default heap of about 2 GiB
// bad: 4 GiB limit, --max-old-space-size=4096 (no room for anything outside the heap)

// good: 4 GiB limit
NODE_OPTIONS=--max-old-space-size=3072
```
