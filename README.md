# oh-my-role

Default role registry for [rolebox](https://github.com/EricMoin/rolebox). Curated AI agent roles for [opencode](https://github.com/nicholasgriffintn/opencode).

## Available Roles

| Role | Description |
|------|-------------|
| `software-architect` | System design and architecture decisions with trade-off analysis |
| `react-frontend` | React/Next.js frontend development with Tailwind CSS and Zustand |
| `ai-designer` | UI/UX design specification documents with psychology and accessibility |
| `tauri` | Desktop app development with Tauri (Rust + Web) |
| `dart-flutter` | Cross-platform mobile and desktop with Dart and Flutter |

## Usage

This registry is the default for rolebox. Install roles with:

```bash
rolebox install software-architect
rolebox install react-frontend
rolebox install ai-designer
rolebox install tauri
rolebox install dart-flutter
```

Then deploy:

```bash
rolebox sync opencode
```

## Structure

```
oh-my-role/
├── registry.yaml
├── README.md
└── roles/
    ├── software-architect/
    │   ├── role.yaml
    │   └── skills/
    ├── react-frontend/
    │   ├── role.yaml
    │   └── skills/
    ├── ai-designer/
    │   ├── role.yaml
    │   └── skills/
    ├── tauri/
    │   ├── role.yaml
    │   └── skills/
    └── dart-flutter/
        ├── role.yaml
        └── skills/
```

## Adding This Registry

This is the default registry. If you removed it or need to re-add:

```bash
rolebox registry add https://github.com/EricMoin/oh-my-role
```

## License

MIT
