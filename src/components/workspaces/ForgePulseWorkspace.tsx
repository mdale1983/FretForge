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

      <div className="mt-5 space-y-4">
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
        <SettingsCard theme={theme} title="Transport">
            <div className="mt-3">
                <p
                className={`text-sm ${
                    theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
                >
                Status: {transportStatus}
                </p>
                <div className="mt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={() => setTransportStatus("playing")}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Start
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
                        Stop
                    </button>
                </div>
            </div>
        </SettingsCard>
      </div>
    </section>
  );
}

export default ForgePulseWorkspace;