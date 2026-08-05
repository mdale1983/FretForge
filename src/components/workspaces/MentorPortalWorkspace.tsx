import { useEffect, useMemo, useState } from "react";
import {
  getForgePulseSummary,
  getRecentForgePulseRuns,
  type ForgePulseRun,
  type ForgePulseSummary,
  type ForgePulseTimingReport,
} from "../../features/forgepulse/forgePulseService";

type MentorPortalWorkspaceProps = { theme: string };

function readReport(run: ForgePulseRun): ForgePulseTimingReport | null {
  if (!run.timing_report_json) return null;
  try { return JSON.parse(run.timing_report_json) as ForgePulseTimingReport; } catch { return null; }
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function MentorPortalWorkspace({ theme }: MentorPortalWorkspaceProps) {
  const [runs, setRuns] = useState<ForgePulseRun[]>([]);
  const [summary, setSummary] = useState<ForgePulseSummary>({ runCount: 0, totalSeconds: 0, averageBpm: 0 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getRecentForgePulseRuns(100), getForgePulseSummary()])
      .then(([history, totals]) => { setRuns(history); setSummary(totals); setSelectedId((current) => current ?? history[0]?.id ?? null); })
      .catch((reason) => { console.error("Practice review could not be loaded:", reason); setError("Practice history is currently unavailable."); });
  }, []);

  const selectedRun = useMemo(() => runs.find((run) => run.id === selectedId) ?? runs[0] ?? null, [runs, selectedId]);
  const report = selectedRun ? readReport(selectedRun) : null;
  const onTempoCount = report ? report.lockedCount + report.greatCount + report.goodCount + report.onTempoCount : 0;
  const onTempoPercent = report?.scoredCount ? Math.round((onTempoCount / report.scoredCount) * 100) : 0;
  const surface = theme === "dark" ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-white";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-orange-500/10 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Runs</p><p className="mt-1 text-2xl font-semibold text-orange-400">{summary.runCount}</p></div>
        <div className="rounded-xl bg-orange-500/10 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Practice Time</p><p className="mt-1 text-2xl font-semibold text-orange-400">{formatDuration(summary.totalSeconds)}</p></div>
        <div className="rounded-xl bg-orange-500/10 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Average Tempo</p><p className="mt-1 text-2xl font-semibold text-orange-400">{summary.averageBpm ? `${summary.averageBpm} BPM` : "—"}</p></div>
      </div>

      {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}
      {!error && runs.length === 0 && <div className={`rounded-xl border p-8 text-center ${surface}`}><h2 className="font-semibold">No practice reviews yet</h2><p className="mt-2 text-sm text-zinc-500">Complete a ForgePulse session to begin building your progress history.</p></div>}

      {runs.length > 0 && (
        <div className="grid min-h-[480px] gap-5 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
          <section className={`rounded-xl border p-4 ${surface}`}>
            <div className="mb-3"><h2 className="font-semibold">Practice History</h2><p className="mt-1 text-xs text-zinc-500">Select a session to review its results.</p></div>
            <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {runs.map((run) => {
                const runReport = readReport(run);
                const scored = runReport?.scoredCount ?? 0;
                const successful = runReport ? runReport.lockedCount + runReport.greatCount + runReport.goodCount + runReport.onTempoCount : 0;
                return <button key={run.id} type="button" onClick={() => setSelectedId(run.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedRun?.id === run.id ? "border-orange-500 bg-orange-500/10" : theme === "dark" ? "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"}`}>
                  <div className="flex items-center justify-between gap-3"><span className="font-semibold">{run.bpm} BPM</span><span className="text-xs text-zinc-500">{new Date(run.completed_at).toLocaleDateString()}</span></div>
                  <p className="mt-1 text-xs capitalize text-zinc-500">{run.mode} · {run.subdivision} · {run.time_signature}</p>
                  <p className="mt-2 text-sm">{scored ? `${Math.round((successful / scored) * 100)}% on tempo or better` : "Timing report unavailable"}</p>
                </button>;
              })}
            </div>
          </section>

          <section className={`rounded-xl border p-5 ${surface}`}>
            {selectedRun && <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-700/60 pb-4"><div><p className="text-xs uppercase tracking-wide text-zinc-500">Practice Review</p><h2 className="mt-1 text-xl font-semibold">{selectedRun.bpm} BPM · <span className="capitalize">{selectedRun.subdivision}</span></h2><p className="mt-1 text-sm text-zinc-500">{new Date(selectedRun.completed_at).toLocaleString()} · {formatDuration(selectedRun.duration_seconds)} · {selectedRun.time_signature}</p></div>{report && <div className="rounded-lg bg-orange-500/10 px-4 py-3 text-right"><p className="text-xs uppercase tracking-wide text-zinc-500">On Tempo+</p><p className="text-2xl font-semibold text-orange-400">{onTempoPercent}%</p></div>}</div>
              {report ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Metric label="Median Error" value={`${report.medianAbsoluteErrorMs} ms`} />
                <Metric label="Consistency" value={`${report.consistencyMs} ms`} />
                <Metric label="Placement" value={report.pocket} capitalize />
                <Metric label="Drift" value={`${report.driftMs > 0 ? "+" : ""}${report.driftMs} ms`} />
                <Metric label="Missed / Extra" value={`${report.missedCount} / ${report.extraCount}`} />
                <Metric label="Confidence" value={report.confidence} capitalize />
              </div> : <p className="mt-5 text-sm text-zinc-500">This older practice entry was saved before detailed timing reports were available.</p>}
              {report && <div className="mt-5 rounded-xl border border-zinc-700/60 p-4"><h3 className="text-sm font-semibold">Timing Distribution</h3><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5"><Band label="Locked" value={report.lockedCount} /><Band label="Great" value={report.greatCount} /><Band label="Good" value={report.goodCount} /><Band label="On Tempo" value={report.onTempoCount} /><Band label="Outside" value={report.offTempoCount} /></div></div>}
            </>}
          </section>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
  return <div className="rounded-lg border border-zinc-700/60 p-3"><p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p><p className={`mt-1 text-lg font-semibold ${capitalize ? "capitalize" : ""}`}>{value}</p></div>;
}

function Band({ label, value }: { label: string; value: number }) {
  return <div><p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}
