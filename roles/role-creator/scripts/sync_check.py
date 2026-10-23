#!/usr/bin/env python3
"""Check CLI installation metadata in a disposable home, without starting a host."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

from rolebox_cli import resolve_command


def isolated_environment(root: Path) -> dict[str, str]:
    env = {key: value for key, value in os.environ.items()
           if key in {"PATH", "SYSTEMROOT", "WINDIR", "LANG", "LC_ALL", "TZ"}}
    paths = {
        "HOME": root / "home", "USERPROFILE": root / "home",
        "XDG_CONFIG_HOME": root / "config", "XDG_DATA_HOME": root / "data",
        "XDG_CACHE_HOME": root / "cache", "XDG_STATE_HOME": root / "state",
        "ROLEBOX_CONFIG_DIR": root / "config/rolebox",
        "ROLEBOX_DATA_DIR": root / "data/rolebox",
        "APPDATA": root / "config", "LOCALAPPDATA": root / "data",
        "CODEX_HOME": root / "codex", "DSH_HOME": root / "dsh",
        "PI_CODING_AGENT_DIR": root / "pi", "TMPDIR": root / "tmp",
        "TMP": root / "tmp", "TEMP": root / "tmp",
    }
    for key, path in paths.items():
        path.mkdir(parents=True, exist_ok=True)
        env[key] = str(path)
    return env


def stage_install(role_dir: Path, env: dict[str, str]) -> Path:
    role_id = role_dir.name
    source = Path(env["ROLEBOX_DATA_DIR"]) / "roles/local-check" / f"{role_id}@0.0.0"
    shutil.copytree(role_dir, source)
    config = Path(env["ROLEBOX_CONFIG_DIR"])
    (config / "rolebox.lock").write_text(json.dumps({
        "version": 1, "roles": [{
            "role": role_id, "registry": "local-check", "version": "0.0.0",
            "installedAt": datetime.now(timezone.utc).isoformat(),
            "integrity": "local-check-unpublished",
        }],
    }))
    (config / "config.yaml").write_text("registries: []\n")
    opencode = Path(env["XDG_CONFIG_HOME"]) / "opencode"
    opencode.mkdir(exist_ok=True)
    (opencode / "opencode.json").write_text(json.dumps({"plugin": ["rolebox"]}))
    return source


def inspect_status(payload: dict, role_id: str, target: str, source: Path) -> dict:
    platform = next((item for item in payload.get("targets", [])
                     if item.get("target") == target), {})
    role = next((item for item in platform.get("roles", [])
                 if item.get("role") == role_id), {})
    integration = platform.get("integration")
    registered = integration.get("registered") if isinstance(integration, dict) else None
    link = Path(platform.get("syncTarget", "")) / role_id
    link_matches = link.is_symlink() and link.resolve() == source.resolve()
    registration_valid = (registered is True if target in {"opencode", "codex"}
                          else "integration" in platform and integration is None)
    healthy = (role.get("synced") is True and role.get("symlinkValid") is True
               and link_matches and registration_valid)
    return {
        "status": "pass" if healthy else "fail", "role_id": role_id, "target": target,
        "scope": "installation_metadata", "synced": role.get("synced") is True,
        "symlink_valid": role.get("symlinkValid") is True and link_matches,
        "plugin_registered": registered, "runtime_verified": False,
        "skill_symlinks_verified": False,
        "message": "CLI install/link metadata checked; host activation and skill loading require runtime verification.",
    }


def check(role_dir: Path, target: str, command: list[str]) -> dict:
    with tempfile.TemporaryDirectory(prefix="rolebox-check-") as temporary:
        root = Path(temporary)
        env = isolated_environment(root)
        source = stage_install(role_dir, env)
        for arguments in (["sync", target], ["status", "--json"]):
            result = subprocess.run(command + arguments, cwd=root, env=env,
                                    capture_output=True, text=True, timeout=60)
            if result.returncode != 0:
                return {"status": "fail", "role_id": role_dir.name, "target": target,
                        "command": arguments, "returncode": result.returncode,
                        "message": result.stderr.strip() or result.stdout.strip()}
        return inspect_status(json.loads(result.stdout), role_dir.name, target, source)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("role_dir")
    parser.add_argument("--target", choices=["opencode", "pi", "dsh", "codex"], default="opencode")
    parser.add_argument("--rolebox-root")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    try:
        role_dir = Path(args.role_dir).resolve()
        if not (role_dir / "role.yaml").is_file():
            raise ValueError("Role directory must contain role.yaml")
        command = resolve_command(args.rolebox_root)
        result = check(role_dir, args.target, command) if command else {
            "status": "skipped", "message": "Install rolebox or set ROLEBOX_ROOT to a local source checkout.",
        }
    except (OSError, ValueError, subprocess.TimeoutExpired) as error:
        result = {"status": "error", "message": str(error)}
    print(json.dumps(result, indent=2) if args.json else f"{result['status'].upper()}: {result['message']}")
    return 0 if result["status"] == "pass" else 2 if result["status"] == "skipped" else 1


if __name__ == "__main__":
    raise SystemExit(main())
