---
name: test-skill
description: A dummy skill used to verify that rolebox skill loading works correctly.
---

# Test Skill

SKILL_LOAD_SUCCESS

This skill exists solely to test that the rolebox skill loading mechanism works. If you can read this text, the skill was loaded successfully.

## Verification

The marker `SKILL_LOAD_SUCCESS` above confirms that:
1. The skill file was discovered in the role's `skills/` directory
2. The YAML frontmatter was parsed
3. The Markdown content was delivered to the agent context

No action is required. This is a passive test artifact.
