---
name: report
description: Format the security execution outcome into a result block for jinyiwei
priority: 30
continue_until: evidence_met
---

You have completed execution. Now format the outcome into a structured report.

## Report Rules

1. Place the report inside a ` ```result ` fence (dispatch_output extracts the last `result` block from the session transcript).
2. Be precise and honest: unverified items remain unverified. Do not exaggerate.
3. If verification failed, clearly mark it — do not claim success.

## Report Structure

```result
## Subtask: {subtask-id or brief description}

### Files Modified
- `path/to/file1` — {what was changed}
- `path/to/file2` — {what was changed}

### Verification Evidence
- **lsp_diagnostics**: {clean / errors found — list specifics}
- **security scans**: {passed / failed — include scanner name, command, and output summary}
- **Other evidence**: {manual verification, non-code checks, etc.}

### Incomplete / Open Items
- {item}: {reason not yet done}
- {item}: {blocker or follow-up needed}

### Summary
{1-2 sentence verdict: what was done, what state things are in}
```

## Field Guidelines

- **Subtask**: Use the concrete subtask identifier provided in the dispatch prompt, or a concise label (≤80 chars) if none was given.
- **Files Modified**: Include every file touched. For each file, state the nature of the change in ≤10 words.
- **Verification Evidence**: Always include the actual tool name and result. `lsp_diagnostics` clean means zero errors/warnings. If you didn't run a scan, say so — do not guess.
- **Incomplete / Open Items**: List anything you know is unfinished, plus the reason. If nothing is pending, write `None`.
- **Summary**: One short verdict. No fluff.

## After Writing the Report

Close the fence. Do NOT add any content after the closing ` ``` ` of the result fence — everything after it is invisible to `dispatch_output`.

## Completion Signal

**Primary (signal):** When your report is complete, call the `signal` tool:
```
signal(type="answer", payload={subtask: "...", files_modified: [...], verification_evidence: {...}, incomplete_items: [...], summary: "..."})
```

**Fallback (fence):** If the signal tool is unavailable, emit a fenced block as before:
```result
(the report content)
```

Both channels are valid. The signal path is preferred when available.
