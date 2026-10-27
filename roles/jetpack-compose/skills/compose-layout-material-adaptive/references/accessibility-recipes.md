# Accessibility and form recipes

Prefer standard controls and their built-in semantics. Use these examples when composing a
larger interaction target or custom visual. They need runtime, foundation, UI and Material 3
from the target project; snippets are independent and show their imports. Sample English
labels belong in the app's localized resources in production.

## One logical toggle with a label and one action

Let the row own toggling and disable the child switch's separate callback. This avoids two
independent touch actions for the same state; the visible label remains in the semantics.
The caller owns state, while the row implements touch/keyboard and accessibility interaction.

```kotlin
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.toggleable
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp

@Composable
fun LabeledSwitch(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 48.dp)
            .toggleable(value = checked, role = Role.Switch, onValueChange = onCheckedChange)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, modifier = Modifier.weight(1f))
        Switch(checked = checked, onCheckedChange = null)
    }
}
```

Inspect the merged semantics and actual TalkBack output. Do not blindly add an identical
`contentDescription` to both row and text. For custom state wording, use a localized
`stateDescription` when the default on/off description is insufficient. If a row also has
an independent secondary action, preserve that action rather than merging or clearing it
away. Use `clearAndSetSemantics` only when the replacement fully expresses the interaction.

Source: [Built-in semantics and parent toggles](https://developer.android.com/develop/ui/compose/accessibility/api-defaults).

## Custom progress visuals still expose their value

```kotlin
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

@Composable
fun ProgressStrip(fraction: Float, modifier: Modifier = Modifier) {
    require(fraction.isFinite())
    val progress = fraction.coerceIn(0f, 1f)
    val color = MaterialTheme.colorScheme.primary
    Canvas(
        modifier.fillMaxWidth().height(4.dp).semantics {
            progressBarRangeInfo = ProgressBarRangeInfo(progress, 0f..1f)
        },
    ) {
        drawRect(color, size = Size(size.width * progress, size.height))
    }
}
```

This is noninteractive determinate progress, so a 48 dp hit target and an invented
`Role.ProgressBar` are not appropriate. A custom adjustable control additionally needs
real input handling and accessible adjustment actions; use the standard Slider if possible.
For important newly appearing status text, `LiveRegionMode.Polite` can be appropriate;
continuously changing progress/timers should not repeatedly interrupt announcements.

Source: [Semantics, progress and live regions](https://developer.android.com/develop/ui/compose/accessibility/semantics).

## Validation that keeps input and directs correction

The caller supplies error state and validation policy. Focus is requested from the user's
button action after the field exists, never as an unconditional composition-body call.
`isError` and supporting text communicate the problem with more than color alone.

```kotlin
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester

@Composable
fun NameForm(
    name: String,
    onNameChange: (String) -> Unit,
    errorMessage: String?,
    validateAndSave: () -> Boolean,
    modifier: Modifier = Modifier,
) {
    val nameFocus = remember { FocusRequester() }
    Column(modifier) {
        OutlinedTextField(
            value = name,
            onValueChange = onNameChange,
            label = { Text("Name") },
            isError = errorMessage != null,
            supportingText = { errorMessage?.let { Text(it) } },
            modifier = Modifier.focusRequester(nameFocus),
        )
        Button(onClick = {
            if (!validateAndSave()) nameFocus.requestFocus()
        }) { Text("Save") }
    }
}
```

Here `validateAndSave` means synchronous validation: `false` leaves the current input intact
and publishes the field error through the owner; `true` accepts the input and delegates any
async save to the owner. It must not block the UI thread. For multiple fields, focus the
first invalid *visible* field after validation; when the error target is conditionally added,
request focus in an effect after its node enters composition.

Prefer natural traversal. If a real layout needs an override, create a requester for each
existing target and apply `focusProperties { next = nextRequester; previous = previousRequester }`
before its focus target. This affects keyboard focus, not TalkBack traversal; verify both.
Do not use integer `focusOrder` calls or add a second focus target to an already-focusable
text field. Check IME visibility, scrolling to the invalid field and retained input on-device.

Sources: [Request focus](https://developer.android.com/develop/ui/compose/touch-input/focus/request-focus)
and [focus traversal](https://developer.android.com/develop/ui/compose/touch-input/focus/focus-traversal).

## Custom text drawing with current scaling and semantics

Prefer `Text` for ordinary labels; it handles sizing, text semantics and layout for you.
For a label integrated into an existing bounded custom graphic, retain the current theme
style and measure against the actual drawing area. This recipe uses `drawWithCache` so
text/layout work is rebuilt when the observed inputs, density or drawing size change.
The caller must supply usable bounds (for example, a chart's label region).

```kotlin
import androidx.compose.foundation.layout.Spacer
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.text
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Constraints

@Composable
fun GraphicLabel(label: String, modifier: Modifier = Modifier) {
    val measurer = rememberTextMeasurer()
    val style = MaterialTheme.typography.bodyLarge.copy(
        color = MaterialTheme.colorScheme.onSurface,
    )
    Spacer(
        modifier.semantics { text = AnnotatedString(label) }.drawWithCache {
            val measured = measurer.measure(
                text = AnnotatedString(label),
                style = style,
                constraints = Constraints(
                    maxWidth = size.width.toInt().coerceAtLeast(0),
                    maxHeight = size.height.toInt().coerceAtLeast(0),
                ),
                density = this,
                layoutDirection = layoutDirection,
            )
            onDrawBehind { drawText(measured) }
        },
    )
}
```

This preserves font-scale-aware measurement; using `sp` was never the original bug.
It does not make a fixed-size graphic magically fit arbitrary text. Check long/RTL labels
and large font settings; increase the allocated region or use a normal text layout when
content would be clipped. Semantics expose the text, not a duplicate content description.
For actionable text, provide real input handling as well; a drawn label alone is not a button.

Source: [Text measurement and drawing](https://developer.android.com/develop/ui/compose/graphics/draw/overview).

## Checks that examples cannot settle

Verify large text and RTL with real content. `sp` honors scaling with the current conversion;
custom text drawing should use the current text measurement/density and expose semantics.
Do not hide essential error or action text behind fixed heights or ellipsis to make a test
pass. Informative imagery needs a meaningful description; decorative/already-described
imagery uses null. Check contrast and non-color state cues across themes, and check actual
hit areas for overlap when small visuals receive minimum-target expansion.
