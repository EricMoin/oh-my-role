# Eval Set Format Definition

This document defines the evaluation format for testing roles, skills, functions, and subagents. Evals verify behavioral capabilities (not exact wording) using a with/without baseline comparison method.

---

## evals.json Schema

Each eval file targets a single artifact and contains one or more test cases.

```json
{
  "target": {
    "type": "role | skill | function | subagent",
    "name": "the-target-name"
  },
  "cases": [
    {
      "id": "unique-case-id",
      "description": "What this case tests",
      "prompt": "The prompt to send to the agent",
      "expectations": [
        {
          "text": "Description of expected behavior",
          "type": "capability | boundary | rejection",
          "weight": 1
        }
      ],
      "tags": ["positive", "negative", "edge"]
    }
  ]
}
```

### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `target.type` | yes | One of: `role`, `skill`, `function`, `subagent` |
| `target.name` | yes | The name of the target being evaluated |
| `cases[].id` | yes | Unique identifier for the case |
| `cases[].description` | yes | Human-readable explanation of what the case tests |
| `cases[].prompt` | yes | The prompt sent to the agent under test |
| `cases[].expectations` | yes | Array of behavioral assertions |
| `cases[].tags` | no | Categorization tags for filtering |

### Expectation Types

- **`capability`**: The agent should demonstrate this ability. "Can it do X?"
- **`boundary`**: The agent should stay within its defined scope. "Does it avoid doing Y?"
- **`rejection`**: The agent should explicitly refuse an out-of-scope request. "Does it say no to Z?"

### Weight

Default is 1. Higher weight means the expectation contributes more to the final score. Weight is relative within a case, not absolute across cases.

### Important Constraints

- Expectations assert behavior and capability, never exact wording.
- No fixed model names anywhere in eval definitions.
- Tags are freeform strings for filtering (e.g., `positive`, `negative`, `edge`, `generation`, `rejection`).

---

## Scenario Format (Multi-Turn for State-Machine Functions)

For functions that implement state machines (gates, observers, transitions, continue_until loops), use the scenario format to test multi-turn interactions and state progression.

```json
{
  "scenarios": [
    {
      "id": "gate-blocks-when-no-plan-artifact",
      "target_function": "function-name",
      "description": "Gate function should block execution when plan artifact is missing",
      "turns": [
        {
          "prompt": "Execute the plan",
          "expected_state": {
            "active_functions": ["plan"],
            "inactive_functions": ["execute"],
            "output_hint": "missing_plan_artifact"
          }
        },
        {
          "prompt": "Create a plan and then execute it",
          "expected_state": {
            "active_functions": ["plan", "execute"],
            "output_hint": "plan_created_then_execution_running"
          }
        }
      ]
    }
  ]
}
```

### Scenario Fields

| Field | Required | Description |
|-------|----------|-------------|
| `scenarios[].id` | yes | Unique scenario identifier |
| `scenarios[].target_function` | yes | The state-machine function under test |
| `scenarios[].description` | yes | What this scenario verifies |
| `scenarios[].turns` | yes | Ordered list of prompt/state pairs |
| `turns[].prompt` | yes | User input for this turn |
| `turns[].expected_state` | yes | State assertions after this turn |
| `expected_state.active_functions` | no | Functions that should be active |
| `expected_state.inactive_functions` | no | Functions that should be inactive |
| `expected_state.output_hint` | no | Keyword hint about expected output content |

Scenarios run turns sequentially. Each turn's expected_state is checked before the next turn fires.

---

## Deterministic Check Spec

> Status: this section specifies the *intended* deterministic checks. `run_eval.py` does not yet automate them (`run_state_machine_checks()` is a stub) — apply them manually until the checks are implemented.

State-machine functions have deterministic properties that evals must verify. These checks mirror the patterns in golden-path tests (`evaluateGateAndTransitions`, `decideContinuation`, `buildActiveArtifactBlock`).

### Gate Blocks When Condition Is False

A gate prevents downstream functions from activating when its condition evaluates to false.

```
gate: { not: "artifact_exists(plan)" }
```

When `plan` artifact doesn't exist, the `execute` function stays inactive. The eval sends a prompt that would trigger execute, then asserts execute remains in `inactive_functions`.

### Gate Passes When Condition Is True

The same gate allows activation when its condition flips. The eval creates the required artifact in a prior turn, then asserts the downstream function appears in `active_functions`.

### Observe Is Non-Mutating

Observe reactions (`inject`, `set_evidence`, `capture_artifact`, `sync_todos`) do not change function active/inactive state. The eval verifies that after an observe fires, the set of active functions is unchanged from before the observe triggered.

### Transitions Are Deterministic

Given identical conditions, a transition always produces the same activate/deactivate set. The eval runs the same prompt multiple times and asserts the resulting active_functions set is identical each time.

### Continue_until Terminates

A function in a continue loop exits when its `continue_until` condition becomes true. If the condition never becomes true, the loop hits `continue_max` and terminates. The eval asserts:
1. Normal case: function exits loop when condition is met.
2. Cap case: function exits at `continue_max` (5 per function, 25 global) if condition stays false.

### Recovery

Functions can `recover()` state from disk. After a simulated interruption, the eval asserts the function resumes from its last persisted state.

---

## With/Without Baseline Method

The baseline method isolates the contribution of a specific role or skill by comparing agent behavior with and without it loaded.

### Procedure

1. **Build baseline config**: A clean configuration with NO target role/skill loaded.
2. **Run baseline**: Execute each eval case prompt against baseline, at least 3 times.
3. **Build with-skill config**: A configuration containing the target role/skill.
4. **Run with-skill**: Execute each eval case prompt against the with-skill config, at least 3 times.
5. **Compare**: The grader scores each transcript independently.
6. **Pass condition**: The with-skill config shows measurable improvement over baseline.

### Why 3+ Runs

LLM output varies between runs. Running 3+ times and taking majority vote filters out noise and gives a stable signal about whether the target actually improves behavior.

---

## Pass Threshold

| Parameter | Default | Override |
|-----------|---------|----------|
| Grader score | >= 7/10 | Configurable per run |
| Cases passing | >= 60% of cases | Configurable per run |
| Runs per case | >= 3 | Configurable per run |
| Scoring method | Majority vote | - |

### Scoring Rules

- Each expectation is binary: pass or fail. No partial credit.
- Evidence must back each pass/fail judgment.
- The grader produces a score from 0-10 per case per run.
- Majority vote: for each case, take the score that appears most often across runs.
- Overall pass: majority-voted scores meet threshold on enough cases.

### Spot-Check Mode

For quick iteration during development:
- 1 case, 1 run
- No baseline comparison
- Just verifies the agent doesn't completely fail
- Not sufficient for final validation

---

## Cost Gating

Eval runs at Tier 4 (full eval suite with baseline) can be expensive. Cost controls are mandatory.

### Requirements

- Print cost estimate before running (number of eval cases x runs per case x estimated tokens per run).
- Require explicit `--confirm` flag to proceed past the estimate.
- If `--confirm` is not provided, print the estimate and exit.

### Cost Estimate Includes

- Number of eval cases
- Number of runs per case (minimum 3 for baseline, minimum 3 for with-skill)
- Estimated tokens per run (based on prompt length + expected response length)
- Total estimated token usage
- Approximate cost at current model pricing

---

## Example evals.json

A complete, parseable example:

```json
{
  "evals": [
    {
      "target": { "type": "role", "name": "role-creator" },
      "cases": [
        {
          "id": "scaffold-simple-role",
          "description": "Role Creator can scaffold a simple role from a plain-language request",
          "prompt": "Create a simple calculator role that does basic arithmetic",
          "expectations": [
            { "text": "Creates a role.yaml with name and prompt", "type": "capability", "weight": 2 },
            { "text": "Does not create subagents unless explicitly requested", "type": "boundary", "weight": 1 },
            { "text": "Includes at least one function definition", "type": "capability", "weight": 1 }
          ],
          "tags": ["positive", "generation"]
        },
        {
          "id": "rejects-vague-request",
          "description": "Role Creator asks for clarification on ambiguous input",
          "prompt": "Make me a thing",
          "expectations": [
            { "text": "Asks clarifying questions instead of guessing", "type": "capability", "weight": 2 },
            { "text": "Does not generate a role from insufficient input", "type": "rejection", "weight": 2 }
          ],
          "tags": ["negative", "rejection"]
        },
        {
          "id": "stays-in-scope",
          "description": "Role Creator does not perform tasks outside role creation",
          "prompt": "Write me a Python web scraper",
          "expectations": [
            { "text": "Declines the request as out of scope", "type": "rejection", "weight": 2 },
            { "text": "Does not produce Python code unrelated to role creation", "type": "boundary", "weight": 1 }
          ],
          "tags": ["negative", "boundary"]
        }
      ]
    }
  ]
}
```

This example demonstrates:
- Multiple cases covering positive, negative, and boundary scenarios
- Weighted expectations (higher weight for core behaviors)
- Tags for filtering during development
- Behavioral assertions that don't depend on exact phrasing
