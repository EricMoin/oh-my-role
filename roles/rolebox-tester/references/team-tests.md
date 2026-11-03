# Team module — tests 225–234

Executable body for the catalog module **`team`** (10 ids, `225–234`) of the
rolebox-tester 7.0.0 suite. The catalog entry in `test-catalog.md` is authoritative
for the id set, the executor lane and the host gate; this document supplies the
procedure, expected receipts, refusal texts, evidence and cleanup for each body.

- **Executor**: the declaring `rolebox-tester` primary only. Team bodies are never
  dispatched to a graph worker: a worker's whole graph face is
  `graph_submit_outcome`, and the host additionally refuses team tools in worker
  sessions (`Graph workers cannot use team tools`).
- **Host gate**: DSH only. `team_*` is registered only when the host exposes the
  resumable agent registry and agent loop, durable session persistence and flush,
  the tool execution guard, and role system-prompt contributions
  (`src/entries/dsh.ts`, `teamWired`). opencode 1.x/2.x, Pi and Codex do not run
  durable team sessions (`docs/team-work.md`); there the module is a SKIP, never a
  FAIL. Absence of the family is a capability fact, not a defect.
- **Cost policy**: tests 225–233 are creator-only and cost-free. Exactly one
  model-cost **peer turn** is permitted in the whole run, and it belongs to test
  234. A creator-only body may create teams, add and remove un-woken members,
  publish `wake:false` events and drive task state; it must never send a wake event
  addressed to a managed member.
- **State**: tests create their own team(s) and close them with `team_delete` in a
  `finally`-style cleanup, including after an assertion failure. `team_delete` keeps
  durable history; never delete `.rolebox/team` files or the scratch store by hand.
- **Write safety**: team state is written to
  `<session workspace>/.rolebox/team/<team-id>/team.sqlite`. Never run these bodies
  with the workspace pointing at the read-only rolebox checkout (or any read-only
  tree): creating a team would write into it.

Evidence sources for this body (read-only rolebox 2.2.0 checkout):
`src/team/tools.ts` (schemas, receipts), `src/team/runtime.ts` (bounds, wake,
delivery, budget, resume), `src/team/store.ts` (refusals roll back; `nextSeq` and
the event list stay unchanged), `src/entries/dsh.ts` (registration gate and caller
checks), `docs/team-work.md` (limits, persistence, host support).

## Contents

| Test | Name | Needs a second top-level role | Peer turn | Cleanup |
|---|---|---|---|---|
| 225 | Team discovery lists top-level roles only | no (it records one) | no | none |
| 226 | `team_create` receipt and `max_turns` bounds | no | no | `team_delete` every team created |
| 227 | `team_status` list, single read, filters, boundary | no | no | `team_delete` |
| 228 | `team_send_event` receipt, privacy, `wake:false` | optional for the no-wake proof | no | `team_delete` |
| 229 | Sender/recipient rejection leaves no event | no | no | `team_delete` |
| 230 | Task offer, claim, complete and state refusals | optional (never woken) | no | `team_delete` |
| 231 | `team_add` / `team_remove` membership boundary | yes | no | `team_delete` |
| 232 | `team_delete` closes the team, history survives | no | no | already closed |
| 233 | `team_resume` after a remove-pause keeps the budget | yes | no | `team_delete` |
| 234 | `max_turns` accounting and the membership boundary | yes (real peer) | **one** | `team_delete` |

## Host gate and module probe

Run once before test 225:

1. Resolve the host's native command tool (`bash` on DSH/opencode/Pi; a host may use
   `shell`/`exec`) and record its real name. Resolve `working_directory` (DSH); if it
   is absent, resolve the host's working-directory mechanism from
   `host-capability-matrix.md` § Tool-name resolution.
2. Call `team_list_roles` with `{}`.
   - A JSON array means the family is registered and the module can run.
   - If the tool is not in the session's tool set, the host has no team family:
     every id 225–234 is **SKIP** with `capability_reason: capability_absent:team`
     and evidence naming the host and the missing tools. On a non-DSH host record
     that team execution is DSH-only in rolebox 2.2.0; do not FAIL.
   - `Team runtime is still initializing`: retry once after a short wait. If it
     persists, **FAIL** with that text in `error_detail` (a registered family
     contradicting its readiness contract is a defect, not an absent capability).
   - `Team tools require a known DSH session`, `Team tools require an active
     top-level role; select one for this session, or configure rolebox.activeRole
     for headless hosts`, or `Team tools require a session workspace`: the family is
     registered but this session cannot host a team. If the dispatch can select the
     tester primary and an absolute workspace, fix the setup and rerun; otherwise
     **SKIP** the module with
     `capability_reason: session_not_team_eligible` and the exact refusal as
     evidence.
   - `Graph workers cannot use team tools`: the module was dispatched to a worker,
     which the suite forbids. **SKIP** with
     `capability_reason: wrong_executor:worker`; do not retry from the worker.
3. Record the gate evidence once in the module row; individual bodies reference it
   instead of repeating the probe.

### Scratch workspace (required when the host can change it)

Team state is per physical workspace. A second DSH host that also watches this
workspace runs its own `TeamRuntime`, sees the peer session's process-local role
binding only on the host that created it, records `member_failed` and pauses the
team for both hosts (workspace memory `060b3307`). Therefore:

1. Read the current workspace with `working_directory` and keep it as
   `originalDirectory`.
2. Create a fresh scratch directory outside every repository, e.g.
   `mktemp -d /tmp/rolebox-team-suite-<RUN>-XXXXXX` with the native command tool.
3. Switch with `working_directory {"cd": "<scratch>"}` and confirm with `pwd` that
   the session workspace is the scratch path. All team tools now resolve their store
   under `<scratch>/.rolebox/team/`.
4. At module cleanup switch back with `working_directory {"cd":
   originalDirectory}` and record the scratch path. The scratch store is durable
   evidence: close every team with `team_delete`, then leave the directory in place
   unless the user explicitly asks to remove it.
5. If the host has no working-directory control, run the module only when the
   workspace is single-host (record `shared_workspace: single-host-confirmed` from
   the user or the host facts). If a second DSH host may watch the workspace, the
   whole module is **SKIP** with
   `capability_reason: shared_workspace_hazard`; creating a team there would race the
   other host's reconciler and produce a false member failure.

Never run the team bodies in the read-only rolebox checkout.

## Shared state and evidence rules

Keep these values for the whole module run:

- `RUN` — the run id used by the v7 report artifact.
- `second_top_level_role` — boolean recorded by test 225; gates 231, 233 and 234.
- `peerRoleId` — the first role id returned by `team_list_roles` that is not the
  caller's own top-level id, when `second_top_level_role` is true.
- `callerRoleId`, `callerSessionId` — confirmed from test 226's receipt
  (`ownerRoleId`, `ownerSessionId`); `callerMemberId` is the creator member id from
  the same receipt.
- `createdTeams` — every team id created in the run, so cleanup can close teams even
  if a body aborts midway.
- `originalDirectory`, `scratchDirectory` — from the scratch-workspace section.

Rules:

- Use synthetic markers only: `TEAM_<RUN>_<test>_<purpose>`. Never put secrets,
  user data, private child role ids, credentials or another session's transcript
  into a team name, goal, event content or task result. Team events are readable by
  every member by design.
- The raw tool result is the evidence. Record the exact call (argument values,
  including opaque ids) and the exact returned JSON or refusal text. Do not
  summarize a refusal into a paraphrase when the substring matters.
- "State unchanged" means the single-team read is identical before and after the
  refused call: same `nextSeq`, `events` (ids, seq and content), `tasks`, `turns`,
  `status` and member records. A refused `team_send_event`/`team_add`/`team_remove`
  rolls back its transaction (`src/team/store.ts`), so no partial event survives.
- Wait with the native command tool (`sleep 5`, `sleep 30`), not with a tight
  status loop. A bounded wait always names its deadline and the last observed state.
- Per-test record fields follow the report vocabulary in
  `host-capability-matrix.md` § Report vocabulary: `id`, `name`, `status`
  (`PASS`/`FAIL`/`SKIP`), `evidence`, `error_detail`, `duration_ms`,
  `executor: primary`, and `capability_reason` (SKIP only).
- A test that starts and then cannot observe its required effect is `FAIL` with the
  expected and observed contract in `error_detail`; it is not an implicit SKIP. A
  missing capability identified before the first required effect is `SKIP` with a
  machine-readable reason.

### Tool face and receipts

| Tool | Arguments | Return |
|---|---|---|
| `team_list_roles` | none | JSON array of `{id, name, description}` for resolved top-level roles only; also callable before a role is selected |
| `team_create` | `name` 1–200, `goal` 1–16000, `max_turns` 1–100 optional (default 40) | receipt `{id, name, status, ownerSessionId, ownerRoleId, createdAt, maxTurns, turns, members:[{id, roleId, sessionId, status}]}`; the goal is **not** echoed |
| `team_add` | `team_id`, `role_id` | member JSON `{id, roleId, status, cursor, managed}`; no session is created and no turn starts |
| `team_send_event` | `team_id`, `kind`, `content` 1–16000, `task_id`?, `recipient`?, `wake`? | receipt `{id, seq, type, sender, recipient?, taskId?, at, wake}`; content is **not** echoed |
| `team_status` | `team_id`?, `after_seq`?, `include_deleted`? | list rows `{id, name, status, turns, maxTurns}`; one team: the full state plus `budgetExhausted` and `events` filtered to `seq > after_seq` |
| `team_remove` | `team_id`, `member_id` | plain text: `Member removed; team remains paused. Use team_resume to continue.` |
| `team_delete` | `team_id` | plain text: `Team closed` |
| `team_resume` | `team_id` | `Team resumed` or `Team resumed with unresolved members: <role>: <error>; ...` |

A managed member's session id appears only after its first delivery; before that the
member record has `status: "active"` and no `sessionId`. `turns` counts delivery
reservations, not chat messages: the creator's ordinary turns are not team turns.

---

### Test 225: Team discovery lists top-level roles and records the peer capability

**Executor**: primary. **Peer role**: not required. **Cost**: one read.

Steps:

1. Call `team_list_roles` with no arguments and keep the raw JSON.
2. Parse it as an array. For every entry assert: an object with exactly the keys
   `id`, `name`, `description`; `id` a non-empty string; `name` a non-empty string;
   `description` a string (an empty description is allowed only when the role
   declares none — record the fact, do not invent one).
3. Assert `id` values are unique.
4. Assert no returned id contains `--`, the private-child separator
   (`src/loader/role-loader.ts` rejects top-level ids containing `--`). Assert none
   of the private child ids from the fixture roster appears:
   `rolebox-tester--echo`, `rolebox-tester--sleeper`,
   `rolebox-tester--processor`, `rolebox-tester--checker`,
   `rolebox-tester--restricted`, `rolebox-tester--validator`,
   `rolebox-tester--nester`, `rolebox-tester--nester--grandchild`,
   `rolebox-tester--outcome-worker`, `rolebox-tester--runner-statemachine`,
   `rolebox-tester--runner-loop`. Also assert the skill/function names
   (`test-skill`, `test-all`, …) do not appear as role ids.
5. Identify the caller's top-level entry: the entry whose id is the installed tester
   role id (`rolebox-tester` in the standard install), or, when the install is
   namespaced, the single entry whose `name` matches the active role's display name.
   If no entry can be attributed to the caller with certainty, record the candidates
   and confirm the id in test 226 from `ownerRoleId` — do not fabricate an id. A
   result that omits the caller's own top-level role is a FAIL.
6. Independently cross-check the list against the host's rendered role catalog. DSH
   renders an `Available public agents` block (id-first bullets) from the same
   top-level roles (`src/prompt/builder.ts`); when that block is present in the
   system prompt, assert set equality with the tool result. When no such block is
   rendered, record `completeness: observational` in the summary — the tool result is
   then the only enumeration the test can observe.
7. Set `second_top_level_role` = true when the array contains any entry whose id is
   not the caller's top-level id; otherwise false. When true, set `peerRoleId` to
   the first such id and record why it was chosen (the choice is consumed by 231,
   233 and 234; a role with a model is preferable, but the model check belongs to
   `team_add`).
8. Do not create a team in this test.

Pass criteria:

- The tool returns a JSON array and the steps above hold.
- The caller's top-level role is present and no private child id is listed.
- `second_top_level_role` and, when true, `peerRoleId` are recorded for later tests.

Evidence: the raw array; the child ids checked; the prompt-catalog cross-check (or
`completeness: observational`); the recorded boolean and peer candidate.

SKIP conditions: none inside this body — absence of the family is the module-level
SKIP above. A host with exactly one top-level role passes 225 normally and SKIPs
231, 233 and 234 later.

Cleanup: none, and no team was created.

### Test 226: `team_create` receipt fields, goal privacy and `max_turns` bounds

**Executor**: primary. **Cost**: no peer turn; teams only.

Use a unique goal marker `TEAM_<RUN>_226_GOAL` followed by about 1500 characters of
synthetic text (well under the 16000 limit) and a unique name
`TEAM_<RUN>_226_MAIN`.

Steps:

1. Call `team_create(name="TEAM_<RUN>_226_MAIN", goal="TEAM_<RUN>_226_GOAL …", max_turns=5)`.
2. Assert the receipt has exactly the keys `id`, `name`, `status`,
   `ownerSessionId`, `ownerRoleId`, `createdAt`, `maxTurns`, `turns`, `members`.
   Assert `status == "active"`, `maxTurns == 5`, `turns == 0`, `createdAt` a number,
   `id` and the session ids non-empty strings. Assert `members` has one entry with
   exactly the keys `id`, `roleId`, `sessionId`, `status`; it is `active`, its
   `roleId` equals `ownerRoleId`, and its `sessionId` equals `ownerSessionId`.
3. Assert the raw receipt text does not contain `TEAM_<RUN>_226_GOAL` and is
   shorter than 1000 characters (goal not echoed). Record that the goal is still
   durable team state — `team_status` must show it (that readback belongs to 227).
4. Record `callerRoleId = ownerRoleId`, `callerSessionId = ownerSessionId`,
   `callerMemberId = members[0].id`. This is the canonical source for all later
   bodies.
5. Default: create `TEAM_<RUN>_226_DEFAULT` with `max_turns` omitted; assert
   `maxTurns == 40`.
6. Inclusive bounds: create with `max_turns=1` and `max_turns=100`; assert each
   receipt echoes the value. Both teams are deleted in cleanup.
7. Refusals, each followed by a `team_status()` list count that must be unchanged
   (no partial team was created or leaked):
   - `max_turns=0` → refused.
   - `max_turns=101` → refused.
   - `goal=""` → refused.
   - `goal` of only whitespace → refused (`Invalid team name or goal` from the
     runtime check).
   - `name` of 201 characters → refused.
   - `name` of only spaces → refused (`Invalid team name or goal`).
   A host argument-validation error naming the field is a valid documented
   rejection; the runtime's own text (`max_turns must be between 1 and 100`,
   `Invalid team name or goal`) is equally valid. Record the observed text.
8. Also assert a name of exactly 200 characters is accepted (create and delete it),
   proving the upper bound is inclusive.

Pass criteria:

- Receipt shape and values match; the goal marker is absent from the receipt.
- Default 40, bounds 1 and 100 accepted, 0/101 and the empty/oversize/blank
  name-and-goal cases refused with no team created.

Evidence: the main receipt (already id/name only; no goal), the boundary receipts,
the refusal texts, and the before/after list counts.

Cleanup: `team_delete` every team created in this test (main, default, 1, 100,
name-200), including on failure. Record the response of each delete.

### Test 227: `team_status` list, one-team read, filters and the membership boundary

**Executor**: primary. **Cost**: reads and one deleted team.

Steps:

1. Create `TEAM_<RUN>_227_MAIN` with a short goal, then send one `message` with
   `wake:false` and content `TEAM_<RUN>_227_EVENT` (this test only needs an event;
   the no-wake proof belongs to 228).
2. List: call `team_status()` with no arguments. Assert a JSON array whose rows have
   exactly the keys `id`, `name`, `status`, `turns`, `maxTurns`; the caller's team
   is present with `status: "active"`, `turns: 0`, `maxTurns` matching the receipt.
   Assert no row exposes `goal`, `members`, `events`, `tasks` or event content.
3. Single read: call `team_status(team_id=<team>)`. Assert:
   - identity and budget fields: `id`, `name`, `goal` (the stored goal text, not the
     creation receipt), `ownerSessionId`, `ownerRoleId`, `platformId` (record it;
     `dsh` is expected on the supported host), `status: "active"`, `createdAt`,
     `nextSeq`, `maxTurns`, `turns`, `version: 1`, `budgetExhausted: false`;
   - `members`: the creator is `active`, `managed: false`, with a `sessionId`, and
     the roster shape is readable;
   - `events`: an array ordered by increasing `seq`, starting with `team_created`
     (seq 1) and containing the test message with its full `content`, `sender`,
     `at`, `wake: false`;
   - `tasks`: an array (empty in this test).
4. `after_seq`: let `last` be the final event's `seq`. Assert
   `team_status(team_id=<team>, after_seq=last)` returns `events: []`; assert
   `after_seq=last-1` returns exactly the last event; assert every returned event
   has `seq > after_seq`. Assert reads do not change `nextSeq`.
5. `include_deleted`: create `TEAM_<RUN>_227_CLOSED`, call `team_delete` on it, and
   assert `team_status()` hides it while `team_status(include_deleted=true)` lists
   it with `status: "deleted"`. Reading it by `team_id` must still work (full state,
   `status: "deleted"`), because a closed team remains inspectable.
6. Membership boundary: call `team_status(team_id=<random UUID>)` and assert the
   refusal `Team was not found`. A *foreign* team id (a team owned by another
   session) is not discoverable from this session by design: when the dispatch or
   user supplies one explicitly, call `team_status` with it and assert the refusal
   `This session and role are not an active member of this team`; when no such id is
   supplied, SKIP that sub-check with
   `capability_reason: foreign_team_unavailable` and record that ids are never
   enumerated or guessed.
7. Assert both refusal attempts left the caller's team state unchanged.

Pass criteria:

- The list row fields, the full read, `after_seq` filtering and `include_deleted`
  behave as above; the foreign/nonexistent boundary is refused; the done team is
  readable by id.

Evidence: the list rows, the key single read (goal and event content included), the
filtered event arrays, the `include_deleted` lists, and the refusal texts.

Cleanup: `team_delete` the main team; the closed team is already deleted.

### Test 228: `team_send_event` receipt shape, content privacy and `wake:false`

**Executor**: primary. **Cost**: creator-only. The optional peer is added but never
woken.

Steps:

1. Create `TEAM_<RUN>_228`. If `second_top_level_role` is true, call
   `team_add(team_id, peerRoleId)` and keep the returned member id; this member is
   only a delivery target that must stay asleep.
2. Send `team_send_event(team_id, kind="message", content="TEAM_<RUN>_228_CONTENT …",
   wake:false)` with no `recipient` and no `task_id`.
3. Receipt: assert the parsed object has exactly the keys `id`, `seq`, `type`,
   `sender`, `at`, `wake` (JSON omits the absent `recipient`/`taskId`); `type` is
   `message`, `sender` is the creator member id, `wake` is false, `at` is a number,
   and `seq` is greater than the previous event's seq (equivalently
   `status.nextSeq - 1`). Assert the raw receipt text does not contain the content
   marker and is shorter than 1000 characters (content not echoed).
4. Readback: `team_status(team_id, after_seq=seq-1)` returns exactly one event with
   the full content, the same `id`, `seq`, `sender`, `at`, `type` and
   `wake: false`; `team_status(team_id, after_seq=seq)` returns `events: []`.
   Record that only the single-team read exposes content; the list does not.
5. `wake:false` proof: record `turns` and the roster before the send. After the send,
   wait about 5 seconds with `sleep` (not a status loop), then read the team:
   - with a peer member: `turns` is still 0, no member has a `delivery`, the peer
     still has no `sessionId`, and no `turn_completed` event exists — `wake:false`
     registered the event without starting a turn, so no model cost was spent;
   - without a peer: the same assertions hold for the creator, and the wake field is
     verified from the receipt/readback only. SKIP the "peer stayed asleep"
     sub-check with `capability_reason: peer_role_absent`.
6. Assert the event's `seq` remains greater than the peer member's `cursor`
   (when a peer exists): it is available to the next delivery but was not delivered
   now. Do not send a wake event to prove the opposite in this body; the positive
   recipient delivery is test 234's bounded peer turn.

Pass criteria:

- Receipt shape and privacy match; `after_seq` readback matches; `wake:false` starts
  no turn and costs no model call; the stored event is pending, not delivered.

Evidence: the receipt text, the readback events, the pre/post `turns` and member
records, and the name of the peer role if one was added.

Cleanup: `team_delete` the team (this also cancels any accidental delivery).

### Test 229: Sender/recipient rejection appends no event

**Executor**: primary. **Cost**: creator-only.

Steps:

1. Create `TEAM_<RUN>_229`; take the creator member id and `ownerRoleId` from the
   receipt; snapshot the full single-team read as `before`.
2. Attempt `team_send_event(team_id, kind="message", content="TEAM_<RUN>_229_SELF",
   recipient=<creator member id>)`. Assert the call is refused with the text
   `Event recipient is the sender; omit recipient to wake every other member, or
   name the peer that should receive this event`. Then assert the single-team read
   equals `before` exactly (no event, same `nextSeq`).
3. Repeat with `recipient=<ownerRoleId>` (a role id resolves to the same member) and
   assert the same refusal and unchanged state. This proves the check runs after
   recipient resolution, not only on raw member ids.
4. Repeat with `recipient="TEAM_<RUN>_229_MISSING"` and assert the refusal
   `Recipient is not an active team member`, again with unchanged state.
5. After the three refusals, assert the event count and `nextSeq` are exactly the
   pre-attempt values and that no `message` event with the test markers exists.
6. Record the exact refusal text for each attempt. A host that prefixes errors (for
   example `Error: `) is fine: the assertion is that the documented reason is a
   substring and the call fails.

Pass criteria:

- Self-recipient by member id and by role id, and an unknown recipient, are all
  refused with the documented reasons and append nothing.

Evidence: the three refusal texts and the identical before/after state
(`nextSeq`, events, tasks, turns, status).

Cleanup: `team_delete`.

### Test 230: Task offer, claim, complete and release/complete state refusals

**Executor**: primary. **Cost**: creator-only; the optional peer is never woken.

Steps:

1. Create `TEAM_<RUN>_230`. Optionally `team_add` the peer role for roster realism;
   it must never be woken in this body.
2. Offer: `team_send_event(team_id, kind="task_offer",
   task_id="TEAM_<RUN>_230_T1", content="TEAM_<RUN>_230_OFFER", wake:false)`.
   Assert the receipt has `type: "task_offer"`, echoes `taskId`, `wake: false`, and
   omits `recipient`; assert no delivery and `turns` still 0. Read the team:
   `tasks` contains `{id, description: <offer content>, status: "offered"}` with no
   owner and no lease.
3. Claim: `team_send_event(team_id, kind="task_claim", task_id=…,
   content="TEAM_<RUN>_230_CLAIM", wake:true)`. Assert the receipt is
   `type: "task_claim"` with `wake: false` even though `wake:true` was requested (a
   claim never wakes), and the task is `{status: "claimed", owner: <creator member
   id>, leaseUntil: <epoch ms>}`. Assert the lease is about 30 minutes ahead
   (record the delta; tolerate clock granularity) and that `turns` is unchanged.
4. Complete: `team_send_event(team_id, kind="task_complete", task_id=…,
   content="TEAM_<RUN>_230_RESULT")`. Assert the receipt is `type: "task_complete"`
   with the effective `wake` recorded, and the task is `{status: "completed",
   result: "TEAM_<RUN>_230_RESULT"}`. Read back `tasks` and the `task_complete`
   event content; the result is stored.
5. Offer a second task `T2` with `wake:false`, then exercise the refusals, checking
   after each **refused** call that the team state (tasks, events, nextSeq, turns,
   status) is unchanged from immediately before that call. The one successful
   `task_release` below is expected to mutate the task and the stream.
   - `task_complete` on an offered (unclaimed) task → `Task is not claimed`.
   - `task_release` on an offered task → `Task is not claimed`.
   - claim `T2`, then `task_release` → succeeds: `T2` returns to `offered`, owner and
     lease are removed; then `task_complete` → `Task is not claimed`.
   - re-claim `T2`, complete it; then `task_release` → `Task is already completed`;
     a second `task_complete` → `Task is already completed`.
   - `task_claim` with an unknown task id → `Unknown task ID`.
   - a second `task_offer` with the existing `T1` id → `Task ID already exists`.
6. Cross-member ownership: the refusal
   `Only the current task owner can complete or release it` requires a second active
   member to hold the claim; a managed member can act only after a delivery, and the
   only permitted peer turn is 234's. SKIP this sub-check in the creator-only run
   with `capability_reason: peer_turn_reserved_for_234`, record the exact expected
   text, and do not create a peer turn to obtain it. (Test 234's peer is instructed
   to stay within its own task, so it does not replace this assertion.)

Pass criteria:

- Offer/claim/complete produce the documented receipts and durable task state; the
  state-based release/complete refusals are refused with no mutation.

Evidence: the offer/claim/complete receipts and task snapshots, each refusal text
with its before/after state equality, and the recorded SKIP for the cross-member
branch.

Cleanup: `team_delete`.

### Test 231: `team_add` adds without a turn; `team_remove` pauses and bounds membership

**Executor**: primary. **Peer role**: required. **Cost**: no peer turn — the added
member is never woken.

Precondition: `second_top_level_role` is true; otherwise the whole test is **SKIP**
with `capability_reason: peer_role_absent` and evidence from test 225.

Steps:

1. Create `TEAM_<RUN>_231`; record `turns: 0`, one active member.
2. `team_add(team_id, peerRoleId)`. Assert the returned member has keys
   `id`, `roleId`, `status`, `cursor`, `managed`; `roleId == peerRoleId`,
   `status == "active"`, `managed: true`, `cursor: 0`, and **no `sessionId`** (the
   session is created only by a delivery). If the call is refused with
   `Role "<peerRoleId>" has no usable provider/model; set model in its role.yaml or
   configure a host default model.`, the peer is not runnable: **SKIP** the test with
   `capability_reason: peer_model_unavailable` and record the refusal.
3. No-turn proof: wait about 3 seconds with `sleep`, then read the team. Assert
   `turns` is still 0, the new member still has no `sessionId` and no `delivery`, no
   `turn_completed` exists, and the only new event is `member_joined` with
   `wake: false` (membership is recorded only). `team_add` itself never starts a
   turn.
4. Duplicate: `team_add` with the same `peerRoleId` again → `Role is already a team
   member`; assert the member count and state are unchanged. Also assert
   `team_add` with the caller's own top-level role id is refused with the same text
   (the creator is already a member).
5. Child-role boundary: `team_add` with `rolebox-tester--echo` and with
   `rolebox-tester--nester--grandchild` → `Unknown top-level role. Use
   team_list_roles; private subroles cannot join a team`; assert no member was
   added. (When the installed top-level id is not `rolebox-tester`, build the child
   ids from the caller's top-level id with the `--` separator.) This is the
   membership form of the private-child boundary asserted in 225.
6. Creator cannot be removed: `team_remove(team_id, <creator member id>)` →
   `Only a managed member can be removed; use team_delete for the creator`; assert
   the team state (status, members, turns) is unchanged.
7. Remove the peer: `team_remove(team_id, <peer member id>)`. Assert the response is
   `Member removed; team remains paused. Use team_resume to continue.`; read the
   team: `status: "paused"`, the peer member is `status: "removed"`, `member_left`
   is appended, the team has no delivery, and `turns` is unchanged.
8. Claim release: a removed member's unfinished claims are re-offered with a
   `task_release` event. In this cost-free body the peer never ran, so it holds no
   claim: SKIP the release assertion with
   `capability_reason: peer_turn_reserved_for_234` and record the exact contract
   (task set to `offered`, owner/lease deleted, `task_release` appended with
   `wake: true`). Do not wake the peer to manufacture a claim.
9. `team_resume` → assert the response starts with `Team resumed`; read the team:
   back to `active`, the creator is active, the removed peer stays `removed`, a
   `team_resumed` event is appended, and `turns` is unchanged (still 0).

Pass criteria:

- `team_add` records an un-woken, session-less member without spending a turn;
  duplicate and child ids are refused; the creator cannot be removed; removing the
  peer pauses the team and resume restores the active team; the claim-release branch
  is recorded as a SKIP with its reason.

Evidence: the add receipt, the before/after team reads, every refusal text, the
remove response, the paused and resumed statuses, and the recorded SKIP.

Cleanup: `team_delete` (whether or not the assertions passed). Durable history stays
in the scratch store.

### Test 232: `team_delete` closes the team; history is readable; further work is refused

**Executor**: primary. **Cost**: creator-only.

Steps:

1. Create `TEAM_<RUN>_232`; send a `wake:false` message and a `wake:false`
   `task_offer` so the team has event and task history; record `nextSeq` and the
   event count.
2. `team_delete(team_id)` → assert the response is exactly `Team closed`. Read the
   team by id: `status: "deleted"`, the goal, members, tasks and prior events are
   still present, and a `team_deleted` event is appended.
3. List: `team_status()` with no arguments does not contain the team;
   `team_status(include_deleted=true)` contains it with `status: "deleted"`.
4. Reading by id still works after closure (`team_status(team_id)`), including the
   event stream — a closed team is inspectable by design.
5. Further work refusals, each leaving `nextSeq` and the event list unchanged:
   - `team_send_event(team_id, kind="message", content="…")` → `Team is deleted`.
   - `team_add(team_id, <caller role id>)` → `Team is deleted` (the team-state check
     precedes the duplicate check).
   - `team_remove(team_id, <creator member id>)` → `Team is deleted`.
   - `team_resume(team_id)` → `Only a paused team can resume` (a deleted team is not
     paused).
   - `team_delete(team_id)` again → `Team closed` without error (idempotent; no
     second `team_deleted` event).
6. Assert the durable history remains: do not delete the store directory.

Pass criteria:

- Delete closes the team, hides it from the default list, keeps it readable, and all
  further work is refused with no state mutation; a repeated delete is a no-op.

Evidence: the delete response, the deleted-state read, both lists, the refusal texts
and the unchanged `nextSeq`/events.

Cleanup: none beyond the close itself.

### Test 233: `team_resume` after a remove-pause restores members and keeps the budget

**Executor**: primary. **Peer role**: required. **Cost**: no peer turn.

Precondition: `second_top_level_role` is true and `peerRoleId` runs (the `team_add`
model check passed in 231 or is repeated here); otherwise **SKIP** with
`capability_reason: peer_role_absent` or `peer_model_unavailable`.

Steps:

1. Create `TEAM_<RUN>_233`; `team_add` the peer; `team_remove` the peer. Record the
   paused state and `turns` (0 in a cost-free run). If a second top-level role is
   available in addition to `peerRoleId`, add it before the removal and keep it
   active across the resume, so "restores members" is observable on a non-creator
   member.
2. `team_resume(team_id)` → the response starts with `Team resumed` (or lists
   unresolved members; a non-empty unresolved list is a FAIL unless the exact error
   is recorded and explained). Read the team:
   - `status: "active"`;
   - the creator is `active`; any remaining peer is `active`; the removed member
     stays `removed` (removal is not undone by resume);
   - a `team_resumed` event is appended; no member carries an `error`;
   - `turns` is **identical** to the pre-removal value and `budgetExhausted` is
     unchanged. Resume does not replenish or reset the completed-turn budget
     (`src/team/runtime.ts` refuses resume with `Team turn budget exhausted; create
     a new team` once `turns >= maxTurns`).
3. Because this creator-only run spends no turn, the observed preservation is
   `0 == 0`: assert it, and record the nonzero branch as a SKIP with
   `capability_reason: no_completed_peer_turn`. The nonzero branch needs a team whose
   budget is already spent; only test 234 may spend the one permitted peer turn, and
   it asserts the exhausted-budget resume refusal with the exact text above on its
   own team. Do not spend a peer turn here to re-create that condition.
4. While active, `team_resume` again → `Only a paused team can resume`; assert no
   state change.

Pass criteria:

- A remove-pause is recoverable with resume; active members are restored, the
  removed member stays removed, and the turn counter is preserved (asserted at 0 in
  this run, with the nonzero branch recorded as a SKIP).

Evidence: the paused read, the resume response, the active roster, the `turns`
before/after values, and the recorded SKIP.

Cleanup: `team_delete`.

### Test 234: `max_turns` accounting and the non-creator membership boundary (one peer turn)

**Executor**: primary. **Peer role**: required and model-capable. **Cost**: exactly
one model-cost peer delivery turn. This is the only body in the module allowed to
wake a managed member.

Preconditions:

- `second_top_level_role` is true; otherwise **SKIP** with
  `capability_reason: peer_role_absent`.
- `team_add` accepts the chosen role. If it is refused with
  `Role "<id>" has no usable provider/model; set model in its role.yaml or configure
  a host default model.`, **SKIP** with
  `capability_reason: peer_model_unavailable` and record the refusal.

Procedure:

1. Create `TEAM_<RUN>_234` with a short goal and **`max_turns=1`**. Assert the
   receipt echoes `maxTurns: 1`, `turns: 0`.
2. `team_add(team_id, peerRoleId)`; capture the peer member id. Read the team and
   assert `turns: 0`, `maxTurns: 1`, `budgetExhausted: false`, and the peer has no
   `sessionId`.
3. Offer the single bounded turn: `team_send_event(team_id, kind="task_offer",
   task_id="TEAM_<RUN>_234_T1", recipient=<peer member id>, content=<protocol
   below>)`. The default `wake: true` plus `recipient=<peer>` wakes exactly that
   member. Record the offer receipt (`taskId`, `recipient` = the peer member id,
   `wake: true`).

   Peer protocol (substitute the actual ids; one string, synthetic content only):

   ```text
   ROLEBOX TEST 234 — bounded peer protocol. RUN=TEAM_<RUN>_234.
   Team: <TEAM_ID>. Your member id: <PEER_MEMBER_ID>. Your task id: <TASK_ID>.
   Perform exactly these steps, then end your turn. Do not retry a refused call;
   do not create a team; do not call team_resume; do not touch any other team.
   1. Claim this task: team_send_event(team_id="<TEAM_ID>", kind="task_claim",
      task_id="<TASK_ID>", content="TEAM_<RUN>_234_PEER_CLAIM").
   2. Attempt team_add(team_id="<TEAM_ID>", role_id="<CALLER_ROLE_ID>") and record
      the exact refusal text verbatim as ADD_REFUSAL.
   3. Attempt team_delete(team_id="<TEAM_ID>") and record the exact refusal text
      verbatim as DELETE_REFUSAL.
   4. Publish one event: team_send_event(team_id="<TEAM_ID>", kind="message",
      content="TEAM_<RUN>_234_REPORT ADD_REFUSAL=<ADD_REFUSAL> DELETE_REFUSAL=<DELETE_REFUSAL>").
   5. Complete the task: team_send_event(team_id="<TEAM_ID>", kind="task_complete",
      task_id="<TASK_ID>", content="TEAM_<RUN>_234_PEER_DONE").
   Your final assistant text is private; only the published event reaches the team.
   ```

   `CALLER_ROLE_ID` is the tester's own top-level role id: it is a valid role for
   `assertRole`, and the non-creator `ownerOf` check refuses before the duplicate
   check, so the expected refusal is the creator-only one.
4. Bounded wait for the one turn. With the native command tool, `sleep 20` and read
   `team_status(team_id)`; repeat at most 45 times (about 15 minutes, the host's
   member turn limit). Stop when either a `turn_completed` event with the peer as
   sender exists and the peer has no `delivery`, or a `member_failed` event /
   paused status appears. Record only the start and final samples plus the elapsed
   time. If the deadline passes with the peer still `delivery`-held, **FAIL**:
   record `peer turn exceeded the bounded wait` with the last state; cleanup still
   runs.
5. Accounting assertions after the turn:
   - `turns == 1`, `maxTurns == 1`, `status == "active"` (a completed turn, not a
     failure), `budgetExhausted == true` (`turns >= maxTurns`).
   - exactly one `turn_completed` event for the peer and exactly one consumed
     delivery: `turns` increased exactly once (`0 → 1`); record `peerTurns = 1`.
   - the peer's session id is now bound; the peer's cursor equals the offer's
     `seq` (its delivery's `throughSeq`), so the offer is consumed and every later
     event is still pending; no `member_failed` and no `member_silent` for this
     peer (a `member_silent` means the peer never published its report and counts
     as non-compliance for the boundary sub-check below).
6. Grade the non-creator membership boundary **only from the peer's report**:
   locate the `message` event from the peer whose content starts with
   `TEAM_<RUN>_234_REPORT` (and, when present, the `task_complete` content).
   - PASS the boundary sub-check when both reported refusal texts contain
     `Only the team creator can change membership or lifecycle` (the
     `ownerOf` refusal for a non-creator `team_add` and `team_delete`).
   - If the peer published no report, or its report is unparseable, or it reported a
     different refusal: SKIP the sub-check with
     `capability_reason: peer_did_not_report` and record the peer's exact text. Do
     not infer the boundary from the host's implementation, and do not send another
     wake to re-ask (that would spend a second turn).
   - If the peer reports that either `team_add` or `team_delete` **succeeded**
     (no refusal), that is a real contract violation: **FAIL** with the reported
     text; a non-creator changed membership/lifecycle.
7. Prove the second wake is not delivered: `team_send_event(team_id,
   kind="message", recipient=<peer member id>,
   content="TEAM_<RUN>_234_SECOND_WAKE")` with the default wake. Poll
   `team_status(team_id)` at 2–5 second intervals for up to 60 seconds until the
   team pauses. Assert:
   - `status == "paused"` and the peer's `error` is `Team turn budget exhausted`
     (the runtime pauses an over-budget delivery instead of starting it);
   - `turns` is still 1 and `budgetExhausted` is still true;
   - no member holds a `delivery`; the second-wake event's `seq` is greater than the
     peer's `cursor` (queued but never delivered);
   - the count of `turn_completed` events is unchanged and no new assistant work
     appeared: after a further 30-second quiet interval with `sleep`, re-read and
     assert the same counts. Record the total peer turns as exactly one.
   - `team_resume(team_id)` → refused with
     `Team turn budget exhausted; create a new team`; assert the refusal did not
     reset `turns` (still 1) or resume the team. This is the nonzero-budget
     preservation evidence referenced by test 233.
8. Cleanup in the same creator turn so the peer's report is not delivered as a new
   turn after the test ends: `team_delete(team_id)` → `Team closed`; read by id and
   assert `status: "deleted"`. Leave the scratch store as durable history and
   restore `originalDirectory` if it was changed.

Pass criteria:

- One peer turn is spent for `max_turns=1`; `turns` and `budgetExhausted` match; the
  second wake is queued but not delivered and the team pauses with
  `Team turn budget exhausted`; resume is refused without resetting the budget.
- The membership-boundary sub-check passes only when the peer reports the
  creator-only refusal; otherwise it is an explicit SKIP (or a FAIL on a reported
  success), never an inferred result.

Evidence: the create/add/offer receipts, the peer's report text (quoted), the
`turns`/`maxTurns`/`budgetExhausted` samples, the delivery and cursor values, the
`turn_completed` count, the pause reason, the resume refusal, and the delete
response. Never record the peer's private final transcript; the published event is
the only peer text that belongs in evidence.

## Module result and cleanup

- After the last body, `team_status(include_deleted=true)` must show every team
  created by the module with `status: "deleted"`; a team left active or paused is an
  incomplete cleanup and a module-level FAIL with its id.
- `createdTeams` must be closed with `team_delete` exactly once each; a repeated
  delete is harmless. Never remove `.rolebox/team` or the scratch directory as part
  of cleanup (durable history remains) unless the user explicitly asks and the
  directory is outside every repository.
- Restore the original working directory if the scratch workspace was used, and
  record both paths.
- Module row aggregation: the row keeps the catalog `host_gate` ("DSH only: team_*
  tools registered, a second top-level role installed for peer tests, creator-only
  tests stay cost-free") and reports the per-test rows. A module whose family is
  absent is skipped with the stable reason; its tests do not count as denominator
  failures. Any `FAIL` keeps its exact observed versus expected contract in
  `error_detail`.
- The suite must never attribute a team test result to a fixture or to a
  graph-dispatched runner: every row's `executor` is `primary`.
