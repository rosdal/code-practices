# 6. Testing

Choosing a test runner and running tests against the Node versions you ship on. What to test and how is in [GEN-TEST](../general/03-testing.md); React components are in [REACT-TEST](../react/08-testing.md).

Each rule says whether it is official guidance or convention. Sources are in the [appendix](appendix.md#sources).

## NODE-TEST-1 Use `node:test` for Node services, libraries and CLIs. Use Vitest when you need stable coverage or module mocking. Not Jest for new ESM projects.

`node:test` is stable since v20.0.0, needs no dependency, and runs `.ts` files through type stripping. Its snapshots and mock timers are stable. Coverage (`--experimental-test-coverage`) is still experimental, and `mock.module()` is early development behind `--experimental-test-module-mocks`. If your tests rely on either, use Vitest. Jest 30 still calls its ESM support experimental: it needs `--experimental-vm-modules`, and ESM mocking only works through `jest.unstable_mockModule`.

Official: Node.js *Test runner* docs (v24.22.0, v26.12.0); Jest 30 *ECMAScript Modules* docs. Choosing Vitest over `node:test` is convention.

| Need | `node:test` | Vitest | Jest 30 |
|---|---|---|---|
| Runs ESM and `.ts` without config | Yes | Yes | Experimental |
| Snapshots, fake timers | Stable | Yes | Yes |
| Coverage | Experimental | Yes | Yes |
| Module mocking | Early development | Yes | `unstable_mockModule` for ESM |

```ts
// bad: Jest plus a transform, to test plain ESM
// node --experimental-vm-modules node_modules/jest/bin/jest.js

// good
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('parses a port', () => {
  assert.equal(parsePort('8080'), 8080);
});
```

## NODE-TEST-2 Run CI on the Node version production uses. Libraries: every supported line, plus the next one.

A test run on a different major proves less than it looks: defaults, built-ins and deprecations differ between lines. Apps test on the pinned version (NODE-SETUP-2). Libraries test every line in their `engines` range. From Node 27, the project asks library authors to also run the Alpha release in CI, to catch breaking changes before they ship.

Official: Node.js release schedule announcement (Alpha channel advice). The matrix is convention.

```yaml
# bad: one version, unrelated to production
node-version: latest

# good: library
strategy:
  matrix:
    node-version: [22, 24, 26]
```
