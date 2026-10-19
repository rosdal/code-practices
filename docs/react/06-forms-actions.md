# 6. Forms and Actions

How to handle submissions, pending states, errors and optimistic updates with React 19 Actions.

Each rule says whether it is official React team guidance or convention. Sources are in the [appendix](appendix.md#sources).

## REACT-FORM-1 Handle form submissions with an Action and `useActionState`. Not hand-rolled loading and error state.

An Action is an async function run in a Transition. React tracks its pending state, keeps the UI interactive while it runs, and resets an uncontrolled `<form>` when it succeeds. `useActionState` returns the result and the pending flag, so you don't write `isLoading`/`error` state by hand. `ReactDOM.useFormState` is the deprecated Canary-era name; don't use it.

Official: React 19 release post and `useActionState` reference.

```tsx
// bad
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string>();
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setIsLoading(true);
  try { await updateName(new FormData(e.currentTarget)); } catch (err) { setError(String(err)); }
  setIsLoading(false);
}
// good
const [error, submitAction, isPending] = useActionState(async (_previous: string | undefined, formData: FormData) => {
  const result = await updateName(formData);
  return result.ok ? undefined : result.error;
}, undefined);
<form action={submitAction}>
  <input name="name" />
  <button disabled={isPending}>Save</button>
  {error && <p role="alert">{error}</p>}
</form>;
```

## REACT-FORM-2 Show optimistic results with `useOptimistic`. Not by writing to state before the request and undoing it on failure.

`useOptimistic` shows a temporary value while an Action runs and drops it automatically when the Action finishes or fails, so a failed request can't leave the fake value behind.

Official: React 19 release post and `useOptimistic` reference.

```tsx
// bad
setMessages([...messages, draft]);
try { await send(draft); } catch { setMessages(messages); }
// good
const [optimisticMessages, addOptimistic] = useOptimistic(messages, (current: Message[], draft: Message) => [...current, draft]);
async function sendAction(formData: FormData) {
  const draft = toMessage(formData);
  addOptimistic(draft);
  await send(draft);
}
```

## REACT-FORM-3 Give every input a visible label, and announce errors.

A placeholder is not a label: it disappears on input and many screen readers skip it. Associate a `<label>` with each control, tie error text to it with `aria-describedby`, and use `role="alert"` (or a live region) for errors that appear after submit. Prefer native elements (`<button>`, `<select>`, `<input type="checkbox">`) over `div`s with handlers; they come with keyboard and screen-reader support.

Convention, based on WCAG 2.2 (1.3.1, 3.3.1, 3.3.2, 4.1.2). Not React-specific, and not part of the verified research.

```tsx
// bad
<>
  <input placeholder="Email" />
  <div onClick={submit}>Send</div>
</>;
// good
<>
  <label htmlFor="email">Email</label>
  <input id="email" name="email" type="email" aria-describedby="email-error" aria-invalid={Boolean(emailError)} />
  {emailError && <p id="email-error" role="alert">{emailError}</p>}
  <button type="submit">Send</button>
</>;
```
