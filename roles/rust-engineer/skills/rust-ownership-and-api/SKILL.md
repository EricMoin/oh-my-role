---
name: rust-ownership-and-api
description: Resolve Rust ownership and lifetime problems and design API boundaries, error types and trait contracts. Use when changing who owns data, how callers borrow it, or what a crate exposes.
---

# Ownership and API boundaries

Start at the failing operation and its callers. Identify the owner, each borrow, the
last use, and the lifetime the result must actually survive. Read the diagnostic before
choosing a type or adding an annotation.

## Choose the ownership contract

- Borrow for temporary access, move for transfer, and share ownership only when multiple
  consumers independently need the value. A clone can be the correct independent snapshot;
  justify its semantics and cost rather than banning it or using it to silence an error.
- Shorten a borrow or separate read and write phases when the algorithm permits it. When
  mutating a collection while iterating, establish whether iteration covers the original
  entries or newly added entries before changing the loop.
- A lifetime annotation describes a relationship; it does not extend storage. A reference
  into a temporary usually needs a longer-lived owner or an owned result. Do not add
  explicit lifetimes to an already valid elided signature as a substitute for reading
  the caller.
- Use interior mutability when mutation through shared access is part of the abstraction.
  Account for runtime borrow failure, synchronization, poisoning and reentrancy where they
  apply. `Arc` shares ownership; it does not make the contained operations thread-safe.
- Taking a value with `mem::take`, draining a collection, or moving state into a task changes
  what remains on error, panic or cancellation. Define that state before choosing the idiom.

## Keep the public contract intentional

- Choose visibility from real production consumers. Preserve private helpers; do not add
  accessors or widen visibility solely to satisfy a test. Extract a collaborator only when
  it has a meaningful responsibility and an independently useful contract.
- Accept a slice or other borrowed view when collection ownership is unnecessary. Check
  downstream compatibility before changing an established public signature.
- Choose generics, an enum or dynamic dispatch from extensibility, heterogeneous storage,
  compilation cost and runtime needs. No one representation is universally preferable.
- Preserve error context and distinctions that callers need to recover. Follow the crate's
  existing error strategy; a new error dependency or conversion layer needs a concrete use.
- Decide whether consumers should exhaustively match an error or enum. `#[non_exhaustive]`
  is an evolution choice, and adding it to an already exhaustive public type can break
  callers. `Result` already carries a must-use obligation; extra annotations need a reason.
- Inspect re-exports, trait implementations and auto traits as well as `pub` declarations.
  Adding bounds, changing inference, changing feature behavior, or changing `Send`/`Sync`
  can affect consumers even when the function name stays the same.

## Verify the changed contract

Exercise the caller scenario that motivated the change, including error and lifetime
boundaries. Use a downstream compilation example or the project's compile-fail mechanism
when the contract is what must or must not compile. Run affected behavior tests when the
algorithm changes; successful type checking does not establish the intended result.

For a published API, compare with the supported baseline and the project's compatibility
policy. Documentation and examples should explain ownership, errors, panics and safety
where applicable. Check exact compiler/library versions before relying on newer language
features or version-sensitive trait behavior.

## Sources

- [Lifetime elision](https://doc.rust-lang.org/reference/lifetime-elision.html): inferred
  lifetime relationships, useful when deciding whether an annotation changes anything.
- [Cargo SemVer guidance](https://doc.rust-lang.org/cargo/reference/semver.html): evaluate
  changes against actual downstream usage and the crate's declared compatibility policy.
