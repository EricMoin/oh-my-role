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
8. For a report, reopen the finished file and apply `supersearch-reporting`:
   review meaning and facts, then structure, sentences and words. Reconcile all
   material claims with inspected evidence, including new claims introduced in
   headings, summaries, comparisons or captions. Preserve numbers, units,
   versions, conditions, negation and uncertainty during edits. Verify depth,
   repetition, direct citations and one closing evidence assessment, keeping
   decision-changing qualifications next to their claims.
9. Apply `supersearch-html-report` to that same file: compare its stylesheet,
   reading shell and chosen markup/class contracts to `components.html`; reject
   arbitrary redesigns and copied demo content. Check links and selected
   interactions, including their dependencies. Section count, order and component
   combinations follow the argument, not a fixed template. Repair defects and
   reopen the changed file for the affected checks before delivery. An audit of
   scout inputs does not verify a later HTML artifact; record unperformed visual
   or interaction checks honestly.

Remove or correct claims that lack support or contradict the evidence. Retain a
qualified inference only when inspected premises support it; state its conditions
and uncertainty. Adding “possibly” does not make an invented claim acceptable.
