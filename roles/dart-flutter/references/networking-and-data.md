# Networking and Data Reference

Comprehensive reference for Flutter/Dart HTTP networking, JSON serialization, error handling, caching architecture, offline-first patterns, secure storage, and database selection.

---

## 1. HTTP Patterns

### `package:http` — client abstraction

The foundational HTTP package. Designed for simple request/response flows.

```dart
import 'package:http/http.dart' as http;

class ApiClient {
  final http.Client client;

  ApiClient({required this.client});

  Future<Map<String, dynamic>> fetchUser(String id) async {
    final response = await client.get(
      Uri.parse('https://api.example.com/users/$id'),
      headers: {'Accept': 'application/json'},
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}
```

**Key principles**:
- Always inject `http.Client` — never create instances inside the class. This enables `MockClient` in tests.
- Build URIs with `Uri` API methods (`Uri.parse`, `Uri.https`, `Uri.http`), never string concatenation.
- Handle `204 No Content` — the body is empty, skip `jsonDecode`.

### Dio — advanced HTTP client

Choose Dio when you need interceptors, request cancellation, FormData uploads with progress, or retry logic.

```dart
final dio = Dio(BaseOptions(
  baseUrl: 'https://api.example.com',
  connectTimeout: const Duration(seconds: 10),
  receiveTimeout: const Duration(seconds: 10),
));

// Interceptors: auth tokens, logging, retry
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) {
    options.headers['Authorization'] = 'Bearer $token';
    return handler.next(options);
  },
  onError: (error, handler) {
    if (error.response?.statusCode == 401) {
      // Refresh token and retry
    }
    return handler.next(error);
  },
));

// Cancel a request
final cancelToken = CancelToken();
dio.get('/data', cancelToken: cancelToken);
cancelToken.cancel('User navigated away');
```

**When to choose Dio over `http`**:
- Need request/response interceptors (auth injection, logging, retry)
- Need request cancellation (e.g., search-as-you-type, navigation away)
- Need upload/download progress tracking
- Need interceptors for refresh-token flows

### Timeout and retry strategies

```dart
// Timeout on http client
try {
  final response = await client
      .get(uri)
      .timeout(const Duration(seconds: 10));
} on TimeoutException {
  // Handle timeout
}

// Retry with exponential backoff
Future<T> retry<T>(Future<T> Function() fn, {int maxRetries = 3}) async {
  for (var attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt == maxRetries - 1) rethrow;
      await Future.delayed(Duration(seconds: 2 ^ attempt));
    }
  }
  throw StateError('Unreachable');
}
```

**When to retry**: network timeouts, 5xx server errors. **Never retry** 4xx client errors (400, 401, 403, 404) — they will fail identically.

### Status code handling

```dart
switch (response.statusCode) {
  case 200:
  case 201:
    return jsonDecode(response.body);
  case 204:
    return null;  // No content
  case 400:
    throw BadRequestException(response.body);
  case 401:
    throw UnauthorizedException();
  case 403:
    throw ForbiddenException();
  case 404:
    throw NotFoundException();
  case 500:
  case 502:
  case 503:
    throw ServerException(response.statusCode, response.body);
  default:
    throw UnknownApiException(response.statusCode, response.body);
}
```

---

## 2. JSON Serialization

### Hand-written `fromJson` / `toJson`

Use for simple models (≤5 fields) or rapid prototyping. No build runner needed.

```dart
class User {
  final String id;
  final String name;

  const User({required this.id, required this.name});

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}
```

### `json_serializable` — annotation-based generation

Use when the model count exceeds ~10 or models change frequently.

```dart
import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  User({required this.id, required this.name});

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  final String id;
  final String? name;

  @JsonKey(name: 'full_name')  // Map snake_case API field
  final String? displayName;

  @JsonKey(includeFromJson: false, includeToJson: true)  // Write-only field
  final DateTime? createdAt;

  Map<String, dynamic> toJson() => _$UserToJson(this);
}
```

**Key annotations**:
- `@JsonKey(name: 'api_field')` — map JSON field names
- `@JsonKey(defaultValue: ...)` — default when field is null/missing
- `@JsonKey(includeIfNull: false)` — omit null fields from serialization
- `@JsonKey(fromJson: ..., toJson: ...)` — custom converters for single fields

### `freezed` — immutable models with union types

Best for complex domain models, sealed state classes, and models with copyWith needs.

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
sealed class User with _$User {
  const factory User({
    required String id,
    required String name,
    String? email,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

// Generated: copyWith, ==, hashCode, toString, toJson, fromJson

// Union type for API states
@freezed
sealed class ApiResult<T> with _$ApiResult<T> {
  const factory ApiResult.success(T data) = _Success<T>;
  const factory ApiResult.error(String message) = _Error<T>;
}
```

**Choosing between approaches**:

| Approach | Threshold | Trade-offs |
|----------|-----------|------------|
| Hand-written | ≤10 models | No code gen, boilerplate for large models |
| `json_serializable` | 10-50 models | Build runner dependency, but minimal boilerplate |
| `freezed` | Complex domains | Heavier code gen, but immutability + copyWith + union types |

---

## 3. Error Model Mapping

Never expose transport errors directly to the UI. Map at the repository boundary.

```dart
// Transport layer — raw exceptions
sealed class ApiException implements Exception {
  final String message;
  ApiException(this.message);
}
class NetworkException extends ApiException { ... }
class TimeoutException extends ApiException { ... }
class ServerException extends ApiException { ... }
class UnauthorizedException extends ApiException { ... }

// Domain layer — meaningful failure models
sealed class Failure {
  final String userMessage;
  Failure(this.userMessage);
}
class ConnectionFailure extends Failure {
  ConnectionFailure() : super('No internet connection. Please try again.');
}
class TimeoutFailure extends Failure {
  TimeoutFailure() : super('Request timed out. Please check your connection.');
}
class ServerFailure extends Failure {
  ServerFailure() : super('Something went wrong. Please try again later.');
}
class UnauthorizedFailure extends Failure {
  UnauthorizedFailure() : super('Session expired. Please log in again.');
}

// Repository — the translation boundary
class UserRepository {
  Future<Result<User>> fetchUser(String id) async {
    try {
      final user = await apiClient.fetchUser(id);
      return Result.success(user);
    } on NetworkException {
      return Result.failure(ConnectionFailure());
    } on TimeoutException {
      return Result.failure(TimeoutFailure());
    } on UnauthorizedException {
      return Result.failure(UnauthorizedFailure());
    } on ApiException {
      return Result.failure(ServerFailure());
    }
  }
}
```

---

## 4. Caching Architecture

### Memory cache

```dart
class MemoryCache<K, V> {
  final Map<K, V> _store = {};
  final Map<K, DateTime> _expiry = {};
  final Duration ttl;

  MemoryCache({this.ttl = const Duration(minutes: 5)});

  void set(K key, V value) {
    _store[key] = value;
    _expiry[key] = DateTime.now().add(ttl);
  }

  V? get(K key) {
    final expiry = _expiry[key];
    if (expiry == null || DateTime.now().isAfter(expiry)) {
      _store.remove(key);
      return null;
    }
    return _store[key];
  }

  void invalidate(K key) => _store.remove(key);
  void clear() => _store.clear();
}
```

### Disk cache

Use a file-based cache for large payloads (images, HTML fragments). `CachedNetworkImage` handles this for images.

### Database-backed cache

Store serialized API responses in a database table alongside `last_fetched_at` and `expires_at` columns. Query cache first, refresh in background.

### Cache invalidation strategies

| Strategy | Description | Best for |
|----------|-------------|----------|
| **TTL** | Expire after fixed duration | Reference data (country list, static config) |
| **Stale-while-revalidate** | Return cached, fetch in background, update | Dashboard data, feed items |
| **Event-driven** | Invalidate when mutation occurs (e.g., write → clear list cache) | CRUD operations |
| **Pull-to-refresh** | User-initiated invalidation | Any screen where freshness matters |

---

## 5. Offline-First Patterns

### Optimistic writes with sync queue

```dart
class SyncQueue {
  final List<SyncOperation> _pending = [];

  Future<void> enqueue(SyncOperation op) async {
    _pending.add(op);
    await _applyLocally(op);   // Update local state immediately
    await _syncToServer(op);   // Attempt server sync
  }

  Future<void> _syncToServer(SyncOperation op) async {
    try {
      await apiClient.execute(op.toRequest());
      _pending.remove(op);
    } on NetworkException {
      // Keep in queue — will retry on connectivity restored
    }
  }
}
```

### Conflict resolution strategies

| Strategy | Description | When to use |
|----------|-------------|------------|
| Last-write-wins | Latest timestamp wins (simplest) | Non-critical data (notes, tags) |
| Merge | Combine remote + local changes | Collaborative documents |
| User-choice | Show conflict dialog, let user pick | Critical data (financial, profile) |

### Connectivity detection

```dart
import 'package:connectivity_plus/connectivity_plus.dart';

final connectivity = Connectivity();
connectivity.onConnectivityChanged.listen((result) {
  if (result.contains(ConnectivityResult.wifi) ||
      result.contains(ConnectivityResult.mobile)) {
    syncQueue.processPending();
  }
});
```

### Sync indicators in UI

Show a subtle sync status indicator (e.g., a small icon in the app bar):
- Green check: all synced
- Spinner: syncing in progress
- Warning icon: pending changes, offline
- Error icon: sync failed

---

## 6. Secure Storage

### `flutter_secure_storage`

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const storage = FlutterSecureStorage();

// Write
await storage.write(key: 'auth_token', value: token);

// Read
final token = await storage.read(key: 'auth_token');

// Delete
await storage.delete(key: 'auth_token');

// Clear all
await storage.deleteAll();
```

### Platform differences

| Platform | Backend | Notes |
|----------|---------|-------|
| **iOS** | Keychain | Data survives app uninstall (by default). Use `accessibility` option for biometric protection. |
| **Android** | EncryptedSharedPreferences (AES-256) | Key stored in Android Keystore. Requires API 23+. Falls back to AES with RSA encryption. |
| **macOS** | Keychain | Same as iOS — data is encrypted and can be synchronized across devices. |
| **Linux** | libsecret | Requires D-Bus session. Not available on headless servers. |
| **Windows** | DPAPI | Data encrypted with user credentials. |
| **Web** | WebCrypto | Data is not persisted (in-memory only in some implementations). |

### Biometric-gated access

```dart
final storage = FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
    authenticationType: AuthenticationType.biometric,
  ),
);
```

**Use for**: refresh tokens, API keys, payment credentials.
**Do not use for**: user preferences, cached data, public config — use regular storage for these.

---

## 7. Database Selection Guide

| Database | Type | Best For | Trade-offs |
|----------|------|----------|------------|
| **`sqflite`** | SQL (raw) | Simple relational data, small datasets, no code-gen preference | No web support, manual migration scripts, string-based queries (no compile-time checks) |
| **`drift`** | SQL (typed) | Type-safe SQL, complex queries, reactive streams, migrations | Build runner dependency (`drift_dev`), steeper initial setup, larger API surface |
| **`Isar`** | NoSQL (typed) | High-performance reads, embedded docs, full-text search | Binary size increase (~4MB), NoSQL constraints (no JOIN, limited query complexity) |
| **`Hive`** | KV store | Fast key-value, simple models, no native dependencies | No relations, no complex queries, box-based organization |
| **`shared_preferences`** | KV (simple) | Settings, flags, onboarding state | No encryption, blocking on some platforms, size limits (~100KB recommended max) |

### Decision heuristic

```
Need relational queries (JOIN, WHERE, ORDER BY)?
  ├─ Yes → Need compile-time type safety?
  │        ├─ Yes → drift
  │        └─ No  → sqflite
  └─ No  → Need relations at all?
           ├─ Yes → Isar (embedded documents)
           └─ No  → Need persistence?
                    ├─ Yes → Hive
                    └─ No  → shared_preferences
```

### Migration approach

- **sqflite**: version-based `onUpgrade` callback with manual SQL
- **drift**: schema version + `migrate` callback with auto-generated migration tests (`drift_dev` ships a migration test helper)
- **Isar**: schema-based — change schema, bump version, migration is handled for simple changes
- **Hive**: adapt type IDs per `TypeAdapter` — incompatible changes require a new adapter

---

## 8. Repository Cache Invalidation

### Event-driven invalidation

```dart
class UserRepository {
  final _cache = MemoryCache<String, User>();
  final _eventBus = EventBus(); // Your event bus (e.g., Riverpod stream, dart:async)

  Stream<User> watchUser(String id) {
    // Emit cached value immediately if available
    final cached = _cache.get(id);
    if (cached != null) yield cached;

    // Fetch fresh data
    final fresh = await fetchUser(id);
    _cache.set(id, fresh);
    yield fresh;

    // Listen for invalidation events
    await for (final event in _eventBus.events) {
      if (event is UserUpdated && event.userId == id) {
        _cache.invalidate(id);
        final updated = await fetchUser(id);
        _cache.set(id, updated);
        yield updated;
      }
    }
  }
}
```

### Pull-based refresh (pull-to-refresh)

```dart
RefreshIndicator(
  onRefresh: () async {
    cache.invalidate('user_list');
    setState(() { _users = await repository.fetchUsers(); });
  },
  child: ListView(...),
);
```

### Stale-while-revalidate (SWR)

```dart
Future<User> getUser(String id) async {
  final cached = _cache.get(id);
  if (cached != null) {
    // Return cached immediately, refresh in background
    _refreshInBackground(id);
    return cached;
  }
  return _fetchAndCache(id);
}

Future<void> _refreshInBackground(String id) async {
  try {
    final fresh = await fetchUser(id);
    _cache.set(id, fresh);
    _notifyListeners(id, fresh);  // Push update to UI
  } catch (_) {
    // Silently fail — UI already has stale data
  }
}
```

### Composite strategy per data type

| Data type | Strategy | Why |
|-----------|----------|-----|
| User profile | Stale-while-revalidate (5 min TTL) | OK to show stale data briefly |
| Product list | TTL (2 min) | Needs freshness, but not critical |
| Shopping cart | Event-driven (invalidate on add/remove) | Must be consistent with server |
| Notification count | Pull-to-refresh | User action triggers refresh |
| Static config | TTL (1 hour) | Changes rarely |
| Auth token | Eviction-based (on 401 response) | Must clear immediately on expiry |
