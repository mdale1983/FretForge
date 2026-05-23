type ForgePulseWorkspaceProps = {
  theme: string;
};

function ForgePulseWorkspace({ theme }: ForgePulseWorkspaceProps) {
  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 shadow-lg ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-black/20"
          : "border-zinc-300 bg-white text-zinc-900 shadow-zinc-300/40"
      }`}
    >
      <h2 className="text-xl font-semibold tracking-tight text-orange-400">
        ForgePulse
      </h2>

      <p
        className={`mt-3 text-sm leading-relaxed ${
          theme === "dark" ? "text-zinc-400" : "text-zinc-700"
        }`}
      >
        Metronome workspace shell ready. Audio generation and session persistence
        are intentionally not wired yet.
      </p>
    </section>
  );
}

export default ForgePulseWorkspace;