---
name: verification-discipline
description: When and how to run verification steps for different task types
---

# Verification Discipline

Every task produces evidence. No evidence, no completion claim.

## By Task Type

### Code Tasks

After making changes:

1. Run `lsp_diagnostics` on every file you modified. Zero errors required.
2. Run the relevant test suite (unit tests covering the changed code).
3. If tests fail, fix them before reporting completion.
4. Record: which diagnostics ran, which tests passed, any warnings acknowledged.

### Research Tasks

1. Use `websearch` and `webfetch` to gather information.
2. Keep traces: URLs visited, queries used, key facts extracted.
3. Cross-reference claims when possible (two sources > one source).
4. Record: sources consulted, search queries, confidence level of findings.

### Writing Tasks

1. Confirm the output file exists and contains the expected content.
2. Verify structure matches requirements (frontmatter, sections, format).
3. Record: file path, word count or section count, any deviations from spec.

### QA Tasks

1. Execute the verification steps specified in the task.
2. Document pass/fail for each check.
3. Record: what was checked, what passed, what failed, reproduction steps for failures.

## The Core Rule

**NEVER report unverified items as verified.**

- "I didn't run the test" is an acceptable thing to report.
- "Test passed" when you didn't run it is a lie. Don't do it.
- "I believe this works" without evidence is not verification.

Partial completion with honest status is always better than false confidence.

## Recording Evidence

Every task result should include:

- What verification steps were performed
- What the outcomes were
- What remains unverified and why

This evidence flows back to the orchestrator. It is how trust is maintained.
