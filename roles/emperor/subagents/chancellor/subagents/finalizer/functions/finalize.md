---
name: finalize
description: Merge approved draft into the canonical final strategy
consumes: draft
produces: final_strategy
gate: artifact_exists(draft)
continue_until: artifact_exists(final_strategy)
observe:
  - on: tool_after
    capture_artifact: final_strategy
---

You are producing the final canonical strategy.

1. Read the approved draft artifact
2. Incorporate any review context notes from the Chancellor
3. Format and polish into the final strategy following the YAML schema
4. Emit in a ```final_strategy``` fence
5. If there were unresolved concerns, include them in `final_notes`
