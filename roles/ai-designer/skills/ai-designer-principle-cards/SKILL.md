---
name: ai-designer-principle-cards
description: Short, always-loaded design constitution and executable principle cards for humane UI/UX gates. Full theory lives in references and is loaded only when a gate needs depth.
---

# Principle Cards

Use these cards as the always-on theory layer. Gate specialists cite these cards in `Theory Applied`. Full theory lives in `roles/ai-designer/references/theory/` and the anti-pattern catalog lives in `roles/ai-designer/references/catalogs/`.

## Design Constitution

- User goals outrank visual novelty.
- Accessibility is a baseline, not a feature.
- A design must make system status, consequences, and recovery paths visible.
- Do not manipulate users against their interest.
- Do not fabricate metrics, logos, testimonials, screenshots, or data.
- Use real content and assets when recognition matters.
- Reduce cognitive load by showing options and context.
- Design every meaningful state, not only the happy path.
- Motion must communicate feedback, hierarchy, or spatial continuity.
- Aesthetic polish is valuable only when it reinforces clarity, trust, and usability.

## Card Format

```md
Principle:
Use When:
Violation Signs:
Gate Question:
Fix Patterns:
Reference:
```

## Core Cards

### User Goal First

**Use When**: Every task.

**Violation Signs**: The design emphasizes what the team wants to promote but buries the user's task; visual drama competes with the primary action.

**Gate Question**: Can a target user identify what to do next and why it matters?

**Fix Patterns**: Rewrite around user intent, remove secondary distractions, make the primary action and consequence explicit.

**Reference**: core-principles.md; research.md.

### Recognition Over Recall

**Use When**: Navigation, search, forms, onboarding, complex flows.

**Violation Signs**: Users must remember previous choices, hidden shortcuts, unlabeled icons, exact names, or off-screen constraints.

**Gate Question**: Is needed information visible at the moment of decision?

**Fix Patterns**: Labels, examples, recent items, autocomplete, summaries, breadcrumbs, inline constraints.

**Reference**: psychology.md; interaction-design.md.

### Visibility of System Status

**Use When**: Async work, navigation changes, saving, uploads, AI generation, background tasks.

**Violation Signs**: Clicks appear ignored, loading is invisible, completion is ambiguous, failure is silent.

**Gate Question**: Does the user know what happened, what is happening, and what to do if it fails?

**Fix Patterns**: Button loading states, progress, optimistic state with undo, inline success/failure, retry.

**Reference**: interaction-design.md.

### User Control and Freedom

**Use When**: Modals, destructive actions, multi-step flows, filters, edits, account settings.

**Violation Signs**: No escape route, back loses work, cancellation is hidden, destructive action is irreversible without warning.

**Gate Question**: Can the user leave, undo, correct, or recover without punishment?

**Fix Patterns**: Clear close/back, undo, save drafts, confirmation for irreversible actions, predictable navigation.

**Reference**: core-principles.md; interaction-design.md.

### Error Prevention and Recovery

**Use When**: Forms, payments, deletion, permissions, AI outputs, data import.

**Violation Signs**: Errors appear only after submit, messages blame the user, recovery path is vague.

**Gate Question**: Does the design prevent likely mistakes and explain how to fix unavoidable ones?

**Fix Patterns**: Inline validation, constraints near controls, constructive error copy, preserve user input, retry.

**Reference**: interaction-design.md; psychology.md.

### State Completeness

**Use When**: Every screen and component.

**Violation Signs**: Only ideal content is designed; no empty, loading, error, disabled, success, first-use, or maximum-content state.

**Gate Question**: Would the design still work with no data, slow data, bad data, too much data, and failed data?

**Fix Patterns**: State matrix per screen, content-shaped skeletons, empty-state action, inline errors, overflow and truncation rules.

**Reference**: interaction-design.md; anti-patterns.md.

### Accessibility Baseline

**Use When**: Every task.

**Violation Signs**: Color-only meaning, low contrast, missing focus, mouse-only interactions, text overflow under scaling.

**Gate Question**: Can keyboard, screen reader, low-vision, touch, and reduced-motion users complete the core task?

**Fix Patterns**: Semantic labels, visible focus, 4.5:1 text contrast, 44px targets, non-color indicators, reduced motion.

**Reference**: core-principles.md; default-design-system.md.

### Cognitive Load Budget

**Use When**: Dense dashboards, onboarding, settings, workflows, AI tools.

**Violation Signs**: Too many equal choices, scattered controls, large unchunked forms, decorative explanations.

**Gate Question**: Is the user making only the decisions that matter now?

**Fix Patterns**: Chunking, progressive disclosure, defaults, grouping by proximity, reduce simultaneous choices.

**Reference**: psychology.md; visual-design.md.

### Visual Hierarchy

**Use When**: Every visual layout.

**Violation Signs**: Everything has equal emphasis; primary action is not obvious; whitespace does not group meaning.

**Gate Question**: What does the eye see first, second, and third?

**Fix Patterns**: Size, contrast, placement, whitespace, alignment, one primary focal point.

**Reference**: visual-design.md.

### Honest Content and Assets

**Use When**: Brand, marketing, dashboards, product previews, testimonials, metrics.

**Violation Signs**: Fake stats, fake logos, placeholder names presented as real, generic stock standing in for the product.

**Gate Question**: Would this still be true if a user inspected it closely?

**Fix Patterns**: Use real assets, label placeholders, omit missing proof, request content, use neutral sample data only when clearly marked.

**Reference**: research.md; anti-patterns.md.

### Meaningful Motion

**Use When**: Transitions, feedback, storytelling, onboarding, interactive controls.

**Violation Signs**: Decorative movement, scroll hijacking, repeated entrance animations, no reduced-motion path.

**Gate Question**: What information does this motion communicate?

**Fix Patterns**: Transform/opacity animations, short durations, spatial continuity, immediate focus rings, reduced-motion fallback.

**Reference**: interaction-design.md; default-design-system.md.

### Anti-Manipulation

**Use When**: Subscription, privacy, consent, checkout, deletion, onboarding, notification prompts.

**Violation Signs**: Confirmshaming, hidden unsubscribe, fake urgency, trick questions, forced continuity.

**Gate Question**: Does this pattern help the user make an informed choice?

**Fix Patterns**: Symmetric choices, transparent costs, clear consent, easy opt-out, plain copy.

**Reference**: anti-patterns.md.
