---
name: deploy
description: Deploy a validated role into the live local harness (default ~/.config/opencode/rolebox/), hot-reload assets, and verify discovery. Params: role=<name or path> (required), target=<harness dir> (optional override). Refuses to deploy unvalidated roles and refuses to overwrite an existing role without explicit user confirmation.
---

# Deploy

You are Role Creator's deploy function. Your job is to take a freshly generated role that has passed verification and make it live in the local harness rolebox directory — the directory opencode's rolebox integration actually loads roles from (`~/.config/opencode/rolebox/` by default) — then trigger `asset_hot_reload()` and prove the role is discoverable.

## Parameters

- **`role=`** (required) — the generated role to deploy. Accepts either the role name (resolved to `roles/<name>/` under this repo's root) or a direct path to the role directory (e.g. the path the generator reported).
- **`target=`** (optional) — harness directory override. Defaults to the live harness dir. Use only when the user explicitly wants a different target (e.g. a throwaway config for testing). Never guess an override.

## Workflow

### Step 1: Locate the Generated Role

Resolve the role directory to an absolute path:

- If `role=` is a name, look under this repo's `roles/<name>/`. The repo root is the parent of this file's `functions/` directory.
- If `role=` is already a path, use it directly (the generator may report a temp or nested output path).
- Confirm the target of the copy is a real role dir: it must contain `role.yaml` and a `PROMPT.md` (or inline `prompt`). If not, stop and report that the path is not a role directory.

### Step 2: Validation Gate (Refuse Unvalidated Roles)

Deploying an unvalidated role is forbidden. Run the Tier 1+2 validator before touching the harness:

```bash
python3 scripts/validate_role.py <resolvedRoleDir> --json
```

(From this role's `scripts/` dir — the script lives at `roles/role-creator/scripts/validate_role.py`.)

Parse the JSON output:

- `verdict: "PASS"` → proceed.
- `verdict: "FAIL"` → **refuse to deploy.** Report the `errors` list, cite the relevant rule from `references/schema/validation-catalog.md`, and hand off to `|iterate|` for fixes. Do not copy anything into the harness.

Tier 1 (structural) and Tier 2 (resolution) must both pass. Tier 3 (health check in a throwaway config, via `scripts/sync_check.py`) and Tier 4 (behavioral eval) are **not** required for a local deploy — the live harness IS the health check, and it runs in the next steps.

### Step 3: Determine the Target Harness Dir

Default target (do not override unless the user asked):

```bash
ls -la ~/.config/opencode/rolebox/
```

- Verify the directory exists. If it is missing, stop and report — the harness is the live install target and must not be created by guessing.
- Note the convention visible in the listing: **released roles are symlinks** to `~/.local/share/rolebox/roles/oh-my-role/<name>@<version>`, while **in-development roles are real directories** (e.g. `emperor`, `react-frontend`). A freshly generated role is unreleased, so it deploys as a real directory, matching the in-development convention. Do not create symlinks for unreleased roles and do not write into `~/.local/share/rolebox/roles/`.

If `target=` was supplied, use it instead and state clearly in the report that the deploy went to a non-default target.

### Step 4: Overwrite Guard (Destructive-Overwrite Protection)

Before copying, check whether `$target/<roleName>` already exists (real directory **or** symlink):

```bash
ls -ld "$target/$roleName"
```

- **Does not exist** → proceed to copy.
- **Exists** → **stop and ask the user explicitly.** Show what exists (`ls -ld` output) and ask for confirmation to overwrite it. This is a destructive-overwrite guard: silently replacing an existing role destroys whatever is live in the harness. Only the user's explicit confirmation authorizes the overwrite.
- If the existing entry is a **symlink** (a released role), warn that overwriting replaces a released install with an unreleased local copy. Confirm before proceeding.

### Step 5: Copy Into the Harness

First install (no existing entry, or after user confirmation):

```bash
rsync -a --exclude tests/ --exclude evals/ --exclude __pycache__/ --exclude '.DS_Store' --exclude '*.pyc' --exclude '*.bak' <resolvedRoleDir>/ "$target/$roleName/"
```

- `rsync -a` preserves structure, permissions, and symlinks inside the role. `cp -R` is an acceptable fallback if rsync is unavailable.
- The exclude list matches `scripts/package_role.py` conventions: never ship `tests/`, `evals/`, `__pycache__/`, `.DS_Store`, `*.pyc`, `*.bak` into the live harness.
- **Re-deploy** (after confirmation in Step 4): add `--delete` so the deployed copy is an exact mirror and stale files removed from the role are removed from the harness. Never use `--delete` on a first install.

Do **not** touch `registry.yaml`, run `package_role.py`, or create a release — this function deploys a working copy, it does not publish.

### Step 6: Hot-Reload Assets

Trigger re-discovery and re-resolution of the harness:

```
asset_hot_reload()
```

The tool takes no arguments and performs a full re-discovery/re-resolution of all roles. Wait for it to return before verifying.

### Step 7: Verify Discovery

Prove the deployed role is live by querying its assets:

- `asset_search(query="<roleName>")` — confirm the role and its assets appear.
- `asset_inspect(name="<roleName>", type="skill"|"function"|"reference")` — confirm at least the role's core assets (e.g. its functions, skills, or references) resolve. Inspect the assets that matter for the role the user just generated (its declared functions/skills/references), not just the role name.

If discovery fails, do not claim success: re-run `asset_hot_reload()`, re-check, and report the failure honestly with what was attempted.

### Step 8: Report

Report back with:

- **Deployed path**: `$target/<roleName>/` (absolute)
- **Copy method**: rsync (or cp -R), first install or overwrite-after-confirmation
- **Validation gate**: Tier 1+2 verdict PASS (with `catalog_version` from the validator JSON)
- **Hot-reload**: success/failure of `asset_hot_reload()`
- **Discovery**: the `asset_search` / `asset_inspect` results confirming the role's assets resolve
- **Target override**: note if a non-default `target=` was used

## Rules

- Never deploy a role that failed Tier 1+2 validation. The gate is mandatory.
- Never overwrite an existing harness role without explicit user confirmation. This is a destructive-operation guard; a silent overwrite is a bug.
- Never edit `role.yaml` during this function — the `deploy` function is already declared there by another workflow.
- Never publish: no `registry.yaml` writes, no release tags, no `~/.local/share/rolebox/` writes.
- Report unverified steps as unverified. If hot-reload or discovery verification fails, say so.
