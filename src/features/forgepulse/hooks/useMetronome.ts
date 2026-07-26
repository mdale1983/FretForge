import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Subdivision,
  TimeSignature,
  TransportStatus,
} from "../forgePulseTypes";

const subdivisionMultiplier: Record<Subdivision, number> = {
  whole: 0.25,
  half: 0.5,
  quarter: 1,
  eighth: 2,
  triplet: 3,
  sixteenth: 4,
};

type UseMetronomeOptions = {
  bpm: number;
  subdivision: Subdivision;
  timeSignature: TimeSignature;
  accentEnabled: boolean;
  countInEnabled: boolean;
  timerEnabled: boolean;
  durationMinutes: number;
};

export function useMetronome({
  bpm,
  subdivision,
  timeSignature,
  accentEnabled,
  countInEnabled,
  timerEnabled,
  durationMinutes,
}: UseMetronomeOptions) {
  const [status, setStatus] = useState<TransportStatus>("idle");
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentSubdivision, setCurrentSubdivision] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [automaticCompletionCount, setAutomaticCompletionCount] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const clockIntervalRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const elapsedSecondsRef = useRef(0);
  const runningRef = useRef(false);
  const stepRef = useRef(0);

  const beatsPerMeasure = Number(timeSignature.split("/")[0]);
  const stepsPerBeat = subdivisionMultiplier[subdivision];

  const playClick = useCallback((accent: boolean) => {
    const AudioContextClass =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const context =
      audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.frequency.value = accent ? 1_320 : 880;
    gain.gain.setValueAtTime(accent ? 0.3 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }, []);

  const stop = useCallback(() => {
    const finalElapsedSeconds = runningRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1_000)
      : 0;

    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    if (clockIntervalRef.current !== null) {
      window.clearInterval(clockIntervalRef.current);
      clockIntervalRef.current = null;
    }

    stepRef.current = 0;
    runningRef.current = false;
    elapsedSecondsRef.current = finalElapsedSeconds;
    setElapsedSeconds(finalElapsedSeconds);
    setStatus("idle");
    setCurrentBeat(0);
    setCurrentSubdivision(0);
    return finalElapsedSeconds;
  }, []);

  const start = useCallback(async () => {
    stop();
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;

    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    const subdivisionInterval = 60_000 / bpm / stepsPerBeat;
    const countInBeats = countInEnabled ? beatsPerMeasure : 0;
    let countInStep = 0;

    const beginPractice = () => {
      setStatus("playing");
      startedAtRef.current = Date.now();
      runningRef.current = true;

      const tick = () => {
        const step = stepRef.current;
        const beat = Math.floor(step / stepsPerBeat) % beatsPerMeasure;
        const subdivisionStep = Math.floor(step % stepsPerBeat);
        const isDownbeat = beat === 0 && subdivisionStep === 0;

        playClick(accentEnabled && isDownbeat);
        setCurrentBeat(beat + 1);
        setCurrentSubdivision(subdivisionStep + 1);
        stepRef.current += 1;
        clickTimeoutRef.current = window.setTimeout(tick, subdivisionInterval);
      };

      tick();
      clockIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1_000);
        elapsedSecondsRef.current = elapsed;
        setElapsedSeconds(elapsed);

        if (timerEnabled && elapsed >= durationMinutes * 60) {
          stop();
          setAutomaticCompletionCount((count) => count + 1);
        }
      }, 250);
    };

    if (countInBeats > 0) {
      setStatus("counting-in");

      const countInTick = () => {
        playClick(countInStep === 0);
        setCurrentBeat(countInStep + 1);
        countInStep += 1;

        if (countInStep < countInBeats) {
          clickTimeoutRef.current = window.setTimeout(countInTick, 60_000 / bpm);
        } else {
          clickTimeoutRef.current = window.setTimeout(beginPractice, 60_000 / bpm);
        }
      };

      countInTick();
    } else {
      beginPractice();
    }
  }, [
    accentEnabled,
    beatsPerMeasure,
    bpm,
    countInEnabled,
    durationMinutes,
    playClick,
    stepsPerBeat,
    stop,
    timerEnabled,
  ]);

  useEffect(
    () => () => {
      stop();
    },
    [stop]
  );

  return {
    status,
    currentBeat,
    currentSubdivision,
    elapsedSeconds,
    automaticCompletionCount,
    start,
    stop,
  };
}
