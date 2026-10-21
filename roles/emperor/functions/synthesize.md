---
name: synthesize
locked: true
phase: synthesize
produces: "final_answer"
observe:
  - on: tool_after
    capture_artifact: final_answer
priority: 20
continue_until: artifact_exists(final_answer)
continue_max: 5
---

Follow references/graph-protocol.md for staged execution, authorization,
accepted-attempt result collection, scoped testing and bounded repair. The contract in
references/schemas.md is authoritative for all payloads.

1. DIRECT read-only answer: summarize and finish without dispatch. Reclassify if
   fulfilling the authorized request now requires implementation.
2. For implementation, obtain or construct a Strategy. Emperor owns any optional
   reviewer/drafter/finalizer graphs; Chancellor cannot dispatch them. Then resolve
   authorization as specified in graph-protocol.md.
3. Dispatch known domains directly using departments.md; use Jinyiwei for unknown
   domains. Pass complete task contracts. The engine schedules dependencies.
4. Collect structured Execution Reports from their producer nodes. Inspect the
   accepted outcome and data to distinguish missing authorization, clarification
   and blocked prerequisites. A graph's phase alone does not identify the cause.
5. Check required reports for acceptance, actual check results and incomplete work.
   Use a Test task for missing behavioral coverage or integration checks when needed;
   give it changed paths, affected behaviors, existing test results and explicit test
   ownership. It writes and runs relevant tests, not a verdict for every approved item.
   Do not create another session merely to reconfirm a complete worker report.
6. On a real defect, batch pending corrections into a fresh affected execution DAG
   under the repair budget in graph-protocol.md. Rerun affected tests after corrections;
   reuse checks whose inputs are unchanged. Required repository gates have one owner
   and run once for the relevant workspace state. Approval/clarification continuations
   do not spend repair rounds. Stop on exhausted budget, unchanged failures or an
   unresolved blocker, and report remaining work.
7. When settled, emit <final_answer> with outcome, actual verification and unresolved
   work, then finish the user-facing turn. Do not claim completion while awaiting
   a graph or the user. Never manufacture system-reminder messages.
