# Read-only specialist review

Use Graph v3 when independent evidence can affect a concrete decision. The lead implements and repairs. Review nodes work on a stable snapshot, read the supplied evidence and settle their own outcomes. Each node receives its own brief from `schemas`. Ordinary development can run inline. On a host without graph execution, state which checks the lead performed directly.

## Choose a reviewer

| Question requiring independent evidence | Dispatch target |
| --- | --- |
| Does a Swift API preserve its callers' contract? Which boundary owns a write, keeps a dependency private, or forces repeated edits for the change under review? | `swift-developer--architecture-reviewer` |
| Is the changed action reachable through the applicable native layout, gesture and assistive input? | `swift-developer--ui-reviewer` |
| Can the proposed test pass with the original defect still present? | `swift-developer--test-reviewer` |
| Does the trace support the claimed improvement under comparable conditions? | `swift-developer--performance-reviewer` |
| Do the shipped app and its extensions have the intended capabilities and privacy declarations? | `swift-developer--release-reviewer` |
| Does this particular build complete the specified journey on the selected destination? | `swift-developer--device-verifier` |
| Which behavior is supported by the project's SDK or dependency revision? | `swift-developer--source-tracer` |

## Example

An app adopts a new observation API while supporting an older iOS release. The architecture reviewer needs the exact SDK availability and target settings before judging the fallback. Replace the example snapshot descriptions, names and artifact locations with project facts. Submit the object through `graph_declare({declaration})`.

```json
{
  "version": 3,
  "name": "ios-review-observation-r1",
  "budget": { "max_executions": 3 },
  "nodes": [
    {
      "id": "availability",
      "agent": "swift-developer--source-tracer",
      "prompt": "Inspect the supplied app target settings and SDK for the Observation integration used by the changed screen. Identify the exact symbol, deployment floor, introduced OS and the fallback that older devices can compile and run. Cite SDK or official documentation and the target setting, recording missing evidence. Keep the workspace read-only. Return the source report in schemas.",
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 240000 },
      "outcomes": [{ "id": "report" }]
    },
    {
      "id": "ownership",
      "agent": "swift-developer--architecture-reviewer",
      "prompt": "Review the supplied stable diff, its screen factory and callers. Use the accepted availability report to assess who owns the model on each supported OS. Trace editing and returning to the same screen. Cite code or the relevant check for a lost edit or duplicated owner. Report the assigned scope using schemas. Keep the workspace read-only.",
      "inputs": [{ "from": "availability", "outcome": "report" }],
      "join": { "strategy": "all" },
      "completion": { "mode": "explicit" },
      "budget": { "timeout_ms": 300000 },
      "outcomes": [{ "id": "pass" }, { "id": "revise" }, { "id": "escalate" }]
    }
  ],
  "edges": [{ "from": "availability", "to": "ownership", "outcome": "report" }]
}
```

## Dispatch and recovery

- Pick independent root nodes for unrelated questions. An edge schedules a consumer on a declared outcome. List the result in the consumer's `inputs` when it needs the producer's data. Use explicit completion, a positive timeout per node and a finite execution budget for the batch.
- Give each worker the paths and settings it needs, including local changes. Follow the resource handoff in `schemas` for any lead-only skill material. Keep reviewed files stable while the node runs. Reviewers inspect the supplied code, traces and results. Assign device interaction to one operator per destination. The device verifier may use that destination and its run directory for the stated journey.
- Inspect `start.kind` returned by `graph_declare`. Confirm a started or resumed run before treating it as dispatched. On refusal inspect the reported reason. Use `graph_audit` for store diagnostics and `graph_control` for diagnosed transient failures or superseded work. Consult the installed schemas for command arguments.
- On completion or blockage read `graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})`. Match accepted outcomes and results to the intended node and attempt. An escalated device check leaves a runtime claim open even when the graph completes.
- The lead adjudicates each finding, applies a supported repair and rechecks the affected path. A changed snapshot can receive a new, narrowly scoped review with prior finding IDs. For a repeated failure with the same inputs, isolate the missing evidence or revise the diagnosis before spending another attempt.
