// Run: ROLEBOX_ROOT=/path/to/rolebox node scripts/test-runtime-contracts.mjs roles/rust-engineer/tests/graph-contract.test.js
// The real rolebox loader, the real v3 declaration front end, the real graph v3 toolset
// and the real host drive the real role files on disk. The review declaration is read out
// of references/graph-protocol.md, so the documented contract and the tested contract are
// the same object. The only stand-in is the dispatch seam, which records the requests the
// engine hands it: no model runs, no worker executes and nothing is published. afterEach
// deletes every temp dir, which is where each declared graph's persisted plan lives, so no
// declared graph outlives its test.
import { test, expect, afterEach } from "vitest";
import { mkdtempSync, cpSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.env.ROLEBOX_ROOT) {
  throw new Error(
    "Set ROLEBOX_ROOT to the rolebox checkout to validate, for example " +
      "ROLEBOX_ROOT=/path/to/rolebox node scripts/test-runtime-contracts.mjs " +
      "roles/rust-engineer/tests/graph-contract.test.js",
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
const { resolveAllRoles } = await engine("src/resolver/orchestrator.ts");
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
];
const SUBAGENT_SLUGS = [
  "api-reviewer",
  "async-auditor",
  "cross-platform-checker",
  "perf-profiler",
  "safety-reviewer",
  "source-tracer",
];
// The independent catalog preserves the five gate identities.
const GATE_NODES = ["api", "async", "cross-platform", "performance", "safety"];
const GATE_AGENTS = {
  safety: "rust-engineer--safety-reviewer",
  async: "rust-engineer--async-auditor",
  api: "rust-engineer--api-reviewer",
  performance: "rust-engineer--perf-profiler",
  "cross-platform": "rust-engineer--cross-platform-checker",
};
// The canonical `gate` field value of each node, per references/rust-domains.md.
const GATE_NAMES = {
  safety: "safety",
  async: "async-audit",
  api: "api",
  performance: "perf",
  "cross-platform": "cross-platform",
};
const GATE_OUTCOMES = ["escalate", "pass", "revise"];
const DECLARED_CHILD_KEYS = [
  "agent",
  "budget",
  "completion",
  "id",
  "outcomes",
  "prompt",
];

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

function readShippedDeclarations() {
  const text = readFileSync(protocolPath, "utf8");
  const blocks = [...text.matchAll(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/g)];
  if (blocks.length !== 2) {
    throw new Error(
      `${protocolPath}: expected the gate catalog and evidence dependency examples, found ${blocks.length}`,
    );
  }
  return blocks.map((block) => JSON.parse(block[1]));
}

const declarations = readShippedDeclarations();
const declaration = declarations.find((item) => item.name === "rust-review-sample-r0");
const evidenceDeclaration = declarations.find(
  (item) => item.name === "rust-evidence-review-sample-r0",
);

// ── (a) Role loading through the real loader ────────────────────────────────

test("rolebox loads the lead, its six read-only specialist subagents and every declared skill", async () => {
  const directory = tempDir("rust-role-loader-");
  cpSync(roleDir, join(directory, "rust-engineer"), { recursive: true });
  const role = (await discoverRoles(directory)).get("rust-engineer");
  expect(role).toBeDefined();
  expect(role.mode).toBe("primary");
  const [resolved] = await resolveAllRoles(new Map([["rust-engineer", role]]), {
    roleboxDir: directory,
    globalSkillsDir: join(directory, "absent-global-skills"),
    configDir: join(directory, "absent-global-config"),
    builtinDir: join(root, "functions"),
    roleFunctionsMap: new Map(),
  });
  expect(resolved.subagents).toHaveLength(SUBAGENT_SLUGS.length);
  for (const child of resolved.subagents) {
    expect(child.references.map((reference) => reference.name)).toEqual(
      expect.arrayContaining(["schemas", "rust-domains"]),
    );
  }

  // The retired v2 orchestration block is gone: under the outcome protocol the
  // declaring session holds the orchestration tools and workers only submit.
  expect(role.graph).toBeUndefined();
  expect(role.tools).toEqual(V3_DECLARER_TOOLS);
  for (const retired of RETIRED_V2_TOOLS) {
    expect(role.tools[retired]).toBeUndefined();
  }

  expect(role.subagents.map(childSlug).sort()).toEqual(SUBAGENT_SLUGS);
  for (const child of role.subagents) {
    const slug = childSlug(child);
    // Each gate worker's tool block is exactly the worker contract, and the
    // dispatcher tools stay with the declaring lead.
    expect(child.tools).toEqual(V3_WORKER_TOOLS);
    for (const retired of RETIRED_V2_TOOLS) {
      expect(child.tools[retired]).toBeUndefined();
    }
    const allow = [...(child.permission?.allow ?? [])];
    expect(allow.sort()).toEqual([...WORKER_ALLOW].sort());
    expect(allow).not.toContain("Write");
    expect(allow).not.toContain("Edit");
    expect(slug).not.toBe("");
  }

  // Every declared skill of the primary and of all children resolves to a real
  // file, and every prompt is substantial.
  const subjects = [
    [role, join(directory, "rust-engineer")],
    ...role.subagents.map((child) => [
      child,
      join(directory, "rust-engineer", "subagents", childSlug(child)),
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
    stateDir: tempDir("rust-graph-tools-"),
  });
  for (const name of V3_TOOLS) {
    expect(typeof tools[name]).toBe("function");
  }
  for (const retired of RETIRED_V2_TOOLS) {
    expect(tools[retired]).toBeUndefined();
  }
});

// ── (b) The shipped declaration against the real v3 front end ───────────────

test.each(declarations)("the shipped $name declaration compiles into an executable v3 plan", (example) => {
  const parsed = parseGraphDeclarationV3(example);
  if (!parsed.ok) {
    throw new Error(
      `${example.name} is not a valid v3 declaration: ` +
        parsed.errors
          .map((issue) => `${issue.code} at ${issue.path} (${issue.message})`)
          .join("; "),
    );
  }
  const compiled = compileGraph(parsed.declaration, { supportedValidators: [] });
  if (!compiled.ok) {
    throw new Error(
      `${example.name} failed to compile: ` +
        compiled.errors
          .map((issue) => `${issue.code} at ${issue.path} (${issue.message})`)
          .join("; "),
    );
  }
  expect(compiled.kind).toBe("executable");
  const plan = compiled.plan;
  expect(plan.declarationVersion).toBe(3);
  expect(plan.graphId).toBe(example.name);
  expect(plan.terminalOutcomes.length).toBeGreaterThan(0);
  expect(example.max_retries).toBeUndefined();
  expect(example.loop_groups).toBeUndefined();
  expect(Number.isInteger(example.budget.max_executions)).toBe(true);
  expect(example.budget.max_executions).toBeGreaterThanOrEqual(example.nodes.length);

  for (const edge of plan.edges) {
    const source = plan.nodes.find((node) => node.id === edge.from);
    expect(source).toBeDefined();
    expect(source.outcomes.map((outcome) => outcome.id)).toContain(edge.outcome);
  }
  for (const node of example.nodes) {
    expect(node.completion).toEqual({ mode: "explicit" });
    expect(node.budget.timeout_ms).toBeGreaterThan(0);
    expect(Number.isFinite(node.budget.timeout_ms)).toBe(true);
    expect(node.max_retries).toBeUndefined();
    expect(node.agent).toMatch(/^rust-engineer--[a-z0-9-]+$/);
    const slug = node.agent.slice("rust-engineer--".length);
    expect(SUBAGENT_SLUGS).toContain(slug);
    expect(existsSync(join(roleDir, "subagents", slug, "role.yaml"))).toBe(true);
    for (const input of node.inputs ?? []) {
      const producer = plan.nodes.find((entry) => entry.id === input.from);
      expect(producer).toBeDefined();
      expect(producer.outcomes.map((outcome) => outcome.id)).toContain(input.outcome);
      expect(plan.edges).toEqual(expect.arrayContaining([
        expect.objectContaining({ from: input.from, to: node.id, outcome: input.outcome }),
      ]));
    }
  }
});

test("the catalog preserves independent gates and the optional evidence example declares a genuine all-input join", () => {
  expect(declaration.nodes.map((node) => node.id).sort()).toEqual(GATE_NODES);
  expect(declaration.edges).toEqual([]);
  for (const node of declaration.nodes) {
    expect(Object.keys(node).sort()).toEqual(DECLARED_CHILD_KEYS);
    expect(node.agent).toBe(GATE_AGENTS[node.id]);
    expect(node.inputs).toBeUndefined();
    expect(node.join).toBeUndefined();
    expect(node.outcomes.map((outcome) => outcome.id).sort()).toEqual(GATE_OUTCOMES);
  }

  expect(evidenceDeclaration.nodes.map((node) => node.id).sort()).toEqual([
    "async", "source-behavior", "source-versions",
  ]);
  for (const producer of evidenceDeclaration.nodes.filter((node) => node.id !== "async")) {
    expect(producer.agent).toBe("rust-engineer--source-tracer");
    expect(producer.outcomes).toEqual([{ id: "report" }]);
    expect(producer.inputs).toBeUndefined();
    expect(producer.join).toBeUndefined();
  }
  const consumer = evidenceDeclaration.nodes.find((node) => node.id === "async");
  expect(consumer.agent).toBe(GATE_AGENTS.async);
  expect(consumer.join).toEqual({ strategy: "all" });
  expect(consumer.outcomes.map((outcome) => outcome.id).sort()).toEqual(GATE_OUTCOMES);
  expect(consumer.inputs).toEqual([
    { from: "source-behavior", outcome: "report" },
    { from: "source-versions", outcome: "report" },
  ]);
  expect(evidenceDeclaration.edges).toEqual(consumer.inputs.map((input) => ({
    ...input, to: "async",
  })));
});

// ── (c) The real declare/dispatch/settle path, in process ───────────────────

const NOW = 1_700_000_000_000;

/**
 * One declared graph over one temp workspace: the real toolset persists the real
 * shipped plan, the dispatch seam records every attempt the engine arms, and the real
 * host credential vault stores the credentials those attempts carry.
 */
function declareGraph(selectedDeclaration = declaration) {
  const dir = tempDir("rust-graph-");
  const requests = [];
  const tools = createGraphToolSet({
    stateDir: dir,
    outcomeNow: NOW,
    outcomeDispatch: (request) => {
      requests.push(request);
    },
    credentialIsolation: HostCredentialVault.open({
      root: engineStateDir(dir),
      id: "rust-engineer-contract:credential-vault",
    }).capability(),
  });
  const declared = tools.graph_declare({
    declaration: structuredClone(selectedDeclaration),
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
    reviewed_snapshot: "rust-sample@abc1234 + uncommitted working tree",
    evidence: [`${gate}: inspected the reviewed snapshot read-only`],
    blocking_issues: [],
    required_revisions: [],
    advisory_notes: [],
    verification: ["read-only inspection of the reviewed snapshot"],
    engineering_state_patch: {},
    ...extra,
  };
}

function sourceReport(question, status = "complete") {
  return {
    schema_version: 1,
    outcome_id: "report",
    kind: "source-evidence",
    status,
    reviewed_snapshot: "rust-sample@abc1234 + uncommitted working tree",
    question,
    version_scope: "Fixture runtime dependency pinned by the supplied Cargo.lock; host target",
    findings: status === "complete" ? [{
      claim: "The supplied fixture contract supports the recorded behavior",
      evidence: ["fixture dependency source and resolved lockfile"],
      limits: "This fixture represents inspected evidence; no Rust command was executed",
    }] : [],
    verification: ["Read-only fixture evidence inspection"],
    open_questions: status === "partial" ? [
      "Essential cancellation contract is unavailable for the resolved dependency revision",
    ] : [],
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

test.each(GATE_NODES)("%s can run alone without requiring source evidence or unrelated gates", async (nodeId) => {
  const selected = structuredClone(declaration);
  selected.name = `rust-single-${nodeId}`;
  selected.nodes = selected.nodes.filter((node) => node.id === nodeId);
  selected.budget.max_executions = 1;
  const graph = declareGraph(selected);
  await start(graph);
  expect(nodeIds(graph.requests)).toEqual([nodeId]);
  expect(armed(graph.requests, nodeId).inputs ?? []).toEqual([]);
  const result = await settle(graph, nodeId, "pass", {
    data: gateReport(GATE_NAMES[nodeId], "pass"),
  });
  expect(result.decision).toBe("accepted");
  expect(phaseOf(statusJson(graph.tools, graph.graphId))).toBe("complete");
});

test.each(["complete", "partial"])("the optional join delivers both accepted reports, preserving %s evidence for the gate", async (evidenceStatus) => {
  const graph = declareGraph(evidenceDeclaration);
  await start(graph);
  expect(nodeIds(graph.requests).sort()).toEqual(["source-behavior", "source-versions"]);
  const behaviorAttempt = armed(graph.requests, "source-behavior").attemptId;
  const versionsAttempt = armed(graph.requests, "source-versions").attemptId;
  const behaviorReport = sourceReport("What cancellation contract governs this call?", evidenceStatus);
  const versionsReport = sourceReport("Which resolved revision and features govern this call?");

  const invalid = await settle(graph, "source-behavior", "pass", { data: behaviorReport });
  expect(invalid.decision).toBeUndefined();
  expect(invalid.refusals.length).toBeGreaterThan(0);
  expect(nodeIds(graph.requests)).not.toContain("async");

  const behavior = await settle(graph, "source-behavior", "report", { data: behaviorReport });
  expect(behavior.decision).toBe("accepted");
  expect(nodeIds(graph.requests)).not.toContain("async");
  const versions = await settle(graph, "source-versions", "report", { data: versionsReport });
  expect(versions.decision).toBe("accepted");

  const consumer = armed(graph.requests, "async");
  expect(consumer.inputs).toEqual([
    {
      from: "source-behavior", outcome: "report", attemptId: behaviorAttempt,
      payload: { kind: "value", value: behaviorReport }, artifacts: [],
    },
    {
      from: "source-versions", outcome: "report", attemptId: versionsAttempt,
      payload: { kind: "value", value: versionsReport }, artifacts: [],
    },
  ]);
  expect(phaseOf(statusJson(graph.tools, graph.graphId))).not.toBe("complete");

  // The stub supplies the consumer's decision; the engine preserves it, not judges it.
  const outcome = evidenceStatus === "partial" ? "escalate" : "pass";
  const gate = await settle(graph, "async", outcome, {
    data: gateReport("async-audit", outcome, {
      evidence: [behaviorReport, versionsReport],
      advisory_notes: behaviorReport.open_questions,
    }),
  });
  expect(gate.decision).toBe("accepted");
  expect(attemptIds(graph.requests)).toHaveLength(3);
  const status = statusJson(graph.tools, graph.graphId);
  expect(phaseOf(status)).toBe("complete");
  if (evidenceStatus === "partial") {
    expect(JSON.stringify(status)).toContain(behaviorReport.open_questions[0]);
    expect(JSON.stringify(status)).toContain('"escalate"');
    expect(JSON.stringify(status)).toContain('"partial"');
  }
});

test("an accepted submission commits the result, an identical replay is idempotent and a refusal writes nothing", async () => {
  const graph = declareGraph();
  await start(graph);

  // One start arms exactly the five independent read-only roots.
  expect(nodeIds(graph.requests).sort()).toEqual(GATE_NODES);
  expect(new Set(attemptIds(graph.requests)).size).toBe(GATE_NODES.length);
  // A submission settles only its own node, so the run is not complete yet.
  expect(phaseOf(statusJson(graph.tools, graph.graphId))).not.toBe("complete");

  const ledger = await openLedger(graph.dir);
  try {
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([]);

    const first = armed(graph.requests, "safety");
    const submitted = gateReport("safety", "pass");
    const accepted = await settle(graph, "safety", "pass", {
      data: submitted,
    });
    expect(accepted.decision).toBe("accepted");
    expect(accepted.verdict).toBe("committed");
    expect(accepted.plan_revision).toBe(graph.declared.plan_revision);
    expect(accepted.attempt_id).toBe(first.attemptId);
    expect(accepted.refusals).toEqual([]);
    // settled_nodes carries the run's cumulative settled set in no guaranteed
    // order, not just the node of this submission: compare it order-independently.
    expect([...accepted.settled_nodes].sort()).toEqual(["safety"]);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([first.attemptId]);

    // The identical submission is idempotent: replayed, not a second acceptance.
    const replay = await settle(graph, "safety", "pass", { data: submitted });
    expect(replay.decision).toBe("accepted");
    expect(replay.verdict).toBe("replayed");
    expect(replay.refusals).toEqual([]);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([first.attemptId]);

    const dispatched = attemptIds(graph.requests);

    // A forged credential is refused before any decision: nothing is written and no
    // successor is armed.
    const forged = await graph.tools.graph_submit_outcome({
      graph_id: graph.graphId,
      node_id: "async",
      outcome_id: "pass",
      credential: "not-the-credential-this-attempt-was-issued",
      data: gateReport("async-audit", "pass"),
    });
    expect(forged.decision).toBeUndefined();
    expect(forged.refusals.length).toBeGreaterThan(0);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([first.attemptId]);
    expect(attemptIds(graph.requests)).toEqual(dispatched);

    // An outcome the node never declared is refused the same way.
    const undeclared = await settle(graph, "async", "report");
    expect(undeclared.decision).toBeUndefined();
    expect(undeclared.refusals.length).toBeGreaterThan(0);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([first.attemptId]);
    expect(attemptIds(graph.requests)).toEqual(dispatched);
  } finally {
    ledger.close();
  }
});

test("the five gate nodes are independent roots and a settled run carrying a revise report is still readable", async () => {
  const graph = declareGraph();
  await start(graph);

  // One start arms all five roots, and no node reads another node's result: the
  // shipped batch declares neither an input nor a join.
  expect(nodeIds(graph.requests).sort()).toEqual(GATE_NODES);
  for (const request of graph.requests) {
    expect(request.inputs ?? []).toEqual([]);
  }

  const blocking =
    "src/ffi/bridge.rs:43 transmutes a *const u8 into &mut [u8] without a provenance guarantee from the C allocator";
  const report = gateReport("safety", "revise", {
    blocking_issues: [
      {
        id: "SAFE-1",
        issue: blocking,
        evidence: "src/ffi/bridge.rs:43",
      },
    ],
    required_revisions: [
      "Establish valid allocation, lifetime, alignment and exclusive access before creating a mutable slice",
    ],
  });

  const settled = [];
  const order = ["safety", "async", "api", "performance", "cross-platform"];
  for (const node of order) {
    const outcome = node === "safety" ? "revise" : "pass";
    const result = await settle(graph, node, outcome, {
      data: node === "safety" ? report : gateReport(GATE_NAMES[node], "pass"),
    });
    expect(result.decision).toBe("accepted");
    expect(result.verdict).toBe("committed");
    expect(result.refusals).toEqual([]);
    settled.push(node);
    expect([...result.settled_nodes].sort()).toEqual([...settled].sort());
  }

  // Every node was armed exactly once: the batch never retried or reopened a node.
  expect([...new Set(nodeIds(graph.requests))].sort()).toEqual(GATE_NODES);
  expect(attemptIds(graph.requests)).toHaveLength(GATE_NODES.length);

  // Once every declared root has settled, the run reaches phase complete with the
  // negative gate report on record: a settled graph is still not acceptance.
  const status = statusJson(graph.tools, graph.graphId);
  const document = JSON.stringify(status);
  expect(document).toContain(blocking);
  expect(document).toContain("blocking_issues");
  expect(document).toContain("SAFE-1");
  expect(document).toContain('"revise"');
  expect(phaseOf(status)).toBe("complete");
});
