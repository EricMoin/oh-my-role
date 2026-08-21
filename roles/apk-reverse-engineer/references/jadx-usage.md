# jadx & Decompiler Usage Reference

Deep-dive companion to the `decompilation` skill. `${scripts}` refers to this role's
`scripts/` directory; the wrapper `decompile.sh` handles the common cases — reach for
raw CLI when you need finer control.

## jadx CLI (the primary decompiler)

```bash
jadx -d OUT app.apk                 # decompile code + resources into OUT/
jadx --no-res -d OUT app.apk        # code only (faster on large APKs)
jadx --deobf -d OUT app.apk         # stable synthetic names for obfuscated apps
jadx -r -d OUT app.apk              # --no-res alias on some builds
jadx --show-bad-code -d OUT app.apk # emit even methods jadx failed to fully decompile
jadx --threads-count 4 -d OUT app.apk
```

Key flags:

| Flag | Effect |
|------|--------|
| `-d <dir>` | output directory (`<dir>/sources`, `<dir>/resources`) |
| `--no-res` | skip resource decoding — much faster |
| `--deobf` | rename obfuscated identifiers to stable `p0`, `C0123` forms |
| `--deobf-min-len N` | min length before a name is considered obfuscated |
| `--show-bad-code` | keep partially-decompiled methods (raw smali-ish) instead of dropping them |
| `--no-imports` | fully-qualified names inline (sometimes clearer for tracing) |
| `--export-gradle` | emit a Gradle project layout |

`jadx-gui` is the interactive counterpart — great for "find usage", "go to
declaration", and manual navigation. For automation, the CLI is what the scripts use.

## When jadx struggles

- **Warnings / broken methods**: complex lambdas, generics, and streams sometimes
  decompile poorly. Re-run those classes through Vineflower and compare
  (`decompile.sh --engine both`).
- **Very few Java files**: the APK is likely a split-wrapper — the real code is in an
  inner `base.apk`. `decompile.sh` auto-detects and warns; extract and re-run.
- **`classes2.dex`, `classes3.dex`**: multidex is normal; jadx merges them.

## dex2jar + Vineflower/Fernflower (higher-quality Java)

Fernflower/Vineflower decompiles **JARs**, so for a DEX/APK convert first:

```bash
d2j-dex2jar app.apk -o app.jar -f          # -f overwrites existing output
vineflower app.jar out/                     # Vineflower (maintained Fernflower fork)
java -jar "$FERNFLOWER_JAR_PATH" app.jar out/  # classic Fernflower jar
```

Vineflower shines on: Kotlin lambdas, `when` expressions, generics, and stream chains.
Use it as a second opinion whenever a jadx class looks mangled.

## apktool (resources & smali)

```bash
apktool d app.apk -o app-apktool          # decode resources + smali
apktool b app-apktool -o patched.apk      # rebuild after smali edits
```

Use apktool when you need faithfully-decoded XML/resources, or to patch at the smali
level (e.g., flip a boolean check as an alternative to a Frida hook).

## AAB / XAPK

```bash
# AAB (App Bundle) -> universal APK
java -jar "$BUNDLETOOL_JAR_PATH" build-apks --bundle=app.aab --output=app.apks --mode=universal
unzip app.apks -d apks && jadx -d OUT apks/universal.apk

# XAPK (ZIP of base + splits) -> decompile the base APK
unzip app.xapk -d xapk && jadx -d OUT xapk/base.apk
```

## Pulling an APK off a device

```bash
adb shell pm list packages | grep example        # find the package
adb shell pm path com.example.app                 # get the APK path(s) — may be split
adb pull /data/app/.../base.apk .                 # pull it
```

## Practical output layout

```
OUT/
├── sources/       # decompiled Java (com/example/...)
└── resources/
    ├── AndroidManifest.xml
    ├── res/
    └── assets/
```

Everything the `structure-analysis`, `api-extraction`, and `security-audit` phases do
starts from `OUT/sources` and `OUT/resources/AndroidManifest.xml`.
