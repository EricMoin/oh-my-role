---
name: test-skill
description: A dummy skill used to verify that rolebox skill loading works correctly.
---

# Test Skill

SKILL_LOAD_SUCCESS

This skill exists solely to test that the rolebox skill loading mechanism works. If the
skill content is delivered, the skill was loaded successfully.

## Verification

The marker `SKILL_LOAD_SUCCESS` above confirms that:

1. The skill file was discovered in the role's `skills/` directory.
2. The YAML frontmatter was parsed.
3. The skill body was delivered to the agent context through the host-aware loader:
   call `load_role_skill({name:"test-skill"})` on Pi, DSH and Codex; use the host's
   native skill mechanism on opencode 1.x/2.x, where `load_role_skill` is not
   registered; use a direct read of `skills/test-skill/SKILL.md` only as the last
   fallback.
4. The skill's own reference is resolved with the skill: `load_role_skill` returns its
   reference metadata, and `load_reference({name:"skill-ref"})` loads
   `skills/test-skill/references/skill-ref.md` with the `SKILL_REFERENCE_OK` marker.

No action is required. This is a passive test artifact.
