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
- Deliverable: critique | specification | prototype | implementation
- Constraints: platform, design system, accessibility, content, time
- Evidence: observed facts with source locations
- Assumptions / Unknowns:
- Assets: available sources, usage constraints, honest gaps
- Direction: task structure, density, content-led identity, deliberate omissions
- Information Architecture:
- Visual System:
- Interaction Model:
- Artifact: path or URL, kind, revision, preview instructions
- Validation: checks run, outcomes, untested coverage, reviewer
- Risks / Unresolved Findings:
- Open Questions:
```

Quick work needs only relevant fields. Intake sets intent, deliverable, scope and tier. Context enriches evidence and assets. Design carries these forward and adds design decisions and actual artifacts. Review adds evidence-backed validation and findings. Each result includes both its patch and the full updated state, per `gate-contract`; the director does not need to intervene between every edge to merge state.

Do not overwrite measured facts with assumptions or treat a supplied artifact path as proof of its existence. Unknown fields stay explicit. Mark irrelevant states not applicable with a short reason; do not fabricate loading/error screens for static content.
