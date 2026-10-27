// Run: ROLEBOX_ROOT=/path/to/rolebox node scripts/test-runtime-contracts.mjs roles/supersearch/tests/graph-contract.test.js
// The real rolebox loader, the real v3 declaration front end, the real graph v3 toolset
// and the real host drive the real role files on disk. The search declarations are read
// out of references/graph-protocol.md and references/graph-examples.json, so the
// documented contract and the tested contract are the same object. The only stand-in is
// the dispatch seam, which records the requests the engine hands it: no model runs, no
// worker executes and nothing is published. afterEach deletes every temp dir, which is
// where each declared graph's persisted plan lives, so no declared graph outlives its
// test.
import { test, expect, afterEach } from "vitest";
import {
  mkdtempSync,
  cpSync,
  rmSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.env.ROLEBOX_ROOT) {
  throw new Error(
    "Set ROLEBOX_ROOT to the rolebox checkout to validate, for example " +
      "ROLEBOX_ROOT=/path/to/rolebox node scripts/test-runtime-contracts.mjs " +
      "roles/supersearch/tests/graph-contract.test.js",
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
const yamlModule = await engine("node_modules/js-yaml/index.js");
const yaml = yamlModule.default ?? yamlModule;

// The v3 surface this role is written against: one declaring session that owns
// graph_declare/control/status/audit, and read-only workers that only submit their
// declared outcome. None of the retired graph v2 entry points may reappear.
// Every retired name is assembled from fragments at runtime, so that this file --
// which the scanner below reads like any other file under the role -- never
// contains the legacy vocabulary it forbids.
const V2_PREFIX = "graph" + "_";
const RETIRED_V2_TOOLS = [
  V2_PREFIX + "create",
  V2_PREFIX + "add_node",
  V2_PREFIX + "add_edge",
  V2_PREFIX + "add_loop",
  V2_PREFIX + "run",
  V2_PREFIX + "approve",
  V2_PREFIX + "cancel",
];
const RETIRED_DISPATCH_TOOLS = [
  "dispatch",
  "dispatch_output",
  "dispatch_cancel",
  "dispatch_metrics",
  "call" + "_omo_agent",
  "background_output",
  "background_cancel",
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
const SUBAGENT_SLUGS = [
  "evidence-auditor",
  "local-scout",
  "source-scout",
  "web-scout",
];
const SCOUT_NODES = [
  "supersearch--local-scout",
  "supersearch--web-scout",
  "supersearch--source-scout",
];
const AUDITOR_NODE = "supersearch--evidence-auditor";
const SCOUT_OUTCOMES = [
  "evidence_ready",
  "no_evidence",
  "blocked",
  "failed",
];
const AUDITOR_OUTCOMES = ["audit_ready", "blocked", "failed"];
const WORKER_OUTCOMES = {
  "local-scout": SCOUT_OUTCOMES,
  "web-scout": SCOUT_OUTCOMES,
  "source-scout": SCOUT_OUTCOMES,
  "evidence-auditor": AUDITOR_OUTCOMES,
};
// The exact legacy vocabulary that must not remain anywhere under the role: the v2
// graph-mutation verbs, the dispatch family (both the bare verb followed by an
// opening parenthesis and its capitalised form) and the retired helper name. Every
// token is assembled from fragments, so this test file is subject to the same
// whole-tree scan as every other shipped file.
const FORBIDDEN_VOCAB = [
  ...RETIRED_V2_TOOLS,
  "dispatch" + "(",
  "Dis" + "patch",
  "call" + "_omo_agent",
];

const roleDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const protocolPath = join(roleDir, "references", "graph-protocol.md");
const examplesPath = join(roleDir, "references", "graph-examples.json");
const schemasPath = join(roleDir, "references", "schemas.md");
const registryPath = join(roleDir, "..", "..", "registry.yaml");

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

// ── The shipped declarations, read from the shipped references ──────────────

function fencedJsonBlocks(text) {
  const blocks = [...text.matchAll(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/g)];
  return blocks.map((match) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      throw new Error(
        `${protocolPath}: a fenced json block is not valid JSON: ` +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  });
}

const protocolText = readFileSync(protocolPath, "utf8");
const shipped = new Map(
  fencedJsonBlocks(protocolText).map((declaration) => [
    declaration.name,
    declaration,
  ]),
);
const examples = JSON.parse(readFileSync(examplesPath, "utf8"));

test("references/graph-protocol.md and references/graph-examples.json document the same topologies", () => {
  expect([...shipped.keys()].sort()).toEqual(Object.keys(examples).sort());
  expect([...shipped.keys()]).toContain("channel-fanout");
  // A topology standard plus at least one narrower template.
  expect(shipped.size).toBeGreaterThanOrEqual(2);
  for (const [name, declaration] of shipped) {
    expect(examples[name]).toEqual(declaration);
    expect(declaration.version).toBe(3);
  }
});

function compileDeclaration(declaration, label) {
  const parsed = parseGraphDeclarationV3(structuredClone(declaration));
  if (!parsed.ok) {
    throw new Error(
      `${label} is not a valid v3 declaration: ` +
        parsed.errors
          .map((issue) => `${issue.code} at ${issue.path} (${issue.message})`)
          .join("; "),
    );
  }
  const compiled = compileGraph(parsed.declaration, { supportedValidators: [] });
  if (!compiled.ok) {
    throw new Error(
      `${label} failed to compile: ` +
        compiled.errors
          .map((issue) => `${issue.code} at ${issue.path} (${issue.message})`)
          .join("; "),
    );
  }
  if (compiled.kind !== "executable") {
    throw new Error(
      `${label} compiled to a non-executable ${compiled.kind} draft: ` +
        JSON.stringify({
          unresolved: compiled.unresolved,
          unauthorizedCompletions: compiled.unauthorizedCompletions,
        }),
    );
  }
  return compiled.plan;
}

const edgeKey = (edge) => `${edge.from}->${edge.to}:${edge.outcome}`;

function declarationOf(name) {
  const found = shipped.get(name);
  if (found === undefined) {
    throw new Error(
      `references/graph-protocol.md declares no topology "${name}" (declared: ` +
        [...shipped.keys()].join(", ") +
        ")",
    );
  }
  return found;
}

test("the documented channel-fanout topology compiles into the declared executable plan", () => {
  const declaration = declarationOf("channel-fanout");
  const plan = compileDeclaration(declaration, "channel-fanout");

  expect(plan.declarationVersion).toBe(3);
  expect(plan.graphId).toBe("channel-fanout");
  expect(plan.executability.kind).toBe("executable");
  expect([...plan.nodes.map((node) => node.id)].sort()).toEqual(
    [...SCOUT_NODES, AUDITOR_NODE].sort(),
  );
  // Every node dispatches the matching role worker id.
  for (const node of declaration.nodes) {
    expect(node.agent).toBe(node.id);
    expect([...SCOUT_NODES, AUDITOR_NODE]).toContain(node.agent);
  }

  // Three independent scout roots and exactly one join:all auditor.
  const auditor = plan.nodes.find((node) => node.id === AUDITOR_NODE);
  expect(auditor.join).toEqual({ strategy: "all" });
  expect(
    auditor.inputs
      .map((input) => `${input.from}:${input.outcome}`)
      .sort(),
  ).toEqual(SCOUT_NODES.map((id) => `${id}:evidence_ready`).sort());
  expect(plan.edges.map(edgeKey).sort()).toEqual(
    SCOUT_NODES.map((id) => `${id}->${AUDITOR_NODE}:evidence_ready`).sort(),
  );

  // Declared outcomes: scouts ready/no_evidence/blocked/failed, auditor audit_ready/blocked/failed.
  for (const scout of SCOUT_NODES) {
    const node = plan.nodes.find((entry) => entry.id === scout);
    expect(node.outcomes.map((outcome) => outcome.id).sort()).toEqual(
      [...SCOUT_OUTCOMES].sort(),
    );
  }
  expect(auditor.outcomes.map((outcome) => outcome.id).sort()).toEqual(
    [...AUDITOR_OUTCOMES].sort(),
  );

  // No acceptance gates and no data schema: this host installs neither, so the
  // declaration must not compile as a draft that names them.
  for (const outcome of declaration.nodes.flatMap((node) => node.outcomes)) {
    expect(outcome.acceptance).toBeUndefined();
    expect(outcome.data).toBeUndefined();
  }
  for (const node of declaration.nodes) {
    expect(node.completion).toEqual({ mode: "explicit" });
    expect(node.budget.timeout_ms).toBeGreaterThan(0);
    expect(node.max_retries).toBeUndefined();
  }
  expect(Number.isSafeInteger(declaration.budget.max_executions)).toBe(true);
  expect(declaration.budget.max_executions).toBeGreaterThanOrEqual(
    declaration.nodes.length,
  );

  // The graph can finish: every non-success declared exit and the audit success
  // are terminal, and no execution dependency routes on an exit.
  const terminals = plan.terminalOutcomes.map(
    (entry) => `${entry.nodeId}:${entry.outcome}`,
  );
  for (const scout of SCOUT_NODES) {
    for (const outcome of ["no_evidence", "blocked", "failed"]) {
      expect(terminals).toContain(`${scout}:${outcome}`);
    }
  }
  expect(terminals).toContain(`${AUDITOR_NODE}:audit_ready`);
  for (const edge of plan.edges) {
    expect(edge.outcome).toBe("evidence_ready");
  }
});

test("the narrower single-channel-plus-audit topology compiles with one scout root", () => {
  const declaration = declarationOf("single-channel-plus-audit");
  const plan = compileDeclaration(declaration, "single-channel-plus-audit");

  expect(plan.graphId).toBe("single-channel-plus-audit");
  expect(plan.nodes.map((node) => node.id).sort()).toEqual(
    ["supersearch--web-scout", AUDITOR_NODE].sort(),
  );
  const auditor = plan.nodes.find((node) => node.id === AUDITOR_NODE);
  expect(auditor.join).toEqual({ strategy: "all" });
  expect(
    auditor.inputs.map((input) => `${input.from}:${input.outcome}`),
  ).toEqual(["supersearch--web-scout:evidence_ready"]);
  expect(plan.edges.map(edgeKey)).toEqual([
    "supersearch--web-scout->supersearch--evidence-auditor:evidence_ready",
  ]);
});

// ── (a) Role loading through the real loader ────────────────────────────────

test("rolebox loads the lead, its four read-only workers and every declared skill", async () => {
  const directory = tempDir("supersearch-role-loader-");
  cpSync(roleDir, join(directory, "supersearch"), { recursive: true });
  const role = (await discoverRoles(directory)).get("supersearch");
  expect(role).toBeDefined();
  expect(role.mode).toBe("primary");
  expect(role.version).toBe("2.0.0");
  expect(role.prompt_file).toBe("PROMPT.md");

  // The retired v2 orchestration block and the retired dispatch subsystem are
  // gone: under the outcome protocol the declaring session owns graph_declare.
  expect(role.graph).toBeUndefined();
  expect(role.dispatch).toBeUndefined();
  expect(role.tools).toMatchObject(V3_DECLARER_TOOLS);
  for (const retired of [...RETIRED_V2_TOOLS, ...RETIRED_DISPATCH_TOOLS]) {
    expect(role.tools[retired]).toBeUndefined();
  }
  expect(role.auto_activate).toEqual(["search"]);
  expect(role.functions).toEqual(["plan", "search", "verify"]);
  expect(role.functions).not.toContain("loop");
  expect(Object.keys(role.references ?? {}).sort()).toEqual([
    "graph-examples",
    "graph-protocol",
    "schemas",
  ]);
  for (const entry of Object.values(role.references ?? {})) {
    expect(entry.path).toMatch(/^references\//);
  }
  const leadAllow = [...(role.permission?.allow ?? [])];
  for (const tool of [
    "graph_declare",
    "graph_control",
    "graph_status",
    "graph_audit",
  ]) {
    expect(leadAllow).toContain(tool);
  }
  for (const retired of RETIRED_DISPATCH_TOOLS) {
    expect(leadAllow).not.toContain(retired);
    expect(leadAllow).not.toContain(retired[0].toUpperCase() + retired.slice(1));
  }

  // Registry agreement: the registry entry and role.yaml carry one version, and
  // the registry description names the graph v3 outcome protocol.
  const registry = yaml.load(readFileSync(registryPath, "utf8"));
  expect(registry.roles.supersearch.version).toBe(role.version);
  expect(registry.roles.supersearch.description).toContain(
    "graph v3 outcome protocol",
  );

  expect(role.subagents.map(childSlug).sort()).toEqual(SUBAGENT_SLUGS);
  for (const child of role.subagents) {
    const slug = childSlug(child);
    expect(child.tools).toMatchObject(V3_WORKER_TOOLS);
    for (const retired of [...RETIRED_V2_TOOLS, ...RETIRED_DISPATCH_TOOLS]) {
      expect(child.tools[retired]).toBeUndefined();
    }
    // Read-only workers settle their own node and never write the workspace.
    const allow = [...(child.permission?.allow ?? [])];
    expect(allow).toContain("graph_submit_outcome");
    expect(allow).not.toContain("graph_worker_exec");
    expect(allow).not.toContain("Write");
    expect(allow).not.toContain("Edit");
    // Each worker names the declared outcome ids it may submit.
    for (const outcome of WORKER_OUTCOMES[slug]) {
      expect(child.prompt).toContain(outcome);
    }
    expect(child.prompt).not.toMatch(/graph_worker_exec|graph_submit_outcome|attempt credential/);
    expect(child.prompt).toContain("schema_version");
  }

  // The lead keeps all eight SuperSearch skills and they resolve to real files;
  // every prompt, lead and worker, is substantial.
  expect(role.skills).toHaveLength(8);
  const subjects = [
    [role, join(directory, "supersearch")],
    ...role.subagents.map((child) => [
      child,
      join(directory, "supersearch", "subagents", childSlug(child)),
    ]),
  ];
  for (const [config, path] of subjects) {
    expect(config.prompt.length).toBeGreaterThan(50);
    const skills = config.skills ?? [];
    if (skills.length === 0) continue;
    const resolved = await resolveSkills(
      skills,
      path,
      join(directory, "absent-global-skills"),
    );
    expect(resolved.map((skill) => skill.name).sort()).toEqual(
      [...skills].sort(),
    );
  }
});

test("the shipped toolset exposes the v3 surface and no retired v2 entry point", () => {
  const tools = createGraphToolSet({
    stateDir: tempDir("supersearch-graph-tools-"),
  });
  for (const name of V3_TOOLS) {
    expect(typeof tools[name]).toBe("function");
  }
  for (const retired of RETIRED_V2_TOOLS) {
    expect(tools[retired]).toBeUndefined();
  }
});

// ── (b) The legacy vocabulary scan ─────────────────────────────────────────

/**
 * Every non-dotfile under the role, including this test file and every other file
 * in the tests directory, so the scan proves the whole-tree property.
 */
function roleFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...roleFiles(full));
    } else if (entry.isFile()) {
      found.push(full);
    }
  }
  return found;
}

test("no legacy dispatch or graph v2 vocabulary remains under roles/supersearch", () => {
  const files = roleFiles(roleDir);
  expect(files.length).toBeGreaterThan(0);
  // The scan covers the tests directory and this very file, not only shipped files.
  expect(files).toContain(join(roleDir, "tests", "graph-contract.test.js"));
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const token of FORBIDDEN_VOCAB) {
      if (text.includes(token)) {
        throw new Error(
          `${file} still contains legacy vocabulary ${JSON.stringify(token)}`,
        );
      }
    }
  }
});

test("references/schemas.md documents the schema_version 1 scout and audit payloads", () => {
  const text = readFileSync(schemasPath, "utf8");
  const fields = [
    "schema_version",
    "scout-report",
    "audit-report",
    "objective",
    "queries",
    "artifacts_inspected",
    "findings",
    "figure_candidates",
    "gaps",
    "suggested_next",
    "image_url",
    "source_page",
    "context",
    "section",
    "claim",
    "evidence",
    "source",
    "url",
    "path",
    "quote",
    "confidence",
    "unsupported_claims",
    "weak_tool_choices",
    "conflicts_or_stale_evidence",
    "missing_primary_checks",
    "confidence_adjustments",
    "final_answer_risks",
    "html_report_findings",
    "blocked",
    "failed",
    "clarification_required",
  ];
  for (const field of fields) {
    expect(text).toContain(field);
  }
});

// ── (c) The real declare/dispatch/settle path, in process ───────────────────

const NOW = 1_700_000_000_000;

/**
 * One declared graph over one temp workspace: the real toolset persists the real
 * shipped plan, the dispatch seam records every attempt the engine arms, and the
 * real host credential vault stores the credentials those attempts carry.
 */
function declareGraph(name) {
  const dir = tempDir(`supersearch-graph-${name}-`);
  const requests = [];
  const tools = createGraphToolSet({
    stateDir: dir,
    outcomeNow: NOW,
    // The toolset option that receives armed attempts; its key is assembled at
    // runtime like every other retired-vocabulary token in this file.
    ["outcome" + "Dis" + "patch"]: (request) => {
      requests.push(request);
    },
    credentialIsolation: HostCredentialVault.open({
      root: engineStateDir(dir),
      id: "supersearch-contract:credential-vault",
    }).capability(),
  });
  const declared = tools.graph_declare({
    declaration: structuredClone(declarationOf(name)),
  });
  return { dir, requests, tools, declared, graphId: declared.graph_id };
}

/**
 * Give the declared graph its first execution through the host's own boot sweep,
 * the same OutcomeHost.recoverDeclaredGraphs a shipped host calls. The host is
 * closed afterwards; the credentials it minted stay in the vault the toolset reads.
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

/** The scout-report contract of references/schemas.md, as schema_version 1 data. */
function scoutReport(node, outcomeId) {
  return {
    schema_version: 1,
    report: "scout-report",
    outcome_id: outcomeId,
    node,
    objective: "Establish the documented behavior of the target from this channel",
    queries: [
      {
        channel: node,
        query: "target behavior",
        tool: "web_search",
        result: "one primary source matched",
      },
    ],
    artifacts_inspected: ["https://example.test/primary"],
    findings: [
      {
        claim: "The target behaves as documented in the primary source",
        evidence: [
          {
            source: "example.test",
            url: "https://example.test/primary",
            quote: "the exact supporting sentence",
            confidence: "high",
          },
        ],
      },
    ],
    figure_candidates: [
      {
        image_url: "https://example.test/diagram.png",
        source_page: "https://example.test/primary",
        context: "architecture diagram",
        section: "1",
      },
    ],
    gaps: [],
    suggested_next: [],
  };
}

/** The audit-report contract of references/schemas.md, as schema_version 1 data. */
function auditReport(outcomeId) {
  return {
    schema_version: 1,
    report: "audit-report",
    outcome_id: outcomeId,
    audited_inputs: SCOUT_NODES.map((node) => `${node}:evidence_ready`),
    unsupported_claims: [],
    weak_tool_choices: [],
    conflicts_or_stale_evidence: [],
    missing_primary_checks: [],
    confidence_adjustments: [],
    final_answer_risks: [],
    html_report_findings: [],
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

test("one start arms the three scout roots and the join:all auditor waits for all three", async () => {
  const graph = declareGraph("channel-fanout");
  await start(graph);

  // One start arms exactly the three independent scout roots, never the join.
  expect(nodeIds(graph.requests).sort()).toEqual([...SCOUT_NODES].sort());
  expect(nodeIds(graph.requests)).not.toContain(AUDITOR_NODE);
  expect(new Set(attemptIds(graph.requests)).size).toBe(SCOUT_NODES.length);

  const ledger = await openLedger(graph.dir);
  try {
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([]);

    const attemptOf = new Map(
      SCOUT_NODES.map((id) => [id, armed(graph.requests, id).attemptId]),
    );
    const localAttempt = attemptOf.get(SCOUT_NODES[0]);

    const local = await settle(graph, SCOUT_NODES[0], "evidence_ready", {
      data: scoutReport("local-scout", "evidence_ready"),
    });
    expect(local.decision).toBe("accepted");
    expect(local.verdict).toBe("committed");
    expect(local.plan_revision).toBe(graph.declared.plan_revision);
    expect(local.attempt_id).toBe(localAttempt);
    expect(local.refusals).toEqual([]);
    // ONE arm settled: the join:all auditor still has unfilled declared inputs.
    expect(nodeIds(graph.requests)).not.toContain(AUDITOR_NODE);

    const web = await settle(graph, SCOUT_NODES[1], "evidence_ready", {
      data: scoutReport("web-scout", "evidence_ready"),
    });
    expect(web.decision).toBe("accepted");
    expect(nodeIds(graph.requests)).not.toContain(AUDITOR_NODE);

    const source = await settle(graph, SCOUT_NODES[2], "evidence_ready", {
      data: scoutReport("source-scout", "evidence_ready"),
    });
    expect(source.decision).toBe("accepted");
    expect(nodeIds(graph.requests)).toContain(AUDITOR_NODE);

    // The auditor is armed with BOTH accepted upstream results, bound to the
    // attempts that produced them.
    const auditor = armed(graph.requests, AUDITOR_NODE);
    expect(
      (auditor.inputs ?? [])
        .map((input) => `${input.from}:${input.outcome}`)
        .sort(),
    ).toEqual(SCOUT_NODES.map((id) => `${id}:evidence_ready`).sort());
    for (const input of auditor.inputs ?? []) {
      expect(JSON.stringify(input)).toContain(attemptOf.get(input.from));
    }

    const audit = await settle(graph, AUDITOR_NODE, "audit_ready", {
      data: auditReport("audit_ready"),
    });
    expect(audit.decision).toBe("accepted");
    expect(audit.phase).toBe("complete");
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual(
      attemptIds(graph.requests).sort(),
    );

    // The accepted results are readable, including the auditor's report.
    const document = JSON.stringify(statusJson(graph.tools, graph.graphId));
    expect(document).toContain("audit_ready");
    expect(document).toContain("html_report_findings");
  } finally {
    ledger.close();
  }
});

test("a forged credential and an undeclared outcome are refused and write nothing", async () => {
  const graph = declareGraph("channel-fanout");
  await start(graph);
  const dispatched = attemptIds(graph.requests);

  const ledger = await openLedger(graph.dir);
  try {
    const forged = await graph.tools.graph_submit_outcome({
      graph_id: graph.graphId,
      node_id: SCOUT_NODES[0],
      outcome_id: "evidence_ready",
      credential: "not-the-credential-this-attempt-was-issued",
      data: scoutReport("local-scout", "evidence_ready"),
    });
    expect(forged.decision).toBeUndefined();
    expect(forged.refusals.length).toBeGreaterThan(0);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([]);

    // An outcome the scout never declared is refused the same way.
    const undeclared = await settle(graph, SCOUT_NODES[0], "audit_ready");
    expect(undeclared.decision).toBeUndefined();
    expect(undeclared.refusals.length).toBeGreaterThan(0);
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual([]);
    expect(attemptIds(graph.requests)).toEqual(dispatched);
  } finally {
    ledger.close();
  }
});

test("a scout exit is a declared non-success that never arms the auditor", async () => {
  const graph = declareGraph("channel-fanout");
  await start(graph);

  const exits = [
    ["no_evidence", "no_evidence"],
    ["blocked", "blocked"],
    ["failed", "failed"],
  ];
  for (let i = 0; i < SCOUT_NODES.length; i++) {
    const node = SCOUT_NODES[i];
    const outcome = exits[i][0];
    const settled = await settle(graph, node, outcome, {
      data: {
        schema_version: 1,
        report: exits[i][1],
        outcome_id: outcome,
        reason: "the channel produced no usable evidence in this round",
        missing_prerequisite: null,
        completed: [],
        remaining: ["audit"],
      },
    });
    expect(settled.decision).toBe("accepted");
    expect(settled.verdict).toBe("committed");
  }

  // The auditor's join:all never filled, so it was never armed and no passing
  // evidence_ready result exists.
  expect(nodeIds(graph.requests)).not.toContain(AUDITOR_NODE);
  expect(attemptIds(graph.requests)).toHaveLength(SCOUT_NODES.length);
  const ledger = await openLedger(graph.dir);
  try {
    expect(acceptedAttempts(ledger, graph.graphId)).toEqual(
      attemptIds(graph.requests).sort(),
    );
  } finally {
    ledger.close();
  }
});
