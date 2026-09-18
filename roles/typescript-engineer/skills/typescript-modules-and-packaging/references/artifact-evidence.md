# Verify the artifact that callers install

Use for a library build change, a missing declaration/asset, or a package that works only
inside its workspace. The goal is evidence about the delivered package, including its
runtime files, declarations and dependencies. Do not replace the build tool just to obtain
that evidence.

## Separate the producer from the consumer

Record the build tool's runtime requirement separately from the output's supported runtime.
A build on a newer host does not establish that the resulting package runs on the oldest
supported consumer. Keep compiler checks separate from transpilation and declaration emit.
Successful output generation does not prove the source or public types are correct.

Trace one failing entry point end to end before changing global settings:

1. Which source/config produces its JavaScript, declarations and required assets?
2. Which manifest conditions select those files for the promised consumers?
3. Which files and rewritten dependency ranges actually enter the artifact?
4. What does an isolated consumer load and type-check after installing that artifact?

Keep the artifact fixed across consumer checks. If packing/building runs scripts that
rewrite it, ensure the reports identify the same output, or regenerate and reverify as one
coherent round. Parallel graph branches should not rebuild into a shared dist directory.

## Make dependency handling explicit

For the dependency involved in the change, inspect whether output inlines it, leaves a
runtime import, or refers to it only from declarations. A dependency absent from JavaScript
can still be required to resolve an emitted public type. Check the packed manifest and
consumer installation rather than relying on the development dependency tree.

Shared runtime identity, native bindings and host integrations can constrain externalization.
Bundling a dependency may change those properties; externalizing it requires the consumer
to receive/provide it through the declared dependency contract. Do not turn one missing
module into a blanket bundle-everything rule.

Check assets through behavior that uses them: load a template, invoke the CLI entry or
resolve a worker file from the installed location. A root import smoke test cannot prove
that an unrelated exported subpath or lazily opened file exists.

## Layer the checks according to the failure

| Check | Evidence it contributes | What remains separate |
|---|---|---|
| Source typecheck | The selected project compiles under its options | Published resolution and runtime behavior |
| Build/declaration generation | Requested output was generated | Whether every needed file is packed |
| Manifest/output lint | Metadata points to compatible/existing output | Real application behavior |
| Declaration resolution analysis | Consumers can select appropriate declarations under examined modes | Inference promises and runtime semantics |
| Installed consumer probes | The examined entry point/type/runtime contract works for that consumer | Other untested entries or environments |

If tsdown is already the selected builder, inspect its installed version's declaration,
externalization, export-generation and validation configuration. Its publint/attw integration
can supply the middle layers when available. Do not install optional validators implicitly,
copy a current configuration into an older version, or add ignored rules to make a new
failure disappear. A direct existing validator invocation is equally useful; none requires
a bundler migration. Use official docs via Context7 for the options actually needed.

## Consumer specimen

Create a temporary consumer with only the required installed artifact, compiler and declared
peers/dependencies. Avoid source paths and workspace symlinks. Use a representative valid
call, an important invalid type call in a compile-only file, and a runtime operation that
reaches the relevant asset or dependency. Probe require only when the package supports it.
Record runtime/compiler versions, resolver mode and the exact artifact under test.

When changing builders intentionally, compare old and new artifacts on the same consumer
cases. Review entry points, declaration shape, dependency treatment and meaningful size
changes; matching source tests alone does not establish migration compatibility.

## Technical references

For tool behavior consult [tsdown package validation](https://tsdown.dev/options/lint),
[publint](https://publint.dev/) and [Are the types wrong?](https://github.com/arethetypeswrong/arethetypeswrong.github.io).
