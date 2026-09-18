#!/usr/bin/env python3
"""Generate Emperor's routing reference and portable shared skill copies."""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'roles/emperor'
SHARED = ('execution-contract', 'evidence-first-research', 'verification-discipline')

def outputs(root=ROOT):
    departments = json.loads((root / 'references/departments.json').read_text())
    text = '''---
name: departments
description: Generated department registry and dispatch contract
---
# Departments

Generated from departments.json by scripts/sync_emperor.py; edit the JSON source.
Known domains dispatch directly to these agents. Unknown domains use emperor--jinyiwei.

| Domain | Agent | Scope | Keywords |
|---|---|---|---|
'''
    for domain, row in departments.items():
        text += f"| {domain} | {row['agent']} | {row['scope']} | {', '.join(row['keywords'])} |\n"
    text += '''
All eight departments explicitly load execution-contract, evidence-first-research
and verification-discipline, plus their domain skill. Skills do not inherit from
parents. Portable copies are generated from Jinyiwei's canonical shared skills.
Verification is selected per task; no unconditional LSP/test requirement for prose.

To add a department, create subagents/jinyiwei/subagents/{domain}/role.yaml with
execute/report functions and scope skill, add departments.json entry, then run
scripts/sync_emperor.py and scripts/validate.py. Use explicit execution tool flags.
Stack-specific installed skills may be declared via opencode_skills when available;
the portable base role does not assume any external role is installed.
'''
    yield root / 'references/departments.md', text
    for domain in departments:
        for skill in SHARED:
            source = root / f'subagents/jinyiwei/skills/{skill}/SKILL.md'
            yield root / f'subagents/jinyiwei/subagents/{domain}/skills/{skill}/SKILL.md', source.read_text()

def check(root=ROOT):
    return [str(path.relative_to(root)) for path, content in outputs(root)
            if not path.is_file() or path.read_text() != content]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check:
        stale = check()
        if stale:
            raise SystemExit('Stale generated Emperor assets:\n' + '\n'.join(stale))
        print('Emperor generated assets are current.')
    else:
        for path, content in outputs():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        print('Updated Emperor generated assets.')

if __name__ == '__main__':
    main()
