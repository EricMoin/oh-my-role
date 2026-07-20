---
name: rust-api-gate
description: API gate for Rust API Reviewer. Reviews public API surface minimality, trait coherence, error type design, semver compatibility, documentation completeness, feature flags, MSRV, and naming conventions.
---
# Rust API Gate

## Mission

Confirm that the proposed public API surface is minimal, well-documented, semver-compatible, and follows Rust API design conventions. A crate's public API is a contract with its consumers — every `pub` item, trait bound, error variant, and feature flag is a commitment. This gate ensures that commitments are intentional, documentable, and evolution-friendly.

## Inputs

- Engineering State block from the rust-engineer containing: `public_api_changes` (list of added/removed/changed pub items with semver impact), `cargo_workspace`, `edition`, `msrv`, and `dependencies_affected`.
- Code diff for the change under review, with focus on `pub` items, trait `impl` blocks, `pub use` re-exports, `Cargo.toml` feature flags and dependencies, and `#[doc(hidden)]` annotations.
- Reference documents: `references/rust-domains.md` for the public-api domain detection signals and gate scope; `references/schemas.md` for the gate report contract.
- Optional: `cargo semver-checks` output, `cargo doc --no-deps -D warnings` output, or `clippy::must_use_candidate` output.

## Required Checks

- Public API surface is minimal: every new `pub` item is necessary for the intended use case. Items used only internally are `pub(crate)`.
- Every new `pub` item has a complete doc comment: at minimum a description. For functions: `# Panics`, `# Errors`, `# Safety` sections where applicable. For types: field documentation.
- Error types use `#[non_exhaustive]` to allow adding variants without breaking changes. Error enums with `#[non_exhaustive]` that are likely to gain variants over time.
- Semver impact is evaluated for every `pub` item change: removing or narrowing a `pub` item is a major version bump. Adding a new `pub` item is minor. Internal changes are patch.
- `cargo semver-checks check-release` passes against the previous release (if published) or is reviewed for actionable warnings.
- `cargo doc --no-deps -D warnings` passes with no broken intra-doc links, no missing-docs warnings on `pub` items (if `#![deny(missing_docs)]` is enabled).
- Feature flags form a coherent set: default features represent the common use case, non-default features are optional. No feature enables all others (which would break `--no-default-features` testing).
- MSRV is explicitly declared in `Cargo.toml` under `[package]` or `package.rust-version`, and all code compiles under that MSRV without relying on newer-edition features.
- Trait objects (`dyn Trait`) are used over generics only when dynamic dispatch is genuinely required. Generic parameters are preferred for static dispatch monomorphization with zero-cost abstraction.
- Sealed traits (`pub trait Sealed: private::Sealed`) are used when a trait should not be implemented downstream.
- `#[must_use]` is present on all functions returning `Result`, `Option`, or types where ignoring the return value is likely a programming error.
- New `pub` items follow the crate's established naming conventions (verb phrases for functions, nouns for types, `IntoX`/`FromX`/`AsRef`/`IntoIterator` for conversion traits where applicable).
- Orphan rule / coherence is not violated — no new `impl Trait for ForeignType` that could conflict with future upstream changes.

## Pass Criteria

- **Pass**: Public API is minimal and intentional. All new pub items are documented. Error types use `#[non_exhaustive]` where appropriate. Semver impact is evaluated and acceptable. Feature flags are coherent. MSRV is declared and satisfies. `cargo doc` passes. No orphan rule violations.
- **Fail**: New pub item without doc comment. Error type without `#[non_exhaustive]` that is likely to gain variants. Semver breaking change unacknowledged. Feature flag dependency inversion. Orphan rule violation.
- **Conditional Pass**: Doc comments exist but could have more sections (e.g., missing `# Panics`). `cargo semver-checks` was not run but manual review suggests no breaking changes. MSRV is declared but not checked by CI.

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: api
status: pass | fail | needs-user-input
evidence:
  - "src/lib.rs:23 — pub struct Config added with complete doc comment and #[non_exhaustive]"
  - "Cargo.toml:5 — MSRV 1.75.0 declared; no newer-edition features used"
  - "cargo doc --no-deps -D warnings — 0 errors, 0 warnings"
blocking_issues:
  - "src/lib.rs:35 — pub enum Error missing #[non_exhaustive] — adding variants later would be breaking"
  - "src/lib.rs:42 — pub fn parse_config missing doc comment"
required_revisions:
  - "Add #[non_exhaustive] to pub enum Error in src/lib.rs:35"
  - "Add doc comment to parse_config with # Errors section documenting failure cases"
advisory_notes:
  - "Consider running cargo semver-checks against the last published version before release"
verification: "cargo check -p <crate> && cargo doc --no-deps -D warnings && cargo clippy -p <crate>"
```

## Review Flow

1. Load the Engineering State and identify the `public_api_changes` list — every pub item added, removed, or changed.
2. Review each new pub item for doc completeness, naming conventions, and `#[must_use]` annotation.
3. Check error types for `#[non_exhaustive]` — especially enums that will likely gain variants.
4. Evaluate semver impact: review removed, renamed, or narrowed pub items for breaking changes.
5. Review Cargo.toml for feature flag coherence, MSRV declaration, and dependency changes.
6. If `cargo semver-checks` output is available, review actionable warnings.
7. Compile findings into a gate report with file:line citations.

## Antipatterns to Detect

- **Bare pub**: Items unnecessarily `pub` when `pub(crate)` or `pub(super)` would suffice.
- **Missing #[non_exhaustive]**: Error enum that will gain variants — removing a variant later is a breaking change.
- **Undocumented pub fn**: No doc comment on a public function — consumers must read the source.
- **Feature flag dependency inversion**: Default feature `full` enables all optional features — `--no-default-features` becomes unusable.
- **#[must_use] absence**: Fallible function returning `Result` without `#[must_use]` — caller can silently ignore an error.
- **Missing MSRV declaration**: Crate compiles with latest stable but no MSRV is specified — downstream may fail.
- **Trait object over generics in hot path**: Dynamic dispatch on a hot path when generics would be zero-cost.
- **Unsealed trait**: Public trait that should be sealed to prevent downstream impl conflicts.
