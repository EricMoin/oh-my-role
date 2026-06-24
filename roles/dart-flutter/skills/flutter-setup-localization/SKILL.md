---
name: flutter-setup-localization
description: Configure Flutter localization with `flutter_localizations`, `intl`, `l10n.yaml`, ARB files, and generated `AppLocalizations`. Use when initializing or extending localization, adding locales, placeholders, plurals, selects, or fixing gen-l10n setup.
---
# Internationalizing Flutter Applications

## Contents
- [Setup Workflow](#setup-workflow)
- [Implementation Workflow](#implementation-workflow)
- [Formatting](#formatting)
- [Examples](#examples)

## Setup Workflow

Use Flutter's `gen_l10n` pipeline and keep generated imports package-local.

- [ ] Add localization dependencies.
- [ ] Enable Flutter code generation.
- [ ] Create `l10n.yaml` with an explicit output directory.
- [ ] Add the app's template and locale ARB files.
- [ ] Configure `MaterialApp` or `CupertinoApp`.
- [ ] Run `flutter gen-l10n` or `flutter pub get` and fix ARB errors.

### 1. Add Dependencies

```bash
flutter pub add flutter_localizations --sdk=flutter
flutter pub add intl
```

Keep `intl` on a normal compatible constraint after resolution. Avoid leaving long-lived application code on `intl: any`.

### 2. Enable Code Generation

```yaml
flutter:
  generate: true
```

### 3. Configure `l10n.yaml`

```yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-dir: lib/l10n/generated
output-localization-file: app_localizations.dart
nullable-getter: false
use-escaping: true
```

With this configuration, import the generated API from your package path, for example:

```dart
import 'package:my_app/l10n/generated/app_localizations.dart';
```

### 4. Configure the App

```dart
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:my_app/l10n/generated/app_localizations.dart';

return MaterialApp(
  localizationsDelegates: const [
    AppLocalizations.delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
  ],
  supportedLocales: AppLocalizations.supportedLocales,
  home: const HomeScreen(),
);
```

## Implementation Workflow

- If creating new content, add the base string to the template ARB file with metadata that explains context.
- If editing existing content, update every supported locale file in the same change.
- Use generated getters and methods from widgets below `MaterialApp` / `CupertinoApp`.
- Run `flutter gen-l10n` or `flutter pub get`; fix malformed JSON, missing placeholders, and untranslated required keys.

```json
{
  "helloUser": "Hello {userName}",
  "@helloUser": {
    "description": "Greeting shown on the signed-in home screen",
    "placeholders": {
      "userName": {
        "type": "String",
        "example": "Sam"
      }
    }
  }
}
```

```dart
final l10n = AppLocalizations.of(context);
Text(l10n.helloUser(user.name));
```

## Formatting

Use ICU placeholders, plurals, and selects for grammar-sensitive text.

```json
{
  "itemCount": "{count, plural, =0{No items} =1{1 item} other{{count} items}}",
  "@itemCount": {
    "description": "Number of items in a list",
    "placeholders": {
      "count": {
        "type": "num",
        "format": "compact"
      }
    }
  },
  "pronoun": "{gender, select, male{he} female{she} other{they}}",
  "@pronoun": {
    "description": "Pronoun used in profile summary",
    "placeholders": {
      "gender": {
        "type": "String"
      }
    }
  }
}
```

## Examples

### Complete `l10n.yaml`

```yaml
arb-dir: lib/l10n
template-arb-file: app_en.arb
output-dir: lib/l10n/generated
output-localization-file: app_localizations.dart
nullable-getter: false
use-escaping: true
untranslated-messages-file: untranslated_messages.json
```

### Widget Usage

```dart
import 'package:flutter/material.dart';
import 'package:my_app/l10n/generated/app_localizations.dart';

class GreetingWidget extends StatelessWidget {
  const GreetingWidget({
    super.key,
    required this.userName,
    required this.notificationCount,
  });

  final String userName;
  final int notificationCount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Column(
      children: [
        Text(l10n.helloUser(userName)),
        Text(l10n.itemCount(notificationCount)),
      ],
    );
  }
}
```
