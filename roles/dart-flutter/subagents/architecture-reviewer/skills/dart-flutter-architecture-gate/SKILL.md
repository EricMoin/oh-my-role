---
name: dart-flutter-architecture-gate
description: Architecture gate for Dart-Flutter subagent. Reviews feature structure, state ownership, repository/data boundaries, dependency injection, code generation, and maintainability before broad Flutter implementation or refactoring proceeds.
---
# Dart-Flutter Architecture Gate

## Mission

Confirm that the proposed Flutter change fits the existing architecture and does not introduce avoidable coupling.

## Required Checks

- Existing project conventions were inspected and preserved unless intentionally changed.
- UI, presentation state, domain, data, and platform boundaries are clear.
- State has one owner and side effects do not run from widget `build`.
- Repositories/services hide transport, persistence, platform APIs, caching, and retries.
- Dependencies are injectable for tests.
- DTO/domain separation is intentional.
- Code generation choices match local conventions.
- The change avoids unrelated refactors.

## References

Use `roles/dart-flutter/references/guides/architecture.md`, `state-management.md`, and `networking-data.md` when relevant.

## Output

```md
Gate: Architecture
Status: pass | fail | needs-user-input
Engineering State Patch:
Evidence:
Blocking Issues:
Required Revisions:
Verification:
Next Gate:
```
