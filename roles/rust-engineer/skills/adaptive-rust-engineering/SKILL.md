---
name: adaptive-rust-engineering
description: Runtime decision heuristics for the Rust engineer — classifies tasks by tier, selects gates, applies budget escalation, and enforces Rust-specific verification. Activated by the engineer function on every non-trivial dispatch.
---

# Adaptive Rust Engineering — Runtime Decision Heuristics

## Purpose

When the `rust-engineer` receives a task, this skill governs every runtime decision that sits *between* tier classification (see [complexity-model.md](../../references/complexity-model.md)) and implementation. It answers:

- Which gates, if any, do I dispatch?
- Do I need an EngineeringState document?
- What verification do I run after implementing?
- What do I do when budget runs out or a gate times out?
- What mistakes should I watch for?

The tables and rules below are consulted in real time during the `engineer` function's execution loop. They do not replace the tier classification model — they operationalise it.

---

## 1. Decision Matrix: Tier × Gate × EngState × Verification × Budget

Each row is a tier. Columns answer the four runtime questions plus the budget cap from [complexity-model.md](../../references/complexity-model.md).

| Tier | Gate Selection Rule | EngineeringState Required? | Minimum Verification Surface | Max Gates | Effort Proxy Caps | Delay Budget |
|------|---------------------|---------------------------|------------------------------|-----------|-------------------|--------------|
| **Quick** | Never dispatch a gate. Handle all review inline. | Never. Use the task description as sole context. | `cargo check` on the affected crate. No tests, no Clippy, no docs. | 0 | ≤5 tool-calls, ≤2 revise rounds, 120s dispatch timeout | <30s |
| **Standard** | Dispatch exactly 0 or 1 gate. Use risk-domain signals (see [rust-domains.md](../../references/rust-domains.md) Detection Signals) to decide which. If 0 domains fire → downgrade to Quick. If 1 fires → dispatch that gate only. If ≥2 fire → dispatch the highest-priority gate only. | Never. Do not create an EngineeringState for Standard tier. | `cargo check` on the affected crate + **`cargo test` focused tests** (`cargo test -p <crate> <filter>`). | 1 | ≤20 tool-calls, ≤2 revise rounds, 120s dispatch timeout | <3 min |
| **Deep** | Dispatch 0–3 gates. Build an EngineeringState from workspace facts, then select gates based on `risk_domains` (see [schemas.md](../../references/schemas.md) EngineeringState schema). Dispatch in priority order (see [rust-domains.md](../../references/rust-domains.md) Priority Dispatch Logic). Independent gates may run in parallel. | **Required.** Create an EngineeringState document (`` ```engineering_state `` inside `` ```result ``) before any gate dispatch. | `cargo check --workspace` (exit 0) + **`cargo test --workspace`** (all pass) + **`cargo clippy --workspace -- -D warnings`** (exit 0) + domain-specific tools (Miri, semver-checks, criterion, cross-target checks). | ≤3 | ≤40 tool-calls, ≤2 revise rounds, 120s dispatch timeout | <15 min |

Tool-call count is a proxy for effort, not a hard budget. Exceeding caps triggers an explicit report rather than halting.

### Matrix Interpretation Rules

1. **Tier is the independent variable.** It is determined by the [complexity-model.md](../../references/complexity-model.md) tier classification model before this matrix is consulted.
2. **The matrix determines what the engineer must do**, not what it may do. These are minimum requirements.
3. **Verification compounds downward**: Deep includes all Standard checks plus Clippy and workspace-wide testing; Standard includes all Quick checks plus focused tests.
4. **The EngineeringState column is absolute**: if Deep, you *must* create one; if Quick or Standard, you *must not*.

---

## 2. Gate Skip Rules

### 2.1 Missing Trigger Signal → Skip the Gate

A gate is only dispatched when its risk domain's mechanical grep commands return matches. Consult [rust-domains.md](../../references/rust-domains.md) per-domain `### Mechanical Detection` subsections for the exact rg/grep commands.

**Rule**: A gate is skipped when the corresponding mechanical grep commands in [rust-domains.md](../../references/rust-domains.md) return zero matches. Classification is based on objective grep output, not subjective self-assessment. If zero matches fire for a domain, do **not** include that domain in `risk_domains`, and do **not** dispatch its gate. Performing a safety review when the `unsafe-ffi` mechanical commands return zero matches wastes budget.

**Example**: The mechanical grep commands for `unsafe-ffi` return zero matches (no `unsafe` token, no `extern` block, no `#[repr(C)]` type), but the `public-api` commands match a new `pub fn` → `unsafe-ffi` domain is not fired; the safety-reviewer is skipped. Only `public-api` fires; the api-reviewer is dispatched.

### 2.2 Standard Tier: Single-Domain Match → Only That Gate

When exactly one risk domain fires for a Standard-tier task:

**Rule**: Dispatch that single gate only. Do not check for additional latent risk — the tier constraints (≤3 files, no `unsafe`/FFI/performance/cross-platform) already bound the scope.

**Example**: Standard task adds a `pub` item to an internal crate with no other risk signals → dispatch api-reviewer only. No safety-reviewer, no async-auditor.

### 2.3 Standard Tier: Zero-Domain Match → Downgrade to Quick

When zero risk domains fire for a Standard-tier task, the tier was over-classified:

**Rule**: Automatically downgrade to Quick tier verification. Run `cargo check` only. Do not dispatch any gate. Log the downgrade as an advisory note to the user.

**Example**: A Standard-tier task renames an internal module (≤3 files, no `pub` change, no `unsafe`, no concurrency, no perf, no cross-platform). No domains fire. Downgrade to Quick: `cargo check` only, no test run, no gate dispatch.

---

## 3. Effort Cap Escalation Rules

### 3.1 Tool-Call Cap Exceeded

When the cumulative tool-call count exceeds the tier's effort proxy cap (from [complexity-model.md](../../references/complexity-model.md) §3):

**Rule**: Pause execution and emit `signal(type="escalate", payload={"reason": "tool-call cap exceeded", "tier": "<tier>", "cap": <cap>, "consumed": <count>, "phase": "<current phase>"})`. Exceeding the cap triggers an explicit report rather than halting.

After emitting the escalation signal:

- If the engineer has **not yet started implementation**: recommend the user re-classify to a higher tier or split the task.
- If the engineer **is mid-implementation** and the escalation is due to gate overhead: complete the current gate report, then stop dispatching new gates. Self-review the remaining concerns in an advisory note and include gaps in the final report.
- If the engineer **is verifying** and the escalation is due to a long test suite: truncate verification to the subset that has already passed. Report "Full verification truncated due to effort cap — see gaps below."

### 3.2 Gate Dispatch Timeout

The unified dispatch policy governs all gate dispatch mechanics: Standard tier uses synchronous single dispatch (`run_in_background=false`, `timeout_ms=120000`); Deep tier uses async parallel dispatch for independent gates (`run_in_background=true`, `timeout_ms=120000`), with the `safety-reviewer` as a serial lead when `unsafe-ffi` is present. All gate dispatches carry a 120s timeout (`timeout_ms=120000`). When a dispatched gate times out without returning a report:

**Rule**: Do not retry. Log the timeout, perform a self-review of the gate's scope using only the engineering state and available tooling (code audit, `cargo check`, `cargo clippy`), and annotate the final report with a `gate_timeout_gap` section listing what the gate would have checked but could not.
- **For sync dispatches** (`run_in_background=false`): the timeout is raised as an error. Report residual risk and proceed — do not block the workflow on a gate failure.
- **For async dispatches** (`run_in_background=true`): the timeout is detected when collecting results. Report residual risk and proceed.
**Template for gap note**:

```
Gate timeout: <gate-name>
  └─ What was missed: <concrete checks the gate would have performed>
  └─ Self-review substitute: <what you manually checked>
  └─ Residual risk: <what remains unchecked>
```
---

## 4. Verify-Fix Micro-Loops — Bounded Revise Rounds

Every gate report integration follows a bounded revise cycle:

- **Max 2 revise rounds per gate**: after the initial gate report, if the status is `fail`, apply `required_revisions` and optionally re-dispatch for re-verification (using `session_id` for continuation). If the second re-verification also returns `fail`, do NOT loop further.
- **Residual risk reporting**: when the 2-round limit is reached without a pass, report residual risk explicitly and proceed with self-review rather than continuing to revise. The final report must include a `verify-fix_gap` subsection listing what could not be resolved.
- **Pass or needs-user-input**: on `pass`, proceed to implementation. On `needs-user-input`, stop and ask the user — do not proceed until they respond.

This bounded loop prevents infinite revision cycles while keeping the user informed of remaining risk. The ≤2 revise round limit is encoded in the Effort Proxy Caps for all three tiers (see the Decision Matrix at §1).

---

## 5. Rust-Specific Verification Heuristics


| Tier | Minimum Verification | Rationale |
|------|----------------------|-----------|
| **Quick** | `cargo check` on the affected crate. | Type-checking catches ~95% of Quick-tier errors (typos, borrow-checker nits, wrong method signatures). Compilation time is typically <10 s for a single crate. |
| **Standard** | `cargo check` on the affected crate + **`cargo test -p <crate> <filter>`** (exit 0, focused tests). | Standard-tier changes may introduce logic errors that type-checking alone does not catch. Focused tests validate the changed path without running the full workspace. |
| **Deep** | `cargo check --workspace` (exit 0) + **`cargo test --workspace`** (all pass) + **`cargo clippy --workspace -- -D warnings`** (exit 0) + domain tools. | Deep-tier changes have cross-crate blast radius. Clippy with `-D warnings` catches common Rust correctness issues (unnecessary clones, needless borrows, `await` holding locks). Domain tools (Miri, semver-checks, criterion, cross-target check) cover the specific risk. |

### When Verification Fails

| Failure | Action |
|---------|--------|
| `cargo check` fails | Fix the type/borrow error immediately. Do not proceed to tests. |
| `cargo test` fails | Investigate the failed test output. If it is a pre-existing failure unrelated to your change, document it and proceed. If it is a regression, fix before proceeding. |
| `cargo clippy` with `-D warnings` fails | Read each warning. Fix or suppress with an `#[allow(...)]` annotated with a justification comment. Do not ship Clippy warnings in Deep-tier changes. |
| Domain tool fails (Miri, semver-checks, etc.) | Treat as a blocking gate failure. Revise the code and re-verify. |

---

## 6. Anti-Patterns

### 5.1 Premature Gating — Dispatching a Gate for a Documentation-Only Change

**Symptom**: A PR that only adds doc comments to a `pub fn` triggers a dispatch to `api-reviewer` or `safety-reviewer`.

**Why it is harmful**: Gate dispatch costs tool-call budget and delays the user. Dispatching a gate on a change that touches no code, no signatures, and no `unsafe` blocks wastes effort.

**Detection**: The mechanical grep commands for every domain in [rust-domains.md](../../references/rust-domains.md) (see each domain's `### Mechanical Detection` subsection) return zero matches. For doc-only changes, `public-api` signals fire only if a `pub` item's *signature* changes — doc comments do not count.
**Fix**: Classify doc-only changes as Quick (or Standard only if >1 file of docs). Never dispatch a gate. Run `cargo doc --no-deps` to check for broken intra-doc links instead.

### 5.2 Gate Evasion — Adding `spawn_blocking` Without Dispatching to `async-auditor`

**Symptom**: A Standard-tier change introduces `tokio::spawn_blocking` in an async context. The engineer notices the signal (`spawn_blocking` is in the `async-concurrency` detection signals table in [rust-domains.md](../../references/rust-domains.md)) but rationalises "it is just one call, I will review it myself" and skips the gate.

**Why it is harmful**: `spawn_blocking` interacts with tokio's blocking thread pool, task priority, and backpressure. A misconfigured `spawn_blocking` call can exhaust the blocking pool and cause all other blocking tasks to queue indefinitely. The async-auditor is specifically trained to catch these patterns.

**Detection**: Count the number of detection signals that fired for each domain. If ≥1 signal fires for `async-concurrency`, you *must* dispatch the gate for Standard tier (single gate) *or* include `async-concurrency` in `risk_domains` for Deep tier.

**Fix**: Always dispatch the gate when the detection signal fires. Do not substitute self-review for domain-specialist review unless the gate has timed out (see §3.2).

### 5.3 Over-Gating — Dispatching 5 Gates for a 2-Line Change

**Symptom**: A 2-line change that adds `#[must_use]` to two `pub fn` returns triggers a full Deep-tier workflow with 5 parallel gates.

**Why it is harmful**: The tier classification rule in [complexity-model.md](../../references/complexity-model.md) §1 would classify this as Quick (≤1 file, no `unsafe`/FFI/concurrency). But the engineer over-classifies to Deep because the `pub` keyword appears, triggering a cascade of unnecessary gates.

**Detection**: Check the change against the Quick tier constraints: ≤1 file, no `unsafe`, no FFI, no concurrency, no perf hotpath, no cross-platform. If all constraints hold and the change is ≤1 file, it is Quick — regardless of whether `pub` items appear.

**Fix**: Trust the tier classification model. The presence of `pub` does not automatically make a change Deep — it is one *signal* among many, and Quick-tier constraints explicitly allow `pub` items as long as visibility stays unchanged (adding `#[must_use]` does not change visibility). Stay at Quick tier; no gates.

### 5.4 Cap Denial — Ignoring Tool-Call Escalation and Continuing

**Symptom**: The engineer has consumed 35 tool-calls on a Standard-tier task (cap: 20). Instead of escalating, it continues dispatching gates and refining the approach, burning more effort.

**Why it is harmful**: Effort proxy caps exist to bound latency and cost. Ignoring the escalation rule produces unpredictable behaviour for the user and starves concurrent tasks.

**Detection**: Track cumulative tool-calls per `engineer` activation. When tool-calls hit the tier's effort proxy cap, the escalation rule in §3.1 fires automatically.


---

## 7. Runtime Decision Flow

When the engineer function activates, the classification decision tree at
[complexity-model.md](../../references/complexity-model.md) §4 is the sole
canonical source for tier classification, including the mechanical scan
pre-step (§4.1), the tier tree (§4.2), and mid-execution re-classification
rules (§4.3). Consult that document for the complete decision flow, then
apply the Decision Matrix (§1) and budget escalation rules (§3) of this
skill to operationalise the tier.

---

## 8. References

| Reference | Role in This Skill |
|-----------|--------------------|
| [complexity-model.md](../../references/complexity-model.md) | Tier classification model, effort proxy caps, Quick/Standard/Deep constraints |
| [rust-domains.md](../../references/rust-domains.md) | Risk-domain detection signals, domain-to-gate mapping, dispatch priority, gate scope and tools |
| [schemas.md](../../references/schemas.md) | EngineeringState schema (Deep tier only), GateReport schema, producer-consumer contracts |
