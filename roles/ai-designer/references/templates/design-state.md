# Design State Template

```md
Design State
- Tier: quick | standard | full
- Brief:
- Audience:
- Success Criteria:
- Scope:
- Constraints:
- Evidence:
- Assets:
- Information Architecture:
- Visual System:
- Interaction Model:
- Artifact:
- Validation:
- Risks:
- Open Questions:
```

## Usage by Tier

- **Quick**: Director uses Brief, Audience, Scope, and Constraints only. Other fields are not populated.
- **Standard**: Intake populates Tier through Constraints. Design gate populates IA through Artifact. Review gate populates Validation and Risks.
- **Full**: Intake populates Tier through Scope. Context gate populates Constraints, Evidence, and Assets. Design gate populates IA through Artifact. Review gate populates Validation and Risks.

## Principles

- Keep gaps explicit — write "unknown" rather than inventing content.
- The Tier field is set by Intake and drives routing decisions.
- The Design State is passed in full to every subagent dispatch.
- Fields not relevant to the current tier may be left blank.
