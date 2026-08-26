# Deploy-to-Harness — Local Role Deployment

How a freshly generated role becomes **live** in the local rolebox harness: where the harness lives, how roles are represented there, copy semantics, the overwrite guard, and the hot-reload + discovery verification loop. This is the reference for the `|deploy|` function (`functions/deploy.md`).

## 1. The Harness Directory

The live install target for rolebox is:

```
~/.config/opencode/rolebox/
```

Verified layout (macOS, rolebox 1.5.0-era install):

```
~/.config/opencode/rolebox/
├── .rolebox/                  # engine state (logs/, state/) — do not touch
├── registry.yaml              # local registry manifest
├── emperor/                   # real directory — in-development role
├── react-frontend/            # real directory — in-development role
├── jetpack-compose/           # real directory — in-development role
├── apk-reverse-engineer/      # real directory — in-development role
├── comment-writer/            # real directory — in-development role
└── role-creator -> ~/.local/share/rolebox/roles/oh-my-role/role-creator@0.2.0   # symlink — released role
```

Two representation conventions coexist:

- **Released roles** are **symlinks** pointing at packaged installs under `~/.local/share/rolebox/roles/oh-my-role/<name>@<version>` (e.g. `role-creator`, `dart-flutter`, `git-master`, `oss-finder`, `rolebox-tester`, `rust-engineer`, `software-architecture`, `supersearch`, `teacher`, `ai-designer`).
- **In-development roles** are **real directories** inside the harness (e.g. `emperor`, `react-frontend`, `jetpack-compose`, `apk-reverse-engineer`, `comment-writer`). This is the convention a freshly generated, unreleased role follows.

Deploy writes a real directory. It never creates symlinks (that is the release path) and never writes into `~/.local/share/rolebox/roles/`.

## 2. What Deploy Does NOT Use (Existing Scripts)

The repo has **no script that deploys into the live harness**. The relevant existing tooling and how it relates:

| Script | Purpose | Relation to deploy |
|---|---|---|
| `roles/role-creator/scripts/validate_role.py` | Tier 1+2 structural + resolution validation, JSON verdict `PASS`/`FAIL`, exit 0/1 | **Mandatory gate** — deploy refuses unvalidated roles |
| `roles/role-creator/scripts/sync_check.py` | Tier 3 health check in a **throwaway** config dir via rolebox CLI | Not the live path; the live harness itself is the real health check |
| `roles/role-creator/scripts/package_role.py` | Validate + zip a role for distribution | Publishing, not deploying |
| `roles/role-creator/scripts/registry_write.py` | Upsert into `registry.yaml` | Publishing, not deploying |
| `rolebox install <name>` (CLI, documented in README) | Install from a registry | Release path — requires a published role, not a working copy |

Deploy therefore uses raw `rsync`/`cp -R` into the harness dir, followed by `asset_hot_reload()`. If a dedicated install/sync script is ever added to the repo, deploy should switch to it; until then `rsync -a` is the documented mechanism.

## 3. Copy Semantics

First install (or after overwrite confirmation):

```bash
rsync -a --exclude tests/ --exclude evals/ --exclude __pycache__/ \
      --exclude '.DS_Store' --exclude '*.pyc' --exclude '*.bak' \
      <roleDir>/ "$target/<roleName>/"
```

- `rsync -a` preserves structure, permissions, and internal symlinks; `cp -R` is an acceptable fallback.
- Excludes mirror `package_role.py` conventions — `tests/`, `evals/`, `__pycache__/`, `.DS_Store`, `*.pyc`, `*.bak` never ship into the harness.
- **Re-deploy**: add `--delete` only after the user confirmed the overwrite, so the harness copy is an exact mirror of the role dir. Never `--delete` on a first install.

## 4. Overwrite Guard (Destructive-Overwrite Protection)

Check before copying:

```bash
ls -ld "$target/$roleName"
```

- No entry → copy freely.
- Real directory or symlink exists → **explicit user confirmation required**. Silently replacing a live role destroys whatever is currently active in the harness. A symlink entry means the name is a released install; warn that the overwrite replaces a released role with an unreleased local copy.

This guard is mandatory: an unconfirmed overwrite is treated as a destructive operation and must not happen.

## 5. Validation Gate

`|deploy|` runs the Tier 1+2 validator first:

```bash
python3 scripts/validate_role.py <roleDir> --json
```

Contract (from `validate_role.py`): top-level `verdict` is `"PASS"` only when Tier 1 (structural) and Tier 2 (resolution) both have zero errors; exit code 0 on PASS, 1 on FAIL. The JSON also carries `role_id`, `errors`, `warnings`, `catalog_version`. Any `FAIL` blocks deployment; Tier 3/4 are optional for local deploy because the live harness + hot reload is itself the deploy-time health check.

## 6. Hot-Reload and Discovery Verification

After the copy:

1. `asset_hot_reload()` — no arguments; triggers a full re-discovery and re-resolution of all rolebox assets.
2. Verify discovery with `asset_search(query="<roleName>")` and `asset_inspect(name="<roleName>", type="function"|"skill"|"reference")` on the assets the generated role declares. The role is "live" only when its declared assets resolve.

If discovery fails: re-run `asset_hot_reload()`, re-check, and report honestly.

## 7. Deploy Report

A deploy report states: deployed absolute path, copy method (first install vs confirmed overwrite), validation gate verdict + catalog version, hot-reload success/failure, and the asset-search/inspect results that prove discovery.
