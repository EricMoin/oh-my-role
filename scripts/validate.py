#!/usr/bin/env python3
"""Validate oh-my-role registry: YAML syntax, schema, skill refs, registry consistency."""

import re
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
ROLES_DIR = REPO_ROOT / "roles"
REGISTRY_FILE = REPO_ROOT / "registry.yaml"


class ValidationError:
    def __init__(self, path: str, message: str):
        self.path = path
        self.message = message

    def __str__(self):
        return f"  [{self.path}] {self.message}"


errors: list[ValidationError] = []
warnings: list[ValidationError] = []


def err(path: str, msg: str):
    errors.append(ValidationError(path, msg))


def warn(path: str, msg: str):
    warnings.append(ValidationError(path, msg))


def rolebox_slug(name: str) -> str:
    return re.sub(r"\s+", "-", name.lower())


def load_yaml(filepath: Path) -> dict | None:
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        if not isinstance(data, dict):
            err(str(filepath.relative_to(REPO_ROOT)), "YAML root must be a mapping")
            return None
        return data
    except yaml.YAMLError as e:
        err(str(filepath.relative_to(REPO_ROOT)), f"YAML syntax error: {e}")
        return None
    except OSError as e:
        err(str(filepath.relative_to(REPO_ROOT)), f"Cannot read file: {e}")
        return None


def validate_top_level_role(role_dir: Path, data: dict):
    rel = str(role_dir.relative_to(REPO_ROOT))
    yaml_rel = f"{rel}/role.yaml"

    for field in ["name", "description", "version", "mode", "prompt"]:
        if field not in data:
            err(yaml_rel, f"Missing required field: '{field}'")

    if "name" in data and not isinstance(data["name"], str):
        err(yaml_rel, f"'name' must be a string, got {type(data['name']).__name__}")

    if "description" in data and not isinstance(data["description"], str):
        err(yaml_rel, f"'description' must be a string, got {type(data['description']).__name__}")

    if "version" in data:
        v = data["version"]
        if not isinstance(v, str):
            err(yaml_rel, f"'version' must be a quoted string, got {type(v).__name__}")

    if "mode" in data:
        if data["mode"] not in ("primary",):
            err(yaml_rel, f"'mode' must be 'primary', got '{data['mode']}'")

    if "prompt" in data and not isinstance(data["prompt"], str):
        err(yaml_rel, f"'prompt' must be a string, got {type(data['prompt']).__name__}")

    validate_temperature(yaml_rel, data)

    if "skills" in data:
        validate_skills_field(yaml_rel, data["skills"])

    validate_skill_refs(role_dir, data, yaml_rel)


def validate_subagent_role(subagent_dir: Path, data: dict):
    rel = str(subagent_dir.relative_to(REPO_ROOT))
    yaml_rel = f"{rel}/role.yaml"

    for field in ["name", "description", "prompt"]:
        if field not in data:
            err(yaml_rel, f"Missing required field: '{field}'")

    if "name" in data and not isinstance(data["name"], str):
        err(yaml_rel, f"'name' must be a string, got {type(data['name']).__name__}")

    if "name" in data and isinstance(data["name"], str):
        expected = subagent_dir.name
        actual = rolebox_slug(data["name"])
        if actual != expected:
            err(
                yaml_rel,
                f"Subagent name slug '{actual}' must match directory name '{expected}' so rolebox IDs resolve correctly",
            )

    if "description" in data and not isinstance(data["description"], str):
        err(yaml_rel, f"'description' must be a string, got {type(data['description']).__name__}")

    if "prompt" in data and not isinstance(data["prompt"], str):
        err(yaml_rel, f"'prompt' must be a string, got {type(data['prompt']).__name__}")

    validate_temperature(yaml_rel, data)

    if "skills" in data:
        validate_skills_field(yaml_rel, data["skills"])

    validate_skill_refs(subagent_dir, data, yaml_rel)


def validate_temperature(yaml_rel: str, data: dict):
    if "temperature" not in data:
        return
    t = data["temperature"]
    if not isinstance(t, (int, float)):
        err(yaml_rel, f"'temperature' must be a number, got {type(t).__name__}")
    elif not (0 <= t <= 2):
        warn(yaml_rel, f"'temperature' value {t} is outside typical range [0, 2]")


def validate_skills_field(yaml_rel: str, skills):
    if not isinstance(skills, list):
        err(yaml_rel, f"'skills' must be a list, got {type(skills).__name__}")
        return
    for i, s in enumerate(skills):
        if not isinstance(s, str):
            err(yaml_rel, f"skills[{i}] must be a string, got {type(s).__name__}")


def validate_skill_refs(role_dir: Path, data: dict, yaml_rel: str):
    skills = data.get("skills")
    if not skills or not isinstance(skills, list):
        return

    skills_dir = role_dir / "skills"
    for skill_name in skills:
        if not isinstance(skill_name, str):
            continue
        skill_file = skills_dir / skill_name / "SKILL.md"
        if not skill_file.is_file():
            err(yaml_rel, f"Skill '{skill_name}' referenced but '{skill_file.relative_to(REPO_ROOT)}' not found")


def validate_registry(registry_data: dict):
    rel = "registry.yaml"

    for field in ["name", "description", "url", "roles"]:
        if field not in registry_data:
            err(rel, f"Missing required field: '{field}'")

    roles_map = registry_data.get("roles")
    if not isinstance(roles_map, dict):
        err(rel, "'roles' must be a mapping")
        return

    for role_key, role_meta in roles_map.items():
        role_dir = ROLES_DIR / role_key
        role_yaml = role_dir / "role.yaml"

        if not role_dir.is_dir():
            err(rel, f"Role '{role_key}' listed in registry but directory 'roles/{role_key}/' not found")
            continue

        if not role_yaml.is_file():
            err(rel, f"Role '{role_key}' listed in registry but 'roles/{role_key}/role.yaml' not found")
            continue

        if not isinstance(role_meta, dict):
            err(rel, f"Role '{role_key}' entry must be a mapping")
            continue

        for field in ["version", "description"]:
            if field not in role_meta:
                err(rel, f"Role '{role_key}' missing required field: '{field}'")

        if "version" in role_meta:
            role_data = load_yaml(role_yaml)
            if role_data and "version" in role_data:
                reg_ver = str(role_meta["version"])
                role_ver = str(role_data["version"])
                if reg_ver != role_ver:
                    err(rel, f"Role '{role_key}' version mismatch: registry='{reg_ver}', role.yaml='{role_ver}'")

    if ROLES_DIR.is_dir():
        for d in sorted(ROLES_DIR.iterdir()):
            if d.is_dir() and d.name not in roles_map:
                warn(rel, f"Directory 'roles/{d.name}/' exists but is not listed in registry")


def validate_subagents(role_dir: Path):
    subagents_dir = role_dir / "subagents"
    if not subagents_dir.is_dir():
        return

    rel = str(role_dir.relative_to(REPO_ROOT))
    for d in sorted(subagents_dir.iterdir()):
        if not d.is_dir():
            continue
        sub_yaml = d / "role.yaml"
        if not sub_yaml.is_file():
            err(f"{rel}/subagents/{d.name}", "Subagent directory missing role.yaml")


def find_orphan_skills(role_dir: Path, referenced_skills: set[str], context: str):
    skills_dir = role_dir / "skills"
    if not skills_dir.is_dir():
        return

    for d in sorted(skills_dir.iterdir()):
        if d.is_dir() and d.name not in referenced_skills:
            warn(context, f"Skill directory 'skills/{d.name}/' exists but is not referenced in role.yaml")


def main():
    print("Validating oh-my-role registry...\n")

    print("Checking registry.yaml...")
    registry_data = load_yaml(REGISTRY_FILE)
    if registry_data:
        validate_registry(registry_data)

    if not ROLES_DIR.is_dir():
        err("roles/", "Roles directory not found")
        report_and_exit()

    for role_dir in sorted(ROLES_DIR.iterdir()):
        if not role_dir.is_dir():
            continue

        role_yaml = role_dir / "role.yaml"
        role_name = role_dir.name
        print(f"Checking roles/{role_name}/...")

        if not role_yaml.is_file():
            err(f"roles/{role_name}", "Missing role.yaml")
            continue

        data = load_yaml(role_yaml)
        if data is None:
            continue

        validate_top_level_role(role_dir, data)
        validate_subagents(role_dir)

        referenced = set(data.get("skills", []))
        find_orphan_skills(role_dir, referenced, f"roles/{role_name}/role.yaml")

        subagents_dir = role_dir / "subagents"
        if subagents_dir.is_dir():
            for sub_dir in sorted(subagents_dir.iterdir()):
                if not sub_dir.is_dir():
                    continue

                sub_yaml = sub_dir / "role.yaml"
                if not sub_yaml.is_file():
                    continue

                sub_data = load_yaml(sub_yaml)
                if sub_data is None:
                    continue

                validate_subagent_role(sub_dir, sub_data)

                sub_referenced = set(sub_data.get("skills", []))
                find_orphan_skills(
                    sub_dir,
                    sub_referenced,
                    f"roles/{role_name}/subagents/{sub_dir.name}/role.yaml",
                )

    report_and_exit()


def report_and_exit():
    print()

    if warnings:
        print(f"Warnings ({len(warnings)}):")
        for w in warnings:
            print(f"  \033[33m⚠\033[0m {w}")
        print()

    if errors:
        print(f"Errors ({len(errors)}):")
        for e in errors:
            print(f"  \033[31m✗\033[0m {e}")
        print(f"\n\033[31mValidation FAILED with {len(errors)} error(s).\033[0m")
        sys.exit(1)
    else:
        print(f"\033[32m✓ Validation passed.{f' ({len(warnings)} warning(s))' if warnings else ''}\033[0m")
        sys.exit(0)


if __name__ == "__main__":
    main()
