# 8. Testing

How to test React components so that tests check what users see and do. For general testing rules, see [GEN-TEST](../general/03-testing.md).

Each rule says whether it is official guidance (Testing Library's docs) or convention. Sources are in the [appendix](appendix.md#sources).

## REACT-TEST-1 Query by role first. Use test IDs only when nothing a user can perceive works.

A query by role and accessible name (`getByRole('button', { name: 'Save' })`) finds the element the way a user or screen reader would, and fails when the element becomes inaccessible. `getByTestId` passes even when the button has no label at all. Priority: `getByRole`, then `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`, then `getByAltText`, `getByTitle`, and `getByTestId` last.

Official: Testing Library, *About Queries*: `getByRole` "should be your top preference for just about everything"; test IDs are last because "the user cannot see (or hear) these".

```tsx
import { render, screen } from '@testing-library/react';
// bad
await user.click(screen.getByTestId('save-btn'));
// good
await user.click(screen.getByRole('button', { name: 'Save' }));
```

## REACT-TEST-2 Wait for async UI with `findBy`. Use `queryBy` only to assert that something is absent.

`getBy` throws immediately if nothing matches, so it fails on UI that appears after a request. `findBy` returns a promise that resolves when the element appears. `queryBy` returns `null` instead of throwing, which is only useful for "is not there". Query through `screen`, not the container returned by `render`.

Official: Testing Library, *About Queries*.

```tsx
import { render, screen } from '@testing-library/react';
// bad
await waitFor(() => expect(container.querySelector('.success')).not.toBeNull());
expect(screen.queryByText('Saved')).toBeInTheDocument();
// good
expect(await screen.findByText('Saved')).toBeInTheDocument();
expect(screen.queryByRole('alert')).not.toBeInTheDocument();
```

## REACT-TEST-3 Simulate interactions with `user-event`. Not `fireEvent`.

`fireEvent.change` sets a value in one step. A real user focuses, presses keys and triggers the whole event sequence, which is what `user-event` simulates. Bugs that live in that sequence (a `keydown` handler, a focus trap, a disabled button) only show up with `user-event`.

Convention: Testing Library's docs recommend `user-event` for most interactions; this was not part of the verified research.

```tsx
import { render, screen } from '@testing-library/react';
// bad
fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.c' } });
// good
const user = userEvent.setup();
await user.type(screen.getByLabelText('Email'), 'a@b.c');
```

## REACT-TEST-4 Test components by what they render and do. Not by their state, props passed to children, or hooks called.

A test that inspects internal state or mocks a child component breaks on every refactor and passes when the user-visible behavior is broken. Render the component, interact the way a user would, and assert on the result. Mock the network at the boundary (for example with MSW), not your own modules. See [GEN-TEST-4](../general/03-testing.md#gen-test-4-test-behavior-through-the-public-interface-not-implementation-details).

Official: Testing Library's guiding principle: "your test should resemble how users interact with your code."

```tsx
import { render, screen } from '@testing-library/react';
// bad
vi.mock('./CartSummary', () => ({ CartSummary: vi.fn(() => null) }));
render(<Cart />);
expect(CartSummary).toHaveBeenCalledWith(expect.objectContaining({ total: 30 }), undefined);
// good
render(<Cart />);
await user.click(screen.getByRole('button', { name: 'Add book' }));
expect(screen.getByText('Total: €30.00')).toBeInTheDocument();
```

## REACT-TEST-5 Cover critical flows with browser end-to-end tests. Keep them few.

Component tests run in a simulated DOM (jsdom or happy-dom), so they miss layout, real navigation, Server Components and the network. A small set of end-to-end tests in a real browser (Playwright, for example) catches what they miss. Keep the set to the flows that would hurt most if broken, since browser tests are slower and flakier ([GEN-TEST-6](../general/03-testing.md#gen-test-6-choose-test-levels-by-confidence-per-second-not-by-a-shape)).

Convention: the tool choice (Vitest, Playwright) is common practice, not React team guidance.

```text
// bad
300 Playwright tests, one per component state; CI takes 40 minutes.

// good
Component tests for component behavior; Playwright for sign-up, checkout and login.
```
