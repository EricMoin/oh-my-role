---
name: frontend-design
description: Taste-driven frontend design for React + Tailwind v4 interfaces, aimed at producing UI with a real point of view instead of a template. Use when building landing pages, hero sections, marketing UI, or any screen that should feel distinctive, and when choosing palette, typography, layout, or motion for a design that needs a deliberate aesthetic direction. Guides the choices that make design read as authored, from the opening thesis to grounding in the subject, intentional type pairing, structural devices that encode meaning, one orchestrated motion moment, and complexity matched to vision. Don't use for pure logic or state work, backend code, data-layer changes, or when a strict design system or brand guideline is already mandated; follow that system instead.
allowed-tools: Read, Grep, Glob
---

# Frontend Design

A skill for giving React + Tailwind v4 interfaces a point of view. The goal is not decoration: it is to make the page say something true about its subject, so the output reads as designed by a person rather than assembled by a model.

Companion skills:

- `tailwindcss`: design tokens, utilities, and responsive patterns. Use it for every class decision; this skill decides which choices deserve to exist.
- `ai-designer` role: the review gate adds accessibility and human-factors checks for higher-stakes design work.

For the full catalog of what makes UI read as AI-generated, and what to do instead, see `references/anti-slop.md`.

## Design as a thesis

The hero is a claim, not a header. Open with the most characteristic thing in the subject's world: the actual artifact, a genuine metric, a real customer quote, the object itself. Avoid the templated "big number + gradient accent" answer unless the number genuinely is the story.

If the page cannot state its thesis in one sentence, the design has nothing to say yet. Write that sentence before writing any JSX.

Examples: a data tool opens with its own interface, not a slogan. A roastery opens with the bean, not "Great Coffee, Delivered." A legal-tech product can look like a contract.

## Ground it in the subject

Before choosing palette or type, pin three things:

1. The concrete subject: what this page is actually about.
2. The audience: who it is for and what they value.
3. The single job: what the page must accomplish.

Distinctive choices come from the subject's own materials and vernacular: its real artifacts, terms, textures, printed ephemera, tools. A ceramics studio can look like clay and kiln marks. A security product can look like an audit log.

If the design could be dropped onto any startup site unchanged, it is not grounded. Rework it.

## Typography carries personality

Type is the fastest way to establish voice. Choose a deliberate display/body pairing, an intentional scale, real weight contrast, and controlled measure and leading. A serif display over a neutral sans body says something different from two geometric sanses. Pick the pairing for a reason and use it consistently.

Type is not a neutral delivery vehicle for text. It is the texture of the page. If every heading is the same weight as every paragraph, the hierarchy is doing no work.

## Structure is information

Numbering, eyebrows, and dividers must encode something true: a sequence, a hierarchy, a relationship. They structure information; they do not decorate sections.

Question numbered markers (01/02/03) unless the content is genuinely sequential, like a process or a timeline. If sections have no inherent order, let the layout itself create hierarchy instead of stamping fake numbers on it. Use divider lines only where content genuinely changes kind.

## Motion, deliberately

One orchestrated moment beats scattered effects. Choose a page-load sequence (hero first, the rest follows), one scroll-reveal pattern, a handful of hover micro-interactions. Make them feel authored: timed, related, matched to the page's tone.

Too much animation signals AI generation. When every element animates in, the effect is noise, not craft. Motion should carry meaning: entrance order is reading order, hover states are affordances.

## Match complexity to vision

Decide the ambition level first, then execute to that bar.

- Maximalist design needs elaborate execution: real detail, layered texture, dense but organized content.
- Minimal design needs precision: exact spacing, a disciplined type scale, perfect alignment, small deliberate details.

The failure modes are maximalist that is just clutter, and minimal that is just empty. Both fail the same way: the execution did not match the ambition.

## Validation Checklist

Before finishing any design task:

- [ ] Took one justifiable aesthetic risk
- [ ] No templated hero unless justified
- [ ] Type pairing is intentional (display/body, scale, weights)
- [ ] Structural devices (numbering, eyebrows, dividers) encode meaning
- [ ] Motion is orchestrated into one moment, not scattered
- [ ] Complexity matches the ambition: maximalist is detailed, minimal is precise
- [ ] Passes the anti-slop checklist in `references/anti-slop.md`
- [ ] Uses Tailwind design tokens (`bg-background`, `text-foreground`, ...) per the `tailwindcss` skill, not raw colors
