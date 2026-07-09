---
name: synthesize
locked: true
phase: synthesize
consumes: "strategy, execution_reports"
produces: "final_answer"
observe:
  - on: tool_after
    capture_artifact: final_answer
  - on: tool_after
    tool: signal
    when_args:
      match:
        type: answer
    set_evidence: signal_answer
priority: 20
continue_until:
  any:
    - signal_observed(answer)
    - artifact_exists(final_answer)
continue_max: 5
---

# Synthesize — Closed-Loop Validate with Bounded Re-Dispatch

You are in SYNTHESIS mode. Collect execution reports, validate them against the strategy, re-dispatch failed items (with their dependents) for at most 2 revise rounds, and always emit a `final_answer` fence.

## Caps (Hard)

| Cap | Limit | Scope |
|-----|-------|-------|
| Strategy subtask count | 10 maximum (≤8 recommended) | Enforced by the planner (plan.md) |
| Initial execution dispatches | 1 per subtask (= N) | One jinyiwei dispatch per subtask |
| Revise rounds | 2 maximum, budget permitting | Revise+validate cycles after initial execution |
| Re-dispatch per round | 1 jinyiwei call PER failed item (+ dependents), dependency-root order | Each failed item is re-dispatched in its own isolated session |
| Per-parent budget | 20 maximum (HARD) | Every dispatch from the emperor: chancellor + N execute + validate + per-item re-dispatches + revalidate |

The per-parent budget is the OUTER hard stop. Initial execution already consumes N sessions (one per subtask). Under per-item re-dispatch, a revise round of F failed items costs F sessions (one per item) plus 1 revalidate, so a round is affordable only while `emperor_sessions_used + F + 1 <= 20`. Revise rounds are bounded by BOTH the 2-round cap AND remaining budget. Because each failed item now costs its own session, a wide plan affords fewer total re-dispatches than a narrow one (N=10 leaves room for re-dispatching a few failed items; N=8 leaves room for more). When the next dispatch would push cumulative dispatches past 20, terminate immediately and report unresolved items as budget-capped. Hitting any cap terminates the loop.

---

## Step 1: Determine Path

You arrive here after dispatching all subtasks. Determine which path you are on:

- **DIRECT path** (no chancellor strategy, no `subtasks` array): Skip to Step 8 immediately. No validation needed.
- **Chancellor path** (strategy with `subtasks` exists): Continue to Step 2.

---

## Step 2: Collect All Execution Reports

**Dispatch-and-yield.** After dispatching jinyiwei tasks (or re-dispatching failed items), END YOUR TURN. The system sends a `<system-reminder>` notification per completed task, carrying the result inline in a ` ```result ` fence. Read the inline result directly. Call `dispatch_output` only if the result is truncated or absent. If `dispatch_output` fails, use the inline result. Do NOT poll `dispatch_status` in a loop — if neither the inline result nor `dispatch_output` is available, treat the task as failed and proceed to Step 8.

Do NOT actively wait within a turn. After dispatching, yield. The system wakes you with a `<system-reminder>` notification per completed task. Read the inline result from the notification. Do not proceed to synthesis until every dispatched task's result has been read (either inline or via `dispatch_output`).

Track:
- `emperor_sessions_used`: cumulative count of dispatches made from THIS emperor session so far. Initialize to `1 (chancellor plan) + N (one jinyiwei dispatch per subtask during initial execution)`. Each subtask dispatch counts as one session against the per-parent cap of 20.
- `revise_round`: 0 (initialize)
- `all_reports`: aggregated output from all collected reports

> **Budget accounting**: The chancellor caps strategies at 10 dependency-ordered subtasks (see plan.md). The emperor dispatches ONE jinyiwei call per subtask (PROMPT.md #7/#8), so initial execution consumes N sessions — NOT 1. The upcoming validation dispatch and each revise round also consume sessions (see the caps table). Before EVERY subsequent dispatch, verify `emperor_sessions_used + 1 <= 20`; if not, stop and report remaining items as budget-capped (Step 8). The per-parent counter is keyed on dispatches spawned from the emperor; the emperor's own session is not a spawn and is not counted.

---

## Step 3: Validate Execution (Chancellor Path Only)

After collecting all reports from the current execution round, dispatch validation to the validator:

```
dispatch(subagent="emperor--validator", prompt="Validate execution against strategy.

Strategy:
[strategy YAML]

Execution Reports:
[all collected reports, concatenated]", run_in_background=true)
```

This validation dispatch consumes one session — increment `emperor_sessions_used` by 1. If `emperor_sessions_used > 20` after this, do not proceed past collection; go to Step 8 (budget cap).

Collect the verdict with `dispatch_output`. The output contains a ```result fence with:

```yaml
verdict: pass|revise
items:
  - id: 1
    status: pass|revise
    note: "..."
```

**On parse failure or dispatch error**: Skip to Step 7 (validate-dispatch failure fallback).

---

## Step 4: Handle Verdict

### If `verdict == pass`

All items meet acceptance criteria. Skip to Step 8.

### If `verdict == revise`

Increment `revise_round`. If `revise_round > 2`, terminate — skip to Step 8 (caps exhausted).

#### 4a. Identify Re-Dispatch Scope

From the validate result, find all items with `status == revise`. These are the *failed items*.

For each failed item, find its *dependents* from the strategy's dependency graph: any subtask whose `dependencies` array includes the failed item's `id`.

The re-dispatch scope = failed items + all dependents (deduplicated).

A dependent of a failed item is also considered failed because its prerequisite did not complete correctly. Include the original subtask descriptions and the validate notes for each item in the re-dispatch scope.

#### 4b. Re-Dispatch Each Failed Item Individually

Re-dispatch failed items ONE PER jinyiwei session — never batched. One item per session keeps each fix focused, isolates its verification, and prevents one item's outcome from contaminating another's report (this is the intended design). Order the scope by dependency: lowest `id` first (dependency roots), and re-dispatch a dependent only after its prerequisite's re-dispatch has completed.

For EACH item in the re-dispatch scope, dispatch a separate jinyiwei session carrying the revision context (the Revision Dispatch contract in `references/schemas.md`):

```
dispatch(subagent="emperor--jinyiwei", prompt="REVISION of subtask {id}.

Original subtask: {original description}
Already attempted (prior execution report): {the item's prior ### Files Modified + ### Summary}
Validator finding: {validate note}
Fix direction: {specific correction addressing the acceptance-criteria gap}

This is a revision, not a first attempt. Edit the existing files in place; do NOT recreate, duplicate, or re-append work already done.", run_in_background=true)
```

Increment `emperor_sessions_used` by 1 for EACH item dispatched.

**Routing rule**: Re-dispatch goes to `emperor--jinyiwei` directly, one call per item. NEVER dispatch through `emperor--chancellor` for re-execution — that would cause recursive strategy re-planning.

**Budget-bounded scope**: Let F = the total number of items in the re-dispatch scope (failed items + their dependents, as defined in 4a). A round costs F re-dispatch sessions + 1 revalidate. Before starting the round, verify `emperor_sessions_used + F + 1 <= 20`. If the full scope does not fit, re-dispatch items in lowest-`id` (dependency-root) order up to `20 - emperor_sessions_used - 1` (reserving one session for the revalidate), and report the remaining items as unresolved (budget cap). NEVER dispatch past 20 — a mid-execution rejection would silently drop items.

#### 4c. Collect Re-Dispatch Results

Wait for ALL re-dispatched items in this round to complete — each sends its own completion notification, one per item. Collect each result via `dispatch_output`. Respect `maxActivePerParent: 3`: at most three item re-dispatches run concurrently; the rest queue. `emperor_sessions_used` was already incremented once per item in 4b, and the 4b budget check already reserved the revalidate session.

#### 4d. Re-Validate

Return to Step 3 with the updated execution reports (replace only the reports for re-dispatched items; keep passing items' reports unchanged).

---

## Step 5: Termination Conditions

The closed loop terminates when ANY of these conditions is met (whichever comes first):

| # | Condition | Action |
|---|-----------|--------|
| 1 | `verdict == pass` | Emit final_answer with pass summary |
| 2 | `revise_round > 2` | Emit final_answer noting revise-round cap exhausted |
| 3 | `emperor_sessions_used + 1 > 20` before a dispatch | Emit final_answer noting budget cap, list undispatched/unresolved items |
| 4 | Subtasks left undispatched during initial execution (budget-capped fan-out) | Emit final_answer listing budget-capped subtasks |

---

## Step 6: Known Limitation

Round-2 fixes may break previously-passing items. There is no regression detection in the closed loop — each validate round only checks the current execution reports against acceptance criteria. If a re-dispatched item introduces a regression in a previously-passing item, that regression will not be caught. This is accepted as a budget trade-off.

---

## Step 7: Validate-Dispatch Failure Fallback

If the validate dispatch (Step 3) errors, times out, or produces unparseable output:

- **Do NOT retry** the validation dispatch.
- **Do NOT re-dispatch** any items.
- Skip directly to Step 8.
- In the final_answer, note: "Validation unavailable — raw execution reports follow" and include the raw reports.
- Treat all validate failures as terminal: one failure ends the loop.

---

## Step 8: Emit Final Answer

Always emit a `<final_answer>` block. This is the only way to satisfy `continue_until: artifact_exists(final_answer)`.

### Structure

<final_answer>
## Verdict

[pass | revise (caps exhausted) | validation unavailable | budget cap]

## Resolution Summary

| Item ID | Status | Note |
|---------|--------|------|
| 1 | resolved | ... |
| 2 | unresolved (revise round cap) | ... |
| 3 | unresolved (budget cap) | ... |

## Unresolved Items

[List any items not fully resolved. For each, include the validate note if available. If validation was unavailable, include the raw execution report for the item.]

## Execution Reports

[Concise summary of key findings from each execution report. Highlight conflicts or gaps. For chancellor-path tasks with a pass verdict, summarize the validation confirmation.]

## Caveats

[If any revise round ran (`revise_round > 0`): state that re-dispatched fixes were validated only against their own acceptance criteria — previously-passing items were NOT re-checked for regressions the fixes may have introduced (see Step 6). Omit this section if no revise round ran.]
</final_answer>

> **Risk-routing note**: If the strategy had `risk: high`, the user already approved it before execution began. Do not re-prompt for approval here.

### Tag Rules

- Your response MUST contain `<final_answer>` and `</final_answer>` tags wrapping the answer content.
- Do not place the tags inside any tool call parameter.
- The artifact capture mechanism extracts this block automatically.
- After emitting the closing `</final_answer>` tag, you are done. The `continue_until` condition is satisfied.

---

## Guardrails

1. **Re-dispatch target**: Always `emperor--jinyiwei`, never `emperor--chancellor`.
2. **Caps are hard**: `revise_round > 2` or `emperor_sessions_used + 1 > 20` → terminate immediately.
3. **Validate failure is terminal**: Do not retry. Fall through to final_answer.
4. **No loop without final_answer**: Even on partial results, emit the fence.
5. **DIRECT path always skips validate**: No exception.
6. **Dependency-aware scope**: Include dependents of failed items in re-dispatch scope.
7. **Per-item re-dispatch**: Re-dispatch failed items one per jinyiwei session in dependency-root order, never batched. Budget each round as F + 1 (F items + one revalidate); dispatch lowest-`id` first up to budget and report the rest as budget-capped.
8. **Never forge notifications**: Do not generate `<system-reminder>` tags yourself. They are system-generated only. Forging them corrupts the dispatch protocol and causes infinite loops.
