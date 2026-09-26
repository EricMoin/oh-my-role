#!/usr/bin/env python3
"""Check Emperor's loadable role tree, capabilities and generated asset contract."""
import json
from pathlib import Path
import yaml
from sync_emperor import ROOT, SHARED, check

PARENT_GRAPH_TOOLS = ('graph_declare', 'graph_control', 'graph_status', 'graph_audit')

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
        for fn in ('execute', 'report'):
            if fn not in config.get('auto_activate', []):
                errors.append(f'{agent}: {fn} must activate on dispatch')
    for agent, (directory, config, tools) in discovered.items():
        if agent == 'emperor--copilot':
            continue
        for tool in PARENT_GRAPH_TOOLS:
            if tools.get(tool) is not (agent == 'emperor'):
                errors.append(f'{agent}: {tool} must be owned only by Emperor')
        if tools.get('graph_submit_outcome') is not (agent != 'emperor'):
            errors.append(f'{agent}: graph_submit_outcome must be enabled only on workers')
        if tools.get('graph_worker_exec') is not (agent != 'emperor'):
            errors.append(f'{agent}: graph_worker_exec must be enabled only on workers')
        if agent == 'emperor':
            continue
        for name in config.get('functions', []):
            path = directory / 'functions' / f'{name}.md'
            if not path.is_file():
                errors.append(f'{agent}: missing function {name}')
                continue
            metadata = yaml.safe_load(path.read_text().split('---', 2)[1])
            if (metadata.get('continue_until') != 'evidence_met()'
                    or metadata.get('requires_evidence') != ['outcome_accepted']):
                errors.append(f'{agent}/{name}: completion requires an accepted outcome')
            gates = metadata.get('observe', [])
            if not any(gate.get('tool') == 'graph_submit_outcome'
                       and gate.get('set_evidence') == 'outcome_accepted'
                       and gate.get('when_output', {}).get('contains') == '"decision": "accepted"'
                       for gate in gates):
                errors.append(f'{agent}/{name}: missing accepted response gate')
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
