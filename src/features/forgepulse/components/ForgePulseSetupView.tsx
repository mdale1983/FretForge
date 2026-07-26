import { subdivisionLabels } from "../forgePulseConstants";
import { ForgePulseCard } from "./ForgePulseCard";

import type {
  ForgePulseMode,
  Subdivision,
  TimeSignature,
} from "../forgePulseTypes";

type ForgePulseSetupViewProps = {
    theme: string;
    mode: ForgePulseMode;
    bpm: number;
    subdivision: Subdivision;
    timeSignature: TimeSignature;

    modeTitle: string;
    modeDifficulty: string;
    modeObjective: string;
    modeDescription: string;
    sessionTitle: string;
    countInEnabled: boolean;
    timerEnabled: boolean;
    durationMinutes: number;
    volume: number;
    accentEnabled: boolean;

    onModeChange: (value: ForgePulseMode) => void;
    onBpmChange: (value: number) => void;
    onSubdivisionChange: (value: Subdivision) => void;
    onTimeSignatureChange: (value: TimeSignature) => void;
    onCountInChange: (value: boolean) => void;
    onTimerChange: (value: boolean) => void;
    onDurationChange: (value: number) => void;
    onVolumeChange: (value: number) => void;
    onAccentChange: (value: boolean) => void;
    onStartSession: () => void;
};

export function ForgePulseSetupView({
    theme,
    mode,
    bpm,
    subdivision,
    timeSignature,

    modeTitle,
    modeDifficulty,
    modeObjective,
    modeDescription,
    sessionTitle,

    countInEnabled,
    timerEnabled,
    durationMinutes,
    volume,
    accentEnabled,
    onModeChange,
    onBpmChange,
    onSubdivisionChange,
    onTimeSignatureChange,
    onCountInChange,
    onTimerChange,
    onDurationChange,
    onVolumeChange,
    onAccentChange,
    onStartSession,
}: ForgePulseSetupViewProps) {
  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
    {/* Quick Setup */}
        <ForgePulseCard theme={theme} title="Quick Setup">

            {/* Mode, BPM, Subdivision, and Time Signature */}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
                <label className="text-xs uppercase tracking-wide text-zinc-500">
                Mode
                </label>

                <select
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${
                    theme === "dark"
                    ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                    : "border-zinc-300 bg-white text-zinc-900"
                }`}
                value={mode}
                onChange={(event) =>
                    onModeChange(event.target.value as ForgePulseMode)
                }
                >
                <option value="learn">Learn</option>
                <option value="practice">Practice</option>
                <option value="follow">Follow</option>
                <option value="master">Master</option>
                </select>
            </div>

            <div>
                <label className="text-xs uppercase tracking-wide text-zinc-500">
                BPM
                </label>

                <input
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                    theme === "dark"
                    ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                    : "border-zinc-300 bg-white text-zinc-900"
                }`}
                type="number"
                min={40}
                max={240}
                value={bpm}
                onChange={(event) => onBpmChange(Number(event.target.value))}
                />
            </div>

            <div>
                <label className="text-xs uppercase tracking-wide text-zinc-500">
                Subdivision
                </label>

                <select
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${
                    theme === "dark"
                    ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                    : "border-zinc-300 bg-white text-zinc-900"
                }`}
                value={subdivision}
                onChange={(event) =>
                    onSubdivisionChange(event.target.value as Subdivision)
                }
                >
                <option value="quarter">Quarter Notes</option>
                <option value="eighth">Eighth Notes</option>
                <option value="triplet">Triplets</option>
                <option value="sixteenth">Sixteenth Notes</option>
                </select>
            </div>

            <div>
                <label className="text-xs uppercase tracking-wide text-zinc-500">
                Time Signature
                </label>

                <select
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${
                    theme === "dark"
                    ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                    : "border-zinc-300 bg-white text-zinc-900"
                }`}
                value={timeSignature}
                onChange={(event) =>
                    onTimeSignatureChange(
                        event.target.value as TimeSignature
                    )
                }
                >
                <option value="2/4">2/4</option>
                <option value="3/4">3/4</option>
                <option value="4/4">4/4</option>
                <option value="5/4">5/4</option>
                <option value="6/8">6/8</option>
                <option value="7/8">7/8</option>
                </select>
            </div>
            </div>
        </ForgePulseCard>

    {/* Options */}
        <ForgePulseCard theme={theme} title="Options">

            {/* Count-In, Practice Timer, and Accent Beat */}
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
                <input
                type="checkbox"
                checked={countInEnabled}
                onChange={(event) => onCountInChange(event.target.checked)}
                className="h-4 w-4"
                />
                Count-In
            </label>

            <label className="flex items-center gap-2 text-sm">
                <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(event) => onTimerChange(event.target.checked)}
                className="h-4 w-4"
                />
                Practice Timer
            </label>

            <label className="flex items-center gap-2 text-sm">
                <input
                type="checkbox"
                checked={accentEnabled}
                onChange={(event) => onAccentChange(event.target.checked)}
                className="h-4 w-4"
                />
                Accent Beat
            </label>
            </div>

            {timerEnabled && (
              <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">
                Session Length
                <select
                  className={`mt-2 block w-full rounded-lg border px-3 py-2 text-sm normal-case tracking-normal ${
                    theme === "dark"
                      ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                      : "border-zinc-300 bg-white text-zinc-900"
                  }`}
                  value={durationMinutes}
                  onChange={(event) =>
                    onDurationChange(Number(event.target.value))
                  }
                >
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </label>
            )}

            <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">
              Click Volume · {Math.round(volume * 100)}%
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={volume}
                onChange={(event) =>
                  onVolumeChange(Number(event.target.value))
                }
                className="mt-2 block w-full accent-orange-500"
              />
            </label>
        </ForgePulseCard>

    {/* Session Preview */}
        <div className="lg:col-span-2">
            <ForgePulseCard
                theme={theme}
                title="Current Session"
            >

                <h3 className="mt-2 text-sm font-semibold">
                {modeTitle}
                </h3>

                <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
                Difficulty
                </p>

                <p className="mt-1 text-sm">
                {modeDifficulty}
                </p>

                <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
                Goal
                </p>

                <p className="mt-1 text-sm">
                {modeObjective}
                </p>

                <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
                Session
                </p>

                <h4 className="mt-1 text-sm font-semibold">
                {sessionTitle}
                </h4>

                <p className="mt-2 text-sm leading-relaxed">
                {modeDescription}
                </p>

                <p
                className={`mt-3 text-sm ${
                    theme === "dark"
                    ? "text-zinc-500"
                    : "text-zinc-600"
                }`}
                >
                {bpm} BPM • {subdivisionLabels[subdivision]} • {timeSignature}
                </p>
            </ForgePulseCard>
        </div>

      {/* Start Session */}
      <div className="lg:col-span-2">
        <button
          type="button"
          onClick={onStartSession}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Start Session
        </button>
      </div>
    </div>
  );
}
