---
name: rust-cargo-platform
description: Change Rust Cargo workspaces, dependency features, build scripts, macros and target support without losing compatibility. Use for manifest, toolchain, feature-resolution, generated-code or cross-compilation work.
---

# Cargo and platform boundaries

Read the affected manifests, workspace inheritance, lockfile, toolchain configuration and
CI commands. Establish supported compiler versions, editions, targets and feature sets
from the project rather than inventing a universal build matrix.

## Dependency and feature decisions

- Separate a package's version requirement from the version actually resolved. Identify
  which consumers and dependency edges request a feature before changing its definition.
- Cargo unifies features within the relevant resolver context. Features should normally
  add capabilities; disabling defaults on one dependency edge does not negate features
  another edge enables. An aggregate `full` feature is valid when its combinations work.
- Check optional-dependency exposure, target-conditioned dependencies and dev/build
  dependencies against the selected resolver. A successful workspace build can conceal
  a member that depends accidentally on another member enabling a feature.
- Preserve intended lockfile changes and avoid unrelated updates. Use the project's
  reproducibility options when checking an unchanged dependency graph. Explain a required
  resolution change rather than removing constraints to make the build pass.
- Evaluate MSRV and edition separately. A syntax feature, standard-library API, dependency
  release or build dependency may raise the effective MSRV. Test with the actual supported
  toolchain when making a compatibility claim.

## Host, target and generated code

- A build script and procedural macro execute for the host; the produced library or binary
  may target a different platform. In `build.rs`, `cfg!` and `#[cfg]` inspect the host.
  Read `TARGET` or `CARGO_CFG_*` for the target configuration.
- Put build outputs in Cargo's `OUT_DIR` and declare relevant file/environment rerun inputs.
  Avoid overwriting checked-in source as an incidental build step. Keep generation and its
  source of truth clear, including the foreign header or schema version.
- Use `#[cfg]` for conditional compilation when the branch contains target-only names.
  `cfg!` produces a boolean; it does not remove an otherwise invalid branch from compilation.
- Trace macro diagnostics to their invocation, input and generated expansion. Verify the
  expansion path and target environment before changing unrelated caller code or adding
  broad lint suppression.
- Review representation and serialized formats separately from native pointer width.
  Converting a 32- or 64-bit `usize` to `u64` does not truncate; narrowing conversions, unchecked
  size arithmetic and conversion from wire lengths to `usize` can require validation.
- Use the selected target's APIs and link inputs. Successful host compilation says nothing
  about code that the host configuration excluded.

## Verify the supported combinations

Choose representative default, no-default and relevant feature combinations based on the
affected dependency edges and CI contract. `--all-features` tests one feature combination
for the selected target; it neither enables every target branch nor tests missing features.
Mutually exclusive supported configurations require separate checks.

Distinguish target type checking, linking, executable tests and runtime behavior. Cross
compilation may require a linker, SDK or runner; report the unavailable stage precisely.
For `no_std`, test the actual target and allocation assumptions instead of inferring them
from a host test binary that links `std`.

## Sources

- [Cargo feature unification](https://doc.rust-lang.org/cargo/reference/features.html#feature-unification)
  and [build script inputs](https://doc.rust-lang.org/cargo/reference/build-scripts.html#inputs-to-the-build-script).
- [Numeric casts](https://doc.rust-lang.org/reference/expressions/operator-expr.html#numeric-cast):
  distinguish widening from truncation and validate the format's intended range.
