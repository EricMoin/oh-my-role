// Run: ROLEBOX_ROOT=/path/to/rolebox bun test --isolate roles/typescript-engineer/tests/graph-contract.test.js
// The real rolebox loader, the real v3 declaration front end and the real graph v3
// toolset drive the real role files on disk. The only stand-in is the dispatch seam,
// which records the requests the engine hands it: no model runs, no worker executes
// and nothing is published.
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, cpSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.env.ROLEBOX_ROOT) {
  throw new Error("Set ROLEBOX_ROOT to the rolebox checkout to validate.");
}
const root = resolve(process.env.ROLEBOX_ROOT);

/** Load one real module from the rolebox checkout by absolute path. */
async function engine(path) {
  try {
    return await import(pathToFileURL(join(root, path)).href);
  } catch (error) {
    throw new Error(
      `graph-contract: cannot load ${path} from ROLEBOX_ROOT=${root}: ` +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

// The v3 surface this role is written against: one declaring session that owns
// graph_declare/control/status/audit, and workers that only submit their outcome.
const { createGraphToolSet } = await engine("src/graph/tools/graph-tools.ts");
const { parseGraphDeclarationV3 } = await engine("src/graph/compiler/parse-declaration-v3.ts");
const { compileGraph } = await engine("src/graph/compiler/compile.ts");
const { discoverRoles } = await engine("src/loader/role-loader.ts");
const { resolveSkills } = await engine("src/resolver/skill-resolver.ts");
const { OutcomeHost } = await engine("src/graph/host/outcome-host.ts");
const { HostCredentialVault } = await engine("src/graph/host/credential-vault.ts");
const { engineStateDir } = await engine("src/graph/persistence/paths.ts");
const { SqliteAcceptanceLedger } = await engine("src/graph/ledger/sqlite-ledger.ts");

const RETIRED_V2_TOOLS = [
  "graph_create",
  "graph_add_node",
  "graph_add_edge",
  "graph_add_loop",
  "graph_run",
  "graph_approve",
  "graph_cancel",
];
const V3_TOOLS = [
  "graph_declare",
  "graph_submit_outcome",
  "graph_control",
  "graph_status",
  "graph_audit",
];

const roleDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const patternsPath = join(
  roleDir,
  "skills/typescript-graph-workflow/references/graph-patterns.json",
);
const patterns = JSON.parse(readFileSync(patternsPath, "utf8"));

/** One pattern as a fresh mutable declaration, failing when it is not declared. */
function patternOf(name) {
  const found = patterns.find((item) => item.name === name);
  if (found === undefined) {
    throw new Error(
      `graph-patterns.json declares no pattern "${name}" (declared: ` +
        patterns.map((item) => item.name).join(", ") +
        ")",
    );
  }
  return structuredClone(found);
}

const tempDirs = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});
function tempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

// ── (a) Role loading through the real loader ────────────────────────────────

test("rolebox loads the role, its two subagents and every declared skill", async () => {
  const directory = tempDir("typescript-role-loader-");
  cpSync(roleDir, join(directory, "typescript-engineer"), { recursive: true });
  const role = (await discoverRoles(directory)).get("typescript-engineer");
  expect(role).toBeDefined();
  expect(role.mode).toBe("primary");

  // The retired v2 orchestration block is gone: under the outcome protocol the
  // declaring session holds the orchestrator tools and workers hold only submission.
  expect(role.graph).toBeUndefined();
  expect(role.tools).toMatchObject({
    graph_declare: true,
    graph_control: true,
    graph_status: true,
    graph_audit: true,
    graph_submit_outcome: false,
    graph_worker_exec: false,
  });
  for (const retired of RETIRED_V2_TOOLS) {
    expect(role.tools[retired]).toBeUndefined();
  }

  expect(role.subagents.map((child) => child.name).sort()).toEqual([
    "change-applier",
    "verification",
  ]);
  for (const child of role.subagents) {
    expect(child.tools).toMatchObject({
      graph_submit_outcome: true,
      graph_declare: false,
      graph_control: false,
      graph_status: false,
      graph_audit: false,
    });
    for (const retired of RETIRED_V2_TOOLS) {
      expect(child.tools[retired]).toBeUndefined();
    }
  }

  // Every declared skill of the primary and of both children resolves to a real
  // file, and both prompts are substantial.
  const roleRoot = join(directory, "typescript-engineer");
  const subjects = [
    [role, roleRoot],
    ...role.subagents.map((child) => [
      child,
      join(roleRoot, "subagents", child.name),
    ]),
  ];
  for (const [config, path] of subjects) {
    expect(config.prompt.length).toBeGreaterThan(50);
    expect(config.skills.length).toBeGreaterThan(0);
    const resolved = await resolveSkills(
      config.skills,
      path,
      join(directory, "absent-global-skills"),
    );
    expect(resolved.map((skill) => skill.name).sort()).toEqual(
      [...config.skills].sort(),
    );
  }
});

test("the shipped toolset exposes the v3 surface and no retired v2 entry point", () => {
  const tools = createGraphToolSet({ stateDir: tempDir("typescript-graph-tools-") });
  for (const name of V3_TOOLS) {
    expect(typeof tools[name]).toBe("function");
  }
  for (const retired of RETIRED_V2_TOOLS) {
    expect(tools[retired]).toBeUndefined();
  }
});

// ── (b) Every declared pattern against the real v3 front end ────────────────

/**
 * Parse and compile one pattern with the REAL front end, naming the exact failing
 * code and path. A pattern that cannot compile must fail the test loudly here
 * rather than surface later as an unrunnable declaration.
 */
function compilePattern(name) {
  const pattern = patternOf(name);
  const parsed = parseGraphDeclarationV3(pattern);
  if (!parsed.ok) {
    throw new Error(
      `graph-patterns.json "${name}" is not a valid v3 declaration: ` +
        parsed.errors
          .map((issue) => `${issue.code} at ${issue.path} (${issue.message})`)
          .join("; "),
    );
  }
  const compiled = compileGraph(parsed.declaration, { supportedValidators: [] });
  if (!compiled.ok) {
    throw new Error(
      `graph-patterns.json "${name}" failed to compile: ` +
        compiled.errors
          .map((issue) => `${issue.code} at ${issue.path} (${issue.message})`)
          .join("; "),
    );
  }
  if (compiled.kind !== "executable") {
    throw new Error(
      `graph-patterns.json "${name}" compiled to a non-executable ${compiled.kind} draft: ` +
        JSON.stringify({
          unresolved: compiled.unresolved,
          unauthorizedCompletions: compiled.unauthorizedCompletions,
        }),
    );
  }
  return { pattern, plan: compiled.plan };
}

const edgeKey = (edge) => `${edge.from}->${edge.to}:${edge.outcome}`;

for (const pattern of patterns) {
  test(`${pattern.name} compiles into an executable v3 plan`, () => {
    const { plan } = compilePattern(pattern.name);
    expect(plan.declarationVersion).toBe(3);
    expect(plan.graphId).toBe(pattern.name);
    expect(plan.executability.kind).toBe("executable");
    expect([...plan.nodes.map((node) => node.id)].sort()).toEqual(
      [...pattern.nodes.map((node) => node.id)].sort(),
    );
    expect(plan.edges.map(edgeKey).sort()).toEqual(
      pattern.edges.map(edgeKey).sort(),
    );

    // Every edge binds an outcome its source node really declares, and every
    // declared input names a declared outcome of a declared producer.
    for (const edge of plan.edges) {
      const source = plan.nodes.find((node) => node.id === edge.from);
      expect(source).toBeDefined();
      expect(source.outcomes.map((outcome) => outcome.id)).toContain(edge.outcome);
    }
    for (const node of pattern.nodes) {
      for (const input of node.inputs ?? []) {
        const producer = plan.nodes.find((entry) => entry.id === input.from);
        expect(producer).toBeDefined();
        expect(producer.outcomes.map((outcome) => outcome.id)).toContain(
          input.outcome,
        );
      }
    }

    // Terminal outcomes: the graph can actually finish.
    expect(plan.terminalOutcomes.length).toBeGreaterThan(0);

    // Loop groups: membership, hard cap and the declared continuation/exit routes.
    expect(plan.loopGroups.length).toBe((pattern.loop_groups ?? []).length);
    for (const group of pattern.loop_groups ?? []) {
      const compiled = plan.loopGroups.find((entry) => entry.id === group.id);
      expect(compiled).toBeDefined();
      expect([...compiled.nodes].sort()).toEqual([...group.nodes].sort());
      expect(compiled.maxTraversals).toBe(group.max_traversals);
      expect(compiled.continuationOutcome).toBe(group.continuation_outcome);
      expect(compiled.exitOutcome).toBe(group.exit_outcome);
      for (const outcome of [group.continuation_outcome, group.exit_outcome]) {
        const declaredByMember = group.nodes.some((id) =>
          plan.nodes
            .find((node) => node.id === id)
            ?.outcomes.some((entry) => entry.id === outcome),
        );
        expect(declaredByMember).toBe(true);
      }
    }
  });
}

test("the standard pattern's repair loop declares continuation and exit outcomes", () => {
  const { plan } = compilePattern("standard");
  const repair = plan.loopGroups.find((group) => group.id === "repair");
  expect(repair).toBeDefined();
  expect([...repair.nodes].sort()).toEqual(["change", "review"]);
  expect(repair.continuationOutcome).toBe("revise");
  expect(repair.exitOutcome).toBe("pass");
  expect(repair.maxTraversals).toBe(2);

  const review = plan.nodes.find((node) => node.id === "review");
  expect(review.outcomes.map((outcome) => outcome.id).sort()).toEqual([
    "pass",
    "revise",
  ]);
  expect(review.inputs.map((input) => `${input.from}:${input.outcome}`)).toEqual([
    "change:done",
  ]);
  // The repair loop can leave: pass is a terminal outcome, and revise routes back.
  expect(plan.terminalOutcomes.map((entry) => `${entry.nodeId}:${entry.outcome}`))
    .toContain("review:pass");
  expect(plan.edges.map(edgeKey).sort()).toEqual([
    "change->review:done",
    "review->change:revise",
  ]);
});

test("the expanded pattern's convergence node joins all of its declared inputs", () => {
  const { plan } = compilePattern("expanded");
  const review = plan.nodes.find((node) => node.id === "review");
  expect(review.join).toEqual({ strategy: "all" });
  expect(
    review.inputs.map((input) => `${input.from}:${input.outcome}`).sort(),
  ).toEqual(["consumer:report", "types:report"]);
  expect(plan.edges.map(edgeKey).sort()).toEqual([
    "change->consumer:done",
    "change->types:done",
    "consumer->review:report",
    "review->change:revise",
    "types->review:report",
  ]);
});

// ── (c) The real declare/dispatch/settle path, in process ───────────────────

const NOW = 1_700_000_000_000;

/**
 * One declared graph over one workspace: the real toolset persists a real plan,
 * the dispatch seam records every attempt the engine arms, and the real host
 * credential vault stores the credentials those attempts carry.
 */
function declarePattern(name) {
  const dir = tempDir(`typescript-graph-${name}-`);
  const requests = [];
  const tools = createGraphToolSet({
    stateDir: dir,
    outcomeNow: NOW,
    outcomeDispatch: (request) => {
      requests.push(request);
    },
    credentialIsolation: HostCredentialVault.open({
      root: engineStateDir(dir),
      id: "typescript-role-contract:credential-vault",
    }).capability(),
  });
  const declared = tools.graph_declare({ declaration: patternOf(name) });
  return { dir, requests, tools, declared, graphId: declared.graph_id };
}

/**
 * Give the declared graph its first execution through the host's own boot sweep —
 * the same `OutcomeHost.recoverDeclaredGraphs` a shipped host calls. The host is
 * closed afterwards; the credential it minted stays in the vault the toolset reads.
 */
async function start(graph) {
  const host = OutcomeHost.open({
    workspaceDir: graph.dir,
    storeRoot: engineStateDir(graph.dir),
    deliver: (request) => {
      graph.requests.push(request);
    },
    durability: "memory",
  });
  try {
    await host.recoverDeclaredGraphs();
  } finally {
    host.close();
  }
}

const attemptIds = (requests) => requests.map((request) => request.attemptId);
const nodeIds = (requests) => requests.map((request) => request.nodeId);

/** The request that armed one node, failing when the engine never armed it. */
function armed(requests, nodeId) {
  const found = requests.filter((request) => request.nodeId === nodeId);
  if (found.length === 0) {
    throw new Error(
      `fixture: node "${nodeId}" was never dispatched (dispatched: ` +
        requests.map((request) => `${request.nodeId}@${request.attemptId}`).join(", ") +
        ")",
    );
  }
  return found[found.length - 1];
}

/** Settle the latest attempt of one node through the real submission ingress. */
function settle(graph, nodeId, outcomeId, extra = {}) {
  const request = armed(graph.requests, nodeId);
  return graph.tools.graph_submit_outcome({
    graph_id: graph.graphId,
    node_id: nodeId,
    outcome_id: outcomeId,
    credential: request.credential,
    ...extra,
  });
}

async function openLedger(dir) {
  return SqliteAcceptanceLedger.create(engineStateDir(dir));
}

const acceptedAttempts = (ledger, graphId) =>
  ledger
    .acceptedEvents(graphId)
    .map((event) => event.attemptId)
    .sort();

test("an accepted submission commits the result and a refused one writes nothing", async () => {
  const graph = declarePattern("mechanical");
  await start(graph);
  expect(attemptIds(graph.requests)).toEqual(["change#1"]);

  const ledger = await openLedger(graph.dir);
  try {
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([]);

    const accepted = await settle(graph, "change", "done");
    expect(accepted.decision).toBe("accepted");
    expect(accepted.verdict).toBe("committed");
    expect(accepted.plan_revision).toBe(graph.declared.plan_revision);
    expect(accepted.attempt_id).toBe("change#1");
    expect(accepted.refusals).toEqual([]);
    expect(accepted.settled_nodes).toEqual(["change"]);
    // `done` is terminal for this one-node graph: the run completes.
    expect(accepted.phase).toBe("complete");
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual(["change#1"]);

    // Replaying the identical submission returns the committed receipt.
    const replay = await settle(graph, "change", "done");
    expect(replay.verdict).toBe("replayed");
    expect(replay.decision).toBe("accepted");
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual(["change#1"]);

    // A forged credential is refused before any decision: nothing is written and
    // no successor is armed.
    const forged = await graph.tools.graph_submit_outcome({
      graph_id: graph.graphId,
      node_id: "change",
      outcome_id: "done",
      credential: "not-the-credential-this-attempt-was-issued",
    });
    expect(forged.decision).toBeUndefined();
    expect(forged.refusals.length).toBeGreaterThan(0);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual(["change#1"]);
    expect(attemptIds(graph.requests)).toEqual(["change#1"]);

    // An outcome the node never declared is refused the same way.
    const undeclared = await settle(graph, "change", "shipped");
    expect(undeclared.decision).toBeUndefined();
    expect(undeclared.refusals.length).toBeGreaterThan(0);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual(["change#1"]);
  } finally {
    ledger.close();
  }
});

test("a join:all consumer waits for every declared input before it is armed", async () => {
  const graph = declarePattern("expanded");
  await start(graph);
  expect(attemptIds(graph.requests)).toEqual(["change#1"]);

  const change = await settle(graph, "change", "done");
  expect(change.decision).toBe("accepted");
  // Both arms of the fan-out are armed; the join:all consumer is not.
  expect(nodeIds(graph.requests).slice(1).sort()).toEqual(["consumer", "types"]);
  expect(nodeIds(graph.requests)).not.toContain("review");

  const typesReport = await settle(graph, "types", "report");
  expect(typesReport.decision).toBe("accepted");
  // ONE arm settled: the convergence node still has an unfilled declared input.
  expect(nodeIds(graph.requests)).not.toContain("review");

  const consumerReport = await settle(graph, "consumer", "report");
  expect(consumerReport.decision).toBe("accepted");
  expect(nodeIds(graph.requests)).toContain("review");

  // The consumer is armed with BOTH accepted upstream results, bound to the
  // attempts that produced them.
  const review = armed(graph.requests, "review");
  expect(
    (review.inputs ?? []).map((input) => `${input.from}:${input.outcome}`).sort(),
  ).toEqual(["consumer:report", "types:report"]);

  const passed = await settle(graph, "review", "pass");
  expect(passed.decision).toBe("accepted");
  expect(passed.phase).toBe("complete");
});

test("exhausting a loop group's traversal cap stops the run instead of passing", async () => {
  const graph = declarePattern("standard");
  await start(graph);
  expect(attemptIds(graph.requests)).toEqual(["change#1"]);

  // Two declared traversals of the repair loop: revise -> change, twice.
  expect((await settle(graph, "change", "done")).decision).toBe("accepted");
  expect(attemptIds(graph.requests)).toEqual(["change#1", "review#2"]);
  expect((await settle(graph, "review", "revise")).decision).toBe("accepted");
  expect(attemptIds(graph.requests)).toEqual([
    "change#1",
    "review#2",
    "change#3",
  ]);
  expect((await settle(graph, "change", "done")).decision).toBe("accepted");
  expect((await settle(graph, "review", "revise")).decision).toBe("accepted");
  expect(attemptIds(graph.requests)).toEqual([
    "change#1",
    "review#2",
    "change#3",
    "review#4",
    "change#5",
  ]);
  expect((await settle(graph, "change", "done")).decision).toBe("accepted");
  expect(attemptIds(graph.requests)).toEqual([
    "change#1",
    "review#2",
    "change#3",
    "review#4",
    "change#5",
    "review#6",
  ]);

  // The third continuation asks for a round the declared cap forbids. The outcome
  // is still a real accepted result — what the cap refuses is the continuation,
  // and the run stops instead of running a round past the limit.
  const overCap = await settle(graph, "review", "revise");
  expect(overCap.decision).toBe("accepted");
  expect(overCap.verdict).toBe("committed");
  expect(overCap.stop).toMatchObject({
    reason: "loop-exhausted",
    loop_group_id: "repair",
    node_id: "review",
    outcome_id: "revise",
    traversals: 2,
    max_traversals: 2,
  });
  expect(overCap.phase).toBe("stopped");
  expect(attemptIds(graph.requests)).toEqual([
    "change#1",
    "review#2",
    "change#3",
    "review#4",
    "change#5",
    "review#6",
  ]);

  // The run reports the stop, never a completed graph with a passing review.
  const status = graph.tools.graph_status({
    graph_id: graph.graphId,
    scope: "persisted",
  });
  expect(status).toContain("[phase: stopped]");
  expect(status).not.toContain("[phase: complete]");

  // A further submission cannot pass either: nothing new is accepted or armed.
  const afterStop = await settle(graph, "review", "pass");
  expect(afterStop.decision).toBeUndefined();
  expect(afterStop.refusals.length).toBeGreaterThan(0);
  expect(attemptIds(graph.requests)).toHaveLength(6);
});
