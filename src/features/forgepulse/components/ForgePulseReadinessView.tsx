type ForgePulseReadinessViewProps = {
  theme: string;
  exerciseName: string;
  exerciseInstructions: string;
  bpm: number;
  dawName: string;
  dawInstalled: boolean;
  dawRunning: boolean;
  isLaunchingDaw: boolean;
  dawLaunchError: string;
  linkConnected: boolean;
  processingActive: boolean;
  sourceName: string;
  inputLevel: number;
  signalVerified: boolean;
  guitarVolume: number;
  onGuitarVolumeChange: (value: number) => void;
  onLaunchDaw: () => void;
  onBack: () => void;
  onStart: () => void;
};

export function ForgePulseReadinessView({
  theme, exerciseName, exerciseInstructions, bpm, dawName, dawInstalled, dawRunning, isLaunchingDaw, dawLaunchError,
  linkConnected, processingActive, sourceName, inputLevel, signalVerified, guitarVolume,
  onGuitarVolumeChange, onLaunchDaw, onBack, onStart,
}: ForgePulseReadinessViewProps) {
  const linkReady = linkConnected && processingActive;
  const ready = dawRunning && linkReady && signalVerified;
  const statusClass = (complete: boolean) => complete ? "text-emerald-400" : "text-amber-300";
  return (
    <div className={`mt-5 rounded-xl border p-5 ${theme === "dark" ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-zinc-50"}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-orange-400">Audio check</p>
      <h3 className="mt-2 text-xl font-semibold">Get your rig ready</h3>
      <p className="mt-2 text-sm text-zinc-400">FretForge will unlock the session after it verifies the DAW, FretForge Link, and a live guitar signal.</p>

      <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4"><p className="text-xs uppercase tracking-wide text-orange-400">Up next</p><p className="mt-1 font-semibold">{exerciseName} · {bpm} BPM</p><p className="mt-2 text-sm text-zinc-400">{exerciseInstructions}</p></div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <CheckCard label="DAW" value={dawRunning ? `${dawName} is running` : `${dawName} is closed`} complete={dawRunning} />
        <CheckCard label="FretForge Link" value={!linkConnected ? "Waiting for connection" : processingActive ? `Processing ${sourceName || "guitar bus"}` : "Connected, but the DAW is not processing audio"} complete={linkReady} />
        <CheckCard label="Guitar Signal" value={signalVerified ? "Signal verified" : "Play a few clear notes"} complete={signalVerified} />
      </div>

      {!dawRunning && (
        <button type="button" onClick={onLaunchDaw} disabled={!dawInstalled || isLaunchingDaw} className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {isLaunchingDaw ? `Launching ${dawName}…` : `Launch ${dawName}`}
        </button>
      )}
      {!dawInstalled && <p className="mt-2 text-sm text-amber-300">Install or select a DAW in Studio Path first.</p>}
      {dawLaunchError && <p className="mt-2 text-sm text-red-400">{dawLaunchError}</p>}

      <div className="mt-5 rounded-xl border border-zinc-700/60 p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Guitar input</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-emerald-400 transition-[width]" style={{ width: `${inputLevel}%` }} /></div>
          <span className="w-10 text-right text-xs tabular-nums text-zinc-500">{inputLevel}%</span>
        </div>
        <label className="mt-4 block text-xs uppercase tracking-wide text-zinc-500">Monitor level · {Math.round(guitarVolume * 100)}%
          <input type="range" min={0} max={1.5} step={0.05} value={guitarVolume} onChange={(event) => onGuitarVolumeChange(Number(event.target.value))} className="mt-2 block w-full accent-orange-500" />
        </label>
        <p className={`mt-3 text-sm ${statusClass(ready)}`}>{ready ? "Your rig is ready. Start when you are comfortable." : "Complete all three checks to start a scored session."}</p>
      </div>

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onBack} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold">Back to Setup</button>
        <button type="button" onClick={onStart} disabled={!ready} className="ml-auto rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Continue to Session</button>
      </div>
    </div>
  );
}

function CheckCard({ label, value, complete }: { label: string; value: string; complete: boolean }) {
  return <div className={`rounded-xl border p-4 ${complete ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
    <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
    <p className={`mt-2 text-sm font-semibold ${complete ? "text-emerald-400" : "text-amber-300"}`}>{complete ? "Ready" : "Not ready"}</p>
    <p className="mt-1 text-xs text-zinc-400">{value}</p>
  </div>;
}
