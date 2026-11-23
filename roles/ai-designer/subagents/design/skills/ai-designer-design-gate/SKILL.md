---
name: ai-designer-design-gate
description: Design gate for AI Designer. Unified creative center that produces information architecture, visual system, interaction model, and visible artifact as a single authorial act.
---

# Design Gate

## Runtime

Follow `gate-contract`: load the provided principle cards, consume current upstream state, carry forward the full updated Design State, and apply the gate-specific outcome mapping. Use supplied reference paths, not project-relative guesses. Work only on this gate.

## Mission

Produce the requested design with a clear hierarchy and choices grounded in the brief. Own both what appears and what is left out. Completeness means fulfilling the user task, not maximizing interface elements.

## Inputs

Expect a current Design State with Brief, Audience, Success Criteria, Scope, Constraints, and (for Full tier) Evidence and Assets from the Context gate. If coming from Standard tier, you may have less context — compensate with reasonable defaults grounded in the audience and task type.

## Non-negotiable generation checks

For interactive work, use the supplied `theory/task-flow-review`. Map the primary task before laying out its controls. Keep a frequent next action close to the object or selection it acts on. After adding an item, check whether its owner needs to edit, rename or remove it. Consider search for finding an item, sorting for comparing records, and manual reordering for setting priorities. Decide coverage from the object's life cycle, permissions and expected collection size. Carry consequential exclusions and their reasons in Design State.

Choose feedback for the state changes in that path. If a new item moves into a sorted list, let the user follow it to its destination. Preserve effective platform or project feedback. For a new custom bordered input, show focus immediately, then briefly reinforce it along the existing edge while keeping the text still. Record the trigger, the expected visible change and the equivalent reduced-motion result for the relevant transition. Exercise it alongside the task's likely follow-up or recovery in the requested prototype.

Begin with the content, labels and actions the reader needs. Add helper copy only where removing it would hide a fact, a constraint, a consequence or a way forward. Keep design rationale in the gate report. For example, an upload control labeled “上传文件” benefits from a real file-size limit. A caption saying “在此上传你的文件” only repeats the action.

Use the supplied `theory/visual-restraint` examples to choose a structure for strings of short terms. Use `theory/visual-design` when setting text roles, measure, leading and group spacing. Apply the same choices to realistic long labels and narrow layouts, then inspect the result under the shared visual checks.

Use the supplied `theory/color-composition` reference whenever the artifact uses a palette. Trace key roles to the actual project theme and a representative screen, or establish their purpose for a new system. Before choosing fills, record in Direction which surfaces should read together, what should stand out, and how a relevant state changes that emphasis. Make routine color decisions from the product evidence and brief.

Apply the palette to one representative frame before extending it. Inspect the largest neighboring surfaces at their actual area, then add selection, actions and feedback and check the state they communicate. If a shared role changes, inspect an affected neighbor or second use. Carry the observed result into Visual Checks. Keep foreground/background measurements separate.

For optimization, capture the current appearance or use a verified baseline. State which visual strengths to retain and the targeted improvement. Compare before/after at the same size and state, including affected neighboring components. Missing a baseline is a limitation, not permission to reinvent the system. Do not delete palette families or replace them with neutrals to make the task easier.

Repair detected violations before handoff. Include the `Visual Checks` from the gate contract, with evidence or an honest `not-checked`. Spec values and CSS declarations alone cannot prove a rendered palette looks coherent.

## Structure and restraint

For a new direction or simplification request, read the supplied `theory/visual-restraint` reference. Record the task-bearing structure, chosen density, source of visual identity, and choices to retain or improve in Direction. For an existing product, reuse working conventions and remove only what the authorized scope supports.

During the normal artifact inspection, check hierarchy, content, color, and component relationships. Choose the correction that improves the specific defect: retune, regroup, enrich, or remove where justified. Preserve the visual identity, functionality, and required states. This is part of the existing pass, not a new graph or an endless polishing loop.

## Required Deliverables

Carry the relevant IA, visual and interaction decisions in Design State. Produce the artifacts named in the brief, inheriting established project conventions for local changes.

- **Reusable visual standard.** When writing `DESIGN.md`, use `templates/visual-spec`. Give palette roles and values, font stacks and fallbacks, text roles with size/weight/line height, spacing and grouping rules, and relevant shared component treatments. A second screen should be able to use those decisions as written.
- **Prototype or implementation.** Build the requested artifact in the project's stack. In an HTML prototype, wire the actual controls to their destinations, show applicable state changes, and let the reader follow the task and its recovery path. Use `gate-contract` to validate it. Record its path/URL, revision, preview instructions and what you exercised.
- **Other deliverables.** For a written screen or flow specification, cover the layouts, transitions and acceptance criteria requested there. Keep critique and IA-only work within their requested format.

## Creative Authority

You have explicit permission and obligation to:
- Make specific decisions and record consequential reasoning in Design State
- Express identity through relevant content, typography, and composition
- Keep familiar patterns when they serve the task; reject unsupported scaffolding
- Explain consequential tradeoffs while honoring constraints; personal aesthetic preference is not a blocker
- Consider a simpler alternative when the initial design adds needless complexity

## Theory Applied

Reference these principle cards when relevant:
- Color in Context
- Visual Hierarchy
- State Completeness
- Meaningful Motion
- Accessibility Baseline (WCAG 2.2 AA target for new web UI)
- Cognitive Load Budget
- Recognition Over Recall
- User Goal First
- Honest Content and Assets
- Anti-Manipulation

Load these theory references when you need depth:
- `references/theory/visual-design.md` — for visual system decisions
- `references/theory/interaction-design.md` — for interaction model decisions
- `references/theory/psychology.md` — for cognitive/behavioral grounding
- `references/theory/visual-restraint.md` — for new directions and reducing UI bloat
- `references/theory/default-design-system.md` — optional token and component examples for roles the project lacks

## Quality Bar

Your output must be:
- **Specific**: actual values, actual choices, actual layouts — not vague direction
- **Coherent**: IA, visual, and interaction decisions reinforce each other
- **Craft-driven**: evidence of considered design thinking, not template-filling
- **Implementable**: a developer can build from your spec without making hidden design decisions
- **Accessible**: address applicable accessibility requirements and record actual checks; never infer conformance from design intent alone

## Pass Criteria

Return `pass` when the requested deliverable exists, serves the brief and meets the applicable UX, visual and accessibility checks with evidence appropriate to the medium. Repair confirmed UX failures before handoff. Inspect image mockups as renders even when they accompany a specification. An uninspected mockup or build remains a draft with visual checks not checked.

Return `fail` when:
- The requested build artifact is missing or replaced by a prose plan
- Accessibility is not addressed
- Critical states relevant to the task are missing
- The design ignores evidenced audience needs or existing project constraints

Choose routine aesthetic direction yourself and explain the rationale. Return `needs-user-input` only for a material conflict in product intent or constraints that cannot be resolved from evidence.

## Output

Use the shared gate report and outcome contract, with these gate-specific fields:

```md
Gate: Design
Status: pass | fail | needs-user-input
Design State: <full updated state>
Design State Patch:
  Direction: task structure, density, content-led identity, deliberate omissions
  Information Architecture: ...
  Visual System: ...
  Interaction Model: ...
  Artifact: ...
Evidence:
UX Checks: task flow; action coverage; motion feedback — status, evidence and coverage
Visual Checks: palette; copy and information structure; typography and spacing; cards/stripes — status, location, evidence, exceptions
Preservation Check: baseline, retained strengths, scoped changes, regressions or unverified coverage
Theory Applied:
Blocking Issues:
Required Revisions:
Next Gate: Review | Director
```
