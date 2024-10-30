---
"reago-react": minor
---

Renamed suspense-based `useAtom` to `useAsyncAtom`

With plenty of legacy projects in the wild the assumption that everyone can use the suspense-based
`useAtom` in `reago-react` is overly optimistic. This name change will allow us to introduce two
new ways of querying - for raw and deasync values.
