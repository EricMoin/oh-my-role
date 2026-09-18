---
name: execute
description: Implement the assigned subtask with tool-based verification
priority: 20
observe:
  - on: tool_after
    tool: todowrite
    sync_todos: true
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: blocked
    capture_payload_as: blocked_info
    set_evidence: signal_blocked
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: escalate
    capture_payload_as: escalate_info
    set_evidence: signal_escalate
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: need_approval
    capture_payload_as: approval_request
    set_evidence: signal_need_approval
continue_until:
  any:
    - signal_observed(answer)
    - signal_observed(need_approval)
    - signal_observed(blocked)
    - signal_observed(escalate)
    - artifact_exists(result)
---

Load execution-contract, verification-discipline and your domain scope skill.
The canonical task and result schemas are in references/schemas.md; graph lifecycle
and approval follow references/graph-protocol.md.

Execute the assigned task within your role and scope skill.

Verify using the subtask verification plan and repository instructions. Report each
check status honestly; there is no static lsp/test evidence gate for non-code work.
On unauthorized destructive discovery emit need_approval and stop without answer.
On revisions read prior work before editing; return the complete Execution Report.
