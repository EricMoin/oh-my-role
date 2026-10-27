# Compose UI and Accessibility Review Map

The implementation source of truth is
[compose-layout-material-adaptive](../skills/compose-layout-material-adaptive/SKILL.md).
It covers constraints, modifier order, lazy identity, Material themes, insets, adaptive state,
semantics, form recovery and focus. Avoid a second set of API examples here.

Select the dimensions relevant to the changed behavior:

| Surface | Review question |
| --- | --- |
| Constraints and scrolling | Does content remain reachable without unbounded same-axis measurement? |
| Modifiers and touch | Do visual bounds, clipping and actual hit regions match the intended action? |
| Insets and IME | Is content padding applied/consumed once and is focused input reachable? |
| Resize and posture | Are panes usable and state preserved through the actual branch change? |
| Theme | Are component families and semantic colors consistent in supported themes? |
| Semantics | Are meaningful labels/actions/state exposed without duplicate announcements? |
| Focus | Do keyboard traversal and accessibility traversal each follow usable order? |
| Text and forms | Do scaling, long text, RTL, validation and recovery remain usable? |

Prefer standard controls. Decorative imagery can have no description, visible text can
already label a control, and merged groups can be appropriate. Inspect the resulting tree
instead of requiring a contentDescription or custom role on every node.

Use previews or UI assertions for what they can establish. Check actual TalkBack, keyboard,
IME and device behavior when the acceptance claim requires it. Report untested dimensions
as unverified rather than inferring them from a screenshot.

For implementation examples, follow the skill's
[layout/theme recipes](../skills/compose-layout-material-adaptive/references/layout-recipes.md)
and [accessibility/form recipes](../skills/compose-layout-material-adaptive/references/accessibility-recipes.md).
These retain concrete patterns in one location; this review map does not replace them.
