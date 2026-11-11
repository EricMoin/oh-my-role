# Design Gate Contract

Each specialist loads its declared gate skill, reads the supplied principle-card path, and uses the relevant design references. This contract defines Design State transport, evidence, and visual acceptance.

## Current state

Start from the supplied full Design State and the delivered upstream result manifest. Prefer the latest delivered state over the original prompt snapshot, and verify producer claims against the cited evidence. When a required input is absent or incomplete, return `escalate` with the missing evidence and the smallest recovery action. Never invent a missing predecessor result.

Apply your patch and carry forward a compact **full** Design State in the result so a downstream consumer does not lose earlier constraints. Preserve source locations and distinguish observed facts, assumptions, and unknowns. On revision, read the actual latest artifact and Review feedback before editing. Reference paths are resolved by the director; `references/...` in a gate skill means the supplied parent-role reference, not a path relative to the user's project.

## Visual acceptance

Design and Review must check the palette, separator-style copy, and card/stripe treatment in every visual artifact they touch. Record `Visual Checks` in the report: each category is `pass`, `fail`, `not-checked`, or `not-applicable`, with the artifact revision, location/viewport or source location, evidence, and any exact user/project exception. A screenshot checks visual composition; source inspection locates repeated separators and stripe implementations. Neither alone establishes every aspect of quality.

For the palette entry, cite the project palette source or the basis of the new direction. Name the frame and the neighboring surfaces or states inspected. Describe the grouping, emphasis or state actually visible and how it fits the intended relationship. For an image-only critique, record any unknown token provenance and limit the claim to the visible evidence. Record contrast measurements as readability evidence.

A confirmed violation of the visual defaults is a High finding and Review's outcome is `revise`, even if the page is functional. Design fixes its own detected violations before handing off. Image mockups, including frames attached to a specification, qualify for rendered inspection. An unavailable render leaves visual acceptance `not-checked` and the mockup or build a draft. A text-only specification may pass a specification review of its role assignments and proposed relationships. Purely nonvisual work marks these checks not applicable.

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

Finish artifact writes and verification before returning this gate result:

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
