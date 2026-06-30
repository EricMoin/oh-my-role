# oh-my-role

The default rolebox registry — community AI agent roles for [opencode](https://github.com/sst/opencode).

## What is oh-my-role?

oh-my-role provides pre-built AI agent roles that extend opencode's capabilities. Each role bundles a system prompt, curated skills, and domain-specific knowledge into a single installable package.

## Directory Structure

```
oh-my-role/
├── registry.yaml          # Registry manifest listing all available roles
├── README.md
└── roles/
    ├── software-architecture/   # Architecture design, review, ADRs, migration planning
    ├── react-frontend/       # React/Next.js frontend development
    ├── ai-designer/          # UI/UX design and prototyping
    ├── oss-finder/           # OSS discovery, source tracing, and adoption advice
    ├── supersearch/          # Evidence-backed search across local files, web, GitHub, docs, sessions, and media
    ├── tauri/                # Tauri desktop app development
    ├── dart-flutter/         # Dart/Flutter cross-platform development
    └── jetpack-compose/      # Jetpack Compose and Android development
```

Each role directory contains:

```
{role}/
├── role.yaml      # Role definition (prompt, skills, references, functions, permissions)
├── skills/        # Skill files (SKILL.md per skill)
├── subagents/     # Optional rolebox child agents
└── references/    # Optional long-form reference material
```

Rolebox discovers file-based subagents from `subagents/{subagent}/role.yaml` and injects them into the parent role as `{role}--{subagent}` dispatch targets. Keep each subagent `name` slug aligned with its directory name so dispatch IDs and local skills resolve correctly.

Rolebox also discovers Markdown reference files under `references/`. A top-level `references:` block in `role.yaml` can provide stable names and descriptions for those files.

## Usage

Install a role with rolebox:

```bash
rolebox install software-architecture
```

This downloads the role from the default registry and installs it to your local opencode configuration.

## Adding Your Own Registry

To use a custom registry with rolebox, add it to your opencode configuration. See the [rolebox documentation](https://github.com/EricMoin/rolebox) for details on registry configuration and creating custom roles.

## Version Management

Role versions are tracked via git tags. Each release corresponds to a semver tag:

```bash
git tag v1.0.0
git push --tags
```

Individual role versions are declared in their `role.yaml` files and cross-referenced in `registry.yaml`.

## Contributing

To contribute a role, create a directory under `roles/` with a `role.yaml` and any required `skills/`, `references/`, or `subagents/`. Submit a pull request to this repository.
