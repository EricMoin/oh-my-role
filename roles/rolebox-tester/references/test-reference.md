---
description: Test reference document for verifying rolebox reference loading
---

# Test Reference

REFERENCE_LOAD_SUCCESS

This reference document exists to verify that the rolebox reference loading mechanism works correctly.

## What This Tests

1. **Reference declaration** — The `references` field in `role.yaml` correctly points to this file
2. **File resolution** — The path `references/test-reference.md` resolves relative to the role directory
3. **Content accessibility** — The agent can read this file's content via the Read tool
4. **Marker detection** — The string `REFERENCE_LOAD_SUCCESS` can be found and verified

## Additional Content

This extra content exists to make the file realistic. Real references contain domain knowledge, API docs, or structured data that the agent needs to do its job. This one just needs to be readable.

- Item A: test data alpha
- Item B: test data beta
- Item C: test data gamma
