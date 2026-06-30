---
name: delegation-heuristics
description: Fine-grained delegation decision guidance beyond the triage tree
---

# Delegation Heuristics

Refines the Emperor's triage tree with boundary-case guidance. This skill doesn't replace PROMPT.md routing; it sharpens the edges where categories blur.

## Decision Matrix

### Direct (自答)

Answer yourself. Zero dispatch overhead.

**Signals:**
- Read-only queries: "what does X do?", "where is Y defined?"
- Single concept questions with a known answer
- Fact lookups, grep/glob searches, file reads
- Status checks: git log, diagnostics, "show me the current state of..."
- Explanations of existing code or architecture

**Rule:** If the answer requires only reading (no writes, no multi-step investigation), handle it directly.

### Plan-First (先规划)

Dispatch to chancellor synchronously. You need a plan before execution.

**Signals:**
- Fuzzy or open-ended scope: "refactor the auth system", "improve performance"
- Multi-file changes where the file set isn't obvious upfront
- Cross-module refactoring where dependencies aren't fully mapped
- Requests that need tool-based investigation before you can estimate effort
- "Make it better" style requests without clear acceptance criteria
- Feature work touching 3+ files or 2+ modules

**Rule:** If you can't write a concrete checklist of changes in under 30 seconds of thought, plan first.

### Execute (直接执行)

Background dispatch to jinyiwei. Scope is locked, just do it.

**Signals:**
- Single file change with clear intent: "add a timeout parameter to fetchData"
- Well-scoped implementation: acceptance criteria are explicit or trivially inferred
- Bug fix where the root cause and fix location are both known
- "Create file X with content Y" style tasks
- Applying a known pattern to a new location

**Rule:** If you can state the exact files, the exact change, and the done-condition in one sentence, execute.

### Ask-User (问用户)

Don't guess. Clarify before dispatching.

**Signals:**
- Scope genuinely ambiguous: "fix the app" (which part?)
- Requirements conflict with each other or with existing code
- Multiple valid interpretations that lead to different architectures
- User references something you can't find in the codebase
- Risk of irreversible or expensive work on a wrong assumption

**Rule:** If guessing wrong costs more than one round-trip of clarification, ask.

## Edge Cases

| Situation | Looks like... | Actually route to... | Why |
|-----------|---------------|---------------------|-----|
| Read-only + fuzzy scope | Direct | Ask-user | "Explain how auth works" is direct. "What should we do about auth?" needs clarification. |
| Large but well-scoped | Plan-first | Plan-first then execute | Even if scope is clear, 5+ file changes benefit from a checklist. Verify scope with a plan, then fan out execution. |
| Small but risky | Execute | Ask-user | A one-line config change that could break prod deserves confirmation. |
| Investigation request | Direct | Direct (or plan-first) | "Find all usages of X" is direct. "Find all usages and refactor them" is plan-first. |
| User says "just do it" | Execute | Execute | Trust explicit user intent. Skip clarification if they've signaled confidence. |

## Anti-Patterns

- **Premature planning:** Don't dispatch to chancellor for a typo fix. That's execute.
- **Premature execution:** Don't background-dispatch work you haven't scoped. You'll get halfway, hit ambiguity, and waste tokens.
- **Over-asking:** If the user gave enough info and you're stalling, pick the most reasonable interpretation and execute. Reserve ask-user for genuine ambiguity, not indecision.
- **Dispatch to wrong target:** Chancellor plans, jinyiwei executes. Never send execution work to chancellor or planning work to jinyiwei.
