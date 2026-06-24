# Flutter Networking and Data Guide

Use this guide for HTTP, JSON, repositories, persistence, caches, and offline behavior.

## Checks

- Build URIs with `Uri` APIs.
- Inject API clients and storage dependencies.
- Treat 2xx as transport success and handle 204 without JSON decoding.
- Decode response bytes with UTF-8 when content may be non-ASCII.
- Map transport failures into the project's failure model.
- Keep DTOs at the data boundary and normalize domain models.
- Decide cache ownership: memory, disk, database, secure storage, or repository.
- Test success, non-2xx, timeout, malformed payload, empty body, and cache miss/hit paths.
