# Compose component examples

Read only for component API or modifier refactoring. These snippets use Compose
runtime, foundation, and Material 3; imports are shown and dependencies come from the
target project. They are illustrative components, not a standalone Android app.

## Required inputs, optional modifier, trailing content

```kotlin
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ActionCard(
    title: String,
    onAction: () -> Unit,
    modifier: Modifier = Modifier,
    actionLabel: String = "Open",
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title)
            content()
            Button(onClick = onAction) { Text(actionLabel) }
        }
    }
}
```

The required callback precedes `modifier`; the primary slot stays last for a trailing
lambda. Internal content padding is part of the card's design. Caller padding and
size constraints can still be supplied through its root modifier. In product code,
localize default labels through the project's resource conventions.

Source: [AndroidX element and layout conventions](https://github.com/androidx/androidx/blob/androidx-main/compose/docs/compose-api-guidelines.md#elements-accept-and-respect-a-modifier-parameter).

## Choose the hit area deliberately

```kotlin
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun PaddedAction(label: String, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Text(label, modifier.clickable(onClick = onClick).padding(16.dp))
}

@Composable
fun ActionWithOuterSpacing(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Text(label, modifier.padding(16.dp).clickable(onClick = onClick))
}
```

In the first component, padding is inside the clickable area. In the second, padding
is outside it. Neither ordering is universally correct; choose the intended interaction
and check minimum touch-target behavior in the actual layout.

## Reuse stateless chains

```kotlin
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

private val labelSpacing = Modifier.padding(vertical = 4.dp)

@Composable
fun LabelPair(first: String, second: String, modifier: Modifier = Modifier) {
    Column(modifier = modifier) {
        Text(first, modifier = labelSpacing)
        Text(second, modifier = labelSpacing)
    }
}
```

A shared padding chain is safe. Keep layout-scoped modifiers, such as `weight`, on
children of the matching parent scope. A chain capturing a callback, state holder,
focus requester, or interaction source needs a separate ownership decision.

Source for ordering, reuse, and scopes:
[Compose modifiers](https://developer.android.com/develop/ui/compose/modifiers).
