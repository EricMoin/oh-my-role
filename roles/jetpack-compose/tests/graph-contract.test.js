// Run: ROLEBOX_ROOT=/path/to/rolebox bun test --isolate roles/jetpack-compose/tests/graph-contract.test.js
// The real rolebox loader, the real v3 declaration front end, the real graph v3 toolset
// and the real host drive the real role files on disk. The review declaration is read out
// of references/graph-protocol.md, so the documented contract and the tested contract are
// the same object. The only stand-in is the dispatch seam, which records the requests the
// engine hands it: no model runs, no worker executes and nothing is published. afterEach
// deletes every temp dir, which is where each declared graph's persisted plan lives, so no
// declared graph outlives its test.
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, cpSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.env.ROLEBOX_ROOT) {
  throw new Error(
    "Set ROLEBOX_ROOT to the rolebox checkout to validate, for example " +
      "ROLEBOX_ROOT=/path/to/rolebox bun test --isolate " +
      "roles/jetpack-compose/tests/graph-contract.test.js",
  );
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

const { createGraphToolSet } = await engine("src/graph/tools/graph-tools.ts");
const { parseGraphDeclarationV3 } = await engine(
  "src/graph/compiler/parse-declaration-v3.ts",
);
const { compileGraph } = await engine("src/graph/compiler/compile.ts");
const { discoverRoles } = await engine("src/loader/role-loader.ts");
const { resolveSkills } = await engine("src/resolver/skill-resolver.ts");
const { OutcomeHost } = await engine("src/graph/host/outcome-host.ts");
const { HostCredentialVault } = await engine(
  "src/graph/host/credential-vault.ts",
);
const { engineStateDir } = await engine("src/graph/persistence/paths.ts");
const { SqliteAcceptanceLedger } = await engine(
  "src/graph/ledger/sqlite-ledger.ts",
);

// The v3 surface this role is written against: one declaring session that owns
// graph_declare/control/status/audit, and read-only workers that only submit their
// declared outcome. None of the retired graph v2 entry points may reappear.
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
const V3_DECLARER_TOOLS = {
  graph_declare: true,
  graph_control: true,
  graph_status: true,
  graph_audit: true,
  graph_submit_outcome: false,
  graph_worker_exec: false,
  Write: true,
  Edit: true,
  Bash: true,
};
const V3_WORKER_TOOLS = {
  graph_declare: false,
  graph_control: false,
  graph_status: false,
  graph_audit: false,
  graph_submit_outcome: true,
  graph_worker_exec: true,
  Write: false,
  Edit: false,
  Bash: true,
};
const WORKER_ALLOW = [
  "Bash",
  "Glob",
  "Grep",
  "Read",
  "graph_submit_outcome",
  "graph_worker_exec",
];
const SOURCE_TRACER = "source-tracer";
const SUBAGENT_SLUGS = [
  "architecture-reviewer",
  "performance-reviewer",
  "source-tracer",
  "test-quality-reviewer",
  "ui-layout-reviewer",
];
// The shipped topology: five independent read-only roots and one join:all consumer.
const ROOT_NODES = [
  "performance",
  "source-behavior",
  "source-versions",
  "test-quality",
  "ui-layout",
];
const JOIN_NODE = "architecture";

const roleDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const protocolPath = join(roleDir, "references", "graph-protocol.md");

const tempDirs = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});
function tempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

/** The loader keeps each manifest's display name; its directory is the slug. */
const childSlug = (child) => child.name.toLowerCase().replaceAll(" ", "-");

// ── The canonical declaration, read from the shipped protocol reference ─────

/**
 * Documentation is the single source of truth: the tested declaration is exactly the
 * one fenced json block of references/graph-protocol.md, so the two cannot drift.
 */
function readShippedDeclaration() {
  const text = readFileSync(protocolPath, "utf8");
  const blocks = [...text.matchAll(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/g)];
  if (blocks.length !== 1) {
    throw new Error(
      `${protocolPath}: expected exactly one fenced json block, found ${blocks.length}`,
    );
  }
  let declaration;
  try {
    declaration = JSON.parse(blocks[0][1]);
  } catch (error) {
    throw new Error(
      `${protocolPath}: the fenced json block is not valid JSON: ` +
        (error instanceof Error ? error.message : String(error)),
    );
  }
  return {
    text,
    fenceCount: (text.match(/^```/gm) ?? []).length,
    declaration,
  };
}

const shipped = readShippedDeclaration();
const declaration = shipped.declaration;

// ── (a) Role loading through the real loader ────────────────────────────────

test("rolebox loads the lead, its five read-only specialist subagents and every declared skill", async () => {
  const directory = tempDir("compose-role-loader-");
  cpSync(roleDir, join(directory, "jetpack-compose"), { recursive: true });
  const role = (await discoverRoles(directory)).get("jetpack-compose");
  expect(role).toBeDefined();
  expect(role.mode).toBe("primary");

  // The retired v2 orchestration block is gone: under the outcome protocol the
  // declaring session holds the orchestration tools and workers only submit.
  expect(role.graph).toBeUndefined();
  expect(role.tools).toMatchObject(V3_DECLARER_TOOLS);
  for (const retired of RETIRED_V2_TOOLS) {
    expect(role.tools[retired]).toBeUndefined();
  }

  expect(role.subagents.map(childSlug).sort()).toEqual(SUBAGENT_SLUGS);
  for (const child of role.subagents) {
    const slug = childSlug(child);
    expect(child.tools).toMatchObject(V3_WORKER_TOOLS);
    for (const retired of RETIRED_V2_TOOLS) {
      expect(child.tools[retired]).toBeUndefined();
    }
    // Read-only reviewers: no Write and no Edit, and the dispatcher tools stay with
    // the declaring lead. Only the source tracer may fetch external sources.
    const allow = [...(child.permission?.allow ?? [])];
    const expected = slug === SOURCE_TRACER ? [...WORKER_ALLOW, "WebFetch"] : WORKER_ALLOW;
    expect(allow.sort()).toEqual([...expected].sort());
    expect(allow).not.toContain("Write");
    expect(allow).not.toContain("Edit");
    if (slug === SOURCE_TRACER) {
      expect(child.tools.WebFetch).toBe(true);
      expect(allow).toContain("WebFetch");
    }
  }

  // Every declared skill of the primary and of all five children resolves to a real
  // file, and every prompt is substantial.
  const subjects = [
    [role, join(directory, "jetpack-compose")],
    ...role.subagents.map((child) => [
      child,
      join(directory, "jetpack-compose", "subagents", childSlug(child)),
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
  const tools = createGraphToolSet({
    stateDir: tempDir("compose-graph-tools-"),
  });
  for (const name of V3_TOOLS) {
    expect(typeof tools[name]).toBe("function");
  }
  for (const retired of RETIRED_V2_TOOLS) {
    expect(tools[retired]).toBeUndefined();
  }
});

// ── (b) The shipped declaration against the real v3 front end ───────────────

test("the declaration shipped in references/graph-protocol.md compiles into an executable v3 plan", () => {
  // Exactly one fenced json block: one opener and one closer in the whole file.
  expect((shipped.text.match(/```json/g) ?? [])).toHaveLength(1);
  expect(shipped.fenceCount).toBe(2);

  const parsed = parseGraphDeclarationV3(declaration);
  if (!parsed.ok) {
    throw new Error(
      `references/graph-protocol.md is not a valid v3 declaration: ` +
        parsed.errors
          .map((issue) => `${issue.code} at ${issue.path} (${issue.message})`)
          .join("; "),
    );
  }
  const compiled = compileGraph(parsed.declaration, { supportedValidators: [] });
  if (!compiled.ok) {
    throw new Error(
      `references/graph-protocol.md failed to compile: ` +
        compiled.errors
          .map((issue) => `${issue.code} at ${issue.path} (${issue.message})`)
          .join("; "),
    );
  }
  expect(compiled.kind).toBe("executable");
  const plan = compiled.plan;

  expect(plan.declarationVersion).toBe(3);
  expect(plan.graphId).toBe(declaration.name);
  expect([...plan.nodes.map((node) => node.id)].sort()).toEqual(
    [...declaration.nodes.map((node) => node.id)].sort(),
  );

  // Every edge binds an outcome its source node really declares.
  for (const edge of plan.edges) {
    const source = plan.nodes.find((node) => node.id === edge.from);
    expect(source).toBeDefined();
    expect(source.outcomes.map((outcome) => outcome.id)).toContain(edge.outcome);
  }
  // Every declared input names a declared outcome of a declared producer.
  for (const node of declaration.nodes) {
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

  // Every node agent is a real subagent of this role, named <role>--<slug>.
  for (const node of declaration.nodes) {
    expect(node.agent).toMatch(/^jetpack-compose--[a-z0-9-]+$/);
    const slug = node.agent.slice("jetpack-compose--".length);
    expect(SUBAGENT_SLUGS).toContain(slug);
    expect(existsSync(join(roleDir, "subagents", slug, "role.yaml"))).toBe(true);
  }
});

// ── (c) The real declare/dispatch/settle path, in process ───────────────────

const NOW = 1_700_000_000_000;

/**
 * One declared graph over one temp workspace: the real toolset persists the real
 * shipped plan, the dispatch seam records every attempt the engine arms, and the real
 * host credential vault stores the credentials those attempts carry.
 */
function declareGraph() {
  const dir = tempDir("compose-graph-");
  const requests = [];
  const tools = createGraphToolSet({
    stateDir: dir,
    outcomeNow: NOW,
    outcomeDispatch: (request) => {
      requests.push(request);
    },
    credentialIsolation: HostCredentialVault.open({
      root: engineStateDir(dir),
      id: "jetpack-compose-contract:credential-vault",
    }).capability(),
  });
  const declared = tools.graph_declare({
    declaration: structuredClone(declaration),
  });
  return { dir, requests, tools, declared, graphId: declared.graph_id };
}

/**
 * Give the declared graph its first execution through the host's own boot sweep, the
 * same OutcomeHost.recoverDeclaredGraphs a shipped host calls. The host is closed
 * afterwards; the credentials it minted stay in the vault the toolset reads.
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
        requests
          .map((request) => `${request.nodeId}@${request.attemptId}`)
          .join(", ") +
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

/** The gate report contract of references/schemas.md, as schema_version 1 data. */
const REPORT_STATUS = {
  report: "pass",
  pass: "pass",
  revise: "fail",
  escalate: "needs-user-input",
};
function gateReport(gate, outcomeId, extra = {}) {
  return {
    schema_version: 1,
    outcome_id: outcomeId,
    gate,
    status: REPORT_STATUS[outcomeId] ?? "pass",
    reviewed_snapshot: "compose-sample@abc1234 + uncommitted working tree",
    evidence: [`${gate}: inspected the reviewed snapshot read-only`],
    blocking_issues: [],
    required_revisions: [],
    advisory_notes: [],
    verification: ["read-only inspection of the reviewed snapshot"],
    engineering_state_patch: {},
    ...extra,
  };
}

/** graph_status with the documented json shape the lead reads accepted results from. */
function statusJson(tools, graphId) {
  const raw = tools.graph_status({
    graph_id: graphId,
    scope: "all",
    format: "json",
    include_output: true,
    include_history: true,
  });
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `graph_status format json returned no JSON document: ${raw.slice(0, 200)} ` +
        `(${error instanceof Error ? error.message : String(error)})`,
    );
  }
}

/** The run phase, wherever the status document nests it. */
function phaseOf(status) {
  const seen = new Set();
  const walk = (value) => {
    if (value === null || typeof value !== "object" || seen.has(value)) {
      return undefined;
    }
    seen.add(value);
    if (typeof value.phase === "string") return value.phase;
    for (const entry of Object.values(value)) {
      const found = walk(entry);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  const phase = walk(status);
  if (phase === undefined) {
    throw new Error(
      `graph_status json reports no phase: ${JSON.stringify(status).slice(0, 200)}`,
    );
  }
  return phase;
}

test("an accepted submission commits the result, an identical replay is idempotent and a refusal writes nothing", async () => {
  const graph = declareGraph();
  await start(graph);

  // One start arms exactly the five independent read-only roots, never the join.
  expect(nodeIds(graph.requests).sort()).toEqual([...ROOT_NODES].sort());
  expect(nodeIds(graph.requests)).not.toContain(JOIN_NODE);
  expect(new Set(attemptIds(graph.requests)).size).toBe(ROOT_NODES.length);

  const ledger = await openLedger(graph.dir);
  try {
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([]);

    const behavior = armed(graph.requests, "source-behavior");
    const submitted = gateReport("source-tracing", "report");
    const accepted = await settle(graph, "source-behavior", "report", {
      data: submitted,
    });
    expect(accepted.decision).toBe("accepted");
    expect(accepted.verdict).toBe("committed");
    expect(accepted.plan_revision).toBe(graph.declared.plan_revision);
    expect(accepted.attempt_id).toBe(behavior.attemptId);
    expect(accepted.refusals).toEqual([]);
    // settled_nodes carries the run's cumulative settled set in no guaranteed
    // order, not just the node of this submission: compare it order-independently.
    expect([...accepted.settled_nodes].sort()).toEqual(["source-behavior"]);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([
      behavior.attemptId,
    ]);

    // The identical submission is idempotent: replayed, not a second acceptance.
    const replay = await settle(graph, "source-behavior", "report", {
      data: submitted,
    });
    expect(replay.decision).toBe("accepted");
    expect(replay.verdict).toBe("replayed");
    expect(replay.refusals).toEqual([]);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([
      behavior.attemptId,
    ]);

    const dispatched = attemptIds(graph.requests);

    // A forged credential is refused before any decision: nothing is written and no
    // successor is armed.
    const forged = await graph.tools.graph_submit_outcome({
      graph_id: graph.graphId,
      node_id: "ui-layout",
      outcome_id: "pass",
      credential: "not-the-credential-this-attempt-was-issued",
      data: gateReport("ui-layout", "pass"),
    });
    expect(forged.decision).toBeUndefined();
    expect(forged.refusals.length).toBeGreaterThan(0);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([
      behavior.attemptId,
    ]);
    expect(attemptIds(graph.requests)).toEqual(dispatched);

    // An outcome the node never declared is refused the same way.
    const undeclared = await settle(graph, "ui-layout", "report");
    expect(undeclared.decision).toBeUndefined();
    expect(undeclared.refusals.length).toBeGreaterThan(0);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([
      behavior.attemptId,
    ]);
    expect(attemptIds(graph.requests)).toEqual(dispatched);
  } finally {
    ledger.close();
  }
});

test("the join:all architecture consumer is armed only after both declared inputs settle", async () => {
  const graph = declareGraph();
  await start(graph);
  expect(nodeIds(graph.requests).sort()).toEqual([...ROOT_NODES].sort());
  expect(nodeIds(graph.requests)).not.toContain(JOIN_NODE);

  const behaviorAttempt = armed(graph.requests, "source-behavior").attemptId;
  const versionsAttempt = armed(graph.requests, "source-versions").attemptId;

  // The other review roots are independent and settle in any order.
  const layout = await settle(graph, "ui-layout", "pass", {
    data: gateReport("ui-layout", "pass"),
  });
  expect(layout.decision).toBe("accepted");
  const behavior = await settle(graph, "source-behavior", "report", {
    data: gateReport("source-tracing", "report"),
  });
  expect(behavior.decision).toBe("accepted");
  // ONE declared input settled: the consumer still has an unfilled input.
  expect(nodeIds(graph.requests)).not.toContain(JOIN_NODE);

  const versions = await settle(graph, "source-versions", "report", {
    data: gateReport("source-tracing", "report"),
  });
  expect(versions.decision).toBe("accepted");
  // The second declared input settles and the join releases the consumer.
  expect(nodeIds(graph.requests)).toContain(JOIN_NODE);

  const consumer = armed(graph.requests, JOIN_NODE);
  expect(
    (consumer.inputs ?? [])
      .map((input) => `${input.from}:${input.outcome}`)
      .sort(),
  ).toEqual(["source-behavior:report", "source-versions:report"]);
  // Each delivered input is bound to the attempt that produced it.
  for (const input of consumer.inputs ?? []) {
    const producer =
      input.from === "source-behavior" ? behaviorAttempt : versionsAttempt;
    expect(JSON.stringify(input)).toContain(producer);
  }

  const architecture = await settle(graph, JOIN_NODE, "pass", {
    data: gateReport("architecture", "pass"),
  });
  expect(architecture.decision).toBe("accepted");
  const quality = await settle(graph, "test-quality", "pass", {
    data: gateReport("test-quality", "pass"),
  });
  expect(quality.decision).toBe("accepted");
  const performance = await settle(graph, "performance", "pass", {
    data: gateReport("performance", "pass"),
  });
  expect(performance.decision).toBe("accepted");
  expect(performance.phase).toBe("complete");
});

test("a settled graph is not acceptance: a revise gate report stays readable on a complete run", async () => {
  const graph = declareGraph();
  await start(graph);

  const blocking =
    "FeedScreen keys its LazyColumn items by list index, so item state is reused after reordering";
  const report = gateReport("architecture", "revise", {
    blocking_issues: [
      {
        id: "ARCH-1",
        issue: blocking,
        evidence: "app/src/main/java/com/example/FeedScreen.kt:88",
      },
    ],
    required_revisions: ["key the list by a stable item id"],
  });

  const sourceRoots = ["source-behavior", "source-versions"];
  for (const node of sourceRoots) {
    const settled = await settle(graph, node, "report", {
      data: gateReport("source-tracing", "report"),
    });
    expect(settled.decision).toBe("accepted");
  }
  const reviewerRoots = ["ui-layout", "test-quality"];
  for (const node of reviewerRoots) {
    const settled = await settle(graph, node, "pass", {
      data: gateReport(node, "pass"),
    });
    expect(settled.decision).toBe("accepted");
  }

  const revise = await settle(graph, JOIN_NODE, "revise", { data: report });
  expect(revise.decision).toBe("accepted");
  expect(revise.verdict).toBe("committed");
  expect(revise.refusals).toEqual([]);
  // settled_nodes is the run's cumulative settled set at this point, in no
  // guaranteed order: the revise submission adds the consumer to the four roots
  // already settled above.
  expect([...revise.settled_nodes].sort()).toEqual(
    [...sourceRoots, ...reviewerRoots, JOIN_NODE].sort(),
  );

  const performance = await settle(graph, "performance", "pass", {
    data: gateReport("performance", "pass"),
  });
  expect(performance.decision).toBe("accepted");

  // The run completes with a negative gate report on record: the accepted result is
  // still readable in graph_status, so graph phase is not business acceptance.
  const status = statusJson(graph.tools, graph.graphId);
  const document = JSON.stringify(status);
  expect(document).toContain(blocking);
  expect(document).toContain("blocking_issues");
  expect(document).toContain("ARCH-1");
  expect(document).toContain('"revise"');
  expect(phaseOf(status)).toBe("complete");
});
