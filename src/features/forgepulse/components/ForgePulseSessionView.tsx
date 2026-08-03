import { subdivisionInstructions, subdivisionLabels } from "../forgePulseConstants";
import type {
  Subdivision,
  TimeSignature,
  TransportStatus,
} from "../forgePulseTypes";
import type { TimingCoachState } from "../hooks/useTimingCoach";

type ForgePulseSessionViewProps = {
  theme: string;
  sessionTitle: string;
  bpm: number;
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
  bpm,
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
  onBack,
  start,
  stop,
}: ForgePulseSessionViewProps) {
  const beatsPerMeasure = Number(timeSignature.split("/")[0]);
  const isRunning = status !== "idle";
  const remainingSeconds = Math.max(durationMinutes * 60 - elapsedSeconds, 0);

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

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-700/60 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Tempo</p>
          <p className="mt-1 text-lg font-semibold">{bpm} BPM</p>
        </div>
        <div className="rounded-lg border border-zinc-700/60 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Pattern</p>
          <p className="mt-1 text-sm font-semibold">
            {subdivisionLabels[subdivision]} · {timeSignature}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-700/60 p-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {timerEnabled ? "Remaining" : "Elapsed"}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatDuration(timerEnabled ? remainingSeconds : elapsedSeconds)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
        <p className="text-xs uppercase tracking-wide text-orange-400">How to play it</p>
        <p className="mt-2 text-sm leading-relaxed">{subdivisionInstructions[subdivision]}</p>
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
              timingCoach.latestJudgement === "in-time" ? "text-emerald-400" : "text-orange-400"
            }`}>
              {timingCoach.calibrating
                ? "Calibrating…"
                : timingCoach.latestJudgement === "in-time"
                  ? "In time"
                  : `${timingCoach.latestJudgement === "early" ? "Early" : "Late"} ${Math.abs(timingCoach.latestOffsetMs ?? 0)} ms`}
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
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Detected" value={timingCoach.attackCount} />
              <Metric label="Avg. error" value={`${timingCoach.averageErrorMs} ms`} />
              <Metric label="Consistency" value={`${timingCoach.consistencyMs} ms`} />
              <Metric label="Missed / Extra" value={`${timingCoach.missedCount} / ${timingCoach.extraCount}`} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/5 p-5 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-400">
          {status === "counting-in"
            ? "Count In"
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
