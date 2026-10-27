# Inter-agent contracts (schema_version: 1)

Every role-authored business payload is a JSON object with `schema_version: 1`.
Reject unknown schema versions, missing required fields and unknown ids.

## Engineering brief (prompt-embedded contract)

The brief is embedded in the node prompt; it is not a graph payload. Every
Deep-tier review node carries it, and a Standard-tier node carries the subset its
single risk domain needs. Include only project facts relevant to the decision, and
leave unknown facts explicitly unknown.

| Field | Content |
| --- | --- |
| goal | What the task achieves, in one to three concrete and verifiable sentences |
| user_visible_behavior | What the user or downstream caller observes after the change |
| scope | Affected files, modules, types and functions, prefixed by crate: `crate::module::item` |
| out_of_scope | What explicitly will not change; prevents review scope creep |
| snapshot | Commit plus local diff or artifact identifier; include uncommitted changes |
| risk_domains | Each entry in `unsafe-ffi`, `async-concurrency`, `public-api`, `performance-hotpath`, `cross-platform` |
| cargo_workspace | Workspace root path, member crate paths, and the affected crate(s) |
| edition | `2015`, `2018`, `2021` or `2024`; must match the affected crate's `Cargo.toml` |
| async_runtime | `tokio`, `async-std`, `smol`, `monoio`, `embassy` or `none` |
| unsafe_surface | Every unsafe block, `unsafe fn`, `unsafe trait`, `extern` block and `#[repr(C)]` type in the change, with its justification; present when `unsafe-ffi` applies |
| concurrency_model | Task hierarchy, channel topology, shared-state ownership, lock ordering, cancellation strategy and backpressure design; present when `async-concurrency` applies |
| public_api_changes | Added, removed, renamed or signature-changed `pub` items with their semver impact; present when `public-api` applies |
| performance_context | Baseline measurement if known, hot path description, allocation pattern, I/O boundaries and latency or throughput targets; present when `performance-hotpath` applies |
| cross_platform_context | Target platforms, `#[cfg(...)]` gates, target-conditioned `Cargo.toml` dependencies, build script behavior and the CI target matrix; present when `cross-platform` applies |
| verification_plan | Executable commands, tools, targets and scenarios that verify correctness |
| verification_results | Actual commands and outcomes, plus checks not run and why |
| dependencies_affected | Key crate dependencies touched, version changes and semver-aware notes |
| msrv | Minimum Supported Rust Version for the affected crate(s), `major.minor.patch` |
| open_questions | Optional unresolved intent, environment or API questions; omit if none |

A review request adds the concrete question, the reviewed object (the snapshot or
diff and the artifact paths to inspect) and the read-only scope. A consultation
reports design uncertainty about a frozen revision; it cannot certify compilation,
implementation or tests that do not yet exist.

## Gate report (submitted as accepted outcome data)

Each read-only gate writes this report and submits it as the `data` payload of the
outcome it settles. The report carries `schema_version: 1` and the settled outcome
id, so the accepted result is self-identifying.

| Field | Content |
| --- | --- |
| schema_version | 1 |
| outcome_id | The outcome id this report settles: `pass`, `revise` or `escalate` |
| gate | `safety`, `async-audit`, `api`, `perf` or `cross-platform` |
| status | `pass`, `fail` or `needs-user-input` |
| reviewed_snapshot | The revision or diff actually inspected, including uncommitted changes |
| evidence | File:line, command output, Miri or benchmark output, or documentation citation; distinguish inspected from executed |
| blocking_issues | Concrete failure mechanisms with stable issue IDs; required for `fail` |
| required_revisions | One actionable change per blocker without prescribing incidental implementation |
| advisory_notes | Optional preferences and non-blocking improvements |
| verification | Commands or procedures actually performed, and missing evidence; label proposed checks as proposed |
| engineering_state_patch | Optional proposed corrections to brief facts, merged only by the lead |

`engineering_state_patch` is a role-authored convention rather than an engine
field: it proposes corrections to the prompt-embedded brief, and only the lead
merges them. Nothing in the engine reads or enforces it.

`status: pass` means no supported blocking issue exists in the assigned scope, not
proof of the entire change. Advice with no blocker is a pass with advisory notes;
there is no conditional-pass status. Missing required evidence must be explicit:
never turn inability to assess into a pass. Use `status: needs-user-input` for
unavailable essential evidence or user intent and name who can resolve it; the lead
asks the user only when local investigation cannot resolve it.

The report status maps to the settled outcome as follows:

| Gate report status | Settled outcome |
| --- | --- |
| pass | pass |
| fail with concrete blockers | revise, carrying stable `required_revisions` |
| needs-user-input | escalate, with the smallest missing question or recovery action |

## Outcome vocabulary

Outcome ids are declared per node; the engine accepts the ids a declaration names
and enforces none of them itself, so the table below is a role convention rather
than an engine enum. This role's five gate nodes declare exactly `pass`, `revise`
and `escalate`; the other ids are listed only so a reader of engine state can name
what they mean, and no worker in this role ever submits them.

| Domain | Declared outcomes | Meaning |
| --- | --- | --- |
| Execution | done, failed, blocked, clarification_required, approval_required | Change applied and its local checks recorded; work incomplete; a concrete prerequisite unavailable; a user decision required; an approval request prepared. None of these is a passing report on its own. |
| Review and validation | pass, revise | Required criteria supported in the assigned scope, or concrete correctable defects with stable `required_revisions` |
| Review escalation | escalate | Essential evidence or user intent is unavailable |
| Evidence | report | An assessment completed, including negative findings; not a product verdict |

This role's mapping:

- `safety`, `async`, `api`, `performance` and `cross-platform` are review gates;
  each settles `pass` when no supported blocking issue exists in its assigned
  scope, `revise` for concrete blocking issues with stable `required_revisions`,
  and `escalate` when essential evidence or user intent is unavailable.
- A gate's report status stays closed over `pass`, `fail` and `needs-user-input`,
  while the settled outcome id is `pass`, `revise` or `escalate`: the two are
  separate fields and must agree with the mapping table above.
- This role declares no execution node, no evidence node and no approval node,
  because the lead owns production writes, acceptance and any user approval.
  `done`, `failed`, `blocked`, `clarification_required`, `approval_required` and
  `report` are therefore documented for completeness of this outcome-id space and
  are never submitted by these five read-only gate workers.
- `revise` and `escalate` return findings to the lead. The lead owns the repair and
  any fresh review batch for a changed snapshot, and a settled graph is not
  acceptance of the reviewed change.

## Field Drift Prevention

**Principle**: This document is the single source of truth. No producer
unilaterally changes a contract.

**Before changing any field**:

1. Propose the change here first (add or modify the field table).
2. Update all producers (the lead's node briefs for the Engineering brief, the gate
   skills for the gate report).
3. Update all consumers (the lead for both contracts, since it embeds the brief and
   reads accepted gate reports).
4. If backward-incompatible, version the contract or coordinate a simultaneous
   update.

**If a consumer receives a field not in this document**: reject it — producer error.

**If a producer needs a new field**: add it here first, then implement.

### Conformance Status

| Producer | Contract | Status |
| --- | --- | --- |
| rust-engineer | Engineering brief | Conforms — embedded in every review node prompt per `complexity-model.md` |
| safety-reviewer | Gate report | Conforms — `schema_version: 1` data submitted through `graph_submit_outcome` |
| async-auditor | Gate report | Conforms — `schema_version: 1` data submitted through `graph_submit_outcome` |
| api-reviewer | Gate report | Conforms — `schema_version: 1` data submitted through `graph_submit_outcome` |
| perf-profiler | Gate report | Conforms — `schema_version: 1` data submitted through `graph_submit_outcome` |
| cross-platform-checker | Gate report | Conforms — `schema_version: 1` data submitted through `graph_submit_outcome` |

### Deprecation Policy

1. Mark deprecated fields with `[DEPRECATED]` in the field table.
2. Producers stop emitting deprecated fields within one version cycle.
3. Consumers continue accepting them for one cycle after deprecation.
4. After one cycle, remove from this document. Producers still emitting are
   non-conformant.
