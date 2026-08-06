import { getDatabase } from "../../lib/database";
import type {
  ForgePulseMode,
  Subdivision,
  TimeSignature,
  TimingStrictness,
} from "./forgePulseTypes";

export type ForgePulseRun = {
  id: number;
  project_id: number | null;
  session_id: number | null;
  mode: ForgePulseMode;
  bpm: number;
  subdivision: Subdivision;
  time_signature: TimeSignature;
  duration_seconds: number;
  completed_at: string;
	timing_report_json: string | null;
  timing_strictness: TimingStrictness | null;
  project_name?: string | null;
  session_name?: string | null;
};

export type ForgePulseTimingReport = {
	scoredCount: number;
	lockedCount: number;
	greatCount: number;
	goodCount: number;
	onTempoCount: number;
	offTempoCount: number;
	missedCount: number;
	extraCount: number;
	medianOffsetMs: number;
	medianAbsoluteErrorMs: number;
	consistencyMs: number;
	driftMs: number;
	pocket: "ahead" | "centered" | "behind";
	confidence: "low" | "moderate" | "high";
};

export type ForgePulseSummary = {
  runCount: number;
  totalSeconds: number;
  averageBpm: number;
};

type SaveForgePulseRunInput = {
  projectId: number | null;
  sessionId: number | null;
  mode: ForgePulseMode;
  bpm: number;
  subdivision: Subdivision;
  timeSignature: TimeSignature;
  durationSeconds: number;
	timingReport: ForgePulseTimingReport | null;
  timingStrictness: TimingStrictness;
};

export async function saveForgePulseRun(input: SaveForgePulseRunInput) {
  const database = await getDatabase();

  await database.execute(
    `
    INSERT INTO forgepulse_runs (
      project_id,
      session_id,
      mode,
      bpm,
      subdivision,
      time_signature,
      duration_seconds,
	  timing_report_json,
	  timing_strictness,
      completed_at
    )
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.projectId,
      input.sessionId,
      input.mode,
      input.bpm,
      input.subdivision,
      input.timeSignature,
      input.durationSeconds,
	  input.timingReport ? JSON.stringify(input.timingReport) : null,
      input.timingStrictness,
      new Date().toISOString(),
    ]
  );
}

export async function getRecentForgePulseRuns(limit = 5) {
  const database = await getDatabase();

  return database.select<ForgePulseRun[]>(
    `
    SELECT
      f.*,
      p.name AS project_name,
      s.name AS session_name
    FROM forgepulse_runs AS f
    LEFT JOIN projects AS p ON p.id = f.project_id
    LEFT JOIN sessions AS s ON s.id = f.session_id
    ORDER BY f.completed_at DESC
    LIMIT ?
    `,
    [limit]
  );
}

export async function getForgePulseReviewRuns() {
  const database = await getDatabase();

  return database.select<ForgePulseRun[]>(
    `
    SELECT
      f.*,
      p.name AS project_name,
      s.name AS session_name
    FROM forgepulse_runs AS f
    LEFT JOIN projects AS p ON p.id = f.project_id
    LEFT JOIN sessions AS s ON s.id = f.session_id
    ORDER BY f.completed_at DESC
    `
  );
}

export async function getForgePulseSummary(): Promise<ForgePulseSummary> {
  const database = await getDatabase();
  const rows = await database.select<
    { run_count: number; total_seconds: number; average_bpm: number }[]
  >(
    `
    SELECT
      COUNT(*) AS run_count,
      COALESCE(SUM(duration_seconds), 0) AS total_seconds,
      COALESCE(AVG(bpm), 0) AS average_bpm
    FROM forgepulse_runs
    `
  );
  const summary = rows[0];

  return {
    runCount: summary?.run_count ?? 0,
    totalSeconds: summary?.total_seconds ?? 0,
    averageBpm: Math.round(summary?.average_bpm ?? 0),
  };
}

export async function deleteForgePulseRun(runId: number) {
  const database = await getDatabase();
  await database.execute("DELETE FROM forgepulse_runs WHERE id = ?", [runId]);
}
