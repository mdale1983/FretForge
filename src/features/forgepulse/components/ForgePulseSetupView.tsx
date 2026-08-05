import { useState } from "react";
import { subdivisionInstructions, subdivisionLabels } from "../forgePulseConstants";
import { VoiceCoachSettingsPanel } from "../../voice-coach/components/VoiceCoachSettingsPanel";
import { ForgePulseCard } from "./ForgePulseCard";
import type { ForgePulseMode, Subdivision, TimeSignature } from "../forgePulseTypes";
import type { VoiceCoachFrequency, VoiceCoachVoice } from "../hooks/useVoiceCoach";
import type { TimingStrictness } from "../hooks/useTimingCoach";

type ForgePulseSetupViewProps = {
  theme: string; mode: ForgePulseMode; bpm: number; subdivision: Subdivision; timeSignature: TimeSignature;
  modeTitle: string; modeDifficulty: string; modeObjective: string; modeDescription: string; sessionTitle: string;
  countInEnabled: boolean; timerEnabled: boolean; durationMinutes: number; volume: number; accentEnabled: boolean;
  voiceCoachFrequency: VoiceCoachFrequency; voiceCoachVolume: number; voiceDuringPlay: boolean; voiceEndSummary: boolean;
  voiceCoachSupported: boolean; voiceCoachVoices: VoiceCoachVoice[]; voiceCoachVoice: string; voiceCoachRate: number; voiceCoachPitch: number;
  timingStrictness: TimingStrictness;
  onModeChange: (value: ForgePulseMode) => void; onBpmChange: (value: number) => void;
  onSubdivisionChange: (value: Subdivision) => void; onTimeSignatureChange: (value: TimeSignature) => void;
  onCountInChange: (value: boolean) => void; onTimerChange: (value: boolean) => void; onDurationChange: (value: number) => void;
  onVolumeChange: (value: number) => void; onAccentChange: (value: boolean) => void;
  onVoiceCoachFrequencyChange: (value: VoiceCoachFrequency) => void; onVoiceCoachVolumeChange: (value: number) => void;
  onVoiceCoachVoiceChange: (value: string) => void; onVoiceCoachRateChange: (value: number) => void; onVoiceCoachPitchChange: (value: number) => void;
  onVoiceDuringPlayChange: (value: boolean) => void; onVoiceEndSummaryChange: (value: boolean) => void; onTestVoice: () => void;
  onTimingStrictnessChange: (value: TimingStrictness) => void; onStartSession: () => void;
};

export function ForgePulseSetupView(props: ForgePulseSetupViewProps) {
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const { theme } = props;
  const fieldClass = `mt-2 w-full rounded-lg border px-3 py-2 text-sm ${theme === "dark" ? "border-zinc-700 bg-zinc-900 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`;
  const coachLabel = props.voiceCoachFrequency === "off" ? "Off" : `${props.voiceCoachFrequency[0].toUpperCase()}${props.voiceCoachFrequency.slice(1)}`;

  return (
    <>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ForgePulseCard theme={theme} title="Quick Setup">
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs uppercase tracking-wide text-zinc-500">Mode
              <select className={fieldClass} value={props.mode} onChange={(event) => props.onModeChange(event.target.value as ForgePulseMode)}>
                <option value="learn">Learn</option><option value="practice">Practice</option><option value="follow">Follow</option><option value="master">Master</option>
              </select>
            </label>
            <label className="text-xs uppercase tracking-wide text-zinc-500">BPM
              <input className={fieldClass} type="number" min={40} max={240} value={props.bpm} onChange={(event) => props.onBpmChange(Number(event.target.value))} />
            </label>
            <label className="text-xs uppercase tracking-wide text-zinc-500">Subdivision
              <select className={fieldClass} value={props.subdivision} onChange={(event) => props.onSubdivisionChange(event.target.value as Subdivision)}>
                <option value="whole">Whole Notes</option><option value="half">Half Notes</option><option value="quarter">Quarter Notes</option><option value="eighth">Eighth Notes</option><option value="triplet">Eighth-Note Triplets</option><option value="sixteenth">Sixteenth Notes</option>
              </select>
            </label>
            <label className="text-xs uppercase tracking-wide text-zinc-500">Time Signature
              <select className={fieldClass} value={props.timeSignature} onChange={(event) => props.onTimeSignatureChange(event.target.value as TimeSignature)}>
                <option value="2/4">2/4</option><option value="3/4">3/4</option><option value="4/4">4/4</option><option value="5/4">5/4</option><option value="6/8">6/8</option><option value="7/8">7/8</option>
              </select>
            </label>
          </div>
        </ForgePulseCard>

        <ForgePulseCard theme={theme} title="Metronome Setup">
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={props.countInEnabled} onChange={(event) => props.onCountInChange(event.target.checked)} className="h-4 w-4" />Count-In</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={props.timerEnabled} onChange={(event) => props.onTimerChange(event.target.checked)} className="h-4 w-4" />Practice Timer</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={props.accentEnabled} onChange={(event) => props.onAccentChange(event.target.checked)} className="h-4 w-4" />Accent Beat</label>
          </div>
          {props.timerEnabled && <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">Session Length
            <select className={`${fieldClass} normal-case tracking-normal`} value={props.durationMinutes} onChange={(event) => props.onDurationChange(Number(event.target.value))}>
              <option value={1}>1 minute</option><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option>
            </select>
          </label>}
          <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">Click Volume · {Math.round(props.volume * 100)}%
            <input type="range" min={0.1} max={1} step={0.05} value={props.volume} onChange={(event) => props.onVolumeChange(Number(event.target.value))} className="mt-2 block w-full accent-orange-500" />
            <span className="mt-1 block normal-case tracking-normal text-zinc-500">Balance the click against your guitar. Use your interface for final listening volume.</span>
          </label>
        </ForgePulseCard>

        <div className="lg:col-span-2">
          <ForgePulseCard theme={theme} title="Timing Strictness">
            <div className="mt-3 grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <select value={props.timingStrictness} onChange={(event) => props.onTimingStrictnessChange(event.target.value as TimingStrictness)} className={`${fieldClass} mt-0`}>
                  <option value="relaxed">Learning — hear and respond</option><option value="balanced">Balanced — anticipate the pulse</option><option value="tight">Precision — lock to the pulse</option>
                </select>
                <p className="mt-2 text-xs text-zinc-500">{props.timingStrictness === "relaxed" ? "A wider timing window while you learn the rhythm and build anticipation." : props.timingStrictness === "balanced" ? "A musical timing window that rewards landing around the click." : "A narrow window for advanced timing precision."}</p>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-700/60 px-3 py-2 md:min-w-64">
                <div><p className="text-xs uppercase tracking-wide text-zinc-500">Voice Coach</p><p className="mt-1 text-sm font-medium">{coachLabel}</p></div>
                <button type="button" onClick={() => setShowVoiceSettings(true)} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm">Manage</button>
              </div>
            </div>
          </ForgePulseCard>
        </div>

        <div className="lg:col-span-2">
          <ForgePulseCard theme={theme} title="Current Session">
            <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <div><h3 className="text-sm font-semibold">{props.modeTitle}</h3><p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">Difficulty</p><p className="mt-1 text-sm">{props.modeDifficulty}</p><p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">Goal</p><p className="mt-1 text-sm">{props.modeObjective}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-zinc-500">Session</p><h4 className="mt-1 text-sm font-semibold">{props.sessionTitle}</h4><p className="mt-2 text-sm leading-relaxed">{props.modeDescription}</p><p className="mt-2 text-sm text-zinc-500">{props.bpm} BPM · {subdivisionLabels[props.subdivision]} · {props.timeSignature}</p><div className="mt-3 rounded-lg border border-orange-500/30 bg-orange-500/5 p-3"><p className="text-xs uppercase tracking-wide text-orange-400">How to play it</p><p className="mt-2 text-sm leading-relaxed">{subdivisionInstructions[props.subdivision]}</p></div></div>
            </div>
            <div className="mt-4 flex justify-end border-t border-zinc-700/60 pt-4"><button type="button" onClick={props.onStartSession} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">Set Up Session</button></div>
          </ForgePulseCard>
        </div>
      </div>

      {showVoiceSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Voice Coach settings" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowVoiceSettings(false); }}>
          <div className={`max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-xl border p-5 shadow-2xl ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`}>
            <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-orange-400">Voice Coach Settings</h2><p className="mt-1 text-sm text-zinc-500">Shared coaching preferences for compatible FretForge tools.</p></div><button type="button" onClick={() => setShowVoiceSettings(false)} className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm">Close</button></div>
            <VoiceCoachSettingsPanel theme={theme} frequency={props.voiceCoachFrequency} volume={props.voiceCoachVolume} duringPlay={props.voiceDuringPlay} endSummary={props.voiceEndSummary} supported={props.voiceCoachSupported} voices={props.voiceCoachVoices} voice={props.voiceCoachVoice} rate={props.voiceCoachRate} pitch={props.voiceCoachPitch} onFrequencyChange={props.onVoiceCoachFrequencyChange} onVolumeChange={props.onVoiceCoachVolumeChange} onVoiceChange={props.onVoiceCoachVoiceChange} onRateChange={props.onVoiceCoachRateChange} onPitchChange={props.onVoiceCoachPitchChange} onDuringPlayChange={props.onVoiceDuringPlayChange} onEndSummaryChange={props.onVoiceEndSummaryChange} onTest={props.onTestVoice} />
          </div>
        </div>
      )}
    </>
  );
}
