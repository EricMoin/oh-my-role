---
name: dynamic-analysis-frida
description: Phase 7 — dynamic analysis with Frida. Run an adaptive bypass loop that generates custom hook scripts FROM the decompiled static findings (not generic scripts), runs them, captures crash logs, and iterates to defeat SSL pinning, root detection (RootBeer/SafetyNet), RASP, anti-tamper, and Frida detection. Includes method hooking, argument/return capture, and safety rules. 中文触发词：动态分析、Frida、Frida脚本、绕过、SSL Pinning绕过、Root检测绕过、脱壳、Hook方法、运行时分析、抓包
trigger: frida|dynamic analysis|hook method|bypass ssl pinning|bypass root detection|rootbeer|safetynet|anti-tamper|rasp|frida detection|runtime analysis|动态分析|Frida脚本|绕过|SSL绕过|Root检测|Hook方法|运行时分析|抓包
---

# Phase 7: Dynamic Analysis with Frida

> **Automation & deep dives:** `bash scripts/setup-frida.sh [--install-server]` sets up
> the device + matching frida-tools venv; `scripts/hooks.js` provides ready-to-load
> SSL-pinning / root-detection hook starters. Full recipes: `references/frida-cookbook.md`;
> per-protection static+dynamic map: `references/protection-bypass-playbook.md`.

Use runtime instrumentation only when static analysis cannot answer the question
(e.g., a value is computed at runtime, or you must observe live traffic behind
pinning). Prefer static first. Setup lives in `environment-setup`; the legal
boundary lives in `legal-authorization` — only instrument apps you may.

## The adaptive bypass loop (the core technique)

Generic copy-paste bypass scripts fail against modern protections. Instead, drive a
loop rooted in the decompiled code:

1. **Read the protection in the decompiled source** (from Phase 3/4/6): find the
   exact class + method that does root detection / pinning / tamper check, and what
   it returns on failure.
2. **Generate a targeted hook** for that specific method (real class name from the
   Kotlin-metadata recovery map when obfuscated).
3. **Run it**, launch/attach to the app, and **capture the crash log or behavior**.
4. **Read the failure**, identify the next check that fired (protections layer), and
   **iterate** — hook the next method. Repeat until the protection is defeated.

This targeted approach beats generic scripts because it hooks the app's *actual*
detection methods, including custom ones no public script knows about.

## Running Frida

```bash
FR=~/.local/share/frida-re/venv/bin
# Ensure frida-server is running on device (as root), then:
$FR/frida-ps -U                                  # confirm connectivity, find the app
$FR/frida -U -f com.example.app -l hook.js --no-pause   # spawn + inject
$FR/frida -U -n com.example.app -l hook.js       # attach to running process
```

## Hook building blocks (Frida JS)

```javascript
Java.perform(function () {
  // Capture arguments + return value of a target method
  var C = Java.use("com.example.data.AuthApi");
  C.login.overload("java.lang.String", "java.lang.String").implementation =
    function (email, password) {
      console.log("[login] email=" + email + " pass=" + password);
      var ret = this.login(email, password);
      console.log("[login] ret=" + ret);
      return ret;
    };

  // Force a boolean detection method to return the "safe" value
  var Root = Java.use("com.example.security.RootChecker");
  Root.isRooted.implementation = function () { return false; };
});
```

## Common protections and where to hook

| Protection | Where to hook (from static analysis) |
|---|---|
| **SSL pinning** | `okhttp3.CertificatePinner.check`, custom `X509TrustManager.checkServerTrusted`, or the app's own pinning wrapper — force pass |
| **Root detection** | RootBeer (`isRooted`, `checkForBinary`), SafetyNet/Play Integrity callbacks, custom `RootChecker` — return false/success |
| **Frida detection** | port/`/proc/self/maps` scans for `frida`, `gum-js-loop`, `re.frida.server` — hook the file/string check |
| **Anti-tamper / signature check** | `PackageManager.getPackageInfo(...signatures)`, CRC checks — return the expected value |
| **RASP** | Often a bundled SDK; find its detection entrypoint and neutralize the specific callback |
| **Emulator detection** | `Build.FINGERPRINT`/`Build.MODEL` checks — spoof the getters |

## Observing traffic behind pinning

Once pinning is bypassed, route through an intercepting proxy (Burp/mitmproxy) with
its CA trusted (or hook the verifier as above), and confirm the endpoints found in
Phase 5 against live requests.

## Safety rules

- Install `frida-tools` in a **venv**, never globally; match the client to the
  device's `frida-server` version.
- Only instrument apps you own or are authorized to test.
- Do **not** persist modifications to a device/app you don't control; hooks are
  in-memory and non-destructive by default — keep them that way.
- Treat captured secrets/PII as sensitive findings, not as material for abuse.

## Output of this phase

The custom hook scripts used, what each defeated (with the static evidence that
drove it), captured runtime values or traffic confirming the analysis, and any
protections that could not be bypassed (documented honestly).
