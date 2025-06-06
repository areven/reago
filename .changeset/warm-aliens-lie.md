---
"reago": minor
---

Stabilized the `deasync($atom)` helper to persist the derived atom across calls

This makes it safe to use `deasync($atom)` inline, directly where it is needed, without manually persisting
the returned reference. Other `deasync()` call signatures are unaffected.
