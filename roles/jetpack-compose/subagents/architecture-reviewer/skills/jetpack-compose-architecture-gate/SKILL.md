---
name: jetpack-compose-architecture-gate
description: Architecture gate for Jetpack Compose Architecture Reviewer. Reviews ViewModel boundaries, state ownership, DI (Hilt/Koin), module organization, navigation structure, and data layer integrity before broad Compose implementation or refactoring proceeds.
---
# Jetpack Compose Architecture Gate

## Mission

Confirm that the proposed Android/Compose change fits the existing project architecture and does not introduce structural coupling, state ownership violations, DI inconsistencies, navigation boundary leaks, or data layer entanglement. The gate preserves the project's established architectural style (MVVM, MVI, or UDF) and ensures that new components follow the same patterns rather than introducing ad-hoc alternatives.

This gate is critical when the change touches ViewModel state management, adds new dependencies, modifies navigation routes, restructures module boundaries, or introduces data layer abstractions. In multi-module projects, structural violations compound quickly — a misplaced dependency in one module can create a transitive dependency that prevents module-level compilation.

## Inputs

- Engineering State block from the Engineering Lead containing: project facts, existing_architecture, state_management, dependency_injection, navigation, data_persistence, and code_generation fields.
- Code diff or file list for the change under review.
- Optional: previous gate report if this is a revision round (with blocking_issues and required_revisions).
- Reference documents: `references/compose-architecture.md` for architecture patterns, ViewModel conventions, DI patterns, module organization, and antipatterns; `references/schemas.md` for the gate report contract.

## Required Checks

- ViewModel-to-screen mapping is one-to-one. ViewModels are not shared across unrelated screens or navigation destinations. Each ViewModel owns the state for exactly one logical screen or feature entry point.
- StateFlow collection in composables uses `collectAsStateWithLifecycle()` rather than bare `collectAsState()`. The lifecycle-aware variant pauses collection when the lifecycle drops below STARTED, preventing wasted recomposition during background state.
- SharedFlow/StateFlow `stateIn` uses `SharingStarted.WhileSubscribed` with an appropriate timeout (typically 5_000ms) for data flows that should survive rapid recomposition boundaries without restarting.
- Dependency injection follows the project's established pattern — Hilt `@HiltViewModel` + `hiltViewModel()`, Koin `viewModel { }` + `koinViewModel()`, or manual DI through a ViewModelFactory. New dependencies are injectable for unit testing.
- Module dependency direction is respected: feature modules depend only on core/commons modules. No feature-to-feature dependencies exist. Multi-module projects maintain explicit dependency rules in Gradle.
- Repository layer correctly hides transport, persistence, caching, and retry logic from ViewModel and composable layers. ViewModels do not directly call API clients, DAOs, or DataStore instances.
- Data transfer objects (DTOs) from API responses are mapped to domain models before reaching the presentation layer. Composable code never imports a Retrofit response or Room entity directly.
- Navigation structure follows per-feature `NavGraphBuilder` extension functions. The NavHost file is not a single monolithic file exceeding 300 lines.
- No ViewModel antipatterns: ViewModels do not hold TextField values or other pure Compose UI state. UI-local state uses `remember { mutableStateOf() }`.
- Interop boundaries (AndroidView, ComposeView, Fragment ComposeView) are correctly scoped and disposed. The `dispose` lambda in AndroidView releases any registered listeners or observers.

## Pass Criteria

- **Pass**: All required checks pass. No structural coupling, state ownership violations, or DI inconsistencies. The change integrates neatly into the existing architecture.
- **Fail**: One or more blocking issues found — shared ViewModels across screens, lifecycle-unaware flow collection, DI pattern violation, broken module dependency direction, or data layer leak. Each blocking issue must cite the exact file path and line number and include a concrete required revision.
- **Conditional Pass**: Minor advisory concerns exist (logged in `advisory_notes` — e.g., a ViewModel that could be more narrowly scoped, or a minor Navigation Compose naming inconsistency) but no blocking issues.

## Output Format

Return a `gate_report` inside a ```result fence with these fields:

```yaml
gate: architecture
status: pass | fail | needs-user-input
evidence:
  - "path/ViewModel.kt:42 — ViewModel injected via Hilt with @HiltViewModel"
  - "./gradlew :app:testDebugUnitTest — zero errors"
  - "references/compose-architecture.md:170 — antipattern: ViewModel holding TextField values"
blocking_issues:
  - "LoginViewModel shared across LoginScreen and PasswordResetScreen"
  - "Flow collected with bare collectAsState() in ProfileScreen.kt:31"
required_revisions:
  - "Scope LoginViewModel to a single screen; create PasswordResetViewModel"
  - "Replace collectAsState() with collectAsStateWithLifecycle() in ProfileScreen"
advisory_notes:
  - "Navigation routes use string constants — consider a sealed class route definition"
verification: "./gradlew :app:testDebugUnitTest"
```

## Review Flow

1. Load the Engineering State and identify the project's architecture style, module layout, and DI pattern.
2. Examine the code diff against the Required Checks checklist, flagging each violation with file:line.
3. For each violation, determine if it is blocking (prevents merge) or advisory (improvement opportunity).
4. If blocking, formulate a concrete required_revision that resolves the issue.
5. Compile all evidence into the gate report with full file:line citations.
6. If a revision round exists from a prior `fail` verdict, verify each required_revision was applied correctly.

## Antipatterns to Detect

- **Shared ViewModel antipattern**: A ViewModel injected into two unrelated navigation destinations, creating unintended coupling.
- **Bare collectAsState antipattern**: Flow collected without lifecycle awareness, causing work during background state.
- **Giant NavHost antipattern**: A single NavHost file exceeding 300 lines with navigation for every destination.
- **DTO leak antipattern**: An API response class or Room entity imported directly in a composable file.
- **ViewModel holding UI state antipattern**: TextField values or scroll positions stored in ViewModel instead of `remember`.
- **Module bypass antipattern**: A feature module directly importing another feature module's internal package.
- **Unused ViewModel scope**: A ViewModel with `viewModelScope.launch` that is never cancelled on screen exit, causing leaked coroutines.
- **No stateIn timeout antipattern**: `stateIn` without `WhileSubscribed` timeout, causing cold restart on rapid recomposition.

