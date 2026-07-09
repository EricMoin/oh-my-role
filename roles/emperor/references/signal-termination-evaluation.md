# Signal Termination Semantics: Tool-Choice Evaluation

**Date**: 2026-07-09
**Scope**: Phase 2, Subtask 9 — determine whether rolebox can eliminate the "one extra LLM round" overhead when `signal(answer)` fires and satisfies `continue_until`.

---

## 1. What Was Investigated

### 1.1 Tool Definition API (`@opencode-ai/plugin`)

**File**: `node_modules/@opencode-ai/plugin/dist/tool.d.ts` (cloned under `/Users/mgl/Project/github/rolebox`)

The `tool()` function defines tools with exactly three fields:

```typescript
declare function tool<Args extends z.ZodRawShape>(input: {
  description: string;
  args: Args;
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<ToolResult>;
}): { description: string; args: Args; execute(...): Promise<ToolResult>; };
```

- No `terminal` flag, no `tool_choice`, no `stop` property.
- Every tool is treated identically: after execution, the model is re-invoked.

**File**: `src/signal/signal-tool.ts` (rolebox source, line 4-28)

The `signal` tool is created via the standard `tool()` factory — no special metadata. Its `execute` simply returns `"signal: ${type} acknowledged"`.

**Conclusion**: The plugin SDK provides no mechanism to mark a tool as "terminal" (session should end after this call without another LLM round).

### 1.2 Plugin Hook Surface (`@opencode-ai/plugin/dist/index.d.ts`)

All available hooks (lines 173-322):

| Hook | Has Mutable Output? | Purpose |
|------|---------------------|---------|
| `event` | No (void) | Observes events; cannot modify or veto |
| `tool.execute.before` | Yes (`output.args`) | Validate/modify tool args |
| `tool.execute.after` | Yes (`output.title`, `output`, `metadata`) | Modify tool result |
| `chat.params` | Yes (`temperature`, `topP`, `topK`, `maxOutputTokens`, `options`) | Modify LLM call params |
| `chat.message` | Yes (`output.message`, `output.parts`) | Modify user message |
| `experimental.compaction.autocontinue` | Yes (`output.enabled`) | Veto post-compaction auto-continue |
| All others | Observational or hook-specific | — |

**Key finding**: No hook exists that could **veto** the next LLM turn after a tool call completes. The closest candidate — `chat.params` — fires after the next turn is already scheduled, and can only limit output tokens, not prevent the turn entirely.

**Conclusion**: The plugin API surface does not expose a "should I continue after tool use" decision point.

### 1.3 Session Prompt API (`@opencode-ai/sdk/dist/gen/types.gen.d.ts`)

**File**: `types.gen.d.ts`, lines 2329-2353 (`SessionPromptAsyncData`)

The `promptAsync` body accepts: `messageID`, `model`, `agent`, `noReply`, `system`, `tools`, `parts`. No `tool_choice` parameter exists.

**File**: `types.gen.d.ts`, line 2059-2068 (`SessionAbortData`)

A `session.abort()` endpoint exists but aborts the entire session — it does not selectively prevent the next turn.

### 1.4 Rolebox Continuation Logic (`src/hooks/event-handler.ts`)

The `handleEvent` function (lines 60-354) processes `session.idle` events. Key continuation flow:

- **Lines 108-114**: Skip continuation for sync sessions (to prevent `promptAsync` from hanging `session.prompt()`)
- **Lines 118-125**: Skip continuation when inflight dispatches exist (to avoid polling)
- **Lines 130-139**: Skip continuation for loop-owned phases (summarizing, activating, finalizing)
- **Lines 190-262**: Main continuation loop:
  - Evaluates `continue_until` condition (line 212-219)
  - If satisfied → sets `st.phase = "complete"`, skips this function
  - If not satisfied → calls `deps.client.session.promptAsync()` to inject a `<system-reminder>` reminder

**Critical observation**: rolebox's continuation engine only **adds** extra turns (via `promptAsync`). It never **prevents** a turn that opencode's runner has already decided to take. The suppression guards (sync, inflight, loop) only suppress rolebox's own `promptAsync` calls — they don't suppress opencode's internal `needsContinuation` loop.

### 1.5 Agent `maxSteps` (`types.gen.d.ts`, line 856)

```
maxSteps?: number;
// Maximum number of agentic iterations before forcing text-only response
```

This is a hard cap on total tool-calling turns. It does not differentiate between tool types. Setting `maxSteps` to the expected turn count plus one could bound the overhead, but does not eliminate the final extra turn — the model still runs one more time with text-only output.

### 1.6 Evidence from Subscription Completion (`src/function/observe.ts`)

Lines 40-52: When `signal` tool executes, the type is recorded in `st.kv.__signals_observed`. This is later read by the `signal_observed(type)` condition (defined in `src/function/conditions.ts`, lines 53-55).

Lines 147-161 (`runTextCapture`): At idle, if the turn ended without a trailing tool call, text capture runs as a safety net. This confirms that the `session.idle` handler can detect completion even when the final turn has no tool call.

---

## 2. Findings

### 2.1 The Two-Layer Continuation Architecture

```
opencode session runner (uncontrolled by rolebox)
  │
  ├─ LLM generates tool call
  ├─ Tool executes → result appended
  ├─ session.idle fired → rolebox handler runs
  ├─ opencode checks needsContinuation (from StepFinish reason "tool_use")
  ├─ schedules NEXT LLM turn ← THIS IS THE EXTRA TURN
  │
  rolebox event handler (on session.idle)
    │
    ├─ Evaluates continue_until → finds signal_observed(answer) → phase="complete"
    ├─ Does NOT send continuation promptAsync (correct)
    └─ Cannot prevent opencode's scheduled turn
```

The extra turn is produced by opencode's session runner, not by rolebox. The pipeline is:

1. Tool call completes → `StepFinish` part with `reason: "tool_use"` appended
2. Session becomes idle
3. opencode fires `session.idle` event to plugins
4. rolebox handler runs, evaluates `continue_until`, marks function complete
5. opencode checks: "was my last step finish reason `tool_use`?" → yes → schedule next LLM turn
6. Next LLM turn runs (the "extra" one)

Rolebox cannot interpose between steps 3 and 5 because:
- The `event` hook has no output — it cannot modify the session state or the decision
- There is no plugin hook for "should I continue after idle"
- `chat.params` fires too late (at step 6, not between 3 and 5)

### 2.2 What Rolebox CAN Control

- **Suppress its own continuation reminders**: When `continue_until` is satisfied, rolebox correctly skips the `promptAsync` call. No `<system-reminder>` is injected.
- **Suppress reminders for sync/inflight/loop**: Existing guards prevent unwanted `promptAsync` calls.
- **Mark function complete**: The function's runtime state transitions to `phase: "complete"`, preventing any future rolebox-initiated continuation.

### 2.3 What Rolebox CANNOT Control

- **Prevent opencode's own `needsContinuation` turn**: This is determined by opencode's session runner based on the `StepFinish` part's `reason` field. The `reason: "tool_use"` triggers a continuation regardless of any plugin-visible state.
- **Mark a tool as "terminal"**: The plugin SDK's `tool()` function provides no `terminal`, `stop`, or `tool_choice` flag.
- **Veto the next turn from `session.idle`**: The event hook is read-only for `session.idle`.
- **Use `session.abort()` safely**: It terminates the entire session, not just one turn.

---

## 3. Conclusion

### Verdict: Acceptable Tradeoff — No Upstream Change Required Now

The "one extra LLM round" is an **inherent architectural constraint** of the opencode plugin model. However, it is an **acceptable tradeoff** for the following reasons:

| Factor | Assessment |
|--------|-----------|
| **Cost per extra turn** | At most 1 LLM round per function completion (~$0.01–$0.10 depending on model) |
| **User experience impact** | The extra turn produces a natural-looking summary ("Task complete. Summary: ...") rather than an abrupt stop |
| **Rolebox behavior** | No continuation reminder is sent — the extra turn is the LAST turn; the session becomes truly idle after it |
| **Risk of cascading** | Zero — rolebox marks the function complete on `session.idle`, so even if something goes wrong, no further rolebox-initiated turns occur |
| **Number of affected turns** | Exactly 1 per function that terminates (the function's final tool call triggers one more round before the LLM responds with text-only) |

**Quantified overhead** (for the standard emperor workflow):

| Function pattern | Expected turns | Overhead turns | Overhead % |
|---|---|---|---|
| `execute()` — single dispatch → result | 2–3 | 1 | 33–50% |
| `route()` → background dispatch → collect | 4–5 | 1 | 20–25% |
| Signal + fence dual-channel | 2–3 | 1 | 33–50% |

The overhead is bounded and proportional to workflow complexity.

### Alternative: `chat.params` Band-Aid (Not Recommended)

If the extra turn were deemed unacceptable, a fragile workaround exists via the `chat.params` hook:

```
// Pseudocode — NOT recommended for production
"chat.params": (input, output) => {
  if (functionCompletionDetected) {
    output.maxOutputTokens = 1;  // Minimal output
    // Inject a system-level "just say done" instruction via context
  }
}
```

**Reasons to skip this approach**:
- Requires sharing mutable state between event handler and `chat.params` hook
- `maxOutputTokens: 1` may still generate tokens; the model still runs
- No guarantee the LLM properly summarizes without additional system prompt manipulation
- Fragile across opencode SDK version changes
- Adds complexity for marginal cost savings

---

## 4. Upstream Enhancement Request

**If the extra turn becomes a performance bottleneck** (e.g., at high function dispatch rates or with expensive models), the following enhancement to the opencode plugin SDK would enable clean elimination:

### Request: Terminal Tool Flag

Add an optional `terminal` property to the tool definition:

```typescript
declare function tool<Args extends z.ZodRawShape>(input: {
  description: string;
  args: Args;
  terminal?: boolean;  // ← NEW: when true, the session runner does NOT
                       // schedule another LLM turn after this tool completes
                       // (the StepFinish reason is "stop" instead of "tool_use")
  execute(args: z.infer<z.ZodObject<Args>>, context: ToolContext): Promise<ToolResult>;
});
```

**Behavior when `terminal: true`**:
- After tool execution, the opencode session runner treats the step as terminal
- `StepFinish.reason` is set to `"stop"` instead of `"tool_use"`
- `needsContinuation` evaluates to `false`
- The next LLM turn is NOT scheduled
- The session transitions to true idle

**Fallback compatibility**: When `terminal` is absent or `false`, behavior is identical to today.

### Alternative: `session.idle` Veto Hook

Add output to the existing `event` hook for `session.idle`:

```typescript
// Current: (input: { event: Event }) => Promise<void>
// Proposed: (input: { event: Event }, output: { continue?: boolean }) => Promise<void>
```

When a plugin sets `output.continue = false` during a `session.idle` event, the session runner skips the next LLM turn. This is more flexible than a per-tool flag but introduces coordination complexity across multiple plugins.

### Which to Request

The **terminal flag** approach is preferred because:
- Simple and declarative — the tool author declares intent
- No coordination between plugins
- Consistent behavior — signal(answer) is always terminal
- Easy for the opencode team to implement (modify the `StepFinish` reason computation)

The **veto hook** is a secondary option that would give the plugin more dynamic control.

### Scope for Upstream

- **Impact**: Low — additive change, backward compatible
- **Implementation surface**: Tool schema validation, session runner step-finish logic, streaming response handling
- **Test surface**: Verify that `terminal: true` tool produces `reason: "stop"` and stops the loop; `terminal: false` (or absent) continues as before
