# Design State Template

Carry this compact state in each gate result. Keep long content in linked artifacts.

```text
Design State
- Request / Revision:
- Tier: quick | standard | full
- Brief:
- Audience:
- Success Criteria:
- Scope / Non-goals / Write Scope:
- Deliverable(s): requested critique, specification, prototype or implementation and its destination(s)
- Constraints: platform, design system, accessibility, content, time
- Evidence: observed facts with source locations
- Assumptions / Unknowns:
- Assets: available sources, usage constraints, honest gaps
- Direction: task structure, density, content-led identity, choices to retain or improve, which surfaces belong together and what should stand out in relevant states
- Preservation: refinement/redesign scope, baseline, existing visual strengths, targeted changes
- Information Architecture:
- Visual System: semantic colors and values, source or new rationale, type roles and metrics, spacing within and between groups, shared component treatments, explicit style exceptions
- Interaction Model: actor, starting point, expected result and likely follow-up. Capture what the person needs to know or do at a consequential step and which design choice supports that.
- Artifact: path or URL, kind, revision, preview instructions
- Validation: UX Checks, Visual Checks and whole-deliverable review from `gate-contract`, with reviewer, revision, observed results and any required evidence still missing
- Risks / Unresolved Findings: open IDs of every severity and the observed retest for each closed ID
- Open Questions:
```

Quick work needs only relevant fields. This is an internal handoff. When writing `DESIGN.md`, use the reusable Visual System decisions and the `templates/visual-spec` reference. Intake sets intent, deliverable, scope and tier. Context enriches evidence and assets. Design carries these forward and adds design decisions and actual artifacts. Review adds evidence-backed validation and findings. Each result includes both its patch and the full updated state, per `gate-contract`; the director does not need to intervene between every edge to merge state.

Do not overwrite measured facts with assumptions or treat a supplied artifact path as proof of its existence. Unknown fields stay explicit. Mark irrelevant states not applicable with a short reason; do not fabricate loading/error screens for static content.
