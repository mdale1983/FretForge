import type { TimingCoachState } from "../hooks/useTimingCoach";

type ForgePulseResultsViewProps = {
  theme: string;
  timing: TimingCoachState;
  exerciseName: string;
  isSaving: boolean;
  onAgain: () => void;
  onSetup: () => void;
  onReview: () => void;
};

export function ForgePulseResultsView({ theme, timing, exerciseName, isSaving, onAgain, onSetup, onReview }: ForgePulseResultsViewProps) {
  const total = Math.max(1, timing.scoredCount);
  const percent = (count: number) => Math.round(count / total * 100);
  return <div className={`mt-5 rounded-xl border p-5 ${theme === "dark" ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-zinc-50"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs uppercase tracking-[0.18em] text-orange-400">Session results · {exerciseName}</p><h3 className="mt-2 text-2xl font-semibold">{percent(timing.correctCount)}% on tempo or better</h3><p className="mt-1 text-sm text-zinc-400">Typical placement: {Math.abs(timing.medianOffsetMs)} ms {timing.pocket === "centered" ? "from center" : `${timing.pocket} of the beat`}.</p></div>
      <span className={`rounded-full px-3 py-1 text-xs ${timing.confidence === "high" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300"}`}>{timing.confidence} confidence</span>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Result label="Locked" value={`${timing.lockedCount} · ${percent(timing.lockedCount)}%`} /><Result label="Great" value={`${timing.greatCount} · ${percent(timing.greatCount)}%`} /><Result label="Good" value={`${timing.goodCount} · ${percent(timing.goodCount)}%`} /><Result label="On tempo" value={`${timing.onTempoCount} · ${percent(timing.onTempoCount)}%`} /><Result label="Outside" value={`${timing.offTempoCount} · ${percent(timing.offTempoCount)}%`} />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Result label="Median error" value={`${timing.medianAbsoluteErrorMs} ms`} /><Result label="Consistency" value={`${timing.consistencyMs} ms`} /><Result label="Drift" value={`${timing.driftMs > 0 ? "+" : ""}${timing.driftMs} ms`} /><Result label="Missed / Extra" value={`${timing.missedCount} / ${timing.extraCount}`} />
    </div>
    <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={onAgain} disabled={isSaving} className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">Practice Again</button><button type="button" onClick={onReview} disabled={isSaving} className="rounded-lg border border-orange-500/60 px-4 py-2 text-sm font-semibold text-orange-400 disabled:opacity-50">{isSaving ? "Saving Result…" : "Review in Mentor Portal"}</button><button type="button" onClick={onSetup} className="ml-auto rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold">Back to Setup</button></div>
  </div>;
}

function Result({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-zinc-700/60 p-3"><p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-1 font-semibold tabular-nums">{value}</p></div>;
}
