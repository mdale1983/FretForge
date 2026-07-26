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
          <p className="mt-5 text-xs text-zinc-600">
            Signal confidence: {Math.round(tuner.clarity * 100)}%
          </p>
        )}
      </div>
    </section>
  );
}
