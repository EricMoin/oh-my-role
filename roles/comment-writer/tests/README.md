# comment-writer — behavioral fixtures

Inputs live in `fixtures/`; the output the skills produce lives in `actual/`.
Each fixture pairs an input file with `expected.md`, which states what the output must contain.

## Layout

| Fixture | Input | Assertion |
|---|---|---|
| `obvious-cn` | `input.py` | zero comments survive |
| `obvious-en` | `input.ts` | zero comments survive |
| `why-mixed` | `input.py` | exactly the four required comments, no others |
| `api-doc` | `input.ts` | doc comment on the exported function only; the getter stays undocumented |

The fixtures are test inputs and expectations, not skill examples.

## How to run

### 1. Reasoning pass

Run by the agent, not by a script. For each fixture:

1. Load `comment-style` first; for `api-doc`, load `doc-comments` too.
2. Apply the four-step gate (recover, delete, name it, write exactly that) to every candidate comment.
3. Write the result to `actual/<fixture>/<same input filename>`.

`why-mixed` also exercises restraint: the four decisions earn a comment, everything else stays bare.

### 2. Mechanical checks

Comment lines in the obvious fixtures:

```bash
grep -REn '^[[:space:]]*#' roles/comment-writer/tests/actual/obvious-cn/input.py
grep -REn '^[[:space:]]*//|^[[:space:]]*/\*' roles/comment-writer/tests/actual/obvious-en/input.ts
```

Both print nothing.

Blacklist over the produced output:

```bash
grep -REn 'leverage|utilize|robust|seamless|comprehensive|facilitate|ensure|simply|basically|note that|it is worth mentioning|as you can see|this is important because|you might want to|I noticed|众所周知|简而言之|值得注意的是|显而易见|综上所述|赋能|助力|一站式|强大的|优雅的|全面(地)?(校验|验证)' roles/comment-writer/tests/actual/
```

Prints nothing.

Exactly four comments in `why-mixed`:

```bash
grep -cE '^[[:space:]]*#' roles/comment-writer/tests/actual/why-mixed/input.py
```

Prints `4`.

Doc comment placement in `api-doc`:

```bash
grep -n '\*\*' roles/comment-writer/tests/actual/api-doc/input.ts
```

Prints one match: the opener of the block above `createSession`. `getSessionId` has none.

### 3. Role validation

```bash
python3 scripts/validate.py
```

## What is mechanical and what needs judgment

Mechanical: the comment-line greps, the blacklist grep, the `why-mixed` count, the `api-doc` placement count, and `scripts/validate.py`.

Judgment: whether a comment earns its place (the gate), whether the four `why-mixed` comments and the `api-doc` contract are accurate and complete, and whether the `api-doc` getter is correctly left bare.
