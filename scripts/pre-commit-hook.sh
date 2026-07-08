#!/bin/sh
# Pre-commit hook for oh-my-role registry validation.
#
# This script is checked into the repository for distribution.
# To install the hook locally, copy or symlink this file to .git/hooks/pre-commit:
#
#   cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
#   # or
#   ln -sf ../../scripts/pre-commit-hook.sh .git/hooks/pre-commit
#
# Then make sure it is executable:
#   chmod +x .git/hooks/pre-commit
#
# Runs validate.py to check YAML syntax, schema, model leak detection, and registry consistency.
# If validation fails, the commit is blocked.

echo "Running pre-commit validation..."

python3 scripts/validate.py
result=$?

if [ $result -ne 0 ]; then
    echo ""
    echo "============================================"
    echo "  ❌ PRE-COMMIT HOOK: Validation FAILED"
    echo "  Fix the errors above before committing."
    echo "============================================"
    exit 1
fi

echo "✅ Pre-commit validation passed."
exit 0
