#!/usr/bin/env python3
"""Package a role directory into a distributable zip archive.

Validates the role first via validate_role.py. Refuses to package if validation fails.
Excludes: tests/, evals/, __pycache__/, .bak, .DS_Store, *.pyc

Usage: python3 scripts/package_role.py <roleDir> [--output OUTPUT_DIR]
"""
import json
import os
import subprocess
import sys
from pathlib import Path
import zipfile

SCRIPT_DIR = Path(__file__).parent
VALIDATE_SCRIPT = SCRIPT_DIR / "validate_role.py"

EXCLUDE_DIRS = {"tests", "evals", "__pycache__"}
EXCLUDE_FILES = {".DS_Store"}
EXCLUDE_SUFFIXES = {".pyc", ".bak"}


def should_exclude(entry_path: Path, role_path: Path) -> bool:
    rel_parts = entry_path.relative_to(role_path).parts

    for part in rel_parts:
        if part in EXCLUDE_DIRS:
            return True

    if entry_path.is_dir():
        return False

    if entry_path.name in EXCLUDE_FILES:
        return True

    if entry_path.suffix in EXCLUDE_SUFFIXES:
        return True

    return False


def validate_role(role_dir: str) -> dict:
    result = subprocess.run(
        [sys.executable, str(VALIDATE_SCRIPT), role_dir, "--json"],
        capture_output=True, text=True, timeout=30,
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"verdict": "ERROR", "message": result.stderr or result.stdout}


def create_archive(role_dir: str, output_path: str) -> str:
    role_path = Path(role_dir)
    archive_path = Path(output_path) / f"{role_path.name}.zip"

    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in role_path.rglob("*"):
            if should_exclude(file_path, role_path):
                continue

            if file_path.is_dir():
                continue

            arcname = file_path.relative_to(role_path)
            zf.write(file_path, arcname)

    return str(archive_path)


def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="Validate and package a role into a distributable zip"
    )
    parser.add_argument("role_dir", help="Path to the role directory")
    parser.add_argument(
        "--output", "-o", default=".",
        help="Output directory for the zip (default: current dir)",
    )
    args = parser.parse_args()

    role_dir = Path(args.role_dir)
    if not role_dir.exists():
        print(f"ERROR: Role directory not found: {args.role_dir}", file=sys.stderr)
        return 1

    if not (role_dir / "role.yaml").exists():
        print(f"ERROR: No role.yaml found in {args.role_dir}", file=sys.stderr)
        return 1

    print(f"Validating {role_dir}...")
    validation = validate_role(str(role_dir))

    if validation.get("verdict") != "PASS":
        errors = validation.get("errors", [])
        print(
            f"REFUSED: Role failed validation ({validation.get('verdict', 'ERROR')})"
        )
        for err in errors:
            if isinstance(err, str):
                print(f"  - {err}")
            elif isinstance(err, dict):
                detail = err.get("details", err.get("check", str(err)))
                print(f"  - {detail}")
        return 1

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    archive_path = create_archive(str(role_dir), str(output_dir))
    file_size = os.path.getsize(archive_path)

    print(f"✓ Role packaged successfully")
    print(f"  Archive: {archive_path}")
    print(f"  Size: {file_size:,} bytes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
