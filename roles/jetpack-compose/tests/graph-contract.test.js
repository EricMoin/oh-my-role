// Run: ROLEBOX_ROOT=/path/to/rolebox bun test --isolate roles/jetpack-compose/tests/graph-contract.test.js
// Real role loader and graph engine; scripted workers do not execute a model or publish.
import { test, expect, afterEach } from "bun:test";
import { mkdtempSync, cpSync, rmSync } from "node:fs";
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

const resources = [];
afterEach(async () => {
  for (const { tools, id, directory } of resources.splice(0)) {
    if (tools) await tools.graph_cancel({ graph_id: id });
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
});

class Workers {
  calls = [];
  prompts = new Map();
  upstream = new Map();
  tasks = new Map();
  listeners = new Map();
  constructor(script = () => ({ type: "answer" })) { this.script = script; }
  async executeNode(node) {
    const ordinal = this.calls.filter((id) => id === node.nodeId).length;
    this.calls.push(node.nodeId);
    this.prompts.set(node.nodeId, node.prompt);
    this.upstream.set(node.nodeId, structuredClone(node.upstreamResults));
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
function setup(pattern, script) {
  const workers = new Workers(script);
  const directory = mkdtempSync(join(tmpdir(), "compose-graph-contract-"));
  const tools = createGraphToolSet({ dispatch: workers, directory,
    nodeStaleTimeoutMs: 0, sweeperIntervalMs: 0 });
  const { graph_id: id } = tools.graph_create({ name: "compose-review" });
  resources.push({ tools, id, directory });
  for (const node of pattern.nodes) tools.graph_add_node({ graph_id: id, ...node });
  for (const edge of pattern.edges) tools.graph_add_edge({ graph_id: id, ...edge });
  for (const loop of pattern.loop_groups ?? []) tools.graph_add_loop({ graph_id: id, ...loop });
  const status = () => JSON.parse(tools.graph_status({ graph_id: id, format: "json", include_loops: true, stream: true, max_chars: 100000 }));
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
  const directory = mkdtempSync(join(tmpdir(), "compose-role-loader-"));
  resources.push({ directory });
  cpSync(roleDir, join(directory, "jetpack-compose"), { recursive: true });
  const role = (await discoverRoles(directory)).get("jetpack-compose");
  expect(role.graph.orchestration).toBe("graph_v2");
  expect(role.subagents.map((child) => child.name.toLowerCase().replaceAll(" ", "-")).sort()).toEqual(["architecture-reviewer", "performance-reviewer", "source-tracer", "test-quality-reviewer", "ui-layout-reviewer"]);
  for (const [config, path] of [[role, join(directory, "jetpack-compose")],
    ...role.subagents.map((child) => [child, join(directory, "jetpack-compose/subagents", child.name.toLowerCase().replaceAll(" ", "-"))])]) {
    expect(config.prompt.length).toBeGreaterThan(50);
    const skills = await resolveSkills(config.skills, path, join(directory, "absent-global-skills"));
    expect(skills.map((skill) => skill.name).sort()).toEqual([...config.skills].sort());
  }
});


const reviewer = (id, agent = "architecture-reviewer") => ({
  id, agent: `jetpack-compose--${agent}`,
  prompt: "Review snapshot v1 read-only; report evidence then signal answer with assessment."
});

test("independent reviewers start together; completion preserves negative evidence", async () => {
  const run = setup({ nodes: [reviewer("architecture"), reviewer("tests", "test-quality-reviewer")], edges: [] },
    (id) => ({ type: "answer", delay: 40, payload: {
      assessment: id === "tests" ? "fail" : "pass",
      observations: id === "tests" ? ["private helper widened solely for tests"] : []
    } }));
  await run.tools.graph_run({ graph_id: run.id, dry_run: true });
  expect(run.workers.calls).toEqual([]);
  await run.tools.graph_run({ graph_id: run.id });
  await until(() => run.workers.calls.length === 2);
  expect([...run.workers.tasks.values()].every((task) => task.status === "running")).toBe(true);
  await until(() => run.status().phase === "complete");
  expect(run.workers.calls.sort()).toEqual(["architecture", "tests"]);
  // Settled graph is not acceptance: the public signal stream retains the failed assessment.
  expect(JSON.stringify(run.status())).toContain("private helper widened solely for tests");
  expect(JSON.stringify(run.status())).toContain('"assessment":"fail"');
});

test("a real evidence dependency passes a patch as data, without rewriting the brief", async () => {
  const run = setup({ nodes: [reviewer("source", "source-tracer"), reviewer("review")],
    edges: [{ from: "source", to: "review", type: "on_signal", signal_filter: ["answer"] }] },
    (id) => id === "source" ? { type: "answer", delay: 30, payload: {
      assessment: "pass", observations: ["resolved lifecycle evidence"],
      engineering_state_patch: { snapshot: "proposed-v2" }
    } } : { type: "answer", payload: { assessment: "pass" } });
  await run.tools.graph_run({ graph_id: run.id });
  await until(() => run.workers.count("source") === 1);
  expect(run.workers.count("review")).toBe(0);
  await until(() => run.status().phase === "complete");
  expect(run.workers.calls).toEqual(["source", "review"]);
  expect(run.workers.prompts.get("review")).toContain("snapshot v1");
  expect(run.workers.prompts.get("review")).not.toContain("proposed-v2");
  expect(JSON.stringify([...run.workers.upstream.get("review")])).toContain("proposed-v2");
});

test("source escalation does not activate a dependent acceptance review", async () => {
  const run = setup({ nodes: [reviewer("source", "source-tracer"), reviewer("review")],
    edges: [{ from: "source", to: "review", type: "on_signal", signal_filter: ["answer"] }] },
    () => ({ type: "escalate", payload: { reason: "resolved source unavailable" } }));
  await run.tools.graph_run({ graph_id: run.id });
  await until(() => run.status().phase === "complete");
  expect(run.workers.calls).toEqual(["source"]);
  expect(run.status().nodes.find((node) => node.node_id === "source").status).not.toBe("completed");
});
