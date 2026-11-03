/**
 * Custom hook probe for the rolebox-tester 7.0.0 suite.
 *
 * Declared in role.yaml under hooks.custom and exercised by the
 * runtime-hooks-cli module (Test 235): after a bash command, inject
 * HOOK_PROBE_FIRED into the next model step only when the command output
 * contains HOOK_PROBE_TRIGGER.
 *
 * The rolebox custom-hook loader hands the configured `config` block to the
 * onLoad context, and some hosts also surface it on the per-call context. Read
 * both, defaulting to the manifest values so the probe still works when a host
 * omits the runtime config.
 */

const DEFAULT_CONFIG = Object.freeze({
  marker: "HOOK_PROBE_TRIGGER",
  inject: "HOOK_PROBE_FIRED",
});

let loadedConfig = { ...DEFAULT_CONFIG };

/** Resolve the configured marker/inject pair from a hook context. */
function readConfig(ctx) {
  const ctxConfig =
    ctx && typeof ctx.config === "object" && ctx.config !== null ? ctx.config : {};
  return { ...DEFAULT_CONFIG, ...loadedConfig, ...ctxConfig };
}

/** Coerce a tool result to text so an object output still matches the marker. */
function outputText(output) {
  if (typeof output === "string") return output;
  if (output === null || output === undefined) return "";
  try {
    return JSON.stringify(output) ?? "";
  } catch {
    return String(output);
  }
}

/** Capture the role.yaml `config` block once, when the hook is registered. */
export function onLoad(ctx) {
  if (ctx && typeof ctx.config === "object" && ctx.config !== null) {
    loadedConfig = { ...DEFAULT_CONFIG, ...ctx.config };
  }
}

/** Inject the marker only when a bash result contains the configured trigger. */
export function onToolAfter(ctx, input) {
  if (!input || input.tool !== "bash") return;
  const { marker, inject } = readConfig(ctx);
  if (!marker || !inject) return;
  if (!outputText(input.output).includes(marker)) return;
  if (typeof ctx?.inject === "function") ctx.inject(inject);
}

/** No external effects: drop the captured config when the hook is disposed. */
export function onDispose() {
  loadedConfig = { ...DEFAULT_CONFIG };
}
