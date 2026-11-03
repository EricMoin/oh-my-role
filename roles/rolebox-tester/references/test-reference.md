---
description: Test reference document for verifying rolebox reference loading through the host-aware reference loaders
---

# Test Reference

REFERENCE_LOAD_SUCCESS

This reference document exists to verify that the rolebox reference loading mechanism
works correctly.

## What This Tests

1. **Reference declaration** — The `references` field in `role.yaml` correctly points to
   this file.
2. **File resolution** — The path `references/test-reference.md` resolves relative to
   the role directory.
3. **Loader delivery** — On hosts that register the reference tools, load this document
   with `load_reference({name:"test-reference"})`; the response returns the full
   content, the resolved path and the description. Use
   `reference_search({query:"REFERENCE_LOAD_SUCCESS"})` to confirm full-text search
   finds the marker in this reference.
4. **Fallback access** — Use a direct file read of `references/test-reference.md` only
   when neither `load_reference` nor `reference_search` is registered in the session.
5. **Marker detection** — The string `REFERENCE_LOAD_SUCCESS` can be found and
   verified regardless of which host-aware path delivered the content.

## Additional Content

This extra content exists to make the file realistic. Real references contain domain
knowledge, API docs, or structured data that the agent needs to do its job. This one
just needs to be readable through the configured loader.

- Item A: test data alpha
- Item B: test data beta
- Item C: test data gamma
