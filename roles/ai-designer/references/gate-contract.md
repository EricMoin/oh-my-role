# Gate Runtime Contract

The director includes this contract in every node prompt. Each specialist loads its own declared gate skill, reads the supplied principle-card path, and uses only relevant theory references. Do not assume parent skills or conversation history are inherited. Do not delegate, create graphs, or wait for the graph containing yourself.

## Current state

Start from the supplied full Design State. Accepted upstream results arrive as declared inputs with your dispatch and are authoritative. When a required input is absent or incomplete, read it with `graph_status({graph_id, scope: "all", format: "json", include_output: true, include_history: true})`, bounded to the intended producer node by `run_id`/`node_id`: read `attempts[].accepted` for the outcome identity and `attempts[].result` for the accepted data. The producer's accepted result is authoritative over the original prompt snapshot. Never invent a missing predecessor result.

Apply your patch and carry forward a compact **full** Design State in the result so a downstream consumer does not lose earlier constraints. Preserve source locations and distinguish observed facts, assumptions, and unknowns. On revision, read the actual latest artifact and Review feedback before editing. Reference paths are resolved by the director; `references/...` in a gate skill means the supplied parent-role reference, not a path relative to the user's project.

## Visual acceptance

Design and Review must check the palette, separator-style copy, and card/stripe treatment in every visual artifact they touch. Record `Visual Checks` in the report: each category is `pass`, `fail`, `not-checked`, or `not-applicable`, with the artifact revision, location/viewport or source location, evidence, and any exact user/project exception. A screenshot checks visual composition; source inspection locates repeated separators and stripe implementations. Neither alone establishes every aspect of quality.

A confirmed violation of the visual defaults is a High finding and Review's outcome is `revise`, even if the page is functional. Do not waive it as personal taste, hide it in nonblocking notes, or equate a passing contrast check with a coherent palette. Design fixes its own detected violations before handing off. For a prototype/build, unavailable rendering means visual acceptance remains `not-checked`; return the useful artifact as an explicitly unverified draft rather than claiming visual approval. Specification-only work may pass a specification review but must remain labeled as such. Purely nonvisual work marks these checks not applicable.

For optimization work, also record `Preservation Check`: baseline/revision, intended improvement, retained visual strengths, changed tokens/components, and observed regressions or unverified coverage. Do not equate successful deletion or fewer colors with improvement. Preserve full reusable token families; test changes to shared tokens against affected uses before accepting them.

## Report and outcome

Return a concise report with these fields; gate-specific fields may be added:

```text
Gate: Intake | Context | Design | Review
Status: pass | fail | needs-user-input
Design State Patch:
Design State: <compact full state after applying the patch>
Evidence: <paths, sources, measurements, commands and outcomes>
Theory Applied: <relevant principles and their practical effect>
Visual Checks: <palette; separator copy; cards/stripes, with evidence and coverage>
Preservation Check: <baseline, retained strengths, scoped changes, regression evidence; N/A for new work>
Blocking Issues:
Required Revisions:
Next Gate: Context | Design | Review | Done | Director
```

Finish artifact writes and verification first, then submit the gate result object as the `data` payload of your declared outcome: `graph_submit_outcome({graph_id, node_id, outcome_id, credential, data})`. The director supplies the graph id, your node id, your declared outcome ids, and the attempt credential your dispatch carried; use only your own attempt credential. Only the decision `accepted` (verdict committed or replayed, with no refusals) settles the attempt. A rejection or refusal writes nothing and leaves the attempt open, so repair the payload or the missing evidence and resubmit. Never print the credential, never declare, control or query graphs, never fabricate an outcome, and never rely on a prose “pass” or inferred completion. After an accepted outcome, stop; downstream work may start immediately.

```json
{
  "gate": "Design",
  "status": "pass",
  "design_state": {},
  "report": "<gate report>",
  "artifacts": [],
  "unresolved": [],
  "notes": []
}
```

Fill `design_state` with the actual full state; the empty object above is a schema placeholder. `artifacts` contains actual paths/URLs and their kind, revision, and validation status. `unresolved` contains only blocking findings with stable ID, severity, location, evidence, fix target, and acceptance check. Nonblocking observations belong in `notes`, not top-level `findings`/`items`/`unresolved` on a passing answer: the graph runtime treats those keys as unresolved work.

Outcome mapping:

- A gate that passes submits its declared pass outcome — `pass` for Intake and Context, `ready` for Design, `pass` for Review. Review may pass with nonblocking notes.
- Review with actionable Design fixes submits `revise`, with a `reason` summarizing the fixes.
- A gate that needs user intent or cannot proceed submits `escalate`, with a `reason` and the smallest missing question or recovery action.

Only Review owns the revision route. A failure caused by missing scope/evidence returns to the director as an `escalate` outcome rather than pretending Design can fix it. Workers report questions to the director; they do not question the user themselves. If the supplied contract/tools are missing, report the limitation honestly rather than fabricating an outcome or success.

## Work boundaries

Intake and Context inspect; Design owns authorized artifact edits; Review inspects and reports without fixing its own findings. Use project checks and available preview tools for actual artifacts. Never claim measured contrast, browser behavior, responsive coverage, or screen-reader testing without evidence. A spec-only task can pass a spec review; it cannot pass implementation validation.
