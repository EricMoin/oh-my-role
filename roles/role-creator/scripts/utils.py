"""Shared utilities for role-creator scripts."""
import re
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ROLE_CREATOR_DIR = SCRIPT_DIR.parent
CATALOG_PATH = ROLE_CREATOR_DIR / "references" / "schema" / "validation-catalog.md"
KNOWN_NAMES = {"plan", "execute"}


def parse_frontmatter(path: str) -> tuple[dict, str]:
    """Parse YAML frontmatter (--- delimited) from a file. Returns (metadata, body).

    metadata is a dict; body is the rest of the content after frontmatter.
    If no frontmatter, returns ({}, full_content).
    """
    p = Path(path)
    content = p.read_text()
    trimmed = content.lstrip()
    if not trimmed.startswith('---'):
        return {}, content

    end_idx = trimmed.find('\n---', 3)
    if end_idx == -1:
        return {}, content

    yaml_str = trimmed[4:end_idx]
    body = trimmed[end_idx + 4:]
    if body.startswith('\n'):
        body = body[1:]

    try:
        import ruamel.yaml
        yaml = ruamel.yaml.YAML(typ='safe')
        meta = yaml.load(yaml_str)
        if isinstance(meta, dict):
            return dict(meta), body
    except Exception:
        pass
    return {}, body


def load_catalog_version(catalog_path: str) -> str | None:
    """Load rolebox_version from validation-catalog.md frontmatter.

    Returns the version string or None if not found.
    """
    path = Path(catalog_path)
    if not path.exists():
        return None
    content = path.read_text()
    match = re.search(r'rolebox_version:\s*["\']?([\w.]+)', content)
    if match:
        return match.group(1)
    return None
