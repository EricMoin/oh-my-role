---
name: test-all
description: Master test function that drives the complete rolebox feature test sequence.
priority: 10
---

# Test All

This function activates the full rolebox feature test sequence. When loaded, the agent should execute all 119 tests defined in PROMPT.md without waiting for additional user input.

## Purpose

This function's existence verifies that rolebox's function loading mechanism works:
- The `functions/` directory is discovered
- The YAML frontmatter (name, description, priority) is parsed
- The function content is injected into agent context

## Execution

Upon activation, immediately begin the test sequence from Test 1 through Test 119. Do not wait, do not ask for confirmation.
