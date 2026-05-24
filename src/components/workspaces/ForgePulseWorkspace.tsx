import { type ReactNode, useState } from "react";

type Subdivision =
  | "whole"
  | "half"
  | "quarter"
  | "eighth"
  | "triplet"
  | "sixteenth";
type TransportStatus =
  | "idle"
  | "ready"
  | "playing";
type ForgePulseMode =
  | "learn"
  | "practice"
  | "follow"
  | "master";
type ForgePulseView =
  | "setup"
  | "session";
const modeTitles: Record<ForgePulseMode, string> = {
  learn: "Rhythm Fundamentals",
  practice: "Standard Metronome Practice",
  follow: "Custom Rhythm Following",
  master: "Advanced Internal Timing",
};
const modeDifficulty: Record<ForgePulseMode, string> = {
  learn: "Beginner",
  practice: "Intermediate",
  follow: "Advanced",
  master: "Expert",
};
const modeSessionTitles: Record<ForgePulseMode, string> = {
  learn: "Mastering Whole Notes in 4/4",
  practice: "Developing Quarter Note Timing",
  follow: "Following Basic Rhythm Patterns",
  master: "Advanced Internal Timing",
};
const modeObjectives: Record<ForgePulseMode, string> = {
  learn:
    "Understand note durations, subdivisions, and counting.",
  practice:
    "Maintain consistent timing and rhythmic accuracy.",
  follow:
    "Synchronize with custom rhythm patterns and riffs.",
  master:
    "Develop internal timing with reduced metronome support.",
};
const modeDescriptions: Record<ForgePulseMode, string> = {
  learn:
    "Learn rhythm fundamentals, note values, subdivisions, and timing concepts.",
  practice:
    "Standard metronome operation for daily timing practice.",
  follow:
    "Follow custom rhythm patterns and riff structures.",
  master:
    "Advanced timing exercises with reduced click assistance.",
};
const subdivisionLabels: Record<Subdivision, string> = {
  whole: "WHOLE NOTES",
  half: "HALF NOTES",
  quarter: "QUARTER NOTES",
  eighth: "EIGHTH NOTES",
  triplet: "TRIPLETS",
  sixteenth: "SIXTEENTH NOTES",
};

type ForgePulseWorkspaceProps = {
  theme: string;
};

type SettingsCardProps = {
  theme: string;
  title: string;
  children: ReactNode;
};

function SettingsCard({ theme, title, children }: SettingsCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-950/50"
          : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {title}
      </p>

      {children}
    </div>
  );
}

function ForgePulseWorkspace({ theme }: ForgePulseWorkspaceProps) {
    const [mode, setMode] =
        useState<ForgePulseMode>("learn");
    const [view, setView] =
        useState<ForgePulseView>("setup");

    const [bpm, setBpm] = useState<number>(120);
    const [subdivision, setSubdivision] =
        useState<Subdivision>("quarter");
    const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);

    const [countInEnabled, setCountInEnabled] = useState(false);
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [accentEnabled, setAccentEnabled] = useState(true);

    const [transportStatus, setTransportStatus] =
        useState<TransportStatus>("idle");
    

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 shadow-lg ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-black/20"
          : "border-zinc-300 bg-white text-zinc-900 shadow-zinc-300/40"
      }`}
    >
      <h2 className="text-xl font-semibold tracking-tight text-orange-400">
        ForgePulse
      </h2>

      <p
        className={`mt-3 text-sm leading-relaxed ${
          theme === "dark" ? "text-zinc-400" : "text-zinc-700"
        }`}
      >
        Metronome workspace shell ready. Audio generation and session
        persistence are intentionally not wired yet.
      </p>

      {view === "session" && (
        <div
            className={`mt-5 rounded-xl border p-4 ${
            theme === "dark"
                ? "border-zinc-800 bg-zinc-950/50"
                : "border-zinc-200 bg-zinc-50"
            }`}
        >
            <p className="text-xs uppercase tracking-wide text-zinc-500">
            Active Session
            </p>

            <h3 className="mt-2 text-sm font-semibold">
            {modeSessionTitles[mode]}
            </h3>

            <button
            type="button"
            onClick={() => setView("setup")}
            className={`mt-4 rounded-lg border px-4 py-2 text-sm font-semibold ${
                theme === "dark"
                ? "border-zinc-700 text-zinc-100"
                : "border-zinc-300 text-zinc-900"
            }`}
            >
            Back to Setup
            </button>
            <div className="mt-4 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setTransportStatus("playing")}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                >
                    Start Metronome
                </button>

                <button
                    type="button"
                    onClick={() => setTransportStatus("idle")}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                    theme === "dark"
                        ? "border-zinc-700 text-zinc-100"
                        : "border-zinc-300 text-zinc-900"
                    }`}
                >
                    Stop Metronome
                </button>
            </div>
        </div>
        )}

        {view === "setup" && (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <SettingsCard theme={theme} title="Quick Setup">
                    <div className="grid gap-3 sm:grid-cols-2">

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
                            setMode(event.target.value as ForgePulseMode)
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
                                onChange={(event) => setBpm(Number(event.target.value))}
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
                                setSubdivision(event.target.value as Subdivision)
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
                                value={beatsPerMeasure}
                                onChange={(event) =>
                                setBeatsPerMeasure(Number(event.target.value))
                                }
                            >
                                <option value={2}>2/4</option>
                                <option value={3}>3/4</option>
                                <option value={4}>4/4</option>
                                <option value={5}>5/4</option>
                                <option value={6}>6/8</option>
                                <option value={7}>7/8</option>
                            </select>
                        </div>

                    </div>
                </SettingsCard>

                <SettingsCard theme={theme} title="Options">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={countInEnabled}
                                onChange={(event) =>
                                setCountInEnabled(event.target.checked)
                                }
                                className="h-4 w-4"
                            />

                            Count-In
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={timerEnabled}
                                onChange={(event) =>
                                setTimerEnabled(event.target.checked)
                                }
                                className="h-4 w-4"
                            />

                            Practice Timer
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={accentEnabled}
                                onChange={(event) =>
                                setAccentEnabled(event.target.checked)
                                }
                                className="h-4 w-4"
                            />

                            Accent Beat
                        </label>

                    </div>
                </SettingsCard>
                
                <div className="lg:col-span-2">
                    <SettingsCard theme={theme} title="Transport">
                        <div className="mt-3">
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                    transportStatus === "playing"
                                        ? "bg-green-500 text-white"
                                        : theme === "dark"
                                        ? "bg-zinc-800 text-zinc-300"
                                        : "bg-zinc-200 text-zinc-700"
                                    }`}
                                >
                                    {transportStatus.toUpperCase()}
                                </span>
                                </div>
                            <p
                                className={`mt-1 text-sm ${
                                    theme === "dark" ? "text-zinc-500" : "text-zinc-500"
                                }`}
                                >
                                {bpm} BPM • {subdivisionLabels[subdivision]} • {beatsPerMeasure}/4
                            </p>
                            
                            <div
                                className={`mt-3 rounded-lg border px-3 py-3 ${
                                    theme === "dark"
                                    ? "border-zinc-800 bg-zinc-950/50"
                                    : "border-zinc-200 bg-zinc-50"
                                }`}
                                >
                                <p className="text-xs uppercase tracking-wide text-zinc-500">
                                    Current Session
                                </p>
                                <h3 className="mt-2 text-sm font-semibold">
                                    {modeTitles[mode]}
                                </h3>
                                <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                                    Difficulty
                                    </p>

                                    <p
                                    className={`mt-1 text-sm ${
                                        theme === "dark"
                                        ? "text-zinc-400"
                                        : "text-zinc-600"
                                    }`}
                                    >
                                    {modeDifficulty[mode]}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                                    Goal
                                    </p>

                                    <p
                                    className={`mt-1 text-sm ${
                                        theme === "dark"
                                        ? "text-zinc-400"
                                        : "text-zinc-600"
                                    }`}
                                    >
                                    {modeObjectives[mode]}
                                </p>
                                <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                                    Session
                                </p>

                                <h4 className="mt-1 text-sm font-semibold">
                                    {modeSessionTitles[mode]}
                                </h4>
                                <p
                                    className={`mt-2 text-sm leading-relaxed ${
                                    theme === "dark"
                                        ? "text-zinc-400"
                                        : "text-zinc-600"
                                    }`}
                                >
                                    {modeDescriptions[mode]}
                                </p>
                            </div>
                            <p
                                className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                                    theme === "dark"
                                    ? "border-zinc-800 bg-zinc-900 text-zinc-500"
                                    : "border-zinc-200 bg-white text-zinc-600"
                                }`}
                                >
                                Audio engine not connected yet. Transport controls are UI-only.
                            </p>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    onClick={() => setView("session")}
                                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Start Session
                                </button>
                            </div>
                        </div>
                    </SettingsCard>

                </div>
            </div>
        )}
    </section>
  );
}

export default ForgePulseWorkspace;