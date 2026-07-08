---
name: independent-verification
description: Independent verification discipline for the validator — run tests, builds, and linters to confirm execution claims
---

# Independent Verification

The validator does not trust execution reports blindly. It independently verifies claims by running the project's own verification tools.

## When to Verify Independently

ALWAYS verify independently when the acceptance criteria mention:
- Tests passing → run the test suite yourself
- Build succeeding → run the build yourself
- Linting clean → run the linter yourself
- lsp_diagnostics clean → run lsp_diagnostics on changed files

## Detecting Test Commands

Read the project's config file to determine the correct test command:

| Config File | Test Command |
|------------|-------------|
| `package.json` (scripts.test) | `npm test` or `yarn test` or `pnpm test` |
| `go.mod` | `go test ./...` |
| `Cargo.toml` | `cargo test` |
| `pyproject.toml` / `setup.py` / `pytest.ini` | `pytest` or `python -m pytest` |
| `pom.xml` | `mvn test` |
| `build.gradle` / `build.gradle.kts` | `./gradlew test` |
| `Makefile` (test target) | `make test` |

If no config file is found, check for common test directories and infer the command.

## Detecting Build Commands

| Config File | Build Command |
|------------|-------------|
| `package.json` (scripts.build) | `npm run build` |
| `go.mod` | `go build ./...` |
| `Cargo.toml` | `cargo build` |
| `Makefile` | `make` |
| `pom.xml` | `mvn compile` |
| `build.gradle` | `./gradlew build` |

## Handling Divergence

When your independent verification result differs from the execution report's claim:

| Report says | Your result | Verdict |
|------------|------------|---------|
| Tests pass | Tests pass | `pass` — confirmed independently |
| Tests pass | Tests fail | `revise` — note the failing tests and their output |
| Build succeeds | Build succeeds | `pass` — confirmed independently |
| Build succeeds | Build fails | `revise` — note the build error |
| Lint clean | Lint clean | `pass` — confirmed independently |
| Lint clean | Lint errors | `revise` — note the lint errors |

Your independent result always wins. The execution report is a claim; your verification is evidence.

## Scope of Independent Verification

- Run tests, builds, and linters — YES
- Read files, grep for patterns — YES
- Modify files — NO (no Write/Edit)
- Dispatch to other agents — NO
- Run arbitrary commands unrelated to verification — NO

Keep verification focused on the acceptance criteria. Do not run the entire CI pipeline — run the specific checks the acceptance criteria reference.

## Time Management

If a test suite is very large, run only the tests relevant to the changed files:
- `go test ./internal/middleware/...` instead of `go test ./...`
- `npm test -- path/to/test` instead of `npm test`
- `pytest tests/test_specific.py` instead of `pytest`

Focus on the verification that directly maps to the acceptance criteria.
