# Platform and Performance Reference

Comprehensive reference for Flutter performance profiling, optimization patterns, and multi-platform release configuration covering Android, iOS, web, and desktop.

---

## 1. Performance Profiling

### DevTools timeline

DevTools shows two event threads critical for performance diagnosis:

- **UI thread** — runs Dart code: `build()`, `layout`, `paint`, gesture handling. Jank here means your build/layout/paint is too slow per frame (target: <16ms at 60fps).
- **Raster thread** — runs the engine's rasterizer. Jank here means GPU-bound: too many draw calls, large textures, complex shaders.

**Diagnosis workflow**:
1. Run in profile mode (`flutter run --profile` on device — never profile in debug mode)
2. Open DevTools timeline
3. Look for red/grey bars marked "jank" — identify which thread
4. For UI jank: look at widget rebuild count, build methods, layout complexity
5. For raster jank: check repaint boundaries, image decode, shader compilation

### Performance overlay

```dart
// In MaterialApp
MaterialApp(
  showPerformanceOverlay: true,  // Shows UI and raster thread graphs
  ...
);
```

- Top graph: UI thread frame time
- Bottom graph: Raster thread frame time
- Green region: <16ms (60fps safe zone), red region: >16ms (jank threshold)

### Shader compilation jank

First-run animations often stutter because the GPU compiles shaders on demand. This is especially visible on Android (non-Impeller) and web (CanvasKit).

**Mitigations**:
- **SkSL warmup** (Android — Skia backend): run the app once, collect SkSL shaders from `flutter_cache_sksl`, bundle in release build
- **Impeller** (Android/iOS default since Flutter 3.19): precompiles shaders at engine build time — eliminates shader compilation jank entirely
- **Web CanvasKit**: consider `--web-renderer canvaskit` which bundles precompiled WebGL shaders

```bash
# Collect SkSL shaders for Android
flutter run --profile --cache-sksl --purge-persistent-cache
# (Perform animations in the app)
# SkSL data is written to a file — copy to project and bundle
```

### Build / layout / paint phase identification

When a widget rebuilds, these phases run in order:

| Phase | Cost trigger | How to identify |
|-------|-------------|-----------------|
| **Build** | `build()` method execution | DevTools widget rebuild count, `print` statements |
| **Layout** | Constraint resolution, size calculation | `debugPrintLayouts` or `RenderObject.debugCreator` |
| **Paint** | Painting layers, `CustomPainter.paint()` | `debugPaintSizeEnabled` visual overlay |

---

## 2. Rebuild Optimization

### const constructors

The single most impactful optimization. `const` widgets are canonicalized — Flutter creates them once and reuses across rebuilds.

```dart
// GOOD: const constructor — widget is created once
const Text('Hello', style: TextStyle(fontSize: 16));

// BAD: non-const — new instance every build
Text('Hello', style: TextStyle(fontSize: 16));
```

**When `const` matters most**: inside `build()` methods that are called frequently (list item builders, animated widgets, large subtrees).

### RepaintBoundary

Wraps a subtree so it paints into its own layer. When the subtree repaints, surrounding widgets are not repainted.

```dart
RepaintBoundary(
  child: AnimatedWidget(...),  // Only this subtree repaints
)
```

**Use when**: an animation or continuous repaint is isolated to a small area (progress indicators, animated icons, custom painters).

**Overhead**: each `RepaintBoundary` creates a separate layer — the engine must composite it. Do NOT wrap every widget; use selectively, confirmed by profiling.

### AutomaticKeepAliveClientMixin

For `PageView` or `TabBarView` children that should preserve state when off-screen:

```dart
class MyTabPage extends StatefulWidget { ... }

class _MyTabPageState extends State<MyTabPage>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);  // MUST call super.build
    return ...;
  }
}
```

### Splitting large widgets

```dart
// BAD: single giant build method
@override
Widget build(BuildContext context) {
  return Column(children: [
    _buildHeader(),   // State changes in header rebuild the entire column
    _buildBody(),     // even though only the footer changed
    _buildFooter(),
  ]);
}

// GOOD: each section is its own widget with its own build scope
// When _Footer rebuilds, _Header and _Body are not affected
@override
Widget build(BuildContext context) {
  return Column(children: const [
    _Header(),
    _Body(data: data),
    _Footer(),
  ]);
}
```

### Targeted rebuild patterns

```dart
// ValueListenableBuilder — only rebuilds when the listened value changes
ValueListenableBuilder<String>(
  valueListenable: nameNotifier,
  builder: (context, value, child) => Text(value),
)

// AnimatedBuilder — rebuilds at animation tick rate, children are static
AnimatedBuilder(
  animation: controller,
  builder: (context, child) => Transform.rotate(
    angle: controller.value,
    child: child,  // Does not rebuild on animation ticks
  ),
  child: const Icon(Icons.refresh),
)

// Selector (Riverpod) — rebuilds only when selected value changes
Consumer(builder: (context, ref, _) {
  final name = ref.watch(userProvider.select((u) => u.name));
  return Text(name);  // Only rebuilds when name changes, not when email changes
})
```

---

## 3. List Performance

### Builder vs non-builder

```dart
// EAGER — creates all items upfront. Use for small (<20 item) static lists.
ListView(children: [item1, item2, ...]);

// LAZY — creates items on scroll. Use for large or infinite lists.
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ListTile(title: Text(items[index])),
);
```

### Uniform item optimization

```dart
// itemExtent — skips layout for uniform-height items (biggest optimization)
ListView.builder(
  itemExtent: 72.0,  // All items are exactly 72px tall
  itemBuilder: (context, index) => ListTile(title: Text(items[index])),
);

// prototypeItem — measures one item and applies extent to all
ListView.builder(
  prototypeItem: ListTile(title: Text('Prototype')),
  itemBuilder: (context, index) => ListTile(title: Text(items[index])),
);
```

### SliverList vs SliverFixedExtentList

For `CustomScrollView` with multiple slivers, use `SliverFixedExtentList` when items have uniform height — it provides the same skip-layout optimization as `itemExtent`.

```dart
CustomScrollView(slivers: [
  SliverFixedExtentList(
    itemExtent: 72.0,
    delegate: SliverChildBuilderDelegate((context, index) => ...),
  ),
])
```

### Infinite scroll with pagination

```dart
// Detect end of list to trigger next page load
ListView.builder(
  itemCount: items.length + (hasMore ? 1 : 0),
  itemBuilder: (context, index) {
    if (index >= items.length) {
      // Trigger next page load
      _loadNextPage();
      return const Center(child: CircularProgressIndicator());
    }
    return ListTile(title: Text(items[index]));
  },
);
```

---

## 4. Image and Memory

### Image loading strategies

| Constructor | Caching | Best for |
|------------|---------|----------|
| `Image.asset()` | Bundled in app | Static assets, icons |
| `Image.network()` | `ImageCache` (memory, ~1000 entries default) | Remote images, small count |
| `CachedNetworkImage` (package) | Memory + disk cache | Remote images, repeated loads |

### Memory-efficient loading

```dart
// Decode to target size — drastically reduces memory
Image.network(
  'https://example.com/huge.jpg',
  cacheWidth: 400,   // Decode to 400px wide
  cacheHeight: 300,  // Decode to 300px tall
)

// Or use ResizeImage
Image(
  image: ResizeImage(
    NetworkImage('https://example.com/huge.jpg'),
    width: 400,
    height: 300,
  ),
)
```

Decoding at load time (rather than relying on layout to scale down) is the most impactful memory optimization for images.

### ImageCache configuration

```dart
// Access the shared singleton
final ImageCache cache = PaintingBinding.instance.imageCache;

// Configure limits
cache.maximumSize = 500;          // Max entries (default: ~1000)
cache.maximumSizeBytes = 50 << 20; // 50 MB (default: ~100 MB)

// Clear if memory pressure is detected (Flutter does this automatically on most platforms)
cache.clear();
```

---

## 5. Isolate Usage

### `compute()` — simple one-shot work

Flutter's convenience wrapper for spawning an isolate, running a function, and returning the result.

```dart
import 'package:flutter/foundation.dart';

Future<int> parseHeavyJson(String json) async {
  return compute(_countKeys, json);
}

static int _countKeys(String json) {
  final decoded = jsonDecode(json) as Map<String, dynamic>;
  return decoded.length;
}
```

**Constraints**: the callback must be a top-level or `static` function (no closures capturing instance state). Arguments and return value must be serializable via the `Isolate` message protocol.

### `Isolate.run()` — Dart 2.19+ native

Simpler than `compute()` — returns directly without `SendPort` plumbing.

```dart
import 'dart:isolate';

final result = await Isolate.run(() {
  // Heavy computation here
  return someExpensiveCalculation();
});
```

### Long-running isolate with SendPort/ReceivePort

For streaming computation or persistent background work:

```dart
final receivePort = ReceivePort();
await Isolate.spawn(_worker, receivePort.sendPort);

static void worker(SendPort sendPort) {
  final port = ReceivePort();
  sendPort.send(port.sendPort);

  port.listen((message) {
    final data = message as String;
    final result = processHeavy(data);
    sendPort.send(result);
  });
}
```

### What cannot cross isolate boundaries

- ❌ Flutter widgets or render objects
- ❌ `MethodChannel` / `EventChannel` instances
- ❌ Native platform objects (images from platform views)
- ❌ Non-message-passable types (closures, sockets, file handles)
- ✅ Primitive types, lists/maps, plain Dart objects (serialized via `SendPort`)

---

## 6. Platform: Android

### SDK versions

```groovy
// android/app/build.gradle
android {
    compileSdk 34               // Latest stable
    defaultConfig {
        minSdk 21               // Minimum supported (Flutter 3.22+: 23 minimum for background isolates)
        targetSdk 34            // Target latest — required for Play Store submission
    }
}
```

### ProGuard / R8

```groovy
// android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
            'proguard-rules.pro'
    }
}
```

**Common R8 rules** (kept in `proguard-rules.pro`):
```
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-keep class com.yourpackage.** { *; }          # Prevent obfuscation of model classes used in MethodChannel
-keepattributes *Annotation*                    # Retain annotations (needed for some plugins)
```

### Permissions

Declare in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.CAMERA"/>
```

Runtime permissions (Android 6.0+) use `permission_handler` package.

### Signing

```properties
# android/key.properties
storePassword=<password>
keyPassword=<password>
keyAlias=upload
storeFile=../key.jks
```

Reference in `android/app/build.gradle`:
```groovy
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

### Build flavors (productFlavors)

```groovy
// android/app/build.gradle
flavorDimensions "default"
productFlavors {
    dev {
        applicationIdSuffix ".dev"
        versionNameSuffix "-dev"
    }
    staging {
        applicationIdSuffix ".staging"
        versionNameSuffix "-stg"
    }
    prod {
        // Default config
    }
}
```

Build: `flutter build appbundle --flavor dev -t lib/main_dev.dart`

---

## 7. Platform: iOS

### Entitlements and capabilities

Located at `ios/Runner/Runner.entitlements`:

```xml
<key>com.apple.security.network.client</key>
<true/>
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:example.com</string>
</array>
```

### Privacy manifests (required since April 2024)

Apple requires `NSPrivacyAccessedAPITypes` in `ios/Runner/Info.plist` and a corresponding `PrivacyInfo.xcprivacy` when using certain APIs:

```xml
<key>NSPrivacyAccessedAPITypes</key>
<array>
    <dict>
        <key>NSPrivacyAccessedAPIType</key>
        <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
        <key>NSPrivacyAccessedAPITypeReasons</key>
        <array>
            <string>C617.1</string>  <!-- File access for app functionality -->
        </array>
    </dict>
</array>
```

**Required categories**: File Timestamp, Disk Space, Active/Inactive Status, User Defaults, System Boot Time. See Apple's documentation for reason codes.

### Signing

Configure in Xcode: Runner target → Signing & Capabilities → select team, bundle identifier, provisioning profile. For CI, use:

```bash
flutter build ios --release --export-options-plist=export_options.plist
```

### Info.plist permissions

```xml
<key>NSCameraUsageDescription</key>
<string>App needs camera access to scan documents</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>App needs photo access to upload images</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>App needs location to show nearby places</string>
```

### Podfile platform version

```ruby
# ios/Podfile
platform :ios, '13.0'   # Minimum iOS version
```

---

## 8. Platform: Web

### Renderer choice

```bash
# Auto-select (default) — CanvasKit on desktop, HTML on mobile
flutter build web

# Force CanvasKit (best rendering fidelity, larger WASM binary)
flutter build web --web-renderer canvaskit

# Force HTML (lighter, good for content-heavy pages)
flutter build web --web-renderer html

# Wasm compilation (Flutter 3.22+)
flutter build web --wasm
```

Detect renderer at runtime:
```dart
const isRunningWithWasm = bool.fromEnvironment('dart.tool.dart2wasm');
```

### CORS

Flutter web apps served from a different origin than their API must handle CORS:
- Development: use `--web-browser-flag "--disable-web-security"` (Chrome only, local dev)
- Production: configure CORS headers on the API server, or route through a same-origin proxy

### PWA configuration

Flutter web auto-generates a service worker and `manifest.json` in `web/`. Customize:

```json
// web/manifest.json
{
  "name": "My App",
  "short_name": "MyApp",
  "start_url": ".",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000"
}
```

PWA features (offline support, install prompt) are handled by the generated service worker.

### `dart:html` vs `package:web`

Post Dart 3.3, `dart:html` is deprecated. Use `package:web` for DOM interop:
```dart
import 'package:web/web.dart';

document.body?.append(document.createElement('div'));
```

---

## 9. Platform: Desktop

### macOS

```bash
flutter build macos
```

**Entitlements** (`macos/Runner/DebugProfile.entitlements`):
```xml
<key>com.apple.security.app-sandbox</key>
<true/>
<key>com.apple.security.network.client</key>
<true/>
<key>com.apple.security.files.user-selected.read-write</key>
<true/>
```

**Notarization**: macOS apps must be notarized by Apple for distribution outside the App Store. Use `xcrun notarytool`.

### Windows

```bash
flutter build windows
```

**MSIX packaging**: For Windows Store distribution, configure `windows/packaging/` for MSIX packaging. Use `flutter pub run msix:create` if using the `msix` package.

### Linux

```bash
flutter build linux
```

**Snap/Flatpak**: For Linux distribution, package as Snap (using `snapcraft.yaml`) or Flatpak (using `flatpak manifest`).

---

## 10. Build Flavors and Release Workflows

### Flavor configuration

| Layer | Configuration |
|-------|--------------|
| **Dart** | `--dart-define=ENV=staging` — accessed via `const bool.fromEnvironment('ENV')` or `String.fromEnvironment('ENV')` |
| **Android** | `productFlavors` in `android/app/build.gradle` |
| **iOS** | Xcode schemes — duplicate the Runner scheme per flavor, set `--dart-define` per scheme |

```bash
# Build a specific flavor
flutter build appbundle --flavor staging --dart-define=API_BASE_URL=https://staging.api.com
flutter build ios --flavor staging --dart-define=API_BASE_URL=https://staging.api.com
flutter build web --dart-define=API_BASE_URL=https://staging.api.com
```

### Release build commands

| Platform | Command |
|----------|---------|
| Android APK | `flutter build apk --release` |
| Android App Bundle | `flutter build appbundle --release` |
| iOS IPA | `flutter build ipa --release` |
| iOS (CI, no signing) | `flutter build ios --release --no-codesign` |
| Web | `flutter build web --release` |
| Web (wasm) | `flutter build web --wasm` |
| macOS | `flutter build macos --release` |
| Windows | `flutter build windows --release` |
| Linux | `flutter build linux --release` |

### Version management

```yaml
# pubspec.yaml
version: 1.2.3+4    # versionName: 1.2.3, versionCode: 4
```

Override per flavor:
```bash
flutter build appbundle --build-name=1.2.3-staging --build-number=42
```

**Convention**: `MAJOR.MINOR.PATCH+BUILD_NUMBER`. Use semantic versioning for releases. Increment build number monotonically per platform.
