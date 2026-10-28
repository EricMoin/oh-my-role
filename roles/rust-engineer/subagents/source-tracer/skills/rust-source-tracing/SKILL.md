---
name: rust-source-tracing
description: Resolve a specific Rust crate, compiler, feature or target behavior question from version-matched primary evidence. Use when a design or review depends on an unresolved external contract.
---

# Rust source evidence

Answer the assigned question against the supplied snapshot. Research can inform a design
before implementation; it cannot certify unwritten code. Load the Source evidence report
contract in `references/schemas.md` and preserve the dispatch's read-only scope.

## Pin the relevant implementation

- Start with the affected crate, call sites, manifest, lockfile, toolchain and target.
  Distinguish a dependency version requirement from the version actually resolved.
- Record enabled features and target conditions when they select different implementations.
  A generic upstream example is not evidence for an unavailable feature or another version.
- Prefer the resolved local or vendored dependency source when available. Otherwise use
  version-matched official crate documentation and upstream source. For library API lookup,
  use Context7's resolve-library-id then query-docs when available; verify the version scope
  and fall back to authoritative sources when coverage is insufficient.
- Trace from the public API to the mechanism needed by the question: delegation, cfg branch,
  ownership/drop path, trait implementation or macro expansion. Stop when the applicable
  contract is supported; do not explore unrelated internals for completeness.

## Explain the evidence and its limits

Separate the documented guarantee from an implementation observation. Cite the actual
file/line and package version, or a version-specific source URL/revision. State which
behavior the evidence supports, including negative results. Never copy an illustrative
line number or fabricate a release tag to make a citation look complete.

When docs and source differ, check version, target and feature selection first. An experiment
may resolve a remaining uncertainty only within the assigned execution scope; otherwise
describe the proposed check and return the exact missing evidence. Compiler success does
not establish soundness, cancellation correctness or runtime portability.

Read-only investigation does not permit modifying source, manifests, lockfiles, fixtures
or git state. An assigned check may write expressly permitted `target/` artifacts; inspect
build-script and command effects before execution. Use existing results or cached source
when a command would exceed those limits. The host determines enforcement; a graph node
does not create a filesystem sandbox.

## Return an evidence report

Set `outcome_id: report`, `kind: source-evidence` and `status: complete` when the assigned
question is answered within its stated scope. Use `status: partial` for unresolved evidence,
and name what is missing and who or what could resolve it. Both statuses settle `report`.

Include the inspected snapshot, question, version scope, actual loaded_skills, findings
with evidence and limits, checks actually performed, and open questions. A disproven
assumption can be a complete investigation. It is still not product acceptance. Do not
repair production code, select downstream gates, or turn unavailable evidence into a pass.
