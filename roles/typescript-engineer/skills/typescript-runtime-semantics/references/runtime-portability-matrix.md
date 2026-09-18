# Runtime portability checks

This matrix lists questions to test. It contains no recorded runtime results and does not
promise cross-runtime support. Select only environments in the project's support contract.

| Surface | What to establish | Useful behavior test |
|---|---|---|
| TypeScript execution | Loader/native support, erased vs transformed syntax, config handling | Run the built/loaded entry point using the production path |
| Modules | Resolution conditions, extension and interop rules | Load the packaged public entry and inspect its exports |
| Cancellation | API support and propagation through all layers | Abort before/during I/O and assert cleanup and rejection/result |
| Streams | Stream family, buffering, ownership | Slow consumer plus source/destination failure; observe bounded progress |
| Workers | API, module loading, transfer behavior | Round-trip a message and verify termination on failure |
| File/network permissions | Launch mode and granted capabilities | Run the same operation in allowed and denied environments |
| Process lifecycle | Signals, pending work and exit semantics | Spawn a fixture, trigger shutdown and inspect status/output |
| Serialization | Supported values and lost metadata | Round-trip representative data/errors across the actual boundary |

Record the host's actual identity/version, flags and operating system where relevant.
A Node compatibility version exposed by another runtime does not identify that runtime.
Do not infer permission guarantees from a help-text search or a missing global.

Use the same workload and assertions across supported hosts, allowing documented differences
only where the product contract permits them. Distinguish API presence from behavior and
avoid exact timing claims from a single run. Missing environments remain untested; an
unavailable runtime does not justify installing or supporting every alternative runtime.

Use official versioned documentation for specific APIs. Starting points:
[Node](https://nodejs.org/api/), [Bun](https://bun.sh/docs),
[Deno](https://docs.deno.com/runtime/).
