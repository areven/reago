# reago-react

## 0.2.0

### Minor Changes

- c4135fc: Added new `useAtom` and `useDeasyncAtom` hooks for querying

  We now offer three ways of accessing atoms:

  - `useAtom` - returns raw atom value as is, giving consumers full control over async operations.
  - `useAsyncAtom` - returns atom value via Suspense, Promises are handled automatically.
  - `useDeasyncAtom` - returns atom value unpacked via `deasync`, useful for environments with no Suspense support.

### Patch Changes

- Updated dependencies [e5cc2f1]
  - reago@0.2.1

## 0.1.1

### Patch Changes

- Updated dependencies [b0df7cc]
  - reago@0.2.0

## 0.1.0

### Minor Changes

- 9e95f80: Renamed suspense-based `useAtom` to `useAsyncAtom`

  With plenty of legacy projects in the wild the assumption that everyone can use the suspense-based
  `useAtom` in `reago-react` is overly optimistic. This name change will allow us to introduce two
  new ways of querying - for raw and deasync values.

## 0.0.2

### Patch Changes

- 222564d: Simplified the package.json keywords
- 77c711e: Added `main` and `types` fields to package.json
- Updated dependencies [77c711e]
  - reago@0.1.4

## 0.0.1

### Patch Changes

- d215165: Introducing `reago-react` – the official React bindings for the Reago state management library!

  Effortlessly integrate Reago's powerful state system into your React applications with
  minimal setup. Now, managing complex states in React components has never been simpler or
  more efficient.
