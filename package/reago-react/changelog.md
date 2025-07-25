# reago-react

## 1.0.5

### Patch Changes

- 8aeb9be: Generated npm provenance statements for the package

## 1.0.4

### Patch Changes

- 4590936: Implemented minor stylistic changes

## 1.0.3

### Patch Changes

- f2b3721: Updated the readme badges on npm pages

## 1.0.2

### Patch Changes

- 4bcce0d: Fixed the MIT license links on npm pages

## 1.0.1

### Patch Changes

- bb25099: Fixed a deployment issue caused by `changesets` misconfiguration

## 1.0.0

### Major Changes

- 687b868: Reago is now stable

  After multiple iterations, internal improvements, and type safety enhancements, Reago has reached its
  first stable release. The core API is now considered production-ready. Future updates will follow semantic
  versioning strictly, with a strong focus on API stability.

### Patch Changes

- Updated dependencies [687b868]
  - reago@1.0.0

## 0.3.0

### Patch Changes

- Updated dependencies [93a14a5]
  - reago@0.3.0

## 0.2.1

### Patch Changes

- 1152e34: Transferred the package ownership to the `areven` organization
- Updated dependencies [1152e34]
  - reago@0.2.2

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
