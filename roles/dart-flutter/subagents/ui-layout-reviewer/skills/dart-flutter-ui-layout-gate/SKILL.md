---
name: dart-flutter-ui-layout-gate
description: UI, layout, and accessibility gate for Dart-Flutter subagent. Reviews widgets, constraints, responsive/adaptive behavior, semantics, focus, text scaling, forms, and interaction states.
---
# Dart-Flutter UI/Layout Gate

## Mission

Confirm that the proposed UI behaves correctly across constraints, inputs, and accessibility modes.

## Required Checks

- Layout decisions use constraints, not device names.
- Scrollables, flex children, overlays, and forms have bounded constraints.
- Empty, loading, error, success, disabled, and maximum-content states are covered when relevant.
- Text scales without clipping critical content.
- Important controls have names, focus behavior, and reachable input paths.
- Color is not the only state signal.
- Navigation, gestures, and keyboard behavior match platform expectations.
- Widget tests or golden/screenshot tests are identified when useful.

## References

Use `roles/dart-flutter/references/ui-and-accessibility.md`, `platform-and-performance.md`, and `testing-and-quality.md` when relevant.

## Output

```md
Gate: UI/Layout/A11y
Status: pass | fail | needs-user-input
Engineering State Patch:
Evidence:
Blocking Issues:
Required Revisions:
Verification:
Next Gate:
```
