#!/usr/bin/env python3
"""Tier 4 adapter for native rolebox bench suites; defaults to static validation.

Run models only with --action run --confirm. Native results and command output
remain on disk, including failed or interrupted runs. No legacy rubric scoring
or automatic with/without-role comparison is performed.
"""
import argparse
import json
import signal
import subprocess
import sys
import tempfile
from pathlib import Path

import ruamel.yaml

from rolebox_cli import resolve_command


MIGRATION = (
    "Legacy evals.json/rubric and --spot-check execution are unsupported. "
    "Create a native suite.yaml plus cases.jsonl (see references/templates/eval-set.md), "
    "set target.role to the role directory, and pass --suite. For a small run use "
    "a separate one-case suite with run.repetitions: 1 and --action run --confirm. "
    "Expectations, weights, scenarios and grader scores are not translated."
)


def load_suite(role_dir, suite_arg):
    role_dir = Path(role_dir).resolve(strict=True)
    if not (role_dir / "role.yaml").is_file():
        raise ValueError("The target role directory must contain role.yaml")
    suite_path = Path(suite_arg).resolve(strict=True)
    if suite_path.is_dir():
        suite_path = suite_path / "suite.yaml"
    data = ruamel.yaml.YAML(typ="safe").load(suite_path.read_text())
    if not isinstance(data, dict) or "evals" in data or "cases" in data:
        raise ValueError(MIGRATION)
    target = data.get("target")
    if data.get("schemaVersion") != 1 or not isinstance(target, dict):
        raise ValueError("Expected a native schemaVersion: 1 suite with target.role")
    target_role = target.get("role")
    if not isinstance(target_role, str) or not target_role.strip():
        raise ValueError("Native suite target.role must name the role directory")
    if (suite_path.parent / target_role).resolve(strict=True) != role_dir:
        raise ValueError("Suite target.role does not match the requested role directory")
    if target.get("host") != "dsh":
        raise ValueError("Native benchmarks currently support target.host: dsh only")
    return role_dir, suite_path, data


def evidence_directory(output_dir, role_dir, suite_path, suite):
    parent = Path(output_dir or Path.cwd() / ".rolebox" / "role-creator-evals").resolve()
    protected = [role_dir]
    dataset = suite_path.parent / suite.get("dataset", "cases.jsonl")
    if dataset.is_file():
        for line in dataset.read_text().splitlines():
            if not line.strip():
                continue
            case = json.loads(line)
            workspace = case.get("workspace", {}) if isinstance(case, dict) else {}
            if isinstance(workspace, dict):
                protected.extend((suite_path.parent / workspace[key]).resolve()
                                 for key in ("fixture", "checks")
                                 if isinstance(workspace.get(key), str))
    if any(parent == root or root in parent.parents for root in protected):
        raise ValueError("Evidence output must be outside the role, fixture and checks directories")
    parent.mkdir(parents=True, exist_ok=True)
    return Path(tempfile.mkdtemp(prefix="eval-", dir=parent))


def invoke(command, arguments, evidence, label, result):
    argv = [*command, "bench", *arguments]
    stdout_path = evidence / f"{label}.stdout.txt"
    stderr_path = evidence / f"{label}.stderr.txt"
    entry = {"command": argv, "stdout": str(stdout_path), "stderr": str(stderr_path)}
    result["commands"].append(entry)
    # Stream directly to persistent files: a native crash cannot discard output.
    with stdout_path.open("w") as stdout, stderr_path.open("w") as stderr:
        process = subprocess.Popen(argv, stdout=stdout, stderr=stderr, text=True)
        interrupted = False
        while True:
            try:
                code = process.wait()
                break
            except KeyboardInterrupt:
                interrupted = True
                # Let the native coordinator cancel and reap its own workers.
                process.send_signal(signal.SIGINT)
    entry["returncode"] = code
    return 130 if interrupted else code if code >= 0 else 128 - code


def report_run(command, directory, evidence, result, suite, role_dir):
    result["native_run_dir"] = str(directory)
    report_path = evidence / "report.json"
    code = invoke(command, ["report", str(directory), "--format", "json", "--output", str(report_path)],
                  evidence, "report-json", result)
    if code:
        result.update(status="error", message="Native report failed; saved run evidence is retained")
        return code
    report = json.loads(report_path.read_text())
    run, summary = report["run"], report["summary"]
    result.update(report_json=str(report_path), summary=summary, role_identity_verified=False)
    if run["suiteId"] != suite.get("id"):
        raise ValueError("Saved run belongs to a different suite")
    plan_path = directory / "plan.json"
    plan_verified = False
    if plan_path.is_file():
        plan = json.loads(plan_path.read_text())
        target = plan.get("target") if isinstance(plan, dict) else None
        if not isinstance(target, dict) or target.get("roleId") != role_dir.name:
            raise ValueError("Saved run targets a different role")
        plan_verified = True
    trials = run.get("trials", [])
    activations_verified = bool(trials)
    for trial in trials:
        activation = trial.get("result", {}).get("activation")
        if activation is None:
            activations_verified = False
        elif not isinstance(activation, dict) or activation.get("roleId") != role_dir.name:
            raise ValueError("Saved run activation targets a different role")
    if not plan_verified and (not activations_verified or summary["missingTrials"]):
        raise ValueError("Saved run role identity is unverified: matching plan or complete per-trial activation evidence is required")
    result["role_identity_verified"] = True
    html_path = evidence / "report.html"
    code = invoke(command, ["report", str(directory), "--format", "html", "--output", str(html_path)],
                  evidence, "report-html", result)
    if code:
        result.update(status="error", message="Native HTML report failed; JSON evidence is retained")
        return code
    result["report_html"] = str(html_path)
    if run["status"] != "completed" or summary["missingTrials"] or summary["unscoredTrials"]:
        result["status"] = "incomplete"
        return 2
    if summary["failedTrials"]:
        result["status"] = "failed"
        return 1
    if summary["plannedTrials"] < 1 or summary["passedTrials"] != summary["plannedTrials"]:
        raise ValueError("Native report does not establish a complete passing run")
    result["status"] = "passed"
    return 0


def execute(args, result):
    if args.evals or args.spot_check:
        raise ValueError(MIGRATION)
    if not args.suite:
        raise ValueError("--suite is required. " + MIGRATION)
    if args.baseline and args.action != "run":
        raise ValueError("--baseline is supported only for --action run; use native bench compare for saved runs")
    if args.run_dir and args.action != "report":
        raise ValueError("--run-dir is supported only for --action report")
    if args.action == "report" and not args.run_dir:
        raise ValueError("--action report requires --run-dir")
    role_dir, suite_path, suite = load_suite(args.role_dir, args.suite)
    result.update(role_id=role_dir.name, suite=str(suite_path), action=args.action,
                  model_execution=False)
    if args.action == "run" and not args.confirm:
        result.update(status="needs_confirmation", message="Model execution requires --confirm; validate and doctor make no model requests")
        return 2
    command = resolve_command(args.rolebox_root)
    if not command:
        raise ValueError("rolebox CLI unavailable; install it or supply --rolebox-root / ROLEBOX_ROOT for a local checkout")
    evidence = evidence_directory(args.output_dir, role_dir, suite_path, suite)
    result.update(output_dir=str(evidence), commands=[])
    if args.action == "report":
        return report_run(command, Path(args.run_dir).resolve(strict=True), evidence, result, suite, role_dir)
    for action in (["validate"] if args.action == "validate" else ["validate", "doctor"]):
        code = invoke(command, [action, str(suite_path)], evidence, action, result)
        if code:
            result.update(status="error", message=f"Native bench {action} failed; inspect the saved diagnostic")
            return code
    if args.action != "run":
        result.update(status="validated" if args.action == "validate" else "prerequisites_checked",
                      live_execution_verified=False)
        return 0
    native_output = evidence / "runs"
    arguments = ["run", str(suite_path), "--output", str(native_output)]
    if args.baseline:
        arguments.extend(["--baseline", args.baseline])
        result.update(baseline=args.baseline, comparison_mode="historical")
    result["model_execution"] = True
    run_code = invoke(command, arguments, evidence, "run", result)
    result["native_returncode"] = run_code
    # The dedicated output parent contains this invocation's evidence only.
    runs = list(native_output.glob("*/benchmark.sqlite"))
    if len(runs) != 1:
        result.update(status="incomplete", message="Native run did not produce exactly one readable result store; command output is retained")
        return run_code or 2
    report_code = report_run(command, runs[0].parent, evidence, result, suite, role_dir)
    if run_code:
        if run_code == 130:
            result["status"] = "cancelled"
        elif result["status"] == "passed":
            result["status"] = "incomplete" if run_code == 2 else "failed"
        return run_code
    return report_code


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("role_dir")
    parser.add_argument("--suite", help="Native suite directory or suite.yaml; target.role must match role_dir")
    parser.add_argument("--action", choices=("validate", "doctor", "run", "report"), default="validate")
    parser.add_argument("--confirm", action="store_true", help="Authorize model requests for --action run")
    parser.add_argument("--run-dir", help="Saved native run to report; no model requests")
    parser.add_argument("--output-dir", help="Persistent evidence parent (outside role, fixtures and checks)")
    parser.add_argument("--baseline", help="Existing native named baseline for historical comparison during run")
    parser.add_argument("--rolebox-root", help="Local rolebox source checkout (or set ROLEBOX_ROOT)")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--evals", help=argparse.SUPPRESS)
    parser.add_argument("--spot-check", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args(argv)
    result = {"status": "error", "model_execution": False}
    try:
        code = execute(args, result)
    except KeyboardInterrupt:
        code = 130
        result.update(status="cancelled", message="Interrupted; persistent command and native run evidence are retained")
    except (OSError, ValueError, TypeError, KeyError, ruamel.yaml.YAMLError) as error:
        code = 1
        result.update(status="error", message=str(error))
    result["exit_code"] = code
    if result.get("output_dir"):
        (Path(result["output_dir"]) / "adapter-result.json").write_text(json.dumps(result, indent=2) + "\n")
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Tier 4: {result['status']}")
        if result.get("message"):
            print(result["message"])
        if result.get("output_dir"):
            print(f"Evidence: {result['output_dir']}")
    return code


if __name__ == "__main__":
    sys.exit(main())
