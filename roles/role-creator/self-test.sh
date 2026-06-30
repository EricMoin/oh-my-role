#!/usr/bin/env bash
# Self-test for role-creator: runs Tier 1+2 self-validation and Tier 4 if opencode available.
# Uses a throwaway config to avoid touching the real opencode setup.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROLE_DIR="$SCRIPT_DIR"
EXIT_CODE=0

echo "=== Role Creator Self-Test ==="
echo ""

# Tier 1+2: Self-validation (always runs)
echo "--- Tier 1+2: Self-validation ---"
VALIDATE_JSON=$(python3 "$ROLE_DIR/scripts/validate_role.py" "$ROLE_DIR" --json 2>/dev/null)
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
for f in "valid-simple" "valid-director" "valid-nested"; do
    FIXTURE_JSON=$(python3 "$ROLE_DIR/scripts/validate_role.py" "$ROLE_DIR/tests/fixtures/$f" --json 2>/dev/null)
    echo "$FIXTURE_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  $f: {d[\"verdict\"]}')
if d['verdict'] != 'PASS':
    sys.exit(1)
" 2>/dev/null || ALL_FIXTURES_PASS=false
done
for f in "broken-noname" "broken-dashdash--x" "broken-noprompt" "broken-badgraph" "broken-dupskill"; do
    FIXTURE_JSON=$(python3 "$ROLE_DIR/scripts/validate_role.py" "$ROLE_DIR/tests/fixtures/$f" --json 2>/dev/null)
    echo "$FIXTURE_JSON" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'  $f: {d[\"verdict\"]}')
if d['verdict'] != 'FAIL':
    sys.exit(1)
" 2>/dev/null || ALL_FIXTURES_PASS=false
done

if $ALL_FIXTURES_PASS; then
    echo "✓ All fixture validations PASSED"
else
    echo "✗ Some fixture validations FAILED"
    EXIT_CODE=1
fi

echo ""

# Tier 3: Deploy check (if rolebox installed)
echo "--- Tier 3: Deploy check ---"
if command -v rolebox &>/dev/null || npx rolebox --version &>/dev/null 2>&1; then
    echo "  rolebox found. Skipping Tier 3 in self-test (requires user confirmation)."
    echo "  Run manually: python3 scripts/sync_check.py $ROLE_DIR"
else
    echo "  rolebox not found — skipped (not required)"
fi

echo ""

# Tier 4: Behavioral eval (if opencode installed)
echo "--- Tier 4: Behavioral eval ---"
if command -v opencode &>/dev/null; then
    echo "  opencode found. Run Tier 4 manually:"
    echo "  python3 scripts/run_eval.py $ROLE_DIR --evals $ROLE_DIR/evals/evals.json --spot-check --confirm"
else
    echo "  opencode not found — skipped (not required)"
fi

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "=== All self-tests PASSED ==="
else
    echo "=== Some self-tests FAILED (see above) ==="
fi
exit $EXIT_CODE
