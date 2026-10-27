# UI logic ownership and shared coordination

Use this reference when a scoped refactor risks moving a responsibility to the wrong
lifetime, or when several UI instances compete for a shared resource. Start with the
existing callers and mechanism; do not introduce a generic coordinator by default.

## Choose the simplest owner that fits

| Situation | Start with | Escalate only when |
| --- | --- | --- |
| Business state/actions already owned by a ViewModel | Its existing methods and observable state | A responsibility needs a distinct production contract/lifetime |
| Small local UI state such as expansion | Hoisted state or a small remembered holder | Multiple UI operations need cohesive coordination |
| Gestures, animation or sequencing that needs a View/composition scope | A plain UI state holder bound to that UI lifetime | Its own lifecycle and consumers justify a larger abstraction |
| Several callbacks already represent one coherent action vocabulary | Named callbacks, or the existing sealed action sink | Do not add a holder merely to reduce parameter count |
| Existing project-wide presenter runtime | Follow its ownership and testing conventions | Introducing a different runtime on one screen has a concrete benefit |

A `Coordinator` that only forwards `refresh()` and `save()` to a ViewModel adds no owner;
pass the existing methods instead. Conversely, moving View references into a ViewModel to
shorten a composable leaks the UI lifetime. A plain holder must not become a bag containing
capture, navigation, analytics and permissions just because they appear on one screen.

Get `rememberCoroutineScope()` in composition, then pass the scope to the holder; it cannot
be called inside a non-composable `remember` calculation. If a remembered holder changes,
a shared composition scope may still contain jobs launched by the old instance: decide
whether to cancel those jobs, retain the holder, or bind an explicit child scope to its
lifetime. Retaining a scope is not a blanket promise to preserve every in-flight operation.
Keep declarative effects and lifecycle-aware collection in their appropriate composition
boundary. Update changing callbacks deliberately; do not hide stale captures behind a
stable annotation or unobserved public mutable fields.

## Arbitrate peers in the shared resource owner

Example: a base editor and an overlay both exist, but only the active surface should receive
an input event. A feature-specific `disableBaseWhenCameraOverlayShows` flag embeds one
caller's knowledge in a generic router. A third participant then requires more wiring.
A resource owner can instead decide from participant identity, eligibility and the actual
ordering policy. An `enabled` value is still valid when it expresses a participant's own
eligibility; explicit priority is valid when priority really is the product rule.

Distinguish the lifetimes before defining the registry:

| Operation | Meaning |
| --- | --- |
| Enter | A logical participant joins the ordering model |
| Attach/update handler | Its current UI instance supplies a callback; the logical position stays put |
| Detach handler | This UI instance can no longer receive events; it does not necessarily end the logical participant |
| Leave | The logical owner ends; remove its slot and retained resources |

These are application protocol concepts, not Android APIs. If the participant and UI
instance have exactly the same lifetime, a simple register/unregister pair may be enough.
If AnimatedContent, a conditional branch or rehosting can remount the UI while the logical
surface survives, attach/detach needs an identity beyond the composable instance. Same-owner
reattachment must not silently push the participant to the top. Do not preserve detached
slots forever: the logical owner must have a definite Leave path.

Derive dynamic stacking from the actual surface model, not arbitrary remount order or a
static enum maintained for every new overlay. Conversely, do not replace a deliberate
business-priority policy with last-registration-wins. Preserve where existing guards run;
changing gating order is a behavior change, not a mechanical refactor.

Check these scenarios through the real routing boundary:

1. Base enters, overlay enters: the intended surface receives the event.
2. Base UI remounts while the overlay stays: the base does not steal priority.
3. Overlay detaches during a transition: eligibility follows the declared policy.
4. Overlay leaves or the operation cancels: the next eligible surface wins and no slot leaks.
5. A third surface joins: existing peers need no feature-specific suppression changes.

## Avoid parallel channels through an existing holder

Suppose a transition temporarily draws content normally owned by a review layer. Passing
`retakeAnimationRunning` through several components that do not consume it spreads the
mechanism into unrelated signatures. First state the invariant: only one owner draws the
content at a time. If an existing review holder already owns that fact and follows the
same lifetime, expose an ownership concept such as `contentBorrowed`, not the name of
one particular animation.

That is not permission to duplicate derived state indiscriminately. Use the existing
single source when the consumer can read it without crossing a responsibility boundary.
A direct state/callback parameter to a stateless child is ordinary composition and often
simpler than a holder or CompositionLocal. Do not pass the entire animation controller
down merely to eliminate one callback.

For a real ownership transfer, specify:

- Acquire only when the transition actually starts; a refused start must not hide content.
- Return ownership on completion, cancellation, failure and owner teardown.
- If operations can overlap, use identity/token-aware release so an old completion cannot
  release content currently borrowed by a newer operation.
- Preserve the original guard and read site. A snapshot read inside `graphicsLayer {}`
  updates the layer without requiring a composition read; moving it into the composable
  body changes that performance contract. Test the actual phase-sensitive behavior.

This retains the useful diagnosis behind “prop drilling” without turning every boolean
parameter or every one-hop state pass into an architectural violation.

## Tree-scoped UI context with a usable default

A CompositionLocal can express a concern whose meaning follows the UI subtree. This small
example supplies spacing policy; it does not hide a feature repository or ViewModel.

```kotlin
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

val LocalCompactSpacing = compositionLocalOf { false }

@Composable
fun SpacingPolicy(compact: Boolean, content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalCompactSpacing provides compact, content = content)
}

@Composable
fun SpacedContent(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val padding = if (LocalCompactSpacing.current) 8.dp else 16.dp
    Box(modifier = modifier.padding(padding)) { content() }
}
```

`compositionLocalOf` tracks readers and invalidates those readers when the provided value
changes. `staticCompositionLocalOf` does not track reads and changing its value recomposes
the provider's content; use it for values that rarely or never change. Neither name makes
the stored object immutable. Prefer reasonable defaults so isolated previews/tests can
work; a fail-fast default is appropriate only when absence truly violates the contract.

Local reads are implicit dependencies. Use explicit parameters for reusable component
inputs unless subtree scope is the actual abstraction; do not use a Local solely to hide
a large arbitrary dependency surface. Inspect nested providers and lifetime when debugging.

Sources: [state holders](https://developer.android.com/develop/ui/compose/state-hoisting),
[CompositionLocal](https://developer.android.com/develop/ui/compose/compositionlocal), and
[deferred reads](https://developer.android.com/develop/ui/compose/performance/bestpractices).
