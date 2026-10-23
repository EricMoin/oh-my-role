#!/usr/bin/env python3
"""Compare the documented version with a selected local rolebox CLI (no download)."""
import argparse
import json
from pathlib import Path
import re
import subprocess

from rolebox_cli import resolve_command
from utils import load_catalog_version


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", default=str(Path(__file__).resolve().parents[1] / "references/schema/validation-catalog.md"))
    parser.add_argument("--rolebox-root")
    args = parser.parse_args()
    try:
        pinned = load_catalog_version(args.catalog)
        if not pinned:
            raise ValueError("Catalog has no rolebox_version")
        command = resolve_command(args.rolebox_root)
        installed = None
        if command:
            result = subprocess.run(command + ["--version"], capture_output=True, text=True, timeout=15)
            if result.returncode != 0:
                raise ValueError(result.stderr.strip() or "rolebox --version failed")
            match = re.search(r"\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.]+)?", result.stdout)
            installed = match.group(0) if match else None
        status = "unknown" if installed is None else "ok" if installed == pinned else "mismatch"
        print(json.dumps({"pinned": pinned, "installed": installed, "status": status,
                          "runtime_contract_verified": False,
                          "changed_hint": "Use the real-runtime contract tests; version equality alone is not compatibility evidence."}))
        return 0 if status == "ok" else 2
    except (OSError, ValueError, subprocess.TimeoutExpired) as error:
        print(json.dumps({"status": "error", "message": str(error)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
