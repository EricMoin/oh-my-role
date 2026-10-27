# Android Source Lookup

Use `skills/android-source-research/SKILL.md` for the investigation workflow and
`references/evidence-first-research.md` for citations. This reference owns the mechanics
of finding source that matches a dependency or platform build.

## Resolve Before Tracing

Read the project's version catalog and convention plugins, then inspect the configuration
used by the affected variant. Adapt module and configuration names to the project:

```bash
./gradlew :app:dependencies --configuration debugRuntimeClasspath
./gradlew :app:dependencyInsight \
    --dependency androidx.compose.foundation \
    --configuration debugRuntimeClasspath
```

`dependencyInsight` explains selected versions and their resolution; it does not download
source JARs or extract a POM's SCM tag. Ask the IDE/dependency tooling for the published
`-sources.jar`, or retrieve it from the artifact's declared Maven repository using the
resolved group, artifact and version. Inspect the corresponding POM for SCM metadata.
Neither `buildFeatures.buildConfig` nor an empty report-task configuration enables source
downloads. Existing cached source archives can be located with:

```bash
rg --files --hidden --no-ignore ~/.gradle/caches/modules-2/files-2.1 \
    -g '*-sources.jar'
```

Search inside the selected archive for the symbol, then record the archive coordinate,
entry and actual line range. An absent cached archive is not evidence that source is
unpublished. Multiplatform artifacts may publish platform-specific source variants;
confirm the source set used by the resolved Android target.

## AndroidX and AOSP

The [AndroidX GitHub mirror](https://github.com/androidx/androidx) is synchronized with
[the framework support repository](https://android.googlesource.com/platform/frameworks/support/).
`androidx-main` is development code, not a release pin. Discover actual refs or use
published sources; do not derive a tag or release-branch name from an artifact/BOM version.
If an exact mapping cannot be established, label development-source findings as provisional.

| Area | Search starting point |
| --- | --- |
| Compose runtime, foundation, UI, Material | `compose/` in AndroidX |
| Lifecycle, Navigation, Room | Their module directories in AndroidX |
| Android framework | `frameworks/base/` via cs.android.com or android.googlesource.com |
| Third-party dependency | Published source artifact, then POM SCM repository/revision |

Search by imported symbol instead of assuming class and file names coincide. For example,
`LazyColumn` is declared in `LazyDsl.kt` in the currently inspected AndroidX development
source, not a presumed `LazyColumn.kt`. Verify paths again for the target artifact.

Trace public entrypoint → overload/defaults → relevant implementation → platform guards.
Inspect AndroidX wrappers separately from framework code. Follow actual API checks rather
than assuming all compatibility behavior lives in a directory named `compat`.

## Navigate a specific source question

Start at the imported package and public symbol. For AndroidX, search the relevant module
in Android Code Search or the GitHub mirror; Compose is also indexed in the AndroidX
support repository, not restricted to one browsing site. For framework behavior, search
`frameworks/base` for the public class or method, then follow service/implementation
calls as needed. A method name plus an adjacent distinctive parameter is often more
selective than a broad class name. Do not rely on undocumented search-operator syntax.

1. Read the selected overload and its default arguments, not just a similarly named method.
2. Follow delegation until the disputed behavior is implemented; note which state or owner
   controls it and any cleanup/cancellation path.
3. Inspect `Build.VERSION.SDK_INT`, target-SDK checks, feature flags and AndroidX wrappers
   where present. They need not live in a directory named `compat`.
4. Bind the conclusion to the actual artifact/platform build. For a version difference,
   compare the same symbol across verified revisions rather than guessing release tags.
5. Keep a short chain such as `entrypoint → overload → delegate → guard → effect` with
   a citation at the decisive step. Stop once the named question is answered.

### Inspect a published source archive

The following read-only Python recipe lists candidate entries in an existing source JAR.
Replace the path and symbol; it neither downloads sources nor modifies the Gradle cache.

```python
from pathlib import Path
from zipfile import ZipFile

archive = Path("/absolute/path/to/resolved-artifact-sources.jar")
symbol = "LazyColumn"
with ZipFile(archive) as source:
    for entry in source.namelist():
        if not entry.endswith((".kt", ".java")):
            continue
        text = source.read(entry).decode("utf-8")
        for line, content in enumerate(text.splitlines(), 1):
            if symbol in content:
                print(f"{entry}:{line}: {content.strip()}")
```

Open the relevant entry with surrounding context after finding it. Record the Maven
coordinate and archive/entry alongside the line; a filename alone does not establish
version provenance. For third-party artifacts, use the published POM's real SCM metadata
when available and verify that its revision maps to the artifact. Missing SCM metadata is
not permission to derive a GitHub owner or tag from the Maven group name.

## Worked Documentation Check

The [official lazy-list documentation](https://developer.android.com/develop/ui/compose/lists#item-keys)
(accessed 2026-10-27) specifies position-based default item keys. Stable, unique keys preserve
item identity when data moves. Do not reverse that claim or fabricate a source line to
support it. A project-specific implementation claim still needs the resolved source.

The [AndroidX Lazy DSL source](https://github.com/androidx/androidx/blob/androidx-main/compose/foundation/foundation/src/commonMain/kotlin/androidx/compose/foundation/lazy/LazyDsl.kt)
was inspected for navigation on 2026-10-27. This moving link is not a release-specific citation.

## Deliverable

Return the question, resolved version/build, inspected evidence, conclusion, action and
remaining uncertainty. When source and docs disagree, test the smallest case that would
resolve it. If unable to execute, report that limitation and the proposed experiment
separately; do not claim a reproduced or verified result.
