#!/usr/bin/env python3
"""Validate oh-my-role registry: YAML syntax, schema, skill refs, registry consistency."""

import re
import sys
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
ROLES_DIR = REPO_ROOT / "roles"
REGISTRY_FILE = REPO_ROOT / "registry.yaml"
BUILTIN_FUNCTIONS = {"plan", "execute", "loop"}
VALID_COLLABORATION_TOPOLOGIES = {"pipeline", "review-loop", "star"}
FLOW_EDGE_RE = re.compile(r"^\s*(\w+(?:-\w+)*)\s*->\s*(\w+(?:-\w+)*)(?:\s*:\s*(.*?))?\s*$")
SOFTWARE_ARCHITECTURE_ROLE_ID = "software-architecture"
LEGACY_ROLE_ID = "software-" + "architect"
LEGACY_SOFTWARE_ARCHITECT_RE = re.compile(rf"{re.escape(LEGACY_ROLE_ID)}(?!ure)")


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

    for field in ["name", "description", "version", "mode"]:
        if field not in data:
            err(yaml_rel, f"Missing required field: '{field}'")

    if "prompt" not in data and "prompt_file" not in data:
        err(yaml_rel, "Missing required field: 'prompt' or 'prompt_file'")

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

    if "prompt_file" in data:
        if not isinstance(data["prompt_file"], str):
            err(yaml_rel, f"'prompt_file' must be a string, got {type(data['prompt_file']).__name__}")
        elif not (role_dir / data["prompt_file"]).is_file():
            err(yaml_rel, f"'prompt_file' points to missing file '{data['prompt_file']}'")

    validate_temperature(yaml_rel, data)

    if "skills" in data:
        validate_skills_field(yaml_rel, data["skills"])

    if "functions" in data:
        validate_functions_field(role_dir, yaml_rel, "functions", data["functions"])

    if "disable_functions" in data:
        validate_string_list_field(yaml_rel, "disable_functions", data["disable_functions"])

    if "references" in data:
        validate_references_field(role_dir, data["references"], yaml_rel)

    if "subagents" in data:
        validate_inline_subagents_field(role_dir, data["subagents"], yaml_rel)

    if "collaboration" in data:
        validate_collaboration_field(role_dir, data["collaboration"], yaml_rel, data)

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

    if "functions" in data:
        validate_functions_field(subagent_dir, yaml_rel, "functions", data["functions"])

    if "disable_functions" in data:
        validate_string_list_field(yaml_rel, "disable_functions", data["disable_functions"])

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


def validate_string_list_field(yaml_rel: str, field: str, value):
    if not isinstance(value, list):
        err(yaml_rel, f"'{field}' must be a list, got {type(value).__name__}")
        return
    for i, item in enumerate(value):
        if not isinstance(item, str):
            err(yaml_rel, f"{field}[{i}] must be a string, got {type(item).__name__}")


def validate_functions_field(base_dir: Path, yaml_rel: str, field: str, value):
    validate_string_list_field(yaml_rel, field, value)
    if not isinstance(value, list):
        return

    functions_dir = base_dir / "functions"
    for function_name in value:
        if not isinstance(function_name, str):
            continue
        if function_name in BUILTIN_FUNCTIONS:
            continue
        function_file = functions_dir / f"{function_name}.md"
        if not function_file.is_file():
            err(
                yaml_rel,
                f"Function '{function_name}' referenced but '{function_file.relative_to(REPO_ROOT)}' not found",
            )


def validate_references_field(base_dir: Path, references, yaml_rel: str):
    if not isinstance(references, dict):
        err(yaml_rel, f"'references' must be a mapping, got {type(references).__name__}")
        return

    base_resolved = base_dir.resolve()
    for ref_name, ref_value in references.items():
        if not isinstance(ref_name, str):
            err(yaml_rel, f"references keys must be strings, got {type(ref_name).__name__}")
            continue

        ref_path = None
        if isinstance(ref_value, str):
            ref_path = ref_value
        elif isinstance(ref_value, dict):
            if "path" not in ref_value:
                err(yaml_rel, f"references['{ref_name}'] missing required field: 'path'")
                continue
            if not isinstance(ref_value["path"], str):
                err(yaml_rel, f"references['{ref_name}'].path must be a string")
                continue
            ref_path = ref_value["path"]
            if "description" in ref_value and not isinstance(ref_value["description"], str):
                err(yaml_rel, f"references['{ref_name}'].description must be a string")
        else:
            err(
                yaml_rel,
                f"references['{ref_name}'] must be a path string or mapping, got {type(ref_value).__name__}",
            )
            continue

        target = (base_dir / ref_path).resolve()
        try:
            target.relative_to(base_resolved)
        except ValueError:
            err(yaml_rel, f"Reference '{ref_name}' path '{ref_path}' must stay within '{base_dir.relative_to(REPO_ROOT)}'")
            continue

        if not target.is_file():
            err(yaml_rel, f"Reference '{ref_name}' points to missing file '{ref_path}'")


def validate_inline_subagents_field(role_dir: Path, subagents, yaml_rel: str):
    if not isinstance(subagents, list):
        err(yaml_rel, f"'subagents' must be a list, got {type(subagents).__name__}")
        return

    seen: set[str] = set()
    for i, subagent in enumerate(subagents):
        prefix = f"subagents[{i}]"
        if not isinstance(subagent, dict):
            err(yaml_rel, f"{prefix} must be a mapping, got {type(subagent).__name__}")
            continue

        name = subagent.get("name")
        if not isinstance(name, str) or not name:
            err(yaml_rel, f"{prefix}.name must be a non-empty string")
        elif "--" in name:
            err(yaml_rel, f"{prefix}.name must not contain '--'")
        else:
            if name in seen:
                err(yaml_rel, f"Duplicate inline subagent name '{name}'")
            seen.add(name)

        if "description" in subagent and not isinstance(subagent["description"], str):
            err(yaml_rel, f"{prefix}.description must be a string")

        prompt = subagent.get("prompt")
        prompt_file = subagent.get("prompt_file")
        has_prompt = isinstance(prompt, str) and bool(prompt.strip())
        has_prompt_file = isinstance(prompt_file, str) and bool(prompt_file.strip())
        if not has_prompt and not has_prompt_file:
            err(yaml_rel, f"{prefix} must provide 'prompt' or 'prompt_file'")
        if prompt is not None and not isinstance(prompt, str):
            err(yaml_rel, f"{prefix}.prompt must be a string")
        if prompt_file is not None:
            if not isinstance(prompt_file, str):
                err(yaml_rel, f"{prefix}.prompt_file must be a string")
            elif not (role_dir / prompt_file).is_file():
                err(yaml_rel, f"{prefix}.prompt_file points to missing file '{prompt_file}'")

        if "skills" in subagent:
            validate_skills_field(yaml_rel, subagent["skills"])
            if isinstance(name, str):
                subagent_dir = role_dir / "subagents" / rolebox_slug(name)
                validate_skill_refs(subagent_dir if subagent_dir.is_dir() else role_dir, subagent, yaml_rel)

        if "opencode_skills" in subagent:
            validate_string_list_field(yaml_rel, f"{prefix}.opencode_skills", subagent["opencode_skills"])
        if "functions" in subagent:
            validate_string_list_field(yaml_rel, f"{prefix}.functions", subagent["functions"])
            if isinstance(name, str):
                subagent_dir = role_dir / "subagents" / rolebox_slug(name)
                validate_functions_field(
                    subagent_dir if subagent_dir.is_dir() else role_dir,
                    yaml_rel,
                    f"{prefix}.functions",
                    subagent["functions"],
                )
        if "disable_functions" in subagent:
            validate_string_list_field(yaml_rel, f"{prefix}.disable_functions", subagent["disable_functions"])
        if "subagents" in subagent:
            err(yaml_rel, f"{prefix} must not define nested subagents")


def subagent_slugs(role_dir: Path, data: dict) -> set[str]:
    slugs: set[str] = set()

    inline_subagents = data.get("subagents")
    if isinstance(inline_subagents, list):
        for subagent in inline_subagents:
            if isinstance(subagent, dict) and isinstance(subagent.get("name"), str):
                slugs.add(rolebox_slug(subagent["name"]))

    subagents_dir = role_dir / "subagents"
    if subagents_dir.is_dir():
        for d in sorted(subagents_dir.iterdir()):
            if d.is_dir():
                slugs.add(d.name)

    return slugs


def expand_collaboration_topology(topology: str, agents: list[str]) -> list[dict[str, object]]:
    if topology == "pipeline":
        edges: list[dict[str, object]] = [{"from": "parent", "to": agents[0]}]
        for i in range(len(agents) - 1):
            edges.append({"from": agents[i], "to": agents[i + 1]})
        edges.append({"from": agents[-1], "to": "parent", "exit": True})
        return edges

    if topology == "review-loop":
        edges = [{"from": "parent", "to": agents[0]}]
        for i in range(len(agents) - 1):
            edges.append({"from": agents[i], "to": agents[i + 1]})
        edges.append({"from": agents[-1], "to": agents[0], "label": "loop"})
        edges.append({"from": agents[-1], "to": "parent", "label": "exit", "exit": True})
        return edges

    if topology == "star":
        edges = []
        for agent in agents:
            edges.append({"from": "parent", "to": agent})
            edges.append({"from": agent, "to": "parent", "exit": True})
        return edges

    return []


def parse_collaboration_flow_edge(yaml_rel: str, prefix: str, value) -> dict[str, object] | None:
    if isinstance(value, str):
        match = FLOW_EDGE_RE.match(value)
        if not match:
            err(yaml_rel, f"{prefix} has invalid flow edge string '{value}'")
            return None
        edge: dict[str, object] = {"from": match.group(1), "to": match.group(2)}
        if match.group(3):
            edge["label"] = match.group(3)
        return edge

    if isinstance(value, dict):
        from_value = value.get("from")
        to_value = value.get("to")
        if not isinstance(from_value, str) or not isinstance(to_value, str):
            err(yaml_rel, f"{prefix} object edge must include string 'from' and 'to'")
            return None
        edge = {"from": from_value, "to": to_value}
        if "label" in value:
            if not isinstance(value["label"], str):
                err(yaml_rel, f"{prefix}.label must be a string")
            else:
                edge["label"] = value["label"]
        if "exit" in value:
            if not isinstance(value["exit"], bool):
                err(yaml_rel, f"{prefix}.exit must be a boolean")
            else:
                edge["exit"] = value["exit"]
        return edge

    err(yaml_rel, f"{prefix} must be a string or mapping edge")
    return None


def validate_collaboration_field(role_dir: Path, collaboration, yaml_rel: str, data: dict):
    if not isinstance(collaboration, dict):
        err(yaml_rel, f"'collaboration' must be a mapping, got {type(collaboration).__name__}")
        return

    known_agents = subagent_slugs(role_dir, data)
    edges: list[dict[str, object]] = []

    topology = collaboration.get("topology")
    if topology is not None:
        if not isinstance(topology, str):
            err(yaml_rel, "collaboration.topology must be a string")
        elif topology not in VALID_COLLABORATION_TOPOLOGIES:
            err(yaml_rel, f"collaboration.topology '{topology}' is not supported")

    agents = collaboration.get("agents")
    topology_agents: list[str] = []
    if agents is not None:
        if not isinstance(agents, list):
            err(yaml_rel, "collaboration.agents must be a list")
        else:
            for i, agent in enumerate(agents):
                if not isinstance(agent, str):
                    err(yaml_rel, f"collaboration.agents[{i}] must be a string")
                else:
                    topology_agents.append(agent)

    flow = collaboration.get("flow")

    if isinstance(topology, str) and topology in VALID_COLLABORATION_TOPOLOGIES:
        if not topology_agents and not isinstance(flow, list):
            err(yaml_rel, "collaboration with topology requires at least one agent (or explicit flow)")
        elif topology_agents:
            edges.extend(expand_collaboration_topology(topology, topology_agents))
    if flow is not None:
        if not isinstance(flow, list):
            err(yaml_rel, "collaboration.flow must be a list")
        else:
            for i, flow_edge in enumerate(flow):
                parsed = parse_collaboration_flow_edge(yaml_rel, f"collaboration.flow[{i}]", flow_edge)
                if parsed:
                    edges.append(parsed)

    if not edges:
        err(yaml_rel, "collaboration must define topology+agents or flow")
        return

    for edge in edges:
        for endpoint in ["from", "to"]:
            value = edge.get(endpoint)
            if not isinstance(value, str):
                continue
            if value != "parent" and value not in known_agents:
                err(yaml_rel, f"collaboration edge references unknown agent '{value}'")

    if not any(edge.get("from") == "parent" for edge in edges):
        err(yaml_rel, 'collaboration must have at least one edge from "parent"')

    if not any(edge.get("to") == "parent" or edge.get("exit") is True for edge in edges):
        err(yaml_rel, 'collaboration must have at least one exit edge to "parent" or exit: true')

    max_iterations = collaboration.get("max_iterations")
    if max_iterations is not None:
        if not isinstance(max_iterations, int) or max_iterations < 0:
            err(yaml_rel, "collaboration.max_iterations must be a non-negative integer")


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

    if LEGACY_ROLE_ID in roles_map:
        err(rel, f"Legacy role key '{LEGACY_ROLE_ID}' must not be registered; use '{SOFTWARE_ARCHITECTURE_ROLE_ID}'")

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
            if d.is_dir() and not d.name.startswith(".") and d.name not in roles_map:
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


def find_orphan_functions(role_dir: Path, referenced_functions: set[str], context: str):
    functions_dir = role_dir / "functions"
    if not functions_dir.is_dir():
        return

    for f in sorted(functions_dir.glob("*.md")):
        if f.stem not in referenced_functions:
            warn(context, f"Function file 'functions/{f.name}' exists but is not referenced in role.yaml")


def validate_no_legacy_software_architect_refs():
    legacy_dir = ROLES_DIR / LEGACY_ROLE_ID
    if legacy_dir.exists():
        err(f"roles/{LEGACY_ROLE_ID}", f"Legacy role directory must be removed; use roles/{SOFTWARE_ARCHITECTURE_ROLE_ID}")

    scan_roots = [
        REPO_ROOT / "README.md",
        REPO_ROOT / "registry.yaml",
        REPO_ROOT / "scripts",
        ROLES_DIR / SOFTWARE_ARCHITECTURE_ROLE_ID,
    ]

    for root in scan_roots:
        if not root.exists():
            continue
        paths = [root] if root.is_file() else sorted(p for p in root.rglob("*") if p.is_file())
        for path in paths:
            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if LEGACY_SOFTWARE_ARCHITECT_RE.search(content):
                err(
                    str(path.relative_to(REPO_ROOT)),
                    f"Legacy identifier '{LEGACY_ROLE_ID}' found; use '{SOFTWARE_ARCHITECTURE_ROLE_ID}'",
                )


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
        if role_dir.name.startswith("."):
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

                sub_functions = set(sub_data.get("functions", []))
                find_orphan_functions(
                    sub_dir,
                    sub_functions,
                    f"roles/{role_name}/subagents/{sub_dir.name}/role.yaml",
                )

        referenced_functions = set(data.get("functions", []))
        find_orphan_functions(role_dir, referenced_functions, f"roles/{role_name}/role.yaml")

    validate_no_legacy_software_architect_refs()

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
