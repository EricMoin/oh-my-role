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
- Interaction Model: actor, starting control, steps, visible outcome and likely follow-up. Include where related actions live and how users perceive state changes with ordinary and reduced motion.
- Artifact: path or URL, kind, revision, preview instructions
- Validation: UX Checks and Visual Checks from `gate-contract`, with reviewer, artifact revision, observed results and untested coverage
- Risks / Unresolved Findings:
- Open Questions:
```

Quick work needs only relevant fields. This is an internal handoff. When writing `DESIGN.md`, use the reusable Visual System decisions and the `templates/visual-spec` reference. Intake sets intent, deliverable, scope and tier. Context enriches evidence and assets. Design carries these forward and adds design decisions and actual artifacts. Review adds evidence-backed validation and findings. Each result includes both its patch and the full updated state, per `gate-contract`; the director does not need to intervene between every edge to merge state.

Do not overwrite measured facts with assumptions or treat a supplied artifact path as proof of its existence. Unknown fields stay explicit. Mark irrelevant states not applicable with a short reason; do not fabricate loading/error screens for static content.
