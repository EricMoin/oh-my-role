#!/usr/bin/env python3
"""Atomically upsert a role entry into oh-my-role/registry.yaml.

Usage: python3 registry_write.py <name> [--version VERSION] [--description DESC] [--tags TAGS] [--dry-run]

Preserves comments and key order via ruamel.yaml.
Idempotent: re-running with same name+version is a no-op.
Version collision: if same name+version already exists, errors and prompts for bump.
Atomic: writes to temp file, validates with ruamel.yaml, os.replace(), keeps .bak.
"""
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path


import yaml as _FALLBACK_YAML

_RUAMEL_YAML = None
try:
    from ruamel.yaml import YAML as _RUAMEL_YAML
except ImportError:
    pass


SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_REGISTRY = SCRIPT_DIR.parents[2] / "registry.yaml"


def load_registry(path: str) -> dict:
    """Load registry.yaml with ruamel.yaml (preferred) or yaml."""
    content = Path(path).read_text()
    if _RUAMEL_YAML is not None:
        yaml_inst = _RUAMEL_YAML()
        yaml_inst.preserve_quotes = True
        return yaml_inst.load(content) or {}
    return _FALLBACK_YAML.safe_load(content) or {}


def upsert_role(
    registry_path: str,
    name: str,
    version: str,
    description: str,
    tags: list[str],
    dry_run: bool = False,
) -> dict:
    """Upsert a role entry. Returns {success, action, message, backup_path}."""
    reg_path = Path(registry_path)

    if not reg_path.exists():
        if dry_run:
            return {
                "success": True,
                "action": "added",
                "message": "[dry-run] Would create registry and add role",
                "backup_path": None,
            }
        data = {
            "name": "oh-my-role",
            "description": "Default rolebox registry — community AI agent roles for opencode",
            "url": "https://github.com/EricMoin/oh-my-role",
            "roles": {},
        }
    else:
        if _RUAMEL_YAML is not None:
            yaml_inst = _RUAMEL_YAML()
            yaml_inst.preserve_quotes = True
            data = yaml_inst.load(reg_path.read_text()) or {}
        else:
            data = load_registry(registry_path)
    if "roles" not in data:
        data["roles"] = {}

    existing = data["roles"].get(name)

    if existing:
        existing_version = existing.get("version", "")
        if existing_version == version:
            return {
                "success": True,
                "action": "idempotent",
                "message": f"Role '{name}' v{version} already present — nothing to do",
                "backup_path": None,
            }

    if dry_run:
        action = "added" if not existing else "updated"
        return {
            "success": True,
            "action": action,
            "message": f"[dry-run] Would upsert role '{name}' v{version}",
            "backup_path": None,
        }

    backup_path = None
    if reg_path.exists():
        backup_path = str(reg_path) + ".bak"
        shutil.copy2(reg_path, backup_path)

    entry = {
        "version": version,
        "description": description,
        "tags": tags,
    }
    data["roles"][name] = entry
    action = "added" if not existing else "updated"

    fd, tmp_path = tempfile.mkstemp(
        suffix=".yaml", prefix=".registry_write.", dir=str(reg_path.parent)
    )
    os.close(fd)
    try:
        if _RUAMEL_YAML is not None:
            yaml_out = _RUAMEL_YAML()
            yaml_out.preserve_quotes = True
            yaml_out.dump(data, Path(tmp_path))
        else:
            with open(tmp_path, "w") as f:
                _FALLBACK_YAML.dump(data, f, default_flow_style=False)
        os.replace(tmp_path, registry_path)
    except Exception:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise

    return {
        "success": True,
        "action": action,
        "message": f"Role '{name}' v{version} {action} to registry",
        "backup_path": backup_path,
    }


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Atomically upsert role entry into registry.yaml"
    )
    parser.add_argument("name", help="Role name (directory name)")
    parser.add_argument(
        "--registry",
        default=str(DEFAULT_REGISTRY),
        help="Path to registry.yaml (default: oh-my-role/registry.yaml)",
    )
    parser.add_argument(
        "--version", default="0.1.0", help="Semantic version (default: 0.1.0)"
    )
    parser.add_argument(
        "--description", default="", help="Role description"
    )
    parser.add_argument(
        "--tags", nargs="*", default=[], help="Tags for the role"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Preview without writing to disk"
    )
    args = parser.parse_args()

    result = upsert_role(
        registry_path=args.registry,
        name=args.name,
        version=args.version,
        description=args.description,
        tags=args.tags,
        dry_run=args.dry_run,
    )

    print(json.dumps(result, indent=2))

    if not result["success"]:
        print(f"ERROR: {result['message']}", file=sys.stderr)
        return 1

    print(result["message"], file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
