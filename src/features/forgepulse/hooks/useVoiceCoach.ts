import { useCallback, useEffect, useRef, useState } from "react";
import type { TransportStatus } from "../forgePulseTypes";
import type { TimingCoachState, TimingTrend } from "./useTimingCoach";
import { listVoiceCoachVoices, synthesizeVoiceCoachAudio } from "../voiceCoachAudioService";
import { getForgePulseAudioContext } from "../forgePulseAudioEngine";

export type VoiceCoachFrequency = "off" | "minimal" | "standard" | "frequent";

type VoiceCoachOptions = {
  frequency: VoiceCoachFrequency;
  volume: number;
  feedbackDuringPlaying: boolean;
  endSummary: boolean;
  status: TransportStatus;
  timing: TimingCoachState;
	voiceName: string;
	rate: number;
	pitch: number;
};

export type VoiceCoachVoice = { name: string; lang: string; local: boolean };

const cooldowns: Record<Exclude<VoiceCoachFrequency, "off">, number> = {
  minimal: 15_000,
  standard: 10_000,
  frequent: 6_000,
};

const trendMessages: Partial<Record<TimingTrend, string[]>> = {
	"locked-in": ["That's it. Stay right there.", "Locked in. Keep it there.", "Nice. That's the pocket."],
	rushing: ["Easy. You're getting ahead.", "Pull back just a touch.", "Let the beat come to you."],
	dragging: ["Lean forward a touch.", "You're sitting a little behind.", "Stay with it. Nudge forward."],
	inconsistent: ["Settle in. Keep the attacks even.", "Find the pulse, then stay with it.", "Smooth it out. Keep the spacing even."],
	"on-time": ["Good. Hold that pocket.", "Nice. Keep that feel.", "You're on it. Stay there."],
};

function chooseCoachMessage(messages: string[], previousMessage: string) {
	const choices = messages.filter((message) => message !== previousMessage);
	return choices[Math.floor(Math.random() * choices.length)] ?? messages[0] ?? "";
}

export function useVoiceCoach({
  frequency,
  volume,
  feedbackDuringPlaying,
  endSummary,
  status,
  timing,
	voiceName,
	rate,
	pitch,
}: VoiceCoachOptions) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [lastMessage, setLastMessage] = useState("");
  const [speaking, setSpeaking] = useState(false);
	const [outputError, setOutputError] = useState("");
	const [voices, setVoices] = useState<VoiceCoachVoice[]>([]);
  const lastSpokenAtRef = useRef(0);
  const lastTrendRef = useRef<TimingTrend>("insufficient");
  const previousStatusRef = useRef<TransportStatus>(status);
  const hadProblemRef = useRef(false);
	const runStartedAtRef = useRef(0);
	const voiceSourceRef = useRef<AudioBufferSourceNode | null>(null);

	useEffect(() => {
	  if (!supported) return;
	  let cancelled = false;
	  void listVoiceCoachVoices()
		.then((installedVoices) => { if (!cancelled) setVoices(installedVoices); })
		.catch((error) => console.warn("Could not list routed Voice Coach voices:", error));
	  return () => { cancelled = true; };
	}, [supported]);

	const preferredVoice = voices.find((voice) => voice.name === voiceName) ?? [...voices].sort((left, right) => {
	  const score = (voice: VoiceCoachVoice) => {
		const name = voice.name.toLowerCase();
		return (voice.lang.toLowerCase().startsWith("en-us") ? 20 : voice.lang.toLowerCase().startsWith("en") ? 10 : 0)
		  + (name.includes("natural") ? 100 : 0)
		  + (["aria", "jenny", "guy", "andrew", "ava", "brian", "emma"].some((candidate) => name.includes(candidate)) ? 60 : 0);
	  };
	  return score(right) - score(left);
	})[0];

	const speak = useCallback((message: string) => {
	if (!supported || frequency === "off" || !message || speaking) return;
	const playRoutedSpeech = async () => {
	  try {
		setOutputError("");
		const blob = await synthesizeVoiceCoachAudio(message, preferredVoice?.name ?? voiceName, rate, pitch, volume);
		const context = await getForgePulseAudioContext(true);
		const buffer = await context.decodeAudioData(await blob.arrayBuffer());
		const source = context.createBufferSource();
		source.buffer = buffer;
		source.connect(context.destination);
		voiceSourceRef.current = source;
		source.onended = () => {
		  setSpeaking(false);
		  if (voiceSourceRef.current === source) voiceSourceRef.current = null;
		};
		setLastMessage(message);
		lastSpokenAtRef.current = Date.now();
		setSpeaking(true);
		source.start();
		return;
	  } catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.warn("Routed Voice Coach playback failed:", error);
		setSpeaking(false);
		setOutputError(message);
	  }
	};
	void playRoutedSpeech();
	}, [frequency, pitch, preferredVoice, rate, speaking, supported, voiceName, volume]);

  useEffect(() => {
	if (status !== "playing" || !feedbackDuringPlaying || frequency === "off" || timing.trendSampleCount < 6) return;
	if (Date.now() - runStartedAtRef.current < 3_000 || timing.attackCount < 6) return;
    const trend = timing.trend;
    if (!(trend in trendMessages)) return;
	if ((trend === "on-time" || trend === "locked-in") && frequency === "minimal") return;
	if ((trend === "on-time" || trend === "locked-in") && !hadProblemRef.current && frequency !== "frequent") return;

    const cooldown = cooldowns[frequency];
    if (Date.now() - lastSpokenAtRef.current < cooldown) return;
    if (trend === lastTrendRef.current && frequency !== "frequent") return;

    if (trend === "rushing" || trend === "dragging" || trend === "inconsistent") hadProblemRef.current = true;
	if (trend === "on-time" || trend === "locked-in") hadProblemRef.current = false;
    lastTrendRef.current = trend;
	const messages = trendMessages[trend] ?? [];
    speak(chooseCoachMessage(messages, lastMessage));
  }, [feedbackDuringPlaying, frequency, lastMessage, speak, status, timing.attackCount, timing.trend, timing.trendSampleCount]);

  useEffect(() => {
    const previous = previousStatusRef.current;
    previousStatusRef.current = status;
    if (status === "playing" && previous !== "playing") {
      lastTrendRef.current = "insufficient";
      hadProblemRef.current = false;
	  runStartedAtRef.current = Date.now();
	  lastSpokenAtRef.current = Date.now();
	  setLastMessage("");
	  try { voiceSourceRef.current?.stop(); } catch { /* already stopped */ }
	  voiceSourceRef.current = null;
	  if (supported) window.speechSynthesis.cancel();
      return;
    }
	if (previous !== "playing" || status !== "idle" || !endSummary || frequency === "off" || timing.trendSampleCount < 6 || timing.attackCount < 6) return;
	const onTempoPercent = timing.scoredCount ? Math.round(timing.correctCount / timing.scoredCount * 100) : 0;
	const placement = timing.pocket === "centered" ? "centered on the beat" : `${timing.pocket} of the beat`;
	const summary = timing.confidence === "low"
	  ? "Session complete. There was not enough reliable attack data for a confident timing result."
	  : timing.trend === "locked-in"
		? "Nice work. You finished the run locked in."
		: timing.trend === "on-time"
		  ? onTempoPercent >= 80
			? `Nice work. Most of your attacks stayed on tempo, with your pocket ${placement}.`
			: `Good run. Your pocket was ${placement}. Check the timing report for the full breakdown.`
      : timing.trend === "rushing"
		? "Good run. You tended to rush near the end. Ease back and try it once more."
        : timing.trend === "dragging"
		  ? "Good run. You tended to fall behind near the end. Lean into the pulse next time."
		  : "Good effort. The timing moved around a bit. Focus on keeping the attacks evenly spaced.";
    speak(summary);
	}, [endSummary, frequency, speak, status, supported, timing.attackCount, timing.confidence, timing.correctCount, timing.pocket, timing.scoredCount, timing.trend, timing.trendSampleCount]);

  useEffect(() => () => {
	try { voiceSourceRef.current?.stop(); } catch { /* already stopped */ }
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

	return {
	  supported,
	  speaking,
	  outputError,
	  lastMessage,
	  speak,
	  activeVoiceName: preferredVoice?.name ?? "",
	  voices,
	};
}
