---
name: compose-ui-architecture
description: Guides Compose screen ownership, UDF, ViewModel and UI state holders, lifecycle-aware collection, event delivery, DI, navigation, and feature boundaries. Use when structuring screens or coordinating shared UI behavior.
---
# Compose UI Architecture

Trace callers, ownership and lifetimes before adding layers. Keep the project's coherent
architecture. MVVM, MVI and presenters are implementation choices; state flowing down and
actions flowing to its owner is the core contract. File length and field count are not
acceptance criteria.

## Worked decisions

- [Screen state and boundaries](references/screen-state-patterns.md): complete repository
  Flow → UiState example, sharing policy, callback/action choice, DI owner, navigation and
  feature/data boundaries.
- [UI coordination](references/ui-coordination.md): the simplest suitable owner, remount-safe
  peer arbitration, content transfer/cleanup and tree-scoped CompositionLocal defaults.

Use the relevant section when these questions arise; the examples are optional patterns,
not a mandate to add layers or migrate the project's architecture.

## Choose the owner

| Responsibility | Typical owner |
| --- | --- |
| Local input, selection, expansion | Composable or hoisted state, saved when required |
| Reusable UI logic, gestures, animations, UI-scoped objects | Plain composition-scoped state holder |
| Screen business state, repository orchestration | ViewModel when its lifecycle benefits apply |
| Shared application data and persistence | Repository/data layer |
| Navigation, permission launchers, platform UI | Route or other appropriate UI owner |

Do not wrap a ViewModel in a coordinator that only forwards methods. Extract a holder for
a cohesive production responsibility, not solely for test access or a long parameter list.
Keep private helpers private and choose visibility from real consumers. A project-wide
presenter architecture is not a reason to add a new runtime to one screen.

ViewModels must not retain Activity, View, or other UI-lifetime objects. A remembered holder
survives recomposition, not removal or process death; its jobs and resources need lifetimes
matching that owner. `@Stable` is optional and must satisfy the actual contract; see
[runtime and state](../compose-runtime-state/SKILL.md).

## Screen boundary

When useful, let a route obtain the ViewModel and collect state, then give reusable content
only state and callbacks. Do not force a route/content split for a trivial component.
The example assumes the project defines `ProfileViewModel`, `ProfileScreen`, and its action
contract; imports are omitted. The caller supplies the correctly scoped ViewModel.

```kotlin
@Composable
fun ProfileRoute(viewModel: ProfileViewModel, onBack: () -> Unit) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    ProfileScreen(
        state = state,
        onAction = viewModel::onAction,
        onBack = onBack,
    )
}
```

- Expose read-only state; keep `MutableStateFlow` private. Specify its base type explicitly
  when initializing with one variant: `MutableStateFlow<UiState>(UiState.Loading)`.
- Model exclusive modes with a sealed type; independent facts can share a data class.
  Loading or refreshing need not erase already loaded content.
- Transform transport models when they leak wire-format concerns. Do not add redundant
  model layers or use cases that only forward calls.
- Repository work may start in `init` when required by ownership. For subscriber-driven
  flows, choose `stateIn` and `SharingStarted` intentionally. A stop timeout bridges short
  subscriber gaps, such as configuration changes; ordinary recomposition is not a restart.
- A ViewModel survives configuration changes but not process death. Reconstruct from IDs,
  `SavedStateHandle` and repositories; storing an object in a ViewModel is not persistence.

## Events and delivery

Handle immediate UI navigation or permission actions with callbacks at their UI owner.
When business work produces a result the UI must not miss, reduce it to observable UI state.
A pending message can have an ID; the UI acknowledges that ID after handling it, and the
owner clears only the matching message. This avoids clearing a newer result accidentally.
Persist the necessary facts when delivery must also survive process death. Navigation
derived from state needs explicit current-destination/idempotency rules.

`Channel` and `SharedFlow` do **not** guarantee exactly-once UI handling across lifecycle
changes. Cancellation, absent collectors, buffering, replay and multiple consumers affect
delivery. Preserve an existing event stream only when its loss/replay contract fits the
feature, and test it. A `LaunchedEffect(Unit)` is composition-scoped, not automatically
foreground-scoped; use lifecycle-aware collection and correct effect keys where required.
Do not classify state-backed pending work as inherently wrong.

For async search or refresh, define cancellation and stale-result rules. Starting a new
coroutine per keystroke can let an older result replace a newer query. Use the project's
latest-request strategy (cancellation plus a request identity when cancellation cannot
prevent stale completion), reset short queries, and handle failure without swallowing
cancellation. Business search belongs with the business owner, not in a UI-only holder.

## DI, navigation and modules

Follow the existing Hilt, Koin or manual factory setup. Resolve dependencies at an ownership
boundary, not deep inside reusable UI. Verify the actual `ViewModelStoreOwner` and DI scope;
a helper's name does not prove that it uses the intended navigation entry.

Pass stable IDs and small supported arguments between destinations; reload data at the
destination. Preserve back, deep links and restoration. A shared navigation-graph ViewModel
can be appropriate for a shared flow; one ViewModel per screen is not an absolute rule.
Repositories have their own DI lifetime and are not automatically scoped to a back-stack entry.

Keep feature dependencies directional and avoid cycles. Co-locate feature UI/state/tests
and share design primitives where the existing module structure supports it. A domain
layer or a feature navigation interface is useful only when it owns a real boundary.
Use `CompositionLocal` for suitable tree-scoped concerns with clear defaults and ownership,
not as a way to hide arbitrary dependencies.

## Coordinating shared UI

When multiple panes, overlays or editors compete for a singleton resource, put arbitration
in the shared owner. Define stable participant identity, eligibility, ordering and cleanup.
Do not assume registration order equals visual order, or that remounting preserves it.
Test enter/exit, remount, cancellation and overlapping participants. Explicit priority or
an enabled flag can be correct when it represents the owner's real policy; avoid embedding
one caller's incidental feature state into a generic component.

Before threading a derived flag through non-consuming layers, inspect existing ownership.
A fact may belong on an already shared holder when it has the same responsibility and
lifetime. Do not duplicate derivable state merely to eliminate a parameter. If a transition
temporarily transfers content ownership, define acquisition, completion and cancellation
cleanup together. Preserve guards and deferred draw/layout reads during a refactor.

## Verification and sources

Verify observable state transitions, latest-request behavior, lifecycle return, restoration
and navigation boundaries at the level that exposes the risk. Do not widen private APIs
for tests. API-specific changes follow resolved project versions and Context7/source checks.

Checked 2026-10-27:

- [State hoisting and owners](https://developer.android.com/develop/ui/compose/state-hoisting)
- [UI event handling and delivery](https://developer.android.com/topic/architecture/ui-layer/events)
- [Architecture recommendations](https://developer.android.com/topic/architecture/recommendations)
- [ViewModel lifetime](https://developer.android.com/topic/libraries/architecture/viewmodel)
