---
name: delegation-heuristics
description: Fine-grained delegation decision guidance — load when the triage tree produces an ambiguous classification, when a task falls between DIRECT and plan-first, or when a task's scope is unclear
---

# Delegation Heuristics

Refines the orchestrator's triage tree with boundary-case guidance. This skill does not replace PROMPT.md routing; it sharpens the edges where categories blur.

## Decision Matrix

### Direct

Answer yourself. Zero dispatch overhead.

**Signals:**
- Read-only queries: "what does X do?", "where is Y defined?"
- Single concept questions with a known answer
- Fact lookups, grep/glob searches, file reads
- Status checks: git log, diagnostics, "show me the current state of..."
- Explanations of existing code or architecture

**Rule:** Read-only investigation can stay direct even when it takes several reads.
If the authorized goal requires edits, switch to execution/planning before writing.

### Plan-First

Use a separate planner graph and yield. You need a plan before execution.

**Signals:**
- Fuzzy or open-ended scope: "refactor the auth system", "improve performance"
- Multi-file changes where the file set is not obvious upfront
- Cross-module refactoring where dependencies are not fully mapped
- Unresolved design decisions or dependency boundaries after scoped investigation
- "Make it better" style requests without clear acceptance criteria
- Shared interfaces or data invariants whose affected consumers are not established

**Rule:** Plan when scope, acceptance, dependency ordering or implementation choices
are unresolved. File counts, elapsed thought time and low risk labels are not gates.

### Execute

Use the matching department directly, or Jinyiwei for unknown domains. Execute then validate.

**Signals:**
- Single file change with clear intent: "add a timeout parameter to fetchData"
- Well-scoped implementation: acceptance criteria are explicit or trivially inferred
- Bug fix where the root cause and fix location are both known
- "Create file X with content Y" style tasks
- Applying a known pattern to a new location

**Rule:** If the change, affected scope, dependencies and done-condition are clear,
execute a compact Strategy. Keep cohesive work together even across several files.

### Ask-User

Do not guess. Clarify before dispatching.

**Signals:**
- Scope genuinely ambiguous: "fix the app" (which part?)
- Requirements conflict with each other or with existing code
- Multiple valid interpretations that lead to different architectures
- User references something you cannot find in the codebase
- Risk of irreversible or expensive work on a wrong assumption

**Rule:** If guessing wrong costs more than one round-trip of clarification, ask.

## Edge Cases

| Situation | Looks like... | Actually route to... | Why |
|-----------|---------------|---------------------|-----|
| Read-only + fuzzy scope | Direct | Direct, then clarify if needed | Inspect available context; ask only for a choice that evidence cannot resolve. |
| Large but well-scoped | Plan-First | Execute with a compact Strategy | A mechanical multi-file change can remain one cohesive item with scoped verification. |
| Small but risky | Execute | Resolve scope and authorization | Size does not establish safety; honor existing authorization and resolve genuinely missing permission. |
| Investigation request | Direct | Direct, then reclassify | Reading stays direct; authorized edits use execution/planning once scope is known. |
| User says "just do it" | Execute | Execute | Trust explicit user intent. Skip clarification if they have signaled confidence. |

## Anti-Patterns

- **Premature planning:** Do not dispatch to the planner for a typo fix. That is execute.
- **Premature execution:** Do not background-dispatch work you have not scoped. You will get halfway, hit ambiguity, and waste tokens.
- **Over-asking:** If the user gave enough info and you are stalling, pick the most reasonable interpretation and execute. Reserve ask-user for genuine ambiguity, not indecision.
- **Dispatch to wrong target:** The planner plans, the executor/router executes. Never send execution work to the planner or planning work to the executor/router.

Runtime scheduling and authorization follow references/graph-protocol.md. Existing
authorization remains valid; low effort never suppresses necessary implementation.
