import type { VoiceCoachFrequency, VoiceCoachVoice } from "../../forgepulse/hooks/useVoiceCoach";

type VoiceCoachSettingsPanelProps = {
  theme: string;
  frequency: VoiceCoachFrequency;
  volume: number;
  duringPlay: boolean;
  endSummary: boolean;
  supported: boolean;
  voices: VoiceCoachVoice[];
  voice: string;
  rate: number;
  pitch: number;
  onFrequencyChange: (value: VoiceCoachFrequency) => void;
  onVolumeChange: (value: number) => void;
  onVoiceChange: (value: string) => void;
  onRateChange: (value: number) => void;
  onPitchChange: (value: number) => void;
  onDuringPlayChange: (value: boolean) => void;
  onEndSummaryChange: (value: boolean) => void;
  onTest: () => void;
};

export function VoiceCoachSettingsPanel({
  theme,
  frequency,
  volume,
  duringPlay,
  endSummary,
  supported,
  voices,
  voice,
  rate,
  pitch,
  onFrequencyChange,
  onVolumeChange,
  onVoiceChange,
  onRateChange,
  onPitchChange,
  onDuringPlayChange,
  onEndSummaryChange,
  onTest,
}: VoiceCoachSettingsPanelProps) {
  const fieldClass = `mt-2 w-full rounded-lg border px-3 py-2 text-sm normal-case tracking-normal ${
    theme === "dark"
      ? "border-zinc-700 bg-zinc-900 text-zinc-100"
      : "border-zinc-300 bg-white text-zinc-900"
  }`;
  const disabled = frequency === "off";

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <label className="block flex-1 text-xs uppercase tracking-wide text-zinc-500">
          Coaching Frequency
          <select
            value={frequency}
            disabled={!supported}
            onChange={(event) => onFrequencyChange(event.target.value as VoiceCoachFrequency)}
            className={fieldClass}
          >
            <option value="off">Off</option>
            <option value="minimal">Minimal</option>
            <option value="standard">Standard</option>
            <option value="frequent">Frequent</option>
          </select>
        </label>
        <button
          type="button"
          onClick={onTest}
          disabled={!supported || disabled}
          className="rounded-lg border border-zinc-600 px-3 py-2 text-sm disabled:opacity-40"
        >
          Test Voice
        </button>
      </div>

      {!supported && <p className="text-xs text-amber-400">A Windows speech voice is not available.</p>}

      {supported && (
        <label className="block text-xs uppercase tracking-wide text-zinc-500">
          Coach Voice
          <select value={voice} onChange={(event) => onVoiceChange(event.target.value)} disabled={disabled} className={fieldClass}>
            {voices.map((item) => (
              <option key={`${item.name}-${item.lang}`} value={item.name}>
                {item.name} · {item.lang}{item.local ? " · Offline" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-xs uppercase tracking-wide text-zinc-500">
        Coach Volume · {Math.round(volume * 100)}%
        <input type="range" min={0.1} max={1} step={0.05} value={volume} onChange={(event) => onVolumeChange(Number(event.target.value))} disabled={disabled} className="mt-2 block w-full accent-orange-500" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs uppercase tracking-wide text-zinc-500">
          Pace · {rate.toFixed(2)}×
          <input type="range" min={0.8} max={1.15} step={0.01} value={rate} onChange={(event) => onRateChange(Number(event.target.value))} disabled={disabled} className="mt-2 block w-full accent-orange-500" />
        </label>
        <label className="block text-xs uppercase tracking-wide text-zinc-500">
          Tone · {pitch.toFixed(2)}
          <input type="range" min={0.8} max={1.2} step={0.01} value={pitch} onChange={(event) => onPitchChange(Number(event.target.value))} disabled={disabled} className="mt-2 block w-full accent-orange-500" />
        </label>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={duringPlay} onChange={(event) => onDuringPlayChange(event.target.checked)} disabled={disabled} /> Feedback while playing</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={endSummary} onChange={(event) => onEndSummaryChange(event.target.checked)} disabled={disabled} /> End-of-exercise summary</label>
      </div>
    </div>
  );
}
