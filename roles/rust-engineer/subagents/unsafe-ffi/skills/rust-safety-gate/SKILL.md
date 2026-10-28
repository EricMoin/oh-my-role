---
name: rust-safety-gate
description: Review changed Rust unsafe operations, safe wrappers and FFI contracts for ownership, validity, aliasing, initialization, pinning and unwind soundness.
---
# Rust Safety Gate

## Establish the soundness argument

Locate the unsafe operation and its reachable callers, including safe methods that can invalidate its assumptions. Record the Rust version, target, representation, panic strategy and foreign contract when they affect the argument. Review the affected invariant, not just the presence of `unsafe` or a safety comment. Read `references/schemas.md` for the report contract.

## Review decisions

- For raw pointers and references, establish provenance, lifetime, alignment, readable or writable extent, initialization and aliasing obligations of the actual operation. A safe wrapper must enforce its preconditions for every allowed safe caller. A comment naming an invariant is evidence of intent, not proof that callers preserve it.
- Check construction, partial failure and destruction together: `MaybeUninit`, `ManuallyDrop`, raw ownership transfers and manual lengths can expose uninitialized values, leaks or double drops. Distinguish resource leaks from undefined behavior. For raw slices, include the zero-length case, allocation boundaries and exclusivity; `slice::from_raw_parts_mut` is itself unsafe, not a safe substitute that establishes those invariants.
- Distinguish `transmute` from `transmute_copy`. `transmute` requires equal-sized types and valid source/destination values; equal size alone is insufficient. `transmute_copy` copies from a reference and need not use equal-sized types, but the source must provide enough readable bytes for a valid destination. The source remains live, so duplicating owning values can cause double destruction. Do not claim that replacing one conversion primitive proves soundness.
- Rust unions have no language-level active field. Reading interprets storage as the selected field's type and requires that value to be valid. A tagged wrapper may impose its own discriminant invariant; check it before the unsafe read, along with initialization and ownership bookkeeping.
- For pin projections, self-reference, global mutability and unsafe `Send`/`Sync` implementations, trace what operations the safe API permits. Show how movement, shared access or concurrent access could violate the stated invariant. Do not infer soundness from a helper crate's presence or from the compiler accepting an unsafe implementation.
- At FFI boundaries, verify layout, calling convention, ownership, pointer lifetime, callback lifetime and thread rules on the supported target. `repr(C)` does not recursively repair incompatible field types or establish a foreign allocator contract. Compare bindings with the actual foreign headers or ABI evidence when necessary.
- Analyze unwinding using both the ABI and panic strategy. With `panic=unwind`, a Rust panic crossing a non-unwinding ABI such as `C` aborts, while an appropriate `C-unwind` boundary permits unwinding. A foreign exception crossing a non-unwinding boundary is undefined behavior. `panic=abort` causes Rust panics to abort regardless of ABI. Check the current reference for native exceptions and mixed runtimes; `catch_unwind` is not a portable foreign-exception handler and cannot catch aborting panics. Require panic containment only where the contract needs it, and do not add `AssertUnwindSafe` without an invariant argument.

## Evidence and verification

Tie each claimed invariant to its enforcement point, safe caller restrictions and relevant target or dependency contract. Use available focused tests, Miri, sanitizers, layout checks or foreign integration tests when they can challenge the specific mechanism. Record which paths and configurations were actually exercised. Miri and tests can find defects; passing them does not prove soundness for all callers, targets or foreign behavior.

Preserve source, manifests, lockfiles and fixtures while reviewing. If an essential foreign ownership rule, callback guarantee or layout cannot be established, investigate the pinned source or authoritative documentation and escalate the exact gap. Do not invent a safety proof to produce a passing gate.

## Verdict

Return gate `unsafe-ffi` using `references/schemas.md` with stable issue ids. Each blocker states the operation, violated invariant, reachable trigger and evidence. Pass for the resolved assigned soundness obligation; revise a demonstrated violation; escalate missing essential contract evidence. Optional cleanup and preferences about conversion helpers belong in advisory notes unless they resolve a concrete failure.

## Authoritative references

Match the project's Rust version and target before applying version-sensitive details:

- [Union field validity](https://doc.rust-lang.org/reference/items/unions.html#reading-and-writing-union-fields): storage interpretation without an active-field model.
- [transmute](https://doc.rust-lang.org/std/mem/fn.transmute.html) and [transmute_copy](https://doc.rust-lang.org/std/mem/fn.transmute_copy.html): distinct size, validity and ownership obligations.
- [from_raw_parts_mut](https://doc.rust-lang.org/std/slice/fn.from_raw_parts_mut.html): raw-slice safety preconditions.
- [ABI unwinding](https://doc.rust-lang.org/reference/items/functions.html#unwinding) and [unwinding across FFI](https://doc.rust-lang.org/reference/panic.html#unwinding-across-ffi-boundaries): panic strategy and native-exception boundaries.
