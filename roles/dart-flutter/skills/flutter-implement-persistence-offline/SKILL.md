---
name: flutter-implement-persistence-offline
description: Implement Flutter persistence, caching, secure storage, local databases, repository caches, and offline-first behavior. Use when adding shared_preferences, flutter_secure_storage, sqflite/drift/isar/hive, cache invalidation, sync, migrations, or offline UX.
---
# Implementing Persistence and Offline Behavior

## Choose Storage

- `shared_preferences`: small non-sensitive settings.
- Secure storage plugin: tokens, secrets, credentials, and sensitive key-value data.
- File/cache directory: downloaded files, thumbnails, and disposable cache data.
- SQLite/drift/sqflite or another database: relational data, queries, migrations, and offline entities.
- Repository memory cache: short-lived data within one app session.

## Workflow

- [ ] Identify data sensitivity, size, query needs, lifetime, and offline requirements.
- [ ] Follow existing project storage choices when present.
- [ ] Keep storage behind repositories or data sources.
- [ ] Define cache invalidation and refresh behavior.
- [ ] Plan migrations before changing persisted schema.
- [ ] Surface offline, stale, empty, and sync error states in UI.
- [ ] Add tests with fake storage or temporary databases.

## Sync Checks

- Avoid overwriting newer local changes with stale remote data.
- Store sync metadata when conflicts or retries matter.
- Make destructive operations explicit and recoverable where practical.
- Keep secrets out of logs and crash reports.
