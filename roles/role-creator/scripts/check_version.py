#!/usr/bin/env python3
"""Check rolebox version consistency between pinned catalog and installed.

Usage: python3 check_version.py [--catalog PATH]

Outputs JSON: {pinned, installed, status, changed_hint}
Exit codes: 0=ok, 1=error, 2=mismatch/unknown
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from utils import load_catalog_version

SCRIPT_DIR = Path(__file__).parent
DEFAULT_CATALOG = SCRIPT_DIR.parent / "references" / "schema" / "validation-catalog.md"


def detect_installed_version() -> tuple[str | None, str | None]:
    methods = [
        (["npx", "rolebox", "--version"], "npx"),
        (["rolebox", "--version"], "cli"),
    ]
    for cmd, method in methods:
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                out = result.stdout.strip()
                m = re.search(r'\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.]+)?', out)
                version = m.group(0) if m else (out.split()[-1] if out else "")
                if version:
                    return version, method
        except (subprocess.TimeoutExpired, FileNotFoundError):
            continue
    return None, "not_found"


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Check rolebox version consistency"
    )
    parser.add_argument("--catalog", default=str(DEFAULT_CATALOG))
    args = parser.parse_args()

    pinned = load_catalog_version(args.catalog)
    if not pinned:
        print(json.dumps({
            "pinned": None,
            "installed": None,
            "status": "error",
            "changed_hint": "Could not read catalog version",
        }))
        return 1

    installed, method = detect_installed_version()

    if installed is None:
        print(json.dumps({
            "pinned": pinned,
            "installed": None,
            "status": "unknown",
            "changed_hint": f"rolebox not found (method={method})",
        }))
        print(f"\n⚠️  WARNING: Could not detect rolebox version.")
        print(f"   Pinned version: {pinned}")
        print(f"   Installed: not found")
        print(f"   You can continue, but version consistency is not guaranteed.")
        print(f"   To install: npm install -g rolebox or use npx rolebox")
        return 2

    if installed == pinned:
        print(json.dumps({
            "pinned": pinned,
            "installed": installed,
            "status": "ok",
            "changed_hint": None,
        }))
        print(f"✓ Version match: pinned={pinned}, installed={installed}")
        return 0
    else:
        print(json.dumps({
            "pinned": pinned,
            "installed": installed,
            "status": "mismatch",
            "changed_hint": f"pinned={pinned} ≠ installed={installed} (detected via {method})",
        }))
        print(f"\n⚠️  VERSION MISMATCH")
        print(f"   Pinned:   {pinned}")
        print(f"   Installed: {installed}")
        print(f"")
        print(f"   Options:")
        print(f"   1. Continue anyway (your choice)")
        print(f"   2. Update validation-catalog.md to match {installed}")
        print(f"   3. Install the pinned version: npm install -g rolebox@{pinned}")
        print(f"")
        print(f"   What would you like to do?")
        return 2


if __name__ == "__main__":
    sys.exit(main())
