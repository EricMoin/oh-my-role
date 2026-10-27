# Layout and theme recipes

Use these examples with the project's resolved runtime, foundation, UI and Material 3
artifacts. Imports are explicit. They illustrate boundaries to adapt, not a new design
system or permission to change a working Material 2 surface incidentally.

## Theme owns brand and platform variation

Keep product colors, typography and shapes in the theme, and let screens consume semantic
tokens. Dynamic color is a product option; both theme mode and API availability matter.
This example's colors are sample tokens, not recommended brand values.

```kotlin
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

private val LightPalette = lightColorScheme(primary = Color(0xFF1565C0))
private val DarkPalette = darkColorScheme(primary = Color(0xFF90CAF9))
private val AppShapes = Shapes(medium = RoundedCornerShape(12.dp))
private val AppTypography = Typography()

@Composable
fun SampleTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val colors = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        darkTheme -> DarkPalette
        else -> LightPalette
    }
    MaterialTheme(
        colorScheme = colors,
        typography = AppTypography,
        shapes = AppShapes,
        content = content,
    )
}
```

Centralize spacing/elevation or additional semantic tokens in the existing design system
when Material tokens do not express them. Theme customization belongs here; raw styling
repeated across screens creates inconsistent dark mode and configuration behavior.

Source: [Material 3 theme setup](https://developer.android.com/codelabs/jetpack-compose-theming).

## Lazy identity and Scaffold content padding

This example consumes Scaffold insets once at the lazy-list boundary. It assumes each
`MessageRowData.id` is unique and durable, and that equal `kind` values describe compatible
row shapes. Using an item ID as its content type would disable useful reuse.

```kotlin
import androidx.compose.foundation.layout.consumeWindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

data class MessageRowData(val id: Long, val text: String, val kind: String)

@Composable
fun MessageList(rows: List<MessageRowData>, modifier: Modifier = Modifier) {
    Scaffold(modifier = modifier) { contentPadding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().consumeWindowInsets(contentPadding),
            contentPadding = contentPadding,
        ) {
            items(rows, key = { it.id }, contentType = { it.kind }) { row ->
                Text(row.text)
            }
        }
    }
}
```

Apply this according to the surrounding host's inset ownership: a nested screen should not
consume or add the same system-bar padding again. IME handling still needs its own check.
A simple `Column` is appropriate for a small finite group; use a lazy container for long or
unbounded data. Stable keys matter when item identity must survive moves, not as a blanket
claim that every static list without keys is broken. For a grid of consistently shaped
cells, `LazyVerticalGrid(columns = GridCells.Adaptive(minSize = ...))` can derive column
count from available width; its `items` extension comes from `foundation.lazy.grid`.

Sources: [Scaffold](https://developer.android.com/develop/ui/compose/components/scaffold),
[inset consumption](https://developer.android.com/develop/ui/compose/system/insets-ui), and
[lazy lists/grids](https://developer.android.com/develop/ui/compose/lists).

## Local size policy without a version-specific window API

Use window/posture APIs at screen/navigation level for pane and navigation policy. A local
component's actual allocation can differ from the whole window. This local example uses a
content-derived threshold supplied by its caller; `600.dp` in a call would be an example
choice, not a universal breakpoint or a device-type test.

```kotlin
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp

@Composable
fun ResponsivePair(
    minSideBySideWidth: Dp,
    secondary: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    primary: @Composable () -> Unit,
) {
    BoxWithConstraints(modifier) {
        if (maxWidth >= minSideBySideWidth) {
            Row {
                Box(Modifier.weight(1f)) { primary() }
                Box(Modifier.weight(1f)) { secondary() }
            }
        } else {
            Column {
                primary()
                secondary()
            }
        }
    }
}
```

The branches have different composition locations. Keep user state in an owner above this
branch, or use the project's supported movable/state-preserving pattern when the subtree
must retain its own instance. Do not infer that BoxWithConstraints itself resets all state.
Both branches need usable constraints: this example stacks content; a screen with long
content must choose the appropriate scrolling/pane strategy as well.

| Available room and task | Possible policy |
| --- | --- |
| Only one usable content pane | Stack or navigate to detail; compact navigation |
| More navigation room but not two useful content panes | Rail plus one content pane |
| Two panes fit their real minimum sizes | List/detail or supporting pane layout |
| Hinge or posture separates usable areas | Respect the folding feature and chosen pane policy |

Keep navigation selection/back behavior and business state shared when changing presentation.
Do not classify by phone/tablet name or scale every font to fill a wider window. Verify the
actual adaptive/window types and version before substituting a library's API for this policy.

Sources: [Adaptive sizing](https://developer.android.com/develop/ui/compose/layouts/adaptive),
[local constraints](https://developer.android.com/develop/ui/compose/layouts/basics), and
[state lifespans](https://developer.android.com/develop/ui/compose/state-lifespans).
