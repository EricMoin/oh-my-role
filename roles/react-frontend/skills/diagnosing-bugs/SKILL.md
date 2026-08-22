---
name: diagnosing-bugs
description: Systematic, evidence-first workflow for debugging React bugs. Use when chasing a React bug, regression, or unexpected behavior — something that "works sometimes", stale state, an infinite re-render loop, an effect firing at the wrong time, a hydration mismatch, or a test failing for unclear reasons. Don't use for greenfield feature work with no bug present, or pure styling tweaks (reach for the tailwindcss skill instead).
allowed-tools: Read, Grep, Glob, Bash
metadata:
  inspired-by: Matt Pocock's diagnosing-bugs skill (skills.sh)
---

# Diagnosing React Bugs

A systematic debugging workflow — not shotgun debugging. Most bug-hunting failures come from guessing at the root cause before the bug is even reproduced, then "fixing" the symptom and moving on. This skill forces a reproducible → isolate → hypothesize → verify → fix loop, with the discipline to stop and re-theorize when evidence contradicts you.

## 1. Reproduce

Get a **minimal, reliable reproduction before touching any code**. A bug you cannot reproduce on demand is a bug you cannot verify a fix against.

- Strip the app down to the smallest case that still fails: a single route, a single component, hardcoded data instead of an API.
- If the bug is **intermittent** ("works sometimes"), find what makes it deterministic:
  - Is it timing-dependent? Add `await`/`setTimeout` in a test, or slow the network in DevTools.
  - Is it data-dependent? Capture the failing input (the exact props/state/response) and pin it.
  - Is it environment-dependent? Note browser, viewport, auth state, hydration vs. client navigation.
- Write the repro down. If you can't reduce it, at least capture the exact steps that trigger it.

If you cannot reproduce it, say so. Do not proceed to fixing.

## 2. Isolate

Bisect to the **smallest failing surface**, and **read the actual error — don't guess**.

- Read the full stack trace and error message before anything else. The message usually names the component, the hook, or the line.
- Binary search: comment out halves of the component tree / hook logic until the failure disappears, then narrow from there. `git bisect` if it's a regression with a known good commit.
- Use `Grep`/`Glob` to trace every call site of the suspicious code — the bug is often in the caller, not the callee.
- Reproduce in a test if possible; a failing test is the tightest possible surface.

The goal is a file, a hook, and an expression you can point at and say: *"the behavior diverges here."*

## 3. Hypothesize

Form **ONE falsifiable hypothesis** about the root cause. For each hypothesis, write down the specific observation you would expect if it were true.

- Bad: "maybe the state is wrong."
- Good: "The effect depends on `user.id`, but `user` is a new object on every render, so the effect re-runs every render and re-fetches. If true, I'd see a network request per render and the effect firing on unrelated state changes."

Predict before you instrument. If the observation doesn't match the prediction, the hypothesis is wrong — discard it.

## 4. Verify the Hypothesis

Confirm with an **instrument before fixing**. Choose the cheapest instrument that produces the predicted observation:

- `console.log` / `console.trace` in the effect, render body, or event handler — log the values the hypothesis claims are involved (deps, state, props), not noise.
- **React DevTools**: Profiler for re-render loops and memoization failures; Components tab for props/state/hook values and the "why did this render" info.
- A **failing test** that asserts the wrong behavior you predicted (red first).

Only when the instrument shows what you predicted do you move to fixing.

## 5. Fix the Root Cause, Not the Symptom

- Fix the cause the evidence points to. A workaround that papers over the symptom (a `key={Math.random()}`, a `// eslint-disable` on the dep array, a `setTimeout` hack) is not a fix — it is a new bug.
- After the fix: **re-run the original repro** and confirm it is gone.
- Then **add a regression test** that encodes the bug's scenario, so it cannot silently come back. If the bug was hard to reproduce, the regression test is the deliverable that makes it reproducible forever.

## The Rule

**Two failed attempts on the same theory → stop.** Re-read the evidence (the actual error, the instrument output, the repro), form a new hypothesis. Do not blindly retry the same fix with variations.

**Never suppress errors to make them disappear.** A silenced warning, an emptied `catch`, or an `any` cast that hides a type error is not a resolution — it is where the next bug is born.

## React Footgun Catalog

The most common root causes in React, with the tell (what you'll observe) and the fix. For the deeper fix patterns, follow the cross-linked skills instead of re-deriving them here.

| Footgun | Tell | Fix |
|---|---|---|
| **Stale closure in effect/callback** | Handler/effect reads an old value — value is frozen at mount, or lags one render behind | Functional `setState` (`setCount(c => c + 1)`) so callbacks never capture stale state — see `vercel-react-best-practices` **Use Functional setState Updates**; for effect callbacks, add the dep or use a ref / `useEffectEvent` |
| **Missing / over-broad effect deps** | Effect re-fires on every render (infinite loop) or never re-fires when it should | Narrow deps to the primitives actually used — see `vercel-react-best-practices` **Narrow Effect Dependencies**; revisit whether you need the effect at all via the `react-patterns` **useEffect Decision Tree** |
| **Derived state stored in state instead of computed** | Component state desyncs from props; reset logic sprinkled in effects | Compute during render (`const isFull = items.length >= max`), never `useState` + `useEffect` to mirror props — see `react-patterns` **useEffect Decision Tree** |
| **`key` misuse causing state carryover** | Component keeps old internal state when its data changes (e.g. an editor showing the previous row's draft) | Use a stable, data-derived `key` (`key={item.id}`) so React remounts instead of reusing state — see `react-patterns` **Reset state on prop change** |
| **`setState` in render** | "Cannot update a component while rendering a different component" warning; render loops | Move the update to an event handler or effect; if it's derived, compute it during render instead |
| **Hydration mismatch from client-only data** | Hydration errors in console; server HTML differs from first client render; flicker on load | Render client-only data only after mount, or use the inline-script pattern — see `vercel-react-best-practices` **Prevent Hydration Mismatch Without Flickering** |
| **Object/array identity breaking `memo`/`useMemo`** | Memoized components re-render on every parent render; `useMemo` recomputes constantly | Pass primitives or stable references; define objects/arrays outside the component or with `useMemo` on narrow deps — see `vercel-react-best-practices` **Narrow Effect Dependencies** (same principle applies to memo deps) |
| **Race conditions in async effects** | A slow earlier request overwrites a newer one; data from a stale fetch appears after unmount | Add cleanup: `AbortController` (or an `ignore` flag) cancelled in the effect's cleanup — see `react-patterns` **Fetch data** row of the **useEffect Decision Tree** |

## Validation Checklist

Before declaring a React bug fixed:

- [ ] Reproduced deterministically
- [ ] Read the actual error, not guessed
- [ ] Root cause identified (not symptom)
- [ ] Regression test added
- [ ] Original repro verified fixed

## Related Skills

- `react-patterns` — the **useEffect Decision Tree** and when-you-do/don't-need-effects sections decide whether the offending effect should exist at all.
- `vercel-react-best-practices` — concrete fix patterns: **Use Functional setState Updates**, **Narrow Effect Dependencies**, **Prevent Hydration Mismatch Without Flickering**.
