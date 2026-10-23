# Video and frame analysis for device journeys

Load this playbook when a difficult UI path depends on transient or ordered behavior:
flicker, an unexpected intermediate screen, navigation/Back races, overlapping gestures,
IME/focus transitions, animation or lifecycle timing, or an intermittent defect that static
screenshots and layout dumps cannot explain. Proactively record a bounded reproduction and
inspect extracted frames; do not keep repeating taps and guessing from final screenshots.
Ordinary stable assertions need no video. State why recording is useful or unavailable.

Use `references/device-test-memory.md` for case lookup, run identity and archival. The
independent verifier still executes only the declared journey; recording adds observation,
not permission to change the actions, insert delays or explore other paths. If the problem
appears during a failed run, preserve that failure. The lead plans a separate diagnostic
attempt using the same case and start state, within the existing bounded reproduction budget.
Diagnosis and flakiness measurement share at most three attempts in one verification round;
switching tools or take names does not reset that budget. Exploration is labeled separately.
Never rerun until a recording happens to look successful.

## Capture the sequence

1. Inspect the tools actually available on the target and host. Prefer a supported native
   screen recorder and existing host analysis tools such as `ffmpeg`/`ffprobe` or a player
   with frame stepping and timestamps. Read installed versions/help before using flags.
   Tool detection and using an installed tool need no extra confirmation. If a required tool
   is absent, use an existing equivalent or report the exact prerequisite; installation
   follows the existing host authorization rules, never a silent package-manager change.
2. Select the same device, app build, profile, case revision and initial state as the run.
   Choose a short duration and storage budget covering the lead-in, triggering action and
   aftermath. Create a unique capture name for each attempt; never overwrite a failed take.
   Record dimensions, orientation, relevant display/IME settings and capture options.
3. Start recording before the triggering action, verify that the recorder started, then
   execute the declared path. Record host timestamps around each command/manual action,
   the action's result, and relevant device log/trace timestamps. Host dispatch time is not
   the exact moment the device handled input. Use an identifiable visible event and log
   event to align the timelines; record their offset and uncertainty, not assumed equality
   between wall clock, device clock, trace clock and video presentation timestamps (PTS).
4. Stop only the recorder process/session this run started, using its documented graceful
   stop or finite duration. Keep input execution available while it records; a blocking
   recording call must not prevent the journey from running. Wait for file finalization,
   transfer the file, and check decoding, duration and coverage of the triggering step.
   Clean up the run-owned device recording after successful transfer; preserve/retry transfer
   if it fails. Do not kill unrelated recorders or delete unrelated device files.
5. Preserve the original capture and its digest. Record capture failure, truncation, blank
   or protected surfaces, rotation/cropping and possible recording overhead. Recording can
   change timing or omit frames; no visible defect in a capture does not prove absence.
   Do not bypass protected surfaces or change security settings to obtain a recording.

The independent verifier runs capture, input and extraction commands through `graph_worker_exec`
under its dispatch constraints. If that surface cannot retain a recorder while driving inputs,
the lead arranges capture; never fall back to an untracked worker shell or detached orphan job.

### Android transport

Use the target-selected `adb` and inspect `adb -s <serial> shell screenrecord --help`.
When supported, the bounded command shape is:

```text
adb -s <serial> shell screenrecord --time-limit <seconds> /sdcard/<unique-run-take>.mp4
adb -s <serial> pull /sdcard/<unique-run-take>.mp4 <external-evidence-dir>/<take-id>/original.mp4
```

Run capture in a separately controllable session while inputs run on the same selected
target; create a fresh host directory for this take and pull only after it finishes.
Check the actual device's duration and encoding limits.
Do not assume audio, touch indicators, or rotation support; annotate actions from the run
log unless an already-enabled overlay is known to be present. Keep raw serials out of the
archived command record. The lead may use its durable run directory as the host destination.

### HarmonyOS / OpenHarmony transport

Follow the existing `hdc` playbook for target selection and file transfer. Discover the
installed target's recording capability through its own help, supplied SDK documentation
or available system recorder. Do not invent `hdc screenrecord` or `uitest record` commands,
assume Android's `screenrecord` exists, or change transport to make capture work. Respect the
distinction that `uitest uiRecord` produces operation-event records rather than video. Follow the
existing device-path and settings boundaries. If the system recorder needs human interaction
or an export outside the verifier's permitted paths, have the lead arrange that specific
capture/export within existing authorization. A supplied video may be analyzed, but record
its provenance and unknown build/timing facts explicitly. If no video route is available,
use timestamped screenshots/layouts plus logs and state the lost temporal coverage.

## Inspect on the host: overview, then every frame near the anomaly

Open the recording in a supported viewer when available. Always visually inspect extracted
frames before citing them; creating PNGs or finding log lines alone is not visual analysis.
Locate the relevant interval with a sparse overview, then decode **every recorded frame**
in that interval plus enough before/after context to bracket the transition. Inspect normal
state, first visible divergence and subsequent recovery/failure. An overview can miss a
one-frame defect, so widen the interval if needed; do not use sparse sampling as a pass check.

These FFmpeg examples operate on a short existing capture. Resolve `VIDEO` and `OUT` to
absolute paths; `OUT` must be a fresh analysis directory in the verifier's external evidence
directory (or the lead's run directory). The placeholders are not literal commands to run.
Record versions, exact commands, exits and stderr. Equivalent installed tools are acceptable
if they preserve frame timing and provide the same evidence.

```sh
VIDEO='/absolute/path/to/original.mp4'
OUT='/absolute/path/to/new-analysis-directory'
mkdir -p "$OUT/overview" "$OUT/dense"
ffprobe -v error -select_streams v:0 \
  -show_entries stream=index,codec_name,width,height,time_base,start_time,avg_frame_rate,r_frame_rate:format=start_time,duration \
  -of json "$VIDEO" > "$OUT/media.json"
ffprobe -v error -select_streams v:0 -show_frames \
  -show_entries frame=pts,pts_time,best_effort_timestamp_time,duration_time \
  -of json "$VIDEO" > "$OUT/source-frames.json"
ffmpeg -hide_banner -nostdin -n -copyts -i "$VIDEO" -map 0:v:0 \
  -vf "select='isnan(prev_selected_t)+gte(t-prev_selected_t,0.5)',showinfo,scale=640:-2" \
  -fps_mode passthrough "$OUT/overview/frame-%06d.png" 2> "$OUT/overview/showinfo.log"
```

Choose `START` and `END` from the original source PTS in the metadata/overview log. For a
player-relative time, establish the offset to source PTS from a matching frame/event; the
first video PTS may supply it for a simple video-only capture, but audio, edit lists or player
normalization can change the origin. Verify the mapping rather than assuming it. Never derive
time by dividing a PNG sequence number by nominal FPS: captures may have variable frame
intervals. For example, if the suspicious source PTS interval is 6.05–6.25 seconds:

```sh
START=6.05
END=6.25
ffmpeg -hide_banner -nostdin -n -copyts -i "$VIDEO" -map 0:v:0 \
  -vf "select='between(t,${START},${END})',showinfo" \
  -fps_mode passthrough "$OUT/dense/frame-%06d.png" 2> "$OUT/dense/showinfo.log"
```

The dense extraction intentionally does not resample, interpolate, scale or select only key
frames. Check successful decoding and reconcile PNG count/order with the selected source
frame timestamps; an empty or partial output is not a valid analysis. Here `showinfo` follows
`select`: its `n=0` corresponds to `frame-000001.png`, and `pts_time` identifies source time.
Save that mapping as a frame index with filename, original PTS and case/step association.
For duplicate/missing timestamps, retain decoded order and report timing uncertainty. If
using a seeked or trimmed derivative, explicitly retain its offset to the original source.

Contact sheets and GIFs are optional review aids. Label them with source timestamps and
sampling/resize parameters; keep the original video and decisive full-resolution frames.
A GIF-only input has its own timing/palette/frame limitations; preserve it as supplied and
state those limits. A resampled preview cannot establish precise ordering, frame duration
or that a transient state never occurred. Do not mistake recorded FPS for display FPS or
use video alone to claim a performance regression: corroborate with trace/profiling data.

## Locate, explain, verify

- Tie the first visible divergence to the case step, actual input and expected state. Cite
  the original video, source PTS interval and decisive frames, including the last observed
  normal frame. This brackets the visible symptom; it does not identify an exact internal
  transition time when capture frames are missing.
- Correlate with the relevant logs, layout/state observations and code path. Separate direct
  observations, hypotheses and supported root cause. Mere temporal proximity is not causal
  proof. Only the lead repairs code; the verifier returns scoped findings and evidence.
- Reproduce after repair on the new artifact with the same case, start state, device profile
  and comparable capture settings. Use a new run/take and retain the failed baseline. Compare
  the same semantic event window rather than matching raw frame numbers across videos.
  Recheck the full declared journey and relevant regressions; non-reproduction under recording
  alone does not resolve intermittent behavior. Preserve observed failure rates and budgets.
- If essential transient evidence cannot be captured or inspected, report that limitation
  with the missing action/tool. Never claim the behavior verified from unread video files;
  apply the existing pass/revise/escalate evidence rules. Missing optional video does not block
  an assertion independently established by sufficient evidence from another method.

## Durable evidence and handoff

Store under `runs/<run-id>/evidence/video/<take-id>/` through the lead-owned archival flow:
original recording, media/frame metadata, action timeline and clock alignment, exact
extraction commands/logs, frame index and decisive PNGs, plus optional labeled previews.
The verifier produces these in its external temporary directory and returns their paths
in `device_test_record.evidence_paths`; no worker writes the project's memory directory.

Add a video-analysis section to the run report: trigger/diagnostic question, case/step,
capture tool/settings and take provenance, original digest, coverage/truncation, source
PTS interval, clock offset/uncertainty, inspected frame links, log/code correlation,
observations vs hypotheses, and baseline/fix run links. When a case repeatedly needs this
technique, record the capture trigger and evidence requirements in that case. Record device
recording/export quirks and successful recovery in its scoped profile, avoiding new case
definitions for every take. Check recordings and frames for sensitive content before archival;
include any audio track in that check when the chosen recorder captures one;
retain a restricted original only when appropriate, and label any redaction as a derivative.
If the original cannot be retained, record that limitation rather than silently substituting
a GIF or edited clip. Keep decisive evidence when pruning bulky intermediate frames.

## Tool references

- [Android Debug Bridge: recording a device screen](https://developer.android.com/tools/adb#screenrecord)
- [OpenHarmony UITest: operation recording](https://github.com/openharmony/docs/blob/master/en/application-dev/application-test/uitest-guidelines.md)
- [FFmpeg filters: select and showinfo](https://ffmpeg.org/ffmpeg-all.html)
- [ffprobe options and structured output](https://ffmpeg.org/ffprobe.html)

Installed help and observed output take precedence over these example forms. Never carry a
particular developer machine's executable paths, tool versions or device facts into this role.
