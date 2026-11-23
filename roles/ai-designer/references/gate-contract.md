# Design Gate Contract

Each specialist loads its declared gate skill, reads the supplied principle-card path, and uses the relevant design references. This contract defines Design State transport, evidence, and visual acceptance.

## Current state

Start from the supplied full Design State and the delivered upstream result manifest. Prefer the latest delivered state over the original prompt snapshot, and verify producer claims against the cited evidence. When a required input is absent or incomplete, return `escalate` with the missing evidence and the smallest recovery action. Never invent a missing predecessor result.

Apply your patch and carry forward a compact **full** Design State in the result so a downstream consumer does not lose earlier constraints. Preserve source locations and distinguish observed facts, assumptions, and unknowns. On revision, read the actual latest artifact and Review feedback before editing. Reference paths are resolved by the director; `references/...` in a gate skill means the supplied parent-role reference, not a path relative to the user's project.

## Visual acceptance

Record four `Visual Checks` for the current revision. Give each a status (`pass`, `fail`, `not-checked`, or `not-applicable`), a location or viewport, and a brief observation. Cite the exact user or project requirement for any exception.

- **Palette.** Cite the project palette source or the basis of the new direction. Name the neighboring surfaces or states inspected and describe the grouping, emphasis or state actually visible. For image-only work, identify unknown token provenance. Record contrast measurements as readability evidence.
- **Copy and information structure.** Name a representative heading, text group or control and the job its wording does. Try reading the section without its explanatory line. If the same information and action remain clear, omit that line. Preserve required copy, accessible names, instructions that prevent mistakes and feedback that guides recovery. Check runs of short terms even when separated only by spaces. An adjective list can disappear entirely. Independent actions need distinct controls, and comparable facts need identifiable fields. Judge the resulting meaning and grouping on the frame.
- **Typography and spacing.** Inspect real text in a representative section. Identify the reading order, compare the gap within a related group with the gap to the next, and inspect body measure, leading and wrapping for the actual script. For responsive designs check narrow and wide layouts. Cite a visible result, such as whether a wrapped label still sits closer to its value than to the next field. Use the supplied `theory/visual-design` examples to calibrate for content and density.
- **Cards/stripes.** Check the page structure and a representative container. When source is available, also inspect styling for equivalent decorative stripes.

A confirmed violation of the visual defaults is a High finding and Review's outcome is `revise`, even if the page is functional. Design fixes its own detected violations before handing off. Image mockups, including frames attached to a specification, qualify for rendered inspection. An unavailable render leaves visual acceptance `not-checked` and the mockup or build a draft. A text-only specification may pass a specification review of its role assignments and proposed relationships. Purely nonvisual work marks these checks not applicable.

For optimization work, also record `Preservation Check`: baseline/revision, intended improvement, retained visual strengths, changed tokens/components, and observed regressions or unverified coverage. Do not equate successful deletion or fewer colors with improvement. Preserve full reusable token families; test changes to shared tokens against affected uses before accepting them.

## UX acceptance

Design owns the working path. Review evaluates it independently on the current revision using `theory/task-flow-review`. Record three `UX Checks` with the same statuses as the visual checks. For each applicable check, give the concrete entry or state, what was tried and what happened.

- **Task flow.** Start where the actor ordinarily enters. Follow the main task and a likely next step or recovery. Check the distance in movement, scrolling, navigation or repeated selection between actions often performed together. Cite the specific extra work when their placement breaks the flow.
- **Action coverage.** For each task-critical object, check the operations the actor needs and the collection tools that match its scale. Locate and exercise the actual entries, including keyboard or touch access as applicable. Explain relevant omissions using scope, permissions or the object's lifecycle.
- **Motion feedback.** For the distinct state changes that matter on the path, check the cue each one needs. Replay a representative instance of each required behavior and observe its trigger, progression and final state in ordinary and reduced-motion modes. Where a rapid repeat or reversal is plausible, interrupt it and check that the latest action wins. A screenshot, an animation declaration, or an unrelated effect cannot establish that the required cue ran.

A blocked path, a missing necessary action, a recurring detour that loses task context, or missing required motion feedback is a blocking finding. Review submits `revise` with the failed step, user impact, fix target and observable retest. This includes a newly designed custom bordered field that merely changes color under ordinary motion, absent an evidenced project or platform requirement. For an existing component with suitable native behavior, test what it already does. For an expressly static brief, review the proposed path and state descriptions on their merits. For a build with unavailable execution evidence, record `not-checked` and use the existing draft/escalation path. Use `not-applicable` with a concrete reason for checks outside the brief.

## Deliverable acceptance

When `DESIGN.md` is requested, use the supplied `templates/visual-spec` example. Check that another screen could use its palette roles and values, type styles, spacing and grouping rules, and relevant shared component treatments, such as field border weights and validation colors. For a visual-spec-only task, review the document on its own. An explicitly requested written flow or screen spec follows its own brief.

In a requested HTML prototype, exercise the in-scope path from its entry control to its visible result. For a form with validation, trigger an error and use Tab or Shift+Tab to return to the invalid field. Check that the focused field is easy to locate, the error message is still visible, and the field and its text stay in place as the border changes. Correct the value and check that successful validation clears the error while the field retains its focus treatment if still active. Cite the controls and observed state changes in Evidence. A required control that leads nowhere needs revision. If tools cannot exercise a required path, report the missing interaction evidence to the director and keep the prototype a draft until that path is verified.

## Report and outcome

Return a concise report with these fields; gate-specific fields may be added:

```text
Gate: Intake | Context | Design | Review
Status: pass | fail | needs-user-input
Design State Patch:
Design State: <compact full state after applying the patch>
Evidence: <paths, sources, measurements, commands and outcomes>
Theory Applied: <relevant principles and their practical effect>
Visual Checks: <palette; copy and information structure; typography and spacing; cards/stripes, with evidence and coverage>
UX Checks: <task flow; action coverage; motion feedback, with evidence and coverage>
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
