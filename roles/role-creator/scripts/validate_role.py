#!/usr/bin/env python3
"""Lint role authoring locally (Tier 1 + Tier 2).

Checks manifest structure, local assets, nested subagents and authoring policy.
This does not load a host, resolve external dependencies, or validate runtime graphs.

Usage: python3 validate_role.py <roleDir> [--json]
"""
import json
import re
import sys
from pathlib import Path
from collections import deque

import ruamel.yaml

SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))
from utils import (parse_frontmatter, load_catalog_version, CATALOG_PATH,
                   DEFAULT_FUNCTIONS, KNOWN_NAMES)

yaml = ruamel.yaml.YAML(typ='safe')


def parse_flow_edge(edge):
    if isinstance(edge, dict):
        return dict(edge)
    if isinstance(edge, str):
        m = re.match(r'^\s*(\S+)\s*->\s*(\S+)(?:\s*:\s*(.*))?\s*$', edge)
        if m:
            result = {'from': m.group(1), 'to': m.group(2)}
            if m.group(3):
                result['label'] = m.group(3)
            return result
    return None


def normalize_flow(flow):
    edges = []
    for edge in (flow or []):
        parsed = parse_flow_edge(edge)
        if parsed:
            edges.append(parsed)
    return edges


def _is_string_nonempty(val) -> bool:
    return isinstance(val, str) and val.strip() != ''


def _make_check(name, passed, details=None):
    c = {'check': name, 'passed': passed}
    if details:
        c['details'] = details
    return c


def _add_error(collector, msg):
    collector['errors'].append(msg)


# Retired live-contract tools denied by catalog Rule 4: the legacy v1 background-dispatch
# family removed in Phase C and the retired v2 graph-authoring family.
LEGACY_DISPATCH_TOOLS = {'dispatch', 'dispatch_output', 'dispatch_cancel'}
RETIRED_V2_GRAPH_TOOLS = {
    'graph_create', 'graph_add_node', 'graph_add_edge', 'graph_add_loop',
    'graph_run', 'graph_approve', 'graph_cancel',
}
RETIRED_WORKER_TOOLS = {'graph_worker_exec'}
DENIED_LIVE_CONTRACT_TOOLS = LEGACY_DISPATCH_TOOLS | RETIRED_V2_GRAPH_TOOLS | RETIRED_WORKER_TOOLS

# Catalog Rule 6: the Graph v3 declarer/worker tool split.
GRAPH_DECLARER_SPLIT = {
    'graph_declare': True,
    'graph_control': True,
    'graph_status': True,
    'graph_audit': True,
    'graph_submit_outcome': False,
}
GRAPH_WORKER_SPLIT = {name: not held for name, held in GRAPH_DECLARER_SPLIT.items()}


def _is_valid_termination_entry(entry) -> bool:
    """True if entry matches {max_iterations: int} or {result_matches: {agent, contains}} (catalog Rule 3)."""
    if not isinstance(entry, dict):
        return False
    keys = set(entry.keys())
    if keys == {'max_iterations'}:
        v = entry['max_iterations']
        return isinstance(v, int) and not isinstance(v, bool)
    if keys == {'result_matches'}:
        rm = entry['result_matches']
        return (isinstance(rm, dict) and set(rm.keys()) == {'agent', 'contains'}
                and isinstance(rm.get('agent'), str) and isinstance(rm.get('contains'), str))
    return False


def _tool_map_names(manifest) -> list:
    """Every tool name a manifest declares: `tools:` keys plus `permission.allow` entries (catalog Rule 4)."""
    names = []
    if isinstance(manifest, dict):
        tools = manifest.get('tools')
        if isinstance(tools, dict):
            names.extend(str(k) for k in tools)
        perm = manifest.get('permission')
        if isinstance(perm, dict) and isinstance(perm.get('allow'), list):
            names.extend(t for t in perm['allow'] if isinstance(t, str))
    return names


def _collect_denied_tools(manifest, where, issues):
    """Append a violation string per retired live-contract tool declared in `permission.allow`
    or `tools:` (catalog Rule 4)."""
    if not isinstance(manifest, dict):
        return
    for tool in _tool_map_names(manifest):
        if tool.lower() in DENIED_LIVE_CONTRACT_TOOLS:
            issues.append(f"{where}: retired live-contract tool '{tool}' in permission.allow/tools")


def _check_graph_tool_split(manifest, where, declarer, issues):
    """Enforce catalog Rule 6: a manifest that declares any `graph_*` tool must hold its side
    of the Graph v3 declarer/worker split in its `tools:` map."""
    if not isinstance(manifest, dict):
        return
    if not any(name.startswith('graph_') for name in _tool_map_names(manifest)):
        return
    side = 'declarer' if declarer else 'worker'
    expected = GRAPH_DECLARER_SPLIT if declarer else GRAPH_WORKER_SPLIT
    tools = manifest.get('tools')
    if not isinstance(tools, dict):
        issues.append(f"{where}: declares a graph_* tool but has no 'tools:' mapping for "
                      f"the v3 {side} split")
        return
    for name, want in expected.items():
        got = tools.get(name)
        if got is not want:
            issues.append(f"{where}: tools.{name} must be {str(want).lower()} for the "
                          f"v3 {side} split (got {got!r})")


def _effective_prompt(manifest, context_dir):
    path = manifest.get('prompt_file')
    if _is_string_nonempty(path):
        try:
            return (context_dir / path).read_text()
        except (OSError, UnicodeError):
            return ''  # Tier 1 owns unreadable-prompt diagnostics.
    prompt = manifest.get('prompt')
    return prompt if isinstance(prompt, str) else ''


def _worker_handoff_duplicates(prompt):
    text = re.sub(r'\s+', ' ', prompt)
    patterns = {
        'credential-passing instructions': r'\b(?:submit|call|pass|use)\b[^.!?]{0,160}\b(?:attempt|dispatched|delivered|own) credential\b',
        'settlement mechanics': r'\bonly an accepted (?:decision|submission)\b',
        'graph/dispatch prohibitions': r'\b(?:never|do not|cannot) (?:recursively )?(?:dispatch agents|delegate(?=[.!?]|$)|delegate to (?:agents|subagents)|create child graphs|declare,? control|query (?:the )?graph)\b',
        'JSON fallback instructions': r'\b(?:exactly one|single) fenced (?:```)?json\b',
    }
    return [label for label, pattern in patterns.items() if re.search(pattern, text, re.I)]


def _run_tier1(role_yaml_path, role_id, is_subagent=False):
    result = {'checks': [], 'errors': [], 'passed': True}
    E = lambda msg: _add_error(result, msg)

    data = None

    if not role_yaml_path.exists():
        E(f"role.yaml not found at {role_yaml_path}")
        result['checks'].append(_make_check('yaml_parse', False, f"File not found: {role_yaml_path}"))
        result['passed'] = False
        return result, None

    try:
        data = yaml.load(role_yaml_path.read_text())
    except Exception as exc:
        E(f"YAML parse error: {exc}")
        result['checks'].append(_make_check('yaml_parse', False, str(exc)))
        result['passed'] = False
        return result, None

    if not isinstance(data, dict):
        E(f"Root of {role_yaml_path.name} must be a dict, got {type(data).__name__}")
        result['checks'].append(_make_check('yaml_parse', False,
                                            f"Root is {type(data).__name__}, expected dict"))
        result['passed'] = False
        return result, None

    result['checks'].append(_make_check('yaml_parse', True))

    structural = _validate_manifest(data, role_yaml_path.parent, role_id, is_subagent)
    result['checks'].extend(structural['checks'])
    result['errors'].extend(structural['errors'])
    result['passed'] = structural['passed']
    return result, data


def _validate_manifest(data, context_dir, role_id, is_subagent=False):
    result = {'checks': [], 'errors': [], 'passed': True}
    E = lambda msg: _add_error(result, msg)
    name = data.get('name')
    if not _is_string_nonempty(name):
        E("Field 'name' is required and must be a non-empty string")
        result['checks'].append(_make_check('name_required', False, "Missing or empty 'name' field"))
        result['passed'] = False
    else:
        result['checks'].append(_make_check('name_required', True))

    prompt = data.get('prompt')
    prompt_file = data.get('prompt_file')
    has_prompt = _is_string_nonempty(prompt)
    has_prompt_file = _is_string_nonempty(prompt_file)

    if not has_prompt and not has_prompt_file:
        E("At least one of 'prompt' or 'prompt_file' must be present and non-empty")
        result['checks'].append(_make_check('prompt_required', False,
                                            "Neither 'prompt' nor 'prompt_file' is present and non-empty"))
        result['passed'] = False
    elif has_prompt_file:
        resolved = (context_dir / prompt_file).resolve()
        try:
            resolved.read_text()
        except (OSError, UnicodeError) as exc:
            E(f"prompt_file '{prompt_file}' is missing or unreadable: {exc}")
            result['checks'].append(_make_check('prompt_required', False,
                                                f"prompt_file does not exist: {resolved}"))
            result['passed'] = False
        else:
            detail = f"source=prompt_file ({prompt_file})"
            if has_prompt:
                detail += " [prompt inline is ignored per precedence rule]"
            result['checks'].append(_make_check('prompt_required', True, detail))
    else:
        result['checks'].append(_make_check('prompt_required', True, 'source=prompt (inline)'))

    identifier = name if is_subagent and isinstance(name, str) else role_id
    if '--' in identifier:
        E(f"{'Subagent name' if is_subagent else 'Role ID'} '{identifier}' contains reserved separator '--'")
        result['checks'].append(_make_check('id_no_dashdash', False,
                                            f"Identifier '{identifier}' contains '--'"))
        result['passed'] = False
    else:
        result['checks'].append(_make_check('id_no_dashdash', True))

    return result


def _discover_file_subagents(role_dir):
    return sorted(role_dir.glob('subagents/*/role.yaml'))


def _discover_references(role_dir):
    refs = []
    refs_dir = role_dir / 'references'
    if not refs_dir.is_dir():
        return refs

    for md_path in sorted(refs_dir.rglob('*.md')):
        refs.append(md_path)
    return refs


def _string_list(data, field, err):
    value = data.get(field, [])
    if not isinstance(value, list) or any(not _is_string_nonempty(v) for v in value):
        err(f"'{field}' must be a list of non-empty strings")
        return []
    return value


def _validate_assets(role_dir, data):
    result = {'checks': [], 'errors': [], 'warnings': [], 'passed': True}

    def err(message):
        result['errors'].append(message)
        result['passed'] = False

    skills = _string_list(data, 'skills', err)
    external_skills = _string_list(data, 'opencode_skills', err)
    for field, names in [('skills', skills), ('opencode_skills', external_skills)]:
        if len(set(names)) != len(names):
            err(f"Duplicate skill names in '{field}' list")
    skill_results = []
    for name in dict.fromkeys(skills + external_skills):
        candidates = [role_dir / 'skills' / name / 'SKILL.md',
                      role_dir / 'skills' / f'{name}.md']
        found = next((p for p in candidates if p.is_file()), None)
        if found is None:
            result['warnings'].append(
                f"Skill '{name}' is unresolved locally; host/global skill resolution was not checked")
        else:
            try:
                found.read_text()
            except (OSError, UnicodeError) as exc:
                err(f"Skill '{name}' is unreadable: {exc}")
        skill_results.append({'name': name, 'found': found is not None,
                              'path': str(found) if found else None,
                              'resolution': 'local' if found else 'external_unchecked'})
    result['checks'].append({'check': 'skill_resolution', 'passed': not result['errors'],
                             'scope': 'local_assets', 'skills': skill_results})

    prior_errors = len(result['errors'])
    declared = _string_list(data, 'functions', err)
    disabled = _string_list(data, 'disable_functions', err)
    enabled = [name for name in dict.fromkeys([*DEFAULT_FUNCTIONS, *declared])
               if name not in disabled]
    func_results = []
    for name in enabled:
        candidate = role_dir / 'functions' / f'{name}.md'
        found = None
        if candidate.exists():
            try:
                _, body = parse_frontmatter(str(candidate))
                if body.strip():
                    found = candidate
                else:
                    err(f"Function '{name}' has an empty body after frontmatter: {candidate}")
            except (OSError, UnicodeError) as exc:
                err(f"Function '{name}' is unreadable: {exc}")
        elif name not in KNOWN_NAMES:
            result['warnings'].append(
                f"Function '{name}' is unresolved locally; host/global function resolution was not checked")
        func_results.append({'name': name, 'found': found is not None,
                             'path': str(found) if found else None,
                             'resolution': ('local' if found else
                                            'host_builtin_unchecked' if name in KNOWN_NAMES
                                            else 'external_unchecked')})
    result['checks'].append({'check': 'function_resolution',
                             'passed': len(result['errors']) == prior_errors,
                             'scope': 'local_assets', 'functions': func_results,
                             'enabled': enabled, 'disabled': disabled})

    prior_errors = len(result['errors'])
    declared_refs = data.get('references', {})
    ref_entries = {str(p.relative_to(role_dir / 'references').with_suffix('')):
                   {'name': str(p.relative_to(role_dir / 'references').with_suffix('')),
                    'path': str(p)} for p in _discover_references(role_dir)}
    if not isinstance(declared_refs, dict):
        err("'references' must be a mapping")
        declared_refs = {}
    for name, value in declared_refs.items():
        target = value if isinstance(value, str) else value.get('path') if isinstance(value, dict) else None
        if not _is_string_nonempty(target):
            err(f"Reference '{name}' must declare a non-empty path")
            continue
        path = (role_dir / target).resolve()
        try:
            path.read_text()
        except (OSError, UnicodeError) as exc:
            err(f"Reference '{name}' is missing or unreadable: {exc}")
        ref_entries[name] = {'name': name, 'path': str(path), 'declared': True}
    result['checks'].append({'check': 'reference_discovery',
                             'passed': len(result['errors']) == prior_errors,
                             'references': list(ref_entries.values()),
                             'declared_count': len(declared_refs)})
    return result


def _subagent_asset_dir(parent_dir, name):
    slug = re.sub(r'\s+', '-', name.lower())
    for child_name in (slug, name):
        candidate = parent_dir / 'subagents' / child_name
        if candidate.exists():
            return candidate
    return parent_dir


def _discover_subagents(role_dir, data):
    entries = []

    def add(manifest, context_dir, asset_parent, source, location, ancestry, tier1=None):
        name = manifest.get('name', location) if isinstance(manifest, dict) else location
        if not isinstance(name, str):
            name = location
        if not isinstance(manifest, dict):
            manifest = {}
        if tier1 is None:
            tier1 = _validate_manifest(manifest, context_dir, name, is_subagent=True)
        slug = re.sub(r'\s+', '-', name.lower())
        identity = '/'.join([*ancestry, slug])
        asset_dir = _subagent_asset_dir(asset_parent, name)
        entry = {'source': source, 'name': slug, 'id': identity,
                 'display_name': name, 'path': location, 'valid': tier1['passed'],
                 'tier1': tier1, '_data': manifest, '_asset_dir': asset_dir,
                 '_prompt_context': context_dir}
        entries.append(entry)
        return entry, asset_dir, [*ancestry, slug]

    def inline_children(raw, context_dir, asset_parent, ancestry, nested=False, ancestors=()):
        if raw is None:
            return
        if not isinstance(raw, list):
            add({}, context_dir, asset_parent, 'inline', 'invalid subagents list', ancestry)
            return
        for index, manifest in enumerate(raw):
            location = f"inline[{index}]"
            entry, asset_dir, child_ancestry = add(
                manifest, context_dir, asset_parent, 'inline', location, ancestry)
            if not entry['valid']:
                continue
            if id(manifest) in ancestors:
                entry['valid'] = entry['tier1']['passed'] = False
                entry['tier1']['errors'].append('Cyclic YAML subagent alias is unsupported')
                continue
            child_context = context_dir
            if nested and _is_string_nonempty(manifest.get('prompt_file')):
                child_context = (context_dir / manifest['prompt_file']).resolve().parent
            inline_children(manifest.get('subagents'), child_context, asset_dir,
                            child_ancestry, nested=True, ancestors=(*ancestors, id(manifest)))

    def file_children(parent_dir, asset_parent, ancestry, depth=0):
        if depth >= 3:
            return
        for path in _discover_file_subagents(parent_dir):
            tier1, manifest = _run_tier1(path, path.parent.name, is_subagent=True)
            entry, asset_dir, child_ancestry = add(
                manifest, path.parent, asset_parent, 'file', str(path), ancestry, tier1)
            if not entry['valid']:
                continue
            inline_children(manifest.get('subagents'), path.parent, asset_dir,
                            child_ancestry, nested=True)
            file_children(path.parent, asset_dir, child_ancestry, depth + 1)

    inline_children(data.get('subagents'), role_dir, role_dir, [])
    file_children(role_dir, role_dir, [])
    return entries


def _run_tier2(role_dir, role_id, data):
    result = _validate_assets(role_dir, data)

    def warn(msg):
        result['warnings'].append(msg)

    def err(msg):
        result['errors'].append(msg)
        result['passed'] = False

    skills = data.get('skills', [])
    discovered_subagents = _discover_subagents(role_dir, data)
    subagents_passed = True
    for entry in discovered_subagents:
        for message in entry['tier1']['errors']:
            err(f"Subagent '{entry['id']}': {message}")
        assets = _validate_assets(entry['_asset_dir'], entry['_data'])
        entry['assets'] = assets
        entry['valid'] = entry['valid'] and assets['passed']
        for message in assets['errors']:
            err(f"Subagent '{entry['id']}': {message}")
        for message in assets['warnings']:
            warn(f"Subagent '{entry['id']}': {message}")
        subagents_passed = subagents_passed and entry['valid']
    result['checks'].append({'check': 'subagent_discovery', 'passed': subagents_passed,
                             'subagents': discovered_subagents})

    # ── skill-name-collision ──
    for s in (skills if isinstance(skills, list) else []):
        if isinstance(s, str) and s in KNOWN_NAMES:
            warn(f"Skill '{s}' collides with known name (built-in function name)")

    # ── collaboration graph validation ──
    collab = data.get('collaboration')
    if collab and isinstance(collab, dict):
        flow_raw = collab.get('flow', [])
        edges = normalize_flow(flow_raw)
        max_iterations = collab.get('max_iterations')

        available_names = {sa['name'] for sa in discovered_subagents
                          if sa.get('source') == 'file'}
        for sa in discovered_subagents:
            if sa.get('source') == 'inline':
                available_names.add(sa['name'])

        if isinstance(collab.get('agents'), list):
            for a in collab['agents']:
                if isinstance(a, str):
                    available_names.add(a)

        graph_errors = []
        graph_warnings = []

        node_set = available_names | {'parent'}

        has_exit_edge = False
        has_entry_edge = False
        unknown_agents = set()
        referenced_in_edges = set()

        for edge in edges:
            frm = edge.get('from', '')
            to = edge.get('to', '')
            exit_flag = edge.get('exit', False)

            if frm not in node_set:
                unknown_agents.add(frm)
            if to not in node_set:
                unknown_agents.add(to)

            if frm != 'parent':
                referenced_in_edges.add(frm)
            if to != 'parent':
                referenced_in_edges.add(to)

            if to == 'parent' or exit_flag:
                has_exit_edge = True
            if frm == 'parent':
                has_entry_edge = True

        if unknown_agents:
            graph_errors.append(f"Unknown agent(s) in flow edges: {sorted(unknown_agents)}")

        if not has_exit_edge:
            graph_errors.append("No exit edge found in flow (need at least one edge with to=parent or exit=true)")

        if not has_entry_edge:
            graph_errors.append("No entry point found in flow (need at least one edge with from=parent)")

        orphan_agents = available_names - referenced_in_edges
        if orphan_agents:
            graph_warnings.append(f"Orphan agent(s) not referenced in any flow edge: {sorted(orphan_agents)}")

        if has_entry_edge:
            reachable = set()
            q = deque(['parent'])
            while q:
                node = q.popleft()
                if node in reachable:
                    continue
                reachable.add(node)
                for edge in edges:
                    e_from = edge.get('from', '')
                    e_to = edge.get('to', '')
                    if e_from == node and e_to not in reachable:
                        q.append(e_to)

            real_disconnected = available_names - reachable
            if real_disconnected:
                graph_warnings.append(f"Disconnected node(s) unreachable from parent: {sorted(real_disconnected)}")

        has_cycle = False
        agent_to_agent_edges = [(e.get('from', ''), e.get('to', '')) for e in edges
                                if e.get('from', '') != 'parent' and e.get('to', '') != 'parent']
        adj_cycle = {}
        for a in available_names:
            adj_cycle[a] = []
        for frm, to in agent_to_agent_edges:
            if frm in adj_cycle:
                adj_cycle[frm].append(to)
            else:
                adj_cycle[frm] = [to]
            if to not in adj_cycle:
                adj_cycle[to] = []

        def _has_cycle():
            WHITE, GRAY, BLACK = 0, 1, 2
            color = {n: WHITE for n in adj_cycle}

            def dfs(u):
                color[u] = GRAY
                for v in adj_cycle.get(u, []):
                    if color.get(v) == GRAY:
                        return True
                    if color.get(v) == WHITE and dfs(v):
                        return True
                color[u] = BLACK
                return False

            for node in list(adj_cycle.keys()):
                if color.get(node) == WHITE and dfs(node):
                    return True
            return False

        has_cycle = _has_cycle()

        if has_cycle and (max_iterations is None or (isinstance(max_iterations, (int, float)) and max_iterations <= 0)):
            graph_warnings.append("Legacy collaboration cycle has no max_iterations; this block has no runtime effect. Use an explicit Graph v3 loop group bound.")

        if graph_errors:
            for ge in graph_errors:
                err(f"Graph validation: {ge}")
            result['checks'].append({
                'check': 'graph_validation',
                'passed': False,
                'graph_errors': graph_errors,
                'graph_warnings': graph_warnings
            })
        else:
            result['checks'].append({
                'check': 'graph_validation',
                'passed': True,
                'graph_warnings': graph_warnings
            })

        for gw in graph_warnings:
            warn(f"Graph warning: {gw}")

        flow_agent_names = set()
        for edge in edges:
            frm = edge.get('from', '')
            to = edge.get('to', '')
            if frm != 'parent':
                flow_agent_names.add(frm)
            if to != 'parent':
                flow_agent_names.add(to)

        for fan in flow_agent_names:
            exists_on_disk = any(
                sa['name'] == fan and sa.get('source') == 'file'
                for sa in discovered_subagents
            )
            exists_inline = any(
                sa['name'] == fan and sa.get('source') == 'inline'
                for sa in discovered_subagents
            )
            if not exists_on_disk and not exists_inline:
                warn(f"Collaboration target '{fan}' referenced in flow but no matching subagent found on disk or inline")

    # ── Graph v3 rule validation ──
    # Rule 1 (ERROR, catalog policy): a `graph:` block is retired by this catalog. rolebox
    # never rejects it — parseGraphConfig warns and ignores a missing or unknown
    # orchestration selector, and logs the valid case with no runtime effect — but roles
    # validated against this catalog must not declare it.
    graph_block = data.get('graph')
    if graph_block is None:
        result['checks'].append(_make_check('graph_block_retired', True, 'no graph block present'))
    else:
        err("graph block is retired by this contract; rolebox only warns and ignores it, "
            "and roles validated against this catalog must not declare it")
        result['checks'].append(_make_check('graph_block_retired', False,
                                            'graph: block present (retired by this catalog)'))

    # Rule 2 (WARN): memory config shape (inject/max_inject/min_relevance/scope)
    memory_issues = []
    memory_block = data.get('memory')
    if memory_block is not None:
        if not isinstance(memory_block, dict):
            memory_issues.append(f"memory must be a mapping, got {type(memory_block).__name__}")
        else:
            inject = memory_block.get('inject')
            if 'inject' in memory_block and not isinstance(inject, bool):
                memory_issues.append(f"memory.inject must be boolean, got {type(inject).__name__}")
            max_inject = memory_block.get('max_inject')
            if 'max_inject' in memory_block and (not isinstance(max_inject, int)
                                                 or isinstance(max_inject, bool)):
                memory_issues.append(f"memory.max_inject must be integer, got {type(max_inject).__name__}")
            min_rel = memory_block.get('min_relevance')
            if 'min_relevance' in memory_block and min_rel not in ('low', 'medium', 'high'):
                memory_issues.append(f"memory.min_relevance must be one of low|medium|high, got {min_rel!r}")
            scope = memory_block.get('scope')
            if 'scope' in memory_block and scope not in ('workspace', 'role', 'both'):
                memory_issues.append(f"memory.scope must be one of workspace|role|both, got {scope!r}")
    if memory_issues:
        for mi in memory_issues:
            warn(f"memory config: {mi}")
        result['checks'].append(_make_check('memory_config', False, '; '.join(memory_issues)))
    else:
        result['checks'].append(_make_check('memory_config', True, 'no memory block or valid shape'))

    # Rule 3 (WARN): collaboration.termination.any_of entry shapes
    term_issues = []
    if isinstance(collab, dict):
        termination = collab.get('termination')
        if termination is not None:
            if not isinstance(termination, dict):
                term_issues.append("collaboration.termination must be a mapping")
            else:
                any_of = termination.get('any_of')
                if any_of is not None:
                    if not isinstance(any_of, list):
                        term_issues.append("collaboration.termination.any_of must be a list")
                    else:
                        for idx, entry in enumerate(any_of):
                            if not _is_valid_termination_entry(entry):
                                term_issues.append(
                                    f"collaboration.termination.any_of[{idx}] must be "
                                    f"{{max_iterations: int}} or "
                                    f"{{result_matches: {{agent: string, contains: string}}}}, got {entry!r}")
    if term_issues:
        for ti in term_issues:
            warn(f"collaboration termination: {ti}")
        result['checks'].append(_make_check('termination_any_of', False, '; '.join(term_issues)))
    else:
        result['checks'].append(_make_check('termination_any_of', True, 'no any_of entries or valid shapes'))

    # Rule 4 (ERROR): retired live-contract tools in permission.allow or tools (role + subagents)
    perm_issues = []
    _collect_denied_tools(data, f"role '{role_id}'", perm_issues)
    for entry in discovered_subagents:
        _collect_denied_tools(entry['_data'], f"subagent '{entry['id']}'", perm_issues)
    if perm_issues:
        for pi in perm_issues:
            err(pi)
        result['checks'].append(_make_check('permission_legacy_tools', False, '; '.join(perm_issues)))
    else:
        result['checks'].append(_make_check('permission_legacy_tools', True))

    # Rule 7 is a scoped authoring warning, not a runtime validity claim.
    handoff_issues = []
    for entry in discovered_subagents:
        manifest = entry['_data']
        tools = manifest.get('tools', {})
        if not isinstance(tools, dict) or tools.get('graph_submit_outcome') is not True:
            continue
        prompt = _effective_prompt(manifest, entry['_prompt_context'])
        duplicates = _worker_handoff_duplicates(prompt)
        if duplicates:
            handoff_issues.append(f"subagent '{entry['id']}': runtime supplies " +
                                  ', '.join(duplicates) + '; keep domain criteria in the prompt')
    for issue in handoff_issues:
        warn(issue)
    result['checks'].append(_make_check('worker_runtime_handoff', not handoff_issues,
                                       '; '.join(handoff_issues)))

    result['checks'].append(_make_check(
        'loop_function', True,
        "loop is a host built-in; disable_functions controls whether it is enabled"))

    # Rule 6 (ERROR): Graph v3 declarer/worker tool split
    split_issues = []
    _check_graph_tool_split(data, f"role '{role_id}'", declarer=True, issues=split_issues)
    for entry in discovered_subagents:
        _check_graph_tool_split(entry['_data'], f"subagent '{entry['id']}'",
                                declarer=False, issues=split_issues)
    if split_issues:
        for si in split_issues:
            err(si)
        result['checks'].append(_make_check('graph_tool_split', False, '; '.join(split_issues)))
    else:
        result['checks'].append(_make_check('graph_tool_split', True))

    for entry in discovered_subagents:
        del entry['_data']
        del entry['_asset_dir']
        del entry['_prompt_context']

    return result


def validate_role(role_dir):
    role_path = Path(role_dir).resolve()
    role_id = role_path.name
    role_yaml_path = role_path / 'role.yaml'

    version = load_catalog_version(str(CATALOG_PATH))

    tier1, data = _run_tier1(role_yaml_path, role_id)

    tier2 = {'checks': [], 'errors': [], 'warnings': [], 'passed': True}
    if tier1['passed'] and data is not None:
        tier2 = _run_tier2(role_path, role_id, data)
    else:
        tier2['checks'].append(_make_check('tier2_skipped', False,
                                           'Tier 2 skipped: Tier 1 failed'))
        tier2['passed'] = False

    all_errors = tier1['errors'] + tier2['errors']
    all_warnings = tier2['warnings']
    verdict = 'FAIL' if all_errors else 'PASS'

    return {
        'role_id': role_id,
        'role_dir': str(role_path),
        'tier1': tier1,
        'tier2': tier2,
        'errors': all_errors,
        'warnings': all_warnings,
        'verdict': verdict,
        'catalog_version': version,
        'validation_scope': 'local_authoring',
        'runtime_contract_verified': False,
        'resolution_scope': 'local_assets_only',
    }


def main():
    if len(sys.argv) < 2:
        sys.stderr.write('Usage: python3 validate_role.py <roleDir> [--json]\n')
        return 1

    role_dir = sys.argv[1]
    json_output = '--json' in sys.argv

    result = validate_role(role_dir)

    if json_output:
        def _default(o):
            if isinstance(o, Path):
                return str(o)
            raise TypeError(f'Object of type {o.__class__.__name__} is not JSON serializable')

        print(json.dumps(result, indent=2, default=_default))
    else:
        verdict_label = 'PASS' if result['verdict'] == 'PASS' else 'FAIL'
        print(f"Role:     {result['role_id']}")
        print(f"Verdict:  {verdict_label}")
        print(f"Catalog:  {result['catalog_version']}")
        print("Scope:    local authoring lint; runtime contract and external assets not verified")
        print()

        t1 = result['tier1']
        print(f"Tier 1 ({'PASS' if t1['passed'] else 'FAIL'}):")
        for c in t1['checks']:
            mark = 'PASS' if c['passed'] else 'FAIL'
            print(f"  [{mark}] {c['check']}")
            if 'details' in c:
                print(f"         {c['details']}")
        for e in t1['errors']:
            print(f"  ERROR: {e}")
        print()

        t2 = result['tier2']
        print(f"Tier 2 ({'PASS' if t2['passed'] else 'FAIL'}):")
        for c in t2['checks']:
            if isinstance(c, dict):
                mark = 'PASS' if c['passed'] else 'FAIL'
                print(f"  [{mark}] {c['check']}")
                if c['check'] == 'skill_resolution':
                    for s in c.get('skills', []):
                        status = 'found' if s.get('found') else 'not found'
                        print(f"         skill '{s['name']}': {status}")
                        if s.get('path'):
                            print(f"           path: {s['path']}")
        for w in t2['warnings']:
            print(f"  WARN: {w}")
        for e in t2['errors']:
            print(f"  ERROR: {e}")

    return 0 if result['verdict'] == 'PASS' else 1


if __name__ == '__main__':
    sys.exit(main())
