---
name: report
description: Emit the canonical structured execution report after verification
priority: 30
continue_until:
  any:
    - signal_observed(answer)
    - signal_observed(need_approval)
    - signal_observed(blocked)
    - signal_observed(escalate)
    - artifact_exists(result)
---

Return the Execution Report object defined in references/schemas.md. Emit identical
JSON in a result fence and signal(answer) payload. Include incomplete_items even
when empty. Never substitute abbreviated summary-only payloads. Check statuses
must reflect actual outcomes; unavailable verification is not passed.

Do not emit answer after need_approval, blocked or escalate. These are unresolved
control states, not successful reports. Preserve completed work and remaining scope
in the corresponding signal payload for the coordinator.
