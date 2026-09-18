// Run with an installed TypeScript >=5.4 compiler. Override TS_COMPILER_BIN if needed.
import { test, expect } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const specimen = readFileSync(new URL("../skills/typescript-type-system/references/inference-contracts.ts", import.meta.url), "utf8");
function compile(source) {
  const directory = mkdtempSync(join(tmpdir(), "typescript-contract-"));
  try {
    writeFileSync(join(directory, "fixture.ts"), source);
    writeFileSync(join(directory, "tsconfig.json"), JSON.stringify({
      compilerOptions: { strict: true, noEmit: true, exactOptionalPropertyTypes: true,
        noUncheckedIndexedAccess: true, target: "ES2022", module: "NodeNext",
        moduleResolution: "NodeNext", types: [] }, files: ["fixture.ts"],
    }));
    const result = spawnSync(process.env.TS_COMPILER_BIN ?? "tsc", ["--project", join(directory, "tsconfig.json"), "--pretty", "false"],
      { encoding: "utf8", timeout: 10000 });
    if (result.error) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr };
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

test("type specimen accepts supported calls and every negative assertion is active", () => {
  const result = compile(specimen);
  expect(result.output).toBe("");
  expect(result.status).toBe(0);
});

test("unsuppressed invalid calls fail at each intended contract boundary", () => {
  const lines = specimen.split("\n");
  const expectedLines = lines.flatMap((line, index) => line.includes("@ts-expect-error") ? [index + 2] : []);
  const result = compile(lines.map((line) => line.includes("@ts-expect-error") ? "" : line).join("\n"));
  expect(result.status).not.toBe(0);
  const diagnosticLines = [...result.output.matchAll(/fixture\.ts\((\d+),\d+\): error TS\d+:/g)]
    .map((match) => Number(match[1]));
  expect(expectedLines.length).toBe(5);
  expect([...new Set(diagnosticLines)].sort((a, b) => a - b)).toEqual(expectedLines);
});
