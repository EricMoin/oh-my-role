# Behavior testing recipes

Load the relevant recipe after choosing a test level in the parent skill. These examples
use JUnit 4 and the project's existing AndroidX Compose test/coroutine dependencies. They
are not dependency-install instructions. Keep the production screen's own actions and
observable results when adapting them; do not expose a private helper for a test.

## UI action followed by an observable assertion

This small example includes its UI fixture and imports. It requires Material 3,
`ui-test-junit4`, the supported test host (including `ui-test-manifest` where the configured
host needs it), and AndroidX Test's JUnit runner. The import uses the v2 rule available
in the checked `ui-test-junit4` 1.11.4. Older projects should use their supported rule
package and verify its scheduler behavior instead of copying an unavailable v2 import.
Run it in the configured instrumented or
Robolectric environment, not an arbitrary plain JVM test source set.

```kotlin
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@Composable
private fun RetryPanel(onRetry: () -> Unit) {
    Button(onClick = onRetry) { Text("Retry") }
}

@RunWith(AndroidJUnit4::class)
class RetryPanelTest {
    @get:Rule val composeRule = createComposeRule()

    @Test fun retryInvokesItsCallbackOnce() {
        var retries = 0
        composeRule.setContent {
            MaterialTheme { RetryPanel(onRetry = { retries += 1 }) }
        }
        composeRule.onNodeWithText("Retry")
            .assertIsDisplayed()
            .assertHasClickAction()
            .performClick()
        composeRule.runOnIdle { assertEquals(1, retries) }
    }
}
```

A real integration test should also check the resulting loading/content/error state when
that is the changed contract. `performClick()` completing alone does not verify that result.
If testing a real Activity that already sets content, launch that Activity through the
project's host rule and interact with it; do not replace its content with an unrelated fixture.

## Find the right semantics node

Use the rule receiver for all finders. The following are independent fragments inside a
test with `composeRule`; import the named extensions from `androidx.compose.ui.test`.

```kotlin
composeRule.onNodeWithContentDescription("Add item").assertHasClickAction()
composeRule.onNodeWithTag("email_input").performTextInput("reader@example.test")
composeRule.onNodeWithTag("email_input").assertTextContains("reader@example.test")
composeRule.onNode(isToggleable() and hasText("Notifications")).assertIsOn()
```

Do not assume tags make accessibility correct. Text/content description can be localized,
and several nodes may match: select by the actual user-visible contract and known context.
Inspect `composeRule.onRoot().printToLog("semantics")` before changing selectors. Compare
with `onRoot(useUnmergedTree = true)` when a parent merges child semantics. Use an unmerged
finder to target an intentionally separate child, not to hide a broken accessible label.

## Synchronization depends on the producer

| Work | Synchronization |
| --- | --- |
| Compose recomposition and scheduled UI work | Normal synchronized actions/assertions; `runOnIdle` for a callback/state assertion on the UI thread |
| Compose animation at a chosen instant | Disable `mainClock.autoAdvance`, trigger the action, then use `advanceTimeByFrame` / `advanceTimeBy`; wait for layout/draw before capture |
| Coroutine unit test | A shared `TestCoroutineScheduler`; `runCurrent` or controlled time advancement |
| External async work | Registered idling resource or bounded `waitUntil` on the actual completion condition |

The Compose clock does not advance every external dispatcher or Android draw pass. Do not
replace synchronization with a sleep, or use `advanceUntilIdle` on work that deliberately
schedules forever. A timeout should name the awaited observable condition.

## StateFlow with subscriber-driven sharing

The old example triggered a ViewModel before collecting, then assumed the first item was
its completed result. For `stateIn(WhileSubscribed(...))`, attach a subscriber before the
trigger, use one scheduler, and assert the settled current value when intermediate states
are not the contract. `first()` alone subscribes only briefly; `toList()` on a StateFlow
never completes normally.

This **test-body template** requires the project's existing `MainDispatcherRule`,
`SettingsViewModel`, controllable fake repository, and ViewModel fixture. The fixture must
create the ViewModel under a `ViewModelStore` and clear that store in teardown; it must not
add a test-only production `close` or public accessor. `setDarkMode` is a production action,
`uiState` is a public `StateFlow` whose value has `isDarkMode`, and the fake completes the
save deterministically. Adapt these contracts to the actual owner rather than creating
these types solely to match the example.

```kotlin
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertTrue
import org.junit.Test

// Member of the project's test class, which supplies settingsFixture and
// MainDispatcherRule. Main is replaced before fixture construction and reset
// after fixture cleanup. This is not a standalone test file.
@OptIn(ExperimentalCoroutinesApi::class)
@Test
fun savedPreferenceBecomesVisible() = runTest {
    val fixture = settingsFixture() // Existing test factory; cleared in finally.
    try {
        val viewModel = fixture.viewModel
        backgroundScope.launch(UnconfinedTestDispatcher(testScheduler)) {
            viewModel.uiState.collect {}
        }
        runCurrent() // Start subscriber-driven upstream work.
        viewModel.setDarkMode(true)
        runCurrent() // Execute the fake save and resulting state work.
        assertTrue(viewModel.uiState.value.isDarkMode)
    } finally {
        fixture.clearViewModelStore()
    }
}
```

If the fake intentionally suspends, complete its controllable response before the final
`runCurrent`. If production uses injected dispatchers, inject test dispatchers sharing
`testScheduler`; replacing Main cannot control a hard-coded IO dispatcher. Use Turbine when
already present, but subscribe before the action and distinguish initial state from the
result. Cover cancellation, retry and stale-result rejection through the same public owner.

## Screenshot and CI acceptance

A golden test needs a real comparison assertion from the installed screenshot tool.
Capture-only code is not a substitute. Keep baseline and actual images plus the diff on
failure; review the diff before recording a new baseline. Separate intended visual changes
from unexplained environment drift (fonts, rendering backend, SDK, locale, density, theme,
clock, images or unfinished animation). A fixed font scale baseline needs separate large-text
coverage when that is a relevant risk.

For an Android application module actually named `app` with a `debug` variant, common task
examples are `./gradlew :app:testDebugUnitTest`, `:app:lintDebug`, and
`:app:connectedDebugAndroidTest`. Confirm the real module/variant and task existence first.
The first command runs tests configured in the JVM source set; it does not automatically
execute every Compose UI test. Instrumented tests need a target. Screenshot task names
come from their plugin, not these names. CI should retain failed test reports/diffs and
separate compilation, JVM, screenshot and device outcomes rather than equating a green build
with all four kinds of acceptance.

Sources checked 2026-10-27:
[Compose testing APIs](https://developer.android.com/develop/ui/compose/testing/apis),
[synchronization](https://developer.android.com/develop/ui/compose/testing/synchronization),
[v2 rule migration](https://developer.android.com/develop/ui/compose/testing/migrate-v2),
[testing flows](https://developer.android.com/kotlin/flow/test), and
[screenshot testing](https://developer.android.com/studio/preview/compose-screenshot-testing).
