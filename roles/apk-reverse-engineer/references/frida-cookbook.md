# Frida Cookbook Reference

Deep-dive companion to the `dynamic-analysis-frida` skill. Reusable hook recipes and the
adaptive-bypass loop in practice. Ready-to-load starters live in `scripts/hooks.js` —
this doc explains the recipes and how to adapt them to a specific app.

> Only instrument apps you own or are authorized to test — see the `legal-authorization`
> skill. Install `frida-tools` in a venv (see `scripts/setup-frida.sh`), never globally.

## Launching

```bash
FR=~/.local/share/frida-re/venv/bin
$FR/frida-ps -U                                    # list processes (confirms connectivity)
$FR/frida -U -f com.example.app -l hooks.js --no-pause   # spawn + inject at startup
$FR/frida -U -n com.example.app -l hooks.js        # attach to a running process
$FR/frida-trace -U -n com.example.app -j 'com.example.security.*!*'  # auto-trace a package
```

`-f ... --no-pause` (spawn) is essential for protections that trigger in
`Application.onCreate()` before you could attach.

## Recipe 1 — capture arguments & return value

```javascript
Java.perform(function () {
  var C = Java.use("com.example.data.AuthApi");
  C.login.overload("java.lang.String", "java.lang.String").implementation = function (email, pass) {
    console.log("[login] email=" + email + " pass=" + pass);
    var ret = this.login(email, pass);
    console.log("[login] ret=" + ret);
    return ret;
  };
});
```

Use `.overload(...)` when a method has multiple signatures; `frida` prints the available
overloads if you omit it and there's ambiguity.

## Recipe 2 — force a boolean check to pass

```javascript
var Root = Java.use("com.example.security.RootChecker");
Root.isRooted.implementation = function () { return false; };
```

The whole bypass method is: read the check in decompiled source → find the class+method
→ override it to return the "safe" value.

## Recipe 3 — SSL pinning bypass

```javascript
// OkHttp CertificatePinner
Java.use("okhttp3.CertificatePinner").check
  .overload("java.lang.String", "java.util.List").implementation = function () { return; };
```

For custom `X509TrustManager`, hook `checkServerTrusted` to return without throwing, or
hook Conscrypt's `TrustManagerImpl.verifyChain` to return the presented chain. After the
bypass, route traffic through Burp/mitmproxy with its CA trusted.

## Recipe 4 — discovery: enumerate loaded classes / methods

```javascript
Java.perform(function () {
  Java.enumerateLoadedClasses({
    onMatch: function (name) {
      if (/Root|Pin|Tamper|Integrity|Frida|Debug/i.test(name)) console.log(name);
    },
    onComplete: function () {}
  });
});
```

Great when the check's class name is obfuscated — find candidates at runtime, then hook
by the real (loaded) name.

## Recipe 5 — spoof device/emulator fingerprint

```javascript
var Build = Java.use("android.os.Build");
Build.FINGERPRINT.value = "google/walleye/walleye:...";  // real-device-like value
```

## The adaptive bypass loop (the method that matters)

Generic scripts fail against layered/custom protections. Instead:

1. **Read the protection statically** (Phase 6) — the exact class+method and its
   failure behavior (returns false? throws? kills the process?).
2. **Generate a targeted hook** for that method (use recovered Kotlin names if obfuscated).
3. **Run** with `-f ... --no-pause`, and **capture the crash log / behavior**:
   ```bash
   adb logcat -c && $FR/frida -U -f com.example.app -l hooks.js --no-pause; adb logcat -d > crash.log
   ```
4. **Read the failure** — which *next* check fired (protections layer: root → then
   integrity → then Frida-detection). Add the next hook.
5. **Iterate** until the app runs and you can observe what you need.

This defeats RASP/anti-tamper that public scripts miss, because you hook the app's
*actual* detection code, including bespoke checks.

## When Frida itself is detected

Apps may scan `/proc/self/maps`, open ports, or thread names for `frida`/`gum-js-loop`.
Options: hook the file/string check that does the scan; use a renamed `frida-server` and
non-default port; or use spawn-gating. Start by hooking the detection method you found
statically — same loop as above.

## Honesty rule

Document what you could **not** bypass. A partial bypass with a clear account of the
remaining protection is a real result; a fabricated "it works" is not.
