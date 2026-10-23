"""Adapter tests: subprocesses are mocked; no host or model is started."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location("run_eval", SCRIPTS / "run_eval.py")
run_eval = importlib.util.module_from_spec(spec)
spec.loader.exec_module(run_eval)


class EvalAdapterTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.role = self.root / "example-role"
        self.role.mkdir()
        (self.role / "role.yaml").write_text("name: Example\nprompt: Test role\n")
        self.suite = self.root / "suite.yaml"
        self.suite.write_text("schemaVersion: 1\nid: example\ntarget:\n  host: dsh\n  role: ./example-role\n  provider: example\n  model: example\n")
        self.output = self.root / "evidence"
        self.calls = []
        self.command = ["rolebox"]
        self.fail_action = None
        self.run_code = 0
        self.produce_store = True
        self.report_status = "completed"
        self.failed = 0
        self.missing = 0
        self.unscored = 0
        self.corrupt_report = False
        self.activation_role = self.role.name

    def native(self, argv, stdout, stderr, text):
        action = argv[argv.index("bench") + 1]
        self.calls.append(argv)
        stdout.write(f"native {action}\n")
        stderr.write("native diagnostic\n")
        if action == self.fail_action:
            return subprocess.CompletedProcess(argv, 7)
        if action == "run":
            output = Path(argv[argv.index("--output") + 1])
            if self.produce_store:
                directory = output / "native-run-id"
                directory.mkdir(parents=True)
                (directory / "benchmark.sqlite").write_text("mock native store")
                (directory / "plan.json").write_text(json.dumps({"target": {"roleId": self.role.name}}))
            return subprocess.CompletedProcess(argv, self.run_code)
        if action == "report":
            output = Path(argv[argv.index("--output") + 1])
            if argv[argv.index("--format") + 1] == "json":
                if self.corrupt_report:
                    output.write_text("invalid json")
                else:
                    output.write_text(json.dumps({
                        "run": {"suiteId": "example", "status": self.report_status,
                                "trials": [{"result": {"activation": {"roleId": self.activation_role}}}
                                           if self.activation_role is not None else {"result": {}}]},
                        "summary": {"plannedTrials": 1, "passedTrials": 1 - self.failed - self.missing - self.unscored,
                                    "failedTrials": self.failed, "missingTrials": self.missing, "unscoredTrials": self.unscored},
                    }))
            else:
                output.write_text("<html>native report</html>")
        return subprocess.CompletedProcess(argv, 0)

    def invoke(self, *extra):
        stream = io.StringIO()
        def process(*args, **kwargs):
            completed = self.native(*args, **kwargs)
            return Mock(wait=Mock(return_value=completed.returncode))
        with patch.object(run_eval, "resolve_command", return_value=self.command), \
             patch.object(run_eval.subprocess, "Popen", side_effect=process), \
             contextlib.redirect_stdout(stream):
            code = run_eval.main([str(self.role), "--suite", str(self.suite),
                                  "--output-dir", str(self.output), "--json", *extra])
        return code, json.loads(stream.getvalue())

    def test_defaults_to_validation_without_model_execution(self):
        code, result = self.invoke()
        self.assertEqual(code, 0)
        self.assertEqual(result["status"], "validated")
        self.assertFalse(result["model_execution"])
        self.assertEqual([call[2] for call in self.calls], ["validate"])

    def test_run_requires_confirmation_and_does_not_spawn(self):
        code, result = self.invoke("--action", "run")
        self.assertEqual(code, 2)
        self.assertEqual(result["status"], "needs_confirmation")
        self.assertEqual(self.calls, [])

    def test_missing_cli_is_error_not_successful_skip(self):
        self.command = None
        code, result = self.invoke()
        self.assertNotEqual(code, 0)
        self.assertEqual(result["status"], "error")
        self.assertEqual(self.calls, [])

    def test_spot_check_cannot_bypass_confirmation(self):
        code, result = self.invoke("--spot-check")
        self.assertNotEqual(code, 0)
        self.assertIn("not translated", result["message"])
        self.assertEqual(self.calls, [])

    def test_legacy_rubric_is_not_translated(self):
        for extra in [("--evals", "evals.json"), ()]:
            with self.subTest(extra=extra):
                self.suite.write_text('{"evals": [{"target":{"name":"example-role"},"cases":[]}]}')
                code, result = self.invoke(*extra)
                self.assertNotEqual(code, 0)
                self.assertIn("not translated", result["message"])
                self.assertEqual(self.calls, [])

    def test_wrong_role_target_rejected_before_native_execution(self):
        another = self.root / "another-role"
        another.mkdir()
        self.suite.write_text(self.suite.read_text().replace("./example-role", "./another-role"))
        code, result = self.invoke("--action", "run", "--confirm")
        self.assertNotEqual(code, 0)
        self.assertIn("does not match", result["message"])
        self.assertEqual(self.calls, [])

    def test_doctor_is_static_and_preflight_failure_propagates(self):
        self.fail_action = "doctor"
        code, result = self.invoke("--action", "run", "--confirm")
        self.assertEqual(code, 7)
        self.assertEqual(result["status"], "error")
        self.assertFalse(result["model_execution"])
        self.assertEqual([call[2] for call in self.calls], ["validate", "doctor"])
        self.assertTrue((Path(result["output_dir"]) / "doctor.stderr.txt").exists())

    def test_confirmed_run_preserves_evidence_and_native_baseline(self):
        code, result = self.invoke("--action", "run", "--confirm", "--baseline", "main")
        self.assertEqual(code, 0)
        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["comparison_mode"], "historical")
        self.assertEqual(self.calls[2][-2:], ["--baseline", "main"])
        for path in (result["report_json"], result["report_html"],
                     Path(result["native_run_dir"]) / "benchmark.sqlite",
                     Path(result["output_dir"]) / "adapter-result.json",
                     Path(result["output_dir"]) / "run.stdout.txt"):
            self.assertTrue(Path(path).is_file(), path)

    def test_native_failure_still_gets_persistent_reports(self):
        self.run_code = 1
        self.failed = 1
        code, result = self.invoke("--action", "run", "--confirm")
        self.assertEqual(code, 1)
        self.assertEqual(result["status"], "failed")
        self.assertTrue(Path(result["report_json"]).is_file())

    def test_report_checks_incomplete_status_even_if_command_succeeds(self):
        self.report_status = "incomplete"
        self.missing = 1
        code, result = self.invoke("--action", "run", "--confirm")
        self.assertEqual(code, 2)
        self.assertEqual(result["status"], "incomplete")

    def test_missing_native_store_is_incomplete(self):
        self.produce_store = False
        code, result = self.invoke("--action", "run", "--confirm")
        self.assertEqual(code, 2)
        self.assertEqual(result["status"], "incomplete")
        self.assertTrue((Path(result["output_dir"]) / "run.stdout.txt").is_file())

    def test_cancelled_run_keeps_partial_report_and_exit_code(self):
        self.run_code = 130
        self.report_status = "incomplete"
        self.missing = 1
        code, result = self.invoke("--action", "run", "--confirm")
        self.assertEqual(code, 130)
        self.assertEqual(result["status"], "cancelled")
        self.assertTrue(Path(result["report_json"]).is_file())

    def test_interrupt_waits_for_native_cleanup_instead_of_killing(self):
        process = Mock(wait=Mock(side_effect=[KeyboardInterrupt, 130]))
        result = {"commands": []}
        with patch.object(run_eval.subprocess, "Popen", return_value=process):
            code = run_eval.invoke(["rolebox"], ["run", str(self.suite)], self.root, "interrupt", result)
        self.assertEqual(code, 130)
        process.send_signal.assert_called_once_with(run_eval.signal.SIGINT)
        self.assertEqual(process.wait.call_count, 2)
        process.kill.assert_not_called()

    def test_report_failure_is_not_a_pass(self):
        for mode in ("native-error", "corrupt-json"):
            with self.subTest(mode=mode):
                self.fail_action = "report" if mode == "native-error" else None
                self.corrupt_report = mode == "corrupt-json"
                code, result = self.invoke("--action", "run", "--confirm")
                self.assertNotEqual(code, 0)
                self.assertEqual(result["status"], "error")
                self.assertTrue((Path(result["output_dir"]) / "runs/native-run-id/benchmark.sqlite").is_file())

    def test_saved_report_needs_no_confirmation_or_host(self):
        saved = self.root / "saved-run"
        saved.mkdir()
        code, result = self.invoke("--action", "report", "--run-dir", str(saved))
        self.assertEqual(code, 0)
        self.assertEqual([call[2] for call in self.calls], ["report", "report"])
        self.assertFalse(result["model_execution"])
        self.assertTrue(result["role_identity_verified"])

    def test_saved_report_cannot_attribute_other_role_without_plan(self):
        saved = self.root / "saved-run"
        saved.mkdir()
        self.activation_role = "different-role"
        code, result = self.invoke("--action", "report", "--run-dir", str(saved))
        self.assertNotEqual(code, 0)
        self.assertEqual(result["status"], "error")
        self.assertIn("different role", result["message"])
        self.assertFalse(result["role_identity_verified"])
        self.assertTrue(Path(result["report_json"]).is_file())

    def test_matching_plan_cannot_override_contradictory_activation(self):
        self.activation_role = "different-role"
        code, result = self.invoke("--action", "run", "--confirm")
        self.assertNotEqual(code, 0)
        self.assertEqual(result["status"], "error")
        self.assertFalse(result["role_identity_verified"])

    def test_saved_report_without_identity_is_unverified(self):
        saved = self.root / "saved-run"
        saved.mkdir()
        self.activation_role = None
        code, result = self.invoke("--action", "report", "--run-dir", str(saved))
        self.assertNotEqual(code, 0)
        self.assertIn("unverified", result["message"])
        self.assertFalse(result["role_identity_verified"])

    def test_malformed_saved_plan_keeps_diagnostic_and_report(self):
        saved = self.root / "saved-run"
        saved.mkdir()
        (saved / "plan.json").write_text('[]')
        code, result = self.invoke("--action", "report", "--run-dir", str(saved))
        self.assertNotEqual(code, 0)
        self.assertEqual(result["status"], "error")
        self.assertFalse(result["role_identity_verified"])
        self.assertTrue(Path(result["report_json"]).is_file())
        self.assertTrue((Path(result["output_dir"]) / "adapter-result.json").is_file())

    def test_failed_trial_without_activation_can_use_matching_plan(self):
        self.activation_role = None
        self.failed = 1
        self.run_code = 1
        code, result = self.invoke("--action", "run", "--confirm")
        self.assertEqual(code, 1)
        self.assertEqual(result["status"], "failed")
        self.assertTrue(result["role_identity_verified"])
        self.assertTrue(Path(result["report_html"]).is_file())

    def test_partial_run_without_plan_cannot_establish_all_trial_targets(self):
        saved = self.root / "saved-run"
        saved.mkdir()
        self.missing = 1
        self.report_status = "incomplete"
        code, result = self.invoke("--action", "report", "--run-dir", str(saved))
        self.assertNotEqual(code, 0)
        self.assertFalse(result["role_identity_verified"])
        self.assertIn("unverified", result["message"])

    def test_output_cannot_contaminate_role_snapshot(self):
        code, result = self.invoke("--output-dir", str(self.role / "evidence"))
        self.assertNotEqual(code, 0)
        self.assertIn("outside", result["message"])
        self.assertFalse((self.role / "evidence").exists())
        self.assertEqual(self.calls, [])


if __name__ == "__main__":
    unittest.main()
