# Compose Testing and Quality Reference

Comprehensive reference for Compose UI testing strategy, test rule selection, semantics assertions, screenshot testing, ViewModel testing, and CI integration.

---

## 1. Behavior and encapsulation

Choose test levels from the failure being checked. Unit tests fit deterministic logic,
UI tests fit interactions/semantics, device tests fit real platform behavior, and
screenshots fit meaningful visual regression risks. There is no required ratio or
per-function quota. Use the existing stack and actual project coverage requirements.

Private helpers stay private. Exercise them through their production owner. Do not widen
visibility, add test hooks, or reflect into internals merely for tests. Extraction must
create a meaningful production responsibility; use the narrowest visibility its real
consumers need. Previews and coverage numbers do not replace behavioral assertions.

Confirm the affected component, trigger and expected result before expensive reproduction;
resolve only ambiguity that changes the repair or acceptance. Use focused local checks by
default, targeted runtime checks when the behavior requires a running app, and deep/formal
verification only for concrete high risk, an unresolved evidence gap or a user/project
requirement. A small change does not automatically require new previews, tests, a device
journey or broader CI tasks.

Device sessions follow the record levels in `references/device-test-memory.md`. Consult
matching cases and device pitfalls when useful; ordinary checks keep a compact outcome and
decisive evidence record without a new case or complete history sweep. A dispatched verifier
executes a frozen journey. After retaining the minimum record, the lead can hand optional
report enrichment and case/index proposals to
`jetpack-compose--journey-recorder` in a background graph and continue repairing immediately.
Do not defer actual acceptance checks or evidence of a blocking defect to that recorder.

When static captures cannot establish temporal behavior, use a short recording and inspected
key frames per `references/device-video-debugging.md`. Escalate to full-frame inspection and
action/log correlation only for a suspected single-frame defect, disputed ordering or an
unresolved timing cause. Verify the same acceptance behavior on the repaired build.

Finish after selected final-code acceptance checks and required project checks pass, with no
blocking defect. Additional testing needs a concrete new risk. Diagnostic retries share a
maximum of three attempts per hypothesis/implementation across tools and run names, stopping
earlier without new evidence. After roughly ten minutes without an effective change or new
decisive evidence, reassess rather than repeating. Blocked runtime checks stay unverified;
compile success and earlier-build results cannot replace them.

## 2. ComposeTestRule Selection

| Rule | When to Use |
|------|-------------|
| `createComposeRule()` | Tests needing a Compose host without direct Activity access; execution environment depends on the configured Android/device or supported JVM test setup. |
| `createAndroidComposeRule<ComponentActivity>()` | Tests needing explicit access to/control of the chosen Activity; follow the configured test host. |

```kotlin
// Pure Compose test
@RunWith(AndroidJUnit4::class)
class UserCardTest {
    @get:Rule val composeTestRule = createComposeRule()

    @Test
    fun displaysUserName() {
        composeTestRule.setContent { UserCard(user = testUser) }
        composeTestRule.onNodeWithText("Alice").assertIsDisplayed()
    }
}
```

```kotlin
// Android-aware test
@RunWith(AndroidJUnit4::class)
class ProfileScreenTest {
    @get:Rule val composeTestRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun togglesDarkMode() {
        composeTestRule.setContent { ProfileScreen(viewModel = fakeViewModel) }
        composeTestRule.onNodeWithContentDescription("Dark mode switch").performClick()
    }
}
```

---

## 3. Semantics Assertions

### Matchers

```kotlin
composeTestRule.onNodeWithText("Submit")            // Exact text match
composeTestRule.onNodeWithContentDescription("Add") // contentDescription
composeTestRule.onNodeWithTag("profile_button")      // testTag
composeTestRule.onNode(isToggleable())               // Toggleable widgets
```

### Assertions

```kotlin
onNodeWithText("Submit")
    .assertIsDisplayed().assertHasClickAction().assertTextEquals("Submit")
```

### Custom Test Tags

```kotlin
// In composable: Modifier.semantics { testTag = "profile_image" }
composeTestRule.onNodeWithTag("profile_image").assertIsDisplayed()
```

### Actions

```kotlin
onNodeWithText("Submit").performClick()
onNodeWithTag("email_field").performTextInput("test@example.com")
```

---

## 4. Screenshot / Golden Tests

```kotlin
@Test
fun userCardGolden() {
    composeTestRule.setContent { AppTheme { UserCard(user = testUser) } }
    composeTestRule.onRoot().captureToImage()
}
```

### Determinism Requirements

| Factor | Requirement |
|--------|-------------|
| **Font** | Use fixed fonts, not system-dependent |
| **Theme** | Wrap in explicit `AppTheme()` — no runtime defaults |
| **Text scale** | Fix to 1.0 in test configuration |

### Update Workflow

```bash
./gradlew :app:updateDebugScreenshotTest  # Update goldens
./gradlew :app:verifyDebugScreenshotTest  # Verify in CI
```

---

## 5. Robolectric vs Instrumented

| Criterion | Robolectric | Instrumented |
|-----------|-------------|--------------|
| Speed | Fast (seconds) | Slow (minutes) |
| APIs | Simulated | Real |
| CI | No device needed | Emulator required |

### ViewModel Test with Turbine

```kotlin
@Test
fun `toggles dark mode`() = runTest {
    val viewModel = SettingsViewModel(FakeSettingsRepository())
    viewModel.onDarkModeToggled(true)
    viewModel.uiState.test {
        assertThat(awaitItem().isDarkMode).isTrue()
        cancelAndIgnoreRemainingItems()
    }
}
```

---

## 6. Preview-Driven Development

```kotlin
@Preview(name = "Light", showBackground = true)
@Composable
fun UserCardPreview() = AppTheme { UserCard(user = sampleUser) }

@Preview(name = "Tablet", device = Devices.TABLET, showBackground = true)
@Composable
fun UserCardTabletPreview() = AppTheme { UserCard(user = sampleUser) }
```

---

## 7. CI Integration

```bash
# Run unit + Compose UI tests
./gradlew :app:testDebugUnitTest
# Instrumented tests (needs emulator)
./gradlew :app:connectedDebugAndroidTest
# All checks
./gradlew :app:lintDebug :app:check
```

### Quality Gates

Use actual project task names and requirements. These are examples, not a mandatory suite
for every change; existing unrelated warnings do not become new scope automatically.

- `./gradlew :app:lintDebug` — satisfy the project's lint policy for the affected scope.
- `./gradlew :app:testDebugUnitTest` — run the selected relevant tests.
- `./gradlew :app:connectedDebugAndroidTest` — when runtime risk or project policy requires it.
- Coverage threshold: use the project’s configured requirement, if any; do not invent a percentage.
