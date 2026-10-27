---
name: compose-interop-migration
description: Guides incremental View/Compose migration, ComposeView disposal, AndroidView creation and reuse, lifecycle ownership, saved state, and navigation boundaries. Use for embedding either UI system in the other or debugging interop lifetime bugs.
---
# Compose Interop and Migration

Migrate at a clear component, screen or flow boundary. Preserve state ownership, navigation,
analytics, accessibility and restoration while changing the rendering implementation.
Use the existing DI/theme conventions and keep one source of truth across the boundary.

## Compose inside Views

Use `ComposeView` and choose `ViewCompositionStrategy` for its host. In a Fragment's view,
`DisposeOnViewTreeLifecycleDestroyed` ties composition to that view's lifecycle rather than
the Fragment object's lifetime. Pooling containers have different disposal/reuse semantics;
do not mechanically apply one strategy everywhere. Multiple ComposeViews in the same layout
need unique stable IDs for saved state.

Illustrative Fragment binding setup; the project supplies `AppTheme`, `AccountCard` and
`viewModel.accountState: StateFlow<AccountUiState>`. Imports are omitted.

```kotlin
binding.composeContainer.apply {
    setViewCompositionStrategy(
        ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
    )
    setContent {
        val account by viewModel.accountState.collectAsStateWithLifecycle()
        AppTheme {
            AccountCard(state = account, onClick = viewModel::onAccountClick)
        }
    }
}
```

Release Fragment view bindings when the view is destroyed. View-side Flow collectors use
`viewLifecycleOwner` and the appropriate lifecycle boundary; Compose-side collection follows
its provided lifecycle owner. Check that both refer to the intended host.

## Views inside Compose

Construct the View in `AndroidView.factory`, not in an outer `remember`. Use `update` for
current state and listeners that need fresh callbacks. It also runs after initial creation.
This small bridge uses a standard Android `TextView`; imports are omitted.

```kotlin
@Composable
fun LegacyLabel(text: String, modifier: Modifier = Modifier) {
    AndroidView(
        modifier = modifier,
        factory = { context -> TextView(context) },
        update = { view -> view.text = text },
    )
}
```

Views with lifecycle/resource requirements (maps, video, camera, WebView) need their own
API-specific start/stop/release integration; this label example is not a lifecycle template.
When supported by the resolved Compose UI version, `onRelease` handles final release and
non-null `onReset` enables compatible reuse, including lazy containers. Reset transient
state/listeners before reuse. Do not assume `onReset` is immediately followed by `update`.
Pair other registrations with cleanup and do not retain an old Activity across recreation.

## Migration sequence

1. Inventory the current state/lifecycle owners, saved-state keys, navigation and back/deep
   links, theme, analytics callbacks and boundary tests before replacing rendering.
2. Start with a leaf or isolated screen when the larger flow is risky. Choose ComposeView
   or AndroidView from the existing host; keep the surrounding ownership contract stable.
3. Put translation in one boundary adapter. Avoid resolving a second ViewModel or copying
   widget values into a competing state holder inside that adapter.
4. Verify old/new behavior through the same observable journey: recreation, input, back,
   accessibility and analytics timing where relevant. Compile the affected host/test variant.
5. Keep the migration increment reversible at the selected feature boundary. Remove the old
   rendering path only once parity and required checks support the replacement.

## Boundary checklist

- One owner for each state value; bridge updates through observable state and callbacks.
- One deliberate navigation/back-stack owner per area; preserve back, deep links and saved state.
- Existing theme tokens bridge legacy attributes without scattered hard-coded matching colors.
- Build IDs and small arguments into restoration, rather than relying on retained View objects.
- Verify mount/unmount, Fragment view recreation, reuse, listener freshness and final release.
- Verify relevant accessibility, focus/IME and visual parity through the real boundary.

## Sources

Checked 2026-10-27; confirm the exact overloads against the project's resolved versions.

- [ComposeView strategies and Fragment integration](https://developer.android.com/develop/ui/compose/migrate/interoperability-apis/compose-in-views)
- [AndroidView creation and reuse](https://developer.android.com/develop/ui/compose/migrate/interoperability-apis/views-in-compose)
- [AndroidView release contract](https://developer.android.com/reference/kotlin/androidx/compose/ui/viewinterop/AndroidView.composable)
