import { subdivisionLabels } from "../forgePulseConstants";
import type {
  Subdivision,
  TimeSignature,
  TransportStatus,
} from "../forgePulseTypes";
import type { TimingCoachState } from "../hooks/useTimingCoach";
import type { TimingStrictness } from "../hooks/useTimingCoach";
import type { VoiceCoachFrequency } from "../hooks/useVoiceCoach";

type ForgePulseSessionViewProps = {
  theme: string;
  sessionTitle: string;
  exerciseInstructions: string;
  bpm: number;
  measuredBpm: number;
  measuredIntervalMs: number;
  clickJitterMs: number;
  subdivision: Subdivision;
  timeSignature: TimeSignature;
  status: TransportStatus;
  currentBeat: number;
  currentSubdivision: number;
  elapsedSeconds: number;
  timerEnabled: boolean;
  durationMinutes: number;
  timingCoach: TimingCoachState;
  dawName: string;
  dawInstalled: boolean;
  dawRunning: boolean;
  isLaunchingDaw: boolean;
  dawLaunchError: string;
  onLaunchDaw: () => void;
  guitarVolume: number;
  onGuitarVolumeChange: (value: number) => void;
  voiceCoachFrequency: VoiceCoachFrequency;
  voiceCoachSupported: boolean;
  voiceCoachSpeaking: boolean;
  voiceCoachLastMessage: string;
  voiceCoachOutputError: string;
  timingStrictness: TimingStrictness;
  onBack: () => void;
  start: () => void;
  stop: () => void;
};

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ForgePulseSessionView({
  theme,
  sessionTitle,
  exerciseInstructions,
  bpm,
  measuredBpm,
  measuredIntervalMs,
  clickJitterMs,
  subdivision,
  timeSignature,
  status,
  currentBeat,
  currentSubdivision,
  elapsedSeconds,
  timerEnabled,
  durationMinutes,
  timingCoach,
  dawName,
  dawInstalled,
  dawRunning,
  isLaunchingDaw,
  dawLaunchError,
  onLaunchDaw,
  guitarVolume,
  onGuitarVolumeChange,
  voiceCoachFrequency,
  voiceCoachSupported,
  voiceCoachSpeaking,
  voiceCoachLastMessage,
  voiceCoachOutputError,
  timingStrictness,
  onBack,
  start,
  stop,
}: ForgePulseSessionViewProps) {
  const beatsPerMeasure = Number(timeSignature.split("/")[0]);
  const isRunning = status !== "idle";
  const remainingSeconds = Math.max(durationMinutes * 60 - elapsedSeconds, 0);
	const showMetronomeDiagnostics = import.meta.env.DEV;
	const latestTimingLabel = timingCoach.latestJudgement === "locked"
	  ? "Centered"
	  : timingCoach.latestJudgement === "great"
		? "Great timing"
		: timingCoach.latestJudgement === "good"
		  ? "Good timing"
		  : timingCoach.latestJudgement === "on-tempo"
			? "On tempo"
			: `${timingCoach.latestJudgement === "early" ? "Early" : "Late"} ${Math.abs(timingCoach.latestOffsetMs ?? 0)} ms`;

  return (
    <div
      className={`mt-5 rounded-xl border p-4 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-950/50"
          : "border-zinc-200 bg-zinc-50"
      }`}
    >
      {/* Active session summary */}
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        Active Session
      </p>

      <h3 className="mt-2 text-sm font-semibold">
        {sessionTitle}
      </h3>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-700/60 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Tempo</p>
          <p className="mt-1 text-lg font-semibold">{bpm} BPM</p>
		  {showMetronomeDiagnostics && measuredBpm > 0 && (
			<div className="mt-1 text-xs text-emerald-400">
			  <p>{status === "playing" ? "Measured" : "Last measured"} click rate: {measuredBpm.toFixed(1)} BPM</p>
			  <p className="tabular-nums text-zinc-500">
				Target {(60_000 / bpm).toFixed(1)} ms · Actual {measuredIntervalMs.toFixed(1)} ms · Jitter ±{clickJitterMs.toFixed(1)} ms
			  </p>
			</div>
		  )}
        </div>
        <div className="rounded-lg border border-zinc-700/60 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Pattern</p>
          <p className="mt-1 text-sm font-semibold">
            {subdivisionLabels[subdivision]} · {timeSignature}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-700/60 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {timerEnabled ? "Remaining" : "Elapsed"}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatDuration(timerEnabled ? remainingSeconds : elapsedSeconds)}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-orange-500/30 bg-orange-500/5 px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-xs uppercase tracking-wide text-orange-400">How to play it</p>
          <p className="text-sm leading-relaxed">{exerciseInstructions}</p>
        </div>
        {voiceCoachFrequency !== "off" && voiceCoachSupported && (
          <>
            <p className="mt-2 text-xs text-zinc-500">
              Voice Coach: {voiceCoachSpeaking ? "Speaking" : "Listening"}
              {voiceCoachLastMessage ? ` · Last: “${voiceCoachLastMessage}”` : ""}
            </p>
            {voiceCoachOutputError && (
              <p className="mt-1 text-xs text-red-400">
                Voice Coach could not use the selected FretForge output. Check the Audio route at the top, then try Preview Voice.
              </p>
            )}
          </>
        )}
      </div>

      <div className={`mt-4 rounded-xl border p-4 ${
        timingCoach.connected
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Guitar Timing</p>
            <p className="mt-1 text-sm font-semibold">
              {timingCoach.connected
                ? `Listening via ${timingCoach.sourceName || "FretForge Link"}`
                : "Waiting for FretForge Link"}
            </p>
          </div>
          {timingCoach.connected && timingCoach.latestJudgement && (
            <p className={`text-lg font-semibold ${
			  timingCoach.latestJudgement === "locked" || timingCoach.latestJudgement === "great" ? "text-emerald-400" :
			  timingCoach.latestJudgement === "good" ? "text-sky-400" : "text-orange-400"
			}`}>
              {timingCoach.calibrating
                ? "Calibrating…"
				: latestTimingLabel}
            </p>
          )}
        </div>

        {!timingCoach.connected ? (
          <div className="mt-3">
            <p className="text-sm text-zinc-300">
              ForgePulse analyzes your guitar through FretForge Link. {dawName} must be running with the guitar track armed, monitoring enabled, and FretForge Link active on the guitar bus.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${dawRunning ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                {dawName}: {dawRunning ? "Running" : "Closed"}
              </span>
              <button
                type="button"
                onClick={onLaunchDaw}
                disabled={!dawInstalled || dawRunning || isLaunchingDaw}
                className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLaunchingDaw ? `Launching ${dawName}…` : dawRunning ? `${dawName} is Running` : `Launch ${dawName}`}
              </button>
              {!dawInstalled && <span className="text-xs text-amber-400">Select and install a DAW in Studio Path first.</span>}
            </div>
            {dawRunning && (
              <p className="mt-3 text-xs text-amber-300">DAW detected. Waiting for audio from FretForge Link—check track arming, monitoring, bus routing, and plug-in bypass.</p>
            )}
            {dawLaunchError && <p className="mt-3 text-sm text-red-400" role="alert">{dawLaunchError}</p>}
          </div>
        ) : (
          <div className="mt-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">Guitar input</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-emerald-400 transition-[width]" style={{ width: `${timingCoach.inputLevel}%` }} />
              </div>
              <span className="w-10 text-right text-xs tabular-nums text-zinc-500">{timingCoach.inputLevel}%</span>
            </div>
            <label className="mt-3 block text-xs uppercase tracking-wide text-zinc-500">
              Guitar Volume · {Math.round(guitarVolume * 100)}%
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={guitarVolume}
                onChange={(event) => onGuitarVolumeChange(Number(event.target.value))}
                className="mt-2 block w-full accent-orange-500"
              />
              <span className="mt-1 block normal-case tracking-normal text-zinc-500">Controls FretForge Link monitoring level; it does not change interface input gain.</span>
            </label>
            {status === "idle" && (
              <p className="mt-3 text-sm text-zinc-400">Pluck a string to verify the input meter, then start the metronome for scored timing feedback.</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Metric label="Detected" value={timingCoach.attackCount} />
			  <Metric label="On tempo+" value={timingCoach.correctCount} />
              <Metric label="Avg. error" value={`${timingCoach.averageErrorMs} ms`} />
              <Metric label="Consistency" value={`${timingCoach.consistencyMs} ms`} />
              <Metric label="Missed / Extra" value={`${timingCoach.missedCount} / ${timingCoach.extraCount}`} />
            </div>
			<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
			  <span>{timingStrictness === "relaxed" ? "Learning" : timingStrictness === "tight" ? "Precision" : "Balanced"} window · ±{timingCoach.toleranceMs} ms</span>
			  <span title="Measured delivery time from REAPER to FretForge. Attacks use REAPER's audio clock, so delivery time is not subtracted twice.">
				REAPER → FretForge · {timingCoach.linkDelayMs} ms
			  </span>
			  <span title="A capped session adjustment estimated from the first four attacks. It compensates plausible interface and driver latency without hiding a large playing delay.">
				Session adjustment · {(timingCoach.timingAdjustmentMs ?? 0) >= 0 ? "+" : ""}{timingCoach.timingAdjustmentMs ?? 0} ms
			  </span>
			</div>
			<p className="mt-1 text-xs text-zinc-600">
			  Bands: centered ±{timingCoach.bandThresholdsMs.locked} · great ±{timingCoach.bandThresholdsMs.great} · good ±{timingCoach.bandThresholdsMs.good} · on tempo ±{timingCoach.bandThresholdsMs.onTempo} ms
			</p>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/5 p-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-400">
		  {status === "counting-in"
			? `Count In · ${currentBeat} of ${beatsPerMeasure}`
            : status === "playing"
              ? "Playing"
              : "Ready"}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: beatsPerMeasure }, (_, index) => (
            <span
              key={index}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                currentBeat === index + 1 && isRunning
                  ? "border-orange-400 bg-orange-500 text-white"
                  : "border-zinc-700 text-zinc-500"
              }`}
            >
              {index + 1}
            </span>
          ))}
        </div>
        {status === "playing" && currentSubdivision > 1 && (
          <p className="mt-3 text-xs text-zinc-500">
            Subdivision {currentSubdivision}
          </p>
        )}
      </div>

      {/* Session navigation */}
      {/* Transport controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={start}
          disabled={isRunning}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          {status === "counting-in" ? "Counting In…" : "Start Metronome"}
        </button>

        <button
          type="button"
          onClick={stop}
          disabled={!isRunning}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
            theme === "dark"
              ? "border-zinc-700 text-zinc-100"
              : "border-zinc-300 text-zinc-900"
          }`}
        >
          Stop Metronome
        </button>

        <button
          type="button"
          onClick={onBack}
          className={`ml-auto rounded-lg border px-4 py-2 text-sm font-semibold ${
            theme === "dark"
              ? "border-zinc-700 text-zinc-100"
              : "border-zinc-300 text-zinc-900"
          }`}
        >
          Back to Setup
        </button>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Press Space to start or stop while focus is outside a control.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-700/60 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
    </div>
  );
}
