---
"reago-react": minor
---

Added new `useAtom` and `useDeasyncAtom` hooks for querying

We now offer three ways of accessing atoms:
- `useAtom` - returns raw atom value as is, giving consumers full control over async operations.
- `useAsyncAtom` - returns atom value via Suspense, Promises are handled automatically.
- `useDeasyncAtom` - returns atom value unpacked via `deasync`, useful for environments with no Suspense support.
