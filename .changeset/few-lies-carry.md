---
"reago": minor
---

Updated the Store class to bind its methods to the store context

This change makes it safe to use destructuring for extracting individual methods from a store instance
without losing the store context.
