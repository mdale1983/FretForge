import { useCallback, useEffect, useRef, useState } from "react";
import type { Subdivision, TimeSignature, TransportStatus } from "../forgePulseTypes";
import { getForgePulseAudioContext } from "../forgePulseAudioEngine";

type UseMetronomeOptions = {
  bpm: number;
  subdivision: Subdivision;
  timeSignature: TimeSignature;
  accentEnabled: boolean;
  countInEnabled: boolean;
  timerEnabled: boolean;
  durationMinutes: number;
  volume: number;
};

type ClickKind = "count-in" | "count-in-final" | "beat" | "downbeat";

const LOOK_AHEAD_SECONDS = 0.12;
const SCHEDULER_INTERVAL_MS = 25;
const CLICK_OUTPUT_BOOST = 1.4;

function contextTimeToEpochMs(context: AudioContext, contextTime: number) {
  const timestamp = context.getOutputTimestamp?.();
	const anchorContextTime = timestamp?.contextTime ?? 0;
	const anchorPerformanceTime = timestamp?.performanceTime ?? 0;
  if (anchorContextTime > 0 && anchorPerformanceTime > 0) {
	const targetPerformanceTime = anchorPerformanceTime + (contextTime - anchorContextTime) * 1_000;
    return performance.timeOrigin + targetPerformanceTime;
  }
  return Date.now() + (contextTime - context.currentTime) * 1_000;
}

export function useMetronome({
  bpm,
  subdivision: _subdivision,
  timeSignature,
  accentEnabled,
  countInEnabled,
  timerEnabled,
  durationMinutes,
  volume,
}: UseMetronomeOptions) {
  const [status, setStatus] = useState<TransportStatus>("idle");
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentSubdivision, setCurrentSubdivision] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [automaticCompletionCount, setAutomaticCompletionCount] = useState(0);
  const [measuredBpm, setMeasuredBpm] = useState(0);
  const [measuredIntervalMs, setMeasuredIntervalMs] = useState(0);
  const [clickJitterMs, setClickJitterMs] = useState(0);
  const [practiceStartedAtMs, setPracticeStartedAtMs] = useState(0);

  const schedulerIntervalRef = useRef<number | null>(null);
  const clockIntervalRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const uiTimeoutsRef = useRef<number[]>([]);
  const scheduledSourcesRef = useRef<AudioScheduledSourceNode[]>([]);
  const startedAtRef = useRef(0);
  const runningRef = useRef(false);
  const scheduleIndexRef = useRef(0);
  const nextClickContextTimeRef = useRef(0);
  const countInBeatsRef = useRef(0);
  const scheduledPracticeTimesRef = useRef<number[]>([]);

  const beatsPerMeasure = Number(timeSignature.split("/")[0]);

  const prepareAudioContext = useCallback(async () => {
    return getForgePulseAudioContext();
  }, []);

  const scheduleClick = useCallback((context: AudioContext, kind: ClickKind, atTime: number) => {
    const isCountIn = kind === "count-in" || kind === "count-in-final";
    const isAccent = kind === "downbeat" || kind === "count-in-final";
    const clickVolume = Math.max(0.01, Math.min(volume, 1));

    // Use a neutral drum pulse: a rim/cross-stick transient on every beat and
    // a short kick layer on the downbeat. This feels musical without imposing
    // a genre-specific drum groove on the exercise.
    const impactDuration = isAccent ? 0.075 : 0.06;
    const frameCount = Math.max(1, Math.ceil(context.sampleRate * impactDuration));
    const impactBuffer = context.createBuffer(1, frameCount, context.sampleRate);
    const impact = impactBuffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < frameCount; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.18 + white * 0.82;
      impact[index] = previous * Math.exp(-index / (context.sampleRate * 0.016));
    }
    const impactSource = context.createBufferSource();
    const impactFilter = context.createBiquadFilter();
    const impactGain = context.createGain();
    const limiter = context.createDynamicsCompressor();
    const outputGain = context.createGain();
    impactSource.buffer = impactBuffer;
    impactFilter.type = "bandpass";
    impactFilter.frequency.value = isCountIn ? 1_350 : isAccent ? 1_950 : 1_700;
    impactFilter.Q.value = 1.05;
    impactGain.gain.setValueAtTime(clickVolume * CLICK_OUTPUT_BOOST * (isAccent ? 1.65 : 1.5), atTime);
    impactGain.gain.exponentialRampToValueAtTime(0.001, atTime + impactDuration);
    limiter.threshold.value = -10;
    limiter.knee.value = 8;
    limiter.ratio.value = 10;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.055;
    outputGain.gain.value = 1.15;
    impactSource.connect(impactFilter);
    impactFilter.connect(impactGain);
    impactGain.connect(limiter);

    const body = context.createOscillator();
    const bodyGain = context.createGain();
    body.type = "sine";
    if (isAccent) {
      body.frequency.setValueAtTime(isCountIn ? 135 : 118, atTime);
      body.frequency.exponentialRampToValueAtTime(isCountIn ? 78 : 68, atTime + 0.055);
    } else {
      body.frequency.value = isCountIn ? 620 : 720;
    }
    bodyGain.gain.setValueAtTime(clickVolume * CLICK_OUTPUT_BOOST * (isAccent ? 0.32 : 0.34), atTime);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, atTime + (isAccent ? 0.08 : 0.052));
    body.connect(bodyGain);
    bodyGain.connect(limiter);
    limiter.connect(outputGain);
    outputGain.connect(context.destination);

    const sources: AudioScheduledSourceNode[] = [impactSource, body];
    scheduledSourcesRef.current.push(...sources);
    sources.forEach((source) => {
      source.onended = () => {
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter((node) => node !== source);
      };
    });
    impactSource.start(atTime);
    impactSource.stop(atTime + impactDuration);
    body.start(atTime);
    body.stop(atTime + (isAccent ? 0.085 : 0.057));
  }, [volume]);

  const stop = useCallback(() => {
    const finalElapsedSeconds = runningRef.current
      ? Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1_000))
      : 0;
    if (schedulerIntervalRef.current !== null) window.clearInterval(schedulerIntervalRef.current);
    if (clockIntervalRef.current !== null) window.clearInterval(clockIntervalRef.current);
    if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
    uiTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
    scheduledSourcesRef.current.forEach((source) => {
      try { source.stop(); } catch { /* already stopped */ }
    });
    schedulerIntervalRef.current = null;
    clockIntervalRef.current = null;
    transitionTimeoutRef.current = null;
    uiTimeoutsRef.current = [];
    scheduledSourcesRef.current = [];
    scheduleIndexRef.current = 0;
    nextClickContextTimeRef.current = 0;
    scheduledPracticeTimesRef.current = [];
    runningRef.current = false;
    setElapsedSeconds(finalElapsedSeconds);
    setStatus("idle");
    setCurrentBeat(0);
    setCurrentSubdivision(0);
    return finalElapsedSeconds;
  }, []);

  const start = useCallback(async () => {
    stop();
    setElapsedSeconds(0);
    setMeasuredBpm(0);
    setMeasuredIntervalMs(0);
    setClickJitterMs(0);
    setPracticeStartedAtMs(0);

    const context = await prepareAudioContext().catch((error) => {
      console.warn("Preferred metronome output is unavailable:", error);
      return null;
    });
    if (!context) return;

    const beatIntervalSeconds = 60 / bpm;
    const countInBeats = countInEnabled ? beatsPerMeasure : 0;
    countInBeatsRef.current = countInBeats;
    scheduleIndexRef.current = 0;
    nextClickContextTimeRef.current = context.currentTime + LOOK_AHEAD_SECONDS;
    const practiceStartContextTime = nextClickContextTimeRef.current + countInBeats * beatIntervalSeconds;
    const practiceStartEpoch = contextTimeToEpochMs(context, practiceStartContextTime);
    startedAtRef.current = practiceStartEpoch;
    setPracticeStartedAtMs(practiceStartEpoch);
    setStatus(countInBeats > 0 ? "counting-in" : "playing");

    const beginPracticeDelay = Math.max(0, practiceStartEpoch - Date.now());
    transitionTimeoutRef.current = window.setTimeout(() => {
      runningRef.current = true;
      setStatus("playing");
    }, beginPracticeDelay);

    const updateDiagnostics = (scheduledEpoch: number) => {
      const times = [...scheduledPracticeTimesRef.current.slice(-8), scheduledEpoch];
      scheduledPracticeTimesRef.current = times;
      if (times.length < 2) return;
      const intervals = times.slice(1).map((time, index) => time - times[index]);
      const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
      const jitter = Math.sqrt(intervals.reduce((sum, value) => sum + (value - average) ** 2, 0) / intervals.length);
      setMeasuredIntervalMs(average);
      setMeasuredBpm(60_000 / average);
      setClickJitterMs(jitter);
    };

    const scheduler = () => {
      const horizon = context.currentTime + LOOK_AHEAD_SECONDS;
      while (nextClickContextTimeRef.current <= horizon) {
        const sequenceIndex = scheduleIndexRef.current;
        const isCountIn = sequenceIndex < countInBeatsRef.current;
        const practiceStep = sequenceIndex - countInBeatsRef.current;
        const beat = isCountIn ? sequenceIndex : practiceStep % beatsPerMeasure;
        const kind: ClickKind = isCountIn
          ? sequenceIndex === countInBeatsRef.current - 1 ? "count-in-final" : "count-in"
          : accentEnabled && beat === 0 ? "downbeat" : "beat";
        const clickContextTime = nextClickContextTimeRef.current;
        const clickEpoch = contextTimeToEpochMs(context, clickContextTime);
        scheduleClick(context, kind, clickContextTime);
        if (!isCountIn) updateDiagnostics(clickEpoch);
        const uiDelay = Math.max(0, clickEpoch - Date.now());
        const uiTimeout = window.setTimeout(() => {
          setCurrentBeat(beat + 1);
          setCurrentSubdivision(1);
        }, uiDelay);
        uiTimeoutsRef.current.push(uiTimeout);
        scheduleIndexRef.current += 1;
        nextClickContextTimeRef.current += beatIntervalSeconds;
      }
    };

    scheduler();
    schedulerIntervalRef.current = window.setInterval(scheduler, SCHEDULER_INTERVAL_MS);
    clockIntervalRef.current = window.setInterval(() => {
      if (!runningRef.current) return;
      const elapsed = Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1_000));
      setElapsedSeconds(elapsed);
      if (timerEnabled && elapsed >= durationMinutes * 60) {
        stop();
        setAutomaticCompletionCount((count) => count + 1);
      }
    }, 250);
  }, [accentEnabled, beatsPerMeasure, bpm, countInEnabled, durationMinutes, prepareAudioContext, scheduleClick, stop, timerEnabled]);

  useEffect(() => () => { stop(); }, [stop]);

  return {
    status,
    currentBeat,
    currentSubdivision,
    elapsedSeconds,
    automaticCompletionCount,
    measuredBpm,
    measuredIntervalMs,
    clickJitterMs,
    practiceStartedAtMs,
    start,
    stop,
  };
}
