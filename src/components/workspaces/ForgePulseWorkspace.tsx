import { type ReactNode, useState } from "react";

type Subdivision = "quarter" | "eighth" | "triplet" | "sixteenth";
type TransportStatus =
  | "idle"
  | "ready"
  | "playing";

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
    const [bpm, setBpm] = useState<number>(120);
    const [subdivision, setSubdivision] =
        useState<Subdivision>("quarter");
    const [countInEnabled, setCountInEnabled] = useState(false);
    const [timerEnabled, setTimerEnabled] = useState(false);
    const [transportStatus, setTransportStatus] =
        useState<TransportStatus>("idle");
    const [accentEnabled, setAccentEnabled] = useState(true);
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
        <SettingsCard theme={theme} title="Current BPM">
          <input
            className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
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
        </SettingsCard>

        <SettingsCard theme={theme} title="Subdivision">
          <select
            className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm ${
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
        </SettingsCard>

        <SettingsCard theme={theme} title="Count-In">
          <div className="mt-1 flex items-center justify-between gap-4">
            <p
              className={`text-sm ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Play a count-in before metronome start.
            </p>

            <input
              type="checkbox"
              checked={countInEnabled}
              onChange={(event) =>
                setCountInEnabled(event.target.checked)
              }
              className="h-4 w-4"
            />
          </div>
        </SettingsCard>

        <SettingsCard theme={theme} title="Practice Timer">
          <div className="mt-1 flex items-center justify-between gap-4">
            <p
              className={`text-sm ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Enable timed practice sessions.
            </p>

            <input
              type="checkbox"
              checked={timerEnabled}
              onChange={(event) =>
                setTimerEnabled(event.target.checked)
              }
              className="h-4 w-4"
            />
          </div>
        </SettingsCard>
        <SettingsCard theme={theme} title="Accent Beat">
            <div className="mt-1 flex items-center justify-between gap-4">
                <p
                className={`text-sm ${
                    theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
                >
                Emphasize the first beat of each measure.
                </p>

                <input
                type="checkbox"
                checked={accentEnabled}
                onChange={(event) =>
                    setAccentEnabled(event.target.checked)
                }
                className="h-4 w-4"
                />
            </div>
        </SettingsCard>
        <div className="lg:col-span-2">
            <SettingsCard theme={theme} title="Transport">
                <div className="mt-3">
                    <p
                    className={`text-sm ${
                        theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                    }`}
                    >
                    Status: {transportStatus}
                    </p>
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
                            {[1, 2, 3, 4].map((beat) => (
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