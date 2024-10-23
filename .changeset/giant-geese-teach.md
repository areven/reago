---
"reago": patch
---

Updated the promise tracking system to use the `PromiseLike` type where appropriate

We were previously using the `Promise` type for both internal and external async computations.
This change makes it easier to use third-party implementations of promises with `yield` and `deasync`.
