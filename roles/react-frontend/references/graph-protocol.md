# React engineering on Rolebox Graph v3

Pick the smallest plan that can answer the acceptance question. A local copy edit can be checked inline. For a behavior change with a known API, use `change → verify`. Include `source` when an answer about the installed framework or dependency could change the patch. For a read-only version investigation or code review, select `source` or `verify` alone.

## A version-sensitive repair

Suppose a user saves a new item name, visits the list again and sees the previous name. The source tracer establishes which data path the route uses and what a refresh affects in this version. The implementation worker repairs the owner of the stale read. The verifier repeats that navigation on the changed snapshot. Each step consumes the preceding worker's accepted evidence.

The following declaration is exercised by the role's runtime contract test. Replace the sample name with a fresh task identity and adapt each prompt to the real route and workspace. Include the affected paths, dirty baseline, dependency versions, authorized write scope, acceptance criteria and relevant resource excerpts. A worker can read an installed resource if it receives a resolved path accessible in its session.

```json
{
  "version": 3,
  "name": "react-item-rename-review",
  "budget": { "max_executions": 5 },
  "nodes": [
    {
      "id": "source",
      "agent": "react-frontend--source-tracer",
      "prompt": "Trace the list route and the save action in the consuming package. Establish the router, package versions and cache owner. Look up the applicable refresh behavior using the source-evidence guidance supplied in the brief. Return resolved with the version, code path, official source and implication, or blocked with the missing fact if it changes the choice of fix.",
      "outcomes": [{ "id": "resolved" }, { "id": "blocked" }],
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 300000 }
    },
    {
      "id": "change",
      "agent": "react-frontend--change-applier",
      "prompt": "Use the accepted source finding to fix the stale list read after renaming an item. Keep the existing route and edit flow. Exercise the affected path. Return ready with the diagnosis, source finding, changed paths and checks available for independent review. On repair, consume the verifier's exact finding and address its reproduction. Return blocked with the unresolved prerequisite if the assigned work cannot proceed.",
      "inputs": [
        { "from": "source", "outcome": "resolved" },
        { "from": "verify", "outcome": "revise", "when": "triggered" }
      ],
      "join": { "strategy": "any" },
      "outcomes": [{ "id": "ready" }, { "id": "blocked" }],
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 600000 }
    },
    {
      "id": "verify",
      "agent": "react-frontend--verification",
      "prompt": "Use the accepted change report and its source finding. On the current snapshot, open the item, rename it, save it and navigate back to the list as the user did. Check the displayed name. Compare the result with the acceptance criteria and inspect related callers for regressions. Return pass with observations, revise with a concrete failing path and expected result, or blocked with the missing evidence. Leave source and fixtures unchanged.",
      "inputs": [{ "from": "change", "outcome": "ready" }],
      "outcomes": [{ "id": "pass" }, { "id": "revise" }, { "id": "blocked" }],
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 600000 }
    }
  ],
  "edges": [
    { "from": "source", "to": "change", "outcome": "resolved" },
    { "from": "change", "to": "verify", "outcome": "ready" },
    { "from": "verify", "to": "change", "outcome": "revise" }
  ],
  "loop_groups": [{
    "id": "repair",
    "nodes": ["change", "verify"],
    "max_traversals": 1,
    "continuation_outcome": "revise",
    "exit_outcome": "pass"
  }]
}
```

## Adapt the plan

- **Known API.** Remove the source node, its edge, the matching input on `change` and references to an upstream source finding in the briefs. Include any relevant evidence already established by the lead. Four executions cover the initial change, verification and one repair with re-verification.
- **Read-only investigation or review.** Keep only the assigned node. Remove its inputs and join, set `edges` to an empty array, omit `loop_groups`, and budget one execution. Give the node the actual question or reviewed snapshot. A standalone review returns its findings directly to the lead.
- **Documentation access.** Check the capabilities actually available to the worker on this host. If only the lead can access Context7, resolve the question before dispatch, use the known-API plan and include the version-matched finding in the change brief.
- **Browser access.** Prefer a project browser harness the verifier can run. If a required browser interaction is available only to the lead, end the first graph at `change.ready`. Remove `verify`, both of its edges, its triggered input and the loop group. Keep the source dependency only when needed. After collecting the accepted change, use the browser on that exact revision. Give the observations and change report to a standalone verifier. For a defect, send the finding back to the writer once and repeat the browser check on the repaired version. Identify who operated the browser in the final report.

## Start, collect and recover

The lead declares the complete plan with `graph_declare({declaration})`. On a started or resumed run, yield for the graph notification. A saved plan without dispatch, a blocked start or a refusal requires inspection of the returned reason. Check the existing graph before changing execution paths so two writers cannot act on the same files.

Edges schedule the next attempt. Inputs carry the accepted payload. On repair, `when: "triggered"` binds the failing verifier's feedback to the new change attempt. The source finding stays available on each change attempt. The change report passes the applicable source finding along to verification. While the graph runs, the implementation worker owns project edits, including fixes to tests. Reviewers may exercise the app and create ordinary test output.

After a completion or blockage notification, read `graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})`. Match the accepted result to the current run and revision. A `blocked` outcome ends its route with a missing prerequisite. An exhausted repair loop leaves the last defect open. Use `graph_audit` for a storage or recovery diagnosis and `graph_control` for a justified lifecycle action. Carry verified work and the remaining defect into a fresh, scoped plan only when new evidence or a changed approach warrants it.
