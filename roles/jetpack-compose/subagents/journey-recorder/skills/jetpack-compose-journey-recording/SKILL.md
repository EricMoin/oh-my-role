---
name: jetpack-compose-journey-recording
description: Organize a sealed run's existing evidence inside one assigned output directory and return optional case/profile/index proposals, without verification, device work or production edits.
---
# Background recording

1. Check the dispatch contains run ID, source/artifact identity, exact sealed input paths,
   requested outputs and one disjoint absolute output directory. Missing essential input
   produces an `incomplete` report; do not search unrelated files to reconstruct it.
2. Read the minimum record and relevant supplied evidence. Preserve failed assertions,
   blocked setup, not-run steps and captured-but-uninspected media. Never relabel source
   evidence as belonging to a repaired build or claim you performed the original actions.
3. Write requested useful records only in your assigned
   directory. Resolve output paths and do not escape through symlinks. The boundary is
   contractual; the installed host determines actual sandbox enforcement.
4. Keep shared case/profile/index edits as proposals with their base revision/identity.
   Do not merge them, overwrite input files, run Git, operate devices, run tests or recapture
   evidence. The lead can change production code concurrently because you consume only
   the sealed snapshot. Keep raw device identifiers, credentials and unrelated user data
   out of records; label missing sanitized evidence instead of copying sensitive content.
5. Check only the paths and claims you produced. No new verification or presentation polish
   is needed once the requested organization is usable. Report absent links or partial
   output honestly rather than extending the task beyond its finite budget.
6. Submit the Recording report from `references/schemas.md` as `recorded` or `incomplete`.
   These are archive outcomes, not acceptance decisions.
