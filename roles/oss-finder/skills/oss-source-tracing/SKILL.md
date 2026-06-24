---
name: oss-source-tracing
description: "Deep-dive OSS source code until the public entrypoint, call chain, core mechanism, runtime dependencies, and integration context are clear."
---

# OSS Source Tracing

Use this skill before final adoption recommendations. The goal is not to count files; the goal is to understand whether the code actually fits the user's project.

## Completion Standard

A source trace is complete only when you can explain:

- Public entrypoint: the API, CLI, plugin hook, middleware, component, or framework integration the user would actually call.
- Call chain: the main path from entrypoint to core implementation, with key functions/classes/modules.
- Core mechanism: the algorithm, state model, scheduler, IO path, protocol, concurrency model, rendering pipeline, or other mechanism that solves the problem.
- Runtime dependencies: databases, queues, caches, network services, file system access, native bindings, build steps, browser APIs, or external services.
- Extension/config surface: options, adapters, callbacks, plugin points, error handling, and lifecycle hooks.
- Project fit: what the candidate would replace or supplement in the user's project, and what constraints it introduces.

## Default Artifacts

Inspect enough of these to satisfy the completion standard:

- README and quickstart.
- LICENSE.
- Manifest/package files: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, etc.
- Docs page covering integration or configuration.
- Repository tree or file index.
- Public entrypoint file.
- Core implementation files on the call chain.
- Adjacent modules required to understand state, errors, adapters, or side effects.
- Tests/examples when they clarify real usage or boundary behavior.

## File Budget

The budget is a guardrail against endless reading, not the definition of done:

- Default: inspect up to 8 source/test/example files per candidate.
- Extend to 15 files only when the call chain is still unclear, and state why.
- If still unclear after 15 files, mark `source trace incomplete`, list the missing link, and lower recommendation confidence.

README, LICENSE, and manifest files do not count against the source/test/example budget.

## Stop Conditions

Stop reading when:

- You can draw entrypoint -> core implementation -> side effects/dependencies.
- You can explain the adoption surface for the user's current project.
- You have identified remaining unknowns and can show they do not change, or do change, the recommendation.

## Source Trace Output

```md
Source Trace: {owner/repo}
- Inspected artifacts:
- Entrypoint:
- Call chain:
- Core mechanism:
- Runtime dependencies:
- Extension/config surface:
- Integration fit for current project:
- Risks / unknowns:
- Trace confidence: high | medium | low
```

Do not recommend a project with high confidence if the call chain is unclear.
