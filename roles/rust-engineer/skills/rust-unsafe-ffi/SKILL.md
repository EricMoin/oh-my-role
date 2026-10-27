---
name: rust-unsafe-ffi
description: Implement Rust unsafe abstractions and FFI boundaries with explicit validity, ownership, layout and unwinding contracts. Use when changing raw memory access or foreign interactions, including safe wrappers over them.
---

# Unsafe abstractions and FFI

Begin with the invariant that safe callers should be able to rely on. Trace every public
constructor, mutation, escape path and destructor that can establish or invalidate it.
A safe-looking caller change can invalidate an unsafe implementation elsewhere.

## Establish a sound boundary

- Prefer an existing safe operation when it expresses the required behavior. If unsafe
  remains necessary, state its precise preconditions and identify which checked input,
  ownership rule or caller obligation establishes each one.
- Check initialization, validity, alignment, bounds, provenance, aliasing and lifetime
  separately. Equal sizes do not prove compatible values, ownership or pointer provenance.
  Use the actual operation's contract; `transmute` and `transmute_copy` have different
  size and ownership requirements.
- `slice::from_raw_parts_mut` is unsafe. Its pointer must be non-null and aligned even for
  an empty slice; the initialized range must lie in one allocation, fit the size limits,
  and support exclusive access for the chosen lifetime. If a foreign API permits null for
  an empty buffer, handle that case before constructing a Rust reference.
- Borrowing foreign memory does not transfer allocation ownership. Reconstruct an owning
  Rust collection only when allocator, allocation layout, length, capacity and ownership
  really satisfy its constructor's contract. Otherwise use the foreign deallocator.
- Track partial initialization and cleanup across each error and panic path. Do not create
  a reference to an invalid value merely to validate it afterward.
- Union fields share storage; Rust does not enforce an active-field tag. Reading a field
  requires a representation valid for that field's type. Maintain a discriminant when the
  surrounding abstraction needs one, and handle destruction explicitly where applicable.
- For address-sensitive `!Unpin` values, preserve pinning's address and destruction
  obligations through all safe operations. Check which fields are structurally pinned
  before projecting or replacing them; the presence of `Pin` alone proves no unsafe code
  correct and does not prevent movement of an `Unpin` value.

## Make the foreign contract explicit

- Match the target ABI, representation, sizes and alignment with the actual foreign
  declaration. `repr(C)` does not make arbitrary Rust fields FFI-safe or define ownership.
- Specify nullability, buffer lengths, encoding, callback retention, reentrancy, thread
  access and destruction order. Validate facts that can be checked; expose an unsafe
  caller contract for obligations that cannot be enforced by a safe entry point.
- Choose a panic/exception policy for the boundary. A Rust panic reaching a non-unwinding
  `extern "C"` boundary aborts; foreign unwinding through an incompatible boundary can be
  undefined behavior. `"C-unwind"` permits unwinding only when both sides support the
  intended contract. Check the target toolchain and panic strategy.
- Use `catch_unwind` when translating Rust unwinding panics is part of that policy. It does
  not catch aborting panics or provide a general foreign-exception boundary. Apply
  `AssertUnwindSafe` only after establishing the state remains usable on unwind.

## Verification and evidence

Keep safety comments close to the operation and describe why the current code satisfies
the obligation. Documentation is evidence of the argument, not a substitute for it.
Exercise valid boundary cases and rejection of invalid inputs through safe wrappers; do
not deliberately violate an unsafe function's preconditions to test its behavior.

Use Miri, sanitizers, ABI/layout checks or a foreign-language integration test for the
specific risk and supported environment. Passing tests cannot prove soundness. Record
unverified foreign behavior, target assumptions and paths unsupported by the chosen tool.

## Sources

- [Mutable slice construction](https://doc.rust-lang.org/std/slice/fn.from_raw_parts_mut.html#safety)
  and [union field reads](https://doc.rust-lang.org/reference/items/unions.html#reading-and-writing-union-fields).
- [ABI unwinding behavior](https://doc.rust-lang.org/reference/items/functions.html#unwinding):
  distinguish Rust panics, foreign unwinding and the selected panic runtime.
