---
name: typescript-monorepo-engineering
description: Work across TypeScript workspace packages, repair dependency/build boundaries, and diagnose slow or stale checks. Use for affected-consumer analysis, project references and build-cache behavior, not merely because a file lives in a monorepo.
---

# Workspace engineering

## Establish the real graphs

Inspect workspace configuration, package manifests, lockfiles, tsconfigs and task-runner
configuration. Distinguish package dependencies, TypeScript project references and task
build edges. They may overlap, but one does not automatically declare the others.

For a changed package, identify dependencies needed to build it and consumers affected by
its changed contract, including unchanged source files. Use the existing affected-task
mechanism if available and verify its coverage for configuration/lockfile changes.

Do not introduce project references, a new orchestrator or extra packages without a concrete
need. Internal packages can legitimately exist for ownership, tooling or architectural
boundaries without independent publication. Preserve the repository's chosen structure.

## Dependencies and package boundaries

Declare imports in the package that uses them, using dependency, devDependency or peer
semantics appropriate to how it is built and consumed. Hoisting can hide undeclared imports.
A peer expresses a relationship to a host's dependency; it does not guarantee one physical
copy. Duplicate nominal types, private members, symbols or runtime singletons can expose
multiple installations even when structurally simple types remain compatible.

Use the selected package manager's supported workspace syntax and existing version policy.
Do not assume `workspace:` works in every manager or that every pack tool rewrites it.
For publishable packages, inspect the packed dependency ranges as well as local linking.
Preserve the existing lockfile layout; review requested dependency changes for unrelated churn.

Import through intended package entry points. Source aliases can hide missing exports,
missing dependencies and stale declarations. Verify the built boundary when that is what
production or consumers load. Diagnose cycles from actual dependency paths; a barrel or
shared package can introduce a back-edge. Fix the edge responsible rather than reshaping
unrelated packages.

## References, builds and caches

A referenced TypeScript project has a composite/declaration contract. Check effective
options, included files and output locations; use the repository's build-mode command
when it relies on reference ordering. A plain check of a solution config is not evidence
that all referenced projects were built or checked.

Keep build outputs and build-info paths distinct for configurations that can run together.
References do not declare package-manager dependencies or enforce every architectural
import rule. An editor's source redirect can conceal a stale or missing built artifact.

A cache must account for relevant source, configuration, lockfile, toolchain, environment
and upstream outputs. Verify a clean build in an isolated environment when diagnosing
stale-cache or publication failures. Do not delete all user outputs as a routine check.
For incremental problems, compare cold build, warm no-op and a representative changed-file
build; each answers a different performance/correctness question.

## Diagnose compiler performance

Measure the existing command with the installed compiler's supported diagnostic/trace
options before changing flags. Record compiler version, project scope, cache state and
workload. Compare like-for-like runs; repeat timings when noise affects the conclusion.

| Observation | Investigate |
|---|---|
| Too many source/declaration files | Include patterns, ambient types, imports, generated files |
| High type instantiation/check cost | Recursive conditional types, large unions, generic expansion |
| Resolution-heavy work | Duplicate dependencies, entry-point breadth, alias/resolver settings |
| Slow emit or repeated builds | Output topology, build edges, invalidated or overlapping caches |
| Slow wall time outside compiler | Task scheduling, install/setup, test or bundler work |

`skipLibCheck` trades declaration checking for speed; it does not avoid all work involving
declarations. Do not use it to hide a new incompatibility or disable checking as a claimed
optimization. Explain tradeoffs and preserve the required correctness contract.

## Verify the affected set

Build prerequisite artifacts, check the changed packages and relevant downstream consumers,
and exercise packaging only for affected publishable boundaries. Report the scope actually
checked. Coordinate version/changelog changes under the repository's release policy when
requested; a workspace edit does not itself authorize registry publication.
