# Specialist handoffs

Use these field names for structured graph reports. Inline reviews may use prose. Keep artifact paths relative to the project or identify the run directory. Only include user data strictly necessary to establish the observation.

## Brief from the lead

- **Goal and invariant.** For behavior, give the initial state, trigger and expected outcome. For an architecture review, state the boundary clients rely on or the concrete change whose maintenance cost is in question.
- **Snapshot.** Identify the commit plus local diff, fixture, build or archive being reviewed. Include the scheme, target, configuration, Swift settings and destination when relevant.
- **Question and scope.** Assign one material risk. Name readable files, allowed operations, available evidence and any missing capability. For device work, name the destination and the state the worker can change. Supply the ordered journey, expected results and evidence location.
- **Resources.** Workers discover the role's shared references and their own gate skills. If a decision needs material from a lead skill, pass the resolved file path or its relevant evidence in the brief. For example, a release reviewer can use the [signed extension inspection](../skills/ios-delivery-privacy/references/signed-extension.md) for a specific App Group claim. Include the affected bundles and artifact paths. A skill name alone does not convey the lead's reference contents.
- **Upstream inputs.** Identify reports supplied through the graph. An absent result is an evidence gap. Production code and test edits belong to the lead.

## Review outcome data

| Field | Contents |
| --- | --- |
| `schema_version` | Integer `1`. |
| `scope`, `snapshot` | Assigned question and exact revision or artifact. |
| `evidence` | Observations with a retrievable location such as file and symbol, SDK document, result bundle and test, trace interval or archive path. An architecture review can record a nonblocking simplification here with the current cost and the contract a simpler design would preserve. |
| `verification` | Checks performed and their observed results. Name any checks skipped and the reason. |
| `findings` | For each required repair include a stable ID, triggering condition, expected and observed result, evidence, and the outcome a repair must achieve. For a structural finding the trigger can be a real client import or feature edit, and the result can be a dependency or a change that must be repeated. Can be empty. |
| `limitations` | Required evidence still missing, effect on the conclusion and the narrowest way to obtain it. Can be empty. |

Choose `pass` when the evidence answers the assigned question and no blocking defect remains in that scope. Choose `revise` for a demonstrated failure requiring a change, including violation of a dependency contract or a maintenance cost the brief explicitly asks to remove. Choose `escalate` when a missing prerequisite prevents a material conclusion. Preserve observed defects and remaining limits together where both apply. Submit via the host's declared outcome with the data above.

For a **device review**, append `destination` (model, OS and Simulator or physical), `build`, and `steps` (action, expectation, observation, evidence). Mark an unexecuted step as such. For a **performance review**, name the metric, units, workload, baseline, candidate and run variability or the evidence gap.

## Source outcome data

The source tracer returns `report` with `schema_version: 1`, `question`, `versions`, `finding`, `sources` and `limitations`. Give the symbol and location, revision or availability range for each source. Identify what is documented, inferred or observed and how it changes the engineering decision. An inconclusive investigation can return a source report with the precise gap.
