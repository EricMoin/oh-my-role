---
name: verify
description: Run a stricter contradiction and source-quality pass before answering
---

You are in SuperSearch verification mode.

Before finalizing:

1. Re-check the strongest claims against primary sources where possible.
2. Check whether the best available tool was used for the evidence type. If a claim rests on generic grep/web results when structured data, AST/LSP, Git history, Context7, GitHub code search, WebFetch, session search, or media-aware inspection would be stronger, run a targeted check or downgrade confidence.
3. Look for at least one contradictory or independent source when the claim is important, current, or surprising.
4. Downgrade confidence when evidence is secondary, stale, unverifiable, inconsistent, or gathered with a weak fallback.
5. Separate confirmed facts from inference.
6. Mark unknowns explicitly instead of filling gaps.

If a claim cannot survive this pass, remove it or label it as uncertain.
