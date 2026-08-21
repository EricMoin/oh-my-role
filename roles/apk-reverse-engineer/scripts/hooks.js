// hooks.js — reusable Frida hook building blocks for the apk-reverse-engineer role.
// Load with: frida -U -f <pkg> -l hooks.js --no-pause
// These are STARTING POINTS. The role's method is to generate TARGETED hooks from the
// decompiled code (real class/method names), not to rely on generic scripts. Replace the
// placeholder class names below with the actual ones found in static analysis.

Java.perform(function () {
  console.log("[*] hooks.js loaded");

  // ---------- 1. Universal SSL pinning bypass (OkHttp3 CertificatePinner) ----------
  try {
    var CertificatePinner = Java.use("okhttp3.CertificatePinner");
    // check(String, List) and check(String, Certificate[]) overloads
    CertificatePinner.check.overload("java.lang.String", "java.util.List").implementation = function (a, b) {
      console.log("[pinning] CertificatePinner.check bypassed for " + a);
      return; // returning without throwing = pin passes
    };
    console.log("[+] OkHttp CertificatePinner hooked");
  } catch (e) { console.log("[-] no okhttp3.CertificatePinner: " + e); }

  // ---------- 2. TrustManager (custom X509TrustManager checkServerTrusted) ----------
  try {
    var TrustManagerImpl = Java.use("com.android.org.conscrypt.TrustManagerImpl");
    TrustManagerImpl.verifyChain.implementation = function (untrusted, trustAnchors, host, clientAuth, ocsp, tls) {
      console.log("[pinning] TrustManagerImpl.verifyChain bypassed for " + host);
      return untrusted; // accept the presented chain
    };
    console.log("[+] Conscrypt TrustManagerImpl hooked");
  } catch (e) { /* not present on all versions */ }

  // ---------- 3. Root detection (RootBeer) ----------
  try {
    var RootBeer = Java.use("com.scottyab.rootbeer.RootBeer");
    ["isRooted", "isRootedWithoutBusyBoxCheck", "checkForBinary", "detectRootManagementApps",
     "detectPotentiallyDangerousApps", "checkForSuBinary", "checkForDangerousProps"
    ].forEach(function (m) {
      if (RootBeer[m]) {
        RootBeer[m].overloads.forEach(function (ov) {
          ov.implementation = function () { console.log("[root] RootBeer." + m + " -> false"); return false; };
        });
      }
    });
    console.log("[+] RootBeer neutralized");
  } catch (e) { /* app may use a custom checker — hook it by its real name (see below) */ }

  // ---------- 4. TEMPLATE: custom boolean detection method ----------
  // Replace with the real class/method you found in decompiled source (Phase 6).
  //   var Checker = Java.use("com.example.security.RootChecker");
  //   Checker.isRooted.implementation = function () { console.log("[root] custom -> false"); return false; };

  // ---------- 5. TEMPLATE: capture arguments + return value of any method ----------
  //   var C = Java.use("com.example.data.AuthApi");
  //   C.login.overload("java.lang.String", "java.lang.String").implementation = function (email, pass) {
  //     console.log("[login] email=" + email + " pass=" + pass);
  //     var r = this.login(email, pass);
  //     console.log("[login] ret=" + r);
  //     return r;
  //   };

  // ---------- 6. TEMPLATE: signature / anti-tamper (PackageManager) ----------
  //   var PM = Java.use("android.app.ApplicationPackageManager");
  //   PM.getPackageInfo.overload("java.lang.String", "int").implementation = function (pkg, flags) {
  //     console.log("[tamper] getPackageInfo(" + pkg + ", " + flags + ")");
  //     return this.getPackageInfo(pkg, flags); // return spoofed signatures here if a check fires
  //   };

  // ---------- 7. Discovery helper: enumerate loaded classes matching a keyword ----------
  //   Java.enumerateLoadedClasses({ onMatch: function (n) { if (n.indexOf("Root") >= 0 || n.indexOf("Pin") >= 0) console.log(n); }, onComplete: function () {} });
});
