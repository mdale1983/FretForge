import { getDatabase } from "../../lib/database";
import type {
  ForgePulseMode,
  Subdivision,
  TimeSignature,
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
};

type SaveForgePulseRunInput = {
  projectId: number | null;
  sessionId: number | null;
  mode: ForgePulseMode;
  bpm: number;
  subdivision: Subdivision;
  timeSignature: TimeSignature;
  durationSeconds: number;
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
      completed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.projectId,
      input.sessionId,
      input.mode,
      input.bpm,
      input.subdivision,
      input.timeSignature,
      input.durationSeconds,
      new Date().toISOString(),
    ]
  );
}

export async function getRecentForgePulseRuns(limit = 5) {
  const database = await getDatabase();

  return database.select<ForgePulseRun[]>(
    `
    SELECT *
    FROM forgepulse_runs
    ORDER BY completed_at DESC
    LIMIT ?
    `,
    [limit]
  );
}
