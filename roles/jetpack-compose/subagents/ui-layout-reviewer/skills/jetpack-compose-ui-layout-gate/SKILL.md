---
name: jetpack-compose-ui-layout-gate
description: Reviews Compose constraints, modifiers, adaptive state, theming, accessibility, focus and forms against the assigned UI risk and project requirements.
---
# Jetpack Compose UI Layout Gate

Review only the assigned UI/layout scope and snapshot. Load `references/schemas.md` for
reporting and `references/compose-ui-and-accessibility.md` for the review map and its
implementation source. Inspect the diff, callers and relevant design/platform requirements.
Use Context7 and resolved-version source research for uncertain API claims.

## Applicable checks

- Trace actual parent constraints and modifier order. Confirm reachable content and intended
  hit regions. `clickable().padding(...)` includes that padding in the clickable region;
  `padding(...).clickable()` puts it outside. Do not infer correctness from a universal chain.
- Check bounded scrolling and item identity where insertion/reordering can move item state.
  Stable unique keys support identity; they are not a general recomposition guarantee.
- Check screen/window policy and local component sizing at the dimensions required by the
  task. Verify state through branch changes. `BoxWithConstraints` is valid for local sizing;
  merely using a window-size API or `weight` does not prove usability.
- Follow the project's theme/component conventions. Flag token bypasses only when they
  cause a concrete requirement failure. Dynamic color is a product choice; when used,
  verify dark/light selection, API 31 guard and fallback against the actual implementation.
- Inspect effective semantics. Standard controls and visible text may already provide
  correct labels and actions. Decorative imagery need not have descriptions. Avoid duplicate
  labels, hidden independent actions, and semantics-only actions with no touch/keyboard path.
- Check actual touch targets and overlap against Android's 48 dp guidance. Prefer an
  appropriate standard control; do not mandate a manually sized clickable box.
- Check keyboard/DPAD focus and accessibility traversal separately. Verify any custom
  `FocusRequester`/`focusProperties` path and focus timing.
- Check input preservation, understandable validation/recovery, and relevant announcements.
  `isError`, supporting text and error semantics may suffice; not every error needs an
  assertive live region. Use the real `LiveRegionMode` API if a live region is appropriate.
- Check affected font scaling, long text, RTL, contrast and non-color cues. A hard-coded
  `sp` token does not inherently disable scaling; inspect how it is used and converted.

Choose evidence appropriate to the claim: source inspection, relevant previews/UI tests,
inspected semantics, and actual device behavior when necessary. Do not claim a TalkBack or
scanner pass from source alone, require an unrelated full device matrix, or invent outputs.
Missing evidence is blocking only when essential to the assigned acceptance.

## Report and judgment

Stay read-only. Use the gate report in `references/schemas.md`, including `schema_version: 1`,
`outcome_id`, `gate: ui-layout`, `status`, `reviewed_snapshot`, `evidence` and `verification`.
Concrete blockers need stable issue IDs, file:line or observed evidence, the user-visible
failure and required revisions. Preferences belong in advisory notes.

Settle `pass` for supported acceptance with no blockers (`status: pass`), `revise` for
concrete correctable failures (`status: fail`), and `escalate` when essential evidence or
user intent is unavailable (`status: needs-user-input`). Never fabricate a pass. Follow
`references/graph-protocol.md` for submission. The lead owns integration and escalation;
do not change files or expand into another gate's domain.
