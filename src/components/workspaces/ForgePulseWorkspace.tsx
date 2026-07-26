import { useState } from "react";
import { ForgePulseSessionView } from "../../features/forgepulse/components/ForgePulseSessionView";
import { ForgePulseSetupView } from "../../features/forgepulse/components/ForgePulseSetupView";

import {
  type Subdivision,
  type TimeSignature,
  type TransportStatus,
  type ForgePulseMode,
  type ForgePulseView,
} from "../../features/forgepulse/forgePulseTypes";

import {
  modeTitles,
  modeDifficulty,
  modeObjectives,
  modeDescriptions,
  modeSessionTitles,
} from "../../features/forgepulse/forgePulseConstants";

type ForgePulseWorkspaceProps = {
  theme: string;
};

function ForgePulseWorkspace({ theme }: ForgePulseWorkspaceProps) {
  // Setup and session navigation
  const [mode, setMode] = useState<ForgePulseMode>("learn");
  const [view, setView] = useState<ForgePulseView>("setup");

  // Session timing configuration
  const [bpm, setBpm] = useState<number>(120);
  const [subdivision, setSubdivision] =
    useState<Subdivision>("quarter");
  const [timeSignature, setTimeSignature] =
    useState<TimeSignature>("4/4");

  // Optional session behavior
  const [countInEnabled, setCountInEnabled] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [accentEnabled, setAccentEnabled] = useState(true);

  // Transport state is retained here until audio generation is connected
  const [, setTransportStatus] = useState<TransportStatus>("idle");

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

      {/* Active practice session */}
      {view === "session" && (
        <ForgePulseSessionView
          theme={theme}
          sessionTitle={modeSessionTitles[mode]}
          onBack={() => setView("setup")}
          onStart={() => setTransportStatus("playing")}
          onStop={() => setTransportStatus("idle")}
        />
      )}

      {/* Session configuration */}
      {view === "setup" && (
        <ForgePulseSetupView
          theme={theme}
          mode={mode}
          bpm={bpm}
          subdivision={subdivision}
          timeSignature={timeSignature}
          modeTitle={modeTitles[mode]}
          modeDifficulty={modeDifficulty[mode]}
          modeObjective={modeObjectives[mode]}
          modeDescription={modeDescriptions[mode]}
          sessionTitle={modeSessionTitles[mode]}
          countInEnabled={countInEnabled}
          timerEnabled={timerEnabled}
          accentEnabled={accentEnabled}
          onModeChange={setMode}
          onBpmChange={setBpm}
          onSubdivisionChange={setSubdivision}
          onTimeSignatureChange={setTimeSignature}
          onCountInChange={setCountInEnabled}
          onTimerChange={setTimerEnabled}
          onAccentChange={setAccentEnabled}
          onStartSession={() => setView("session")}
        />
      )}
    </section>
  );
}

export default ForgePulseWorkspace;
