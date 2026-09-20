---
name: report
description: Emit the canonical structured execution report after verification
priority: 30
continue_until:
  any:
    - signal_observed(answer)
    - signal_observed(need_approval)
    - signal_observed(blocked)
    - signal_observed(need_clarification)
    - signal_observed(escalate)
---

Build the complete Execution Report from references/schemas.md, with actual check
outcomes and incomplete_items. If acceptance is supported, no work remains and all
required checks are satisfied, emit answer(report). Otherwise emit escalate with
category, attempts and the partial report; never release consumers with an answer
that describes incomplete or unverified work.

First emit a JSON result fence containing the exact signal payload (including the
escalation wrapper on failure), then call signal with that object. A result fence
alone does not complete this function. Never substitute summary-only payloads.
Do not emit answer after need_approval, blocked, need_clarification or escalate.
Preserve completed and remaining work using the corresponding schema contract.
