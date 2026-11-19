import { expect, test } from "vitest";
import { cpSync, globSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.env.ROLEBOX_ROOT) throw new Error("Set ROLEBOX_ROOT to a rolebox checkout.");
const runtime = resolve(process.env.ROLEBOX_ROOT);
const runtimeRequire = createRequire(join(runtime, "package.json"));
const { load: readYaml } = runtimeRequire("js-yaml");
const { marked } = runtimeRequire("marked");
const loadRuntime = (path) => import(pathToFileURL(join(runtime, path)).href);
const { discoverRoles } = await loadRuntime("src/loader/role-loader.ts");
const { resolveAllRoles } = await loadRuntime("src/resolver/orchestrator.ts");
const { parseGraphDeclarationV3 } = await loadRuntime("src/graph/compiler/parse-declaration-v3.ts");
const { compileGraph } = await loadRuntime("src/graph/compiler/compile.ts");

const roleId = "swift-developer";
const roleDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const childIds = [
  "architecture-reviewer", "device-verifier", "performance-reviewer",
  "release-reviewer", "source-tracer", "test-reviewer", "ui-reviewer",
].map((slug) => `${roleId}--${slug}`);

const sharedGateReferences = new Map([
  ["architecture-reviewer", "app-architecture"],
  ["device-verifier", "device-verification"],
  ["release-reviewer", "platform-integrations"],
  ["ui-reviewer", "native-interaction"],
]);

test("the installed role resolves both entry points and every specialist's local skills and references", async () => {
  const directory = mkdtempSync(join(tmpdir(), "swift-role-contract-"));
  try {
    const installed = join(directory, roleId);
    cpSync(roleDir, installed, { recursive: true });
    const configs = await discoverRoles(directory);
    const [lead] = await resolveAllRoles(configs, {
      roleboxDir: directory,
      globalSkillsDir: join(directory, "absent-skills"),
      configDir: join(directory, "absent-config"),
      builtinDir: join(runtime, "functions"),
      roleFunctionsMap: new Map(),
    });
    expect(lead.id).toBe(roleId);
    expect(lead.config.name).toBe("Swift Developer");
    expect(lead.config.mode).toBe("primary");
    expect(lead.auto_activate).toContain("engineer");
    expect(lead.functions.map((fn) => fn.name)).toEqual(expect.arrayContaining(["engineer", "research"]));
    expect(lead.config.tools).toMatchObject({
      graph_declare: true, graph_control: true, graph_status: true, graph_audit: true,
      graph_submit_outcome: false, Write: true, Edit: true,
    });
    expect(lead.subagents.map((child) => child.id).sort()).toEqual(childIds);

    for (const agent of [lead, ...lead.subagents]) {
      const child = agent.id !== roleId;
      const base = child ? join(installed, "subagents", agent.id.split("--")[1]) : installed;
      expect(agent.skills.length, agent.id).toBeGreaterThan(0);
      expect(agent.skills.map((skill) => skill.name).sort()).toEqual([...agent.config.skills].sort());
      for (const skill of agent.skills) {
        expect(skill.filePath).toBe(join(base, "skills", skill.name, "SKILL.md"));
        expect(skill.description.trim()).not.toBe("");
      }
      const references = new Map(agent.references.map((ref) => [ref.name, ref]));
      expect(resolve(references.get("schemas").filePath)).toBe(join(installed, "references", "schemas.md"));
      // A gate can use a shared guide by name only if the worker's own bundle exposes it.
      const guide = child && sharedGateReferences.get(agent.id.split("--")[1]);
      if (guide) {
        expect(references.get(guide)?.filePath, agent.id).toBe(join(installed, "references", `${guide}.md`));
      }
      // Child references can come from the parent even if the loader drops the child's reference config.
      const manifest = readYaml(readFileSync(join(base, "role.yaml"), "utf8"));
      for (const [name, ref] of Object.entries(manifest.references ?? {})) {
        const entry = references.get(name);
        const label = `${agent.id}: ${name}`;
        expect(entry, label).toBeDefined();
        expect(resolve(entry.filePath), label).toBe(
          resolve(base, typeof ref === "string" ? ref : ref.path),
        );
        if (ref.description) expect(entry.description, label).toBe(ref.description);
      }
      for (const { name, description } of agent.references) {
        const label = `${agent.id}: ${name}`;
        expect(description.trim(), label).not.toBe("");
        // Without authored metadata the runtime repeats the title in the discovery card.
        expect(description.trim().toLowerCase(), label).not.toBe(name.replace(/[-_]/g, " ").toLowerCase());
      }
      if (child) {
        expect(agent.config.tools).toMatchObject({
          graph_declare: false, graph_control: false, graph_status: false, graph_audit: false,
          graph_submit_outcome: true, Write: false, Edit: false,
        });
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("relative Markdown resources resolve from the document that links them inside the role", () => {
  const broken = [];
  for (const path of globSync("**/*.md", { cwd: roleDir })) {
    const file = join(roleDir, path);
    const tokens = marked.lexer(readFileSync(file, "utf8"));
    marked.walkTokens(tokens, (token) => {
      if (token.type !== "link" && token.type !== "image") return;
      const href = token.href;
      if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(href)) return;

      const target = fileURLToPath(new URL(href, pathToFileURL(file)));
      const fromRole = relative(roleDir, target);
      if (fromRole === ".." || fromRole.startsWith(`..${sep}`) || !statSync(target, { throwIfNoEntry: false })?.isFile()) {
        broken.push(`${path} -> ${href}`);
      }
    });
  }
  expect(broken).toEqual([]);
});

test("the shipped declaration compiles the source report as the architecture review's input", () => {
  const protocol = readFileSync(join(roleDir, "references", "graph-protocol.md"), "utf8");
  const blocks = [...protocol.matchAll(/^```json[^\S\r\n]*\r?\n([\s\S]*?)\r?\n```\s*$/gm)];
  expect(blocks).toHaveLength(1);
  const declaration = JSON.parse(blocks[0][1]);
  const parsed = parseGraphDeclarationV3(declaration);
  expect(parsed.ok, JSON.stringify(parsed.errors)).toBe(true);
  const compiled = compileGraph(parsed.declaration, { supportedValidators: [] });
  expect(compiled.ok, JSON.stringify(compiled.errors)).toBe(true);
  expect(compiled.kind).toBe("executable");
  expect(compiled.plan.declarationVersion).toBe(3);

  expect(declaration.nodes).toHaveLength(2);
  const source = declaration.nodes.find((node) => node.agent === `${roleId}--source-tracer`);
  const review = declaration.nodes.find((node) => node.agent === `${roleId}--architecture-reviewer`);
  expect(source.outcomes.map(({ id }) => id)).toEqual(["report"]);
  expect(review.outcomes.map(({ id }) => id).sort()).toEqual(["escalate", "pass", "revise"]);
  expect(review.join).toEqual({ strategy: "all" });
  expect(review.inputs).toEqual([{ from: source.id, outcome: "report" }]);
  expect(declaration.edges).toEqual([{ from: source.id, to: review.id, outcome: "report" }]);
  expect(declaration.budget.max_executions).toBeGreaterThanOrEqual(declaration.nodes.length);
  for (const node of declaration.nodes) {
    expect(node.completion.mode).toBe("explicit");
    expect(node.budget.timeout_ms).toBeGreaterThan(0);
  }
});
