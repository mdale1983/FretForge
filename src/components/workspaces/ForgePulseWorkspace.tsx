import { useCallback, useEffect, useRef, useState } from "react";
import { ForgePulseSessionView } from "../../features/forgepulse/components/ForgePulseSessionView";
import { ForgePulseSetupView } from "../../features/forgepulse/components/ForgePulseSetupView";
import { useMetronome } from "../../features/forgepulse/hooks/useMetronome";
import {
  getRecentForgePulseRuns,
  saveForgePulseRun,
  type ForgePulseRun,
} from "../../features/forgepulse/forgePulseService";
import { getActiveProjectId } from "../../services/projectService";
import { getActiveSessionId } from "../../services/SessionService";
import {
  loadForgePulsePreferences,
  saveForgePulsePreferences,
} from "../../features/forgepulse/forgePulsePreferences";

import {
  type Subdivision,
  type TimeSignature,
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
  const [initialPreferences] = useState(loadForgePulsePreferences);

  // Setup and session navigation
  const [mode, setMode] = useState<ForgePulseMode>(initialPreferences.mode);
  const [view, setView] = useState<ForgePulseView>("setup");

  // Session timing configuration
  const [bpm, setBpm] = useState<number>(initialPreferences.bpm);
  const [subdivision, setSubdivision] =
    useState<Subdivision>(initialPreferences.subdivision);
  const [timeSignature, setTimeSignature] =
    useState<TimeSignature>(initialPreferences.timeSignature);

  // Optional session behavior
  const [countInEnabled, setCountInEnabled] = useState(
    initialPreferences.countInEnabled
  );
  const [timerEnabled, setTimerEnabled] = useState(
    initialPreferences.timerEnabled
  );
  const [durationMinutes, setDurationMinutes] = useState(
    initialPreferences.durationMinutes
  );
  const [accentEnabled, setAccentEnabled] = useState(
    initialPreferences.accentEnabled
  );
  const [volume, setVolume] = useState(initialPreferences.volume);
  const [recentRuns, setRecentRuns] = useState<ForgePulseRun[]>([]);
  const [isSavingRun, setIsSavingRun] = useState(false);
  const [runSaveError, setRunSaveError] = useState("");
  const lastAutomaticCompletionRef = useRef(0);
  const savingRunRef = useRef(false);

  const metronome = useMetronome({
    bpm,
    subdivision,
    timeSignature,
    accentEnabled,
    countInEnabled,
    timerEnabled,
    durationMinutes,
    volume,
  });

  useEffect(() => {
    saveForgePulsePreferences({
      mode,
      bpm,
      subdivision,
      timeSignature,
      countInEnabled,
      timerEnabled,
      durationMinutes,
      accentEnabled,
      volume,
    });
  }, [
    accentEnabled,
    bpm,
    countInEnabled,
    durationMinutes,
    mode,
    subdivision,
    timeSignature,
    timerEnabled,
    volume,
  ]);

  const loadRecentRuns = useCallback(async () => {
    setRecentRuns(await getRecentForgePulseRuns());
  }, []);

  const recordRun = useCallback(
    async (durationSeconds: number) => {
      if (durationSeconds < 1 || savingRunRef.current) return;

      savingRunRef.current = true;
      setIsSavingRun(true);
      setRunSaveError("");

      try {
        const [projectId, sessionId] = await Promise.all([
          getActiveProjectId(),
          getActiveSessionId(),
        ]);

        await saveForgePulseRun({
          projectId,
          sessionId,
          mode,
          bpm,
          subdivision,
          timeSignature,
          durationSeconds,
        });

        await loadRecentRuns();
      } catch (error) {
        console.error("ForgePulse run could not be saved:", error);
        setRunSaveError(
          "This practice run could not be saved. Your metronome settings are unchanged."
        );
      } finally {
        savingRunRef.current = false;
        setIsSavingRun(false);
      }
    },
    [
      bpm,
      loadRecentRuns,
      mode,
      subdivision,
      timeSignature,
    ]
  );

  useEffect(() => {
    loadRecentRuns();
  }, [loadRecentRuns]);

  useEffect(() => {
    if (
      metronome.automaticCompletionCount >
      lastAutomaticCompletionRef.current
    ) {
      lastAutomaticCompletionRef.current =
        metronome.automaticCompletionCount;
      recordRun(durationMinutes * 60);
    }
  }, [
    durationMinutes,
    metronome.automaticCompletionCount,
    recordRun,
  ]);

  const stopAndRecord = useCallback(async () => {
    const durationSeconds = metronome.stop();
    await recordRun(durationSeconds);
  }, [metronome.stop, recordRun]);

  useEffect(() => {
    if (view !== "session") return;

    const handleKeyboardTransport = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        event.code !== "Space" ||
        event.repeat ||
        target?.matches("input, select, textarea, button")
      ) {
        return;
      }

      event.preventDefault();

      if (metronome.status === "idle") {
        metronome.start();
      } else {
        stopAndRecord();
      }
    };

    window.addEventListener("keydown", handleKeyboardTransport);
    return () => window.removeEventListener("keydown", handleKeyboardTransport);
  }, [metronome.start, metronome.status, stopAndRecord, view]);

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
        Configure a focused timing session, then practice with an audible,
        accented click and live beat tracking.
      </p>

      {/* Active practice session */}
      {view === "session" && (
        <ForgePulseSessionView
          theme={theme}
          sessionTitle={modeSessionTitles[mode]}
          bpm={bpm}
          subdivision={subdivision}
          timeSignature={timeSignature}
          timerEnabled={timerEnabled}
          durationMinutes={durationMinutes}
          status={metronome.status}
          currentBeat={metronome.currentBeat}
          currentSubdivision={metronome.currentSubdivision}
          elapsedSeconds={metronome.elapsedSeconds}
          start={metronome.start}
          stop={stopAndRecord}
          onBack={() => {
            stopAndRecord();
            setView("setup");
          }}
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
          durationMinutes={durationMinutes}
          volume={volume}
          accentEnabled={accentEnabled}
          onModeChange={setMode}
          onBpmChange={setBpm}
          onSubdivisionChange={setSubdivision}
          onTimeSignatureChange={setTimeSignature}
          onCountInChange={setCountInEnabled}
          onTimerChange={setTimerEnabled}
          onDurationChange={setDurationMinutes}
          onVolumeChange={setVolume}
          onAccentChange={setAccentEnabled}
          onStartSession={() => setView("session")}
        />
      )}

      <div className="mt-5 rounded-xl border border-zinc-700/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Recent Practice</h3>
          {isSavingRun && (
            <span className="text-xs text-zinc-500">Saving…</span>
          )}
        </div>

        {recentRuns.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Complete a metronome run to start building your practice history.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className={`rounded-lg border p-3 text-sm ${
                  theme === "dark"
                    ? "border-zinc-800 bg-zinc-950/60"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              >
                <p className="font-semibold">{run.bpm} BPM</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {Math.floor(run.duration_seconds / 60)}m {run.duration_seconds % 60}s
                  {" · "}
                  {run.time_signature}
                </p>
                <p className="mt-1 text-xs capitalize text-zinc-500">
                  {run.mode} · {run.subdivision}
                </p>
              </div>
            ))}
          </div>
        )}

        {runSaveError && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {runSaveError}
          </p>
        )}
      </div>
    </section>
  );
}

export default ForgePulseWorkspace;
