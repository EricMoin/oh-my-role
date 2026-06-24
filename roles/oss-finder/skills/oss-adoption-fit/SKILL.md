---
name: oss-adoption-fit
description: "Assess whether an OSS candidate fits the user's current project and produce an adoption path, risks, and exit criteria."
---

# OSS Adoption Fit

Use this skill after discovery and source tracing, especially for `|adopt|` requests.

## Current Project Inspection

If the user provides a project path or the working directory is relevant, inspect read-only:

- Dependency manifests and lockfiles.
- Existing modules that solve adjacent problems.
- Framework/runtime versions.
- Build and test conventions.
- Architecture boundaries and layering.
- Deployment/runtime assumptions.
- License and policy files when present.

Do not modify files, install packages, or run mutating commands.

## Fit Questions

Answer these before recommending adoption:

- Does the candidate match the current language/framework/runtime?
- Is its public entrypoint ergonomic in this project?
- Which current module would it replace, wrap, or complement?
- What new runtime dependencies or operational responsibilities appear?
- What configuration, initialization, or lifecycle hooks are required?
- What testing strategy would validate integration?
- What rollback or exit strategy exists if adoption fails?

## Adoption Plan Output

```md
Adoption Fit
- Candidate:
- Fit Summary:
- Integration Points:
- Required Changes:
- Required Runtime Dependencies:
- Validation Strategy:
- Risks and Mitigations:
- Exit Criteria:
- Recommendation:
```

Recommendations:

- `adopt`: strong fit, known risks manageable.
- `trial`: promising, needs spike or source trace gap resolution.
- `study only`: useful implementation reference, not a dependency.
- `avoid`: mismatch, unacceptable risk, or unresolved critical unknown.
