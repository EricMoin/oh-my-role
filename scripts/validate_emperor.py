#!/usr/bin/env python3
"""Check Emperor's loadable role tree, capabilities and generated asset contract."""
import json
from pathlib import Path
import yaml
from sync_emperor import ROOT, SHARED, check

GRAPH_WRITES = ('graph_create', 'graph_add_node', 'graph_add_edge', 'graph_add_loop', 'graph_run', 'graph_cancel', 'graph_approve')

def validate(root=ROOT):
    errors = []
    discovered = {}
    def walk(directory, agent_id, inherited_tools=None):
        config = yaml.safe_load((directory / 'role.yaml').read_text())
        tools = config.get('tools')
        if tools is None:
            tools = inherited_tools or {}
        discovered[agent_id] = (directory, config, tools)
        for name in config.get('skills', []):
            if not (directory / 'skills' / name / 'SKILL.md').is_file():
                errors.append(f'{agent_id}: missing local skill {name}')
        for child in sorted(directory.glob('subagents/*/role.yaml')):
            child_config = yaml.safe_load(child.read_text())
            slug = '-'.join(child_config['name'].lower().split())
            walk(child.parent, agent_id + '--' + slug, tools)
    walk(root, 'emperor')
    reachable = {directory / 'role.yaml' for directory, _, _ in discovered.values()}
    for p in root.rglob('role.yaml'):
        if p not in reachable:
            errors.append(f'Unreachable role: {p.relative_to(root)}')
    departments = json.loads((root / 'references/departments.json').read_text())
    agents = [v['agent'] for v in departments.values()]
    if len(agents) != len(set(agents)):
        errors.append('Department dispatch IDs must be unique')
    actual = {k for k in discovered if k.startswith('emperor--jinyiwei--')}
    if actual != set(agents):
        errors.append(f'Department registry/tree mismatch: {sorted(actual ^ set(agents))}')
    for agent in ['emperor--jinyiwei', *agents]:
        if agent not in discovered:
            continue
        directory, config, tools = discovered[agent]
        for tool in ('Write', 'Edit', 'Bash'):
            if tools.get(tool) is not True:
                errors.append(f'{agent}: {tool} must explicitly be enabled')
        for skill in SHARED:
            if skill not in config.get('skills', []):
                errors.append(f'{agent}: missing shared skill registration {skill}')
        if agent in agents:
            for tool in GRAPH_WRITES:
                if tools.get(tool) is not False:
                    errors.append(f'{agent}: leaf must disable {tool}')
        for fn in ('execute', 'report'):
            if fn not in config.get('auto_activate', []):
                errors.append(f'{agent}: {fn} must activate on dispatch')
    for agent in ('emperor', 'emperor--approval', 'emperor--validator'):
        if agent not in discovered:
            errors.append(f'Missing role {agent}')
            continue
        tools = discovered[agent][2]
        if tools.get('Write') is not False or tools.get('Edit') is not False:
            errors.append(f'{agent}: must not edit files')
    errors.extend('Stale generated asset: '+p for p in check(root))
    return errors

if __name__ == '__main__':
    failures = validate()
    if failures:
        raise SystemExit('\n'.join(failures))
    print('Emperor role contracts passed.')
