---
name: veto-criteria
description: Objective, checkable criteria for pass vs veto of a strategy draft
---

## Core Rule

A veto MUST cite a specific, fixable defect. If no fixable defect exists,
the verdict MUST be pass. Absence of defects is not grounds for veto.

Every veto reason MUST reference:
1. Which subtask ID is affected
2. Which acceptance criterion is violated
3. What change would fix it

## Pass Criteria (all must hold)

### 1. Objective is clear and bounded
The draft's `objective` is a single, achievable sentence. The scope is
contained — it does not expand beyond the original request.

**Check**: Can a reader understand what "done" means without guessing?

### 2. Subtask descriptions are concrete and scoped
Each subtask has:
- A description naming specific files, functions, or behaviors to modify
- A `dependencies` array (empty `[]` is valid)
- A `target` field set to `jinyiwei`

**Check**: Could an executor read only the subtask description and produce a
verifiable execution report? If not, the subtask is too vague.

### 3. Every subtask has a verifiable acceptance condition
Each `acceptance` field describes a checkable condition using tool-level
evidence: `lsp_diagnostics clean`, `build exits 0`, `grep confirms pattern`.
Subjective criteria ("looks good", "should work", "is clean") are not
verifiable.

**Check**: Can the acceptance condition produce a yes/no answer from tool
output? If it requires human judgment, it is not verifiable.

### 4. Subtask IDs are monotonic integers starting from 1
No string IDs, no gaps, no duplicates. The strategy contract requires
integer IDs.

### 5. Dependencies form a valid DAG
Every referenced dependency ID exists as a subtask. No cycles. No
self-dependencies.

### 6. All required fields are present
Per the strategy contract: `objective`, `subtasks` (array), `risk`, and
each subtask must have `id`, `description`, `target`, `dependencies`,
`acceptance`.

### 7. Forbidden fields are absent
The draft MUST NOT contain fields forbidden by the strategy contract:
`risks` (list form), `final_notes`, string-typed subtask IDs.

## Veto Criteria (any one triggers veto)

### V1. Missing or unclear objective
**Valid veto**: "The `objective` field is empty."
**Invalid veto**: "The objective seems a bit vague." (not a specific defect)

### V2. Subtask lacks verifiable acceptance
**Valid veto**: "Subtask 3 has acceptance: 'Ensure it works correctly.' This
is subjective and not verifiable with tool output."
**Invalid veto**: "The acceptance criteria could be stronger." (does not name
a specific defect)

### V3. Subtask description is too vague to execute
**Valid veto**: "Subtask 2 description: 'Fix the bugs.' No files, functions,
or behaviors are named. An executor cannot determine what to change."
**Invalid veto**: "The description could use more detail." (does not show why
it is unexecutable)

### V4. Non-integer subtask ID
**Valid veto**: "Subtask ID `'refactor-phase'` is a string. The strategy
contract requires monotonic integers."
**Invalid veto**: "The IDs look unusual." (not a contract violation)

### V5. Missing required field
**Valid veto**: "Subtask 1 is missing the `dependencies` field. The strategy
contract requires it even when empty."
**Invalid veto**: none — a missing required field is always a specific defect.

### V6. Forbidden field present
**Valid veto**: "The draft contains `risks` (a list) instead of the scalar
`risk` field required by the strategy contract."
**Invalid veto**: none — a forbidden field is always a specific defect.

### V7. Dependency cycle or missing dependency target
**Valid veto**: "Subtask 4 depends on subtask 7, but no subtask with id=7
exists in the draft."
**Invalid veto**: "The dependencies seem complex." (does not identify a
cycle or missing link)

### V8. Contradicts strategy contract schema
**Valid veto**: "The draft emits `final_notes`, which is a forbidden field
in the strategy contract."
**Invalid veto**: "The format looks a bit off." (does not name which field
violates which contract)

## Examples

### Example: Valid Veto

```yaml
verdict: veto
notes: |
  Subtask 2 acceptance: "page looks good" — not verifiable with tool output.
  Subtask 3 references `config/settings.yaml` but that file does not exist
  in the codebase.
  Draft uses `risks` (list) instead of scalar `risk` (strategy contract violation).
severity: medium
```

Each note cites a specific subtask ID and the defect. Each defect is fixable.

### Example: Invalid Veto (REJECT)

```yaml
verdict: veto
notes: "The strategy seems risky and might be hard to execute."
severity: medium
```

This is invalid because: no subtask ID is cited, no specific defect is named,
and "seems risky" is an impression, not a fixable defect. A reviewer MUST NOT
emit this style of veto.

### Example: Valid Pass

```yaml
verdict: pass
notes: "All subtasks have concrete descriptions and verifiable acceptance
criteria. IDs are monotonic integers. No forbidden fields present.
Objective is clear and bounded."
severity: low
```

## Assessment Procedure

1. **Schema check**: Does the draft conform to the strategy contract
   (required fields present, forbidden fields absent, correct types)?
2. **Per-subtask audit**: For each subtask, check: description
   concreteness, acceptance verifiability, dependency validity.
3. **Structural check**: Are IDs monotonic? Is the DAG acyclic?
4. **Objective check**: Is the objective clear, bounded, and aligned with
   the original request?

For each defect found, record: the subtask ID (or "root" for top-level
defects), what criterion is violated, and what change would fix it. These
become the concrete revision notes in the veto verdict.

If no defect is found after checking all criteria, emit `verdict: pass`.
