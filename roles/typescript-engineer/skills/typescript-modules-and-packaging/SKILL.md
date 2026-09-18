---
name: typescript-modules-and-packaging
description: Diagnose TypeScript import resolution and implement module, build, declaration and package-export changes. Use for ESM/CommonJS interop, aliases, entry points or published artifacts; verify only the consumer formats the package supports.
---

# Modules and packaging

Follow the import through four layers: source specifier, TypeScript resolution, emitted
artifact and consumer loader. Read the nearest package manifest and effective tsconfig,
then the build configuration. Identify which layer first diverges.

## Choose configuration for the actual host

- For code executed by Node, use a supported Node-aware module mode appropriate to the
  project's compiler and runtime contract. Check its implied/compatible resolution mode.
- For an application whose imports are resolved by a bundler, a bundler-oriented mode may
  be appropriate. A library checked this way can still emit imports Node consumers reject,
  particularly in externalized dependencies and declaration files.
- Preserve an existing valid legacy configuration unless changing it is part of the task.
  Do not propose a universal tsconfig or upgrade simply to select the newest mode.
- `paths` describes compiler lookup; it does not by itself rewrite emitted specifiers or
  teach a runtime how to resolve them. Match aliases to the actual build/loader mechanism.
- `target` controls language downleveling, not API polyfills. `lib` and `@types` describe
  capabilities and do not install them in production.
- Transpilation, type checking and declaration generation can be separate commands. Verify
  all relevant outputs rather than assuming a successful bundle checked the source.

Read [resolution decisions](references/esm-cjs-decision-table.md) for format-specific traps.

## Exports and declarations form a consumer contract

List the entry points and consumer environments intentionally supported. An internal
application export is not automatically a published API. Do not add CJS support, browser
support or a new subpath unless it is required.

Conditional export keys are evaluated in order. Put a `types` condition before runtime
fallbacks at the level it describes and `default` last. Dual-format branches may need
separate declarations even when their textual signatures are identical: declaration module
identity must match the corresponding JavaScript. There is no single flat export map that
fits every package.

Check that each referenced JavaScript/declaration file is actually packed. `files` controls
tarball contents, while `exports` controls public package-specifier resolution in hosts
that honor it. Neither is a security boundary. Root and subpath entries each need their
own resolution story; a subpath-only package need not expose a root entry.

Two independent ESM/CJS builds can duplicate state or constructors. If identity matters,
exercise both loading paths in one process and compare the exported shared value. A wrapper
around a single implementation can help when supported by the target environments. Do not
assume all ESM imports or all `require` calls instantiate a second copy.

Review build externals, side-effect declarations and assets when they affect the artifact.
A blanket `sideEffects: false` can drop registration code or stylesheet imports. Do not
inline a dependency merely to avoid declaring it without considering identity and size.

For build/declaration/dependency failures, use [artifact evidence](references/artifact-evidence.md)
to separate source checking, output linting and real consumer behavior. Consult its tsdown
notes only for projects using that tool or a requested migration.

## Verify as a consumer

For packaging changes, build with the project's command, inspect pack lifecycle scripts,
and produce an artifact using the selected package manager. Packing may execute scripts;
use an isolated copy if those scripts would overwrite user files. Packing is not publishing.

Install the artifact into a scratch consumer outside workspace alias/source resolution.
Exercise supported entry points through their actual import/require forms and type-check
against the installed declarations. Include peers and assets relevant to the failure.
Use resolution tracing when the compiler selects an unexpected declaration. A workspace
symlink or source-relative import cannot prove the tarball works.

Keep a failed consumer reproduction useful for diagnosis. Clean up task-created fixtures
when finished; never delete unrelated files. Report which formats and runtime/compiler
versions were exercised and which remain untested. Do not publish as a side effect of
artifact verification.
