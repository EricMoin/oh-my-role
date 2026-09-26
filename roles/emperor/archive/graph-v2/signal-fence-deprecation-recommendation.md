# Fence Deprecation Recommendation

## Decision: Defer (Do Later)

Keep dual-channel (`any:[signal_observed, artifact_exists]`) indefinitely during Phase 2-3. Do NOT remove fence support from `continue_until` conditions until all criteria below are met.

## Analysis

### Dimension 1: Compatibility Risk

- **7 of 8 communication channels** are signal-only viable (machine-to-machine via dispatch_output)
- **1 channel** (emperor→user `final_answer`) is fence-required permanently — the `<final_answer>` tag is user-facing terminal output
- **External consumers**: Any user-defined custom roles or subagents that rely on fence parsing would break if fence support is removed
- **Risk level**: Medium — internal emperor ecosystem can migrate; external/third-party roles cannot be guaranteed

### Dimension 2: Rollback Safety

- If `artifact_exists(X)` is removed from `continue_until` and a model fails to call `signal(answer)`, the function runs to `continue_max` and terminates with a cap error
- With dual-channel, the same scenario is rescued by fence fallback → zero user-visible failure
- **Risk level**: High for signal-only; Zero for dual-channel

### Dimension 3: Migration Completeness

- Cannot verify that ALL subagents in the ecosystem are signal-aware before removing fence
- User-defined roles (via rolebox registry) may not have signal instructions
- The signal tool is available to all sessions, but prompt awareness varies
- **Risk level**: Medium — cannot enforce ecosystem-wide adoption

### Dimension 4: Human-Facing Output

- `<final_answer>` tag MUST remain — it serves double duty as machine signal AND user-readable output
- Even if emperor internally uses signal(answer) for machine completion, the `<final_answer>` block remains required for terminal rendering
- No alternative rendering mechanism exists in opencode for signal payloads
- **Risk level**: N/A — this path is exempt from deprecation permanently

### Dimension 5: Runtime Cost of Dual-Channel

- `artifact_exists(X)` condition: one string lookup in the artifact store per idle cycle
- `signal_observed(type)`: one array.includes() check per idle cycle
- `any:[...]` combinator: evaluates both, short-circuits on first true
- **Total overhead**: ~2 microseconds per idle cycle — completely negligible
- **Conclusion**: There is NO performance incentive to remove fence support

## Recommendation

### Primary: Keep dual-channel indefinitely (current Phase 2 state)

The fence condition in `any:[signal_observed, artifact_exists]` is a **zero-cost safety net**:
- Negligible runtime overhead (~2μs per idle check)
- Catches models that forget to call signal but still write fences
- Provides graceful degradation for any context where the signal tool is unavailable
- Enables backward compatibility with pre-signal roles and external integrations

### When to reconsider

Revisit this decision ONLY when ALL of the following are true:
1. Signal-primary has been stable in production for ≥3 months
2. Zero instances of fence-only completion observed in logs across all emperor functions
3. All published roles in the oh-my-role registry have been updated to signal-aware
4. A mechanism exists to warn/migrate user-defined custom roles that rely on fences
5. opencode's `terminal: boolean` tool flag is implemented (eliminating the extra-turn cost)

### If reconsidered, the migration path is:

1. Change `continue_until` from `any:[signal_observed(answer), artifact_exists(X)]` to `signal_observed(answer)` only
2. Keep fence instructions in prompts as "optional" (not "required fallback")
3. Monitor for `continue_max` cap hits (indicates model failed to signal)
4. Maintain `<final_answer>` tag requirement permanently (user-facing, exempt)

### What to NEVER deprecate

- `<final_answer>` tag — user-facing output, no alternative exists
- `artifact_exists()` as a condition primitive — other roles may use it for non-signal purposes
- The fence-based `capture_artifact` observation mechanism — it serves purposes beyond completion signaling (e.g., capturing structured data from text)

## Timeline

| Phase | Status | Fence Support |
|-------|--------|---------------|
| Phase 1 | ✅ Complete | Dual-channel: signal + fence both valid |
| Phase 2 | ✅ Complete | Signal-primary, fence-fallback (current) |
| Phase 3 | Not started | Signal-only for internal M2M channels; fence for user-facing |
| Phase 4 | Deferred indefinitely | Remove fence from `continue_until` — only when criteria met |

## Appendix: Cost-Benefit Summary

| Action | Benefit | Risk | Cost |
|--------|---------|------|------|
| Remove fence from continue_until | Cleaner config (1 condition vs 2) | High — models that forget signal hit cap | Zero — current overhead is ~2μs |
| Keep dual-channel | Zero-cost safety net | None | None |

**Recommendation: Keep dual-channel. The benefit of removal (slightly cleaner YAML) does not justify the risk (cap failures on signal miss).**
