# Verify the toolchain contract

Use this reference when a task depends on a particular compiler option, language feature,
runtime API or module-loader rule. This is a verification method, not a table of observed
support. No example command or scenario below is a result from the current repository.

## Establish the environment

Read the target package's scripts, effective tsconfig, lockfile, runtime constraints and CI
matrix. Separate the installed version from the oldest supported version. Use the local
compiler through the project's package manager or installed binary; avoid implicit downloads.
When script wrappers obscure configuration, inspect what they invoke.

Examples of compiler diagnostics, to adapt to the installed compiler and project:

| Question | Focused check |
|---|---|
| Which options actually apply? | Local `tsc --showConfig -p <config>` |
| Is this option available? | Local `tsc --help --all` and versioned option docs |
| Which declaration was selected? | Local `tsc --traceResolution -p <config>` |
| Why is this file included? | Local `tsc --explainFiles -p <config>` |
| Where is checking time spent? | Local `tsc --extendedDiagnostics -p <config>`; trace if needed |

Check whether invoking the compiler emits files and choose an isolated output/configuration
when needed. These are diagnostic examples, not replacements for project build scripts.
Do not pass individual source files expecting `tsc` to also apply the project's tsconfig;
use a project or an explicit scratch config with the relevant options. Build-mode projects
need their actual reference/build contract preserved.

## Separate claims

- **Compiler recognition:** syntax/option accepted by the selected compiler.
- **Type environment:** required declarations included; these can describe APIs absent at runtime.
- **Emit:** build output has the expected module form, imports and declarations.
- **Runtime availability:** the API exists in the actual host; a compatibility namespace is
  not that host's own version identifier.
- **Runtime behavior:** the relevant success/failure/cleanup path was exercised.
- **Support policy:** tests/docs cover the versions promised to consumers, not only the
  newest version installed on a developer machine.

A local passing probe establishes its tested environment. Official documentation can
establish a documented version requirement without a local run. Label those separately.
When they disagree, inspect version, flags, loader, config and probe assumptions before
concluding either the documentation or implementation is wrong.

For library/framework/API/configuration details, resolve and query Context7 when available.
Prefer official, version-appropriate sources. Fall back to official docs and local help;
if still unresolved, state the uncertainty and avoid inventing an option.

## Authoritative starting points

- [TypeScript compiler options](https://www.typescriptlang.org/tsconfig/)
- [Choosing module/compiler options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html)
- [TypeScript module resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [TypeScript satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)
- [Isolated declarations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#isolated-declarations)
- [Node package loading and exports](https://nodejs.org/api/packages.html)
- [Node CommonJS and require(esm)](https://nodejs.org/api/modules.html)
- [Bun documentation](https://bun.sh/docs)
- [Deno runtime documentation](https://docs.deno.com/runtime/)

Consult the relevant page/version at use time. A link is a research starting point, not a
claim that every API on that page is supported by the target project.
