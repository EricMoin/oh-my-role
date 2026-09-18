# Resolution decisions

Choose the row from the actual execution/consumer path, not the source file's import style.
Use the installed TypeScript version's supported modes and the project's runtime floor.

| Situation | Decision/check |
|---|---|
| Node executes emitted JS | Use an appropriate Node-aware compiler mode and inspect package scope/extensions |
| Bundler resolves application imports | Align compiler resolution, aliases and conditions with the bundler |
| Library bundles some imports, externalizes others | Verify the external imports and emitted declarations under consumer resolution |
| Existing CommonJS consumers | Keep a working require path if promised; do not flip package type as a local workaround |
| ESM-only package | Verify supported ESM usage; do not demand a separate CommonJS implementation |
| Dual-format package | Verify runtime and declaration identity for each branch, plus shared-state behavior if relevant |
| Native TS execution | Check the actual loader/runtime's supported syntax; do not assume it type-checks or implements tsconfig transforms |

## Format and condition traps

Explicit `.mjs`/`.cjs` classify JavaScript; Node-aware TypeScript modes use `.mts`/`.cts`
and corresponding declaration extensions to express module identity. For ordinary `.ts`
and `.d.ts`, inspect package scope and compiler mode. Renaming a declaration does not
repair a mismatched runtime implementation by itself.

An absent package `type` is not a universal promise of CommonJS: Node versions with syntax
detection can classify ambiguous inputs as ESM. Prefer explicit format metadata for code
you package. Likewise, `require(esm)` behavior depends on runtime/version and the loaded
module graph; supported synchronous loading does not allow top-level await in that graph.

For Node ESM output, check relative import extensions in the emitted files. Some compiler
versions/settings can rewrite relative TS extensions; do not assume the feature is present
or that it rewrites aliases and bare package specifiers. `paths` alone does neither.

Conditional object ordering is semantic: earlier matching entries win. Put `types` before
runtime fallback at the relevant level and `default` last. Format-specific declarations
can be nested under `import` and `require`; sharing a top-level `.d.ts` is not automatically
correct. Modern resolution may honor `exports` while a legacy resolver ignores it, so test
the consumer modes actually supported.

## Debug by symptom

| Symptom | Inspect first |
|---|---|
| Typecheck passes; runtime cannot find module | Emitted specifier, alias rewriting, extensions, installed files |
| Runtime loads; TypeScript cannot find types | Declaration output, exports/types branch, consumer resolution mode |
| Default/named export mismatch | Actual emitted exports and interop for that consumer |
| Workspace works; tarball fails | Pack contents, rewritten dependencies, hidden source aliases, peers |
| State/class identity differs by loader | Independent implementations, duplicate installs, actual resolved paths |
| Declaration changes unexpectedly | Inferred public types, compiler version, declaration bundler transforms |

Authoritative details: [TypeScript modules](https://www.typescriptlang.org/docs/handbook/modules/reference.html),
[Node packages](https://nodejs.org/api/packages.html) and
[Node require(esm)](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require).
