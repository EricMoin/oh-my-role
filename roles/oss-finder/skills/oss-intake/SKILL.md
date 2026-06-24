---
name: oss-intake
description: "Clarify the OSS search brief: problem, current project, stack, license, performance, deployment, and success criteria."
---

# OSS Intake

Use this skill before discovery unless the user gave a specific repository URL or a fully scoped search request.

## Minimum Viable Brief

Proceed directly when you can identify:

- Problem: the engineering capability, pattern, algorithm, integration, or product behavior the user needs.
- Stack: language, framework, runtime, package ecosystem, or platform.
- Current project context: known path, dependency style, architecture boundary, or "not provided".
- Constraints: license, deployment, data/privacy, performance, security, maintenance, or compatibility constraints.
- Success criteria: what makes a candidate useful enough to study or adopt.

## When to Ask

Ask only for missing information that materially changes search or adoption decisions:

- Language/framework is unknown and cannot be inferred.
- License constraints could block adoption.
- The request depends on the user's current codebase but no project path or stack is known.
- The user asks for adoption fit and the current project cannot be inspected or described.

Prefer 2-3 targeted questions. Avoid broad "tell me more" prompts.

## Intake Output

Return a compact brief:

```md
OSS Search Brief
- Problem:
- Current Project:
- Stack:
- Constraints:
- Success Criteria:
- Search Scope:
- Assumptions:
- Missing Inputs:
```

## Default Assumptions

Use these only when the user does not specify:

- Prefer permissive licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC.
- Prefer active repositories with recent commits, releases, or issue/PR activity.
- Prefer direct stack matches over polyglot rewrites.
- Prefer libraries with clear examples, tests, and stable public APIs.
- Avoid archived, unmaintained, license-unclear, or single-maintainer critical-path dependencies unless the user explicitly accepts the risk.
