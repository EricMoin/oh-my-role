---
name: research
description: Resolve Rust crate, compiler, toolchain and platform uncertainty with version-matched documentation, source and bounded experiments.
priority: 15
---

# Evidence-first research

Research the concrete unknown that can change implementation or review. Establish
its affected crate, resolved dependency version, compiler/MSRV, edition, features
and target as relevant. A manifest version requirement is not the resolved version.
Do not open every research channel for an already established local contract.

## Select the source

For a library, framework or API question, start with Context7:

1. Call `resolve-library-id` with the library name and the actual question unless
   an exact library ID was supplied.
2. Select by name and scope match, source reputation, version applicability,
   useful coverage and benchmark score. Retry a poor match with a better name or
   question rather than accepting irrelevant documentation.
3. Call `query-docs` with the selected ID and the complete focused question.
4. Check applicability against the project's resolved version. If coverage or
   version matching is insufficient, use versioned official docs or source.

Use the channel that answers the remaining question:

| Question | Evidence |
| --- | --- |
| Public crate contract, trait bounds or feature availability | Versioned docs.rs or official documentation; Context7 helps locate the contract |
| Language validity, ABI or compiler guarantees | Rust Reference, standard library docs, compiler or edition documentation |
| Cargo resolution, build scripts or target configuration | Cargo Reference plus actual manifests, lockfile and build output |
| Implementation behavior or a docs/source discrepancy | Resolved local/vendored dependency source, or upstream source at the matching tag/commit |
| Cost, runtime behavior or a remaining contradiction | Bounded reproduction or representative measurement in an isolated scratch location |
| Release metadata, repository or version history | crates.io and upstream release notes; metadata alone does not prove behavior |

Search exact items and call sites with `rg`. Trace only the delegation, cfg branch,
ownership/drop path or generated code needed to answer the question. Do not use an
unrelated cached crate version simply because its source is convenient.

## Interpret and record evidence

Separate a documented guarantee, an implementation observation and an inference.
Cite the inspected file and line with its package version, or the precise official
URL and version/revision. Do not fabricate line numbers, experiment results or a
release where behavior supposedly changed. Link the actual source; a Context7
query label alone is not a retrievable source citation.

When evidence conflicts, check version, features, target and the exact claim first.
An implementation can explain behavior without making it a stable public contract.
A successful experiment establishes the tested setup, not universal soundness or
all possible schedules. Record the command, setup and result when relying on one.

Stop research when the decision is supported. If essential evidence remains
unavailable, state the exact unknown and the smallest useful next check, keep the
claim unverified, and continue independent work. Ask the user only when their
intent, access or consequential choice is needed; missing documentation alone
must not trigger a blanket stop.

For delegated source work use the Source evidence report in
`references/schemas.md`. It settles `report` with `complete` or `partial`, never
product approval. Ordinary inline research needs only the relevant finding,
source, applicability and limits, not the full inter-agent payload.
