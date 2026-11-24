# Design Gate Contract

Each specialist loads its declared gate skill, reads the supplied principle-card path, and uses the relevant design references. This contract defines Design State transport, evidence, and acceptance of the requested deliverable.

## Current state

Start from the supplied full Design State and the delivered upstream result manifest. Prefer the latest delivered state over the original prompt snapshot, and verify producer claims against the cited evidence. When a required input is absent or incomplete, return `escalate` with the missing evidence and the smallest recovery action. Never invent a missing predecessor result.

Apply your patch and carry forward a compact **full** Design State in the result so a downstream consumer does not lose earlier constraints. Preserve source locations and distinguish observed facts, assumptions, and unknowns. On revision, read the actual latest artifact and Review feedback before editing. Reference paths are resolved by the director; `references/...` in a gate skill means the supplied parent-role reference, not a path relative to the user's project.

## Visual acceptance

Record four `Visual Checks` for the current revision. Give each a status (`pass`, `fail`, `not-checked`, or `not-applicable`), a location or viewport, and a brief observation. Cite the exact user or project requirement for any exception.

- **Palette.** Cite the project palette source or the basis of the new direction. Name the neighboring surfaces or states inspected and describe the grouping, emphasis or state actually visible. For image-only work, identify unknown token provenance. Record contrast measurements as readability evidence.
- **Copy and information structure.** Name a representative heading, text group or control and the job its wording does. Try reading the section without its explanatory line. If the same information and action remain clear, omit that line. Preserve required copy, accessible names, instructions that prevent mistakes and feedback that guides recovery. Check runs of short terms even when separated only by spaces. An adjective list can disappear entirely. Independent actions need distinct controls, and comparable facts need identifiable fields. Judge the resulting meaning and grouping on the frame.
- **Typography and spacing.** Inspect real text in a representative section. Identify the reading order, compare the gap within a related group with the gap to the next, and inspect body measure, leading and wrapping for the actual script. For responsive designs check narrow and wide layouts. Cite a visible result, such as whether a wrapped label still sits closer to its value than to the next field. Use the supplied `theory/visual-design` examples to calibrate for content and density.
- **Cards/stripes.** Check the page structure and a representative container. When source is available, also inspect styling for equivalent decorative stripes.

A confirmed violation of the visual defaults is a High finding and Review's outcome is `revise`, even if the page is functional. Design fixes its own detected violations before handing off. Inspect image mockups, including frames attached to a specification, as renders. An unavailable required render leaves visual acceptance `not-checked` and prevents delivery. A text-only specification may pass a specification review of its role assignments and proposed relationships. Purely nonvisual work marks these checks not applicable.

For optimization work, also record `Preservation Check`: baseline/revision, intended improvement, retained visual strengths, changed tokens/components, and observed regressions or unverified coverage. Do not equate successful deletion or fewer colors with improvement. Preserve full reusable token families; test changes to shared tokens against affected uses before accepting them.

## UX acceptance

Use `theory/task-flow-review` to follow the person's goal on the current revision. For a reading or comparison task, try making the intended decision from the information available together. For an interactive step, ask what the person knows before acting, what they expect to happen and what they can actually tell or do afterward. Let the brief, product conventions and observed behavior determine which questions deserve a closer look. Pursue a consequential mismatch even when the familiar checks below all pass.

- **Task flow.** Start where the actor ordinarily enters. Follow the main task and a likely next step or recovery. Check the distance in movement, scrolling, navigation or repeated selection between actions often performed together. Cite the specific extra work when their placement breaks the flow.
- **Action coverage.** For each task-critical object, check the operations the actor needs and the collection tools that match its scale. Locate and exercise the actual entries, including keyboard or touch access as applicable. Explain relevant omissions using scope, permissions or the object's lifecycle.
- **Feedback.** Check whether the result itself tells the actor what happened. Where they need another cue, judge its location, duration and prominence from where their attention will be and what they need to do next. Distinguish acknowledgment of input from completion or failure. For required motion feedback, replay the trigger, progression and settled state in ordinary and reduced-motion modes. Try interruption when repeated input is plausible.

Record the questions actually examined in `UX Checks`, using the visual-check statuses. For each, identify the state, the observation and its consequence for the task. If two plausible designs would affect the user differently, say which condition favors the chosen one. A sound result can pass with a brief observation.

Design fixes confirmed, in-scope defects in a requested build. A blocked path, an unreachable necessary action, a recurring detour that loses the user's place, or cues that lead to a materially wrong decision warrant revision. Review submits `revise` with the failed step, its impact, the fix target and an observable retest. Missing required motion feedback also warrants revision, including a new custom bordered field that only changes color under ordinary motion without an evidenced project or platform requirement. Test the existing cue when the project uses a suitable native component.

For a critique, documented product defects are findings in the requested report. Judge the report by its accuracy, evidence and coverage. For a static brief, assess what the proposed states and relationships communicate. Exercise builds within the authorized scope. Record a missing required observation as `not-checked` and escalate if it cannot be obtained. Use `not-applicable` when a check falls outside the brief and give the reason.

## Whole-deliverable review

On the first and every revised version, inspect the complete requested deliverable from the intended audience's starting point. Look at the full composition before zooming in on individual defects. What draws the eye first? Can the reader find the next decision? Do aligned edges, type, spacing, imagery and emphasis give related views a coherent rhythm? Compare the actual result with the brief and preserved strengths. For a local edit, the affected view and its related states set the boundary. For a multi-screen delivery, look at each requested screen and read them in sequence. In Evidence, identify the artifact revision and the concrete observations that support the judgment.

Finish the review even when the first defect is enough to warrant revision. Collect every confirmed in-scope defect, including small inconsistencies with a visible consequence. On repair, address the full set, inspect other uses of a changed treatment and repeat the review on the resulting artifact. For example, after restoring a missing action in a toolbar, read the whole screen at its requested widths. If the added action now crowds the title at the narrow width, the revision still needs work. Retest previous findings by ID and record the observed result before closing them.

Severity sets repair order. Any open in-scope defect or missing required check prevents delivery. An alternative that merely reflects the reviewer's taste needs no change. An explicit project constraint or a user change of scope defines what to evaluate. If a necessary fix falls outside the authorized edit scope, escalate the dependency.

## Deliverable acceptance

When `DESIGN.md` is requested, use the supplied `templates/visual-spec` example. Check that another screen could use its palette roles and values, type styles, spacing and grouping rules, and relevant shared component treatments, such as field border weights and validation colors. For a visual-spec-only task, review the document on its own. An explicitly requested written flow or screen spec follows its own brief.

In a requested HTML prototype, exercise the in-scope path from its entry control to its visible result. For a form with validation, trigger a reachable error and follow the recovery it offers. For a field-level error, return to the field using Tab or Shift+Tab. Check that the focused field is easy to locate, the error message is still visible, and the field and its text stay in place as the border changes. Correct the value and check that successful validation clears the error while the field retains its focus treatment if still active. Cite the controls and observed state changes in Evidence. A required control that leads nowhere needs revision. If tools cannot exercise a required path, escalate the missing interaction evidence to the director.

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
UX Checks: <task-specific questions, including task flow, action coverage and motion feedback where relevant, with status, evidence and impact>
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

Fill `design_state` with the actual full state. In `artifacts`, identify each path/URL, kind, revision and validation status. Track every open defect in the requested deliverable in `unresolved` with stable ID, severity, location, evidence, fix target, and acceptance check. Reserve `notes` for neutral context such as why a platform convention applies. Pending repairs and missing required evidence must stay visible until resolved.

Outcome mapping:

- Intake and Context submit `pass` when their inputs to the next gate are ready. Design submits `ready` after inspecting its artifact and fixing all known in-scope defects. Review submits `pass` only with an empty `unresolved`, closure evidence for prior findings, and a whole-deliverable review with all required checks on the exact revision being handed over.
- Review submits `revise` for any confirmed in-scope defect that Design can repair, with a `reason` summarizing the full set of fixes.
- A gate that needs user intent or cannot proceed submits `escalate`, with a `reason` and the smallest missing question or recovery action.

Only Review owns the revision route. A failure caused by missing scope/evidence returns to the director as an `escalate` outcome rather than pretending Design can fix it. Workers report questions to the director; they do not question the user themselves. If the supplied contract/tools are missing, report the limitation honestly rather than fabricating an outcome or success.

## Work boundaries

Intake and Context inspect; Design owns authorized artifact edits; Review inspects and reports without fixing its own findings. Use project checks and available preview tools for actual artifacts. Never claim measured contrast, browser behavior, responsive coverage, or screen-reader testing without evidence. A spec-only task can pass a spec review; it cannot pass implementation validation.
