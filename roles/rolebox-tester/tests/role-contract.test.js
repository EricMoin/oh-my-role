// Run: ROLEBOX_ROOT=/path/to/rolebox node scripts/test-runtime-contracts.mjs roles/rolebox-tester/tests/role-contract.test.js
//
// This is the deterministic, model-free contract test for the rolebox-tester 7.0.0
// tree. It drives the real rolebox loader/resolver from ROLEBOX_ROOT, the real v3
// declaration front end and the real graph compiler over the real files on disk. It
// copies the role into a temp directory before loading it, deletes every temp
// directory in afterEach, never writes inside this repository and never calls a
// model. The catalog, the module bodies, the shipped declarations and the role
// manifests are the same objects the runtime consumes, so documentation and contract
// cannot drift silently.
import { test, expect, afterEach } from "vitest";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.env.ROLEBOX_ROOT) {
  throw new Error(
    "Set ROLEBOX_ROOT to the rolebox checkout to validate, for example " +
      "ROLEBOX_ROOT=/path/to/rolebox node scripts/test-runtime-contracts.mjs " +
      "roles/rolebox-tester/tests/role-contract.test.js",
  );
}
const root = resolve(process.env.ROLEBOX_ROOT);

/** Load one real module from the rolebox checkout by absolute path. */
async function engine(path) {
  try {
    return await import(pathToFileURL(join(root, path)).href);
  } catch (error) {
    throw new Error(
      `role-contract: cannot load ${path} from ROLEBOX_ROOT=${root}: ` +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

const { discoverRoles } = await engine("src/loader/role-loader.ts");
const { resolveAllRoles } = await engine("src/resolver/orchestrator.ts");
const { parseGraphDeclarationV3 } = await engine(
  "src/graph/compiler/parse-declaration-v3.ts",
);
const { compileGraph } = await engine("src/graph/compiler/compile.ts");
const yamlModule = await engine("node_modules/js-yaml/index.js");
const yaml = yamlModule.default ?? yamlModule;

const roleDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(roleDir, "..", "..");
const registryPath = join(repoRoot, "registry.yaml");
const catalogPath = join(roleDir, "references", "test-catalog.md");
const graphBodiesPath = join(roleDir, "references", "graph-v3-tests.md");

// ── Temp directories ────────────────────────────────────────────────────────

const tempDirs = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
    // The test owns these directories: a surviving one is a leak, not a pass.
    expect(existsSync(dir)).toBe(false);
  }
});

function tempDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

// ── The loaded role ─────────────────────────────────────────────────────────

/** Copy the real role tree into a temp rolebox dir and resolve it like a host does. */
async function loadTester() {
  const directory = tempDir("rolebox-tester-contract-");
  const roleRoot = join(directory, "rolebox-tester");
  cpSync(roleDir, roleRoot, { recursive: true });

  const configs = await discoverRoles(directory);
  expect([...configs.keys()]).toEqual(["rolebox-tester"]);

  const resolved = await resolveAllRoles(configs, {
    roleboxDir: directory,
    globalSkillsDir: join(directory, "absent-global-skills"),
    configDir: join(directory, "absent-config"),
    builtinDir: join(root, "functions"),
    roleFunctionsMap: new Map(),
  });
  const role = resolved.find((entry) => entry.id === "rolebox-tester");
  if (role === undefined) {
    throw new Error(
      `resolveAllRoles did not return rolebox-tester (returned: ${resolved
        .map((entry) => entry.id)
        .join(", ")})`,
    );
  }
  return { directory, roleRoot, configs, role };
}

/** The loader keeps each manifest's display name; its directory is the slug. */
const childSlug = (child) =>
  (child.config?.name ?? child.name).toLowerCase().replace(/\s+/g, "-");

/** Every resolved subagent, including nested descendants. */
function allSubagents(role) {
  const found = [];
  const walk = (children) => {
    for (const child of children) {
      found.push(child);
      walk(child.subagents ?? []);
    }
  };
  walk(role.subagents);
  return found;
}

/** Recursively list every regular file under one directory. */
function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

/** Extract the `### Test <id>` heading ids from one body file, in file order. */
function bodyTestIds(text) {
  return [...text.matchAll(/^### Test ([0-9]+[a-z]?)\b/gm)].map(
    (match) => match[1],
  );
}

// ── The shipped contracts, pinned from the role manifests ───────────────────

const DECLARED_REFERENCES = [
  "asset-task-tests",
  "computer-browse-tests",
  "core-tests",
  "graph-v3-tests",
  "host-capability-matrix",
  "lsp-tests",
  "runtime-tests",
  "session-memory-web-tests",
  "team-tests",
  "test-catalog",
  "test-reference",
  "tool-tests",
];

const DECLARED_FUNCTIONS = [
  "test-all",
  "transform",
  "loop",
  "state-machine",
  "observe-probe",
  "broken-dep",
  "signal-probe",
];

const RESOLVED_FUNCTIONS = [
  "plan",
  "execute",
  "loop",
  "test-all",
  "transform",
  "state-machine",
  "observe-probe",
  "broken-dep",
  "signal-probe",
];

const DECLARER_TOOLS = {
  graph_declare: true,
  graph_control: true,
  graph_status: true,
  graph_audit: true,
  graph_submit_outcome: false,
  bash: true,
  write: true,
  edit: true,
};

const TOP_LEVEL_SLUGS = [
  "checker",
  "echo",
  "nester",
  "outcome-worker",
  "processor",
  "restricted",
  "runner-loop",
  "runner-statemachine",
  "sleeper",
  "validator",
];

const DIRECTORY_SLUGS = [
  "nester",
  "outcome-worker",
  "restricted",
  "runner-loop",
  "runner-statemachine",
  "validator",
];

const INLINE_SLUGS = ["checker", "echo", "processor", "sleeper"];

const RETIRED_SUBAGENT_SLUGS = [
  "runner-asset",
  "runner-core",
  "runner-graph",
  "runner-lsp",
  "runner-memory",
  "runner-permission",
  "runner-session",
  "runner-task",
  "runner-tools",
  "runner-tui",
  "runner-web",
  "signal-answer",
  "signal-approve",
  "signal-escalate",
  "signal-revise",
];

const EXPECTED_MODULE_COUNTS = {
  "core-prompt": 10,
  "tools-hashline": 15,
  session: 8,
  lsp: 32,
  memory: 12,
  "statemachine-signal": 14,
  loop: 4,
  task: 7,
  asset: 17,
  web: 4,
  permission: 2,
  "graph-v3": 32,
  "runtime-hooks-cli": 7,
  team: 10,
  computer: 2,
  browse: 2,
};

// Bodies that own more than one module's `### Test` sections, with the union size
// the catalog arithmetic requires (tools-hashline 15 + permission 2, and so on).
const MULTI_MODULE_BODIES = {
  "references/tool-tests.md": {
    modules: ["permission", "tools-hashline"],
    headings: 17,
  },
  "references/session-memory-web-tests.md": {
    modules: ["memory", "session", "web"],
    headings: 24,
  },
  "references/asset-task-tests.md": {
    modules: ["asset", "task"],
    headings: 24,
  },
  "references/computer-browse-tests.md": {
    modules: ["browse", "computer"],
    headings: 4,
  },
};

const SINGLE_MODULE_BODIES = [
  "references/core-tests.md",
  "references/graph-v3-tests.md",
  "references/lsp-tests.md",
  "references/runtime-tests.md",
  "references/team-tests.md",
  "subagents/runner-loop/prompt.md",
  "subagents/runner-statemachine/prompt.md",
];

// The 46 ids retired from the v6 catalog. The catalog must declare exactly this
// set, and no retired id may be reused as a `### Test` heading anywhere in the role.
const RETIRED_IDS = [
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "32",
  "33",
  "34",
  "65",
  "66",
  "68",
  "72",
  "84b",
  "84c",
  "84d",
  "84e",
  "98",
  "99",
  "104",
  "105",
  "109",
  "119a",
  "121",
  "143",
  "144",
  "145",
  "147",
  "148",
  "149",
  "163",
  "164",
  "165",
  "166",
  "167",
  "168",
  "169",
  "170",
  "171",
  "173",
  "174",
  "175",
  "176",
  "177",
  "178",
];

function readCatalog(roleRoot) {
  const text = readFileSync(join(roleRoot, "references", "test-catalog.md"), "utf8");
  const blocks = [...text.matchAll(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/g)];
  expect(blocks).toHaveLength(1);
  try {
    return JSON.parse(blocks[0][1]);
  } catch (error) {
    throw new Error(
      `${catalogPath}: the fenced json catalog block is not valid JSON: ` +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

// ── (a) Loader, resolver, manifest and roster ───────────────────────────────

test("the real loader resolves the v7 primary, its references, functions and fixtures", async () => {
  const { roleRoot, role } = await loadTester();

  // Mode, version and the absent legacy graph: this is a declared-runs role, so
  // the role manifest itself must not carry a graph configuration block.
  expect(role.config.mode).toBe("primary");
  expect(role.config.version).toBe("7.0.0");
  expect(role.config.graph).toBeUndefined();
  expect(role.config.prompt_file).toBe("PROMPT.md");
  expect(role.prompt.length).toBeGreaterThan(1000);

  // The exact five-tool declarer split, with lowercase native tool keys. The
  // declaring primary never holds the worker submission entry.
  expect(role.config.tools).toEqual(DECLARER_TOOLS);
  for (const [name, granted] of Object.entries(DECLARER_TOOLS)) {
    expect(role.config.tools[name], name).toBe(granted);
  }
  // The uppercase spelling of the native tools is not the v7 contract.
  for (const name of ["Bash", "Write", "Edit"]) {
    expect(role.config.tools[name], name).toBeUndefined();
  }

  // The manifest declares the seven role-local functions plus the builtin trio.
  expect(role.config.functions).toEqual(DECLARED_FUNCTIONS);
  expect(role.config.disable_functions).toBeUndefined();

  const functions = role.functions;
  expect(functions.map((fn) => fn.name).sort()).toEqual(
    [...RESOLVED_FUNCTIONS].sort(),
  );
  expect(functions).toHaveLength(RESOLVED_FUNCTIONS.length);
  const loopFunctions = functions.filter((fn) => fn.name === "loop");
  expect(loopFunctions).toHaveLength(1);
  expect(loopFunctions[0].source).toBe("built-in");
  expect(loopFunctions[0].filePath).toBe(join(root, "functions", "loop.md"));
  expect(functions.map((fn) => fn.name)).not.toContain("memory");
  for (const name of ["plan", "execute"]) {
    const fn = functions.find((entry) => entry.name === name);
    expect(fn, name).toBeDefined();
    expect(fn.source).toBe("built-in");
    expect(fn.filePath).toBe(join(root, "functions", `${name}.md`));
  }
  for (const name of DECLARED_FUNCTIONS.filter(
    (entry) => entry !== "loop",
  )) {
    const fn = functions.find((entry) => entry.name === name);
    expect(fn, name).toBeDefined();
    expect(fn.source).toBe("role-local");
    expect(existsSync(fn.filePath)).toBe(true);
    expect(resolve(fn.filePath)).toBe(resolve(join(roleRoot, "functions", `${name}.md`)));
  }

  // All twelve declared references resolve to readable files on disk.
  expect(Object.keys(role.config.references ?? {}).sort()).toEqual(
    DECLARED_REFERENCES,
  );
  const resolvedByName = new Map(
    role.references.map((reference) => [reference.name, reference]),
  );
  for (const name of DECLARED_REFERENCES) {
    const declared = role.config.references[name];
    expect(typeof declared.path, name).toBe("string");
    const file = join(roleRoot, declared.path);
    expect(existsSync(file), name).toBe(true);
    const resolved = resolvedByName.get(name);
    expect(resolved, name).toBeDefined();
    expect(resolved.relativePath).toBe(declared.path);
    expect(existsSync(resolved.filePath), name).toBe(true);
    expect(readFileSync(resolved.filePath, "utf8").length).toBeGreaterThan(0);
  }
  // The declared count is exactly twelve; the skill contributes its own reference.
  expect(role.references).toHaveLength(DECLARED_REFERENCES.length + 1);

  // The test-skill and the skill-specific reference resolve together.
  expect(role.skills).toHaveLength(1);
  const skill = role.skills[0];
  expect(skill.name).toBe("test-skill");
  expect(existsSync(skill.filePath)).toBe(true);
  expect(readFileSync(skill.filePath, "utf8")).toContain("SKILL_LOAD_SUCCESS");
  expect(skill.references).toHaveLength(1);
  const skillReference = skill.references[0];
  expect(skillReference.name).toBe("skill-ref");
  expect(existsSync(skillReference.filePath)).toBe(true);
  expect(readFileSync(skillReference.filePath, "utf8")).toContain(
    "SKILL_REFERENCE_OK",
  );
  const testReference = resolvedByName.get("test-reference");
  expect(readFileSync(testReference.filePath, "utf8")).toContain(
    "REFERENCE_LOAD_SUCCESS",
  );

  // Ten top-level entries: four inline fixtures and six directory subagents.
  expect(role.config.subagents).toHaveLength(TOP_LEVEL_SLUGS.length);
  expect(role.subagents).toHaveLength(TOP_LEVEL_SLUGS.length);
  expect(role.subagents.map((child) => child.id).sort()).toEqual(
    TOP_LEVEL_SLUGS.map((slug) => `rolebox-tester--${slug}`).sort(),
  );
  const topSlugs = role.subagents.map(childSlug).sort();
  expect(topSlugs).toEqual(TOP_LEVEL_SLUGS);

  const inline = role.config.subagents.filter(
    (child) => child.prompt_file === undefined,
  );
  expect(inline.map(childSlug).sort()).toEqual(INLINE_SLUGS);
  for (const child of inline) {
    expect(child.tools).toEqual({
      graph_declare: false,
      graph_submit_outcome: true,
    });
    expect(child.prompt.length).toBeGreaterThan(50);
  }
  for (const slug of DIRECTORY_SLUGS) {
    expect(
      existsSync(join(roleRoot, "subagents", slug, "role.yaml")),
      slug,
    ).toBe(true);
    expect(
      role.config.subagents.some((child) => childSlug(child) === slug),
      slug,
    ).toBe(true);
  }
  for (const slug of INLINE_SLUGS) {
    expect(
      existsSync(join(roleRoot, "subagents", slug, "role.yaml")),
      slug,
    ).toBe(false);
  }

  // No retired signal/runner fixture survived the v7 cleanup.
  for (const slug of RETIRED_SUBAGENT_SLUGS) {
    expect(topSlugs, slug).not.toContain(slug);
    expect(existsSync(join(roleRoot, "subagents", slug)), slug).toBe(false);
  }

  // The nester keeps its nested descendant; it is the only nested subagent.
  const nester = role.subagents.find((child) => childSlug(child) === "nester");
  expect(nester).toBeDefined();
  expect(nester.subagents).toHaveLength(1);
  expect(nester.subagents[0].id).toBe("rolebox-tester--nester--grandchild");
  expect(nester.subagents[0].config.name).toBe("Grandchild");
  expect(
    existsSync(
      join(roleRoot, "subagents", "nester", "subagents", "grandchild", "role.yaml"),
    ),
  ).toBe(true);
  expect(allSubagents(role)).toHaveLength(TOP_LEVEL_SLUGS.length + 1);

  // The outcome-worker is the submission fixture: it grants the cross-role memory
  // probes and the lowercase native write surface, and only its own graph face.
  const outcomeWorker = role.subagents.find(
    (child) => childSlug(child) === "outcome-worker",
  );
  expect(outcomeWorker).toBeDefined();
  expect(outcomeWorker.config.tools).toEqual({
    graph_declare: false,
    graph_control: false,
    graph_status: false,
    graph_audit: false,
    graph_submit_outcome: true,
    bash: true,
    write: true,
    edit: true,
    read: true,
    memory_read: true,
    memory_recall: true,
  });
  for (const name of ["bash", "write", "edit", "memory_read", "memory_recall"]) {
    expect(outcomeWorker.config.tools[name], name).toBe(true);
  }
  for (const name of ["Bash", "Write", "Edit", "Memory_read"]) {
    expect(outcomeWorker.config.tools[name], name).toBeUndefined();
  }
});

// ── (b) The machine-readable catalog ────────────────────────────────────────

test("the catalog declares 178 unique ids in 16 modules, new exactly 200-256, retired exactly 46", async () => {
  const { roleRoot } = await loadTester();
  const catalog = readCatalog(roleRoot);

  expect(catalog.suite_version).toBe("7.0.0");
  expect(catalog.total).toBe(178);
  expect(catalog.modules).toHaveLength(16);

  const moduleNames = catalog.modules.map((module) => module.module);
  expect([...moduleNames].sort()).toEqual(
    Object.keys(EXPECTED_MODULE_COUNTS).sort(),
  );

  const ids = [];
  for (const module of catalog.modules) {
    expect(Array.isArray(module.ids), module.module).toBe(true);
    expect(module.ids.length, module.module).toBe(
      EXPECTED_MODULE_COUNTS[module.module],
    );
    expect(module.count, module.module).toBe(module.ids.length);
    for (const id of module.ids) {
      expect(typeof id, module.module).toBe("string");
      expect(id.length, module.module).toBeGreaterThan(0);
      ids.push(id);
    }
  }
  expect(ids).toHaveLength(catalog.total);
  expect(new Set(ids).size).toBe(ids.length);

  // The new-id range is exactly 200-256: 57 ids, no gap and no id above the cap.
  const numeric = ids.filter((id) => /^[0-9]+$/.test(id)).map(Number);
  const newIds = numeric.filter((id) => id >= 200).sort((a, b) => a - b);
  expect(newIds).toEqual(
    Array.from({ length: 57 }, (_, index) => 200 + index),
  );
  expect(numeric.filter((id) => id > 256)).toEqual([]);
  expect(numeric.filter((id) => id >= 183 && id < 200)).toEqual([]);
  const retained = ids.filter((id) => !/^[0-9]+$/.test(id) || Number(id) < 200);
  expect(retained).toHaveLength(121);

  // The retirement ledger is exactly the 46 v6 ids and never overlaps the catalog.
  expect(catalog.retired_ids).toHaveLength(46);
  expect([...catalog.retired_ids].sort()).toEqual([...RETIRED_IDS].sort());
  for (const retired of catalog.retired_ids) {
    expect(ids, retired).not.toContain(retired);
  }

  // No retired id is reused as a test heading anywhere in the shipped role.
  const headings = new Set();
  for (const file of walkFiles(roleRoot)) {
    if (!/\.(md|ya?ml|js|mjs|json)$/.test(file)) continue;
    for (const id of bodyTestIds(readFileSync(file, "utf8"))) headings.add(id);
  }
  for (const retired of catalog.retired_ids) {
    expect(headings.has(retired), retired).toBe(false);
  }
});

// ── (c) Catalog body union and executor lanes ───────────────────────────────

test("every catalog module's body headings equal the union of its module ids", async () => {
  const { roleRoot, role } = await loadTester();
  const catalog = readCatalog(roleRoot);

  const modulesByBody = new Map();
  for (const module of catalog.modules) {
    expect(typeof module.body, module.module).toBe("string");
    expect(module.body.length, module.module).toBeGreaterThan(0);
    expect(module.body.startsWith("/"), module.module).toBe(false);
    expect(module.body.includes(".."), module.module).toBe(false);
    const file = join(roleRoot, module.body);
    expect(existsSync(file), module.body).toBe(true);
    if (!modulesByBody.has(module.body)) modulesByBody.set(module.body, []);
    modulesByBody.get(module.body).push(module);
  }

  // Eleven distinct body paths: nine reference documents and the two runner prompts.
  expect([...modulesByBody.keys()].sort()).toEqual(
    [
      ...Object.keys(MULTI_MODULE_BODIES),
      ...SINGLE_MODULE_BODIES,
    ].sort(),
  );

  // The shared documents carry exactly the documented union and heading count.
  for (const [body, expected] of Object.entries(MULTI_MODULE_BODIES)) {
    const modules = modulesByBody.get(body);
    expect(modules, body).toBeDefined();
    expect(modules.map((module) => module.module).sort()).toEqual(
      expected.modules,
    );
    const headings = bodyTestIds(readFileSync(join(roleRoot, body), "utf8"));
    expect(headings, body).toHaveLength(expected.headings);
    expect(new Set(headings).size, body).toBe(headings.length);
  }

  // Every body's `### Test` id set equals the union of the ids of the modules the
  // catalog maps to it: no extra heading and no missing id.
  for (const [body, modules] of modulesByBody) {
    const headings = bodyTestIds(readFileSync(join(roleRoot, body), "utf8"));
    const union = new Set(modules.flatMap((module) => module.ids));
    expect(new Set(headings), body).toEqual(union);
    expect(headings.length, body).toBe(union.size);
    const catalogIds = modules.flatMap((module) => module.ids);
    expect(new Set(catalogIds).size, body).toBe(catalogIds.length);
  }

  // Single-module documents and runner prompts equal their own module's ids.
  for (const body of SINGLE_MODULE_BODIES) {
    const modules = modulesByBody.get(body);
    expect(modules, body).toHaveLength(1);
    expect(bodyTestIds(readFileSync(join(roleRoot, body), "utf8")), body).toEqual(
      modules[0].ids,
    );
  }

  // Executors are the primary or one of the two resolved runner subagents.
  const subagentIds = new Set(allSubagents(role).map((child) => child.id));
  const runnerSlugs = new Set(
    allSubagents(role)
      .map((child) => childSlug(child))
      .filter((slug) => slug.startsWith("runner-")),
  );
  expect([...runnerSlugs].sort()).toEqual(["runner-loop", "runner-statemachine"]);
  const executors = new Set();
  for (const module of catalog.modules) {
    executors.add(module.executor);
    if (module.executor === "primary") continue;
    expect(runnerSlugs.has(module.executor), module.module).toBe(true);
    expect(
      subagentIds.has(`rolebox-tester--${module.executor}`),
      module.module,
    ).toBe(true);
    expect(module.body, module.module).toBe(
      `subagents/${module.executor}/prompt.md`,
    );
  }
  expect([...executors].sort()).toEqual([
    "primary",
    "runner-loop",
    "runner-statemachine",
  ]);
});

// ── (d) The shipped graph v3 declarations compile ───────────────────────────

const SUPPORTED_VALIDATORS = [
  { validator: "schema", version: 1 },
  { validator: "artifact-reference", version: 1 },
];

function compileShipped(declaration, supportedValidators = SUPPORTED_VALIDATORS) {
  const parsed = parseGraphDeclarationV3(structuredClone(declaration));
  if (!parsed.ok) {
    return {
      stage: "parse",
      errors: parsed.errors.map(
        (issue) => `${issue.code} at ${issue.path} (${issue.message})`,
      ),
    };
  }
  const compiled = compileGraph(parsed.declaration, { supportedValidators });
  if (!compiled.ok) {
    return {
      stage: "compile",
      kind: compiled.kind,
      errors: compiled.errors.map(
        (issue) => `${issue.code} at ${issue.path} (${issue.message})`,
      ),
    };
  }
  return { stage: "ok", compiled };
}

function fencedDeclarations(path) {
  const text = readFileSync(path, "utf8");
  const blocks = [...text.matchAll(/```json[ \t]*\r?\n([\s\S]*?)\r?\n```/g)];
  return blocks.map((match, index) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      throw new Error(
        `${path}: fenced json block #${index + 1} is not valid JSON: ` +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  });
}

test("every shipped graph v3 declaration parses and compiles to an executable plan", async () => {
  const { role } = await loadTester();
  const declarations = fencedDeclarations(graphBodiesPath);
  expect(declarations.length).toBeGreaterThan(0);

  const resolvedSubagentIds = new Set(
    allSubagents(role).map((child) => child.id),
  );
  const names = new Set();
  let budgetPinned = false;
  let explicitCompletionPinned = false;

  for (const declaration of declarations) {
    const label = declaration?.name ?? "<unnamed declaration>";
    expect(declaration.version, label).toBe(3);
    expect(typeof declaration.name, label).toBe("string");
    expect(names.has(declaration.name), label).toBe(false);
    names.add(declaration.name);
    expect(Array.isArray(declaration.nodes), label).toBe(true);
    expect(declaration.nodes.length, label).toBeGreaterThan(0);

    const result = compileShipped(declaration);
    if (result.stage !== "ok") {
      throw new Error(
        `${label} ${result.stage === "parse" ? "is not a valid v3 declaration" : "failed to compile"}: ` +
          result.errors.join("; "),
      );
    }
    const { compiled } = result;
    expect(compiled.kind, label).toBe("executable");
    const plan = compiled.plan;
    expect(plan.declarationVersion, label).toBe(3);
    expect(plan.executability.kind, label).toBe("executable");
    expect(plan.graphId, label).toBe(declaration.name);

    // Every declaration node dispatches a real, resolved subagent id.
    for (const node of declaration.nodes) {
      expect(resolvedSubagentIds.has(node.agent), `${label}:${node.id}`).toBe(
        true,
      );
      expect(node.agent, `${label}:${node.id}`).toMatch(
        /^rolebox-tester--[a-z0-9-]+$/,
      );
      expect(Array.isArray(node.outcomes), `${label}:${node.id}`).toBe(true);
      expect(node.outcomes.length, `${label}:${node.id}`).toBeGreaterThan(0);
      const planNode = plan.nodes.find((entry) => entry.id === node.id);
      expect(planNode, `${label}:${node.id}`).toBeDefined();
      expect(planNode.agent, `${label}:${node.id}`).toBe(node.agent);
    }

    // A pinned graph budget and explicit completion are part of the shipped set.
    if (
      declaration.budget !== undefined &&
      Number.isSafeInteger(declaration.budget.max_executions) &&
      declaration.budget.max_executions > 0
    ) {
      budgetPinned = true;
    }
    if (declaration.nodes.some((node) => node.completion?.mode === "explicit")) {
      explicitCompletionPinned = true;
    }

    // Every declared loop group pins its cap and its two routes, in the plan too.
    const declaredGroups = declaration.loop_groups ?? [];
    expect(plan.loopGroups, label).toHaveLength(declaredGroups.length);
    for (const group of declaredGroups) {
      expect(typeof group.id, label).toBe("string");
      expect(Array.isArray(group.nodes), `${label}:${group.id}`).toBe(true);
      expect(group.nodes.length, `${label}:${group.id}`).toBeGreaterThanOrEqual(2);
      expect(Number.isSafeInteger(group.max_traversals), `${label}:${group.id}`).toBe(
        true,
      );
      expect(group.max_traversals, `${label}:${group.id}`).toBeGreaterThan(0);
      expect(typeof group.continuation_outcome, `${label}:${group.id}`).toBe(
        "string",
      );
      expect(typeof group.exit_outcome, `${label}:${group.id}`).toBe("string");
      expect(group.continuation_outcome.length, `${label}:${group.id}`).toBeGreaterThan(0);
      expect(group.exit_outcome.length, `${label}:${group.id}`).toBeGreaterThan(0);

      const nodeIds = new Set(declaration.nodes.map((node) => node.id));
      for (const member of group.nodes) {
        expect(nodeIds.has(member), `${label}:${group.id}`).toBe(true);
      }
      const outcomeIds = new Set(
        declaration.nodes
          .filter((node) => group.nodes.includes(node.id))
          .flatMap((node) => node.outcomes.map((outcome) => outcome.id)),
      );
      expect(outcomeIds.has(group.continuation_outcome), `${label}:${group.id}`).toBe(
        true,
      );
      expect(outcomeIds.has(group.exit_outcome), `${label}:${group.id}`).toBe(true);

      const planGroup = plan.loopGroups.find((entry) => entry.id === group.id);
      expect(planGroup, `${label}:${group.id}`).toBeDefined();
      expect(planGroup.maxTraversals, `${label}:${group.id}`).toBe(
        group.max_traversals,
      );
      expect(planGroup.continuationOutcome, `${label}:${group.id}`).toBe(
        group.continuation_outcome,
      );
      expect(planGroup.exitOutcome, `${label}:${group.id}`).toBe(
        group.exit_outcome,
      );
      expect([...planGroup.nodes].sort(), `${label}:${group.id}`).toEqual(
        [...group.nodes].sort(),
      );
    }
  }

  // At least one shipped declaration pins a positive graph budget and one node's
  // explicit completion, so the set exercises both v3 declaration features.
  expect(budgetPinned).toBe(true);
  expect(explicitCompletionPinned).toBe(true);
});

// ── (e) The source-level validator refusal path ─────────────────────────────

test("a declaration pinning an uninstalled validator identity is refused by name", () => {
  const declarations = fencedDeclarations(graphBodiesPath);
  const gated = declarations.find((declaration) =>
    declaration.nodes.some((node) =>
      node.outcomes.some((outcome) => (outcome.acceptance ?? []).length > 0),
    ),
  );
  expect(gated).toBeDefined();

  // The shipped declaration compiles only when the two validator capabilities are
  // declared installed: this proves the acceptance gates are really exercised and
  // the green compile above is not accidental.
  const withoutValidators = compileShipped(gated, []);
  expect(withoutValidators.stage).toBe("compile");
  expect(withoutValidators.errors.join("\n")).toContain("unsupported-validator");
  const schemaOnly = compileShipped(gated, [{ validator: "schema", version: 1 }]);
  expect(schemaOnly.stage).toBe("compile");
  expect(schemaOnly.errors.join("\n")).toContain("unsupported-validator");

  const installed = compileShipped(gated);
  expect(installed.stage).toBe("ok");
  expect(installed.compiled.kind).toBe("executable");

  // Mutating one acceptance pin to an identity no host capability covers must be
  // refused at compile time with the named source-level error, not silently
  // downgraded to a draft or accepted at declaration time.
  const uninstalled = "not-installed-validator";
  const mutated = structuredClone(gated);
  const node = mutated.nodes.find((entry) =>
    entry.outcomes.some((outcome) => (outcome.acceptance ?? []).length > 0),
  );
  const outcome = node.outcomes.find(
    (entry) => (entry.acceptance ?? []).length > 0,
  );
  outcome.acceptance = [{ validator: uninstalled, version: 1 }];

  const refused = compileShipped(mutated);
  expect(refused.stage).toBe("compile");
  expect(refused.errors.length).toBeGreaterThan(0);
  expect(refused.errors.join("\n")).toContain("unsupported-validator");
  expect(refused.errors.join("\n")).toContain(JSON.stringify(uninstalled));
  expect(refused.kind).not.toBe("executable");
});

// ── (f) No operative retired graph v2 vocabulary ────────────────────────────

// The retired v2 tool family and the two v2 routing condition names. Every token
// is assembled from fragments so this test file never carries the literal names it
// forbids and can be scanned like any other shipped file.
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
const RETIRED_V2_VOCAB = [
  ...RETIRED_V2_TOOLS,
  "on" + "_signal",
  "signal" + "_filter",
];

/**
 * Report every operative occurrence of the retired vocabulary in one text.
 *
 * A token is a retirement notice only when the text immediately before it ends
 * with "retired" (optionally "retired imperative") inside a clause that also
 * forbids it ("do not", "never", "no longer", "avoid", "must not"), and the token
 * is not called like a function; the capability matrix forbids the old family by
 * name that way. Every other occurrence is leftover vocabulary and fails. The
 * positive control below proves an unmarked call and a positive instruction
 * appended to a notice are both still caught, so the allowance is not a blanket
 * exemption.
 */
function forbiddenVocabulary(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    for (const token of RETIRED_V2_VOCAB) {
      let from = 0;
      while (true) {
        const at = line.indexOf(token, from);
        if (at === -1) break;
        from = at + token.length;
        const before = line.slice(0, at).trimEnd();
        const after = line.slice(at + token.length).trimStart();
        const wrapped = before.endsWith("`") && after.startsWith("`");
        const beforeText = wrapped ? before.slice(0, -1).trimEnd() : before;
        const afterText = wrapped ? after.slice(1).trimStart() : after;
        const isNotice =
          /\b(?:do not|don't|never|no longer|avoid|must not)\b[^.;]{0,80}\bretired(?:\s+imperative)?$/i.test(
            beforeText,
          );
        const isCall = afterText.startsWith("(");
        if (isNotice && !isCall) continue;
        hits.push({ token, line: index + 1, text: line.trim() });
      }
    }
  }
  return hits;
}

test("the retired-vocabulary predicate flags an unmarked call and permits a retirement notice", () => {
  const call = "Now call " + V2_PREFIX + "create to build the graph.";
  const notice = "Do not call the retired " + V2_PREFIX + "create family.";
  const smuggled =
    "Do not poll, do not call the retired imperative " +
    V2_PREFIX +
    "create family, and call " +
    V2_PREFIX +
    "create first.";
  expect(forbiddenVocabulary(call).length).toBeGreaterThan(0);
  expect(forbiddenVocabulary(notice)).toEqual([]);
  expect(forbiddenVocabulary(smuggled).length).toBeGreaterThan(0);
});

test("no operative retired graph v2 vocabulary remains in the shipped role prose", async () => {
  const { roleRoot } = await loadTester();
  const surfaces = [
    join(roleRoot, "role.yaml"),
    join(roleRoot, "PROMPT.md"),
    ...walkFiles(join(roleRoot, "functions")),
    ...walkFiles(join(roleRoot, "references")).filter(
      (file) => resolve(file) !== resolve(join(roleRoot, "references", "test-catalog.md")),
    ),
    ...walkFiles(join(roleRoot, "subagents")),
    join(roleDir, "tests", "role-contract.test.js"),
  ];
  // The scan covers every listed surface and the test file itself.
  expect(surfaces.length).toBeGreaterThan(DECLARED_REFERENCES.length);

  const offenders = [];
  for (const file of surfaces) {
    for (const hit of forbiddenVocabulary(readFileSync(file, "utf8"))) {
      offenders.push(
        `${relative(roleDir, file)}:${hit.line} ${JSON.stringify(hit.token)} :: ${hit.text}`,
      );
    }
  }
  if (offenders.length > 0) {
    throw new Error(
      "retired graph v2 vocabulary remains in the shipped role:\n" +
        offenders.join("\n"),
    );
  }
});

// ── (g) Registry agreement ───────────────────────────────────────────────────

test("registry.yaml declares the same rolebox-tester version as role.yaml", async () => {
  const { role } = await loadTester();
  const registry = yaml.load(readFileSync(registryPath, "utf8"));
  expect(registry).toBeTypeOf("object");
  const entry = registry.roles?.["rolebox-tester"];
  expect(entry).toBeDefined();
  expect(entry.version).toBe(role.config.version);
  expect(entry.version).toBe("7.0.0");
  expect(role.config.version).toMatch(/^\d+\.\d+\.\d+$/);
});
