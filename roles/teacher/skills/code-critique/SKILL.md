---
name: code-critique
description: Code critique methodology — bug/antipattern/readability/language-feature upgrade classification with 🔴🟡🔵 severity system and per-finding reporting format
---
# Code Critique

## Severity Level Definitions

### 🔴 Bug / Will Break

The code is incorrect in a way that will cause runtime failures, data corruption, security vulnerabilities, or undefined behavior under realistic conditions.

| Pattern | Example | Risk |
|---------|---------|------|
| Unchecked unwrap/assert | `unwrap()` on `Err` from I/O | Panic at runtime |
| SQL injection | F-string interpolation into SQL | Data breach, data loss |
| Race condition | Shared mutable state without sync | Non-deterministic crashes |
| Resource leak | File/socket never closed | FD exhaustion, connection pool drain |
| Off-by-one | `for i in range(len(arr)):` starting at wrong index | Wrong result or panic |
| No input validation | User input passed to `eval()` or shell | Code injection |
| Privacy leak | `Any` or overly permissive error type exposing internals | Secret exposure |
| Type confusion | `any`/`Object` cast without guard | Runtime type error |

### 🟡 Anti-pattern / Risk

The code works but is fragile, performant only by accident, or likely to cause issues when requirements change.

| Pattern | Example | Risk |
|---------|---------|------|
| Mutable default arg | `def f(x=[])` in Python | Shared mutable state across calls |
| Deep `if-elif` chains | 5+ branches with complex conditions | Hard to maintain, easy to miss case |
| Ignoring return values | `os.system("cmd")` without checking exit | Silent failure |
| Swallowing exceptions | `try: ... except: pass` | Silently masks errors |
| Overly broad exception | `except Exception:` catching SystemExit | Kills signals |
| Magic numbers | `if x > 86400:` instead of `if x > DAY_IN_SECONDS` | Unreadable |
| Unnecessary allocation | Building list when generator/iterator would do | Memory waste |
| Dead code | `if False:` blocks, unused variables | Maintenance burden |

### 🔵 Better Style / Language-Feature Upgrade

The code is correct and reasonably readable, but a more idiomatic or modern language feature would improve it.

| Pattern | Example | Improvement |
|---------|---------|-------------|
| Modern alternatives | Classic `for` vs iterator chains | Readability, less state |
| Type hints missing | Python/TS function without type annotations | Self-documenting, tooling support |
| Pattern matching | Nested `if-elif` vs `match`/`switch` | Exhaustiveness check, clarity |
| Destructuring | Manual field access vs destructuring assignment | Conciseness |
| Builder pattern | Long constructor with positional args vs builder | Extensibility, readability |
| Expression-oriented | Statements that could be expressions | Functional style, less mutability |

## Reporting Format

```markdown
🔴 line 23: `unwrap()` on Result from file I/O — will panic on permission errors.
    Use `?` to propagate or handle specific error cases.

🔴 line 45: User input interpolated into SQL — SQL injection vulnerability.
    Use parameterized queries: `cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))`

🟡 line 12: Mutable default argument `def add(x, items=[])` — the list is shared across calls.
    Use `None` as sentinel: `def add(x, items=None)`

🟡 line 34: Broad `except:` catches KeyboardInterrupt and SystemExit.
    Use `except Exception:` for most runtime errors.

🔵 line 56: Classic for-loop could be replaced with list comprehension for conciseness.
    `result = [transform(x) for x in items if condition(x)]`
```

## Priority Order Within Severity

Order findings by impact within each severity level:

1. **Security vulnerabilities** (injection, auth bypass, data leak) first
2. **Correctness bugs** (wrong result, panic, data corruption) next
3. **Resource issues** (leaks, performance, memory) after
4. **Style/readability** last
