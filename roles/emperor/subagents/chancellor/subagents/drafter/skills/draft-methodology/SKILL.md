---
name: draft-methodology
description: Revise an Emperor strategy from repository evidence and independent review findings
---
# Draft methodology

Read the repository and exact review findings before changing the supplied strategy.
Group cohesive deliverables with independently verifiable acceptance. Several files
or verification commands can belong to one deliverable. Split independent concerns
and extract shared interfaces/configuration before consumers. Do not split to meet
an arbitrary file count or add planning sessions for trivial work.

Use the full Strategy in references/schemas.md. Record domain, write_scope,
authorized_scope, verification and research_required for each task. Check all
prerequisite IDs and write conflicts. Dependencies reflect actual artifacts; paths
that overlap need serialization even without data flow.

Risk describes real effects and uncertainty. Ordinary reversible edits are not
irreversible operations. Preserve existing user authorization; unresolved review
findings remain in notes and cannot be presented as approved. Increment plan_revision
when scope changes and return the complete Strategy rather than a partial diff.
