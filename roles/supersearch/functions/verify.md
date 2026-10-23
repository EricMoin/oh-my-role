---
name: verify
description: Run a stricter contradiction and source-quality pass before answering
---

You are in SuperSearch verification mode.

Before finalizing:

1. Re-check the strongest claims against primary sources where possible.
2. Check whether the best available tool was used for the evidence type. If a claim rests on generic text or web results when structured data, AST/LSP, Git history, Context7, GitHub code search, WebFetch, session search, or media-aware inspection would be stronger, run a targeted check or downgrade confidence.
3. For a Deep search, include the `supersearch--evidence-auditor` node in the declared graph and read its accepted `audit_ready` report: unsupported claims, weak tool choices, conflicts or stale evidence, missing primary checks and confidence adjustments. A graph phase of `complete` is not a passed audit.
4. Look for at least one contradictory or independent source when the claim is important, current, or surprising.
5. Downgrade confidence when evidence is secondary, stale, unverifiable, inconsistent, or gathered with a weak fallback.
6. Separate confirmed facts from inference.
7. Mark unknowns explicitly instead of filling gaps, and treat a `no_evidence`, `blocked` or `failed` scout result as a stated gap rather than a passing prerequisite.
8. For a report, the lead checks the finished file using `supersearch-reporting`
   and `supersearch-html-report`: coverage and depth of material questions,
   repetition and jargon, direct citations beside supported text, and one closing
   evidence assessment. Retain qualifications needed to interpret individual
   claims. An audit of scout inputs does not verify a later HTML artifact; check
   the composed document's links and interactions without requiring the component
   reference's class names or layout.

If a claim cannot survive this pass, remove it or label it as uncertain.
