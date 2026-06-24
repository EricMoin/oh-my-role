---
name: flutter-implement-json-serialization
description: Implement Flutter/Dart JSON serialization with hand-written models or code generation (`json_serializable` / `freezed`). Use when mapping API payloads, local cache records, DTOs, domain models, or adding `fromJson`/`toJson` behavior.
---
# Serializing JSON in Flutter

## Contents
- [Choose a Strategy](#choose-a-strategy)
- [Manual Serialization](#manual-serialization)
- [Generated Serialization](#generated-serialization)
- [Validation](#validation)
- [Examples](#examples)

## Choose a Strategy

- Use hand-written `fromJson` / `toJson` for small, stable, low-nesting models.
- Use `json_serializable` when models are numerous, nested, renamed, nullable, or need consistent generated mapping.
- Use `freezed` with `json_serializable` when immutable unions, copy helpers, equality, or sealed-like API states are valuable.
- Keep DTO/API models separate from domain models when the API shape leaks transport details, unstable names, or nullable fields that the domain should normalize.

## Manual Serialization

- Decode with `jsonDecode`, then cast to the expected shape.
- Prefer pattern matching for validation-heavy parsing.
- Throw `FormatException` for malformed payloads.
- Write tests for required fields, optional fields, wrong types, and round-tripping.
- Offload very large payload parsing with `compute()` or an isolate only when parsing cost can cause UI jank.

## Generated Serialization

Add dependencies according to the project's existing code-generation stack:

```bash
flutter pub add json_annotation
flutter pub add dev:build_runner dev:json_serializable
```

For `freezed`:

```bash
flutter pub add freezed_annotation
flutter pub add dev:freezed
```

Generate code with:

```bash
dart run build_runner build --delete-conflicting-outputs
```

Use `flutter pub run` only in legacy projects that have not moved to `dart run`.

## Validation

- [ ] Confirm the selected strategy matches project conventions.
- [ ] Add serialization tests.
- [ ] Run code generation if needed.
- [ ] Run `dart analyze` or `flutter analyze`.
- [ ] Run relevant tests.

## Examples

### Manual Model with Pattern Matching

```dart
class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
  });

  final int id;
  final String name;
  final String email;

  factory User.fromJson(Map<String, dynamic> json) {
    return switch (json) {
      {
        'id': int id,
        'name': String name,
        'email': String email,
      } =>
        User(id: id, name: name, email: email),
      _ => throw const FormatException('Invalid User payload'),
    };
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
    };
  }
}
```

### `json_serializable` Model

```dart
import 'package:json_annotation/json_annotation.dart';

part 'user_dto.g.dart';

@JsonSerializable()
class UserDto {
  const UserDto({
    required this.id,
    required this.fullName,
  });

  final int id;

  @JsonKey(name: 'full_name')
  final String fullName;

  factory UserDto.fromJson(Map<String, dynamic> json) {
    return _$UserDtoFromJson(json);
  }

  Map<String, dynamic> toJson() => _$UserDtoToJson(this);
}
```

### Parsing a List

```dart
List<User> parseUsers(String body) {
  final decoded = jsonDecode(body) as List<dynamic>;
  return decoded
      .cast<Map<String, dynamic>>()
      .map(User.fromJson)
      .toList(growable: false);
}
```
