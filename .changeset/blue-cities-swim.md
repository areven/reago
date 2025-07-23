---
"reago": patch
---

Switched to arrow functions for Store context binding

This approach allows TypeScript to recognize the `this` context is irrelevant and methods
can be safely destructured.
