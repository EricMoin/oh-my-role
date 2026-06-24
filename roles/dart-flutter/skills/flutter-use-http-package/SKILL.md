---
name: flutter-use-http-package
description: Implement cross-platform Flutter HTTP networking with `package:http`, injected clients, JSON decoding, timeouts, status handling, and UI/data-layer integration. Use when fetching, sending, updating, deleting, or testing REST API data.
---
# Implementing Flutter Networking

## Contents
- [Configuration](#configuration)
- [Request Guidelines](#request-guidelines)
- [Workflow](#workflow)
- [Examples](#examples)

## Configuration

```bash
flutter pub add http
```

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
```

Platform permissions:

- Android: add `android.permission.INTERNET` to `android/app/src/main/AndroidManifest.xml`.
- macOS: add `com.apple.security.network.client` to DebugProfile and Release entitlements.
- iOS and web usually need no app-level internet permission, but web requests must satisfy CORS.

## Request Guidelines

- Inject `http.Client` into services/repositories so tests can use fakes or mocks.
- Use `Uri` APIs, including `Uri.https` or `uri.replace(queryParameters: ...)`, instead of string concatenation.
- Use string header names such as `'authorization'`, `'accept'`, and `'content-type'` so examples remain Flutter Web compatible.
- Apply a bounded timeout to network calls and surface timeout failures explicitly.
- Treat any `statusCode >= 200 && statusCode < 300` as transport success; handle `204 No Content` without JSON decoding.
- Decode response bytes with UTF-8 before `jsonDecode` when APIs may return non-ASCII content.
- Do not return `null` for failure. Return a typed result, throw a domain exception, or map the error into the app's existing failure type.
- Keep HTTP execution out of widget `build` methods. Trigger it from a repository, ViewModel/controller, provider, or an initialized `Future`.

## Workflow

- [ ] Define the request method and typed return value.
- [ ] Inject `http.Client`.
- [ ] Build the `Uri` and headers.
- [ ] Execute with timeout.
- [ ] Validate status codes, including empty-body success.
- [ ] Decode and map JSON to typed models.
- [ ] Add tests for success, non-2xx, malformed JSON, timeout, and empty response when relevant.
- [ ] Integrate through the project's existing state/data pattern.

## Examples

### API Client

```dart
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class PhotosApi {
  PhotosApi({
    required http.Client client,
    required Uri baseUri,
  })  : _client = client,
        _baseUri = baseUri;

  final http.Client _client;
  final Uri _baseUri;

  Future<List<Photo>> fetchPhotos({String? token}) async {
    final uri = _baseUri.replace(path: '/photos');
    final response = await _client.get(
      uri,
      headers: {
        'accept': 'application/json',
        if (token != null) 'authorization': 'Bearer $token',
      },
    ).timeout(const Duration(seconds: 15));

    if (response.statusCode == 204) {
      return const [];
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        'Failed to load photos',
        statusCode: response.statusCode,
      );
    }

    final body = utf8.decode(response.bodyBytes);
    final decoded = jsonDecode(body) as List<dynamic>;
    return decoded
        .cast<Map<String, dynamic>>()
        .map(Photo.fromJson)
        .toList(growable: false);
  }
}

class Photo {
  const Photo({
    required this.id,
    required this.title,
    required this.thumbnailUrl,
  });

  final int id;
  final String title;
  final String thumbnailUrl;

  factory Photo.fromJson(Map<String, dynamic> json) {
    return Photo(
      id: json['id'] as int,
      title: json['title'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String,
    );
  }
}
```

### Widget Integration

```dart
class PhotoGallery extends StatefulWidget {
  const PhotoGallery({super.key, required this.api});

  final PhotosApi api;

  @override
  State<PhotoGallery> createState() => _PhotoGalleryState();
}

class _PhotoGalleryState extends State<PhotoGallery> {
  late final Future<List<Photo>> _futurePhotos;

  @override
  void initState() {
    super.initState();
    _futurePhotos = widget.api.fetchPhotos();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Photo>>(
      future: _futurePhotos,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }

        if (!snapshot.hasData) {
          return const Center(child: CircularProgressIndicator());
        }

        final photos = snapshot.data!;
        return ListView.builder(
          itemCount: photos.length,
          itemBuilder: (context, index) {
            final photo = photos[index];
            return ListTile(
              leading: Image.network(photo.thumbnailUrl),
              title: Text(photo.title),
            );
          },
        );
      },
    );
  }
}
```
