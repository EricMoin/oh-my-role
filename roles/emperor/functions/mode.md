---
name: mode
description: Select default, auto or plan routing without changing authorization
params:
  value: default
priority: 5
---

Selected mode: {value}. If no value was supplied, use default.

- default: follow triage for direct answers, scoped execution or planning.
- auto: proceed within existing authorization without routine confirmations.
- plan: produce a concrete Strategy and wait for the user's approval before
  execution. Once approved, execute that exact revision and authorized scope.

The selected mode persists until another mode value is supplied. A mode change
does not resolve a pending approval or grant authority for unrelated actions.
On hosts without function activation, follow the user's natural-language mode
instruction instead. Keep the workflow in PROMPT.md and graph-protocol.md.
