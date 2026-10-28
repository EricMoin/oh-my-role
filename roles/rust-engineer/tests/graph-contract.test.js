import { test, expect, afterEach } from "vitest";
import { mkdtempSync, cpSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.env.ROLEBOX_ROOT) throw new Error("Set ROLEBOX_ROOT to the rolebox checkout.");
const root = resolve(process.env.ROLEBOX_ROOT);
const engine = (path) => import(pathToFileURL(join(root, path)).href);
const { createGraphToolSet } = await engine("src/graph/tools/graph-tools.ts");
const { parseGraphDeclarationV3 } = await engine("src/graph/compiler/parse-declaration-v3.ts");
const { compileGraph } = await engine("src/graph/compiler/compile.ts");
const { discoverRoles } = await engine("src/loader/role-loader.ts");
const { resolveSkills } = await engine("src/resolver/skill-resolver.ts");
const { resolveAllRoles } = await engine("src/resolver/orchestrator.ts");
const { OutcomeHost } = await engine("src/graph/host/outcome-host.ts");
const { HostCredentialVault } = await engine("src/graph/host/credential-vault.ts");
const { engineStateDir } = await engine("src/graph/persistence/paths.ts");
const { SqliteAcceptanceLedger } = await engine("src/graph/ledger/sqlite-ledger.ts");

const roleDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const patterns = JSON.parse(readFileSync(join(roleDir,
  "skills/rust-graph-workflow/references/graph-patterns.json"), "utf8"));
const domains = ["ownership-api", "async-concurrency", "unsafe-ffi", "cargo-platform", "performance"];
const reviewers = domains.map((domain) => `${domain}-reviewer`);
const children = [...domains, ...reviewers, "verification", "source-tracer"].sort();
const gateSkills = {
  "ownership-api": "rust-api-gate", "async-concurrency": "rust-async-gate",
  "unsafe-ffi": "rust-safety-gate", "cargo-platform": "rust-platform-gate",
  performance: "rust-perf-gate",
};
const slug = (child) => child.name.toLowerCase().replaceAll(" ", "-");
const v3 = ["graph_declare", "graph_control", "graph_status", "graph_audit", "graph_submit_outcome"];
const retired = ["graph_create", "graph_add_node", "graph_add_edge", "graph_add_loop",
  "graph_run", "graph_approve", "graph_cancel", "dispatch", "dispatch_output", "dispatch_cancel"];
const tempDirs = [];
afterEach(() => { for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), "rust-role-contract-"));
  tempDirs.push(dir);
  return dir;
}
function patternOf(name) {
  const found = patterns.find((pattern) => pattern.name === name);
  if (!found) throw new Error(`Unknown shipped Rust pattern: ${name}`);
  return structuredClone(found);
}

function assertDutyAssignments(declaration, policies) {
  for (const node of declaration.nodes) {
    const policy = policies.get(node.agent);
    if (!policy) throw new Error(`Unknown role: ${node.agent}`);
    const outcomes = node.outcomes.map(({ id }) => id);
    const writes = policy.tools.Write === true || policy.tools.Edit === true;
    if (writes && outcomes.some((id) => ["pass", "revise", "escalate", "report"].includes(id))) {
      throw new Error(`implementation role ${node.agent} cannot own review or independent evidence`);
    }
    if (!writes && outcomes.some((id) => ["done", "failed", "blocked", "clarification_required"].includes(id))) {
      throw new Error(`read-only role ${node.agent} cannot own implementation`);
    }
  }
}

// Dispatch is stubbed: these tests prove protocol behavior, not model judgment or filesystem isolation.
test("the loader resolves separate implementation and read-only review roles with their own skills", async () => {
  const directory = tempDir();
  const copied = join(directory, "rust-engineer");
  cpSync(roleDir, copied, { recursive: true });
  const role = (await discoverRoles(directory)).get("rust-engineer");
  expect(role.name).toBe("Rust Engineer");
  expect(role.version).toBe("5.1.0");
  expect(role.skills).toContain("rust-graph-workflow");
  expect(role.graph).toBeUndefined();
  expect(role.tools).toMatchObject({ graph_declare: true, graph_submit_outcome: false,
    Write: true, Edit: true, Bash: true });
  expect(role.subagents.map(slug).sort()).toEqual(children);
  const [resolved] = await resolveAllRoles(new Map([["rust-engineer", role]]), {
    roleboxDir: directory, globalSkillsDir: join(directory, "absent-skills"),
    configDir: join(directory, "absent-config"), builtinDir: join(root, "functions"),
    roleFunctionsMap: new Map(),
  });
  for (const child of resolved.subagents) {
    expect(child.references.map((ref) => ref.name)).toEqual(expect.arrayContaining(["schemas", "node-contract"]));
  }
  const subjects = [[role, copied], ...role.subagents.map((child) =>
    [child, join(copied, "subagents", slug(child))])];
  for (const [config, path] of subjects) {
    const skills = await resolveSkills(config.skills, path, join(directory, "absent-skills"));
    expect(skills.map((skill) => skill.name).sort()).toEqual([...config.skills].sort());
    for (const name of config.skills) {
      const file = join(path, "skills", name, "SKILL.md");
      const body = readFileSync(file, "utf8");
      for (const [, target] of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        if (/^https?:/.test(target)) continue;
        expect(existsSync(resolve(dirname(file), target.split("#")[0])), `${file}: ${target}`).toBe(true);
      }
    }
    for (const name of retired) expect(config.tools[name]).toBeUndefined();
  }
  for (const child of role.subagents) {
    const canImplement = domains.includes(slug(child));
    expect(child.tools).toMatchObject({ graph_declare: false, graph_control: false,
      graph_status: false, graph_audit: false, graph_submit_outcome: true,
      Write: canImplement, Edit: canImplement });
    expect((child.permission.allow ?? []).includes("Write")).toBe(canImplement);
  }
  for (const domain of domains) {
    const writer = role.subagents.find((child) => slug(child) === domain);
    const reviewer = role.subagents.find((child) => slug(child) === `${domain}-reviewer`);
    expect(writer.skills).not.toContain(gateSkills[domain]);
    expect(reviewer.skills).toContain(gateSkills[domain]);
    expect(reviewer.permission.allow).not.toContain("Edit");
  }
  const policies = new Map(role.subagents.map((child) => [`rust-engineer--${slug(child)}`, child]));
  for (const pattern of patterns) assertDutyAssignments(pattern, policies);
  const invalidReview = patternOf("rust-specialist-loop");
  invalidReview.nodes.find((node) => node.id === "review").agent = "rust-engineer--async-concurrency";
  expect(() => assertDutyAssignments(invalidReview, policies)).toThrow(/implementation.*review/);
  const invalidImplementation = patternOf("rust-specialist-loop");
  invalidImplementation.nodes.find((node) => node.id === "change").agent = "rust-engineer--async-concurrency-reviewer";
  expect(() => assertDutyAssignments(invalidImplementation, policies)).toThrow(/read-only.*implementation/);
  const disguisedWriter = patternOf("rust-mechanical");
  disguisedWriter.nodes[0].outcomes.push({ id: "pass" });
  expect(() => assertDutyAssignments(disguisedWriter, policies)).toThrow(/implementation.*review/);
  const declaredAgents = new Set(children.map((name) => `rust-engineer--${name}`));
  for (const pattern of patterns) for (const node of pattern.nodes) expect(declaredAgents.has(node.agent)).toBe(true);
});

test("the runtime exposes the current graph surface", () => {
  const tools = createGraphToolSet({ stateDir: tempDir() });
  for (const name of v3) expect(typeof tools[name]).toBe("function");
  for (const name of retired) expect(tools[name]).toBeUndefined();
});

for (const pattern of patterns) {
  test(`${pattern.name} compiles with finite execution and loop budgets`, () => {
    const parsed = parseGraphDeclarationV3(pattern);
    expect(parsed.ok, JSON.stringify(parsed.errors)).toBe(true);
    const compiled = compileGraph(parsed.declaration, { supportedValidators: [] });
    expect(compiled.ok, JSON.stringify(compiled.errors)).toBe(true);
    expect(compiled.kind).toBe("executable");
    expect(compiled.plan.graphId).toBe(pattern.name);
    expect(pattern.budget.max_executions).toBeGreaterThan(0);
    expect(compiled.plan.loopGroups).toHaveLength((pattern.loop_groups ?? []).length);
    for (const node of pattern.nodes) {
      expect(node.completion.mode).toBe("explicit");
      expect(node.budget.timeout_ms).toBeGreaterThan(0);
      expect(node).not.toHaveProperty("max_retries");
    }
  });
}

function declarePattern(name, mutate = () => {}) {
  const dir = tempDir();
  const requests = [];
  const tools = createGraphToolSet({
    stateDir: dir, outcomeNow: 1_700_000_000_000,
    outcomeDispatch: (request) => { requests.push(request); },
    credentialIsolation: HostCredentialVault.open({ root: engineStateDir(dir),
      id: "rust-role-contract-v5:vault" }).capability(),
  });
  const declaration = patternOf(name);
  mutate(declaration);
  const declared = tools.graph_declare({ declaration });
  return { dir, requests, tools, declared, graphId: declared.graph_id };
}
async function start(graph) {
  const host = OutcomeHost.open({ workspaceDir: graph.dir, storeRoot: engineStateDir(graph.dir),
    deliver: (request) => { graph.requests.push(request); }, durability: "memory" });
  try { await host.recoverDeclaredGraphs(); } finally { host.close(); }
}
const nodeIds = (graph) => graph.requests.map((request) => request.nodeId);
function armed(graph, nodeId) {
  const found = graph.requests.filter((request) => request.nodeId === nodeId).at(-1);
  if (!found) throw new Error(`${nodeId} was not dispatched: ${nodeIds(graph)}`);
  return found;
}
function settle(graph, nodeId, outcomeId, data) {
  return graph.tools.graph_submit_outcome({ graph_id: graph.graphId, node_id: nodeId,
    outcome_id: outcomeId, credential: armed(graph, nodeId).credential,
    ...(data === undefined ? {} : { data }) });
}
function status(graph) {
  const raw = graph.tools.graph_status({ graph_id: graph.graphId, scope: "all", format: "json",
    include_output: true, include_history: true });
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}
const implementation = (snapshot, revisionContext = null) => ({ schema_version: 2,
  kind: "implementation", outcome_id: "done", snapshot, changed_files: ["src/worker.rs"],
  summary: "Fixture implementation", loaded_skills: ["rust-async-specialist", "rust-async-concurrency"],
  evidence: ["fixture source"], verification: ["fixture observation; no Rust command executed"],
  revision_context: revisionContext, open_questions: [] });
const evidence = (snapshot, partial = false, kind = "domain-evidence") => ({ schema_version: 2,
  kind, outcome_id: "report", status: partial ? "partial" : "complete", reviewed_snapshot: snapshot,
  question: "Fixture lifecycle contract", version_scope: "Pinned fixture runtime and host target",
  loaded_skills: [kind === "source-evidence" ? "rust-source-tracing" : "rust-async-gate"],
  findings: [], verification: ["fixture observation; no Rust command executed"],
  open_questions: partial ? ["Essential cancellation evidence is unavailable"] : [] });
const review = (snapshot, outcome, issues = [], gate = "verification") => ({ schema_version: 2, kind: "review",
  outcome_id: outcome, gate, reviewed_snapshot: snapshot,
  loaded_skills: ["rust-verification", "rust-testing"], evidence: ["fixture source and accepted reports"],
  blocking_issues: issues, required_revisions: issues.map(({ id }) => ({ id, required_change: "Repair lifecycle" })),
  advisory_notes: [], verification: ["fixture observation; no Rust command executed"] });

test("a mechanical expert outcome is persisted, replayed idempotently and protected from forged submissions", async () => {
  const graph = declarePattern("rust-mechanical");
  await start(graph);
  expect(nodeIds(graph)).toEqual(["change"]);
  const data = implementation("fixture-r0");
  const result = await settle(graph, "change", "done", data);
  expect(result).toMatchObject({ decision: "accepted", verdict: "committed", phase: "complete" });
  expect((await settle(graph, "change", "done", data)).verdict).toBe("replayed");
  const ledger = await SqliteAcceptanceLedger.create(engineStateDir(graph.dir));
  try {
    expect(ledger.acceptedEvents(graph.graphId)).toHaveLength(1);
    const forged = await graph.tools.graph_submit_outcome({ graph_id: graph.graphId,
      node_id: "change", outcome_id: "done", credential: "forged", data });
    expect(forged.decision).toBeUndefined();
    expect(forged.refusals.length).toBeGreaterThan(0);
    expect(ledger.acceptedEvents(graph.graphId)).toHaveLength(1);
  } finally { ledger.close(); }
});

test.each(domains)("%s resolves as an implementation node without unrelated experts", async (domain) => {
  const graph = declarePattern("rust-mechanical", (declaration) => {
    declaration.name = `rust-domain-${domain}`;
    declaration.nodes[0].agent = `rust-engineer--${domain}`;
    declaration.nodes[0].prompt = `Mode: implement. Load your specialist entry skill and linked implementation guidance. Perform the assigned ${domain} fixture change within its source scope and check the assigned acceptance criteria.`;
  });
  await start(graph);
  expect(nodeIds(graph)).toEqual(["change"]);
  expect((await settle(graph, "change", "done", implementation("fixture-r0"))).phase).toBe("complete");
});

test.each(domains)("%s review is dispatched to its separate read-only role", async (domain) => {
  const graph = declarePattern("rust-specialist-loop", (declaration) => {
    declaration.name = `rust-separate-${domain}-review`;
    declaration.nodes.find((node) => node.id === "change").agent = `rust-engineer--${domain}`;
    const node = declaration.nodes.find((node) => node.id === "review");
    node.agent = `rust-engineer--${domain}-reviewer`;
    node.prompt = `Mode: review. Load ${gateSkills[domain]}. Inspect the assigned snapshot against requirements in a session that never implemented it. Keep source read-only.`;
  });
  await start(graph);
  const writer = armed(graph, "change");
  await settle(graph, "change", "done", implementation("fixture-r0"));
  const reviewer = armed(graph, "review");
  expect(reviewer.attemptId).not.toBe(writer.attemptId);
  expect(reviewer.credential).not.toBe(writer.credential);
  const data = { ...review("fixture-r0", "pass", [], domain), loaded_skills: [gateSkills[domain]] };
  expect((await settle(graph, "review", "pass", data)).phase).toBe("complete");
});

test("implementation cannot approve itself or submit the separate reviewer's verdict", async () => {
  const graph = declarePattern("rust-specialist-loop");
  await start(graph);
  const writer = armed(graph, "change");
  const selfApproval = await settle(graph, "change", "pass", review("fixture-r0", "pass"));
  expect(selfApproval.decision).toBeUndefined();
  expect(selfApproval.refusals.length).toBeGreaterThan(0);
  expect(nodeIds(graph)).toEqual(["change"]);
  await settle(graph, "change", "done", implementation("fixture-r0"));
  const impersonation = await graph.tools.graph_submit_outcome({ graph_id: graph.graphId,
    node_id: "review", outcome_id: "pass", credential: writer.credential,
    data: review("fixture-r0", "pass") });
  expect(impersonation.decision).toBeUndefined();
  expect(impersonation.refusals.length).toBeGreaterThan(0);
  const reviewerRepair = await settle(graph, "review", "done", implementation("fixture-r1"));
  expect(reviewerRepair.decision).toBeUndefined();
  expect(reviewerRepair.refusals.length).toBeGreaterThan(0);
  expect((await settle(graph, "review", "pass", review("fixture-r0", "pass"))).phase).toBe("complete");
});

test.each(["failed", "blocked", "clarification_required"])("%s implementation never releases the review success dependency", async (outcome) => {
  const graph = declarePattern("rust-specialist-loop");
  await start(graph);
  const result = await settle(graph, "change", outcome, { schema_version: 2, outcome_id: outcome });
  expect(result.decision).toBe("accepted");
  expect(nodeIds(graph)).toEqual(["change"]);
});

test("each repair receives the exact accepted feedback and review sees the new implementation attempt", async () => {
  const graph = declarePattern("rust-specialist-loop");
  await start(graph);
  expect(armed(graph, "change").inputs ?? []).toEqual([]);
  for (let round = 0; round < 3; round++) {
    const changeAttempt = armed(graph, "change").attemptId;
    const changed = implementation(`fixture-r${round}`);
    expect((await settle(graph, "change", "done", changed)).decision).toBe("accepted");
    const reviewer = armed(graph, "review");
    expect(reviewer.inputs).toEqual([{ from: "change", outcome: "done", attemptId: changeAttempt,
      payload: { kind: "value", value: changed }, artifacts: [] }]);
    if (round === 2) {
      expect((await settle(graph, "review", "pass", review(`fixture-r${round}`, "pass"))).phase).toBe("complete");
      break;
    }
    const report = review(`fixture-r${round}`, "revise", [{ id: "ASYNC-1", evidence: "fixture shutdown still writes" }]);
    expect((await settle(graph, "review", "revise", report)).decision).toBe("accepted");
    expect(armed(graph, "change").inputs).toEqual([{ from: "review", outcome: "revise",
      attemptId: reviewer.attemptId, payload: { kind: "value", value: report }, artifacts: [] }]);
  }
  expect(graph.requests).toHaveLength(6);
});

test("serial expert stages hand off accepted changes and preserve repair feedback provenance", async () => {
  const graph = declarePattern("rust-multi-specialist-loop");
  await start(graph);
  expect(nodeIds(graph)).toEqual(["ownership"]);
  expect((await settle(graph, "ownership", "done", implementation("api-r0"))).decision).toBe("accepted");
  expect(nodeIds(graph)).toEqual(["ownership", "async"]);
  expect((await settle(graph, "async", "done", implementation("integrated-r0"))).decision).toBe("accepted");
  const reviewer = armed(graph, "review");
  expect(reviewer.inputs.map(({ from }) => from).sort()).toEqual(["async", "ownership"]);
  const report = review("integrated-r0", "revise", [{ id: "ASYNC-1", evidence: "fixture lifecycle" }]);
  await settle(graph, "review", "revise", report);
  const repair = armed(graph, "ownership");
  expect(repair.inputs[0].attemptId).toBe(reviewer.attemptId);
  const context = { source_attempt: reviewer.attemptId, report, resolved_issues: [], remaining_owners: { "ASYNC-1": "async" } };
  const forwarded = implementation("api-r1", context);
  await settle(graph, "ownership", "done", forwarded);
  expect(armed(graph, "async").inputs).toEqual([{ from: "ownership", outcome: "done", attemptId: repair.attemptId,
    payload: { kind: "value", value: forwarded }, artifacts: [] }]);
  await settle(graph, "async", "done", implementation("integrated-r1", context));
  expect((await settle(graph, "review", "pass", review("integrated-r1", "pass"))).phase).toBe("complete");
});

test("parallel evidence joins wait for both reports and rerun against repaired source", async () => {
  const graph = declarePattern("rust-evidence-loop");
  await start(graph);
  for (let round = 0; round < 2; round++) {
    const priorCount = graph.requests.length;
    await settle(graph, "change", "done", implementation(`fixture-r${round}`));
    expect(nodeIds(graph).slice(priorCount).sort()).toEqual(["async-evidence", "platform-evidence"]);
    const asyncAttempt = armed(graph, "async-evidence").attemptId;
    const platformAttempt = armed(graph, "platform-evidence").attemptId;
    const count = graph.requests.length;
    await settle(graph, "async-evidence", "report", evidence(`fixture-r${round}`));
    expect(graph.requests).toHaveLength(count);
    await settle(graph, "platform-evidence", "report", evidence(`fixture-r${round}`));
    const inputs = armed(graph, "review").inputs;
    expect(inputs.find(({ from }) => from === "async-evidence").attemptId).toBe(asyncAttempt);
    expect(inputs.find(({ from }) => from === "platform-evidence").attemptId).toBe(platformAttempt);
    for (const input of inputs) expect(JSON.stringify(input.payload)).toContain(`fixture-r${round}`);
    if (round === 0) await settle(graph, "review", "revise", review("fixture-r0", "revise", [{ id: "ASYNC-1" }]));
    else expect((await settle(graph, "review", "pass", review("fixture-r1", "pass"))).phase).toBe("complete");
  }
});

test("source fan-in preserves partial evidence and cannot settle product approval", async () => {
  const graph = declarePattern("rust-investigation");
  await start(graph);
  expect(nodeIds(graph).sort()).toEqual(["source-behavior", "source-versions"]);
  const partial = evidence("fixture-r0", true, "source-evidence");
  const refused = await settle(graph, "source-behavior", "pass", partial);
  expect(refused.decision).toBeUndefined();
  expect(refused.refusals.length).toBeGreaterThan(0);
  await settle(graph, "source-behavior", "report", partial);
  expect(nodeIds(graph)).not.toContain("synthesis");
  await settle(graph, "source-versions", "report", evidence("fixture-r0", false, "source-evidence"));
  const input = armed(graph, "synthesis").inputs.find(({ from }) => from === "source-behavior");
  expect(input.payload.value).toEqual(partial);
  expect((await settle(graph, "synthesis", "report", evidence("fixture-r0", true))).phase).toBe("complete");
  expect(JSON.stringify(status(graph))).toContain(partial.open_questions[0]);
});

test("a complete run preserves an essential-evidence escalation rather than a pass", async () => {
  const graph = declarePattern("rust-evidence-loop");
  await start(graph);
  await settle(graph, "change", "done", implementation("fixture-r0"));
  await settle(graph, "async-evidence", "report", evidence("fixture-r0", true));
  await settle(graph, "platform-evidence", "report", evidence("fixture-r0"));
  const report = review("fixture-r0", "escalate", [{ id: "EVIDENCE-1", evidence: "Essential cancellation contract unavailable" }]);
  expect((await settle(graph, "review", "escalate", report)).phase).toBe("complete");
  const persisted = JSON.stringify(status(graph));
  expect(persisted).toContain('"partial"');
  expect(persisted).toContain('"escalate"');
  expect(persisted).toContain("EVIDENCE-1");
});

test("two exhausted repair traversals stop the run without accepting a later pass", async () => {
  const graph = declarePattern("rust-specialist-loop");
  await start(graph);
  for (let round = 0; round < 3; round++) {
    await settle(graph, "change", "done", implementation(`fixture-r${round}`));
    const result = await settle(graph, "review", "revise", review(`fixture-r${round}`, "revise", [{ id: "ASYNC-1" }]));
    if (round === 2) expect(result).toMatchObject({ decision: "accepted", phase: "stopped", stop: {
      reason: "loop-exhausted", loop_group_id: "repair", traversals: 2, max_traversals: 2 } });
  }
  expect(graph.requests).toHaveLength(6);
  const refused = await settle(graph, "review", "pass", review("fixture-r2", "pass"));
  expect(refused.decision).toBeUndefined();
  expect(refused.refusals.length).toBeGreaterThan(0);
  expect(graph.requests).toHaveLength(6);
});
