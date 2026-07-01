---
name: report
description: Format the execution outcome into an orchestrator-consumable result block
priority: 30
continue_until: evidence_met
---

You have completed execution. Now format the outcome into a structured report conforming to the canonical execution_report schema defined in `references/schemas.md`.

## Report Rules

1. Place the report inside a ` ```result ` fence (dispatch_output extracts the last `result` block from the session transcript).
2. Be precise and honest: unverified items remain unverified. Do not exaggerate.
3. If verification failed, clearly mark it — do not claim success.
4. **Never report unverified items as verified.** Partial completion with honest status is better than false confidence.
5. Do NOT add any content after the closing ` ``` ` of the result fence — everything after it is invisible to dispatch_output.

## Report Structure

The execution report uses these fixed section headings. See `references/schemas.md` (section 4, Execution Report) for the canonical definition.

```result
## Subtask: {subtask-id or brief description (≤80 chars)}

### Files Modified
- `path/to/file1` — short description of change (≤10 words)
- `path/to/file2` — short description of change (≤10 words)

### Verification Evidence
- **lsp_diagnostics**: clean
- **build/tests**: passed — include command and result summary
- **Other evidence**: manual verification, non-code checks, or None

### Incomplete / Open Items
- None
- Or: {item}: {reason not yet done}
- Or: {item}: {blocker or follow-up needed}

### Summary
One to two sentence verdict: what was done, what state things are in.
```

## Field Guidelines

- **Subtask**: Heading text is the subtask identifier provided in the dispatch prompt, or a concise label (≤80 chars) if none was given.
- **Files Modified**: Every file touched, each with a ≤10 word change description.
- **Verification Evidence**: Three sub-items, each as bold label followed by the result:
  - `lsp_diagnostics`: `clean` means zero errors/warnings. If not run, say so.
  - `build/tests`: Include the command used and the actual result. If not run, say so.
  - `Other evidence`: Manual checks, non-code evidence, or `None` if inapplicable.
- **Incomplete / Open Items**: Must be present. Use `None` if nothing is pending. Never omit this section.
- **Summary**: One to two sentences. No fluff.
