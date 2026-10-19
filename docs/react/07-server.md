# 7. Server Components and Server Functions

How to draw the server/client boundary and keep Server Functions safe. Applies to RSC frameworks such as Next.js App Router and React Router with RSC.

Each rule says whether it is official React team guidance or convention. Sources are in the [appendix](appendix.md#sources).

## REACT-SERVER-1 Keep components on the server by default. Add `'use client'` only where you need state, Effects or browser APIs.

Server Components send HTML and no JavaScript for themselves, and can read data directly. `'use client'` marks the boundary: that module and everything it imports become client code. Put the boundary as low in the tree as possible, around the interactive part, not at the top of the page.

Official: React 19 release post; the `'use client'` reference. Note that there is no directive for Server Components; `'use server'` means something else ([REACT-SERVER-2](#react-server-2-use-use-server-only-for-server-functions-and-only-for-mutations)).

```tsx
// bad: the whole page ships as client JavaScript for one button
'use client';
export default function ProductPage({ product }: { product: Product }) {}
// good: page stays on the server; only the button is a client component
export default async function ProductPage({ id }: { id: string }) {
  const product = await getProduct(id);
  return <article><h1>{product.name}</h1><AddToCartButton productId={id} /></article>;
}
```

## REACT-SERVER-2 Use `'use server'` only for Server Functions, and only for mutations.

`'use server'` turns an async function into an endpoint the client can call. React designed Server Functions for changing server state; frameworks typically run them one at a time and don't cache their results, so using them to read data is slow. Read data in Server Components or loaders. Arguments must be serializable: no JSX, class instances, events, or ordinary functions.

Official: react.dev `'use server'` reference: "they are not recommended for data fetching."

```tsx
// bad
'use server';
export async function getProducts() { return db.products.findMany(); }
// good
'use server';
export async function addToCart(productId: string) {}
```

## REACT-SERVER-3 Treat every Server Function argument as untrusted. Validate it and check authorization inside the function.

A Server Function is a public HTTP endpoint, whether or not your UI exposes a button for it. Anyone can call it with any arguments. Hiding the button or checking permissions in the component that renders the form does not protect it. See [TS-2.2](../typescript/02-types.md) for parsing input with a schema.

Official: react.dev `'use server'` reference: "Arguments to Server Functions are fully client-controlled. For security, always treat them as untrusted input."

```tsx
// bad
'use server';
export async function deletePost(postId: string) { await db.posts.delete(postId); }
// good
'use server';
export async function deletePost(input: unknown) {
  const { postId } = DeletePostInput.parse(input);
  const user = await requireUser();
  const post = await db.posts.find(postId);
  if (post?.authorId !== user.id) throw new ForbiddenError();
  await db.posts.delete(postId);
}
```

## REACT-SERVER-4 Pass Server Functions to `<form action>` so forms work before JavaScript loads.

With a Server Function as the form's `action`, the form submits as a normal HTML form until the bundle loads (progressive enhancement). Use `useActionState` to show the result ([REACT-FORM-1](06-forms-actions.md#react-form-1-handle-form-submissions-with-an-action-and-useactionstate-not-hand-rolled-loading-and-error-state)). Outside a form, call Server Functions inside a Transition so React tracks the pending state.

Official: react.dev `'use server'` reference.

```tsx
// bad
<button onClick={async () => { await subscribe(email); }}>Subscribe</button>;
// good
<form action={subscribe}>
  <input name="email" type="email" />
  <button>Subscribe</button>
</form>;
```

## REACT-SERVER-5 Keep secrets in runtime configuration. Never as literals in server code.

"Server-only" code is still source that a bug can expose. CVE-2025-55183 exposed Server Function source code, including hardcoded secrets, while values read from `process.env` at runtime stayed safe.

Official: React security advisory, December 2025.

```tsx
// bad
'use server';
const STRIPE_KEY = 'sk_live_51H...';
// good
'use server';
const stripeKey = config.stripeSecretKey; // read from the environment at startup (TS-19.5)
```

## REACT-SERVER-6 Wrap each independently loading section in its own `<Suspense>` boundary and an error boundary.

One boundary for the whole page means the slowest query decides when anything shows, and one failure blanks the page. A boundary per section lets fast parts render first and contains errors to the part that failed. Start independent requests in parallel, not one after another.

Convention: follows from how `<Suspense>` and error boundaries work (react.dev references), but placement is a design choice the research did not verify.

```tsx
// bad: sequential awaits, one boundary
const user = await getUser(id);
const orders = await getOrders(id);
// good
<>
  <ErrorBoundary fallback={<ProfileError />}><Suspense fallback={<ProfileSkeleton />}><Profile id={id} /></Suspense></ErrorBoundary>
  <ErrorBoundary fallback={<OrdersError />}><Suspense fallback={<OrdersSkeleton />}><Orders id={id} /></Suspense></ErrorBoundary>
</>;
```
