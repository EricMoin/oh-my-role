#!/usr/bin/env node
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtime = process.env.ROLEBOX_ROOT && resolve(process.env.ROLEBOX_ROOT);
if (!runtime || !existsSync(join(runtime, "node_modules/vitest/vitest.mjs"))) {
  throw new Error("Set ROLEBOX_ROOT to a rolebox checkout with npm dependencies installed.");
}
const configDir = mkdtempSync(join(tmpdir(), "role-runtime-tests-"));
try {
  const config = join(configDir, "vitest.config.mjs");
  writeFileSync(config, "export default " + JSON.stringify({
    root: repo,
    resolve: { alias: { vitest: join(runtime, "node_modules/vitest/dist/index.js") } },
    test: {
      include: ["roles/*/tests/*.test.js", "scripts/tests/*-rolebox.test.ts"],
      pool: "forks",
      isolate: true,
      maxWorkers: 4,
      execArgv: ["--experimental-ffi", "--import", join(runtime, "node_modules/tsx/dist/loader.mjs")],
      testTimeout: 45_000,
      hookTimeout: 30_000,
    },
  }) + ";\n");
  const result = spawnSync(process.execPath, [
    join(runtime, "node_modules/vitest/vitest.mjs"), "run", "--config", config,
    ...process.argv.slice(2),
  ], { cwd: repo, stdio: "inherit", env: { ...process.env, ROLEBOX_ROOT: runtime } });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(configDir, { recursive: true, force: true });
}
