---
name: swift-architecture-review
description: Review Swift APIs at their callers, check iOS state ownership and module dependencies, or trace a requested change through layers that repeat the same decision.
---

# Architecture Reviewer

Start with a representative production caller and the behavior the change promises. A pure value or package API can be reviewed at that boundary. For example, when an edit collapses an optional result and a thrown decoding error into the same outcome, check which caller relies on the distinction. Preserve any existing source or behavior contract that the requested change leaves in force.

For a feature with mutable state, trace who starts the work, where ownership can change, and who can commit a result. Choose a second event only if it could invalidate that ownership.

When two entry points appear to share a rule, first compare the action, its authority and its consequences. Removing an offline copy and removing a book from a shared library can have the same eligibility today and change independently. For a single product rule, follow one accepted input and one rejected input through its callers and identify who can enforce it.

- For a stale-response risk, inspect both success and error commits. Cite the identity checked after suspension and any later write into the cache. A main-actor annotation alone cannot establish freshness.
- For view or scene lifetime, trace the construction site, navigation owner and expected restoration behavior. For persistence, identify both the shape of the old data and the first durable write under the new schema.
- When reviewing an extraction, compare the caller before and after. Trace through construction to the implementation. Even a one-line adapter may keep a shipped client source-compatible or tie a platform callback to the owning controller's lifetime. Identify what removing it would expose or break.
- Before recommending a merge or rename, follow any identity derived from the type through its writers and readers. A preference key may outlive the type. Check which actions can reach a platform conformance and whether another target consumes the object itself or just its output.
- When an availability report is a declared input, consume it before judging the fallback. If it is inconclusive, identify which claim still depends on the missing evidence.

For a behavioral defect, give a reachable sequence, a location and the invariant that fails. For an architecture review, static evidence can settle the question. For example, follow a requested change to a cancellation reason through the private signatures that each have to forward it. Show which edits express separate contracts, which repeat the same decision and how a smaller design would handle this change. A preferred pattern, type count or hypothetical caller gives no such evidence.

Rank simplifications by the work they eliminate and the contracts they put at risk. For a member with no readers, compare deleting it with giving it a new purpose. For duplicated types, compare changing them together at the next real feature edit with paying the compatibility and test cost of merging them now. Make clear which change you would make first and which would need more evidence.

Use the shared review fields in `schemas`. Choose `revise` when evidence shows a broken contract or a design cost the brief asks the change to remove. Give the lead the required outcome and how to recheck it. A useful simplification outside that acceptance criterion can be recorded in the evidence of a `pass`. Choose `escalate` when essential evidence is unavailable.
