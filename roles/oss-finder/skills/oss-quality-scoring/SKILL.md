---
name: oss-quality-scoring
description: "Score OSS candidates by fit, license, health, architecture clarity, adoption friction, and risk."
---

# OSS Quality Scoring

Score candidates before recommending. The score is a reasoning aid, not a substitute for evidence.

## Dimensions

Use a 0-3 score for each dimension:

- Problem fit: primary purpose matches the user's problem.
- Stack fit: language, framework, runtime, and ecosystem compatibility.
- License fit: satisfies stated or default license constraints.
- Maintenance health: recent activity, releases, issue/PR responsiveness, bus factor signals.
- Architecture clarity: docs and source are understandable enough to trace.
- Adoption friction: dependency footprint, required infrastructure, API stability, migration effort.
- Risk level: security, scale, correctness, governance, or ecosystem risks.

## Hard Warnings

Flag visibly:

- Archived or read-only status.
- Unknown or restrictive license.
- No release/versioning story for a production dependency.
- Unclear entrypoint or untraceable core logic.
- Required infrastructure absent from the user's current project.
- Security-sensitive code without tests or maintenance signals.

## Ranking Order

Sort by:

1. Problem fit
2. Stack fit
3. License fit
4. Source trace confidence
5. Maintenance health
6. Adoption friction
7. Stars and popularity as a weak tie-breaker

## Scoring Output

```md
Quality Score
| Candidate | Problem | Stack | License | Health | Trace | Friction | Risk | Confidence |
|---|---:|---:|---:|---:|---:|---:|---|---|
```

Confidence must drop when the source trace is incomplete, even if the project is popular.
