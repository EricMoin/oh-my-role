#!/usr/bin/env bash
# Offline role-creator authoring and runtime contracts; no deployment or model calls.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROLE_DIR="$SCRIPT_DIR"
EXIT_CODE=0

echo "=== Role Creator Self-Test ==="
echo ""

# Tier 1+2: Self-validation (always runs)
echo "--- Tier 1+2: Self-validation ---"
VALIDATE_JSON=$(python3 "$ROLE_DIR/scripts/validate_role.py" "$ROLE_DIR" --json )
if echo "$VALIDATE_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'Verdict: {d[\"verdict\"]}')
print(f'Tier 1 checks: {len(d.get(\"tier1\", {}).get(\"checks\", []))}')
print(f'Tier 2 checks: {len(d.get(\"tier2\", {}).get(\"checks\", []))}')
print(f'Errors: {len(d[\"errors\"])}')
print(f'Warnings: {len(d[\"warnings\"])}')
if d['verdict'] != 'PASS':
    sys.exit(1)
"; then
    echo "✓ Self-validation PASSED"
else
    echo "✗ Self-validation FAILED"
    EXIT_CODE=1
fi

echo ""

# Tier 1+2: Fixture validation
echo "--- Tier 1+2: Fixture validation ---"
ALL_FIXTURES_PASS=true
for f in "valid-simple" "valid-director" "valid-nested" "valid-graph-v3"; do
    FIXTURE_JSON=$(python3 "$ROLE_DIR/scripts/validate_role.py" "$ROLE_DIR/tests/fixtures/$f" --json )
    echo "$FIXTURE_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  $f: {d[\"verdict\"]}')
if d['verdict'] != 'PASS':
    sys.exit(1)
" || ALL_FIXTURES_PASS=false
done
for f in "broken-noname" "broken-dashdash--x" "broken-noprompt" "broken-badgraph" "broken-dupskill" "broken-legacy-dispatch" "broken-retired-v2" "broken-graph-block"; do
    FIXTURE_JSON=$(python3 "$ROLE_DIR/scripts/validate_role.py" "$ROLE_DIR/tests/fixtures/$f" --json )
    echo "$FIXTURE_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  $f: {d[\"verdict\"]}')
if d['verdict'] != 'FAIL':
    sys.exit(1)
" || ALL_FIXTURES_PASS=false
done

if $ALL_FIXTURES_PASS; then
    echo "✓ All fixture validations PASSED"
else
    echo "✗ Some fixture validations FAILED"
    EXIT_CODE=1
fi

echo ""

# Python regressions use temporary directories and stub paid execution.
if ! PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s "$ROLE_DIR/tests" -p 'test_*.py' -v; then
    EXIT_CODE=1
fi

if [ -n "${ROLEBOX_ROOT:-}" ]; then
    if ! bun test --isolate "$ROLE_DIR/tests/graph-contract.test.js"; then
        EXIT_CODE=1
    fi
else
    echo "Runtime contracts NOT RUN: set ROLEBOX_ROOT to the rolebox checkout."
fi

echo "Tier 3 and paid Tier 4 are separate, explicit checks."
echo "Native benchmark: python3 scripts/run_eval.py <roleDir> --suite <suite> --action validate"

if [ $EXIT_CODE -eq 0 ]; then
    echo "All executed offline checks PASSED."
else
    echo "Some offline checks FAILED."
fi
exit $EXIT_CODE
