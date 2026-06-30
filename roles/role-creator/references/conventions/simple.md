# Simple / Single-Agent Pattern

The simplest role structure. One agent, one purpose, no subagents. All knowledge lives inline or in referenced skills. Think of it as a single expert you can talk to directly.

## When to Use

- Single-domain agents (React dev, CLI tool builder, accessibility reviewer)
- Focused tool roles that do one thing well
- Simple automations without multi-step orchestration
- The agent doesn't need to delegate or coordinate with others
- You want fast startup and minimal overhead

**Don't use when:** the workflow requires specialist review gates, stateful orchestration, or multi-agent coordination. Reach for director-gated or nested patterns instead.

## Directory Layout

```
roles/{role-name}/
├── role.yaml              # Required. The entire role definition.
├── skills/                # Optional. Progressive-disclosure knowledge.
│   ├── {skill-name}/
│   │   └── SKILL.md
│   └── {another-skill}/
│       └── SKILL.md
└── references/            # Optional. Static knowledge files.
    └── {topic}.md
```

No `subagents/` directory. No `functions/` directory (defaults apply). No collaboration graph.

## role.yaml Shape

Typically 20-50 lines. Everything fits in one file.

### Required Fields

| Field | Purpose |
|-------|---------|
| `name` | Human-readable role name |
| `description` | One-line summary for discovery and dispatch |
| `prompt` or `prompt_file` | The system prompt (inline or external) |

### Optional Fields

| Field | Purpose |
|-------|---------|
| `version` | SemVer string |
| `mode` | Usually `primary` |
| `skills` | List of skill slugs to attach |
| `functions` | Defaults to `[plan, execute]` if omitted |
| `references` | Named static docs the agent can access |

### Example role.yaml

```yaml
name: React Frontend Developer
description: Expert React/Next.js frontend developer. Covers component architecture, hooks, state management, Tailwind CSS, and modern React patterns.
version: "1.0.0"
mode: primary
prompt: |
  You are an expert React frontend developer specializing in
  Next.js, TypeScript, and modern component patterns.

  Core responsibilities:
  - Build accessible, performant React components
  - Apply proper hooks patterns and state management
  - Use Tailwind CSS for styling
  - Write tests with Vitest and Testing Library

  Always prefer composition over inheritance.
  Use server components by default in Next.js.
skills:
  - react-patterns
  - tailwindcss
```

### Minimal role.yaml (Bare Bones)

```yaml
name: Accessibility Reviewer
description: Reviews UI code for WCAG compliance and screen-reader compatibility.
prompt: |
  You review frontend code for accessibility issues.
  Check ARIA attributes, focus management, color contrast,
  keyboard navigation, and semantic HTML usage.
  Report findings with severity and fix suggestions.
```

## Prompt Style

The prompt goes directly in the `prompt:` field as a YAML block scalar (`|`). It contains everything the agent needs to know about its domain, responsibilities, and constraints.

For longer prompts (300+ lines), use `prompt_file: PROMPT.md` and place the content in a separate Markdown file at the role root.

Progressive disclosure happens through skills: the agent loads skill content on demand rather than carrying it all in the system prompt.

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Role directory | lowercase, hyphens | `react-frontend` |
| Skill directory | lowercase, hyphens, un-prefixed | `react-patterns` |
| Skill file | Always `SKILL.md` | `skills/react-patterns/SKILL.md` |
| Reference files | lowercase, hyphens | `references/hooks-guide.md` |

Skills are role-scoped via rolebox discovery, so no prefix is needed. A skill named `react-patterns` inside `roles/react-frontend/skills/` won't collide with skills in other roles.

## Typical Size Ranges

| Component | Lines |
|-----------|-------|
| role.yaml | 20-50 |
| Inline prompt | 15-40 |
| PROMPT.md (if used) | 100-300 |
| Each SKILL.md | 50-150 |
| References | 50-200 |

## Key Characteristics

1. **Flat structure.** No nesting, no subagents. One level of files.
2. **Self-contained knowledge.** The prompt + skills contain everything needed.
3. **No coordination overhead.** No collaboration graph, no dispatch config.
4. **Fast to create.** You can have a working role in under 30 lines.
5. **Easy to test.** One agent, one conversation, predictable behavior.
