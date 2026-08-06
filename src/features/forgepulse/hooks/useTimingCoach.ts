import { useEffect, useMemo, useRef, useState } from "react";
import { getFretForgeLinkState } from "../../../services/studioApplicationService";
import type { Subdivision, TimingStrictness, TransportStatus } from "../forgePulseTypes";

const stepsPerBeat: Record<Subdivision, number> = {
  whole: 0.25,
  half: 0.5,
  quarter: 1,
  eighth: 2,
  triplet: 3,
  sixteenth: 4,
};

export type TimingBand = "locked" | "great" | "good" | "on-tempo" | "early" | "late";
type Judgement = TimingBand;
export type { TimingStrictness } from "../forgePulseTypes";
export type TimingTrend = "calibrating" | "locked-in" | "rushing" | "dragging" | "inconsistent" | "on-time" | "insufficient";

export type TimingCoachState = {
  connected: boolean;
  processingActive: boolean;
  sampleRate: number;
  sourceId: string;
  sourceName: string;
  inputLevel: number;
  calibrating: boolean;
  attackCount: number;
  correctCount: number;
  missedCount: number;
  extraCount: number;
  averageErrorMs: number;
  consistencyMs: number;
  latestOffsetMs: number | null;
  latestJudgement: Judgement | null;
  trend: TimingTrend;
  trendSampleCount: number;
  toleranceMs: number;
  linkDelayMs: number;
  timingAdjustmentMs: number;
  scoredCount: number;
  lockedCount: number;
  greatCount: number;
  goodCount: number;
  onTempoCount: number;
  offTempoCount: number;
  medianOffsetMs: number;
  medianAbsoluteErrorMs: number;
  pocket: "ahead" | "centered" | "behind";
  driftMs: number;
  confidence: "low" | "moderate" | "high";
  bandThresholdsMs: { locked: number; great: number; good: number; onTempo: number };
};

const initialState: TimingCoachState = {
  connected: false,
  processingActive: false,
  sampleRate: 0,
  sourceId: "",
  sourceName: "",
  inputLevel: 0,
  calibrating: true,
  attackCount: 0,
  correctCount: 0,
  missedCount: 0,
  extraCount: 0,
  averageErrorMs: 0,
  consistencyMs: 0,
  latestOffsetMs: null,
  latestJudgement: null,
  trend: "insufficient",
  trendSampleCount: 0,
  toleranceMs: 0,
  linkDelayMs: 0,
  timingAdjustmentMs: 0,
  scoredCount: 0,
  lockedCount: 0,
  greatCount: 0,
  goodCount: 0,
  onTempoCount: 0,
  offTempoCount: 0,
  medianOffsetMs: 0,
  medianAbsoluteErrorMs: 0,
  pocket: "centered",
  driftMs: 0,
  confidence: "low",
  bandThresholdsMs: { locked: 0, great: 0, good: 0, onTempo: 0 },
};

const clampWindow = (intervalMs: number, ratio: number, minimum: number, maximum: number) =>
  Math.round(Math.max(minimum, Math.min(maximum, intervalMs * ratio)));

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export function useTimingCoach(status: TransportStatus, bpm: number, subdivision: Subdivision, strictness: TimingStrictness, practiceStartedAtMs: number) {
  const [state, setState] = useState<TimingCoachState>(initialState);
  const startedAtRef = useRef(0);
  const lastSequenceRef = useRef(0);
  const rawOffsetsRef = useRef<number[]>([]);
  const correctedOffsetsRef = useRef<number[]>([]);
  const matchedStepsRef = useRef(new Set<number>());
  const firstMatchedStepRef = useRef<number | null>(null);
  const extrasRef = useRef(0);
  const calibrationOffsetRef = useRef<number | null>(null);

  const intervalMs = useMemo(() => 60_000 / bpm / stepsPerBeat[subdivision], [bpm, subdivision]);
  const bandThresholdsMs = useMemo(() => ({
    locked: clampWindow(intervalMs, 0.05, 15, 30),
    great: clampWindow(intervalMs, 0.10, 25, 60),
    good: clampWindow(intervalMs, 0.15, 35, 90),
    onTempo: clampWindow(intervalMs, 0.20, 50, 120),
  }), [intervalMs]);
  const toleranceMs = strictness === "relaxed"
    ? bandThresholdsMs.onTempo
    : strictness === "balanced"
      ? bandThresholdsMs.good
      : bandThresholdsMs.great;

  useEffect(() => {
    if (status === "playing") {
	  startedAtRef.current = practiceStartedAtMs || Date.now();
      lastSequenceRef.current = 0;
      rawOffsetsRef.current = [];
      correctedOffsetsRef.current = [];
      matchedStepsRef.current = new Set();
	  firstMatchedStepRef.current = null;
      extrasRef.current = 0;
      calibrationOffsetRef.current = null;
	  setState((previous) => ({ ...initialState, connected: previous.connected, processingActive: previous.processingActive, sampleRate: previous.sampleRate, sourceId: previous.sourceId, sourceName: previous.sourceName, inputLevel: previous.inputLevel }));
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
          processingActive: link.processing_active,
          sampleRate: link.sample_rate,
          sourceId: link.instance_id,
          sourceName: link.source_name,
          inputLevel: Math.min(100, Math.round(Math.max(link.input_peak, link.input_rms * 2) * 220)),
		  linkDelayMs: link.transport_delay_ms,
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
        if (matchedStepsRef.current.has(step)) {
          extrasRef.current += 1;
          continue;
        }
        matchedStepsRef.current.add(step);
		if (firstMatchedStepRef.current === null) firstMatchedStepRef.current = step;
		rawOffsetsRef.current.push(rawOffset);

        if (rawOffsetsRef.current.length <= 4) {
          if (rawOffsetsRef.current.length === 4) {
            const samples = [...rawOffsetsRef.current].sort((a, b) => a - b);
			const measuredBaseline = (samples[1] + samples[2]) / 2;
			// Correct plausible hardware/driver latency without treating a player's
			// naturally late reaction to the click as perfect timing.
			calibrationOffsetRef.current = Math.max(-60, Math.min(60, measuredBaseline));
          }
          continue;
        }
        const baseline = calibrationOffsetRef.current ?? 0;
        const corrected = rawOffset - baseline;
        correctedOffsetsRef.current.push(corrected);
        latestOffset = Math.round(corrected);
        const absoluteOffset = Math.abs(corrected);
		latestJudgement = absoluteOffset <= bandThresholdsMs.locked
		  ? "locked"
		  : absoluteOffset <= bandThresholdsMs.great
			? "great"
			: absoluteOffset <= bandThresholdsMs.good
			  ? "good"
			  : absoluteOffset <= bandThresholdsMs.onTempo
				? "on-tempo"
				: corrected < 0 ? "early" : "late";
      }

      const offsets = correctedOffsetsRef.current;
      const recentOffsets = offsets.slice(-8);
      const recentMean = recentOffsets.length ? recentOffsets.reduce((sum, value) => sum + value, 0) / recentOffsets.length : 0;
      const recentDeviation = recentOffsets.length
        ? Math.sqrt(recentOffsets.reduce((sum, value) => sum + (value - recentMean) ** 2, 0) / recentOffsets.length)
        : 0;
      const trend: TimingTrend = rawOffsetsRef.current.length < 4
        ? "calibrating"
        : recentOffsets.length < 6
          ? "insufficient"
		  : recentOffsets.every((offset) => Math.abs(offset) <= bandThresholdsMs.locked)
			? "locked-in"
          : recentDeviation > toleranceMs * 1.4
            ? "inconsistent"
            : recentMean <= -toleranceMs * 1.15
              ? "rushing"
              : recentMean >= toleranceMs * 1.15
                ? "dragging"
                : "on-time";
      const mean = offsets.length ? offsets.reduce((sum, value) => sum + value, 0) / offsets.length : 0;
      const averageError = offsets.length ? offsets.reduce((sum, value) => sum + Math.abs(value), 0) / offsets.length : 0;
      const consistency = offsets.length ? Math.sqrt(offsets.reduce((sum, value) => sum + (value - mean) ** 2, 0) / offsets.length) : 0;
	  // A missing attack is only established once a later attack proves that a
	  // scheduled slot was skipped. Silence after the last attack is not a miss.
	  const highestMatchedStep = matchedStepsRef.current.size
		? Math.max(...matchedStepsRef.current)
		: -1;
	  const firstMatchedStep = firstMatchedStepRef.current;
	  const missedSteps = highestMatchedStep >= 0 && firstMatchedStep !== null
		? Math.max(0, highestMatchedStep - firstMatchedStep + 1 - matchedStepsRef.current.size)
		: 0;
	  const lockedCount = offsets.filter((offset) => Math.abs(offset) <= bandThresholdsMs.locked).length;
	  const greatCount = offsets.filter((offset) => Math.abs(offset) > bandThresholdsMs.locked && Math.abs(offset) <= bandThresholdsMs.great).length;
	  const goodCount = offsets.filter((offset) => Math.abs(offset) > bandThresholdsMs.great && Math.abs(offset) <= bandThresholdsMs.good).length;
	  const onTempoCount = offsets.filter((offset) => Math.abs(offset) > bandThresholdsMs.good && Math.abs(offset) <= bandThresholdsMs.onTempo).length;
	  const offTempoCount = offsets.length - lockedCount - greatCount - goodCount - onTempoCount;
	  const correctCount = lockedCount + greatCount + goodCount + onTempoCount;
	  const medianOffset = median(offsets);
	  const medianAbsoluteError = median(offsets.map(Math.abs));
	  const firstHalf = offsets.slice(0, Math.max(1, Math.floor(offsets.length / 2)));
	  const secondHalf = offsets.slice(Math.max(1, Math.floor(offsets.length / 2)));
	  const halfMean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
	  const driftMs = secondHalf.length ? halfMean(secondHalf) - halfMean(firstHalf) : 0;
	  const pocket = Math.abs(medianOffset) <= bandThresholdsMs.locked ? "centered" : medianOffset < 0 ? "ahead" : "behind";
	  const extraRatio = rawOffsetsRef.current.length ? extrasRef.current / rawOffsetsRef.current.length : 1;
	  const confidence = offsets.length >= 12 && extraRatio <= 0.1 ? "high" : offsets.length >= 6 && extraRatio <= 0.3 ? "moderate" : "low";

      setState((previous) => ({
        connected: link.connected,
        processingActive: link.processing_active,
        sampleRate: link.sample_rate,
        sourceId: link.instance_id,
        sourceName: link.source_name,
        inputLevel: Math.min(100, Math.round(Math.max(link.input_peak, link.input_rms * 2) * 220)),
        calibrating: rawOffsetsRef.current.length < 4,
        attackCount: rawOffsetsRef.current.length,
		correctCount,
		missedCount: missedSteps,
        extraCount: extrasRef.current,
        averageErrorMs: Math.round(averageError),
        consistencyMs: Math.round(consistency),
        latestOffsetMs: latestOffset ?? previous.latestOffsetMs,
        latestJudgement: latestJudgement ?? previous.latestJudgement,
        trend,
        trendSampleCount: recentOffsets.length,
        toleranceMs,
		linkDelayMs: link.transport_delay_ms,
		timingAdjustmentMs: Math.round(calibrationOffsetRef.current ?? 0),
		scoredCount: offsets.length,
		lockedCount,
		greatCount,
		goodCount,
		onTempoCount,
		offTempoCount,
		medianOffsetMs: Math.round(medianOffset),
		medianAbsoluteErrorMs: Math.round(medianAbsoluteError),
		pocket,
		driftMs: Math.round(driftMs),
		confidence,
		bandThresholdsMs,
      }));
    };

    poll();
    const timer = window.setInterval(poll, 25);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [bandThresholdsMs, intervalMs, practiceStartedAtMs, status, toleranceMs]);

  return state;
}
