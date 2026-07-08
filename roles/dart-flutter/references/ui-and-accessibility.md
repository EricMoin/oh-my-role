# Flutter UI and Accessibility Reference

This document is the domain knowledge base for Flutter UI composition, layout constraints, adaptive patterns, and accessibility (a11y). It replaces thin checklist guides with substantive patterns and deep API knowledge.

---

## 1. Widget Composition

### Composition Over Inheritance

Flutter's widget system is built on composition, not inheritance. A `Container` is not a subclass of `DecoratedBox` — it *contains* one. This principle pervades the framework.

**Why composition wins:**
- You can combine behaviors freely. A widget that is both padded and tappable is `GestureDetector(padding: ...)`, not a hypothetical `TappablePaddedWidget`.
- No deep inheritance hierarchies. The `Widget` class is shallow — most custom widgets extend `StatelessWidget` or `StatefulWidget` directly.
- Hot-reload friendly. A composed widget tree is easy to disassemble and rewire.

### Extracting Widgets vs Helper Methods

```dart
// ❌ Helper method — breaks rebuild optimization
Widget _buildHeader(String title) {
  return Padding(padding: EdgeInsets.all(8), child: Text(title));
}

// ✅ Extracted Widget — proper key, proper element tree identity
class Header extends StatelessWidget {
  const Header({super.key, required this.title});
  final String title;
  Widget build(BuildContext context) {
    return Padding(padding: EdgeInsets.all(8), child: Text(title));
  }
}
```

**Rebuild implications**: A helper method returns a new widget tree fragment inline. Flutter cannot distinguish it from any other widget child in `build()`. An extracted `StatelessWidget` has its own `Element`, so Flutter can optimize updates via same-widget-type comparison.

**Rule**: Extract any widget subtree that has its own state, lifecycle, or could meaningfully receive a `const` constructor. Helper methods are acceptable for trivial, purely decorative wrappers that never change.

---

## 2. Layout Constraint System

### How Constraints Work

Flutter's layout has a fixed pipeline:

1. **Down**: The parent passes `BoxConstraints` to each child. Constraints say "you must be between this min and max."
2. **Up**: The child returns a `Size` within those constraints. The parent then positions it.
3. The child CANNOT change its parent's constraints. It can only choose its size within them.

### BoxConstraints: Tight vs Loose

| Constraint | Min == Max? | Effect |
|------------|-------------|--------|
| **Tight** | Yes (e.g., `BoxConstraints(100, 100)`) | Child has no choice — must be exactly that size |
| **Loose** | No (e.g., `BoxConstraints(0, 100)`) | Child can be any size between min and max |

- **Column/MainAxisAlignment**: `Column` passes tight horizontal constraints (you are as wide as the column) and loose vertical constraints (you can be as tall as you want, up to the column's max).
- **Row/MainAxisSize**: Same but swapped — tight vertically, loose horizontally.

### Common Layout Errors

| Error | Root Cause | Fix |
|-------|------------|-----|
| "Unbounded height in a `Column`" | A child of a `Column` has `Expanded` or `Flexible` nested inappropriately, or the column is in a `ListView` without a fixed height scroll direction | Wrap the column in `SizedBox`/`ConstrainedBox` or use `shrinkWrap: true` on the `ListView` |
| "`RenderFlex` overflowed" | A child's total intrinsic size exceeds the parent's tight constraint | Use `Flexible` to allow shrinking, `FittedBox` to scale, or `SingleChildScrollView` to allow scrolling |
| "Vertical viewport was given unbounded height" | A `ListView` or `Column` inside another scrollable widget with no height constraint | Give the inner scrollable an explicit height, or use `shrinkWrap: true` + `NeverScrollableScrollPhysics` |

### Debugging Layout

```dart
// Wrap a problematic widget to see its constraints
LayoutBuilder(
  builder: (context, constraints) {
    debugPrint('Constraints: $constraints');
    return YourWidget();
  },
);

// Or enable debug mode paint indicators
// In build(): add debugPaintSizeEnabled = true (import rendering.dart)
```

### Overflow and Clipping

```dart
ClipRect(
  child: OverflowBox(
    alignment: Alignment.center,
    minWidth: 0.0,
    maxWidth: 200.0,
    minHeight: 0.0,
    maxHeight: 200.0,
    child: YourWidget(),
  ),
)
```

---

## 3. Adaptive Layout Strategy

### LayoutBuilder (Parent-Relative)

```dart
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth > 600) {
      return WideLayout();
    } else {
      return NarrowLayout();
    }
  },
);
```

Use when a widget's layout depends on the space its **parent** allocates, not the whole screen.

### MediaQuery (Device-Level Information)

```dart
final mediaQuery = MediaQuery.of(context);
final isSmallScreen = mediaQuery.size.width < 600;
final isLandscape = mediaQuery.orientation == Orientation.landscape;
final textScale = mediaQuery.textScaleFactor;
```

Use `MediaQuery` when layout depends on device-level properties (screen size, orientation, text scale, system padding/insets).

### Window Size Classes (Material 3 Adaptive)

```dart
// Using the adaptive_scaffold or material_state pattern
if (display is MaterialDisplay) {
  // compact (0-599), medium (600-839), expanded (840+)
}
```

### Breakpoint Conventions

| Breakpoint | Class | Typical Target |
|------------|-------|----------------|
| 0 – 599 | Compact | Phone portrait |
| 600 – 839 | Medium | Tablet portrait, phone landscape |
| 840 – 1199 | Expanded | Tablet landscape |
| 1200+ | Large | Desktop |

### Platform-Aware Widgets

Use `Theme.of(context).platform` or `defaultTargetPlatform` to conditionally render platform-native patterns:

```dart
if (defaultTargetPlatform == TargetPlatform.iOS) {
  return CupertinoPageScaffold(...);
} else {
  return Material(...);
}
```

---

## 4. Accessibility Deep Dive

### The Semantics Tree

The semantics tree is a parallel tree to the widget tree, used exclusively by accessibility services (screen readers, switch control, braille displays). It is NOT the widget tree — it is a simplified, annotated version optimized for assistive technologies.

- Widgets automatically contribute to the semantics tree via built-in `Semantics` nodes.
- Custom widgets or images need explicit semantics.
- Use the **Semantics Debugger** (`showSemanticsDebugger: true` on `MaterialApp`) to visualize the tree.

### Key Semantics Widgets

| Widget | Purpose |
|--------|---------|
| `Semantics` | Add custom properties (label, value, hint, action) to a subtree |
| `MergeSemantics` | Merge adjacent semantic nodes into one — useful for composite widgets where individual parts do not have standalone meaning |
| `ExcludeSemantics` | Remove a subtree entirely from the semantics tree — for purely decorative elements |
| `BlockSemantics` | Remove semantics of preceding sibling nodes within the same semantic container |

### Adding Semantics to Custom Widgets

```dart
Semantics(
  label: 'Temperature reading',
  value: '${temperature}°C',
  hint: 'Double tap to toggle between Celsius and Fahrenheit',
  onTap: _toggleUnit,
  child: CustomPaint(painter: GaugePainter(temperature)),
)
```

### SemanticsProperties

```dart
Semantics.fromProperties(
  properties: SemanticsProperties(
    label: 'Volume slider',
    value: '${volume}%',
    increasedValue: '${(volume + 10).clamp(0, 100)}%',
    decreasedValue: '${(volume - 10).clamp(0, 100)}%',
    hint: 'Swipe up or down to adjust',
    isSlider: true,
  ),
  child: VolumeWidget(),
);
```

### Custom Semantics Actions

For complex interactions, define custom actions:

```dart
Semantics(
  customSemanticsActions: {
    CustomSemanticsAction(label: 'Subscribe'): _subscribe,
    CustomSemanticsAction(label: 'Mute'): _mute,
  },
  child: ...
)
```

### Testing Accessibility

```dart
// Using the semantics() matcher (from flutter_test)
final handle = tester.widget<Semantics>(find.bySemanticsLabel('Temperature'));
expect(handle, hasSemantics(TestSemantics(
  label: 'Temperature reading',
  value: '25°C',
)));

// Get the full semantics tree
final semanticData = tester.getSemantics(find.byType(MyWidget));
expect(semanticData, hasSemantics(TestSemantics(
  label: 'Submit',
  isButton: true,
  isEnabled: true,
)));
```

---

## 5. Keyboard and Focus Management

### FocusNode and FocusScope

```dart
final _focusNode = FocusNode();

@override
void dispose() {
  _focusNode.dispose();
  super.dispose();
}

// In build:
TextField(focusNode: _focusNode),
// Later:
_focusNode.requestFocus();
```

### Focus Traversal

```dart
FocusTraversalGroup(
  policy: OrderedTraversalPolicy(),  // tab order = widget order
  child: Column(
    children: [
      TextField(...),  // tab 1
      TextField(...),  // tab 2
      ElevatedButton(...), // tab 3
    ],
  ),
);
```

### Keyboard Shortcuts

```dart
Shortcuts(
  shortcuts: {
    SingleActivator(LogicalKeyboardKey.escape): const DismissActionIntent(),
    SingleActivator(LogicalKeyboardKey.keyS, control: true): const SaveIntent(),
  },
  child: Actions(
    actions: {
      DismissActionIntent: DismissAction(),
      SaveIntent: SaveAction(),
    },
    child: YourWidget(),
  ),
);
```

### FocusableActionDetector

Combines `Actions`, `Shortcuts`, `MouseRegion`, and `Focus` into one widget:

```dart
FocusableActionDetector(
  onShowHoverHighlight: (v) => setState(() => _hovered = v),
  onShowFocusHighlight: (v) => setState(() => _focused = v),
  actions: { ... },
  shortcuts: { ... },
  child: YourWidget(),
)
```

---

## 6. Text Scaling and Touch Targets

### Text Scaling

```dart
// Respect the user's system text scale
final scale = MediaQuery.textScaleFactorOf(context);
Text('Hello', style: TextStyle(fontSize: 16 * scale));

// To disable scaling (use sparingly — only for headings or oversized text):
Text('Hello',
  style: TextStyle(fontSize: 16),
  textScaleFactor: 0.9, // relative override
);

// MediaQuery override for a subtree:
MediaQuery(
  data: MediaQuery.of(context).copyWith(textScaleFactor: 1.2),
  child: ScalableSection(),
);
```

### Minimum Touch Target Size

Material Design specifies a minimum **48x48 logical pixels** touch target.

```dart
// ❌ Too small — icon-only button with 24x24 touch area
IconButton(icon: Icon(Icons.edit), onPressed: _edit)

// ✅ 48x48 padding around the icon
IconButton(
  icon: Icon(Icons.edit),
  onPressed: _edit,
  constraints: BoxConstraints(minWidth: 48, minHeight: 48),
)

// ✅ InkWell with padding
InkWell(
  onTap: _handleTap,
  child: Padding(
    padding: EdgeInsets.all(12),  // adds to icon's 24 → 48 total
    child: Icon(Icons.edit),
  ),
)
```

### MaterialTapTargetSize

```dart
// 'padded' (default) = 48dp min. 'shrinkWrap' = minimal tap target
ButtonTheme(
  materialTapTargetSize: MaterialTapTargetSize.padded,
  child: ElevatedButton(...),
)
```

---

## 7. Color and Contrast

### WCAG Contrast Ratios

| Level | Normal Text (<18pt) | Large Text (≥18pt bold or ≥14pt) |
|-------|---------------------|-----------------------------------|
| AA    | 4.5:1               | 3:1                               |
| AAA   | 7:1                 | 4.5:1                             |

### ColorScheme Accessibility

```dart
Theme(
  data: ThemeData.from(
    colorScheme: ColorScheme.fromSeed(
      seedColor: Colors.blue,
      brightness: Brightness.light,
    ),
  ).copyWith(
    // Ensure contrast on colored surfaces
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ButtonStyle(
        foregroundColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.disabled)) {
            return Colors.grey; // check contrast against button background
          }
          return Colors.white; // assumed high contrast on primary
        }),
      ),
    ),
  ),
)
```

### Color-Only Information

Never use color as the sole differentiator:

```dart
// ❌ Color only
Container(color: status == Status.error ? Colors.red : Colors.green)

// ✅ Color + text + icon
Row(
  children: [
    Icon(status == Status.error ? Icons.error : Icons.check_circle),
    SizedBox(width: 4),
    Text(status == Status.error ? 'Error' : 'Active'),
  ],
)
```

---

## 8. Screen Reader Announcements

### SemanticsService.announce

```dart
import 'package:flutter/semantics.dart';

SemanticsService.announce(
  'Item added to cart',
  TextDirection.ltr,
);
```

### Live Regions

Use `SemanticsProperties.liveRegion` for regions that update dynamically:

```dart
Semantics(
  liveRegion: true,  // screen reader will announce changes
  child: Text('3 new messages'),
)
```

### Route Announcements

`MaterialPageRoute` automatically announces route titles when `ModalRoute.of(context).semanticLabel` is set. Customize via:

```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => SettingsScreen(),
    settings: RouteSettings(
      arguments: ...,
    ),
  ),
);
```

---

## 9. Form Accessibility and Error Recovery

### TextFormField Semantics

```dart
TextFormField(
  decoration: InputDecoration(
    labelText: 'Email address',        // used as semantics label
    helperText: 'We will never share this', // supplementary hint
    errorText: hasError ? 'Invalid email' : null, // announced when present
  ),
  validator: (value) => ...,
  onFieldSubmitted: (_) => _submitForm(),
)
```

### Focusing Error Field

```dart
final _emailNode = FocusNode();
final _passwordNode = FocusNode();

void _handleSubmit() {
  if (!_emailController.text.contains('@')) {
    _emailNode.requestFocus();  // screen reader focus moves here
    // Error message is already set in TextFormField's errorText
  }
}
```

### Form Submission Announcement

```dart
void _submitForm() async {
  if (_formKey.currentState!.validate()) {
    SemanticsService.announce('Form submitted successfully', TextDirection.ltr);
    // Proceed...
  } else {
    SemanticsService.announce('Form has errors. Check highlighted fields.', TextDirection.ltr);
  }
}
```

### Error Message Best Practices

- Each error must identify which field has the problem and explain how to fix it.
- Avoid generic "Invalid input." — say "Email address must contain an @ symbol."
- Error messages set via `decoration.errorText` are automatically picked up by screen readers when the field gains focus.

---

## References

- Flutter API docs: Semantics, MergeSemantics, ExcludeSemantics — `/websites/api_flutter_dev_flutter`
- Flutter API docs: FocusNode, FocusScope, FocusTraversalOrder, LayoutBuilder, BoxConstraints — `/websites/api_flutter_dev_flutter`
- Flutter API docs: MediaQuery, MaterialTapTargetSize — `/websites/api_flutter_dev_flutter`
- Material Design accessibility guidelines: Material 3 — `/flutter/website`
- WCAG 2.1 contrast ratios: `w3.org/TR/WCAG21/#contrast-minimum`
