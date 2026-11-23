---
name: ai-designer-principle-cards
description: On-demand design constitution and executable principle cards for humane UI/UX gates. Full theory lives in references and is loaded only when a gate needs depth.
---

# Principle Cards

Load these cards explicitly for design work; listing a skill does not load its body. Apply relevant cards and briefly record their effect in `Theory Applied`. Load deeper theory only when needed, using runtime-provided reference paths or the director's resolved paths. Do not assume the role source tree is the current workspace.

## Design Constitution

- User goals outrank visual novelty.
- Accessibility is a baseline, not a feature.
- A design must make system status, consequences, and recovery paths visible.
- Do not manipulate users against their interest.
- Do not fabricate metrics, logos, testimonials, screenshots, or data.
- Use real content and assets when recognition matters.
- Show the choices and context needed for the current decision.
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

## Visual defaults that must survive routing

Use Interface Economy for generated copy and Visual Hierarchy for its placement. Replacing dots with spaces, breaks or pills leaves an unexplained string of words intact. Decide whether those words are needed and how they relate. No colored or dark left stripe on cards/callouts, including equivalent inset shadows or pseudo-elements. No automatic page-wide card grid. Apply Color in Context when choosing or assessing colors, including when all components already use design tokens. Respect explicit user and project requirements.

Verify palette, copy and information structure, typography and spacing, and cards/stripes on the current artifact. Record evidence or unavailable coverage in the handoff. These checks apply to direct Quick work and specialist gates.

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

**Fix Patterns**: Semantic labels, visible focus, applicable contrast thresholds, measured checks, generous touch targets (44px preferred; WCAG 2.2 AA uses 24px or qualifying spacing/exceptions), non-color indicators, reduced motion.

Follow the project's accessible focus treatment for comparable controls. For a bordered text field, give the existing border more weight on focus, keeping the field and its text in place. An invalid field gets the error color on that border and a message beside it. When the user tabs back, add the focus weight. Keep the error cues until validation succeeds and the focus weight until focus moves. If focus is hard to locate, strengthen the cue and try the keyboard path again.

**Reference**: core-principles.md, interaction-design.md (Focus State), default-design-system.md.

### Cognitive Load Budget

**Use When**: Dense dashboards, onboarding, settings, workflows, AI tools.

**Violation Signs**: Too many equal choices, scattered controls, large unchunked forms, decorative explanations.

**Gate Question**: Is the user making only the decisions that matter now?

**Fix Patterns**: Chunking, progressive disclosure, defaults, grouping by proximity, reduce simultaneous choices.

**Reference**: psychology.md; visual-design.md.

### Preserve and Improve

**Use When**: Refining an existing design or design system.

**Violation Signs**: A local correction replaces the palette, flattens rich surfaces, removes working hierarchy, or deletes reusable tokens without a task-specific reason.

**Gate Question**: What improved, and which existing visual strengths remain demonstrably intact?

**Fix Patterns**: Capture the current composition, identify the defective application, correct the smallest responsible role/component, and compare the same states afterward. Retain, retune, add, reorganize, or remove according to the defect; fewer elements or hues is not a success metric.

**Reference**: default-design-system.md; visual-restraint.md.

### Color in Context

**Use When**: Creating, applying or reviewing a palette, from one component in its surrounding surface to a new theme.

**Violation Signs**: Related surfaces look like separate workspaces. A repeated tint changes the apparent importance of a group. Selection or status styling contradicts what the content says.

**Gate Question**: Which areas read together, what draws attention, and does the apparent state match the actual one?

**Fix Patterns**: Trace the affected semantic role to its source. Adjust the relationship visible on a representative frame and recheck it with the neighboring surface or relevant state.

**Reference**: `theory/color-composition`.

### Interface Economy

**Use When**: New surfaces, redesigns, or UI that feels bloated.

**Violation Signs**: The work is buried beneath a generic shell; repeated summaries and containers consume attention without helping a decision.

**Gate Question**: If this line disappeared, what would someone lose when identifying the content, making a decision, or taking the next step?

**Fix Patterns**: Put the object or action first. Drop a repeated heading explanation. Keep a file-size limit beside the file picker and a recovery instruction beside a failed upload. Put design rationale in the handoff.

**Reference**: `theory/visual-restraint`.

### Contextual Identity

**Use When**: Choosing or reviewing a visual direction.

**Violation Signs**: Swapping the product name leaves a plausible page for any unrelated product; novelty comes entirely from surface effects.

**Gate Question**: Which visible choice follows from this content, audience, or brand?

**Fix Patterns**: Let real material and content shape composition; make the surrounding interface support it. A quiet interface can be the right authored choice. Do not mandate eccentricity, asymmetry, or a replacement template.

**Reference**: visual-restraint.md; visual-design.md.

### Visual Hierarchy

**Use When**: Every visual layout.

**Violation Signs**: Everything has equal emphasis; primary action is not obvious; whitespace does not group meaning.

**Gate Question**: Can a reader find the heading, its content and the next group when a long label wraps?

**Fix Patterns**: Reuse a named type role for each repeated job. Align comparable text on one edge. Make the gap within a group smaller than the gap between groups. Recheck the reading order with actual content at the narrow layout and with enlarged text.

**Reference**: `theory/visual-design`.

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

**Fix Patterns**: Transform/opacity animations, short durations, spatial continuity, immediate focus feedback, reduced-motion fallback.

**Reference**: interaction-design.md; default-design-system.md.

### Anti-Manipulation

**Use When**: Subscription, privacy, consent, checkout, deletion, onboarding, notification prompts.

**Violation Signs**: Confirmshaming, hidden unsubscribe, fake urgency, trick questions, forced continuity.

**Gate Question**: Does this pattern help the user make an informed choice?

**Fix Patterns**: Symmetric choices, transparent costs, clear consent, easy opt-out, plain copy.

**Reference**: anti-patterns.md.
