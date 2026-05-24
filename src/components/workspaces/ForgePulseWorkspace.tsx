import { type ReactNode, useState } from "react";

type Subdivision = "quarter" | "eighth" | "triplet" | "sixteenth";
type TransportStatus =
  | "idle"
  | "ready"
  | "playing";
type ForgePulseMode =
  | "learn"
  | "practice"
  | "follow"
  | "master";

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

    const [bpm, setBpm] = useState<number>(120);
    const [subdivision, setSubdivision] =
        useState<Subdivision>("quarter");
    const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);

    const [countInEnabled, setCountInEnabled] = useState(false);
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [accentEnabled, setAccentEnabled] = useState(true);

    const [transportStatus, setTransportStatus] =
        useState<TransportStatus>("idle");
    const [currentBeat] = useState(1);

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
                        BPM: {bpm} • {subdivision}
                    </p>
                    <p
                        className={`mt-1 text-sm ${
                            theme === "dark" ? "text-zinc-500" : "text-zinc-500"
                        }`}
                        >
                        Count-In: {countInEnabled ? "Enabled" : "Disabled"} • Timer:{" "}
                        {timerEnabled ? "Enabled" : "Disabled"}
                    </p>
                    <>
                        <p
                            className={`mt-1 text-sm ${
                                theme === "dark" ? "text-zinc-500" : "text-zinc-500"
                            }`}
                        >
                            Accent Beat: {accentEnabled ? "Enabled" : "Disabled"}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                            {Array.from({ length: beatsPerMeasure }, (_, index) => index + 1).map((beat) => (
                                <div
                                key={beat}
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                                    beat === currentBeat
                                    ? "bg-orange-500 text-white"
                                    : theme === "dark"
                                        ? "bg-zinc-800 text-zinc-500"
                                        : "bg-zinc-200 text-zinc-600"
                                }`}
                                >
                                {beat}
                                </div>
                            ))}
                        </div>
                    </>
                    <p
                        className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                            theme === "dark"
                            ? "border-zinc-800 bg-zinc-900 text-zinc-500"
                            : "border-zinc-200 bg-white text-zinc-600"
                        }`}
                        >
                        Audio engine not connected yet. Transport controls are UI-only.
                    </p>
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
                    <div className="mt-3 flex items-center gap-2">
                        <div
                            className={`h-3 w-3 rounded-full ${
                            transportStatus === "playing"
                                ? "bg-green-500"
                                : "bg-zinc-500"
                            }`}
                        />

                        <span
                            className={`text-sm ${
                            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                            }`}
                        >
                            {transportStatus === "playing"
                            ? "Metronome armed"
                            : "Metronome stopped"}
                        </span>
                    </div>
                </div>
            </SettingsCard>
        </div>
      </div>
    </section>
  );
}

export default ForgePulseWorkspace;