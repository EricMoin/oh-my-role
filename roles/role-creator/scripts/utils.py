"""Shared utilities for role-creator scripts."""
import re
import sys


def parse_frontmatter(path: str) -> tuple[dict, str]:
    """Parse YAML frontmatter (--- delimited) from a file. Returns (metadata, body).

    metadata is a dict; body is the rest of the content after frontmatter.
    If no frontmatter, metadata={}, body=full content.
    """
    # TODO: implement using ruamel.yaml
    pass


def load_catalog_version(catalog_path: str) -> str | None:
    """Load rolebox_version from validation-catalog.md frontmatter.

    Returns the version string or None if not found.
    """
    # TODO: implement
    pass
