# Preview fixtures and configuration coverage

Use previews to inspect meaningful state/configuration combinations without booting the app.
They do not prove click outcomes, lifecycle behavior or device accessibility. Prefer the
same content composable used in production, supplied with deterministic data and callbacks.

## One content fixture, several configurations

This self-contained example needs Material 3 and `ui-tooling-preview` (plus the project's
preview tooling at development time). In an app, wrap content in its actual theme and use
its existing state type instead of introducing a second production model for previews.

```kotlin
import android.content.res.Configuration
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.tooling.preview.PreviewParameter
import androidx.compose.ui.tooling.preview.PreviewParameterProvider

class StatusSamples : PreviewParameterProvider<String> {
    override val values = sequenceOf(
        "No saved items",
        "Saved items are ready",
        "Unable to load items. Try again when the connection returns.",
    )
}

@Composable
private fun StatusContent(message: String) {
    Column {
        Text("Library", style = MaterialTheme.typography.titleLarge)
        Text(message)
    }
}

@Preview(name = "Compact", widthDp = 360, showBackground = true)
@Preview(name = "Large text", widthDp = 360, fontScale = 1.5f, showBackground = true)
@Preview(
    name = "Wide dark",
    widthDp = 840,
    uiMode = Configuration.UI_MODE_NIGHT_YES,
    showBackground = true,
)
@Composable
fun StatusPreview(@PreviewParameter(StatusSamples::class) message: String) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) darkColorScheme() else lightColorScheme(),
    ) {
        StatusContent(message)
    }
}
```

Select configurations by risk instead of generating the full Cartesian product for every
component. Useful fixtures include loading, empty, content, recoverable failure, long text,
RTL/localized text, disabled actions and expanded layout. A wide canvas alone does not
exercise a second pane if the content is not given the corresponding layout policy.

## When a preview fails

- Locate the content boundary before trying to make a live ViewModel/DI graph run in the
  preview renderer. Supply state and callbacks; do not change production visibility solely
  for a preview.
- Replace network, database, time and image-loading inputs with deterministic fixtures at
  their existing boundaries. Preview annotations do not make a remote image deterministic.
- Ensure the preview uses the actual theme family, fonts and relevant resources. A global
  theme default may hide a dark-theme or resource configuration failure.
- Keep preview-only classes in the project's supported preview/debug source location when
  they should not ship in release. Reuse shared sample providers when they reduce duplication.
- Extract a multipreview annotation for repeated configuration sets if supported by the
  resolved tooling version; avoid requiring an annotation on every public composable.

Source: [Compose previews and sample providers](https://developer.android.com/develop/ui/compose/tooling/previews).
