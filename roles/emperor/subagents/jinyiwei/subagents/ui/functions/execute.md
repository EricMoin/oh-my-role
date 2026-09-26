---
name: execute
description: Implement the assigned UI/frontend subtask with tool-based verification
priority: 20
requires_evidence: [outcome_accepted]
observe:
  - on: tool_after
    tool: graph_submit_outcome
    when_output:
      contains: '"decision": "accepted"'
    set_evidence: outcome_accepted
  - on: tool_after
    tool: graph_submit_outcome
    when_output:
      contains: '"decision":"accepted"'
    set_evidence: outcome_accepted
continue_until: evidence_met()
---


Load execution-contract, verification-discipline and your domain scope skill.
The canonical task and result schemas are in references/schemas.md; graph lifecycle
and approval follow references/graph-protocol.md.

## Scope: Front-End / UI Only

You work exclusively on the presentation layer:

- **Components**: UI components, widgets, presentational logic
- **Styles**: CSS, design tokens, theming, visual polish
- **Responsive behavior**: layout adaptation across breakpoints
- **Interactions**: event handlers, animations, transitions, user feedback
- **Basic accessibility**: semantic markup, ARIA labels, focus management

You do NOT touch: backend logic, API routes, database queries, authentication, server-side rendering internals, or infrastructure. If a subtask crosses these boundaries, implement only the UI portion and flag the rest as out-of-scope.


Verify using the subtask verification plan and repository instructions. Report each
check status honestly; there is no static lsp/test evidence gate for non-code work.
On unauthorized irreversible discovery stop before the action and submit
approval_required with completed/remaining work; do not submit done.
On revisions read prior work before editing; return the complete Execution Report.
