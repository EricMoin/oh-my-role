---
name: accessibility
description: Accessibility (a11y) discipline guide for React/TSX UI covering semantic HTML, keyboard navigation, focus management, accessible forms, ARIA, WCAG contrast, and automated/manual testing. Use when building interactive UI, forms, modals/dialogs, menus, custom widgets, or any component where keyboard navigation, screen-reader support, ARIA, focus management, or WCAG compliance matters; use when reviewing or auditing existing UI for accessibility issues, fixing a11y bugs, or adding skip links, live regions, focus traps, or accessible disclosure/menu patterns. Don't use for pure backend code, non-UI logic, API or data-layer work, or styling questions unrelated to accessibility.
allowed-tools: Read, Grep, Glob
---

# Accessibility (a11y) Developer Guide

Accessibility is a core quality bar, not a polish step: every interactive element must be reachable and operable by keyboard, understandable to screen readers, and legible at WCAG AA contrast. Treat a11y like type safety — it is checked as part of "done", not after.

## Quick Start

- **Concrete patterns**: ❌/✅ React/TSX snippets for buttons, dialogs, form fields, menus, visually-hidden text, and skip links in `references/patterns.md`
- **WAI-ARIA Authoring Practices**: follow the APG patterns for any composite widget — don't invent roles (https://www.w3.org/WAI/ARIA/apg/)
- **Related skills**:
  - `react` (react-patterns) → **Extend native element props**: wrappers that render a single native element must extend `React.ComponentProps<"…">` and spread `...props`, so callers keep `aria-*`, `data-*`, `disabled`, `onClick`, etc. — do not build bespoke passthrough lists
  - `tailwindcss` → focus-visible rings (`focus-visible:ring-2 focus-visible:ring-ring`) and design tokens (`text-foreground`, `bg-card`, `text-destructive`) that keep contrast themable

## Core Principles

### 1. Semantic HTML First

Use the native element that already carries the behavior and semantics before reaching for ARIA: `<button>` for actions, `<a href>` for navigation, `<nav>` for landmark navigation, `<label>` for field names, `<h1>`–`<h6>` for headings, `<main>` for the primary content region, `<ul>` for lists.

> **No ARIA is better than bad ARIA.** A `<div role="button">` with no keyboard handling is worse than a plain `<button>`.

Only build a custom widget (and its ARIA roles) when a native element genuinely cannot express the interaction — e.g. tabs, combobox, disclosure menus.

### 2. Keyboard Navigation

- Every interactive element is **reachable and operable by keyboard alone** (Tab to reach, Enter/Space to activate).
- Never remove the default focus indicator with `outline: none` — use Tailwind's `focus-visible:` variant instead (see `tailwindcss` skill) so focus rings appear only for keyboard users.
- Keep a **logical tab order**: `tabindex` should only ever be `0` or `-1` — positive values ("`tabindex=5`") break document order.
- **Escape dismisses** overlays: dialogs, popovers, menus, comboboxes.
- Composite widgets follow the **arrow-key pattern** (roving tabindex): one tab stop, arrow keys move among items (see `references/patterns.md` → menu).

### 3. Focus Management

- **On open**: move focus into a dialog (to the dialog container with `tabIndex={-1}`, or the first focusable element) so screen readers announce it.
- **While open**: trap focus inside — wrap Tab at the first/last focusable element (see `references/patterns.md` → dialog).
- **On close**: restore focus to the element that opened it.
- **On route change** (SPA): move focus to the new page's heading (an `<h1>` with `tabIndex={-1}`) so keyboard and screen-reader users don't lose their place.

### 4. Forms

- Every input has an associated `<label>` (use `htmlFor`/`id`, or wrap the input inside the `<label>`).
- **Errors are announced**: link the input to its error with `aria-describedby`, set `aria-invalid`, and render the message with `role="alert"` (inserted after interaction) or an `aria-live="polite"` region.
- **Required/invalid state is never color-only**: convey it with text plus `aria-required` and `aria-invalid` — never just a red border.
- Placeholder text is not a label — use `aria-labelledby`/`aria-describedby` instead.

### 5. ARIA When Needed

- Use roles, states, and properties only to fill gaps a native element can't express: `role="dialog"`, `aria-modal`, `aria-expanded`, `aria-haspopup`, `aria-controls`, `aria-live`, `aria-current`, `aria-pressed`.
- **Live regions** (`aria-live="polite"`) announce async updates — toasts, "saved" confirmations, fetch results. Prefer the `role="status"` / `role="alert"` shortcuts.
- Follow the **WAI-ARIA Authoring Practices** patterns; every widget needs an accessible name via `aria-label` or `aria-labelledby` (icon-only buttons must have one).
- Spread `aria-*` through component wrappers via the `react-patterns` **Extend native element props** pattern rather than re-declaring bespoke props.

### 6. Contrast & Motion

- **WCAG AA**: 4.5:1 for normal text, 3:1 for large text (≥18pt or 14pt bold) and UI-component boundaries/graphics.
- Prefer design tokens (`text-foreground`, `text-muted-foreground`, `bg-card`, … — see `tailwindcss` skill) so contrast is guaranteed by the theme; never hardcode near-gray text like `text-gray-400` for body copy.
- **Respect `prefers-reduced-motion`**: use the `motion-reduce:` variant or `@media (prefers-reduced-motion: reduce)` to disable non-essential animations, auto-scrolling, and autoplay.

### 7. Testing Accessibility

- **Automated**: run `jest-axe` (or `vitest-axe`) — `expect(await axe(container)).toHaveNoViolations()` — on every interactive component test.
- **By role**: query rendered UI with `getByRole("button", { name: /submit/i })` (React Testing Library). Role queries force the semantics that a11y depends on — ties into the testing guidance in the `react` (react-patterns) skill.
- **Manual pass** (do this before merging): Tab through the whole page and confirm visible focus, confirm Escape closes overlays, and do one screen-reader pass (VoiceOver/NVDA) over the main flows.

## Validation Checklist

Before finishing any task that touches UI:

- [ ] Semantic elements used instead of `div` + ARIA where a native element exists
- [ ] All interactive elements keyboard-reachable and keyboard-operable
- [ ] Visible focus indicators (`focus-visible:ring-*`, never `outline: none` without a replacement)
- [ ] Every input has an associated `<label>`
- [ ] Form errors announced (`aria-describedby` + `role="alert"`/`aria-live`) and `aria-invalid` set
- [ ] Required/invalid state not conveyed by color alone
- [ ] Dialogs: focus moved in, trapped, and restored on close; Escape dismisses
- [ ] Contrast meets WCAG AA (design tokens, not hardcoded colors)
- [ ] `prefers-reduced-motion` respected
- [ ] jest-axe / axe-core passes with zero violations
- [ ] Manual keyboard pass (tab order, focus visibility, Escape behavior)

## Detailed References

- `references/patterns.md` — ❌/✅ React/TSX snippets: button, dialog, form field, disclosure/menu, visually-hidden, skip link
- `react-patterns` skill → *Extend native element props* (spreading `aria-*`/`data-*`) and *Testing with Vitest*
- `tailwindcss` skill → *Focus States* (`focus-visible:`), design tokens, `sr-only`
- WAI-ARIA Authoring Practices — https://www.w3.org/WAI/ARIA/apg/
