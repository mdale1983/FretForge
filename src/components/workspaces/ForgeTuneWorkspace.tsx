import { CheckCircle2, Mic, Square } from "lucide-react";
import { usePitchDetector } from "../../features/forgetune/hooks/usePitchDetector";

type ForgeTuneWorkspaceProps = {
  theme: string;
};

export default function ForgeTuneWorkspace({ theme }: ForgeTuneWorkspaceProps) {
  const tuner = usePitchDetector();
  const cents = tuner.pitch?.cents ?? 0;
  const meterPosition = Math.min(100, Math.max(0, cents + 50));
  const isInTune = tuner.pitch !== null && Math.abs(cents) <= 5;

  return (
    <section
      className={`rounded-2xl border p-5 shadow-lg sm:p-6 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-black/20"
          : "border-zinc-300 bg-white text-zinc-900 shadow-zinc-300/40"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-orange-400">
            ForgeTune
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Play one clear note at a time. FretForge analyzes microphone audio
            locally and does not record or upload it.
          </p>
        </div>

        {tuner.isListening ? (
          <button
            type="button"
            onClick={tuner.stop}
            className="flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-semibold"
          >
            <Square size={15} /> Stop Tuner
          </button>
        ) : (
          <button
            type="button"
            onClick={tuner.start}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
          >
            <Mic size={16} /> Start Tuner
          </button>
        )}
      </div>

      {tuner.errorMessage && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
          {tuner.errorMessage}
        </p>
      )}

      <div className="mt-5 grid gap-4 rounded-xl border border-zinc-700/60 p-4 lg:grid-cols-2">
        <label className="text-xs uppercase tracking-wide text-zinc-500">
          Recording Input
          <select
            value={tuner.selectedInputId}
            onChange={(event) => tuner.setSelectedInputId(event.target.value)}
            disabled={tuner.isListening}
            className={`mt-2 block w-full rounded-lg border px-3 py-2 text-sm normal-case disabled:opacity-60 ${
              theme === "dark"
                ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-900"
            }`}
          >
            <option value="">System default input</option>
            {tuner.inputDevices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Audio input ${index + 1}`}
              </option>
            ))}
          </select>
          <span className="mt-2 block normal-case tracking-normal text-zinc-600">
            {tuner.activeInputLabel
              ? `Active: ${tuner.activeInputLabel}`
              : "Device names may appear after microphone permission is granted."}
          </span>
        </label>

        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={tuner.monitorEnabled}
              onChange={(event) => tuner.setMonitorEnabled(event.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            Monitor guitar through FretForge
          </label>
          <input
            type="range"
            min={0.05}
            max={0.75}
            step={0.05}
            value={tuner.monitorVolume}
            onChange={(event) => tuner.setMonitorVolume(Number(event.target.value))}
            disabled={!tuner.monitorEnabled}
            aria-label="Monitor volume"
            className="mt-3 w-full accent-orange-500 disabled:opacity-40"
          />
          <p className="mt-2 text-xs text-amber-400">
            Use headphones before enabling monitoring to prevent feedback.
          </p>
          {tuner.isListening && tuner.monitorEnabled && (
            <p className="mt-2 text-xs text-zinc-500">
              {tuner.isPreferredOutputRouted
                ? "Monitoring routed to the top selected device."
                : "Explicit output routing is unavailable; using the Windows default output."}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-700/60 p-6 text-center sm:p-10">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
          {tuner.isListening ? "Listening" : "Microphone Off"}
        </p>

        <div className="mt-5 min-h-28">
          {tuner.pitch ? (
            <>
              <div className="flex items-start justify-center gap-1">
                <span className="text-7xl font-bold tracking-tight text-orange-400 sm:text-8xl">
                  {tuner.pitch.note}
                </span>
                <span className="mt-3 text-2xl text-zinc-500">
                  {tuner.pitch.octave}
                </span>
              </div>
              <p className="mt-2 text-sm tabular-nums text-zinc-500">
                {tuner.frequency?.toFixed(1)} Hz · target {tuner.pitch.targetFrequency.toFixed(1)} Hz
              </p>
            </>
          ) : (
            <p className="pt-8 text-lg text-zinc-500">
              {tuner.isListening ? "Play a note…" : "Start the tuner to begin"}
            </p>
          )}
        </div>

        <div className="mx-auto mt-6 max-w-2xl">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>♭ Flat</span>
            <span>In Tune</span>
            <span>Sharp ♯</span>
          </div>
          <div className="relative mt-2 h-3 rounded-full bg-zinc-800">
            <div className="absolute left-1/2 top-[-4px] h-5 w-px bg-zinc-500" />
            {tuner.pitch && (
              <div
                className={`absolute top-1/2 h-5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] ${
                  isInTune ? "bg-emerald-400" : "bg-orange-400"
                }`}
                style={{ left: `${meterPosition}%` }}
              />
            )}
          </div>
          <p className="mt-4 min-h-6 text-sm font-medium">
            {tuner.pitch &&
              (isInTune ? (
                <span className="inline-flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={16} /> In tune
                </span>
              ) : cents < 0 ? (
                `${Math.abs(cents)} cents flat — tune up`
              ) : (
                `${cents} cents sharp — tune down`
              ))}
          </p>
        </div>

        {tuner.isListening && (
          <div className="mt-5">
            <div className="mx-auto flex max-w-sm items-center gap-3">
              <span className="text-xs text-zinc-600">Input</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-[width]"
                  style={{ width: `${Math.max(2, tuner.inputLevel * 100)}%` }}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              Signal confidence: {Math.round(tuner.clarity * 100)}%
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
