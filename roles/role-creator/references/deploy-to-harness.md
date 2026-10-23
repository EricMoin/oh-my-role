# Local deployment

Use `scripts/deploy_role.py <roleDir> --target-dir <directory>` for a working copy.
This path does not publish a release or create an installation lock record. Registry
installs remain managed by rolebox's CLI. A regular development directory can shadow
a released role, so report that explicitly when replacing one.

## Host selection

Resolve the selected host's configured home, respecting environment overrides:

| Host | Role directory | Runtime verification |
|---|---|---|
| OpenCode | `${XDG_CONFIG_HOME:-~/.config}/opencode/rolebox` | Available `asset_hot_reload`, then role/asset discovery |
| Pi | `${PI_CODING_AGENT_DIR:-~/.pi/agent}/rolebox` | Host-specific reload/restart and discovery |
| dsh | `${DSH_HOME:-~/.dsh}/rolebox` | Host-specific role reload/restart and discovery |
| Codex | `${CODEX_HOME:-~/.codex}/rolebox` | Integration restart and discovery; no graph backend/hot-reload tool |

These are path conventions, not shell commands. `~` must be expanded deliberately.
An explicit target overrides them. The target must already exist; deployment never
creates a guessed host installation. Read the installed tool surface before invoking
reload tools. `asset_search` indexes skills/functions/references by name/description;
use actual asset names plus the role ID filter, and verify owner metadata.

## Replacement

The deploy script stages the complete filtered copy, validates it, and replaces the
destination entry with renames on the same filesystem. Existing entries require
`--replace` and user authorization (which may already be present in the request).
The old entry is retained under `.role-creator-backups/` outside role discovery.
Symlinks are moved without following them. The previous entry is restored when the
final rename fails. Do not use `rsync <source>/ <existing-link>/`: that writes through
the link into a published package.

Validation checks the actual staged files. A readable inline prompt is sufficient;
`PROMPT.md` is required only if `prompt_file` references it. Local authoring PASS does
not prove host compatibility, external dependency availability or behavior.

## Installation check versus live deployment

`sync_check.py` exercises the CLI in disposable homes with its own staged source and
lock entry. Its PASS means installation/link metadata is consistent for that role
and target. Plugin registration is config metadata, not evidence the plugin executed;
Pi/dsh registration may be unknown. Skill loading and activation remain unverified.
This optional check neither validates the running user's host nor deploys into it.

`deploy_role.py` reports `runtime_verified: false`. Promote that claim only after
actual host discovery/activation. Keep failed reloads and required restarts visible.
