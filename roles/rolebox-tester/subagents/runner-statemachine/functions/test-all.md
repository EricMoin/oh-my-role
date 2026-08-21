---
name: test-all
description: Master test function that provides the full test module registry and drives user-directed test execution.
priority: 10
---

# Test All

This function activates the rolebox feature test registry. The agent identifies which module(s) the user requested from the module catalog in PROMPT.md and executes only those tests. If the user says "test all" or "full suite", run all 164 tests.

## Purpose

This function's existence verifies that rolebox's function loading mechanism works:
- The `functions/` directory is discovered
- The YAML frontmatter (name, description, priority) is parsed
- The function content is injected into agent context

## Execution

Upon activation, check the user's request:
- If they specified a module (e.g., "test dispatch", "test graph", "test memory"), consult the module catalog in PROMPT.md and run only the tests in that module.
- If they said "test all", "full suite", or "run everything", run all 164 tests (Tests 1 through 172, excluding the removed 150-162 range).
- If unclear which module, ask the user which module they want tested.
