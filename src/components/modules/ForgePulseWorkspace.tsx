type ForgePulseWorkspaceProps = {
  theme: string;
};

function ForgePulseWorkspace({ theme }: ForgePulseWorkspaceProps) {
  const cardClass =
    theme === "dark"
      ? "border-zinc-800 bg-zinc-900/80 text-zinc-100"
      : "border-zinc-300 bg-white text-zinc-900";

  const labelClass =
    theme === "dark" ? "text-zinc-400" : "text-zinc-600";

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-5 items-start">
      <section className={`rounded-2xl border p-6 shadow-lg ${cardClass}`}>
        <h2 className="mb-2 text-xl font-bold text-orange-400">
          ForgePulse
        </h2>

        <p className={`mb-6 text-sm leading-relaxed ${labelClass}`}>
          Timing engine foundation for metronome, subdivisions, count-ins,
          tempo ramps, and rhythm practice routines.
        </p>

        <div className="grid gap-4">
          <div>
            <div className={`mb-1 text-xs font-semibold uppercase ${labelClass}`}>
              BPM
            </div>
            <div className="text-4xl font-bold">120</div>
          </div>

          <div>
            <div className={`mb-1 text-xs font-semibold uppercase ${labelClass}`}>
              Subdivision
            </div>
            <div className="text-lg font-semibold">Quarter Notes</div>
          </div>

          <div>
            <div className={`mb-1 text-xs font-semibold uppercase ${labelClass}`}>
              Count-In
            </div>
            <div className="text-lg font-semibold">Off</div>
          </div>
        </div>
      </section>

      <section className={`rounded-2xl border p-6 shadow-lg ${cardClass}`}>
        <h2 className="mb-4 text-xl font-bold">Practice Timer</h2>

        <div className="mb-6 text-5xl font-bold tracking-tight">
          00:00
        </div>

        <div className="flex gap-3">
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-orange-400">
            Start
          </button>

          <button className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-bold hover:border-orange-400 hover:text-orange-400">
            Stop
          </button>
        </div>
      </section>
    </div>
  );
}

export default ForgePulseWorkspace;