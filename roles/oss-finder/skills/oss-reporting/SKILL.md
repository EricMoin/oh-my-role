---
name: oss-reporting
description: "Produce OSS candidate tables, source trace reports, comparison matrices, risk registers, and final recommendations."
---

# OSS Reporting

Reports must be compact, evidence-backed, and decision-oriented.

## Candidate Table

Show at most 12 rows.

```md
## OSS Candidates for {problem}

Search stats: {raw_count} raw results from {channels}; {unique_count} unique after deduplication; showing top {shown_count}.

| # | Project | Stars | Last Active | Fit | Stack | License | Trace Need | Notes |
|---|---|---:|---|---|---|---|---|---|
```

Add warnings for unknown license, archived status, source trace uncertainty, or major stack mismatch.

## Deep Dive Report

For each selected project:

```md
### Source Trace: {owner/repo}
- Inspected artifacts:
- Entrypoint:
- Call chain:
- Core mechanism:
- Runtime dependencies:
- Extension/config surface:
- Integration fit for current project:
- Risks / unknowns:
- Trace confidence:
```

## Comparison Matrix

Use when comparing multiple candidates:

```md
| Dimension | Candidate A | Candidate B | Candidate C |
|---|---|---|---|
| Problem fit | | | |
| Source trace confidence | | | |
| Runtime dependencies | | | |
| Adoption friction | | | |
| Key risk | | | |
```

## Final Recommendation

Always include:

- Recommended project.
- Runner-up.
- When not to choose the recommendation.
- Integration steps.
- Risk mitigations.
- Exit criteria.
- Evidence gaps.

Never hide uncertainty. If the source trace is incomplete, say so in the recommendation.
