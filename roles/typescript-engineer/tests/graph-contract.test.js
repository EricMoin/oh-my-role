// Run: ROLEBOX_ROOT=/path/to/rolebox bun test --isolate roles/typescript-engineer/tests/graph-contract.test.js
// Real role loader and graph engine; scripted workers do not execute a model or publish.
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, cpSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.env.ROLEBOX_ROOT) throw new Error("Set ROLEBOX_ROOT to the rolebox checkout to validate.");
const root = resolve(process.env.ROLEBOX_ROOT);
const load = (path) => import(pathToFileURL(join(root, path)).href);
const { createGraphToolSet } = await load("src/graph/tools/graph-tools.ts");
const { discoverRoles } = await load("src/loader/role-loader.ts");
const { resolveSkills } = await load("src/resolver/skill-resolver.ts");
const roleDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const patterns = JSON.parse(readFileSync(join(roleDir, "skills/typescript-graph-workflow/references/graph-patterns.json"), "utf8"));
const resources = [];
afterEach(async () => {
  for (const { tools, id, directory } of resources.splice(0)) {
    if (tools) await tools.graph_cancel({ graph_id: id });
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

class Workers {
  calls = [];
  tasks = new Map();
  listeners = new Map();
  constructor(script = () => ({ type: "answer" })) { this.script = script; }
  async executeNode(node) {
    const ordinal = this.calls.filter((id) => id === node.nodeId).length;
    this.calls.push(node.nodeId);
    const signal = this.script(node.nodeId, ordinal);
    const id = `task-${this.calls.length}`;
    const task = { id, sessionId: id, parentSessionId: "test", depth: 1, status: "running",
      agent: node.agent, prompt: node.prompt, startedAt: new Date(),
      progress: { lastUpdate: new Date(), toolCalls: 0 }, priority: 0,
      terminatingSignal: signal };
    this.tasks.set(id, task);
    setTimeout(() => {
      task.status = signal.type === "need_approval" ? "need_approval" : "completed";
      this.listeners.get(id)?.(id, task.status);
    }, signal.delay ?? 0);
    return task;
  }
  onTaskTerminated(id, callback) { this.listeners.set(id, callback); return callback; }
  removeTaskTerminatedListener(id, callback) {
    if (this.listeners.get(id) === callback) this.listeners.delete(id);
  }
  getTask(id) { return this.tasks.get(id); }
  count(id) { return this.calls.filter((value) => value === id).length; }
}
function setup(name, script) {
  const workers = new Workers(script);
  const directory = mkdtempSync(join(tmpdir(), "typescript-graph-contract-"));
  const tools = createGraphToolSet({ dispatch: workers, directory,
    nodeStaleTimeoutMs: 0, sweeperIntervalMs: 0 });
  const pattern = structuredClone(patterns.find((item) => item.name === name));
  const { graph_id: id } = tools.graph_create({ name });
  resources.push({ tools, id, directory });
  for (const node of pattern.nodes) tools.graph_add_node({ graph_id: id, ...node });
  for (const edge of pattern.edges) tools.graph_add_edge({ graph_id: id, ...edge });
  for (const loop of pattern.loop_groups ?? []) tools.graph_add_loop({ graph_id: id, ...loop });
  const status = () => JSON.parse(tools.graph_status({ graph_id: id, format: "json", include_loops: true }));
  return { tools, id, workers, status };
}
async function until(predicate) {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("Graph did not reach expected state");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

test("rolebox loads the role, child prompts and every declared skill", async () => {
  const directory = mkdtempSync(join(tmpdir(), "typescript-role-loader-"));
  resources.push({ directory });
  cpSync(roleDir, join(directory, "typescript-engineer"), { recursive: true });
  const role = (await discoverRoles(directory)).get("typescript-engineer");
  expect(role.graph.orchestration).toBe("graph_v2");
  expect(role.subagents.map((child) => child.name).sort()).toEqual(["change-applier", "verification"]);
  for (const [config, path] of [[role, join(directory, "typescript-engineer")],
    ...role.subagents.map((child) => [child, join(directory, "typescript-engineer/subagents", child.name)])]) {
    expect(config.prompt.length).toBeGreaterThan(50);
    const skills = await resolveSkills(config.skills, path, join(directory, "absent-global-skills"));
    expect(skills.map((skill) => skill.name).sort()).toEqual([...config.skills].sort());
  }
});

for (const pattern of patterns) {
  test(`${pattern.name} topology passes real engine dry-run`, async () => {
    const { tools, id, workers } = setup(pattern.name);
    await tools.graph_run({ graph_id: id, dry_run: true });
    expect(workers.calls).toEqual([]);
  });
}

test("mechanical edit runs once; standard review requests one repair then converges", async () => {
  const simple = setup("mechanical");
  await simple.tools.graph_run({ graph_id: simple.id });
  await until(() => simple.status().phase === "complete");
  expect(simple.workers.calls).toEqual(["change"]);
  const standard = setup("standard", (id, round) => id === "review" && round === 0
    ? { type: "revise_needed", payload: { items: [{ id: "zero", problem: "zero is rejected" }] } }
    : { type: "answer" });
  await standard.tools.graph_run({ graph_id: standard.id });
  await until(() => standard.status().phase === "complete");
  expect(standard.workers.calls).toEqual(["change", "review", "change", "review"]);
});

test("fan-in waits for negative evidence, repairs once, and recollects both branches", async () => {
  const run = setup("expanded", (id, round) => {
    if (id === "consumer" && round === 0) return { type: "answer", delay: 25,
      payload: { assessment: "fail", observations: ["declaration missing from tarball"] } };
    if (id === "review" && round === 0) return { type: "revise_needed",
      payload: { items: [{ id: "missing-types", problem: "declaration missing" }] } };
    return { type: "answer" };
  });
  await run.tools.graph_run({ graph_id: run.id });
  await until(() => run.workers.count("types") === 1 && run.workers.count("consumer") === 1);
  expect(run.workers.count("review")).toBe(0);
  expect(run.workers.count("change")).toBe(1);
  await until(() => run.status().phase === "complete");
  for (const id of ["change", "types", "consumer", "review"]) expect(run.workers.count(id)).toBe(2);
});

test("exhausted repair loop settles with an error, not a passing review", async () => {
  const run = setup("standard", (id, round) => id === "review"
    ? { type: "revise_needed", payload: { items: [{ id: `failure-${round}` }] } }
    : { type: "answer" });
  await run.tools.graph_run({ graph_id: run.id });
  await until(() => run.status().phase === "complete");
  expect(run.workers.count("change")).toBe(3);
  expect(run.status().nodes.find((node) => node.node_id === "review").error).toContain("max_traversals");
});

for (const action of ["approve", "reject"]) {
  test(`approval ${action} gates the separate external-action node`, async () => {
    const run = setup("approval", (id) => id === "proposal"
      ? { type: "need_approval", payload: { action: "publish tested artifact", target: "test-only" } }
      : { type: "answer" });
    await run.tools.graph_run({ graph_id: run.id });
    await until(() => run.status().nodes.some((node) => node.node_id === "proposal" && node.status === "blocked"));
    expect(run.workers.count("publish")).toBe(0);
    await run.tools.graph_approve({ graph_id: run.id, node_id: "proposal", action, reason: "test decision" });
    await until(() => run.status().phase === "complete");
    expect(run.workers.count("proposal")).toBe(1);
    expect(run.workers.count("publish")).toBe(action === "approve" ? 1 : 0);
  });
}

test("API candidates converge before writing and stay outside implementation repairs", async () => {
  const run = setup("api-design", (id, round) => {
    if (id === "candidate-b") return { type: "answer", delay: 25 };
    if (id === "review" && round === 0) return { type: "revise_needed",
      payload: { items: [{ id: "cleanup", problem: "selected lifetime contract not implemented" }] } };
    return { type: "answer" };
  });
  await run.tools.graph_run({ graph_id: run.id });
  await until(() => run.workers.count("candidate-a") === 1 && run.workers.count("candidate-b") === 1);
  expect(run.workers.count("choose")).toBe(0);
  expect(run.workers.count("change")).toBe(0);
  await until(() => run.status().phase === "complete");
  for (const id of ["candidate-a", "candidate-b", "choose"]) expect(run.workers.count(id)).toBe(1);
  for (const id of ["change", "review"]) expect(run.workers.count(id)).toBe(2);
  expect(run.workers.calls.indexOf("choose")).toBeLessThan(run.workers.calls.indexOf("change"));
});

test("unresolved API selection prevents production implementation", async () => {
  const run = setup("api-design", (id) => id === "choose"
    ? { type: "escalate", payload: { reason: "required cancellation semantics remain unresolved" } }
    : { type: "answer" });
  await run.tools.graph_run({ graph_id: run.id });
  await until(() => run.status().phase === "complete");
  expect(run.workers.count("choose")).toBe(1);
  expect(run.workers.count("change")).toBe(0);
  expect(run.workers.count("review")).toBe(0);
});
