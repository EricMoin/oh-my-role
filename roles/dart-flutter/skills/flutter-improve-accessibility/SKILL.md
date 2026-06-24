---
name: flutter-improve-accessibility
description: Improve Flutter accessibility for semantics, screen readers, keyboard/focus navigation, text scaling, contrast, touch targets, forms, error recovery, and adaptive input. Use when building or reviewing UI, forms, navigation, custom widgets, or accessibility bugs.
---
# Improving Flutter Accessibility

## Workflow

- [ ] Identify the primary user task and controls.
- [ ] Verify accessible names for all meaningful controls.
- [ ] Check focus order, keyboard activation, and escape/back behavior.
- [ ] Test text scaling and maximum content.
- [ ] Ensure errors are associated with fields or actions and explain recovery.
- [ ] Avoid communicating state by color alone.
- [ ] Add widget tests for semantics or focus behavior when practical.

## Flutter Techniques

- Use visible `Text`, `Tooltip`, labels, or `Semantics(label: ...)` for icon-only controls.
- Use `MergeSemantics` or `ExcludeSemantics` when custom composition confuses screen readers.
- Use `FocusTraversalGroup`, `Shortcuts`, and `Actions` for keyboard-heavy flows.
- Respect `MediaQuery.textScalerOf(context)` by allowing flexible layout and wrapping.
- Keep touch targets large enough for repeated use.

## Example

```dart
Semantics(
  button: true,
  label: 'Delete invoice',
  child: IconButton(
    icon: const Icon(Icons.delete),
    tooltip: 'Delete invoice',
    onPressed: onDelete,
  ),
)
```
