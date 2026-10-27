# Platform observation and variant recipes

These recover concrete integration patterns. Use the project's configured AndroidX/AGP
versions; neither a snippet nor a successful build establishes runtime platform behavior.

## Observe WorkManager requests without inventing sync success

The actual API is `WorkManager.getWorkInfosByTagFlow(tag)`. This component exposes a
lifecycle-collected snapshot and keeps “not loaded yet” separate from “no matching work”.
It requires work-runtime with this API, lifecycle-runtime-compose and Compose runtime.
The app supplies its initialized WorkManager instance; the tag is a group of requests,
not necessarily one unique logical synchronization operation.

```kotlin
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.work.WorkInfo
import androidx.work.WorkManager

@Composable
fun rememberTaggedWork(
    workManager: WorkManager,
    tag: String,
): State<List<WorkInfo>?> = key(workManager, tag) {
    val updates = remember { workManager.getWorkInfosByTagFlow(tag) }
    updates.collectAsStateWithLifecycle(initialValue = null)
}
```

Changing the manager/tag starts a new state location, so the previous tag's data is not
shown as the new query's initial result. In a screen with business sync policy, put that
policy in its state owner and pass a UI model down rather than scattering request queries.

| Observed value/state | What it establishes |
| --- | --- |
| Null initial value | The query has not emitted here yet |
| Empty result | No requests matching this query are currently represented; not “everything synced” |
| ENQUEUED / BLOCKED | Scheduled or waiting for prerequisites; not completed |
| RUNNING | The tracked request is executing |
| SUCCEEDED | That one-time request reported success; domain freshness still depends on its contract |
| FAILED / CANCELLED | That tracked request ended without successful completion |

A tag query can contain old and new requests together. Use an ID or unique-work query when
that is the intended identity, and define how to interpret a group. Periodic work is
rescheduled between runs; it does not become a permanently SUCCEEDED synchronization.
For “last synced” UI, expose persisted domain facts such as the successfully applied data
revision/time, not `!any(RUNNING)`. Inspect worker output/error/progress only under their
actual contracts and preserve retry/cancellation states.

The API was checked against published WorkManager 2.12.0 sources (`androidx/work/WorkManager.kt`,
`getWorkInfosByTagFlow`) and the snippet was compiled against that local artifact.
Sources: [WorkManager API](https://developer.android.com/reference/kotlin/androidx/work/WorkManager),
[work states](https://developer.android.com/develop/background-work/background-tasks/persistent/how-to/states).

## Keep environment flavors separate from build types

The following is a fragment of an **application** module's `build.gradle.kts`, assuming
its Android application plugin/defaultConfig and required release rules already exist.
Adapt the names to the actual project rather than adding these flavors mechanically.

```kotlin
android {
    buildTypes {
        getByName("debug") {
            applicationIdSuffix = ".debug"
        }
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
    flavorDimensions += "environment"
    productFlavors {
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
        }
        create("production") {
            dimension = "environment"
        }
    }
}
```

Build types control debugging/optimization/signing behavior; flavors describe product or
environment variation. Their combinations determine variants and task names. Inspect
merged manifests/resources, application IDs, dependencies, signing and source sets for the
selected variant. Do not benchmark a debug variant and infer release performance, or ship
a staging endpoint because only the other variant was tested. Release shrinking needs the
project's correct rules; turning it on alone is not release validation.

Compose compiler setup is a separate version boundary. With Kotlin 2.0+, use the matching
`org.jetbrains.kotlin.plugin.compose` in modules that use Compose, and its `composeCompiler`
DSL for options; do not copy a hard-coded legacy `kotlinCompilerExtensionVersion`. AGP 9+
has built-in Kotlin support, so do not blindly apply the old Kotlin Android plugin alongside
it. Preserve the project's convention plugins/version catalog and check the compatibility
matrix before migrating. The Compose BOM aligns covered libraries, not AGP or Kotlin.

Sources: [build variants](https://developer.android.com/build/build-variants) and
[Compose compiler migration](https://kotlinlang.org/docs/compose-compiler-migration-guide.html).
