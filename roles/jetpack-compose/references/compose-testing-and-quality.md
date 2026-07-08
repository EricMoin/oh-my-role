# Compose Testing and Quality Reference

Comprehensive reference for Compose UI testing strategy, test rule selection, semantics assertions, screenshot testing, ViewModel testing, and CI integration.

---

## 1. Test Pyramid for Compose

- **Unit tests** (60-70%): Pure Kotlin. ViewModel with Turbine for StateFlow assertions. No Compose dependency.
- **Compose UI tests** (20-30%): `createComposeRule`, semantic assertions on composable output.
- **Screenshot tests** (5-10%): Visual regression on key screens and design system components.
- **Integration tests** (5-10%): Full app flows with `createAndroidComposeRule` on emulator/device.

---

## 2. ComposeTestRule Selection

| Rule | When to Use |
|------|-------------|
| `createComposeRule()` | Pure Compose UI — no Android dependency. Runs on JVM. |
| `createAndroidComposeRule<ComponentActivity>()` | Tests needing Android context, resources, or lifecycle. |

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

- `./gradlew :app:lintDebug` — zero warnings
- `./gradlew :app:testDebugUnitTest` — all green
- `./gradlew :app:connectedDebugAndroidTest` — all green
- Coverage threshold (optional): ≥80% line coverage
