import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from validate_emperor import ROOT, validate

class EmperorContracts(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'emperor'
        shutil.copytree(ROOT, self.root)

    def test_shipped_role_is_consistent(self):
        self.assertEqual(validate(self.root), [])

    def test_misplaced_quality_is_rejected(self):
        base = self.root / 'subagents/jinyiwei/subagents'
        shutil.move(str(base / 'quality'), str(base / 'security/quality'))
        errors = validate(self.root)
        self.assertTrue(any('Unreachable role' in e for e in errors))
        self.assertTrue(any('registry/tree mismatch' in e for e in errors))

    def test_inherited_readonly_executor_is_rejected(self):
        p = self.root / 'subagents/jinyiwei/role.yaml'
        p.write_text(p.read_text().replace('  Write: true\n  Edit: true\n  Bash: true\n', ''))
        self.assertTrue(any('Bash must explicitly be enabled' in e for e in validate(self.root)))

    def test_shared_skill_drift_is_rejected(self):
        p = self.root / 'subagents/jinyiwei/subagents/backend/skills/execution-contract/SKILL.md'
        p.write_text(p.read_text() + '\nDifferent approval behavior\n')
        self.assertTrue(any('Stale generated asset' in e for e in validate(self.root)))

    def test_dormant_executor_is_rejected(self):
        p = self.root / 'subagents/jinyiwei/subagents/backend/role.yaml'
        p.write_text(p.read_text().replace('auto_activate: [execute, report]', 'auto_activate: [report]'))
        self.assertTrue(any('execute must activate' in e for e in validate(self.root)))

    def test_planner_cannot_become_a_nested_orchestrator(self):
        p = self.root / 'subagents/chancellor/role.yaml'
        p.write_text(p.read_text().replace('graph_declare: false', 'graph_declare: true'))
        self.assertTrue(any('owned only by Emperor' in e for e in validate(self.root)))

    def test_signal_only_worker_completion_is_rejected(self):
        p = self.root / 'subagents/validator/functions/validate.md'
        p.write_text(p.read_text().replace('evidence_met()', 'signal_observed(answer)'))
        self.assertTrue(any('requires an accepted outcome' in e for e in validate(self.root)))

    def test_ungated_submission_is_rejected(self):
        p = self.root / 'subagents/validator/functions/validate.md'
        p.write_text(p.read_text().replace('"decision": "accepted"', '"decision": "rejected"'))
        self.assertTrue(any('missing accepted response gate' in e for e in validate(self.root)))

if __name__ == '__main__':
    unittest.main()
