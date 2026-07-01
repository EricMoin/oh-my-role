---
name: draft-methodology
description: Objective methodology for researching the codebase and producing a schema-conforming, executable strategy draft
---

# Draft Methodology

How to turn a plan description into a strategy draft that survives review on the
first pass. The strategy schema is canonical in `references/schemas.md` (Strategy
contract) — this skill covers the research discipline and quality bar, not the
field list.

## Core Rule

A draft is ready only when every subtask could be executed by a worker that reads
ONLY that subtask's description — with no access to your reasoning. If a subtask
needs context you did not write into its `description`, the draft is not ready.

## Investigate Before Drafting

Do not draft from assumptions. If you have not read it, you do not know it.

1. **Read** the files the task will touch. Record real file paths, function
   signatures, and line numbers — put them in subtask descriptions.
2. **Grep/Glob** for callers, existing conventions, and similar implementations
   so the draft matches the codebase's real patterns.
3. **Map dependencies** so the `dependencies` graph reflects actual build/import
   order, not a guess.

## Subtask Quality Bar (all must hold)

### 1. Concrete and scoped description
Names specific files, functions, or behaviors to change. A worker can act on it
without guessing. "Fix the bugs" fails; "In `src/api.ts`, add a `timeout?: number`
param to `fetchData` and pass it to the underlying `fetch` call" passes.

### 2. Tool-verifiable acceptance
Every `acceptance` field is checkable from tool output: `lsp_diagnostics clean`,
`build exits 0`, `grep confirms pattern`, `tests pass`. Never "looks good" or
"should work."

### 3. Valid dependency DAG
Every referenced dependency ID exists. No cycles. No self-dependencies. Empty
`[]` means runnable immediately (depth-0).

### 4. Single target
Every subtask targets `jinyiwei`. Department selection happens later, inside the
executor/router — do not pre-assign departments in the draft.

## Subtask Budget (HARD)

A draft MUST NOT exceed **5 subtasks**; aim for **≤ 4**. The orchestrator dispatches
one execution session per subtask against an 8-session per-parent budget, and
needs headroom for validation and a revise round. If the work seems to need more
than 5 units, MERGE related steps into coarser subtasks. Fewer, larger subtasks
give each worker more context and keep the plan inside budget. Do not split finely.

## Risk Classification

Classify overall `risk` as scalar `low` or `high`:

- **high**: any destructive operation (rm, delete, drop, truncate, overwrite,
  force-push, migration, schema change, data cleanup, reset --hard), ambiguous
  scope, cross-module blast radius, irreversible change, or unclear acceptance.
- **low**: well-scoped, non-destructive, clear acceptance, contained blast radius.

When in doubt, classify `high`. A single destructive subtask forces `risk: high`.

## Revision Rounds

When the review stage vetoes, the veto notes arrive via the dispatch prompt. For
each cited defect: locate the subtask ID, apply the specific fix, keep the schema
intact, and do NOT introduce unrelated changes. Re-emit the full draft in the
`draft` fence — never a partial diff.

## Self-Check Before Emitting

1. Schema: required fields present, forbidden fields (`risks` list, `final_notes`,
   string IDs) absent, correct types.
2. Budget: `subtasks` count ≤ 5.
3. Executability: each description is actionable from its own text.
4. Verifiability: each acceptance is tool-checkable.
5. DAG: dependencies valid and acyclic.
