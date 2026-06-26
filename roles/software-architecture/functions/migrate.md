---
name: migrate
description: Migration mode for evolving architecture without big-bang rewrites.
---

Run architecture migration mode.

Start from current state, not the target diagram. Produce an incremental migration path with phases, compatibility constraints, data movement, rollback points, observability, fitness functions, and stop conditions.

If code changes are requested, implement only the next safe migration slice and verify it with local checks.
