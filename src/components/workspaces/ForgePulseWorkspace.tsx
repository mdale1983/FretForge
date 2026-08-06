import { useCallback, useEffect, useRef, useState } from "react";
import { ForgePulseSessionView } from "../../features/forgepulse/components/ForgePulseSessionView";
import { ForgePulseSetupView } from "../../features/forgepulse/components/ForgePulseSetupView";
import { ForgePulseReadinessView } from "../../features/forgepulse/components/ForgePulseReadinessView";
import { ForgePulseResultsView } from "../../features/forgepulse/components/ForgePulseResultsView";
import { useMetronome } from "../../features/forgepulse/hooks/useMetronome";
import { useTimingCoach } from "../../features/forgepulse/hooks/useTimingCoach";
import { useVoiceCoach, type VoiceCoachFrequency } from "../../features/forgepulse/hooks/useVoiceCoach";
import {
  deleteForgePulseRun,
  getForgePulseSummary,
  getRecentForgePulseRuns,
  saveForgePulseRun,
  type ForgePulseRun,
  type ForgePulseSummary,
	type ForgePulseTimingReport,
} from "../../features/forgepulse/forgePulseService";
import { Trash2 } from "lucide-react";
import { getActiveProjectId } from "../../services/projectService";
import { getActiveSessionId } from "../../services/SessionService";
import {
  loadForgePulsePreferences,
  saveForgePulsePreferences,
} from "../../features/forgepulse/forgePulsePreferences";
import {
  launchStudioApplication,
  listStudioApplications,
  type StudioApplication,
  setFretForgeLinkGain,
} from "../../services/studioApplicationService";

import {
  type Subdivision,
  type TimeSignature,
  type ForgePulseMode,
  type ForgePulseView,
  type TimingStrictness,
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
  const [practiceSummary, setPracticeSummary] = useState<ForgePulseSummary>({
    runCount: 0,
    totalSeconds: 0,
    averageBpm: 0,
  });
  const [isSavingRun, setIsSavingRun] = useState(false);
  const [runSaveError, setRunSaveError] = useState("");
  const [preferredDaw, setPreferredDaw] = useState<StudioApplication | null>(null);
  const [isLaunchingDaw, setIsLaunchingDaw] = useState(false);
  const [dawLaunchError, setDawLaunchError] = useState("");
  const [guitarVolume, setGuitarVolume] = useState(() => {
    const stored = localStorage.getItem("fretforge.forgePulseGuitarVolumeV2");
    if (stored === null) return 1;
    const saved = Number(stored);
    return Number.isFinite(saved) && saved >= 0 && saved <= 1.5 ? saved : 1;
  });
  const [voiceCoachFrequency, setVoiceCoachFrequency] = useState<VoiceCoachFrequency>(() =>
    (localStorage.getItem("fretforge.voiceCoachFrequency") as VoiceCoachFrequency | null) ?? "standard"
  );
  const [voiceCoachVolume, setVoiceCoachVolume] = useState(() => {
    const stored = Number(localStorage.getItem("fretforge.voiceCoachVolume"));
    return Number.isFinite(stored) && stored > 0 && stored <= 1 ? stored : 0.8;
  });
	const [voiceCoachVoice, setVoiceCoachVoice] = useState(() => localStorage.getItem("fretforge.voiceCoachVoice") ?? "");
	const [voiceCoachRate, setVoiceCoachRate] = useState(() => {
	  const stored = Number(localStorage.getItem("fretforge.voiceCoachRate"));
	  return Number.isFinite(stored) && stored >= 0.8 && stored <= 1.15 ? stored : 0.94;
	});
	const [voiceCoachPitch, setVoiceCoachPitch] = useState(() => {
	  const stored = Number(localStorage.getItem("fretforge.voiceCoachPitch"));
	  return Number.isFinite(stored) && stored >= 0.8 && stored <= 1.2 ? stored : 0.98;
	});
  const [voiceDuringPlay, setVoiceDuringPlay] = useState(() => localStorage.getItem("fretforge.voiceDuringPlay") !== "false");
  const [voiceEndSummary, setVoiceEndSummary] = useState(() => localStorage.getItem("fretforge.voiceEndSummary") !== "false");
  const [timingStrictness, setTimingStrictness] = useState<TimingStrictness>(() =>
    (localStorage.getItem("fretforge.timingStrictness") as TimingStrictness | null) ?? "balanced"
  );
  const [signalVerified, setSignalVerified] = useState(false);
  const lastAutomaticCompletionRef = useRef(0);
  const savingRunRef = useRef(false);
	const timingCoachRef = useRef<ReturnType<typeof useTimingCoach> | null>(null);

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
  const timingCoach = useTimingCoach(metronome.status, bpm, subdivision, timingStrictness, metronome.practiceStartedAtMs);
	timingCoachRef.current = timingCoach;
  const voiceCoach = useVoiceCoach({
    frequency: voiceCoachFrequency,
    volume: voiceCoachVolume,
    feedbackDuringPlaying: voiceDuringPlay,
    endSummary: voiceEndSummary,
    status: metronome.status,
    timing: timingCoach,
	voiceName: voiceCoachVoice,
	rate: voiceCoachRate,
	pitch: voiceCoachPitch,
  });

  useEffect(() => {
    localStorage.setItem("fretforge.voiceCoachFrequency", voiceCoachFrequency);
    localStorage.setItem("fretforge.voiceCoachVolume", String(voiceCoachVolume));
    localStorage.setItem("fretforge.voiceDuringPlay", String(voiceDuringPlay));
    localStorage.setItem("fretforge.voiceEndSummary", String(voiceEndSummary));
	localStorage.setItem("fretforge.voiceCoachVoice", voiceCoachVoice);
	localStorage.setItem("fretforge.voiceCoachRate", String(voiceCoachRate));
	localStorage.setItem("fretforge.voiceCoachPitch", String(voiceCoachPitch));
    localStorage.setItem("fretforge.timingStrictness", timingStrictness);
	}, [timingStrictness, voiceCoachFrequency, voiceCoachPitch, voiceCoachRate, voiceCoachVoice, voiceCoachVolume, voiceDuringPlay, voiceEndSummary]);

  const loadPreferredDaw = useCallback(async () => {
    const applications = await listStudioApplications();
    const preferredId = localStorage.getItem("fretforge.preferredDaw") ?? "reaper";
    setPreferredDaw(applications.find((application) => application.id === preferredId) ?? null);
  }, []);

  useEffect(() => {
    loadPreferredDaw().catch(() => setPreferredDaw(null));
    const timer = window.setInterval(() => loadPreferredDaw().catch(() => undefined), 3_000);
    return () => window.clearInterval(timer);
  }, [loadPreferredDaw]);

  async function handleLaunchDaw() {
    if (!preferredDaw) return;
    try {
      setIsLaunchingDaw(true);
      setDawLaunchError("");
      await launchStudioApplication(preferredDaw.id);
      window.setTimeout(() => loadPreferredDaw().catch(() => undefined), 1_200);
    } catch (error) {
      setDawLaunchError(String(error));
    } finally {
      setIsLaunchingDaw(false);
    }
  }

  function handleGuitarVolumeChange(value: number) {
    setGuitarVolume(value);
    localStorage.setItem("fretforge.forgePulseGuitarVolumeV2", String(value));
    if (timingCoach.sourceId) {
      setFretForgeLinkGain(timingCoach.sourceId, value).catch((error) => setDawLaunchError(String(error)));
    }
  }

  useEffect(() => {
    if (!timingCoach.connected || !timingCoach.sourceId) return;
    setFretForgeLinkGain(timingCoach.sourceId, guitarVolume).catch((error) => setDawLaunchError(String(error)));
  }, [guitarVolume, timingCoach.connected, timingCoach.sourceId]);

  useEffect(() => {
    if (view !== "readiness" || !timingCoach.connected || !timingCoach.processingActive) return;
    const fingerprint = `${timingCoach.sourceName}|${Math.round(timingCoach.sampleRate)}`;
    const previouslyVerified = localStorage.getItem("fretforge.verifiedForgePulseRoute") === fingerprint;
    if (previouslyVerified) {
      setSignalVerified(true);
      return;
    }
    if (timingCoach.inputLevel >= 2) {
      localStorage.setItem("fretforge.verifiedForgePulseRoute", fingerprint);
      setSignalVerified(true);
    } else {
      setSignalVerified(false);
    }
  }, [timingCoach.connected, timingCoach.inputLevel, timingCoach.processingActive, timingCoach.sampleRate, timingCoach.sourceName, view]);

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

  const loadPracticeSummary = useCallback(async () => {
    const [runs, summary] = await Promise.all([getRecentForgePulseRuns(), getForgePulseSummary()]);
    setRecentRuns(runs);
    setPracticeSummary(summary);
  }, []);

  async function handleDeleteRun(run: ForgePulseRun) {
    if (!window.confirm(`Delete this ${run.duration_seconds}-second practice entry?`)) return;
    try {
      await deleteForgePulseRun(run.id);
      await loadPracticeSummary();
    } catch (error) {
      console.error("ForgePulse run could not be deleted:", error);
      setRunSaveError("This practice entry could not be deleted.");
    }
  }

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
		  timingStrictness,
		  timingReport: timingCoachRef.current ? {
			scoredCount: timingCoachRef.current.scoredCount,
			lockedCount: timingCoachRef.current.lockedCount,
			greatCount: timingCoachRef.current.greatCount,
			goodCount: timingCoachRef.current.goodCount,
			onTempoCount: timingCoachRef.current.onTempoCount,
			offTempoCount: timingCoachRef.current.offTempoCount,
			missedCount: timingCoachRef.current.missedCount,
			extraCount: timingCoachRef.current.extraCount,
			medianOffsetMs: timingCoachRef.current.medianOffsetMs,
			medianAbsoluteErrorMs: timingCoachRef.current.medianAbsoluteErrorMs,
			consistencyMs: timingCoachRef.current.consistencyMs,
			driftMs: timingCoachRef.current.driftMs,
			pocket: timingCoachRef.current.pocket,
			confidence: timingCoachRef.current.confidence,
		  } satisfies ForgePulseTimingReport : null,
        });

        await loadPracticeSummary();
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
      loadPracticeSummary,
      mode,
      subdivision,
      timeSignature,
      timingStrictness,
    ]
  );

  useEffect(() => {
    loadPracticeSummary().catch((error) => {
      console.error("ForgePulse history could not be loaded:", error);
      setRunSaveError(
        "Practice history is currently unavailable, but the metronome is ready."
      );
    });
  }, [loadPracticeSummary]);

  useEffect(() => {
    if (
      metronome.automaticCompletionCount >
      lastAutomaticCompletionRef.current
    ) {
      lastAutomaticCompletionRef.current =
        metronome.automaticCompletionCount;
      recordRun(durationMinutes * 60);
      setView("results");
    }
  }, [
    durationMinutes,
    metronome.automaticCompletionCount,
    recordRun,
  ]);

  const stopAndRecord = useCallback(async () => {
    const durationSeconds = metronome.stop();
    await recordRun(durationSeconds);
    setView("results");
  }, [metronome.stop, recordRun]);

  const beginSession = useCallback(() => {
    if (!preferredDaw?.running || !timingCoach.connected || !timingCoach.processingActive || !signalVerified) return;
    setView("session");
  }, [preferredDaw?.running, signalVerified, timingCoach.connected, timingCoach.processingActive]);

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
		  measuredBpm={metronome.measuredBpm}
		  measuredIntervalMs={metronome.measuredIntervalMs}
		  clickJitterMs={metronome.clickJitterMs}
          subdivision={subdivision}
          timeSignature={timeSignature}
          timerEnabled={timerEnabled}
          durationMinutes={durationMinutes}
          status={metronome.status}
          currentBeat={metronome.currentBeat}
          currentSubdivision={metronome.currentSubdivision}
          elapsedSeconds={metronome.elapsedSeconds}
          timingCoach={timingCoach}
          dawName={preferredDaw?.name ?? "your preferred DAW"}
          dawInstalled={preferredDaw?.installed ?? false}
          dawRunning={preferredDaw?.running ?? false}
          isLaunchingDaw={isLaunchingDaw}
          dawLaunchError={dawLaunchError}
          onLaunchDaw={handleLaunchDaw}
          guitarVolume={guitarVolume}
          onGuitarVolumeChange={handleGuitarVolumeChange}
          voiceCoachFrequency={voiceCoachFrequency}
          voiceCoachSupported={voiceCoach.supported}
          voiceCoachSpeaking={voiceCoach.speaking}
          voiceCoachLastMessage={voiceCoach.lastMessage}
          voiceCoachOutputError={voiceCoach.outputError}
          timingStrictness={timingStrictness}
          start={metronome.start}
          stop={stopAndRecord}
          onBack={() => {
            stopAndRecord();
            setView("setup");
          }}
        />
      )}

      {view === "readiness" && (
        <ForgePulseReadinessView
          theme={theme}
          dawName={preferredDaw?.name ?? "your preferred DAW"}
          dawInstalled={preferredDaw?.installed ?? false}
          dawRunning={preferredDaw?.running ?? false}
          isLaunchingDaw={isLaunchingDaw}
          dawLaunchError={dawLaunchError}
          linkConnected={timingCoach.connected}
          processingActive={timingCoach.processingActive}
          sourceName={timingCoach.sourceName}
          inputLevel={timingCoach.inputLevel}
          signalVerified={signalVerified}
          guitarVolume={guitarVolume}
          onGuitarVolumeChange={handleGuitarVolumeChange}
          onLaunchDaw={handleLaunchDaw}
          onBack={() => setView("setup")}
          onStart={beginSession}
        />
      )}

      {view === "results" && (
        <ForgePulseResultsView
          theme={theme}
          timing={timingCoach}
          onAgain={() => setView("readiness")}
          onSetup={() => setView("setup")}
        />
      )}

      {/* Session configuration */}
      {view === "setup" && (
        <>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-orange-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Runs</p>
            <p className="mt-1 text-xl font-semibold text-orange-400">{practiceSummary.runCount}</p>
          </div>
          <div className="rounded-xl bg-orange-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Practice Time</p>
            <p className="mt-1 text-xl font-semibold text-orange-400">{Math.floor(practiceSummary.totalSeconds / 60)}m {practiceSummary.totalSeconds % 60}s</p>
          </div>
          <div className="rounded-xl bg-orange-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Average Tempo</p>
            <p className="mt-1 text-xl font-semibold text-orange-400">{practiceSummary.averageBpm > 0 ? `${practiceSummary.averageBpm} BPM` : "—"}</p>
          </div>
        </div>
        {runSaveError && <p className="mt-3 text-sm text-red-400" role="alert">{runSaveError}</p>}
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
          voiceCoachFrequency={voiceCoachFrequency}
          voiceCoachVolume={voiceCoachVolume}
          voiceDuringPlay={voiceDuringPlay}
          voiceEndSummary={voiceEndSummary}
          voiceCoachSupported={voiceCoach.supported}
		  voiceCoachVoices={voiceCoach.voices}
		  voiceCoachVoice={voiceCoach.voices.some((voice) => voice.name === voiceCoachVoice) ? voiceCoachVoice : voiceCoach.activeVoiceName}
		  voiceCoachRate={voiceCoachRate}
		  voiceCoachPitch={voiceCoachPitch}
          timingStrictness={timingStrictness}
          onModeChange={setMode}
          onBpmChange={setBpm}
          onSubdivisionChange={setSubdivision}
          onTimeSignatureChange={setTimeSignature}
          onCountInChange={setCountInEnabled}
          onTimerChange={setTimerEnabled}
          onDurationChange={setDurationMinutes}
          onVolumeChange={setVolume}
          onAccentChange={setAccentEnabled}
          onVoiceCoachFrequencyChange={setVoiceCoachFrequency}
          onVoiceCoachVolumeChange={setVoiceCoachVolume}
		  onVoiceCoachVoiceChange={setVoiceCoachVoice}
		  onVoiceCoachRateChange={setVoiceCoachRate}
		  onVoiceCoachPitchChange={setVoiceCoachPitch}
          onVoiceDuringPlayChange={setVoiceDuringPlay}
          onVoiceEndSummaryChange={setVoiceEndSummary}
		  onTestVoice={() => voiceCoach.speak("All set. Start whenever you're ready.")}
          onTimingStrictnessChange={setTimingStrictness}
          onStartSession={() => {
            setView("readiness");
          }}
        />
        </>
      )}

      {false && (view === "setup" || view === "results") && <div className="mt-5 rounded-xl border border-zinc-700/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold">Recent Practice</h3>
          {isSavingRun && (
            <span className="text-xs text-zinc-500">Saving…</span>
          )}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-orange-500/10 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Runs</p>
            <p className="mt-1 text-xl font-semibold text-orange-400">
              {practiceSummary.runCount}
            </p>
          </div>
          <div className="rounded-lg bg-orange-500/10 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Practice Time
            </p>
            <p className="mt-1 text-xl font-semibold text-orange-400">
              {Math.floor(practiceSummary.totalSeconds / 60)}m
              {" "}
              {practiceSummary.totalSeconds % 60}s
            </p>
          </div>
          <div className="rounded-lg bg-orange-500/10 p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Average Tempo
            </p>
            <p className="mt-1 text-xl font-semibold text-orange-400">
              {practiceSummary.averageBpm || "—"}
              {practiceSummary.averageBpm > 0 && " BPM"}
            </p>
          </div>
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
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{run.bpm} BPM</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteRun(run)}
                    className="rounded p-1 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Delete practice entry"
                    title="Delete practice entry"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
      </div>}
    </section>
  );
}

export default ForgePulseWorkspace;
