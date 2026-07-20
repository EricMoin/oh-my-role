---
name: rust-safety-gate
description: Safety gate for Rust Safety Reviewer. Reviews unsafe blocks, FFI boundaries, raw pointer provenance, MaybeUninit, transmute, union, Pin safety, global mutable state, and repr(C) layout correctness.
---
# Rust Safety Gate

## Mission

Confirm that every `unsafe` operation in the proposed change has documented safety invariants, that `unsafe` regions are minimized, and that all FFI boundaries are correctly annotated with the right ABI, catch_unwind guards, and type layout guarantees. Unsafe Rust is the primary source of undefined behavior in production Rust code — this gate exists to ensure every unsafe block is justified, bounded, and auditable.

## Inputs

- Engineering State block from the rust-engineer containing: project facts, `unsafe_surface` description (every unsafe block, unsafe fn, extern block, and repr(C) type in the change), `cargo_workspace` paths, and `edition`.
- Code diff for the change under review, with focus on `unsafe {}` blocks, `extern` blocks, `#[repr(C)]` types, `transmute*` calls, `*const T`/`*mut T` dereferences, and `static mut` declarations.
- Reference documents: `references/rust-domains.md` for the unsafe-ffi domain detection signals and gate scope; `references/schemas.md` for the gate report contract.
- Optional: Miri output (`cargo miri test`), `static_assertions` assertions, or clippy audit results.

## Required Checks

- Every `unsafe` block has an adjacent `// SAFETY:` comment explaining the safety invariant. The comment must state: (1) which precondition is being upheld, (2) why the caller's contract guarantees safety, and (3) any relevant validity or aliasing invariants.
- `unsafe fn` declarations document caller obligations in the doc comment (`# Safety` section) — not just in inline SAFETY comments.
- Raw pointer dereferences satisfy Stacked Borrows / Tree Borrows: the reference derived from a raw pointer must have valid provenance and not alias a mutable reference.
- `transmute`/`transmute_copy` is only used when source and destination types have identical size and valid bit patterns for all values. Prefer type-safe conversions (`From`, `TryFrom`, `bytemuck::Pod`, `zerocopy`) over raw transmute.
- `MaybeUninit<T>` values are not read via `assume_init()` before being written. Partial initialization requires guaranteed drop-skip on all paths.
- `union` field access respects the active field variant. The code must guarantee the accessed field was the last written, with no intermediate destruction.
- `extern "C"` function callbacks are wrapped in `catch_unwind(AssertUnwindSafe(...))` to prevent panic unwinding across FFI boundaries (UB on non-Windows targets).
- `#[repr(C)]` types include `static_assertions::assert_eq_size!` or `static_assertions::assert_eq_align!` to verify layout matches the C counterpart.
- `static mut` is not introduced — prefer `Atomic*`, `OnceLock`, `Mutex<T>` or `RwLock<T>` for global mutable state.
- `Pin` projections are safe: no `unsafe` projection that moves out of a `Pin`-wrapped field. Use `pin-project` or `pin-project-lite` for safe projections.
- Miri is run at least on the safety-affected code paths. If Miri cannot run (e.g., platform-specific code), this is documented in the gate report evidence.
- Unsafe regions are minimized: unsafe blocks wrap only the actual unsafe operation, not entire function bodies. Prefer safe abstractions (safe wrappers) over repeated unsafe blocks.

## Pass Criteria

- **Pass**: Every unsafe block has a documented safety invariant. Unsafe regions are minimal and justified. Miri passes on all unsafe-affected paths. All extern callbacks are unwind-safe. repr(C) layouts are verified. No `static mut` is introduced.
- **Fail**: Missing or insufficient SAFETY comment on an unsafe block. Pointer provenance violation. transmute between types with mismatched sizes. Missing `catch_unwind` on an extern callback. Unsafe block wraps more than the unsafe operation.
- **Conditional Pass**: SAFETY comments are present but terse (could be more specific about call chain guarantees). Miri was not run (justified — platform constraints, documented in advisory_notes). Layout assertions are present but not on every repr(C) type.

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: safety
status: pass | fail | needs-user-input
evidence:
  - "src/ffi/bridge.rs:34 — SAFETY comment documents aliasing contract with C caller"
  - "src/ffi/bridge.rs:67 — catch_unwind wraps extern callback"
  - "cargo miri test -p ffi-bridge — 0 errors"
blocking_issues:
  - "src/parser/unsafe.rs:12 — SAFETY comment missing on unchecked index access"
  - "src/ffi/bridge.rs:43 — transmute from *const u8 to &mut [u8] without provenance guarantee"
required_revisions:
  - "Add SAFETY comment to parser/unsafe.rs:12 explaining why index is in bounds"
  - "Replace transmute with safe from_raw_parts_mut or document aliasing contract in SAFETY comment"
advisory_notes:
  - "static_assertions coverage is partial — consider adding for all repr(C) types"
verification: "cargo miri test -p <crate> && cargo clippy -p <crate> -- -D unsafe_op_in_unsafe_fn"
```

## Review Flow

1. Load the Engineering State and identify the `unsafe_surface` — every unsafe block, unsafe fn, extern block, repr(C) type in scope.
2. For each unsafe block in the diff: verify the adjacent SAFETY comment exists and covers preconditions, invariants, and aliasing guarantees.
3. For each transmute/cast: verify size equivalence and validity of the target bit pattern.
4. For extern blocks: verify catch_unwind on callbacks, verify repr(C) types have layout assertions.
5. Check that unsafe regions are minimized — blocks cover only the actual unsafe operation.
6. If Miri output is available, review for Stacked Borrows, Tree Borrows, or initialization violations.
7. Compile findings into a gate report with file:line citations for every evidence item.

## Antipatterns to Detect

- **SAFETY-free unsafe**: An unsafe block with no SAFETY comment — the reader cannot verify correctness.
- **Overly broad unsafe**: `unsafe { entire_function_body }` when only one line needs it.
- **transmute without size check**: Types have different sizes at compile time or on different platforms.
- **extern callback without catch_unwind**: Panic across FFI boundary is UB on non-Windows targets.
- **No layout assertions for repr(C)**: The C struct layout may differ silently on another target.
- **MaybeUninit assume_init before write**: Reading uninitialized memory is immediate UB.
- **Unsafe fn without Safety section**: Callers cannot know their obligations.
- **static mut introduction**: Always preventable with atomics or synchronization primitives.
