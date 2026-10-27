---
name: rust-api-gate
description: Review Rust API changes for downstream compatibility, usable contracts, error semantics and feature or toolchain commitments. Apply to externally exposed interfaces and intentional contract changes.
---
# Rust API Gate

## Establish the contract

Identify the affected consumers and compatibility promise before reviewing design. A `pub` item in a binary or private module is not automatically a published crate API. Inspect re-exports, callers, the release baseline, `Cargo.toml`, enabled features and the supported Rust version. Distinguish a permitted breaking change from an accidental one.

Read `references/schemas.md` for the shared report contract. Use these criteria for the assigned API risk; do not turn every item into a mandatory redesign.

## Review decisions

- Trace a concrete downstream use when signatures, visibility, lifetimes, trait bounds, associated types or implementations change. Include inference, method resolution, coherence and auto-trait effects where relevant; adding an item or implementation is not always compatible. Avoid widening visibility solely to make tests convenient.
- Check ownership and borrowing against caller needs: who retains data, which lifetimes are coupled, and whether a value must move, be shared or remain local. Generic dispatch, trait objects and concrete types have different extensibility and cost tradeoffs; none is universally preferable.
- Evaluate error variants, conversions, panic behavior and recovery information against the contract. Exhaustive enums are legitimate. `#[non_exhaustive]` is a deliberate evolution choice; adding it to an existing externally usable enum, variant or all-public-field struct can break callers. Do not require it on every public error.
- `Result` already has `#[must_use]`. Require additional annotations only for a meaningful contract not already conveyed by the return type. For custom builders, guards or state transitions, establish what incorrect ignored usage would do.
- Review the actual supported feature combinations, defaults, dependency exposure and MSRV. A `full` feature may legitimately aggregate compatible optional functionality. A feature is a blocker when it breaks promised combinations or behavior, not because of its name.
- Assess documentation where consumers need it to use the API correctly: safety preconditions, panic cases, errors, ownership, examples and valid intra-doc links. Missing prose is material when a contract becomes ambiguous or violates the project's documentation policy; do not demand boilerplate on every symbol.

## Evidence and verification

Use the smallest check that can resolve the claim: inspect a downstream call, compile a consumer example, compare the public surface, run relevant doctests, or use the project's existing compatibility checks. Pin comparisons to an actual prior release or revision and the current working snapshot. A semver tool can detect supported structural changes; it cannot prove behavioral compatibility.

Select Cargo package, target and feature flags from project evidence. Preserve manifests and lockfiles. For a rustdoc warning check, warnings are configured through `RUSTDOCFLAGS`, not a bare `cargo doc -D` option. Do not claim missing-doc coverage unless the corresponding lint was enabled. Treat unavailable optional tooling separately from an unresolved compatibility question.

## Verdict

Return gate `api` using `references/schemas.md`; keep stable issue ids when reviewing a revision. Each blocking issue links a file or observed check to a specific broken consumer or contract and states the required result. Pass with scoped evidence when the assigned compatibility risk is resolved; revise for a demonstrated violation. Escalate essential unknowns such as an unavailable release baseline or undecided compatibility promise. Preferences about naming, dispatch style or future extensibility belong in advisory notes unless they cause an evidenced failure.

## Authoritative references

Use documentation matching the project's versions when applying these rules:

- [Cargo SemVer compatibility](https://doc.rust-lang.org/cargo/reference/semver.html): downstream breakage, trait changes and retroactive `non_exhaustive`.
- [Cargo features](https://doc.rust-lang.org/cargo/reference/features.html): feature composition and dependency activation.
- [Result must be used](https://doc.rust-lang.org/std/result/index.html#results-must-be-used): existing `must_use` behavior.
- [Cargo environment variables](https://doc.rust-lang.org/cargo/reference/environment-variables.html): `RUSTDOCFLAGS` and tool configuration.
