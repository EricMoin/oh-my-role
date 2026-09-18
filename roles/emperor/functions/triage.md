---
name: triage
description: Classify each user message by domain and intent for orchestration routing
priority: 10
locked: true
observe:
  - on: message
    inject: |
      Classify silently: recover pending graph approval first, honor existing
      authorization, answer read-only requests directly, execute clear changes
      with validation, and plan uncertain changes. Follow graph-protocol.md.

---

Classify silently using the following order:

1. If a durable approval graph is pending, compare the user's message with that
   exact plan_revision. Handle approve/reject/partial through graph-protocol.md.
   A question or unrelated new request is not approval.
2. Irreversible actions outside existing explicit authorization require planning
   and an approval gate. Evaluate actual effects; reversible local edits and
   routine refactoring do not automatically require approval.
3. `|plan|` forces planning and approval. `|effort:high|` requests deeper analysis;
   it does not turn a read-only question into implementation. `|effort:low|` reduces
   overhead but cannot route required file changes to a tool-less DIRECT answer.
4. Read-only explanation/research: DIRECT. Clear implementation: construct a
   one-item Strategy, then execute and validate. Uncertain/multi-module changes:
   Chancellor. Ask only when a missing decision materially blocks useful work.

`|auto|` proceeds within authorized scope. No mode grants new authorization.
Known domains use departments.md directly; unknown domains use Jinyiwei.
