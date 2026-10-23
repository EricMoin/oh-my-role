import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


ROLE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROLE_DIR / 'scripts'))
from validate_role import validate_role, GRAPH_WORKER_SPLIT
from utils import parse_frontmatter


class ValidationTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='role-validation-')
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.role = self.root / 'demo'
        self.manifest()

    def write(self, path, text):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)

    def manifest(self, directory=None, **values):
        data = {'name': 'Demo', 'prompt': 'Respond to the task.'}
        data.update(values)
        self.write((directory or self.role) / 'role.yaml', json.dumps(data))

    def check(self, report, name):
        return next(item for item in report['tier2']['checks'] if item['check'] == name)

    def test_invalid_file_child_fails_the_parent_report(self):
        self.write(self.role / 'subagents/worker/role.yaml', 'name: Worker\n')
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'FAIL')
        self.assertFalse(self.check(report, 'subagent_discovery')['passed'])
        self.assertIn("Subagent 'worker'", '\n'.join(report['errors']))
        self.assertIn('prompt', '\n'.join(report['errors']))

    def test_inline_prompt_file_is_read_and_takes_precedence(self):
        self.manifest(subagents=[{'name': 'Worker', 'prompt': 'fallback',
                                  'prompt_file': 'missing.md'}])
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'FAIL')
        self.assertIn('missing.md', '\n'.join(report['errors']))
        self.write(self.role / 'missing.md', 'Worker prompt.')
        self.assertEqual(validate_role(self.role)['verdict'], 'PASS')

    def test_reserved_separator_checks_child_names_not_directory_names(self):
        child = self.role / 'subagents/folder--name'
        self.manifest(child, name='Worker')
        self.assertEqual(validate_role(self.role)['verdict'], 'PASS')
        self.manifest(child, name='worker--bad')
        self.assertEqual(validate_role(self.role)['verdict'], 'FAIL')
        shutil.rmtree(child)
        self.manifest(subagents=[{'name': 'worker--bad', 'prompt': 'Work'}])
        self.assertEqual(validate_role(self.role)['verdict'], 'FAIL')

    def test_nested_inline_retired_tools_and_worker_split_are_checked(self):
        leaf = {'name': 'Leaf', 'prompt': 'Work', 'tools': {'graph_create': True}}
        self.manifest(subagents=[{'name': 'Worker', 'prompt': 'Work', 'subagents': [leaf]}])
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'FAIL')
        self.assertIn("worker/leaf", '\n'.join(report['errors']))
        self.assertFalse(self.check(report, 'permission_legacy_tools')['passed'])
        leaf['tools'] = {k: v for k, v in GRAPH_WORKER_SPLIT.items() if k != 'graph_worker_exec'}
        self.manifest(subagents=[{'name': 'Worker', 'prompt': 'Work', 'subagents': [leaf]}])
        self.assertEqual(validate_role(self.role)['verdict'], 'PASS')
        leaf['tools']['graph_worker_exec'] = False
        self.manifest(subagents=[{'name': 'Worker', 'prompt': 'Work', 'subagents': [leaf]}])
        self.assertEqual(validate_role(self.role)['verdict'], 'FAIL')

    def test_file_discovery_reaches_three_levels_and_ignores_fourth(self):
        parent = self.role
        for name in ('One', 'Two', 'Three'):
            parent = parent / 'subagents' / name.lower()
            self.manifest(parent, name=name)
        self.write(parent / 'role.yaml', 'name: Three\n')
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'FAIL')
        self.assertIn('one/two/three', '\n'.join(report['errors']))
        self.manifest(parent, name='Three')
        self.write(parent / 'subagents/four/role.yaml', 'name: Four\n')
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'PASS')
        self.assertEqual(len(self.check(report, 'subagent_discovery')['subagents']), 3)

    def test_inline_prompt_context_matches_nested_loader_rules(self):
        self.write(self.role / 'prompts/worker.md', 'Worker')
        self.write(self.role / 'prompts/nested.md', 'Nested')
        self.write(self.role / 'prompts/leaf.md', 'Leaf')
        self.manifest(subagents=[{
            'name': 'Worker', 'prompt_file': 'prompts/worker.md', 'subagents': [{
                'name': 'Nested', 'prompt_file': 'prompts/nested.md', 'subagents': [{
                    'name': 'Leaf', 'prompt_file': 'leaf.md',
                }],
            }],
        }])
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'PASS', report['errors'])
        self.assertEqual(len(self.check(report, 'subagent_discovery')['subagents']), 3)

    def test_file_children_can_contain_inline_children(self):
        child = self.role / 'subagents/worker'
        self.write(child / 'prompts/leaf.md', 'Leaf')
        self.manifest(child, name='Worker', subagents=[{
            'name': 'Leaf', 'prompt_file': 'prompts/leaf.md',
        }])
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'PASS', report['errors'])
        self.assertEqual(len(self.check(report, 'subagent_discovery')['subagents']), 2)

    def test_child_function_body_and_reference_are_checked(self):
        child = self.role / 'subagents/worker'
        self.manifest(child, name='Worker', functions=['custom'],
                      references={'guide': 'missing-guide.md'})
        self.write(child / 'functions/custom.md', '---\nname: custom\n---\n')
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'FAIL')
        self.assertIn('empty body', '\n'.join(report['errors']))
        self.assertIn('missing-guide.md', '\n'.join(report['errors']))
        self.write(child / 'functions/custom.md', '---\nname: custom\n---\nDo work.')
        self.write(child / 'missing-guide.md', 'Reference material.')
        self.assertEqual(validate_role(self.role)['verdict'], 'PASS')

    def test_frontmatter_only_function_does_not_resolve(self):
        self.manifest(functions=['custom'])
        self.write(self.role / 'functions/custom.md', '---\nname: custom\n---\n')
        report = validate_role(self.role)
        custom = next(f for f in self.check(report, 'function_resolution')['functions']
                      if f['name'] == 'custom')
        self.assertFalse(custom['found'])
        self.assertEqual(report['verdict'], 'FAIL')

    def test_default_functions_are_union_then_disable_for_root_and_child(self):
        self.manifest(functions=['custom', 'plan'], disable_functions=['execute'],
                      subagents=[{'name': 'Worker', 'prompt': 'Work',
                                  'functions': [], 'disable_functions': ['loop']}])
        self.write(self.role / 'functions/custom.md', 'Do work.')
        report = validate_role(self.role)
        self.assertEqual(self.check(report, 'function_resolution')['enabled'],
                         ['plan', 'loop', 'custom'])
        child = self.check(report, 'subagent_discovery')['subagents'][0]
        functions = next(c for c in child['assets']['checks'] if c['check'] == 'function_resolution')
        self.assertEqual(functions['enabled'], ['plan', 'execute'])
        self.assertTrue(self.check(report, 'loop_function')['passed'])

    def test_signal_and_optional_worker_exec_are_not_retired(self):
        self.manifest(tools={'signal': True}, permission={'allow': ['signal']})
        self.assertEqual(validate_role(self.role)['verdict'], 'PASS')

    def test_external_assets_are_explicitly_unverified(self):
        self.manifest(skills=['shared'], functions=['shared-function'])
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'PASS')
        self.assertEqual(report['validation_scope'], 'local_authoring')
        self.assertFalse(report['runtime_contract_verified'])
        self.assertEqual(report['resolution_scope'], 'local_assets_only')
        self.assertIn('host/global', '\n'.join(report['warnings']))

    def test_bad_asset_list_produces_diagnostics_instead_of_crashing(self):
        self.manifest(skills=[{'name': 'not-a-string'}], functions='custom')
        report = validate_role(self.role)
        self.assertEqual(report['verdict'], 'FAIL')
        self.assertIn('list of non-empty strings', '\n'.join(report['errors']))

    def test_frontmatter_failure_preserves_body_and_crlf_is_supported(self):
        file = self.role / 'function.md'
        malformed = '---\nname: [\n---\n'
        self.write(file, malformed)
        self.assertEqual(parse_frontmatter(str(file)), ({}, malformed))
        file.write_bytes(b'---\r\nname: custom\r\n---\r\nDo work.\r\n')
        self.assertEqual(parse_frontmatter(str(file)), ({'name': 'custom'}, 'Do work.\n'))

    def test_existing_fixtures_keep_their_expected_verdicts(self):
        for fixture in sorted((ROLE_DIR / 'tests/fixtures').iterdir()):
            if not fixture.is_dir():
                continue
            with self.subTest(fixture=fixture.name):
                expected = 'FAIL' if fixture.name.startswith('broken-') else 'PASS'
                self.assertEqual(validate_role(fixture)['verdict'], expected)

    @unittest.skipUnless(os.environ.get('ROLEBOX_ROOT') and shutil.which('bun'),
                         'Set ROLEBOX_ROOT and install Bun for source parity checks')
    def test_runtime_agrees_on_valid_nested_prompts_and_empty_functions(self):
        child = self.role / 'subagents/worker'
        self.manifest(child, name='Worker', subagents=[{'name': 'Leaf', 'prompt_file': 'leaf.md'}])
        self.write(child / 'leaf.md', 'Leaf')
        self.manifest(functions=['custom'])
        self.write(self.role / 'functions/custom.md', '---\nname: custom\n---\n')
        source = Path(os.environ['ROLEBOX_ROOT']).resolve()
        script = '''
const root = process.argv[1], role = process.argv[2];
const { discoverRoles } = await import(root + '/src/loader/role-loader.ts');
const { resolveFunctions } = await import(root + '/src/function/file-resolver.ts');
const config = (await discoverRoles(role)).get('demo');
const functions = await resolveFunctions(['custom'], role + '/demo', role + '/absent', role + '/absent');
console.log(JSON.stringify({child: config.subagents[0].name,
  leaf: config.subagents[0].subagents[0].name, functions: functions.map(f => f.name)}));
'''
        process = subprocess.run(['bun', '-e', script, str(source), str(self.root)],
                                 check=True, capture_output=True, text=True, timeout=30)
        self.assertEqual(json.loads(process.stdout), {'child': 'Worker', 'leaf': 'Leaf', 'functions': []})
        report = validate_role(self.role)
        self.assertTrue(self.check(report, 'subagent_discovery')['passed'])
        self.assertEqual(report['verdict'], 'FAIL')


if __name__ == '__main__':
    unittest.main()
