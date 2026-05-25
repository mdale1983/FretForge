type ForgePulseSessionViewProps = {
  theme: string;
  sessionTitle: string;
  onBack: () => void;
  onStart: () => void;
  onStop: () => void;
};

export function ForgePulseSessionView({
  theme,
  sessionTitle,
  onBack,
  onStart,
  onStop,
}: ForgePulseSessionViewProps) {
  return (
    <div
      className={`mt-5 rounded-xl border p-4 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-950/50"
          : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        Active Session
      </p>

      <h3 className="mt-2 text-sm font-semibold">
        {sessionTitle}
      </h3>

      <button
        type="button"
        onClick={onBack}
        className={`mt-4 rounded-lg border px-4 py-2 text-sm font-semibold ${
          theme === "dark"
            ? "border-zinc-700 text-zinc-100"
            : "border-zinc-300 text-zinc-900"
        }`}
      >
        Back to Setup
      </button>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onStart}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Start Metronome
        </button>

        <button
          type="button"
          onClick={onStop}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
            theme === "dark"
              ? "border-zinc-700 text-zinc-100"
              : "border-zinc-300 text-zinc-900"
          }`}
        >
          Stop Metronome
        </button>
      </div>
    </div>
  );
}