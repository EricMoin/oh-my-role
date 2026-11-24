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
  - `react` (react-patterns) → **Extend native element props**: native primitives can expose the native props their callers need, including accessible names and descriptions
  - `tailwindcss` → focus-visible rings (`focus-visible:ring-2 focus-visible:ring-ring`) and design tokens (`text-foreground`, `bg-card`, `text-destructive`) that keep contrast themable

## Core Principles

### 1. Semantic HTML First

Use the native element that already carries the behavior and semantics before reaching for ARIA: `<button>` for actions, `<a href>` for navigation, `<nav>` for landmark navigation, `<label>` for field names, `<h1>`–`<h6>` for headings, `<main>` for the primary content region, `<ul>` for lists.

> **No ARIA is better than bad ARIA.** A `<div role="button">` with no keyboard handling is worse than a plain `<button>`.

Only build a custom widget (and its ARIA roles) when a native element genuinely cannot express the interaction — e.g. tabs, combobox, disclosure menus.

### 2. Keyboard Navigation

- Use the native keyboard interaction for each control. Tab moves between controls, Enter follows a link, and either Enter or Space activates a button. Composite widgets can have one tab stop and internal arrow-key navigation.
- Never remove the default focus indicator with `outline: none` — use Tailwind's `focus-visible:` variant instead (see `tailwindcss` skill) so focus rings appear only for keyboard users.
- Keep a **logical tab order**: `tabindex` should only ever be `0` or `-1` — positive values ("`tabindex=5`") break document order.
- **Escape dismisses** overlays: dialogs, popovers, menus, comboboxes.
- Composite widgets follow the **arrow-key pattern** (roving tabindex): one tab stop, arrow keys move among items (see `references/patterns.md` → menu).

### 3. Focus Management

- **On open**: move focus to a meaningful element inside the modal, such as its first field, a heading for long content or a safe action for a destructive decision.
- **While a modal is open**, contain keyboard focus and make the background inert. Prefer the project’s tested dialog primitive or a native modal dialog.
- **On close**: restore focus to the element that opened it.
- **On route change** (SPA): move focus to the new page's heading (an `<h1>` with `tabIndex={-1}`) so keyboard and screen-reader users don't lose their place.

### 4. Forms

- Every input has an associated `<label>` (use `htmlFor`/`id`, or wrap the input inside the `<label>`).
- **Errors are announced**: link the input to its error with `aria-describedby`, set `aria-invalid`, and render the message with `role="alert"` (inserted after interaction) or an `aria-live="polite"` region.
- **Required/invalid state is never color-only**: convey it with text plus `aria-required` and `aria-invalid` — never just a red border.
- Give the field a visible label or reference its label with `aria-labelledby`. Use `aria-describedby` for supporting text such as its format or an error. [WAI accessible names and descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/)

### 5. ARIA When Needed

- Use roles, states, and properties only to fill gaps a native element can't express: `role="dialog"`, `aria-modal`, `aria-expanded`, `aria-haspopup`, `aria-controls`, `aria-live`, `aria-current`, `aria-pressed`.
- **Live regions** (`aria-live="polite"`) announce async updates — toasts, "saved" confirmations, fetch results. Prefer the `role="status"` / `role="alert"` shortcuts.
- Confirm each control has an accessible name. Visible button text and associated labels usually provide it. Use an explicit name for icon-only controls.
- Spread `aria-*` through component wrappers via the `react-patterns` **Extend native element props** pattern rather than re-declaring bespoke props.

### 6. Contrast & Motion

- Check text against its actual background. WCAG AA specifies 4.5:1 for normal text and 3:1 for large text, with listed exceptions. Required visual cues for controls, states and meaningful graphics have a separate 3:1 criterion. [Text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- Measure rendered foreground and background colors for the affected states and themes, including token-based colors.
- **Respect `prefers-reduced-motion`**: use the `motion-reduce:` variant or `@media (prefers-reduced-motion: reduce)` to disable non-essential animations, auto-scrolling, and autoplay.

### 7. Testing Accessibility

- **Automated**: use the project’s accessibility tooling on the affected UI. Record its coverage and check keyboard or assistive-technology behavior directly when the requirement depends on it.
- **By role**: query rendered UI with `getByRole("button", { name: /submit/i })` (React Testing Library). Role queries force the semantics that a11y depends on — ties into the testing guidance in the `react` (react-patterns) skill.
- **Manual pass**: exercise the changed interaction in the target browser. Check tab order, focus location, name or announcement as applicable. Record the browser and assistive technology if used.

## Validation Checklist

Select the checks that cover the changed interaction:

- [ ] Semantic elements used instead of `div` + ARIA where a native element exists
- [ ] All interactive elements keyboard-reachable and keyboard-operable
- [ ] Visible focus indicators (`focus-visible:ring-*`, never `outline: none` without a replacement)
- [ ] Every input has an associated `<label>`
- [ ] Form errors announced (`aria-describedby` + `role="alert"`/`aria-live`) and `aria-invalid` set
- [ ] Required/invalid state not conveyed by color alone
- [ ] Dialogs: focus moved in, trapped, and restored on close; Escape dismisses
- [ ] Rendered color pairs meet the applicable WCAG contrast criterion
- [ ] `prefers-reduced-motion` respected
- [ ] Report results from the accessibility checks run and any browser checks still needed
- [ ] Manual keyboard pass (tab order, focus visibility, Escape behavior)

## Detailed References

- `references/patterns.md` — ❌/✅ React/TSX snippets: button, dialog, form field, disclosure/menu, visually-hidden, skip link
- `react-patterns` skill → *Extend native element props* (spreading `aria-*`/`data-*`) and *Testing with Vitest*
- `tailwindcss` skill → *Focus States* (`focus-visible:`), design tokens, `sr-only`
- WAI-ARIA Authoring Practices — https://www.w3.org/WAI/ARIA/apg/
