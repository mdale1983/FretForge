import { useEffect, useMemo, useRef, useState } from "react";
import { getFretForgeLinkState } from "../../../services/studioApplicationService";
import type { Subdivision, TransportStatus } from "../forgePulseTypes";

const stepsPerBeat: Record<Subdivision, number> = {
  whole: 0.25,
  half: 0.5,
  quarter: 1,
  eighth: 2,
  triplet: 3,
  sixteenth: 4,
};

type Judgement = "early" | "late" | "in-time";

export type TimingCoachState = {
  connected: boolean;
  sourceName: string;
  inputLevel: number;
  calibrating: boolean;
  attackCount: number;
  missedCount: number;
  extraCount: number;
  averageErrorMs: number;
  consistencyMs: number;
  latestOffsetMs: number | null;
  latestJudgement: Judgement | null;
};

const initialState: TimingCoachState = {
  connected: false,
  sourceName: "",
  inputLevel: 0,
  calibrating: true,
  attackCount: 0,
  missedCount: 0,
  extraCount: 0,
  averageErrorMs: 0,
  consistencyMs: 0,
  latestOffsetMs: null,
  latestJudgement: null,
};

export function useTimingCoach(status: TransportStatus, bpm: number, subdivision: Subdivision) {
  const [state, setState] = useState<TimingCoachState>(initialState);
  const startedAtRef = useRef(0);
  const lastSequenceRef = useRef(0);
  const rawOffsetsRef = useRef<number[]>([]);
  const correctedOffsetsRef = useRef<number[]>([]);
  const matchedStepsRef = useRef(new Set<number>());
  const extrasRef = useRef(0);

  const intervalMs = useMemo(() => 60_000 / bpm / stepsPerBeat[subdivision], [bpm, subdivision]);

  useEffect(() => {
    if (status === "playing") {
      startedAtRef.current = Date.now();
      lastSequenceRef.current = 0;
      rawOffsetsRef.current = [];
      correctedOffsetsRef.current = [];
      matchedStepsRef.current = new Set();
      extrasRef.current = 0;
      setState((previous) => ({ ...initialState, connected: previous.connected, sourceName: previous.sourceName, inputLevel: previous.inputLevel }));
    } else {
      startedAtRef.current = 0;
    }
    let cancelled = false;

    const poll = async () => {
      const selectedId = localStorage.getItem("fretforge.selectedLinkSource") ?? undefined;
      const link = await getFretForgeLinkState(selectedId).catch(() => null);
      if (cancelled || !link) return;
      if (link.connected && link.instance_id && link.instance_id !== selectedId) {
        localStorage.setItem("fretforge.selectedLinkSource", link.instance_id);
      }

      if (status !== "playing") {
        setState((previous) => ({
          ...previous,
          connected: link.connected,
          sourceName: link.source_name,
          inputLevel: Math.min(100, Math.round(Math.max(link.input_peak, link.input_rms * 2) * 220)),
        }));
        return;
      }

      let latestOffset: number | null = null;
      let latestJudgement: Judgement | null = null;
      for (const attack of link.attacks ?? []) {
        if (attack.sequence <= lastSequenceRef.current || attack.timestamp_ms < startedAtRef.current) continue;
        lastSequenceRef.current = attack.sequence;
        const step = Math.max(0, Math.round((attack.timestamp_ms - startedAtRef.current) / intervalMs));
        const rawOffset = attack.timestamp_ms - (startedAtRef.current + step * intervalMs);
        rawOffsetsRef.current.push(rawOffset);
        if (matchedStepsRef.current.has(step)) {
          extrasRef.current += 1;
          continue;
        }
        matchedStepsRef.current.add(step);

        const calibrationSamples = rawOffsetsRef.current.slice(0, 4).sort((a, b) => a - b);
        const baseline = calibrationSamples[Math.floor(calibrationSamples.length / 2)] ?? 0;
        const corrected = rawOffset - baseline;
        correctedOffsetsRef.current.push(corrected);
        latestOffset = Math.round(corrected);
        latestJudgement = Math.abs(corrected) <= 35 ? "in-time" : corrected < 0 ? "early" : "late";
      }

      const offsets = correctedOffsetsRef.current;
      const mean = offsets.length ? offsets.reduce((sum, value) => sum + value, 0) / offsets.length : 0;
      const averageError = offsets.length ? offsets.reduce((sum, value) => sum + Math.abs(value), 0) / offsets.length : 0;
      const consistency = offsets.length ? Math.sqrt(offsets.reduce((sum, value) => sum + (value - mean) ** 2, 0) / offsets.length) : 0;
      const completedSteps = Math.max(0, Math.floor((Date.now() - startedAtRef.current) / intervalMs));

      setState((previous) => ({
        connected: link.connected,
        sourceName: link.source_name,
        inputLevel: Math.min(100, Math.round(Math.max(link.input_peak, link.input_rms * 2) * 220)),
        calibrating: rawOffsetsRef.current.length < 4,
        attackCount: rawOffsetsRef.current.length,
        missedCount: Math.max(0, completedSteps - matchedStepsRef.current.size),
        extraCount: extrasRef.current,
        averageErrorMs: Math.round(averageError),
        consistencyMs: Math.round(consistency),
        latestOffsetMs: latestOffset ?? previous.latestOffsetMs,
        latestJudgement: latestJudgement ?? previous.latestJudgement,
      }));
    };

    poll();
    const timer = window.setInterval(poll, 35);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [intervalMs, status]);

  return state;
}
