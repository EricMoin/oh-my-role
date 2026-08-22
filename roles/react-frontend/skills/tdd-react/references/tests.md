# Tests: What Good React Tests Look Like

The difference between tests that protect behavior and tests that just decorate the codebase is whether they observe **behavior through the public interface** or **implementation details**. This reference shows both sides — ❌/✅ — for a component and a hook, then covers the RTL query priority and async testing.

## Table of Contents

- [Component: Behavior vs Implementation](#component-behavior-vs-implementation)
- [Hook: Behavior vs Implementation](#hook-behavior-vs-implementation)
- [RTL Query Priority](#rtl-query-priority)
- [Async Testing: `findBy*` and `waitFor`](#async-testing-findby-and-waitfor)
- [Anti-Pattern Quick List](#anti-pattern-quick-list)

---

## Component: Behavior vs Implementation

Take a `Toggle` component: a button that reads "Off", flips to "On" when clicked, and flips back.

### ❌ Implementation-testing

```typescript
it("toggles the internal state", () => {
  const { container } = render(<Toggle />);
  const button = container.querySelector("button")!; // reaches into markup
  button.click(); // bypasses focus/pointer events

  // Asserts on implementation outcome, not user-visible behavior
  expect(container.textContent).toContain("On");
});
```

Why it's bad:
- `container.querySelector` couples the test to the exact DOM shape; any wrapper or class change breaks it.
- `.click()` fires a bare click event — no focus, no keyboard semantics — so real user interactions (Tab to the button, press Enter) are never exercised.
- Asserting on `textContent` couples the test to every bit of text in the component, not just the behavior.

### ✅ Behavior-testing

```typescript
it("shows 'On' after the user clicks the toggle", async () => {
  const user = userEvent.setup();
  render(<Toggle />);

  const toggle = screen.getByRole("button", { name: "Off" });
  await user.click(toggle);

  expect(screen.getByRole("button", { name: "On" })).toBeInTheDocument();
});
```

The test reads like a specification: *"the user clicks the toggle → the button now says On."* It survives refactors (class changes, wrapping, extracting a child component) and fails only when the behavior actually changes. A bonus: `getByRole` requires the button to have an accessible name, which keeps a11y honest.

### ❌/✅ Pairs

| ❌ Implementation | ✅ Behavior |
|---|---|
| `expect(container.querySelector(".form-error")).toBeTruthy()` | `expect(screen.getByRole("alert")).toHaveTextContent("Invalid email")` |
| `expect(instance.state.count).toBe(3)` | `await user.click(addButton); expect(screen.getByText("3")).toBeInTheDocument()` |
| `expect(onInternalHandlerSpy).toHaveBeenCalled()` | Assert the visible result the handler produces (message, focus, rendered value) |
| `expect(container.querySelectorAll("li")).toHaveLength(2)` | `expect(screen.getAllByRole("listitem")).toHaveLength(2)` |
| `expect(wrapper.find(Spinner).exists()).toBe(true)` | `expect(screen.getByRole("status")).toBeInTheDocument()` |

---

## Hook: Behavior vs Implementation

A custom hook's public contract is **its return value**. Test that contract with `renderHook` — never the internals (the state variables, the memoized internals, the module-scope helpers it uses).

### ❌ Implementation-testing

```typescript
it("has a count in state", () => {
  const { result } = renderHook(() => useCounter());

  // Asserts the shape, not the behavior — passes even if counting is broken
  expect(result.current).toHaveProperty("count");
});
```

### ✅ Behavior-testing

```typescript
it("starts at 0 and increments by 1", () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => result.current.increment());

  expect(result.current.count).toBe(1);
});
```

### Hook rules

- **Test the values and actions the hook returns** — the contract callers rely on — not the shape or internals.
- **Wrap every manual state change in `act`.** `renderHook` wraps the initial render; updates triggered outside React's event system need explicit `act` (or use `await act(async () => ...)` for async actions).
- **For async hooks** (data fetching), drive them with `findBy*` / `waitFor` on the component seam, or `waitFor` around the `result.current` in the hook seam — never bare synchronous assertions after a fetch kicks off.

```typescript
it("loads the user after mount", async () => {
  const { result } = renderHook(() => useUser("1"));

  expect(result.current.isLoading).toBe(true);

  await waitFor(() => {
    expect(result.current.user?.name).toBe("Ada Lovelace");
  });
});
```

---

## RTL Query Priority

Query the rendered tree the way a user (and assistive technology) finds things. In priority order:

| Priority | Query | Use for |
|---|---|---|
| 1 | `getByRole` (+ `{ name }`) | Buttons, links, headings, inputs, dialogs, alerts — anything with a role and accessible name |
| 2 | `getByLabelText` | Form fields wrapped in or associated with a `<label>` |
| 3 | `getByPlaceholderText` / `getByText` / `getByDisplayValue` | Text content, placeholders, current input values |
| 4 | `getByTestId` | **Last resort** — no semantic role or accessible name exists (e.g. a canvas, a drag handle) |

```typescript
// ❌ Test-id as the default — invisible to assistive tech, breaks the priority order
screen.getByTestId("submit-button");

// ✅ Role + accessible name — works for users, screen readers, and the test alike
screen.getByRole("button", { name: "Submit" });
```

### Query variants

| Variant | Behavior |
|---|---|
| `getBy*` | Throws if not found, or if multiple match — for asserting presence |
| `queryBy*` | Returns `null` instead of throwing — for asserting **absence** |
| `findBy*` | Async: retries until found (default ~1s) — for elements that appear after an update |
| `getAllBy*` / `queryAllBy*` / `findAllBy*` | Return arrays — for lists and repeated elements |

When a query throws "multiple elements", prefer disambiguating with `{ name: ... }` or a more specific role over scattering `data-testid`s.

---

## Async Testing: `findBy*` and `waitFor`

Async UI (loading states, data arrival, disappearing spinners, transitions) needs retry-based queries — a bare `getBy*` right after an interaction will race the React update.

### `findBy*` — wait for something to appear

```typescript
it("renders the user's name after loading", async () => {
  render(<UserProfile userId="1" />);

  // Returns a promise that retries until the element exists
  expect(await screen.findByRole("heading", { name: "Ada Lovelace" })).toBeInTheDocument();
});
```

### `waitFor` — wait for something to change or disappear

```typescript
it("shows a spinner, then the result", async () => {
  render(<UserProfile userId="1" />);

  // Synchronous assertions are fine for what is already there
  expect(screen.getByRole("status")).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
```

### `waitFor` + `expect` inside the callback

```typescript
await waitFor(() => {
  expect(screen.getByText("Saved!")).toBeInTheDocument();
});
```

### Async rules

- **Prefer `findBy*` over `waitFor` + `getBy*`** when waiting for an element to exist — it's shorter and the error messages are better.
- **Use `waitFor` when the assertion is about a change** (element gone, text updated, value changed).
- If a test is flaky, the cause is almost always a **missing `await`** or a **missing `act`** around an async update — not the test being "too slow". Fake timers (see `mocking.md`) fix debounce/timer-dependent flakiness, not missing awaits.
- Keep `waitFor` callbacks small and specific — a callback that asserts many things hides which one timed out.

---

## Anti-Pattern Quick List

- Asserting with `container.querySelector`, `wrapper.find`, or DOM-shape selectors (implementation markup)
- `fireEvent` instead of `user-event` (misses focus/pointer/keyboard semantics)
- `getByTestId` as the default query
- Bare `getBy*` immediately after an async interaction (races the update — use `findBy*`/`waitFor`)
- One giant test asserting ten behaviors (a single failure tells you nothing)
- Asserting on internal state, private functions, or the shape of a hook's return instead of its contract
