---
name: finalize
description: Merge approved draft into the canonical final strategy
produces: final_strategy
continue_until:
  any:
    - signal_observed(answer)
    - artifact_exists(final_strategy)
observe:
  - on: tool_after
    capture_artifact: final_strategy
---

Reconcile the supplied Strategy and review findings using references/schemas.md.
Preserve all accepted requirements, dependencies, verification and authorization.
Do not add scope or claim unavailable review passed. Surface unresolved vetoes in
notes and risk: high. Return the complete Strategy as identical signal(answer)
payload and JSON result fence; final_strategy may mirror it as a local artifact.
