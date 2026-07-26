import { subdivisionLabels } from "../forgePulseConstants";
import type {
  Subdivision,
  TimeSignature,
  TransportStatus,
} from "../forgePulseTypes";

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
    </div>
  );
}
