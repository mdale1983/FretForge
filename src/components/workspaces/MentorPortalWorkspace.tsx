import { useCallback, useEffect, useMemo, useState } from "react";
import { Play, Trash2 } from "lucide-react";
import {
  deleteForgePulseRun,
  getForgePulseReviewRuns,
  getForgePulseSummary,
  type ForgePulseRun,
  type ForgePulseSummary,
  type ForgePulseTimingReport,
} from "../../features/forgepulse/forgePulseService";
import {
  loadForgePulsePreferences,
  saveForgePulsePreferences,
} from "../../features/forgepulse/forgePulsePreferences";
import {
  getPracticeExercise,
  inferLegacyExerciseId,
} from "../../features/forgepulse/practiceExerciseCatalog";

type MentorPortalWorkspaceProps = { theme: string; onOpenForgePulse: () => void };

type ReviewedRun = {
  run: ForgePulseRun;
  report: ForgePulseTimingReport;
  onTempoPercent: number;
};

function readReport(run: ForgePulseRun): ForgePulseTimingReport | null {
  if (!run.timing_report_json) return null;
  try {
    return JSON.parse(run.timing_report_json) as ForgePulseTimingReport;
  } catch {
    return null;
  }
}

function reviewRun(run: ForgePulseRun): ReviewedRun | null {
  const report = readReport(run);
  if (!report || report.scoredCount <= 0) return null;
  const successful = report.lockedCount + report.greatCount + report.goodCount + report.onTempoCount;
  return { run, report, onTempoPercent: Math.round((successful / report.scoredCount) * 100) };
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;
}

function strictnessLabel(run: ForgePulseRun) {
  if (run.timing_strictness === "relaxed") return "Learning";
  if (run.timing_strictness === "balanced") return "Balanced";
  if (run.timing_strictness === "tight") return "Precision";
  return "Legacy window";
}

function exerciseKey(run: ForgePulseRun) {
  return `${run.exercise_id ?? inferLegacyExerciseId(run.subdivision)}|${run.mode}|${run.time_signature}|${run.timing_strictness ?? "legacy"}`;
}

function exerciseForRun(run: ForgePulseRun) {
  return getPracticeExercise(run.exercise_id ?? inferLegacyExerciseId(run.subdivision));
}

function comparisonKey(run: ForgePulseRun) {
  return `${run.bpm}|${exerciseKey(run)}`;
}

function recommendation(reviewed: ReviewedRun | null) {
  if (!reviewed) return { title: "Build a timing baseline", detail: "Complete a scored ForgePulse session so Mentor Portal can recommend the next step.", targetBpm: 120 };
  const { run, report, onTempoPercent } = reviewed;
  if (report.confidence === "low") return { title: "Improve the measurement first", detail: "Verify the guitar signal, then repeat this exercise for a longer run before changing tempo.", targetBpm: run.bpm };
  if (onTempoPercent >= 80 && report.consistencyMs <= 60) return { title: `Try ${run.bpm + 5} BPM`, detail: "Your placement is stable enough for a small tempo increase. Keep the same exercise and timing strictness.", targetBpm: run.bpm + 5 };
  if (onTempoPercent >= 60) return { title: `Stay at ${run.bpm} BPM`, detail: "Repeat this exercise and make the attacks more even before increasing speed.", targetBpm: run.bpm };
  const nextBpm = Math.max(30, run.bpm - (onTempoPercent < 40 ? 10 : 5));
  const tendency = report.pocket === "ahead" ? "rushing" : report.pocket === "behind" ? "dragging" : "moving around the beat";
  return { title: `Return to ${nextBpm} BPM`, detail: `This run was mostly outside the target window and tended toward ${tendency}. Rebuild consistency before returning to ${run.bpm} BPM.`, targetBpm: nextBpm };
}

function coachReview(reviewed: ReviewedRun | null) {
  if (!reviewed) return "This run does not contain enough timing detail for a coaching review.";
  const { report, onTempoPercent } = reviewed;
  if (report.confidence === "low") return "The measurement confidence was low, so this result should not guide a tempo change. Verify the signal and record a longer run.";
  const placement = report.pocket === "ahead" ? "landed ahead of the beat" : report.pocket === "behind" ? "landed behind the beat" : "stayed centered around the beat";
  const control = report.consistencyMs <= 60 ? "Attack spacing was controlled" : report.consistencyMs <= 110 ? "Attack spacing moved around somewhat" : "Attack spacing varied substantially";
  const interruptions = report.missedCount + report.extraCount > 0 ? ` There were ${report.missedCount} missed and ${report.extraCount} extra attacks.` : " No missed or extra attacks were detected.";
  return `${onTempoPercent}% of scored attacks were on tempo or better, and the typical attack ${placement}. ${control}.${interruptions}`;
}

function practiceDirection(runs: ForgePulseRun[]) {
  const groups = new Map<string, ReviewedRun[]>();
  runs.map(reviewRun).filter((item): item is ReviewedRun => item !== null && item.report.confidence !== "low").forEach((item) => {
    const key = comparisonKey(item.run);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  const focus = [...groups.values()]
    .filter((items) => items.length >= 2)
    .map((items) => ({ items: items.slice(0, 3), averagePercent: average(items.slice(0, 3).map((item) => item.onTempoPercent)) }))
    .sort((a, b) => a.averagePercent - b.averagePercent)[0];
  if (!focus) return { title: "Build a comparable baseline", detail: "Complete the same tempo, exercise, and timing strictness at least twice. Mentor Portal will then identify the area that most needs attention.", evidence: "Not enough comparable sessions yet" };
  const latest = focus.items[0];
  const next = recommendation(latest);
  return {
    title: `${exerciseForRun(latest.run).name} · ${latest.run.bpm} BPM`,
    detail: next.detail,
    evidence: `${focus.averagePercent}% average across ${focus.items.length} comparable sessions · ${strictnessLabel(latest.run)} · ${next.title}`,
  };
}

export default function MentorPortalWorkspace({ theme, onOpenForgePulse }: MentorPortalWorkspaceProps) {
  const [runs, setRuns] = useState<ForgePulseRun[]>([]);
  const [summary, setSummary] = useState<ForgePulseSummary>({ runCount: 0, totalSeconds: 0, averageBpm: 0 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [projectFilter, setProjectFilter] = useState("all");
  const [exerciseFilter, setExerciseFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadReview = useCallback(async () => {
    try {
      const [history, totals] = await Promise.all([getForgePulseReviewRuns(), getForgePulseSummary()]);
      setRuns(history);
      setSummary(totals);
      setSelectedId((current) => history.some((run) => run.id === current) ? current : history[0]?.id ?? null);
      setError("");
    } catch (reason) {
      console.error("Practice review could not be loaded:", reason);
      setError("Practice history is currently unavailable.");
    }
  }, []);

  useEffect(() => { void loadReview(); }, [loadReview]);

  const projectOptions = useMemo(() => {
    const options = new Map<string, string>();
    runs.forEach((run) => options.set(run.project_id === null ? "unassigned" : String(run.project_id), run.project_name ?? "Unassigned project"));
    return [...options.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [runs]);
  const exerciseOptions = useMemo(() => {
    const options = new Map<string, string>();
    runs.forEach((run) => options.set(exerciseKey(run), `${exerciseForRun(run).name} · ${run.mode} · ${run.time_signature} · ${strictnessLabel(run)}`));
    return [...options.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [runs]);
  const filteredRuns = useMemo(() => runs.filter((run) => {
    const projectKey = run.project_id === null ? "unassigned" : String(run.project_id);
    const ageDays = (Date.now() - new Date(run.completed_at).getTime()) / 86_400_000;
    return (timeFilter === "all" || ageDays <= Number(timeFilter)) && (projectFilter === "all" || projectFilter === projectKey) && (exerciseFilter === "all" || exerciseFilter === exerciseKey(run));
  }), [runs, projectFilter, exerciseFilter, timeFilter]);
  const direction = useMemo(() => practiceDirection(filteredRuns), [filteredRuns]);

  useEffect(() => {
    if (!filteredRuns.some((run) => run.id === selectedId)) setSelectedId(filteredRuns[0]?.id ?? null);
  }, [filteredRuns, selectedId]);

  const selectedRun = useMemo(() => filteredRuns.find((run) => run.id === selectedId) ?? filteredRuns[0] ?? null, [filteredRuns, selectedId]);
  const selectedReview = selectedRun ? reviewRun(selectedRun) : null;
  const report = selectedReview?.report ?? (selectedRun ? readReport(selectedRun) : null);
  const onTempoPercent = selectedReview?.onTempoPercent ?? 0;
  const nextStep = recommendation(selectedReview);
  const comparableRuns = useMemo(() => {
    if (!selectedRun) return [];
    return runs.filter((run) => comparisonKey(run) === comparisonKey(selectedRun)).map(reviewRun).filter((run): run is ReviewedRun => run !== null).slice(0, 8);
  }, [runs, selectedRun]);
  const recentAverage = average(comparableRuns.slice(0, 3).map((item) => item.onTempoPercent));
  const previousAverage = average(comparableRuns.slice(3, 6).map((item) => item.onTempoPercent));
  const trendDifference = previousAverage ? recentAverage - previousAverage : null;
  const surface = theme === "dark" ? "border-zinc-800 bg-zinc-950/50" : "border-zinc-200 bg-white";
  const field = theme === "dark" ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900";

  function practiceSelectedRun() {
    if (!selectedRun) return;
    const preferences = loadForgePulsePreferences();
    saveForgePulsePreferences({ ...preferences, exerciseId: selectedRun.exercise_id ?? inferLegacyExerciseId(selectedRun.subdivision), mode: "practice", bpm: nextStep.targetBpm, subdivision: selectedRun.subdivision, timeSignature: selectedRun.time_signature });
    if (selectedRun.timing_strictness) localStorage.setItem("fretforge.timingStrictness", selectedRun.timing_strictness);
    localStorage.setItem("fretforge.forgepulse.fromMentor", "true");
    onOpenForgePulse();
  }

  async function removeSelectedRun() {
    if (!selectedRun || !window.confirm("Delete this practice result? This cannot be undone.")) return;
    setDeletingId(selectedRun.id);
    try {
      await deleteForgePulseRun(selectedRun.id);
      await loadReview();
    } catch (reason) {
      console.error("Practice result could not be deleted:", reason);
      setError("That practice result could not be deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label="Total Runs" value={String(summary.runCount)} />
        <Summary label="Total Practice Time" value={formatDuration(summary.totalSeconds)} />
        <Summary label="Lifetime Average Tempo" value={summary.averageBpm ? `${summary.averageBpm} BPM` : "—"} />
      </div>

      {runs.length > 0 && <section className={`rounded-xl border p-4 ${surface}`}><div className="flex flex-wrap items-end gap-3"><label className="min-w-48 flex-1 text-xs uppercase tracking-wide text-zinc-500">Project<select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm normal-case ${field}`}><option value="all">All projects</option>{projectOptions.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label><label className="min-w-56 flex-[1.4] text-xs uppercase tracking-wide text-zinc-500">Exercise<select value={exerciseFilter} onChange={(event) => setExerciseFilter(event.target.value)} className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm capitalize ${field}`}><option value="all">All exercises</option>{exerciseOptions.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label><label className="min-w-40 flex-1 text-xs uppercase tracking-wide text-zinc-500">Time Range<select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)} className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm normal-case ${field}`}><option value="all">All available history</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></label><button type="button" onClick={() => { setProjectFilter("all"); setExerciseFilter("all"); setTimeFilter("all"); }} className="rounded-lg border border-zinc-600 px-4 py-2 text-sm">Clear Filters</button></div></section>}

      {runs.length > 0 && <section className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-3xl"><p className="text-xs uppercase tracking-wide text-orange-400">Practice Direction</p><h2 className="mt-2 text-xl font-semibold capitalize">{direction.title}</h2><p className="mt-2 text-sm leading-relaxed text-zinc-400">{direction.detail}</p></div><div className="max-w-sm rounded-lg border border-orange-500/20 bg-zinc-950/30 px-4 py-3"><p className="text-xs uppercase tracking-wide text-zinc-500">Evidence</p><p className="mt-1 text-sm">{direction.evidence}</p></div></div></section>}

      {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}
      {!error && runs.length === 0 && <div className={`rounded-xl border p-8 text-center ${surface}`}><h2 className="font-semibold">No practice reviews yet</h2><p className="mt-2 text-sm text-zinc-500">Complete a ForgePulse session to begin building your progress history.</p><button type="button" onClick={onOpenForgePulse} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-black"><Play size={16} />Open ForgePulse</button></div>}

      {runs.length > 0 && <div className="grid min-h-[520px] gap-5 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
        <section className={`rounded-xl border p-4 ${surface}`}><div className="mb-3"><h2 className="font-semibold">Practice History</h2><p className="mt-1 text-xs text-zinc-500">Select a session to review its results.</p></div><div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">{filteredRuns.map((run) => { const reviewed = reviewRun(run); return <button key={run.id} type="button" onClick={() => setSelectedId(run.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedRun?.id === run.id ? "border-orange-500 bg-orange-500/10" : theme === "dark" ? "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700" : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"}`}><div className="flex items-center justify-between gap-3"><span className="font-semibold">{exerciseForRun(run).name}</span><span className="text-xs text-zinc-500">{new Date(run.completed_at).toLocaleDateString()}</span></div><p className="mt-1 text-xs capitalize text-zinc-500">{run.bpm} BPM · {run.mode} · {run.time_signature} · {strictnessLabel(run)}</p><p className="mt-1 truncate text-xs text-zinc-500">{run.project_name ?? "Unassigned project"}{run.session_name ? ` · ${run.session_name}` : ""}</p><p className="mt-2 text-sm">{reviewed ? `${reviewed.onTempoPercent}% on tempo or better` : "Timing report unavailable"}</p></button>; })}{filteredRuns.length === 0 && <p className="rounded-lg border border-zinc-700/60 p-4 text-sm text-zinc-500">No practice sessions match these filters.</p>}</div></section>

        <section className={`rounded-xl border p-5 ${surface}`}>{selectedRun && <><div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-700/60 pb-4"><div><p className="text-xs uppercase tracking-wide text-zinc-500">Practice Review</p><h2 className="mt-1 text-xl font-semibold">{exerciseForRun(selectedRun).name} · {selectedRun.bpm} BPM</h2><p className="mt-1 text-sm text-zinc-500">{selectedRun.project_name ?? "Unassigned project"}{selectedRun.session_name ? ` · ${selectedRun.session_name}` : ""}</p><p className="mt-1 text-sm text-zinc-500">{new Date(selectedRun.completed_at).toLocaleString()} · {formatDuration(selectedRun.duration_seconds)} · {selectedRun.time_signature} · {strictnessLabel(selectedRun)}</p></div><div className="flex items-start gap-2"><button type="button" onClick={practiceSelectedRun} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-black"><Play size={15} />Practice This</button><button type="button" disabled={deletingId === selectedRun.id} onClick={() => void removeSelectedRun()} aria-label="Delete practice result" className="rounded-lg border border-red-500/50 p-2 text-red-400 disabled:opacity-50"><Trash2 size={17} /></button>{report && <div className="rounded-lg bg-orange-500/10 px-4 py-2 text-right"><p className="text-xs uppercase tracking-wide text-zinc-500">On Tempo+</p><p className="text-2xl font-semibold text-orange-400">{onTempoPercent}%</p></div>}</div></div>

          <div className="mt-5 grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4"><p className="text-xs uppercase tracking-wide text-orange-400">Recommended Next Practice</p><h3 className="mt-2 text-lg font-semibold">{nextStep.title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-400">{nextStep.detail}</p></div><div className="rounded-xl border border-zinc-700/60 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Coach Review</p><p className="mt-2 text-sm leading-relaxed">{coachReview(selectedReview)}</p></div></div>

          <div className="mt-5 rounded-xl border border-zinc-700/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-zinc-500">Comparable Session Trend</p><p className="mt-1 text-sm text-zinc-500">Same tempo, mode, subdivision, time signature, and strictness.</p></div><div className="text-right"><p className="text-2xl font-semibold">{recentAverage}%</p><p className="text-xs text-zinc-500">{trendDifference === null ? "More sessions needed" : trendDifference === 0 ? "Holding steady" : `${trendDifference > 0 ? "+" : ""}${trendDifference} points`}</p></div></div><TrendChart runs={comparableRuns} /></div>

          {report ? <><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Metric label="Median Error" value={`${report.medianAbsoluteErrorMs} ms`} /><Metric label="Consistency" value={`${report.consistencyMs} ms`} /><Metric label="Placement" value={report.pocket} capitalize /><Metric label="Drift" value={`${report.driftMs > 0 ? "+" : ""}${report.driftMs} ms`} /><Metric label="Missed / Extra" value={`${report.missedCount} / ${report.extraCount}`} /><Metric label="Confidence" value={report.confidence} capitalize /></div><div className="mt-5 rounded-xl border border-zinc-700/60 p-4"><h3 className="text-sm font-semibold">Timing Distribution</h3><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5"><Band label="Locked" value={report.lockedCount} /><Band label="Great" value={report.greatCount} /><Band label="Good" value={report.goodCount} /><Band label="On Tempo" value={report.onTempoCount} /><Band label="Outside" value={report.offTempoCount} /></div></div></> : <p className="mt-5 text-sm text-zinc-500">This older practice entry was saved before detailed timing reports were available.</p>}</>}</section>
      </div>}
    </div>
  );
}

function TrendChart({ runs }: { runs: ReviewedRun[] }) {
  const chronological = [...runs].reverse();
  if (chronological.length < 2) return <p className="mt-4 rounded-lg bg-zinc-900/40 p-4 text-sm text-zinc-500">Complete this exact exercise again to begin the trend.</p>;
  return <div className="mt-4 flex h-36 items-end gap-2" aria-label="On-tempo percentage by practice session">{chronological.map((item) => <div key={item.run.id} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="text-xs font-semibold">{item.onTempoPercent}%</span><div className="w-full max-w-16 rounded-t bg-orange-500/80" style={{ height: `${Math.max(8, item.onTempoPercent)}%` }} /><span className="truncate text-[10px] text-zinc-500">{new Date(item.run.completed_at).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}</span></div>)}</div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-orange-500/10 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-1 text-2xl font-semibold text-orange-400">{value}</p></div>;
}

function Metric({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
  return <div className="rounded-lg border border-zinc-700/60 p-3"><p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p><p className={`mt-1 text-lg font-semibold ${capitalize ? "capitalize" : ""}`}>{value}</p></div>;
}

function Band({ label, value }: { label: string; value: number }) {
  return <div><p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>;
}
