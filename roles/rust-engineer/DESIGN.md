# Rust Engineer design

## Execution ownership

The primary investigates repository facts, loads the graph workflow, chooses design and
acceptance criteria, and composes experts according to actual dependencies. Production
implementation and repairs belong to graph nodes. Five domain experts support implement,
evidence and review modes; verification and source-tracing experts remain source-read-only.
Ordinary safe Rust belongs to ownership-api, so general logic does not fall through a gap
between unsafe, async, API, performance and platform reviews.

| Asset | Responsibility |
| --- | --- |
| PROMPT.md / engineer function | Parent ownership, research, execution boundary and acceptance |
| rust-graph-workflow | Task decomposition, specialist choice, loops and evidence fan-in |
| complexity-model | Investigation depth, coverage and efficiency |
| rust-domains | Expert, implementation skill and review-criteria routing |
| node-contract / schemas | Modes, scopes, skill loading and report fields |
| graph-protocol / graph-patterns.json | Runtime semantics and executable graph shapes |
| Domain entry skills | Local specialist context with shared implementation and gate guidance |

## Composition and loops

Mechanical work can use one domain node. Behavior changes use independent verification
and a bounded implementation/review loop. Multi-domain tasks can sequence expert writers
or fan out read-only evidence; only exclusive source scopes permit parallel writers.
One convergence reviewer owns repair routing. Accepted revision input is optional on
initial entry and required when the repair edge triggers; serial implementers forward
that feedback with provenance. No parent-side repair bypasses the graph.

The provided patterns cover mechanical work, one-expert loops, multi-expert implementation,
parallel evidence loops and joined source investigation. They are examples to adapt, not
fixed phases or a requirement to invoke every expert. Graph execution does not grant
filesystem isolation, validate report prose or turn completion into engineering success.

## Version 5 migration

The display name is Rust Engineer; the directory ID remains rust-engineer. The optional
adaptive entry skill becomes rust-graph-workflow. Domain agent IDs now describe expertise:
api-reviewer -> ownership-api, async-auditor -> async-concurrency, safety-reviewer ->
unsafe-ffi, cross-platform-checker -> cargo-platform, perf-profiler -> performance.
Update authored graph declarations to these IDs; there are no duplicate compatibility
agents. Existing domain implementation skills and gate skill names remain available in
the role tree. Node reports use schema_version 2 with normalized domain names, actual skill-loading
evidence and separate implementation, review and evidence contracts; version 1 reports
must not be silently treated as version 2.

## Verification limits

Runtime tests load the actual role/assets and compile and execute the shipped graph
patterns through rolebox's real graph runtime. Worker decisions are stubbed, so these
tests establish scheduling, accepted input delivery, re-review and exhaustion behavior,
not model judgment, actual skill reading, Rust command success or production isolation.
Manual/session scenarios cover those behavioral decisions; they are not recorded passes
or an automated model benchmark. Repository changes do not install or publish the role.
