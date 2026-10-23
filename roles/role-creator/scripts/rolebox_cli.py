"""Resolve a local rolebox executable without downloading packages."""
import os
import shutil
from pathlib import Path


def resolve_command(root: str | None = None) -> list[str] | None:
    checkout = root or os.environ.get("ROLEBOX_ROOT")
    if checkout:
        entry = Path(checkout).expanduser().resolve() / "src/cli/main.ts"
        if not entry.is_file():
            raise ValueError(f"ROLEBOX_ROOT has no CLI entry: {entry}")
        bun = shutil.which("bun")
        if not bun:
            raise ValueError("Bun is required to run the rolebox source checkout")
        return [bun, str(entry)]
    binary = shutil.which("rolebox")
    return [binary] if binary else None
