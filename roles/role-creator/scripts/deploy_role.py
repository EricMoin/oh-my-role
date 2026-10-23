#!/usr/bin/env python3
"""Validate and stage a role, then replace its directory entry without following it."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import uuid

from package_role import EXCLUDE_DIRS, EXCLUDE_FILES, EXCLUDE_SUFFIXES


def ignored(_directory: str, names: list[str]) -> list[str]:
    return [name for name in names if name in EXCLUDE_DIRS or name in EXCLUDE_FILES
            or Path(name).suffix in EXCLUDE_SUFFIXES]


def deploy(role_dir: Path, target_dir: Path, replace: bool = False) -> dict:
    source = role_dir.resolve()
    target = target_dir.resolve()
    if not (source / "role.yaml").is_file() or not target.is_dir():
        raise ValueError("Source must contain role.yaml and target directory must already exist")
    destination = target / source.name
    if source == destination.resolve() or source in destination.resolve().parents or destination.resolve() in source.parents:
        raise ValueError("Source and deployment destination must not overlap")
    if os.path.lexists(destination) and not replace:
        raise FileExistsError(f"Destination already exists: {destination}; use --replace only when replacement is authorized")
    with tempfile.TemporaryDirectory(prefix=".role-creator-stage-", dir=target.parent) as temporary:
        staged = Path(temporary) / source.name
        shutil.copytree(source, staged, symlinks=True, ignore=ignored)
        validation = subprocess.run(
            [sys.executable, str(Path(__file__).with_name("validate_role.py")), str(staged), "--json"],
            capture_output=True, text=True, timeout=60,
        )
        report = json.loads(validation.stdout)
        if validation.returncode != 0 or report.get("verdict") != "PASS":
            raise ValueError(f"Staged role failed validation: {report.get('errors', [])}")
        backup = None
        if os.path.lexists(destination):
            if not replace:
                raise FileExistsError(f"Destination appeared during staging: {destination}")
            backup_dir = target.parent / ".role-creator-backups"
            backup_dir.mkdir(exist_ok=True)
            backup = backup_dir / f"{source.name}-{uuid.uuid4().hex}"
            destination.rename(backup)
        try:
            staged.rename(destination)
        except OSError:
            if backup is not None:
                backup.rename(destination)
            raise
    return {"status": "deployed", "path": str(destination),
            "backup": str(backup) if backup else None, "validation": report,
            "runtime_verified": False}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("role_dir")
    parser.add_argument("--target-dir", required=True)
    parser.add_argument("--replace", action="store_true")
    args = parser.parse_args()
    try:
        result = deploy(Path(args.role_dir), Path(args.target_dir), args.replace)
    except (OSError, ValueError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "error", "message": str(error)}))
        return 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
