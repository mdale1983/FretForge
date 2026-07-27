import { CheckCircle2, Mic, Square } from "lucide-react";
import { usePitchDetector } from "../../features/forgetune/hooks/usePitchDetector";

type ForgeTuneWorkspaceProps = { theme: string };

export default function ForgeTuneWorkspace({ theme }: ForgeTuneWorkspaceProps) {
  const tuner = usePitchDetector();
  const cents = tuner.pitch?.cents ?? 0;
  const meterPosition = Math.min(100, Math.max(0, cents + 50));
  const isInTune = tuner.pitch !== null && Math.abs(cents) <= 5;

  return (
    <section className={`flex flex-col rounded-2xl border p-4 shadow-lg ${theme === "dark"
      ? "border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-black/20"
      : "border-zinc-300 bg-white text-zinc-900 shadow-zinc-300/40"}`}>
      <div className="order-1 flex justify-end">
        <button type="button" onClick={tuner.isListening ? tuner.stop : tuner.start}
          className={tuner.isListening
            ? "flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-semibold"
            : "flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"}>
          {tuner.isListening ? <><Square size={15} /> Stop Tuner</> : <><Mic size={16} /> Start Tuner</>}
        </button>
      </div>

      {tuner.errorMessage && <p className="order-1 mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">{tuner.errorMessage}</p>}

      <div className="order-2 mt-3 rounded-2xl border border-zinc-700/60 p-5 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{tuner.isListening ? "Listening" : "Ready"}</p>
        <div className="mt-3 min-h-24">
          {tuner.pitch ? <>
            <div className="flex items-start justify-center gap-1">
              <span className="text-7xl font-bold tracking-tight text-orange-400 sm:text-8xl">{tuner.pitch.note}</span>
              <span className="mt-3 text-2xl text-zinc-500">{tuner.pitch.octave}</span>
            </div>
            <p className="mt-1 text-sm tabular-nums text-zinc-500">{tuner.frequency?.toFixed(1)} Hz · target {tuner.pitch.targetFrequency.toFixed(1)} Hz</p>
          </> : <p className="pt-7 text-lg text-zinc-500">{tuner.isListening ? "Play a note…" : "Start the tuner to begin"}</p>}
        </div>

        <div className="mx-auto mt-3 max-w-2xl">
          <div className="flex justify-between text-xs text-zinc-500"><span>♭ Flat</span><span>In Tune</span><span>Sharp ♯</span></div>
          <div className="relative mt-2 h-3 rounded-full bg-zinc-800">
            <div className="absolute left-1/2 top-[-4px] h-5 w-px bg-zinc-500" />
            {tuner.pitch && <div className={`absolute top-1/2 h-5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] ${isInTune ? "bg-emerald-400" : "bg-orange-400"}`} style={{ left: `${meterPosition}%` }} />}
          </div>
          <p className="mt-3 min-h-6 text-sm font-medium">{tuner.pitch && (isInTune
            ? <span className="inline-flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> In tune</span>
            : cents < 0 ? `${Math.abs(cents)} cents flat — tune up` : `${cents} cents sharp — tune down`)}</p>
        </div>

        {tuner.isListening && <div className="mx-auto mt-2 flex max-w-sm items-center gap-3">
          <span className="text-xs text-zinc-600">Input</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-emerald-400 transition-[width]" style={{ width: `${Math.max(2, tuner.inputLevel * 100)}%` }} /></div>
        </div>}
      </div>

      <div className="order-3 mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-700/60 p-3">
        <div className="min-w-48 flex-1">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Audio Engine</p>
          <p className="mt-1 text-sm text-emerald-400">AXE IO ONE · ASIO · 48 kHz</p>
        </div>
        <div className="min-w-56 flex-[2]">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Active Route</p>
          <p className="mt-1 text-sm">{tuner.monitorRoute === "fretforge" ? "FretForge → AXE outputs 1–2" : "AXE hardware/direct"}</p>
        </div>
        <label className="min-w-40 flex-1 text-xs uppercase tracking-wide text-zinc-500">FretForge Return · {Math.round(tuner.monitorVolume * 100)}%
          <input type="range" min={0} max={1} step={0.05} value={tuner.monitorVolume} onChange={(event) => tuner.setMonitorVolume(Number(event.target.value))} disabled={!tuner.monitorEnabled} aria-label="FretForge return level" className="mt-3 w-full accent-orange-500 disabled:opacity-40" />
        </label>
        <button type="button" onClick={tuner.testOutput} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm">Test Output</button>
        {tuner.nativeMonitorError && <p className="w-full text-xs text-red-400" role="alert">{tuner.nativeMonitorError}</p>}
      </div>
    </section>
  );
}
