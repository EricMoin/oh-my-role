#!/usr/bin/env python3
"""Validate a rolebox role directory (Tier 1 + Tier 2).

Tier 1 (Structural): YAML parse, required fields, -- rule, prompt exclusivity, frontmatter
Tier 2 (Resolution Sim): skill/function/reference discovery, subagent discovery,
                         validateGraph 6-checks, skill-name-collision, collab-target existence

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
from utils import parse_frontmatter, load_catalog_version, CATALOG_PATH, KNOWN_NAMES

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


def _run_tier1(role_yaml_path, role_id, is_subagent=False):
    result = {'checks': [], 'errors': [], 'passed': True}
    E = lambda msg: _add_error(result, msg)

    data = None

    if not role_yaml_path.exists():
        E(f"role.yaml not found at {role_yaml_path}")
        result['checks'].append(_make_check('yaml_parse', False, f"File not found: {role_yaml_path}"))
        result['passed'] = False
        return result, None

    raw = role_yaml_path.read_text()

    try:
        data = yaml.load(raw)
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
        resolved = (role_yaml_path.parent / prompt_file).resolve()
        if not resolved.exists() or not resolved.is_file():
            E(f"prompt_file '{prompt_file}' resolves to non-existent file: {resolved}")
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

    if '--' in role_id:
        E(f"Role ID '{role_id}' contains reserved separator '--'")
        result['checks'].append(_make_check('id_no_dashdash', False,
                                            f"Role ID '{role_id}' contains '--'"))
        result['passed'] = False
    else:
        result['checks'].append(_make_check('id_no_dashdash', True))

    return result, data


def _discover_file_subagents(role_dir):
    found = []
    subagents_dir = role_dir / 'subagents'
    if not subagents_dir.is_dir():
        return found

    for yaml_path in sorted(subagents_dir.rglob('role.yaml')):
        rel = yaml_path.relative_to(subagents_dir)
        depth = len(rel.parts)
        if depth > 4:
            continue
        found.append(yaml_path)
    return found


def _discover_references(role_dir):
    refs = []
    refs_dir = role_dir / 'references'
    if not refs_dir.is_dir():
        return refs

    for md_path in sorted(refs_dir.rglob('*.md')):
        refs.append(md_path)
    return refs


def _run_tier2(role_dir, role_id, data):
    result = {'checks': [], 'errors': [], 'warnings': [], 'passed': True}

    def warn(msg):
        result['warnings'].append(msg)

    def err(msg):
        result['errors'].append(msg)
        result['passed'] = False

    # ── skill resolution ──
    skills = data.get('skills', [])
    if isinstance(skills, list):
        seen = set()
        dups = set()
        for s in skills:
            if s in seen:
                dups.add(s)
            seen.add(s)
        if dups:
            err(f"Duplicate skill names in 'skills:' list: {sorted(dups)}")

        skill_results = []
        for name in skills:
            candidates = [
                role_dir / 'skills' / name / 'SKILL.md',
                role_dir / 'skills' / f'{name}.md',
            ]
            found_path = None
            for c in candidates:
                if c.exists() and c.is_file():
                    found_path = str(c)
                    break
            skill_results.append({
                'name': name,
                'found': found_path is not None,
                'path': found_path
            })
        result['checks'].append({
            'check': 'skill_resolution',
            'passed': True,
            'skills': skill_results
        })
    else:
        result['checks'].append({
            'check': 'skill_resolution',
            'passed': True,
            'skills': [],
            'details': 'skills field is not a list; no skill resolution performed'
        })

    # ── function resolution ──
    functions = data.get('functions')
    if functions is None:
        functions = ['plan', 'execute']
    func_results = []
    if isinstance(functions, list):
        for name in functions:
            candidates = [
                role_dir / 'functions' / f'{name}.md',
            ]
            found_path = None
            for c in candidates:
                if c.exists() and c.is_file():
                    try:
                        body = c.read_text()
                        if body.strip():
                            found_path = str(c)
                    except Exception:
                        pass
                    break
            func_results.append({
                'name': name,
                'found': found_path is not None,
                'path': found_path
            })
    result['checks'].append({
        'check': 'function_resolution',
        'passed': True,
        'functions': func_results
    })

    # ── reference discovery ──
    ref_files = _discover_references(role_dir)
    declared_refs = data.get('references', {})
    ref_entries = []
    for rf in ref_files:
        rel = rf.relative_to(role_dir / 'references')
        ref_name = str(rel.with_suffix(''))
        entry: dict[str, object] = {'name': ref_name, 'path': str(rf)}
        if isinstance(declared_refs, dict) and ref_name in declared_refs:
            entry['declared'] = True
        ref_entries.append(entry)
    result['checks'].append({
        'check': 'reference_discovery',
        'passed': True,
        'references': ref_entries,
        'declared_count': len(declared_refs) if isinstance(declared_refs, dict) else 0
    })

    # ── subagent discovery / validation ──
    subagent_yamls = _discover_file_subagents(role_dir)
    inline_subagents = data.get('subagents', [])
    if not isinstance(inline_subagents, list):
        inline_subagents = []

    discovered_subagents = []
    for sa_path in subagent_yamls:
        sa_dir = sa_path.parent
        sa_rel = sa_dir.relative_to(role_dir / 'subagents')
        sa_name = str(sa_rel)
        t1_result, sa_data = _run_tier1(sa_path, sa_name, is_subagent=True)
        entry = {
            'source': 'file',
            'name': sa_name,
            'path': str(sa_path),
            'valid': t1_result['passed'],
            'tier1': t1_result
        }
        if sa_data:
            entry['display_name'] = sa_data.get('name', '')
        discovered_subagents.append(entry)

    for idx, inline in enumerate(inline_subagents):
        if not isinstance(inline, dict):
            continue
        inline_name = inline.get('name', f'(inline #{idx})')
        entry = {
            'source': 'inline',
            'name': inline_name,
            'valid': bool(_is_string_nonempty(inline.get('name')) and
                          (_is_string_nonempty(inline.get('prompt')) or
                           _is_string_nonempty(inline.get('prompt_file')))),
            'has_prompt': bool(_is_string_nonempty(inline.get('prompt')) or
                              _is_string_nonempty(inline.get('prompt_file')))
        }
        discovered_subagents.append(entry)

    result['checks'].append({
        'check': 'subagent_discovery',
        'passed': True,
        'subagents': discovered_subagents
    })

    # ── skill-name-collision ──
    for s in (skills if isinstance(skills, list) else []):
        if s in KNOWN_NAMES:
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
            graph_warnings.append("Agent-to-agent cycle detected and max_iterations is not set (defaults to 3)")

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

    return result


def validate_role(role_dir):
    role_path = Path(role_dir).resolve()
    role_id = role_path.name
    role_yaml_path = role_path / 'role.yaml'

    version = load_catalog_version(str(CATALOG_PATH)) or '0.20.0'

    tier1, data = _run_tier1(role_yaml_path, role_id)

    tier2 = {'checks': [], 'errors': [], 'warnings': [], 'passed': True}
    if tier1['passed'] and data is not None:
        tier2 = _run_tier2(role_path, role_id, data)
    elif not tier1['passed'] and data is None:
        tier2['checks'].append(_make_check('tier2_skipped', False,
                                           'Tier 2 skipped: Tier 1 failed with no parsed data'))
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
