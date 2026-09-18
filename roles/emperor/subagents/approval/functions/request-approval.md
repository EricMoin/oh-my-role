---
name: request-approval
description: Persist the pending decision and pause a declared approval gate
continue_until: signal_observed(need_approval)
---

Emit signal(need_approval) with schema_version, plan_revision, the complete strategy,
proposed_ids, action and authorized_scope supplied in the prompt. This node must be
created with needs_approval: true. Do not perform the operation or emit answer.
