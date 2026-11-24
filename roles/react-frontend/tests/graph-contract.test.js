import { afterEach, expect, test } from "vitest";
import { cpSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const roleDir = fileURLToPath(new URL("../", import.meta.url));
const runtime = resolve(process.env.ROLEBOX_ROOT);
const load = (path) => import(pathToFileURL(join(runtime, path)).href);
const { discoverRoles } = await load("src/loader/role-loader.ts");
const { resolveSkills } = await load("src/resolver/skill-resolver.ts");
const { resolveAllReferences } = await load("src/resolver/reference-resolver.ts");
const { parseGraphDeclarationV3 } = await load("src/graph/compiler/parse-declaration-v3.ts");
const { compileGraph } = await load("src/graph/compiler/compile.ts");
const { createGraphToolSet } = await load("src/graph/tools/graph-tools.ts");
const { engineStateDir } = await load("src/graph/persistence/paths.ts");
const { testHostCredentialIsolation } = await load("tests/graph/helpers/credential-isolation.ts");
const { makeTmpDir, removeTempDirs, openHost, NOW } = await load("tests/graph/helpers/host-graph-fixture.ts");
afterEach(removeTempDirs);

const protocol = readFileSync(join(roleDir, "references/graph-protocol.md"), "utf8");
const examples = [...protocol.matchAll(/^```json\s*\n([\s\S]*?)\n```/gm)];
expect(examples).toHaveLength(1);
const declaration = JSON.parse(examples[0][1]);

test("rolebox resolves the three workers with their distinct write and graph permissions", async () => {
  const directory = makeTmpDir("react-role-loader-");
  const installed = join(directory, "react-frontend");
  cpSync(roleDir, installed, { recursive: true });
  const role = (await discoverRoles(directory)).get("react-frontend");
  expect(role.mode).toBe("primary");
  expect(role.tools).toMatchObject({
    graph_declare: true, graph_status: true, graph_audit: true, graph_control: true,
    graph_submit_outcome: false,
  });
  const children = role.subagents.map((child) => child.name).sort();
  expect(children).toEqual(["change-applier", "source-tracer", "verification"]);
  for (const child of role.subagents) {
    const writes = child.name === "change-applier";
    expect(child.tools).toMatchObject({
      graph_declare: false, graph_status: false, graph_audit: false, graph_control: false,
      graph_submit_outcome: true, Write: writes, Edit: writes,
    });
  }
  for (const subject of [role, ...role.subagents]) {
    const root = subject === role ? installed : join(installed, "subagents", subject.name);
    const skills = subject.skills ?? [];
    const resolved = await resolveSkills(skills, root, join(directory, "absent-global-skills"));
    expect(resolved.map((skill) => skill.name).sort()).toEqual([...skills].sort());
  }
  const refs = await resolveAllReferences(installed, "role", role.references);
  expect(refs.map((ref) => ref.name)).toEqual(expect.arrayContaining(["graph-protocol", "source-evidence"]));
  expect(Object.fromEntries(declaration.nodes.map((node) => [node.id, node.agent]))).toEqual({
    source: "react-frontend--source-tracer",
    change: "react-frontend--change-applier",
    verify: "react-frontend--verification",
  });
});

function withoutSource() {
  const subset = structuredClone(declaration);
  subset.nodes = subset.nodes.filter((node) => node.id !== "source");
  subset.edges = subset.edges.filter((edge) => edge.from !== "source");
  subset.budget.max_executions = 4;
  for (const node of subset.nodes) {
    if (node.inputs) node.inputs = node.inputs.filter((input) => input.from !== "source");
  }
  return subset;
}

// The host schedules real attempts. The test supplies worker findings at the dispatch boundary.
async function start(plan) {
  const parsed = parseGraphDeclarationV3(plan);
  expect(parsed.ok, JSON.stringify(parsed.errors)).toBe(true);
  const compiled = compileGraph(parsed.declaration, { supportedValidators: [] });
  expect(compiled.kind, JSON.stringify(compiled.errors)).toBe("executable");
  const dir = makeTmpDir("react-role-graph-");
  const storeRoot = engineStateDir(dir);
  const requests = [];
  const tools = createGraphToolSet({
    stateDir: dir,
    credentialIsolation: testHostCredentialIsolation(storeRoot),
    outcomeNow: NOW,
    outcomeDispatch: (request) => { requests.push(request); },
  });
  const result = tools.graph_declare({ declaration: plan });
  expect(result.graph_id).toBe(plan.name);
  const host = openHost({ dir, storeRoot, deliveries: requests });
  try {
    await host.recoverDeclaredGraphs();
  } finally {
    host.close();
  }
  async function submit(node, outcome, data) {
    const request = requests.at(-1);
    expect(request?.nodeId).toBe(node);
    const receipt = await tools.graph_submit_outcome({
      graph_id: result.graph_id, node_id: node, outcome_id: outcome,
      credential: request.credential, data,
    });
    expect(receipt.decision, JSON.stringify(receipt.refusals)).toBe("accepted");
    return receipt;
  }
  return { requests, submit };
}

function expectInput(request, node, outcome, data) {
  expect(request.inputs).toContainEqual(expect.objectContaining({
    from: node, outcome, payload: { kind: "value", value: data },
  }));
}

test("source evidence and review feedback reach the intended worker, including the repaired revision", async () => {
  const { requests, submit } = await start(declaration);
  const source = { version: "locked", finding: "The installed router supports this route." };
  const firstChange = { paths: ["src/Results.tsx"], attempt: 1 };
  const feedback = { finding: "Back navigation loses the selected filter." };
  const repair = { paths: ["src/Results.tsx"], attempt: 2 };
  await submit("source", "resolved", source);
  expectInput(requests.at(-1), "source", "resolved", source);
  await submit("change", "ready", firstChange);
  expectInput(requests.at(-1), "change", "ready", firstChange);
  await submit("verify", "revise", feedback);
  expectInput(requests.at(-1), "source", "resolved", source);
  expectInput(requests.at(-1), "verify", "revise", feedback);
  await submit("change", "ready", repair);
  expectInput(requests.at(-1), "change", "ready", repair);
  expect((await submit("verify", "pass", { result: "Back navigation retains the filter." })).phase).toBe("complete");
  expect(requests.map((r) => r.nodeId)).toEqual(["source", "change", "verify", "change", "verify"]);
});

test("implementation without a source question starts directly and stops after one repair", async () => {
  const { requests, submit } = await start(withoutSource());
  await submit("change", "ready", { attempt: 1 });
  await submit("verify", "revise", { finding: "Tab misses the close button." });
  await submit("change", "ready", { attempt: 2 });
  const receipt = await submit("verify", "revise", { finding: "Tab still misses the close button." });
  expect(receipt.phase).toBe("stopped");
  expect(receipt.stop).toMatchObject({ reason: "loop-exhausted", max_traversals: 1 });
  expect(requests.map((r) => r.nodeId)).toEqual(["change", "verify", "change", "verify"]);
});

test("blocked source evidence ends the run before any write is scheduled", async () => {
  const { requests, submit } = await start(declaration);
  const receipt = await submit("source", "blocked", { missing: "The deployed dependency version." });
  expect(receipt.phase).toBe("stopped");
  expect(receipt.stop.reason).toBe("unreachable-pending-node");
  expect(requests.map((r) => r.nodeId)).toEqual(["source"]);
});

test.each([["source", "resolved"], ["verify", "revise"]])(
  "a standalone %s returns its finding directly without scheduling a writer",
  async (nodeId, outcome) => {
    const subset = structuredClone(declaration);
    const node = subset.nodes.find((entry) => entry.id === nodeId);
    delete node.inputs;
    delete node.join;
    subset.nodes = [node];
    subset.edges = [];
    delete subset.loop_groups;
    subset.budget.max_executions = 1;
    const { requests, submit } = await start(subset);
    const receipt = await submit(nodeId, outcome, { finding: "Read-only evidence for the lead." });
    expect(receipt.phase).toBe("complete");
    expect(requests.map((r) => r.nodeId)).toEqual([nodeId]);
  },
);
