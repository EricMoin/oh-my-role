---
name: tdd-react
description: Test-driven development workflow for React 19 components and hooks using Vitest, @testing-library/react, and @testing-library/user-event. Use when writing or adding tests, driving development through the red → green → refactor loop, testing React components or custom hooks (including async behavior), deciding where test seams belong, or choosing what and how to mock. Don't use for end-to-end browser flows (Playwright), load or performance testing, or testing non-React code.
allowed-tools: Read, Grep, Glob, Bash
metadata:
  inspired-by: Matt Pocock's tdd skill (skills.sh)
---

# TDD for React: Vitest + React Testing Library

TDD is a **workflow**, not a testing technique. You write a failing test first, make it pass with the smallest change that works, then refactor with the tests green. The tests you write this way are the specification of the behavior you are building — and they are what make the codebase safe to change later. `Bash` is allowed so the loop can actually run `vitest` between phases; this skill is useless if the tests never execute.

## The Red → Green → Refactor Loop

### 1. Red — write a failing test first

Write a test that expresses the **behavior** you want, then run it and watch it fail. A test that passes before the feature exists proves nothing — it is not exercising what you think it is.

- `pnpm vitest run <path-to-test>` — see it fail, and read *why* it fails (wrong value? missing element? error?).
- The failure should be about missing behavior, not a broken test. If the test fails for the wrong reason (a typo, a bad query), fix the test before proceeding.

### 2. Green — make it pass with the minimal change

Write the **minimum code** to make the test pass. No extra features, no premature abstraction, no "while I'm here" refactors, no speculative generics. Duplication and awkwardness are acceptable at this stage — you will clean them up in step 3 while the tests hold you safe.

- `pnpm vitest run` — green.
- If you cannot get green quickly, the test or the seam is wrong. Re-read the test; do not widen it into a lie.

### 3. Refactor — improve with the tests green

With the suite green, improve the code: extract a hook or component, rename, remove duplication, tighten types. The tests tell you instantly if a refactor changed behavior.

- Run `pnpm vitest run` after **each** refactor step, not once at the end.
- If a refactor breaks a test, the test is asserting implementation details — see [What a Good Test Is](#what-a-good-test-is) and fix the test, not the code.

### Rules of the loop

- **One behavior at a time.** Smallest test that fails → smallest change that passes. Never batch behaviors into one mega-test or one mega-change.
- **Never skip Red.** Implementing first and testing after is a different (weaker) discipline. If you find yourself doing it, stop and write the failing test for the behavior you just implemented.
- **Keep the loop tight.** Minutes, not hours. Red → green → refactor should be fast enough to run many times a day.
- **Refactor only when green.** The safety of refactoring comes from knowing the tests passed *before* you started changing code.
- **Run the suite, don't assume.** The loop is only real when `vitest` actually runs between phases — red is verified by a failing run, green by a passing run.

## What a Good Test Is

A good test verifies **behavior through public interfaces**, not implementation details:

- It reads like a **specification**: "when the user submits an empty form, an error appears" — not "when `handleSubmit` is called with `""`, `setError` is called".
- It **survives refactors**: renaming an internal function, extracting a hook, or reordering JSX does not break it.
- It **fails for the right reason**: it goes red when behavior breaks, not when markup moves.
- It asserts **one behavior per test**, so a failure pinpoints the broken contract.

If a test breaks on every refactor, it is coupled to implementation, not behavior. Fix the test, not the code. For the full ❌/✅ catalog, see `references/tests.md`.

## Seams — Where Tests Go

A **seam** is the public boundary at which you observe behavior. Every test observes behavior at exactly one seam — pick the seam before writing the test and never reach past it.

For React, the pre-agreed seams are:

| Seam | What you observe | Tool |
|------|------------------|------|
| Component render output | What the user sees: text, roles, values, presence/absence | `render` + `screen.getByRole` |
| User-visible behavior | What happens when the user interacts: clicks, typing, focus, submit | `user-event` |
| Hook return contract | The values and actions a hook returns given its inputs | `renderHook` |

**Never test internal state.** No reaching into component internals, no asserting on module-private functions, no peeking at `useState` values. If a behavior is hard to observe at the agreed seam, change the component to expose it through the public interface (a status message, an accessible role, a return value) — don't loosen the test to reach in.

## RTL Discipline

Query the rendered tree the way a user (and assistive technology) finds things — by accessible role and name, not by class or DOM structure:

1. `getByRole` with `{ name: ... }` — buttons, links, headings, inputs, dialogs
2. `getByLabelText` — form fields associated with a `<label>`
3. `getByPlaceholderText` / `getByText` / `getByDisplayValue` — fallbacks
4. `getByTestId` — **last resort**, only for elements with no semantic role or accessible name

- Use `@testing-library/user-event` (`userEvent.click`, `userEvent.type`, `userEvent.tab`, …) instead of `fireEvent`. `user-event` replays the full interaction sequence (focus, pointer, key events) and catches behaviors that `fireEvent` silently misses.
- Use `renderHook` for custom hooks; wrap manual state changes in `act`.
- For async behavior use `findBy*` / `waitFor` — never assert an async result with a bare `getBy*`.
- Never assert on implementation: no `container.querySelector`, no internal state, no `data-testid` as the default.

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("SearchForm", () => {
  it("shows an error when the query is empty", async () => {
    const user = userEvent.setup();
    render(<SearchForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a search term");
  });
});
```

```typescript
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";

describe("useToggle", () => {
  it("starts false and toggles to true", () => {
    const { result } = renderHook(() => useToggle(false));

    expect(result.current.value).toBe(false);

    act(() => result.current.toggle());

    expect(result.current.value).toBe(true);
  });
});
```

## Validation Checklist

Before finishing any task that adds or changes tests:

- [ ] Test written before implementation (red first)
- [ ] Tests query by role / accessible name (not `data-testid` first)
- [ ] No assertions on internal state or implementation details
- [ ] Ran `pnpm vitest run` (or `pnpm test`) — green

## Detailed References

- `references/tests.md` — good vs bad tests (❌/✅) for components and hooks, RTL query priority, async testing with `findBy*` and `waitFor`
- `references/mocking.md` — when to mock vs not, `vi.mock`, mocking fetch/network, fake timers, MSW as the preferred network mock, and the over-mocking anti-pattern
