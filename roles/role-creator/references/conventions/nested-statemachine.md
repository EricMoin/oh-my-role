# Nested + State-Machine-Functions Pattern

The most complex pattern. A top-level orchestrator uses stateful functions that observe lifecycle events, auto-activate on conditions, and transition between states. Subagents nest multiple levels deep, each with their own functions and skills. The orchestrator reacts to what's happening rather than following a fixed pipeline.

## When to Use

- Complex multi-agent systems with stateful orchestration
- The agent needs to observe and react, not just respond to commands
- Auto-activation on lifecycle events (messages arrive, tools complete)
- Deep hierarchies where sub-subagents handle specialized domains
- Imperial/governing patterns where one agent manages many teams
- You need fine-grained control over what tools the orchestrator can access

**Don't use when:** a linear gate pipeline suffices (use director-gated), or the task is single-domain (use simple). This pattern carries significant complexity overhead.

## Directory Layout

```
roles/{role-name}/
├── role.yaml                          # Orchestrator with locked tools
├── PROMPT.md                          # Orchestration strategy
├── functions/                         # State-machine functions
│   ├── {function-name}.md
│   └── {another-function}.md
├── references/                        # Shared knowledge
│   └── {topic}.md
└── subagents/                         # First level
    ├── {subagent-a}/
    │   ├── role.yaml
    │   ├── PROMPT.md
    │   ├── functions/
    │   │   └── {fn}.md
    │   ├── skills/
    │   │   └── {skill}/
    │   │       └── SKILL.md
    │   └── subagents/                 # Second level (sub-subagents)
    │       ├── {sub-sub-a}/
    │       │   ├── role.yaml
    │       │   └── skills/
    │       └── {sub-sub-b}/
    │           ├── role.yaml
    │           └── functions/
    │               └── {fn}.md
    └── {subagent-b}/
        ├── role.yaml
        ├── functions/
        │   └── {fn}.md
        └── subagents/                 # Second level
            ├── {sub-sub-c}/
            │   └── role.yaml
            └── {sub-sub-d}/
                └── role.yaml
```

Nesting goes up to 3 levels deep. Each level can have its own functions, skills, and subagents.

## role.yaml Shape

The orchestrator role.yaml is typically 35-50 lines. It's distinguished by `locked`, `auto_activate`, tool restrictions, and `dispatch` config.

### Required Fields

| Field | Purpose |
|-------|---------|
| `name` | Human-readable role name |
| `description` | Identity and boundaries |
| `prompt_file` | Points to PROMPT.md |
| `functions` | List of state-machine function names |
| `auto_activate` | Functions that activate automatically |

### Distinctive Fields

| Field | Purpose |
|-------|---------|
| `locked` | `true` prevents function deactivation by the agent |
| `tools` | Explicit tool restrictions (e.g., `Write: false`) |
| `dispatch` | Concurrency and parallelism controls |
| `auto_activate` | Functions active from the start of every conversation |

### Example role.yaml

```yaml
name: Emperor
description: "Supreme orchestrator. Triages requests, dispatches to specialist teams, synthesizes results. Never writes code directly."
mode: primary
prompt_file: PROMPT.md
functions:
  - triage
  - synthesize
  - effort
auto_activate:
  - triage
  - synthesize
locked: true
tools:
  Write: false
  Edit: false
  Bash: false
dispatch:
  maxActivePerParent: 2
  maxConcurrent: 5
```

## State-Machine Functions

Functions are the core differentiator of this pattern. They aren't simple action handlers; they're reactive state machines that observe lifecycle events and trigger behavior.

### Function File Structure

Each function lives in `functions/{name}.md` with YAML frontmatter defining its behavior.

```markdown
---
name: triage
description: Classifies incoming requests and routes to appropriate subagent teams.
phase: intake
priority: 100
auto_activate: true
locked: true
observe:
  - on: message
    inject: |
      TRIAGE DIRECTIVE: Classify this message. Determine which team handles it.
      Categories: architecture, implementation, review, research.
      Dispatch to the appropriate subagent. Do not attempt the work yourself.
transitions:
  - when: "all dispatched tasks complete"
    activate:
      - synthesize
    deactivate:
      - effort
continue_until:
  any:
    - "request fully classified and dispatched"
    - "user provides clarification"
gate:
  pass: "Request routed to at least one subagent"
  fail: "Ask user for clarification"
---

## Triage Function

You classify incoming work and dispatch it to the right team.

### Routing Rules

- Architecture questions -> chancellor team
- Implementation tasks -> jinyiwei team
- Code review -> jinyiwei/reviewer
- Research -> dispatch with research brief

### Dispatch Format

When dispatching, provide:
1. Clear task description
2. Relevant context from the user's message
3. Success criteria for the subagent
```

### Key Frontmatter Fields

| Field | Purpose |
|-------|---------|
| `observe` | Lifecycle hooks that inject directives |
| `transitions` | State changes triggered by conditions |
| `continue_until` | Loop termination conditions |
| `gate` | Pass/fail criteria for the function |
| `phase` | Logical grouping (intake, execution, synthesis) |
| `priority` | Ordering when multiple functions active (higher = first) |
| `auto_activate` | Starts active without explicit activation |
| `locked` | Cannot be deactivated by the agent |

### Observe Pattern

Functions inject directives on lifecycle events. The agent sees these directives automatically.

```yaml
observe:
  - on: message
    inject: |
      SYNTHESIS CHECK: Have all dispatched tasks returned?
      If yes, compile results into a unified response.
  - on: tool_after
    filter: dispatch
    inject: |
      A subagent just completed. Check if more dispatches are needed.
```

Supported events: `message`, `tool_after`, `activate`, `deactivate`.

### Transition Pattern

Transitions change the active function set based on conditions.

```yaml
transitions:
  - when: "all subtasks complete"
    activate:
      - synthesize
    deactivate:
      - effort
  - when: "user requests change"
    activate:
      - triage
    deactivate:
      - synthesize
```

### Continue-Until Pattern

Defines when a function's loop terminates.

```yaml
continue_until:
  any:
    - "all dispatched tasks have returned results"
    - "user explicitly cancels"
  all:
    - "at least one task dispatched"
    - "no pending clarifications"
```

`any` means stop when any single condition is met. `all` means every condition must be true.

## Nested Subagent Structure

### First-Level Subagents

Direct children of the orchestrator. They handle domain-level coordination.

```yaml
name: Chancellor
description: "Coordinates architecture and design decisions. Manages drafter, reviewer, and finalizer."
mode: subagent
prompt_file: PROMPT.md
functions:
  - coordinate
  - quality-check
subagents:
  - drafter
  - reviewer
  - finalizer
```

### Second-Level Subagents (Sub-Subagents)

Children of first-level subagents. They do the actual specialized work.

```yaml
name: Drafter
description: "Writes initial drafts of architecture documents and design proposals."
mode: subagent
prompt: |
  You draft architecture documents based on the brief
  provided by the Chancellor. Focus on clarity and
  completeness. Your output goes to the Reviewer.
skills:
  - architecture-drafting
```

### ID Convention for Nested Agents

IDs derive from the full directory path:

| Level | ID Format | Example |
|-------|-----------|---------|
| First-level | `{role}--{subagent}` | `emperor--chancellor` |
| Second-level | `{role}--{subagent}--{sub-subagent}` | `emperor--chancellor--drafter` |
| Third-level | `{role}--{sub}--{subsub}--{subsubsub}` | (rare, avoid if possible) |

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Role directory | lowercase, hyphens | `emperor` |
| Function file | lowercase, hyphens | `functions/triage.md` |
| Subagent directory | lowercase, hyphens | `subagents/chancellor/` |
| Sub-subagent dir | lowercase, hyphens | `subagents/chancellor/subagents/drafter/` |
| Agent ID | path-derived, double-dash separated | `emperor--chancellor--drafter` |
| Skills | flexible naming, context-dependent | `architecture-drafting` |

## Tool Restrictions

The orchestrator typically restricts its own tools to prevent it from doing work directly:

```yaml
tools:
  Write: false
  Edit: false
  Bash: false
```

This forces all actual work through subagents, keeping the orchestrator purely in a coordination role.

## Dispatch Configuration

Controls parallelism and resource allocation:

```yaml
dispatch:
  maxActivePerParent: 2    # Max concurrent subagents per parent
  maxConcurrent: 5         # Total concurrent across all levels
```

## Typical Size Ranges

| Component | Lines |
|-----------|-------|
| Orchestrator role.yaml | 35-50 |
| Orchestrator PROMPT.md | 200-400 |
| Each function file | 50-120 |
| First-level subagent role.yaml | 15-30 |
| Second-level subagent role.yaml | 8-20 |
| Total nesting levels | 2-3 |
| Functions per agent | 2-5 |
| Total subagents (all levels) | 5-15 |

## Key Characteristics

1. **Reactive, not sequential.** Functions observe events and inject directives. The agent responds to what's happening.
2. **Auto-activation.** Key functions start active and stay active (`locked: true`). No explicit invocation needed.
3. **Tool-restricted orchestrator.** The top-level agent can't write code or files. It coordinates only.
4. **Deep nesting.** Sub-subagents handle actual work. Each level adds specialization.
5. **State transitions.** Functions activate/deactivate based on conditions, creating emergent workflow.
6. **Lifecycle hooks.** `observe` patterns on `message`, `tool_after`, etc. give the agent awareness of its environment.
7. **Bounded concurrency.** `dispatch` config prevents resource exhaustion.

## Comparison with Director-Gated

| Aspect | Director-Gated | Nested State-Machine |
|--------|---------------|---------------------|
| Flow control | Explicit DAG edges | Reactive transitions |
| Activation | Director dispatches | Auto-activate on events |
| Nesting depth | 1 level (director + subagents) | 2-3 levels |
| Orchestrator tools | May have Read, Grep | Typically all restricted |
| Gate mechanism | Skill-based gate checks | Function frontmatter gates |
| Complexity | Medium | High |
| Best for | Linear review pipelines | Complex adaptive systems |
