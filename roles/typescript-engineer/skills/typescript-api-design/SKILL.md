---
name: typescript-api-design
description: Design and review consumer-facing TypeScript signatures, inference, overloads and compatibility. Use when adding or changing an intentional API; ordinary internal exports do not automatically require a public-package review.
---

# Consumer-facing API design

## Start with real call sites

Identify the consumers and the supported contract: application modules, internal workspace
callers or external package users. Write representative calls before inventing abstractions.
Consider ordinary calls, invalid inputs, callback implementations and inferred results.
Keep the surface as small as the use case allows without redesigning unrelated exports.

Prefer a simple signature with a readable result. Use a generic to preserve a relationship
between inputs and outputs; an explicit generic return annotation can preserve that
relationship just as well as inference. Use an options object when optional controls or
argument ordering become unclear, following the project's conventions.

Choose a union parameter when callers receive the same result shape; a discriminated union
when options must remain correlated; overloads when distinct call forms benefit from distinct
results. Check union-valued callers and overload order. The implementation signature is not
an additional public overload, and a new overload can change resolution of existing calls.

Name public types when doing so improves documentation or error messages. Preserve useful
literal inference. Do not introduce recursive type machinery merely to avoid an explicit
argument or a small runtime check.

## Explore meaningful alternatives when the contract is unsettled

For a consequential API design choice, use [candidate comparison](references/compare-api-candidates.md).
Compare different ownership or interaction models against the same caller cases before
implementation. The parent places investigation candidates and a join-all selection node
in the existing graph; source-writing starts only after a design is selected. Skip this
stage for a fixed signature or a local bug whose contract is already known.

## Behavior is part of the contract

Specify defaults, mutation/ownership, sync versus async behavior and errors when they are
not obvious from the signature. Accept readonly inputs when the implementation only reads
them. Match the existing throw/result convention; changing it is an API change.

If an API promises rejection-based errors, ensure failures before the promise is created
also follow that contract. Distinguish absence, invalid input and operational failure where
callers need different behavior. Validate untrusted input at the appropriate boundary;
a declaration is not proof that a network payload or parsed file matches it.

## Compatibility depends on how a type is used

Compare old and new consumer examples and, for published libraries, emitted declarations.
A textual declaration diff identifies candidates; it does not by itself classify a break.

| Change | Consumer risk to examine |
|---|---|
| Widen function input | Often accepts old calls, but generic inference/overload selection may change |
| Narrow function input or add required argument | Previously valid callers may fail |
| Widen returned union | Readers and exhaustive switches may need new handling |
| Narrow return type | Often safe for readers; mocks, implementers and shared exported aliases may break |
| Add required object member | Producers/implementers may break even if readers benefit |
| Add optional member | Existing same-named members, unions and inference may conflict |
| Change callback parameter | Check the consumer's implementation direction under relevant variance rules |
| Change exports, module format or compiler floor | Consumers may fail without a source-level API change |

Do not label every narrowing as breaking or every addition as safe. Compile representative
old consumers, examine assignability in the direction they rely on, and inspect runtime
behavior. Mark unresolved compatibility as uncertain with the missing evidence.

Follow the package's compatibility and release policy, including pre-1.0 rules and supported
TypeScript versions. If a break is requested, implement it with the relevant migration
notes. If preserving compatibility is required, keep an adapter/deprecated entry point when
practical. Do not invent a mandatory deprecation duration or require a new approval for an
already requested redesign.

## Verification and documentation

Use existing API/type tests to pin valuable inference and invalid-call behavior. Check built
declarations when that is what consumers receive; a source alias can conceal a declaration
emit or resolution defect. Packaging tests belong with module/export changes, not every
internal function edit.

Document surprising preconditions, error behavior and migration paths beside the API.
Examples should compile when a checked example mechanism exists. Avoid comments that only
repeat the signature. Report concrete compatibility findings and evidence, not a ceremonial
public-surface checklist.
