#!/usr/bin/env python3
"""Tier 4 behavioral eval — runs eval cases in a separate opencode instance.

Sets up a throwaway opencode config with/without the target role, runs eval prompts
via opencode non-interactive mode, captures transcripts, and prepares output for the
grader subagent.

Usage: python3 scripts/run_eval.py <roleDir> [--evals EVALS_JSON] [--confirm] [--spot-check] [--json]

Requires --confirm to proceed. Prints cost estimate first.
If opencode not installed → status "skipped", exit 0.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path


def find_opencode() -> str | None:
    """Find opencode binary."""
    try:
        result = subprocess.run(
            ["which", "opencode"], capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return None


def estimate_cost(evals_data: dict) -> dict:
    """Print a rough cost estimate based on eval cases and runs."""
    n_cases = 0
    for eval_entry in evals_data.get("evals", []):
        n_cases += len(eval_entry.get("cases", []))
    n_runs = 3  # default runs per case
    estimated_tokens = n_cases * n_runs * 5000  # rough estimate
    est_rate = 3.0 / 1_000_000  # $3/M tokens rough
    return {
        "num_cases": n_cases,
        "num_runs_per_case": n_runs,
        "estimated_tokens": estimated_tokens,
        "estimated_cost": f"~${estimated_tokens * est_rate:.2f}",
    }


def build_baseline_config(tmpdir: str) -> str:
    """Build a clean baseline opencode config with no target role."""
    config_dir = Path(tmpdir) / "baseline"
    rolebox_dir = config_dir / "opencode" / "rolebox"
    rolebox_dir.mkdir(parents=True, exist_ok=True)
    return str(config_dir)


def build_with_skill_config(tmpdir: str, role_dir: str, role_id: str) -> str:
    """Build a config with the target role installed."""
    config_dir = Path(tmpdir) / "with-skill"
    rolebox_dir = config_dir / "opencode" / "rolebox"
    rolebox_dir.mkdir(parents=True, exist_ok=True)
    target = rolebox_dir / role_id
    shutil.copytree(role_dir, target, dirs_exist_ok=True)
    return str(config_dir)


def run_opencode_eval(
    opencode_path: str, config_dir: str, prompt: str, timeout: int = 120
) -> dict:
    """Run a single opencode eval in the given config environment.

    Returns dict with transcript, timing, success status.
    """
    env = os.environ.copy()
    env["XDG_CONFIG_HOME"] = config_dir

    start = time.time()
    try:
        result = subprocess.run(
            [opencode_path, "run", prompt],
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
        elapsed = time.time() - start
        return {
            "success": result.returncode == 0,
            "transcript": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "duration_seconds": round(elapsed, 2),
        }
    except subprocess.TimeoutExpired:
        elapsed = time.time() - start
        return {
            "success": False,
            "transcript": "",
            "stderr": "TIMEOUT",
            "returncode": -1,
            "duration_seconds": timeout,
        }


def run_state_machine_checks(role_dir: str) -> dict:
    """Run deterministic checks for state-machine functions.

    Checks: gate blocks/passes, observe non-mutating, transitions deterministic,
    continue_until terminates.

    This is a stub — full implementation requires parsing function frontmatter.
    """
    # TODO: implement deterministic checks
    # - Parse function frontmatter for gate/continue_until/observe/transitions
    # - Verify gate correctly blocks/passes based on conditions
    # - Verify observe doesn't change function state
    return {
        "checked": False,
        "message": "State-machine deterministic checks not yet implemented",
    }


def main():
    parser = argparse.ArgumentParser(description="Tier 4 behavioral eval")
    parser.add_argument("role_dir", help="Path to the role directory to evaluate")
    parser.add_argument("--evals", default=None, help="Path to evals.json")
    parser.add_argument("--confirm", action="store_true", help="Confirm running the eval")
    parser.add_argument(
        "--spot-check", action="store_true", help="Run 1 case, 1 run (no baseline)"
    )
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument(
        "--output-dir", default=None, help="Output directory for transcripts"
    )
    args = parser.parse_args()

    role_dir = Path(args.role_dir)
    if not role_dir.exists():
        result = {
            "status": "error",
            "message": f"Role directory not found: {args.role_dir}",
        }
        if args.json:
            print(json.dumps(result))
        else:
            print(f"ERROR: {result['message']}")
        return 1

    role_id = role_dir.name

    # Check opencode availability
    opencode_path = find_opencode()
    if opencode_path is None:
        result = {
            "status": "skipped",
            "role_id": role_id,
            "message": (
                "opencode CLI not found. "
                "Install opencode to run Tier 4 behavioral evals."
            ),
        }
        if args.json:
            print(json.dumps(result))
        else:
            print(f"\N{WARNING SIGN}  Tier 4 skipped: opencode CLI not found")
        return 0

    # Load evals
    evals_path = args.evals
    if not evals_path:
        default_evals = role_dir / "evals" / "evals.json"
        if default_evals.exists():
            evals_path = str(default_evals)
        else:
            result = {
                "status": "error",
                "message": (
                    "No evals.json specified and not found at evals/evals.json"
                ),
            }
            if args.json:
                print(json.dumps(result))
            else:
                print(f"ERROR: {result['message']}")
            return 1

    try:
        with open(evals_path) as f:
            evals_data = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError) as e:
        result = {"status": "error", "message": f"Failed to load evals: {e}"}
        if args.json:
            print(json.dumps(result))
        else:
            print(f"ERROR: {result['message']}")
        return 1

    # Validate evals structure
    if not isinstance(evals_data.get("evals"), list):
        result = {
            "status": "error",
            "message": "Invalid evals.json: 'evals' must be a list",
        }
        if args.json:
            print(json.dumps(result))
        else:
            print(f"ERROR: {result['message']}")
        return 1

    # Cost estimate
    estimate = estimate_cost(evals_data)

    if not args.confirm and not args.spot_check:
        result = {"status": "needs_confirmation", "estimate": estimate}
        if args.json:
            print(json.dumps(result))
        else:
            print(f"\n\N{BAR CHART} Cost Estimate:")
            print(f"   Cases:              {estimate['num_cases']}")
            print(f"   Runs per case:      {estimate['num_runs_per_case']}")
            print(f"   Estimated tokens:   {estimate['estimated_tokens']}")
            print(f"   Estimated cost:     {estimate['estimated_cost']}")
            print(f"\n\N{WARNING SIGN}  Use --confirm to proceed, or --spot-check for 1 case / 1 run")
        return 0

    # Create temp directory for configs
    tmpdir = tempfile.mkdtemp(prefix="rolebox-eval-")
    output_dir = args.output_dir or os.path.join(tmpdir, "outputs")
    os.makedirs(output_dir, exist_ok=True)

    try:
        # Build configs
        baseline_config = build_baseline_config(tmpdir)
        with_skill_config = build_with_skill_config(tmpdir, str(role_dir), role_id)

        results = {
            "role_id": role_id,
            "evals_path": evals_path,
            "spot_check": args.spot_check,
            "runs_per_case": 1 if args.spot_check else 3,
            "cases": [],
            "state_machine_checks": run_state_machine_checks(str(role_dir)),
        }

        n_runs = 1 if args.spot_check else 3

        for eval_entry in evals_data.get("evals", []):
            for case in eval_entry.get("cases", []):
                case_id = case.get("id", "unknown")
                prompt = case.get("prompt", "")

                if not prompt.strip():
                    continue

                runs = []

                # With-skill runs
                for i in range(n_runs):
                    run_result = run_opencode_eval(
                        opencode_path, with_skill_config, prompt
                    )
                    run_result["type"] = "with_skill"
                    run_result["run_index"] = i
                    runs.append(run_result)

                # Baseline runs (skip for spot-check)
                if not args.spot_check:
                    for i in range(n_runs):
                        run_result = run_opencode_eval(
                            opencode_path, baseline_config, prompt
                        )
                        run_result["type"] = "baseline"
                        run_result["run_index"] = i
                        runs.append(run_result)

                # Save transcripts
                transcript_path = os.path.join(output_dir, f"{case_id}.json")
                with open(transcript_path, "w") as f:
                    json.dump(
                        {"case_id": case_id, "prompt": prompt, "runs": runs},
                        f,
                        indent=2,
                    )

                results["cases"].append(
                    {
                        "case_id": case_id,
                        "prompt": prompt,
                        "expectations": case.get("expectations", []),
                        "runs": runs,
                        "transcript_path": transcript_path,
                    }
                )

        results["status"] = "completed"
        results["output_dir"] = output_dir

        if args.json:
            print(json.dumps(results, indent=2))
        else:
            n = len(results["cases"])
            runs_label = "run" if n_runs == 1 else "runs"
            print(f"\n\N{CHECK MARK} Tier 4 eval completed: {n} cases, {n_runs} {runs_label} each")
            print(f"   Transcripts: {output_dir}")
            print(f"   Grade the results using the grader subagent")

        return 0
    finally:
        # Don't cleanup if output_dir is specified (user wants to keep results)
        if not args.output_dir:
            shutil.rmtree(tmpdir, ignore_errors=True)
        else:
            # Clean up temp config but keep the output
            for p in Path(tmpdir).iterdir():
                if p.name != "outputs" and os.path.exists(str(p)):
                    shutil.rmtree(str(p), ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
