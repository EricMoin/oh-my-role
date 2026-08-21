# Protection Bypass Playbook Reference

Deep-dive companion to `security-audit` (Phase 6) and `dynamic-analysis-frida` (Phase 7).
A per-protection map: how to recognize it statically, and where to hook it dynamically.
The governing method is always the **adaptive bypass loop** (see `frida-cookbook.md`):
find the real check in decompiled code, hook that specific method, read the next failure,
iterate. This is for authorized testing only (`legal-authorization`).

## Layering: protections fire in sequence

A hardened app rarely has one gate. Expect a chain: **root detection → integrity/
signature check → SSL pinning → Frida/debugger detection → emulator detection → RASP
callbacks**. Bypass one, the next fires. Work the loop; don't assume a single hook is enough.

---

## 1. Root detection

**Recognize (static):** RootBeer (`com.scottyab.rootbeer`), checks for `su`, `busybox`,
Magisk paths, `test-keys` in `Build.TAGS`, root-manager package names, SafetyNet/Play
Integrity attestation callbacks, or a custom `RootChecker`/`SecurityUtils`.

```bash
grep -rn 'rootbeer\|isRooted\|/system/bin/su\|test-keys\|Magisk\|SafetyNet\|PlayIntegrity\|attest' <src>
```

**Bypass (dynamic):** override the detection methods to return `false`/success. For
RootBeer, hook all of `isRooted*`, `checkForBinary`, `detectRootManagementApps`,
`detectPotentiallyDangerousApps`, `checkForSuBinary`, `checkForDangerousProps`. For
attestation, hook the app's result handler (you usually can't forge the server verdict,
so neutralize the client-side gate).

## 2. Integrity / signature / anti-tamper

**Recognize:** `PackageManager.getPackageInfo(..., GET_SIGNATURES/GET_SIGNING_CERTIFICATES)`,
CRC/hash comparison of `classes.dex` or resources against a baked-in value, `assets`
checksum files.

```bash
grep -rn 'getPackageInfo\|GET_SIGNATURES\|signingInfo\|CRC32\|MessageDigest.*dex\|checksum' <src>
```

**Bypass:** hook the signature getter to return the expected signature bytes, or hook the
comparison method to return `true`. Alternatively patch the check in smali (apktool) and
rebuild — but that fights other integrity checks, so a Frida hook is usually cleaner.

## 3. SSL / certificate pinning

**Recognize:** `okhttp3.CertificatePinner`, `network_security_config.xml` `<pin-set>`,
custom `X509TrustManager.checkServerTrusted`, `TrustKit`, `HostnameVerifier`.

```bash
grep -rn 'CertificatePinner\|pin-set\|checkServerTrusted\|TrustKit\|HostnameVerifier' <src>
```

**Bypass:** hook `CertificatePinner.check` to return, and/or Conscrypt
`TrustManagerImpl.verifyChain` to return the chain. Then trust your proxy CA (Burp/
mitmproxy) and confirm live endpoints against the Phase-5 inventory.

## 4. Frida / debugger detection

**Recognize:** scans of `/proc/self/maps` or `/proc/net/tcp` for `frida`/`27042`, thread
names like `gum-js-loop`/`pool-frida`, `ptrace`-based anti-debug, `Debug.isDebuggerConnected()`.

```bash
grep -rn 'frida\|gum-js\|27042\|/proc/self/maps\|isDebuggerConnected\|ptrace\|TracerPid' <src>
```

**Bypass:** hook the file-read/string-scan method that performs the detection to hide the
telltale strings; use a renamed `frida-server` on a non-default port; spawn-gate so the
hook is in place before the check runs.

## 5. Emulator detection

**Recognize:** checks on `Build.FINGERPRINT`/`MODEL`/`PRODUCT` for `generic`/`sdk`/
`emulator`, QEMU pipes, telephony/sensor absence.

```bash
grep -rn 'Build.FINGERPRINT\|Build.MODEL\|goldfish\|ranchu\|qemu\|generic_x86' <src>
```

**Bypass:** spoof the `Build` getters to real-device values; prefer testing on a real
device to avoid this class entirely.

## 6. RASP (runtime app self-protection SDKs)

**Recognize:** a bundled commercial SDK (DexGuard/GuardSquare, Promon SHIELD, Appdome,
Verimatrix) — often obfuscated. Multiple of the above checks wired to a single callback
that kills or degrades the app.

**Bypass:** identify the SDK's detection entrypoint/callback (enumerate loaded classes at
runtime for its package), and neutralize that specific callback. Treat it as the loop:
each RASP check is one more method to hook; read the crash log to find the next one.

---

## Workflow summary

```
static: security-scan.sh + grep the patterns above  ->  identify each protection + its class/method
dynamic: write a targeted hook (scripts/hooks.js)   ->  frida -U -f <pkg> -l hooks.js --no-pause
observe: adb logcat -d > crash.log                  ->  find the NEXT check that fired
iterate: add the next hook                           ->  repeat until the app runs
confirm: proxy traffic; verify Phase-5 endpoints live
report:  what was bypassed (with static evidence) AND what was not
```
