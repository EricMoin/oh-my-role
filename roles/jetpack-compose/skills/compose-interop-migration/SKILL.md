---
name: compose-interop-migration
description: Guides XML/View and Compose interoperability, Activity/Fragment integration, navigation boundaries, AndroidView usage, ComposeView disposal, and incremental migration from legacy Android UI.
---
# Compose Interop and Migration

Most Android apps migrate incrementally. Interop code must make lifecycle, state ownership, and disposal explicit so Compose and View systems do not fight each other.

## Migration Strategy

- Migrate feature by feature or screen by screen, not by rewriting the whole app.
- Keep architecture boundaries stable while UI implementation changes.
- Start with leaf components or isolated screens when risk is high.
- Preserve analytics, accessibility, saved state, navigation, and test coverage.
- Use adapters at boundaries instead of mixing View and Compose assumptions everywhere.

## Compose in View Hierarchies

Use `ComposeView` when embedding Compose in XML, Fragment, or legacy View screens.

Key rules:

- Set an appropriate `ViewCompositionStrategy`.
- Dispose composition with the view lifecycle in Fragments.
- Pass state and callbacks from the existing owner rather than resolving new dependencies inside the composable.
- Keep theming consistent with the app.

```kotlin
binding.composeContainer.apply {
    setViewCompositionStrategy(
        ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
    )
    setContent {
        AppTheme {
            AccountCard(
                state = viewModel.accountState,
                onClick = viewModel::onAccountClick,
            )
        }
    }
}
```

## Views in Compose

Use `AndroidView` for platform/custom views that do not yet have a Compose equivalent.

```kotlin
AndroidView(
    factory = { context ->
        MapView(context).apply {
            // one-time view setup
        }
    },
    update = { mapView ->
        // update from Compose state
    },
)
```

Rules:

- Put one-time setup in `factory`; update state in `update`.
- Remember or manage lifecycle-sensitive Views according to their API.
- Clean up listeners/resources with `DisposableEffect` when needed.
- Do not recreate expensive Views on every recomposition.

## Navigation Boundaries

- Avoid mixing multiple navigation stacks unless the app already does so intentionally.
- Prefer one owner for back stack state per app area.
- When using Navigation Compose inside a Fragment app, define the boundary clearly.
- Pass IDs/routes, not heavy mutable objects.
- Preserve deep links and saved state behavior during migration.

## State and Lifecycle

- Do not duplicate state between View widgets and Compose state.
- Choose one source of truth and bridge changes through callbacks or observable state.
- Use `collectAsStateWithLifecycle` in Compose route layers.
- In Fragments, tie collection to `viewLifecycleOwner`.
- Verify process death and configuration changes for migrated screens.

## Theming

- Bridge legacy theme attributes to Compose tokens when the app still uses XML themes.
- Keep typography, color, shapes, and elevation visually consistent during partial migration.
- Do not hard-code colors in Compose to match old XML screens; map them into theme/design tokens.

## Workflow

1. Identify the migration boundary: component, screen, flow, or navigation graph.
2. Inventory state owners, lifecycle owners, navigation events, analytics, and tests.
3. Choose direction: Compose in Views with `ComposeView`, Views in Compose with `AndroidView`, or full screen conversion.
4. Implement the boundary adapter and keep source of truth singular.
5. Verify lifecycle disposal, saved state, accessibility, visual parity, and navigation/back behavior.
6. Add tests around the migrated boundary and keep rollback small.

## Validation Checklist

- [ ] Composition disposal matches the lifecycle owner.
- [ ] State has one source of truth across View and Compose layers.
- [ ] Expensive Android Views are not recreated during recomposition.
- [ ] Navigation/back/deep-link behavior is preserved.
- [ ] Theming is bridged through tokens or theme adapters.
- [ ] Migration is incremental and reversible at the feature boundary.
