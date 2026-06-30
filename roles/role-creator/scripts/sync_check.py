#!/usr/bin/env python3
"""Tier 3 deploy/health check — validates role sync via rolebox CLI.

Sets up a throwaway XDG_CONFIG_HOME opencode directory, places the target role,
and runs rolebox status --json to verify:
- Plugin registration
- Role sync status
- Skill symlink health

Usage: python3 scripts/sync_check.py <roleDir> [--json]

Exit codes: 0=pass/skipped, 1=fail
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def find_rolebox() -> list[str] | None:
    """Find rolebox binary. Returns command list or None.

    Tries direct rolebox first, then npx rolebox.
    """
    attempts = [
        (["rolebox"], "cli"),
        (["npx", "rolebox"], "npx"),
    ]
    for cmd, _method in attempts:
        try:
            test_cmd = cmd + ["--version"]
            result = subprocess.run(
                test_cmd, capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                return cmd
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    return None


def setup_throwaway_config(role_dir: str, role_id: str) -> str:
    """Create a throwaway opencode config with the target role installed.

    Returns the XDG_CONFIG_HOME path.
    """
    tmpdir = tempfile.mkdtemp(prefix="rolebox-check-")

    # Create the opencode rolebox structure
    rolebox_dir = Path(tmpdir) / "opencode" / "rolebox"
    rolebox_dir.mkdir(parents=True, exist_ok=True)

    # Copy the role into the throwaway config
    target_role_dir = rolebox_dir / role_id
    shutil.copytree(role_dir, str(target_role_dir), dirs_exist_ok=True)

    return tmpdir


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Tier 3 deploy/health check via rolebox CLI"
    )
    parser.add_argument(
        "role_dir", help="Path to the role directory to check"
    )
    parser.add_argument(
        "--json", action="store_true", help="Output raw JSON"
    )
    args = parser.parse_args()

    role_dir = Path(args.role_dir)
    if not role_dir.exists():
        result = {
            "status": "error",
            "message": f"Role directory not found: {args.role_dir}",
        }
        if args.json:
            print(json.dumps(result))
        else:
            print(f"ERROR: {result['message']}")
        return 1

    role_id = role_dir.name

    rolebox_cmd = find_rolebox()
    if rolebox_cmd is None:
        result = {
            "status": "skipped",
            "role_id": role_id,
            "message": "rolebox CLI not found. Install rolebox to run Tier 3 checks.",
            "install_hint": "npm install -g rolebox or use npx rolebox",
        }
        if args.json:
            print(json.dumps(result))
        else:
            print(f"\u26a0\ufe0f  Tier 3 skipped: rolebox CLI not found")
            print(f"   Install: npm install -g rolebox")
        return 0

    # Create throwaway config
    xdg_home = setup_throwaway_config(str(role_dir), role_id)

    try:
        env = os.environ.copy()
        env["XDG_CONFIG_HOME"] = xdg_home

        sync_result = subprocess.run(
            rolebox_cmd + ["status", "--json"],
            capture_output=True, text=True, timeout=30,
            env=env,
        )

        if sync_result.returncode != 0:
            result = {
                "status": "fail",
                "role_id": role_id,
                "error": "rolebox status returned non-zero",
                "returncode": sync_result.returncode,
                "stderr": sync_result.stderr.strip(),
            }
            if args.json:
                print(json.dumps(result))
            else:
                print(f"FAIL: rolebox status failed for {role_id}")
                if sync_result.stderr.strip():
                    print(f"  {sync_result.stderr.strip()}")
            return 1

        try:
            parsed = json.loads(sync_result.stdout)
        except json.JSONDecodeError:
            result = {
                "status": "fail",
                "role_id": role_id,
                "error": "Could not parse rolebox output as JSON",
                "raw_output": sync_result.stdout[:500],
            }
            if args.json:
                print(json.dumps(result))
            else:
                print(f"FAIL: Could not parse rolebox output as JSON for {role_id}")
            return 1

        # Determine health
        opencode_info = parsed.get("opencode", {})
        plugin_registered = opencode_info.get("pluginRegistered", False)
        roles = parsed.get("roles", [])
        synced = False
        symlink_valid = False
        if roles:
            role_entry = roles[0] if roles else {}
            synced = role_entry.get("synced", False)
            symlink_valid = role_entry.get("symlinkValid", False)

        if synced:
            result = {
                "status": "pass",
                "role_id": role_id,
                "synced": True,
                "symlink_valid": symlink_valid,
                "plugin_registered": plugin_registered,
                "details": parsed,
                "message": f"Role '{role_id}' synced successfully",
            }
            if args.json:
                print(json.dumps(result))
            else:
                print(f"PASS: Role '{role_id}' synced successfully")
                print(f"  Plugin registered: {plugin_registered}")
                print(f"  Symlink valid: {symlink_valid}")
            return 0
        else:
            result = {
                "status": "fail",
                "role_id": role_id,
                "synced": False,
                "symlink_valid": symlink_valid,
                "plugin_registered": plugin_registered,
                "details": parsed,
                "message": f"Role '{role_id}' not synced",
            }
            if args.json:
                print(json.dumps(result))
            else:
                print(f"FAIL: Role '{role_id}' not synced")
                print(f"  Response: {json.dumps(parsed, indent=2)}")
            return 1

    finally:
        # Cleanup throwaway config
        shutil.rmtree(xdg_home, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
