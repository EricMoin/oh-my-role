# Flutter Architecture Guide

Use this guide when a task changes feature structure, state ownership, repositories, domain logic, dependency injection, or generated models.

## Checks

- Inspect local conventions before adding architecture.
- Keep widgets focused on rendering and user intents.
- Put screen state and commands in the existing presentation-state primitive.
- Use repositories to hide transport, storage, caching, retries, and synchronization.
- Keep DTO/API models separate from domain models when transport shape should not leak into UI.
- Inject clients, storage, clocks, and platform services.
- Add use cases only when logic is reused or would clutter presentation state.
- Prefer incremental refactors over moving unrelated features.

## Default New-Project Baseline

For an unstructured app, use feature-oriented UI plus shared data/domain layers:

```text
lib/
  data/
  domain/
  ui/
    core/
    features/
```

This is a starting point, not a rule. Existing project structure wins unless it is the problem.
