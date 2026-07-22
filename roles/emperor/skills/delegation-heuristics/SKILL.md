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

**Rule:** If the answer requires only reading (no writes, no multi-step investigation), handle it directly.

### Plan-First

Dispatch to the planner subtree synchronously. You need a plan before execution.

**Signals:**
- Fuzzy or open-ended scope: "refactor the auth system", "improve performance"
- Multi-file changes where the file set is not obvious upfront
- Cross-module refactoring where dependencies are not fully mapped
- Requests that need tool-based investigation before you can estimate effort
- "Make it better" style requests without clear acceptance criteria
- Feature work touching 3+ files or 2+ modules

**Rule:** If you cannot write a concrete checklist of changes in under 30 seconds of thought, plan first.

### Execute

Background dispatch to the executor/router. Scope is locked, just do it.

**Signals:**
- Single file change with clear intent: "add a timeout parameter to fetchData"
- Well-scoped implementation: acceptance criteria are explicit or trivially inferred
- Bug fix where the root cause and fix location are both known
- "Create file X with content Y" style tasks
- Applying a known pattern to a new location

**Rule:** If you can state the exact files, the exact change, and the done-condition in one sentence, execute.

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
| Read-only + fuzzy scope | Direct | Ask-User | "Explain how auth works" is direct. "What should we do about auth?" needs clarification. |
| Large but well-scoped | Plan-First | Plan-First then Execute | Even if scope is clear, 5+ file changes benefit from a checklist. Verify scope with a plan, then fan out execution. |
| Small but risky | Execute | Ask-User | A one-line config change that could break prod deserves confirmation. |
| Investigation request | Direct | Direct (or Plan-First) | "Find all usages of X" is direct. "Find all usages and refactor them" is plan-first. |
| User says "just do it" | Execute | Execute | Trust explicit user intent. Skip clarification if they have signaled confidence. |

## Anti-Patterns

- **Premature planning:** Do not dispatch to the planner for a typo fix. That is execute.
- **Premature execution:** Do not background-dispatch work you have not scoped. You will get halfway, hit ambiguity, and waste tokens.
- **Over-asking:** If the user gave enough info and you are stalling, pick the most reasonable interpretation and execute. Reserve ask-user for genuine ambiguity, not indecision.
- **Dispatch to wrong target:** The planner plans, the executor/router executes. Never send execution work to the planner or planning work to the executor/router.
