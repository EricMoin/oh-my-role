# Signal Architecture Testing Strategy

**Purpose**: Define the test coverage plan for the out-of-band signal architecture — covering the rolebox kernel primitives, integration flows, emperor role configuration, and regression safety. This document describes WHAT tests should exist and their expected outcomes. It contains no executable test code.

**Architecture under test**: The signal architecture replaces imperative triage and text-fence parsing with declarative state-machine orchestration. Its components are:

| Component | Layer | Location |
|-----------|-------|----------|
| `signal` tool | Kernel tool | `~/Project/github/rolebox/src/tools/signal.ts` (hypothesized) |
| `when_args` filter | Observer pipeline | `~/Project/github/rolebox/src/observe.ts` (hypothesized) |
| `signal_observed(type)` condition | Condition registry | `~/Project/github/rolebox/src/conditions.ts` (hypothesized) |
| `capture_payload_as` | Observer pipeline | `~/Project/github/rolebox/src/observe.ts` (hypothesized) |
| Dual-channel `any:[...]` | Function model | 7 emperor function files (see §3) |

---

## 1. Unit Tests

**Scope**: Rolebox kernel (`~/Project/github/rolebox/tests/`). These tests exercise individual primitives in isolation — a single tool, a single filter, a single condition, or a single observer behavior. No integration across the event-handler loop or the continuation engine.

### 1.1 Signal Tool

Test the `signal(type, payload?)` tool contract directly — call it with valid and invalid parameters, verify the return value and side effects.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 1.1.1 | Call with valid type | Load registered signal tool | `signal(type="answer")` | Returns confirmation string indicating signal was recorded |
| 1.1.2 | Call with invalid type | Load registered signal tool | `signal(type="not_a_real_signal")` | Schema validation error — unknown type rejected |
| 1.1.3 | Call with payload | Load registered signal tool | `signal(type="handoff", payload={target: "jinyiwei", items: [1, 2]})` | Returns confirmation string; payload preserved in signal ledger entry |
| 1.1.4 | Call without payload | Load registered signal tool | `signal(type="answer")` | Returns confirmation string; no error (payload is optional) |
| 1.1.5 | Call with empty object payload | Load registered signal tool | `signal(type="answer", payload={})` | Returns confirmation string; payload recorded as `{}` |
| 1.1.6 | Call on already-complete function | Function already in `"complete"` phase | `signal(type="answer")` | No error; no state change; signal recorded in ledger but ignored by continuation engine |

### 1.2 `when_args` Filter

Test the observer pipeline's `when_args` filter — the mechanism that narrows which tool invocations trigger an ObserveSpec. Each test sets up an ObserveSpec with a specific `when_args` configuration, simulates a tool-after event with given arguments, and checks whether the observer fires.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 1.2.1 | Match positive — spec fires | ObserveSpec: `when_args: {match: {type: "answer"}}` | Tool-after event for `signal(type="answer")` | Observer fires (spec matches) |
| 1.2.2 | Match negative — spec skipped | ObserveSpec: `when_args: {match: {type: "answer"}}` | Tool-after event for `signal(type="blocked")` | Observer does NOT fire (type mismatch) |
| 1.2.3 | Not-match positive — spec fires | ObserveSpec: `when_args: {not_match: {type: "progress"}}` | Tool-after event for `signal(type="answer")` | Observer fires (type is not "progress") |
| 1.2.4 | Not-match negative — spec skipped | ObserveSpec: `when_args: {not_match: {type: "answer"}}` | Tool-after event for `signal(type="answer")` | Observer does NOT fire (type matches excluded type) |
| 1.2.5 | Deep equality for nested objects | ObserveSpec: `when_args: {match: {payload: {target: "jinyiwei"}}}` | Tool-after event for `signal(type="handoff", payload={target: "jinyiwei", items: [1, 2]})` | Observer fires (payload.target matches via deep equality on the subset) |
| 1.2.6 | `when_args` declared but no tool args available | ObserveSpec with `when_args: {match: {type: "answer"}}` | Tool-after event for a tool that has no args schema (or args are null) | Observer does NOT fire (graceful skip — no crash) |
| 1.2.7 | No `when_args` — backward compatible | ObserveSpec without `when_args` field | Tool-after event for `signal(type="answer")` | Observer fires unconditionally (backward compatibility with pre-signal specs) |
| 1.2.8 | Match + not_match both specified | ObserveSpec: `when_args: {match: {type: "answer"}, not_match: {payload: {target: "test"}}}` | Tool-after event for `signal(type="answer", payload={target: "prod"})` | Observer fires (match passes, not_match does not exclude) |
| 1.2.9 | Match + not_match both specified — both match | ObserveSpec: `when_args: {match: {type: "answer"}, not_match: {payload: {target: "test"}}}` | Tool-after event for `signal(type="answer", payload={target: "test"})` | Observer does NOT fire (match passes but not_match also matches — AND logic) |

### 1.3 `signal_observed` Condition

Test the named condition `signal_observed(type)` in isolation — it queries the session's signal ledger (`kv["__signals_observed"]`) and returns a boolean.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 1.3.1 | False before any signal | Fresh session, no signal calls | Evaluate `signal_observed("answer")` | Returns `false` |
| 1.3.2 | True after matching signal | Fresh session | `signal(type="answer")`, then evaluate `signal_observed("answer")` | Returns `true` |
| 1.3.3 | False for non-matching type | Fresh session | `signal(type="answer")`, then evaluate `signal_observed("blocked")` | Returns `false` (independence: answer does not satisfy blocked) |
| 1.3.4 | Both true after two signals | Fresh session | `signal(type="progress")`, then `signal(type="answer")`, then evaluate both `signal_observed("progress")` and `signal_observed("answer")` | Both return `true` |
| 1.3.5 | Works inside `any:[...]` combinator | Fresh session | Evaluate `any: [signal_observed("answer"), artifact_exists(result)]` — first, no signal, no artifact → `false`; then signal → `true` | Combinator short-circuits on first truthy condition |
| 1.3.6 | Works inside `all:[...]` combinator | Fresh session | Evaluate `all: [signal_observed("answer"), evidence_met()]` — signal is true, evidence is false → `false`; set evidence → `true` | Combinator requires both conditions |
| 1.3.7 | Multiple calls of same type | Fresh session | `signal(type="answer")` → `signal(type="answer")` again | `signal_observed("answer")` stays `true`; second call updates payload but does not re-trigger |
| 1.3.8 | Unrecognized signal type in ledger | Signal ledger contains type not in taxonomy | Evaluate `signal_observed("unknown_type")` | Returns `false` (only taxonomy-registered types resolve as observed) |

### 1.4 `capture_payload_as`

Test the observer's ability to capture signal tool payloads into named artifacts — bridging the data plane and control plane.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 1.4.1 | Signal with payload → named artifact | ObserveSpec: `{tool: signal, when_args: {match: {type: "handoff"}}, capture_payload_as: "handoff_data"}` | `signal(type="handoff", payload={target: "jinyiwei", reason: "handoff"})` | Artifact `handoff_data` exists and contains `{"target":"jinyiwei","reason":"handoff"}` |
| 1.4.2 | Signal with payload → auto-capture | ObserveSpec on signal tool without explicit `capture_payload_as` | `signal(type="handoff", payload={key: "value"})` | Auto-capture artifact `__signal_payload` exists and contains the payload |
| 1.4.3 | Signal without payload → no artifact | ObserveSpec: `{tool: signal, capture_payload_as: "my_data"}` | `signal(type="answer")` (no payload) | No artifact written for `my_data`; no error |
| 1.4.4 | `capture_payload_as` coexists with `capture_artifact` | ObserveSpec: `{tool: signal, when_args: {match: {type: "handoff"}}, capture_payload_as: "handoff_data", capture_artifact: "result"}` | `signal(type="handoff", payload={...})` followed by `dispatch_output` returning result fence | Both `handoff_data` and `result` artifacts exist; no conflict |
| 1.4.5 | Empty object payload captured | ObserveSpec: `{tool: signal, capture_payload_as: "empty_data"}` | `signal(type="answer", payload={})` | Artifact `empty_data` contains `"{}"` (JSON string) |
| 1.4.6 | Non-JSON-serializable payload | ObserveSpec: `{tool: signal, capture_payload_as: "bad_data"}` | `signal(type="answer", payload={fn: function() {}})` | Serialization error caught; artifact not written; error recorded |

---

## 2. Integration Tests

**Scope**: Rolebox kernel (`~/Project/github/rolebox/tests/`). These tests exercise the full event-handler pipeline — from tool invocation through observer pipeline to continuation evaluation. They verify that the kernel components compose correctly.

### 2.1 Full Signal → Completion Flow

Verify that a signal call propagated through the observer pipeline correctly updates the condition state, and that the continuation engine detects the satisfied condition and transitions the function to `"complete"` phase.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 2.1.1 | Signal terminates function | Function with `continue_until: signal_observed(answer)`, active phase | Simulate tool-after event for `signal(type="answer")` | On next idle cycle, function phase transitions to `"complete"` |
| 2.1.2 | Signal does NOT terminate if not in continue_until | Function with `continue_until: signal_observed(answer)` | `signal(type="progress")` | Function remains active; `signal_observed(answer)` is still false |
| 2.1.3 | Non-terminating signal does not satisfy continue_until | Function with `continue_until: signal_observed(answer)` | `signal(type="progress")` | Function remains active; `progress` type is non-terminating per taxonomy |

### 2.2 Dual-Channel Completion

Verify that functions using `any:[signal_observed(answer), artifact_exists(result)]` complete reliably under all three scenarios: signal-only, fence-only, and both-fire.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 2.2.1 | Signal fires — fence never written | Function with `continue_until: any:[signal_observed(answer), artifact_exists(result)]` | `signal(type="answer")` | Function completes; no double-completion (idempotent) |
| 2.2.2 | Fence captured — signal never called | Function with `continue_until: any:[signal_observed(answer), artifact_exists(result)]` | Fence `result` artifact written via observer | Function completes; no double-completion (idempotent) |
| 2.2.3 | Both fire same turn | Function with `continue_until: any:[signal_observed(answer), artifact_exists(result)]` | Both `signal(type="answer")` and `result` fence artifact produced in same turn | Function completes exactly once; no double-completion; no race condition on `any` short-circuit |
| 2.2.4 | Signal fires first, then fence (next turn) | Same setup | Turn 1: `signal(type="answer")` → function completes. Turn 2: fence artifact appears | Function already complete; fence is inert (verified via 1.1.6) |
| 2.2.5 | Fence fires first, then signal (next turn) | Same setup | Turn 1: fence artifact appears → function completes. Turn 2: `signal(type="answer")` | Orphaned signal is inert on completed function (verified via 1.1.6) |

### 2.3 Evidence-Gate with Signal

Verify that the `requires_evidence` safeguard prevents premature completion via signal — the evidence gate is evaluated BEFORE the continuation check.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 2.3.1 | Signal before evidence — gate blocks | Function with `requires_evidence: [dispatch_output]` + `continue_until: signal_observed(answer)` | `signal(type="answer")` before `dispatch_output` evidence is set | Function does NOT complete; evidence gate skips this function entirely on the idle cycle |
| 2.3.2 | Evidence set, signal already fired | Same setup | (a) `signal(type="answer")` — gate blocks. (b) `dispatch_output` evidence set | On next idle cycle, function evaluates `signal_observed(answer)` → true → completes |
| 2.3.3 | Evidence set first, then signal | Same setup | (a) `dispatch_output` evidence set. (b) `signal(type="answer")` | Function completes on the next idle cycle after signal arrives |
| 2.3.4 | `evidence_met()` composed with signal via `all:` | Function with `continue_until: all:[signal_observed(answer), evidence_met()]` + `requires_evidence: [dispatch_output]` | `signal(type="answer")` before evidence | Both conditions required; function does NOT complete until evidence also set |

### 2.4 `continue_max` with Signal

Verify that the hard cap `continue_max` takes precedence over signal conditions — no bypass.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 2.4.1 | Cap hit before signal | Function with `continue_until: signal_observed(answer)` + `continue_max: 3` | Simulate 3 idle cycles without calling `signal(type="answer")` | Function terminates at cap; phase transitions to terminal |
| 2.4.2 | Cap hit after signal (normal) | Same setup | Simulate 1 idle cycle, then `signal(type="answer")` | Function completes on cycle 2; cap not reached |
| 2.4.3 | Cap not bypassable by signal after hit | Function with `continue_until: signal_observed(answer)` + `continue_max: 3`, already terminated by cap | Call `signal(type="answer")` on terminated function | Function remains terminated; signal is inert |

### 2.5 Payload Flow

Verify end-to-end payload capture from signal tool call through observer pipeline to artifact storage.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 2.5.1 | Handoff payload captured | ObserveSpec: `{tool: signal, when_args: {match: {type: "handoff"}}, capture_payload_as: "handoff_data"}` | `signal(type="handoff", payload={target: "jinyiwei", items: [1, 2]})` | Artifact `handoff_data` contains `{"target":"jinyiwei","items":[1,2]}` |
| 2.5.2 | Progress payload captured | ObserveSpec: `{tool: signal, when_args: {match: {type: "progress"}}, capture_payload_as: "latest_progress"}` | `signal(type="progress", payload={step: 3, total: 7, phase: "validation"})` | Artifact `latest_progress` contains `{"step":3,"total":7,"phase":"validation"}` |
| 2.5.3 | Need-approval payload captured | ObserveSpec: `{tool: signal, capture_payload_as: "pending_approval"}` | `signal(type="need_approval", payload={action: "delete_db", description: "Drop users table"})` | Artifact `pending_approval` contains `{"action":"delete_db","description":"Drop users table"}` |
| 2.5.4 | Payload overwrite on second call | ObserveSpec: `{tool: signal, when_args: {match: {type: "handoff"}}, capture_payload_as: "handoff_data"}` | `signal(type="handoff", payload={target: "jinyiwei"})`, then `signal(type="handoff", payload={target: "chancellor"})` | Artifact `handoff_data` contains last payload: `{"target":"chancellor"}` |

---

## 3. Role-Level Verification

**Scope**: Emperor role in the oh-my-role registry (`roles/emperor/`). These checks verify that the signal migration is correctly wired across all 7 dual-channel functions, that the role configuration is valid, and that end-to-end dispatch still works.

### 3.1 Configuration Validation

Run the role-creator--validator's Tier 1-3 checks on the emperor role directory. Each tier verifies a different layer of role integrity.

| # | Test Case | Precondition | Action | Expected Outcome |
|---|-----------|--------------|--------|------------------|
| 3.1.1 | Tier 1 — schema validation | All 7 migrated function files present | `role-creator--validator` Tier 1 check on `roles/emperor/` | Role YAML parses; all `function:` entries resolve to file paths; no missing `prompt_file` |
| 3.1.2 | Tier 2 — function integrity | Tier 1 passes | Validate each function YAML frontmatter | All `continue_until` conditions use known predicates (`signal_observed`, `artifact_exists`, `evidence_met`, etc.); no unknown condition names |
| 3.1.3 | Tier 2 — signal_observed resolves in all 7 functions | Tier 1 passes | Scan all 7 migrated functions for `signal_observed(...)` conditions | All `signal_observed` references use types from the taxonomy (`answer`, `need_approval`, `blocked`, `need_clarification`, `handoff`, `progress`, `revise_needed`, `escalate`); no ad-hoc types |
| 3.1.4 | Tier 2 — when_args parse without error | Tier 1 passes | Scan all observe specs that contain `when_args` | All `when_args` blocks contain valid `match` and/or `not_match` objects; no syntax errors |
| 3.1.5 | Tier 3 — reference integrity | Tier 2 passes | Cross-reference `schemas.md` signal taxonomy against all function conditions | Every `signal_observed(type)` call matches a type defined in §2 of `schemas.md`; no orphaned types |

### 3.2 Function Graph Integrity

Verify that the migration did not introduce broken transitions, missing dependencies, or orphaned functions in the emperor's function state machine.

| # | Test Case | Action | Expected Outcome |
|---|-----------|--------|------------------|
| 3.2.1 | Dependency graph valid | `function_graph(role_id="emperor", focus="dependencies")` | All `requires`/`produces`/`consumes` edges resolve; no broken artifact chains |
| 3.2.2 | State machine graph valid | `function_graph(role_id="emperor", focus="state_machine")` | All `transitions[].when` conditions reference known conditions or signal_observed types; no dead-end states |
| 3.2.3 | All 7 migrated functions present in graph | `function_graph` output | All 7 dual-channel functions (synthesize, orchestrate, validate, route, draft, review, finalize) appear as nodes |
| 3.2.4 | No function lost its pre-migration dependencies | Diff function graph before and after migration | No dropped `produces`/`consumes` edges; dual-channel functions still produce their artifacts |

### 3.3 Smoke Test Procedure

A lightweight end-to-end test that exercises the signal architecture through a real dispatch.

| # | Procedure | Action | Expected Outcome |
|---|-----------|--------|------------------|
| 3.3.1 | Dispatch simple task through emperor pipeline | Dispatch a request through emperor → chancellor → jinyiwei | Pipeline completes successfully |
| 3.3.2 | Verify completion mechanism | After completion, inspect which channel satisfied `continue_until` | Either `signal_observed(answer)` fired or `artifact_exists(result)` fence captured (both valid per dual-channel design) |
| 3.3.3 | Check function state after completion | `function_state` tool on synthesize function | `synthesize` function in `"complete"` phase |
| 3.3.4 | Verify final_answer artifact | `ArtifactRead("final_answer")` | Artifact exists and contains the expected verdict structure |
| 3.3.5 | Verify chancellor orchestrate completed | `function_state` on orchestrate function | `orchestrate` function in `"complete"` phase |
| 3.3.6 | Verify validator validate completed | `function_state` on validate function | `validate` function in `"complete"` phase (when applicable — DIRECT path skips validation) |

---

## 4. Regression Safety

**Scope**: Entire codebase. These tests ensure that the signal migration did not break pre-existing behavior — all existing flow paths, tools, conditions, and observe specs continue to function as before.

### 4.1 Backward Compatibility

Verify that functions using ONLY pre-signal mechanisms still work as they did before the migration.

| # | Test Case | Concern | Action | Expected Outcome |
|---|-----------|---------|--------|------------------|
| 4.1.1 | Artifact-only function still works | Functions with `continue_until: artifact_exists(result)` (no signal_observed) may be affected by observer pipeline changes | Execute a function using ONLY `artifact_exists` | Function completes via artifact as before; no regression |
| 4.1.2 | Evidence_met condition unaffected | `evidence_met()` condition is used by all department report functions | Execute a function using `continue_until: evidence_met` | Function completes on evidence as before; no regression |
| 4.1.3 | Tool_observed condition still works | `tool_observed(dispatch)` is used by existing functions | Execute a function using `continue_until: tool_observed(dispatch)` | Function completes on tool observation as before |
| 4.1.4 | Existing observe specs without when_args fire unconditionally | All pre-signal observe specs lack `when_args` | Trigger a tool-after event matching the observe spec's `tool` field | Observer fires unconditionally (backward compatible — see 1.2.7) |
| 4.1.5 | capture_artifact still works | Pre-signal observe specs use `capture_artifact` | Write a recognized fence in the assistant message | Artifact captured as before; no regression from `capture_payload_as` additions |
| 4.1.6 | turn_count condition unaffected | Some functions use `turn_count` in continue_until or transitions | Execute function with `continue_until: turn_count >= 3` | Function completes at correct turn count |

### 4.2 Already-Complete Function Protection

Verify that signals on already-completed functions are handled correctly — no state corruption, no re-activation, no error spam.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 4.2.1 | Signal on already-complete function | Function in `"complete"` phase (via artifact, signal, or cap) | `signal(type="answer")` | No error returned; no state change; function remains `"complete"` |
| 4.2.2 | Signal with payload on complete function | Function in `"complete"` phase | `signal(type="handoff", payload={target: "jinyiwei"})` | Signal recorded in ledger (for parent observation) but does not reactivate function |
| 4.2.3 | Multiple signals on complete function | Function in `"complete"` phase | `signal("answer")` repeated 3 times | No error accumulation; no memory leak; all recorded in ledger silently |

### 4.3 Edge Cases

Exercises boundary conditions that the architecture must handle correctly.

| # | Test Case | Setup | Action | Expected Outcome |
|---|-----------|-------|--------|------------------|
| 4.3.1 | Empty object payload `{}` | ObserveSpec with `capture_payload_as: "data"` | `signal(type="answer", payload={})` | Artifact `data` written as `"{}"`; no error |
| 4.3.2 | Multiple ObserveSpecs match same signal call | Two ObserveSpecs: one with `when_args: {match: {type: "answer"}}` (captures to "spec_a"), another with `when_args: {match: {type: "answer"}}` (captures to "spec_b") | `signal(type="answer", payload={k: "v"})` | Both observers fire (no short-circuit); both artifacts exist |
| 4.3.3 | `when_args` + `when_output` on same spec | ObserveSpec: `{tool: signal, when_args: {match: {type: "answer"}}, when_output: {contains: "signal received"}}` | `signal(type="answer")` returns `"Signal 'answer' recorded."` | Both filters pass (AND logic); observer fires |
| 4.3.4 | `when_args` + `when_output` — one fails | Same setup | `signal(type="blocked")` returns `"Signal 'blocked' recorded."` | `when_args` fails (type mismatch); observer does NOT fire (AND logic) |
| 4.3.5 | Signal type case sensitivity | ObserveSpec: `when_args: {match: {type: "answer"}}` | `signal(type="Answer")` | Observer does NOT fire if type matching is case-sensitive; document the behavior |
| 4.3.6 | Concurrent signals from different functions | Two active functions, each in `any:[signal_observed(answer), ...]` | `signal(type="answer")` | Both functions complete independently; signal ledger is session-wide, not function-scoped |
| 4.3.7 | Signal called in same turn as function activation | Function just activated (phase = active, first turn) | `signal(type="answer")` in the same response message | Function completes on next idle cycle; no race condition |
| 4.3.8 | All 8 taxonomy signal types registered and validatable | Signal tool loaded | Call `signal` with each of the 8 types: `answer`, `need_approval`, `blocked`, `need_clarification`, `handoff`, `progress`, `revise_needed`, `escalate` | All 8 accepted; no unknown-type error |

### 4.4 Safeguard Integrity

Verify that documented safeguards (schemas.md §4, "Safety Backstops" table) are effective under test.

| # | Test Case | Safeguard | Expected Outcome |
|---|-----------|-----------|------------------|
| 4.4.1 | Evidence gate blocks signal completion | `requires_evidence` skips function | Function with unmet evidence does NOT complete via signal (verified in 2.3.1-2.3.4) |
| 4.4.2 | continue_max overrides signal | Cap evaluated before conditions | Function terminates at cap regardless of signal state (verified in 2.4.1, 2.4.3) |
| 4.4.3 | Dual-channel `any` handles either path | Either channel triggers completion | Function completes on first satisfied condition (verified in 2.2.1, 2.2.2) |
| 4.4.4 | Multi-signal independence | Each type tracked separately | `signal_observed(progress)` never satisfies `signal_observed(answer)` (verified in 1.3.3) |
| 4.4.5 | Orphaned signal on complete function | Signal inert on "complete" phase | No re-activation (verified in 4.2.1, 4.2.3) |
| 4.4.6 | Unrecognized signal type rejected | Tool schema validation | Unknown type returns error; not recorded in ledger (verified in 1.1.2) |

---

## 5. Test Execution Order

When implementing the tests above, execute them in this dependency-aware order to avoid false failures from incomplete prerequisites:

| Phase | Scope | Sections | Rationale |
|-------|-------|----------|-----------|
| 1 | Signal tool unit tests | 1.1 | Foundation — all other tests depend on the signal tool working |
| 2 | Condition unit tests | 1.3 | Must verify `signal_observed` before integration tests |
| 3 | Observer filter unit tests | 1.2, 1.4 | `when_args` and `capture_payload_as` must work for integration tests |
| 4 | Integration — completion flows | 2.1, 2.2 | Full pipeline from signal to function completion |
| 5 | Integration — safeguards | 2.3, 2.4 | Evidence gate and continue_max before payload tests |
| 6 | Integration — payload flow | 2.5 | End-to-end payload capture |
| 7 | Role-level configuration | 3.1, 3.2 | Validate emperor role wiring |
| 8 | Role-level smoke test | 3.3 | End-to-end dispatch under real conditions |
| 9 | Regression safety | 4.1–4.4 | Verify nothing broke |

---

## 6. What Is NOT Covered

These areas are deliberately excluded from this strategy document because they belong to a different testing layer or are not yet implemented:

- **Performance/load testing** of the signal ledger under high-frequency signals — belongs in benchmarking, not functional testing
- **Signal type-specific transition behavior** (Patterns A-D in schemas.md §3) — these are *future* patterns not yet wired into actual function files. When implemented, a separate transition-testing strategy is needed
- **Phase 3/4 migration behavior** — the dual-channel migration is currently in Phase 2 (signal-primary, fence fallback). Tests for later phases should be added when those phases are reached
- **Cross-session signal leakage** — signal ledger is session-scoped; cross-session isolation is a kernel concern tested elsewhere
- **Mobile/WebView platform signal behavior** — signal tool behavior on non-desktop platforms is outside the rolebox kernel scope
