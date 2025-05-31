# Versioning

All official Reago packages follow [Semantic Versioning](https://semver.org/), which provides a
standardized way to signal the nature of changes between releases.

Each release version has the format: `MAJOR.MINOR.PATCH`.

## SemVer breakdown

- **MAJOR** version changes (`1.0.0` → `2.0.0`):
  Breaking changes that may require code changes in your application.

  _Example:_ A function is removed or renamed, or a type becomes stricter in a way that could break existing
  valid code.

- **MINOR** version changes (`1.2.0` → `1.3.0`):
  Backward-compatible new features or improvements.

  _Example:_ A new optional hook is introduced, or an atom utility is added that doesn't change existing behavior.

- **PATCH** version changes (`1.2.3` → `1.2.4`):
  Bug fixes and non-breaking internal updates.

  _Example:_ A fix for an atom hook edge case that doesn't change the public API.


## Stability guarantees

- No breaking changes are introduced outside of a major version bump.
- Type signatures and public APIs remain stable across patch and minor updates.


## Version independence across packages

Each official package in the Reago ecosystem is versioned independently. The version number of `reago-react`,
for example, does **not** mirror the version of the core `reago` package. They evolve at their own pace and
should not be expected to track each other numerically.

This means:

- You may use `reago@2.0.0` with `reago-react@1.3.4` if they are compatible.
- A major version bump in `reago` does not imply a bump in `reago-react`, and vice versa.


## Compatibility

We aim to maintain compatibility between packages as long as they are intended to work together. If a new version
of `reago-react` requires a newer core version, it will be noted in its changelog and `peerDependencies`.

When upgrading, always refer to changelogs and `package.json` requirements to ensure compatibility.


## Summary

- Reago uses strict SemVer across all official packages.
- Breaking changes only occur in major releases.
- Packages are versioned independently.
- Always check compatibility notes when upgrading across packages.
