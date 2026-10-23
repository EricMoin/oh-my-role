import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import deploy_role
import sync_check


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = self.root / "authoring/example"
        self.source.mkdir(parents=True)
        (self.source / "role.yaml").write_text("name: Example\nprompt: Test role\n")
        self.target = self.root / "host/rolebox"
        self.target.mkdir(parents=True)

    def test_first_install_and_authorized_replacement_remove_stale_files(self):
        result = deploy_role.deploy(self.source, self.target)
        destination = Path(result["path"])
        (destination / "stale.md").write_text("old")
        with self.assertRaises(FileExistsError):
            deploy_role.deploy(self.source, self.target)
        result = deploy_role.deploy(self.source, self.target, replace=True)
        self.assertFalse((destination / "stale.md").exists())
        self.assertTrue((Path(result["backup"]) / "stale.md").exists())
        self.assertFalse(result["runtime_verified"])

    def test_replacement_never_follows_published_symlink(self):
        published = self.root / "release-store"
        published.mkdir()
        (published / "role.yaml").write_text("published original")
        (self.target / "example").symlink_to(published, target_is_directory=True)
        result = deploy_role.deploy(self.source, self.target, replace=True)
        self.assertFalse((self.target / "example").is_symlink())
        self.assertEqual((published / "role.yaml").read_text(), "published original")
        self.assertTrue(Path(result["backup"]).is_symlink())

    def test_broken_symlink_counts_as_existing_and_is_backed_up(self):
        (self.target / "example").symlink_to(self.root / "missing")
        with self.assertRaises(FileExistsError):
            deploy_role.deploy(self.source, self.target)
        result = deploy_role.deploy(self.source, self.target, replace=True)
        self.assertTrue(Path(result["backup"]).is_symlink())

    def test_invalid_staged_role_leaves_destination_untouched(self):
        destination = self.target / "example"
        destination.mkdir()
        (destination / "keep").write_text("original")
        (self.source / "role.yaml").write_text("name: Broken\n")
        with self.assertRaises(ValueError):
            deploy_role.deploy(self.source, self.target, replace=True)
        self.assertEqual((destination / "keep").read_text(), "original")

    def test_failed_publish_restores_previous_entry(self):
        destination = self.target / "example"
        destination.mkdir()
        (destination / "keep").write_text("original")
        rename = Path.rename
        def fail_stage(path, target):
            if path.parent.name.startswith(".role-creator-stage-"):
                raise OSError("simulated publish failure")
            return rename(path, target)
        with patch.object(Path, "rename", fail_stage), self.assertRaises(OSError):
            deploy_role.deploy(self.source, self.target, replace=True)
        self.assertEqual((destination / "keep").read_text(), "original")

    def test_status_matches_target_role_and_requires_all_metadata(self):
        linked = self.target / "example"
        linked.symlink_to(self.source, target_is_directory=True)
        row = {"role": "example", "synced": True, "symlinkValid": True}
        platform = {"target": "opencode", "syncTarget": str(self.target), "roles": [row],
                    "integration": {"registered": True}}
        payload = {"targets": [platform]}
        self.assertEqual(sync_check.inspect_status(payload, "example", "opencode", self.source)["status"], "pass")
        for update in ({"role": "another"}, {"synced": False}, {"symlinkValid": False}):
            platform["roles"] = [dict(row, **update)]
            self.assertEqual(sync_check.inspect_status(payload, "example", "opencode", self.source)["status"], "fail")
        platform["roles"] = [row]
        platform["integration"]["registered"] = False
        self.assertEqual(sync_check.inspect_status(payload, "example", "opencode", self.source)["status"], "fail")
        for integration in (None, {}, {"registered": "false"}, {"registered": 1}):
            platform["integration"] = integration
            self.assertEqual(sync_check.inspect_status(payload, "example", "opencode", self.source)["status"], "fail")
        platform.pop("integration")
        self.assertEqual(sync_check.inspect_status(payload, "example", "opencode", self.source)["status"], "fail")
        platform["target"] = "dsh"
        self.assertEqual(sync_check.inspect_status(payload, "example", "dsh", self.source)["status"], "fail")
        platform["integration"] = None
        self.assertEqual(sync_check.inspect_status(payload, "example", "dsh", self.source)["status"], "pass")
        self.assertEqual(sync_check.inspect_status({"roles": [row]}, "example", "opencode", self.source)["status"], "fail")

    def test_staging_records_exact_role_and_isolates_all_hosts(self):
        env = sync_check.isolated_environment(self.root / "isolated")
        stored = sync_check.stage_install(self.source, env)
        self.assertTrue((stored / "role.yaml").is_file())
        lock = json.loads((Path(env["ROLEBOX_CONFIG_DIR"]) / "rolebox.lock").read_text())
        self.assertEqual(lock["roles"][0]["role"], "example")
        for key in ("HOME", "ROLEBOX_CONFIG_DIR", "ROLEBOX_DATA_DIR", "CODEX_HOME", "DSH_HOME", "PI_CODING_AGENT_DIR"):
            self.assertTrue(Path(env[key]).is_relative_to(self.root / "isolated"))


if __name__ == "__main__":
    unittest.main()
