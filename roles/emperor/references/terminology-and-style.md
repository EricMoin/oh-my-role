---
name: terminology-and-style
description: De-theming glossary, language rules, and style guide for emperor role content
---

# Terminology and Style Guide

This reference defines the de-theming glossary, language rules, and negative-constraint preservation checklist for the emperor role rewrite. Every contributor rewriting emperor prompts or subagent descriptions MUST follow this document.


## 1. Glossary: Themed Term to Functional Replacement

Role `name:` fields and dispatch IDs (Emperor, Chancellor, Jinyiwei, Drafter, Reviewer, Finalizer, UI, Backend, Test) remain as literal identifiers. They are routing labels. Prose MUST NOT build persona or role-play framing around them.

| Themed Term | Functional Replacement | Context |
|---|---|---|
| Emperor (prose) | top-level orchestrator | name field stays; prose uses "orchestrator" |
| Imperial / imperial authority | orchestrator-level | adjective form |
| Supreme orchestrator (as persona) | top-level orchestrator (as function) | describe what it does, not rank |
| Chancellor (prose) | planner (role) | name field stays; prose uses "planner" |
| Jinyiwei (prose) | executor/router (role) | name field stays; prose uses "executor/router" |
| Drafter (prose) | draft stage / drafting step | part of three-stage planning |
| Reviewer (prose) | review stage / review step | part of three-stage planning |
| Finalizer (prose) | finalization stage / final step | part of three-stage planning |

### Chinese Terms

| Themed Term | Functional Replacement | Context |
|---|---|---|
| (imperial "we") | (remove entirely) | No first-person royal persona. Use "you" addressing the model. |
| (triage) | classify | action verb |
| (dispatch) | dispatch | action verb |
| (synthesize/report) | synthesize | action verb |
| (chancellor / prime minister) | planner (role) | use English functional term |
| (Jinyiwei / secret police) | executor/router (role) | use English functional term |
| (strategy / plan) | strategy | noun |
| (present for user approval) | require explicit user approval | action phrase |
| (three departments: drafting, veto, finalization) | three-stage planning loop (draft, review, finalize) | pipeline description |
| (Drafting Department) | draft stage | first step in planning loop |
| (Veto/Review Department) | review stage | second step in planning loop |
| (Finalization Department) | finalization stage | third step in planning loop |
| (six ministries) | departments | collective noun for domain workers |
| (Engineering Ministry) | UI department | domain: front-end/UI |
| (Military Ministry) | backend department | domain: backend/API |
| (Justice Ministry) | test department | domain: testing/QA |
| (Revenue Ministry) | data department | domain: data (schema, migrations, queries, persistence) |
| (Rites Ministry) | docs department | domain: documentation (README, guides, comments) |
| (Personnel Ministry) | quality department | domain: quality (lint, format, static analysis) |
| (three modes) | operating modes | section heading |
| (validation loop) | validation step | post-execution check |
| (planner sync slot + background sub-departments + executor headroom) | (rewrite as plain English comment explaining concurrency budget) | YAML comment |
| (covers full three-stage nested loop duration) | (rewrite as plain English comment explaining timeout scope) | YAML comment |

### Compound Phrases

| Themed Phrase | Functional Replacement |
|---|---|
| "Only do three things" | "Your only actions: classify, dispatch, synthesize." |
| "Force deliberation path" | "Require the plan-then-execute path." |
| "Present strategy to user for approval" | "Require explicit user approval before execution." |
| "Emperor self-judges" | "The orchestrator determines routing." |
| "Dispatch chancellor to produce strategy" | "Dispatch to the planner subtree for strategy." |
| "Jinyiwei executes" | "The executor/router handles implementation." |
| "Walk the validation loop" | "Run the validation step." |


## 2. Language Rules

1. All prose MUST be in English. No CJK characters anywhere in rewritten prompts.
2. Role `name:` field values (Emperor, Chancellor, Jinyiwei, Drafter, Reviewer, Finalizer, UI, Backend, Test) remain unchanged. They are dispatch identifiers.
3. Directory names and dispatch ID strings (e.g., `emperor--chancellor`, `emperor--jinyiwei`) remain unchanged. They are system routing labels.
4. YAML keys and structural field names remain unchanged.
5. When a YAML comment previously used CJK, replace with equivalent English explanation.
6. Description fields in role.yaml files: rewrite to English, remove CJK parentheticals.


## 3. Describe Function, Not Persona

Every sentence about a role MUST describe what it does, not what it "is" as a character. The model receives instructions, not an identity to inhabit.

### Before/After Examples

| Before (persona-driven) | After (function-driven) |
|---|---|
| "I am the supreme decision-maker. I don't write code, I don't plan details. I only do three things: judge, dispatch, report." | "You are the top-level orchestrator. Your only actions: classify, dispatch, synthesize. You do not write code. You do not plan details." |
| "Dispatch the chancellor to plan..." | "Dispatch to the planner subtree for strategy production." |
| "Jinyiwei executes." | "The executor/router role handles implementation subtasks." |
| "The chancellor returns the strategy to the emperor." | "The planner returns the strategy to the orchestrator." |
| "You are the Engineering Ministry, the front-end executor." | "You are the UI department executor. You handle front-end implementation." |
| "You are the Justice Ministry, the testing executor." | "You are the test department executor. You handle testing and QA." |
| "Walk the validation loop." | "Run the validation step on all execution reports." |
| "Emperor self-judges: simple gets direct answer; complex or destructive gets deliberation." | "The orchestrator determines routing: simple requests get a direct answer; complex or destructive requests require the plan-then-execute path." |

### Rules

- Use "you" to address the model receiving instructions. Never "I" or "we" from the role's perspective.
- Name other roles by their function in prose ("the planner", "the executor/router", "the review stage"). Use the literal dispatch ID only when showing code/dispatch calls.
- Do not anthropomorphize dispatch. "Dispatch to X" not "Ask X to" or "Command X to."


## 4. Negative-Constraint Preservation Checklist

Every rewrite of the emperor prompt or its subagent prompts MUST preserve these constraints verbatim or with equivalent force. If a rewrite drops any item below, the rewrite is invalid.

### MANDATORY CONSTRAINTS

1. **No code authoring.** The orchestrator MUST NOT write code, edit files, plan implementation details, or debug. It delegates ALL implementation to subagents.

2. **Silent dispatch.** The orchestrator MUST NOT narrate routing decisions to the user. Classify and dispatch without commentary. The user sees results, not process.

3. **Destructive operations require explicit user approval.** No override. No implicit consent. The `|auto|` mode is NOT a backdoor for destructive operations. When `|auto|` is active, destructive operations STILL require the plan-then-approve-then-execute path.

4. **Ambiguity defaults to destructive.** When unsure whether an operation is destructive, treat it as destructive. REQUIRED.

5. **Department scope isolation.** Each department executor handles only its own domain. Unknown domains fall back to the executor/router for direct handling. Departments MUST NOT cross domain boundaries.

6. **No unverified results.** NEVER report unverified results as verified. If validation was not run, say so. If validation failed, say so.

7. **One retry maximum.** On dispatch failure, retry exactly once with the same parameters. If the retry fails, report honestly to the user. No retry loops. No silent swallowing of errors.

8. **Always emit final_answer.** Every request MUST produce a `final_answer` fence, even on partial failure or complete failure. The fence contains whatever was accomplished plus an honest accounting of what failed.

9. **No depth violation.** The executor/router MUST NOT dispatch beyond its allowed depth. Department workers MUST NOT delegate at all. Depth limits are hard constraints.

10. **DIRECT path skips validation.** When the orchestrator answers directly (no planner involvement), the validation step MUST be skipped. Validation only applies to plan-execute paths.


## 5. Tone and Style

### Imperative Mood

Address the model with direct commands:
- "Classify the request."
- "Dispatch to the planner subtree."
- "Do NOT narrate routing."
- "Emit the final_answer fence."

### Safety Language

For constraints that protect users or system integrity, use absolute language:

| Use | Do NOT use |
|---|---|
| MUST NOT | should not |
| REQUIRED | recommended |
| FORBIDDEN | discouraged |
| NEVER | try to avoid |
| ALWAYS | ideally |

No hedging on safety rules. "Consider" and "should" are acceptable only for non-safety optimization hints.

### Structural Preferences

- Short paragraphs. One idea per paragraph.
- Numbered lists for sequential steps.
- Tables for mappings and comparisons.
- Code fences for dispatch call examples, YAML schemas, fence format illustrations.
- Bold for constraint keywords (MUST NOT, REQUIRED, FORBIDDEN).
- No em dashes. Use commas, periods, or semicolons.
- No promotional language, no significance inflation.
- No CJK characters anywhere.
