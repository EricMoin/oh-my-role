---
name: memory
description: Memory test function — verifies memory tool operations (write, recall, list, update) and memory injection behavior.
---

# Memory Function

This function activates the memory tool testing sequence. When loaded, it verifies:

1. **`memory_write`** — storing memories with title, content, category, and tags across workspace and role scopes
2. **`memory_recall`** — retrieving memories by full-text query with scope and category filters
3. **`memory_list`** — listing memories with sorting and category filtering
4. **`memory_update`** — modifying existing memory entries

## Testing

Execute Tests 59-68 from PROMPT.md. Verify that:
- Memory writes persist across operations
- Recall returns relevant results ranked by relevance
- Scope filtering (workspace/role/both) works correctly
- Memory injection populates context with relevant entries
- Configurable parameters (max_inject, min_relevance, scope) are respected
