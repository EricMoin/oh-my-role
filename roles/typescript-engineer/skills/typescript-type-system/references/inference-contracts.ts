// Compile-only examples. Requires TypeScript 5.4+.
// Check with strict, exactOptionalPropertyTypes and noUncheckedIndexedAccess enabled.
export {};

type JobPayloads = {
  resize: { width: number; height: number };
  archive: { destination: string };
};

type Job = {
  [Kind in keyof JobPayloads]: { kind: Kind; payload: JobPayloads[Kind] }
}[keyof JobPayloads];

declare function enqueue(job: Job): void;
enqueue({ kind: "resize", payload: { width: 80, height: 60 } });
enqueue({ kind: "archive", payload: { destination: "cold-storage" } });
// @ts-expect-error -- archive data cannot be paired with a resize command
enqueue({ kind: "resize", payload: { destination: "cold-storage" } });

declare const uncertainKind: keyof JobPayloads;
// @ts-expect-error -- the independent union key does not establish correlation
enqueue({ kind: uncertainKind, payload: { width: 80, height: 60 } });

declare function choosePrimary<K extends string>(
  available: readonly K[],
  preferred: NoInfer<K>,
): K;
const primary = choosePrimary(["queued", "running"] as const, "queued");
const supported: "queued" | "running" = primary;
// @ts-expect-error -- a checking-only argument cannot add a new available state
choosePrimary(["queued", "running"] as const, "archived");
// @ts-expect-error -- the return keeps the input union rather than becoming any
const impossibleState: "archived" = primary;

type TitlePatch = { title?: string | null };
const unchanged: TitlePatch = {};
const clearTitle: TitlePatch = { title: null };
const changeTitle: TitlePatch = { title: "Weekly export" };
// @ts-expect-error -- exact optional properties keep omission distinct from undefined
const ambiguousPatch: TitlePatch = { title: undefined };
