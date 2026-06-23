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
    ├── software-architect/   # Architecture design and decision-making
    ├── react-frontend/       # React/Next.js frontend development
    ├── ai-designer/          # UI/UX design and prototyping
    ├── tauri/                # Tauri desktop app development
    └── dart-flutter/         # Dart/Flutter cross-platform development
```

Each role directory contains:

```
{role}/
├── role.yaml      # Role definition (name, description, prompt, skills)
└── skills/        # Skill files (SKILL.md per skill)
```

## Usage

Install a role with rolebox:

```bash
rolebox install software-architect
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

To contribute a role, create a directory under `roles/` with a `role.yaml` and any required `skills/`. Submit a pull request to this repository.
