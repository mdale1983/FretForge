import { getDatabase } from "../lib/database";
import { setAppState } from "./AppStateService";

export async function createSession(
  projectId: number
) {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.execute(
    `
    INSERT INTO sessions (
      project_id,
      name,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      projectId,
      "Practice Session",
      now,
      now,
    ]
  );

  const sessions = await db.select<any[]>(
    `
    SELECT *
    FROM sessions
    WHERE project_id = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [projectId]
  );

  return sessions[0] ?? null;
}

export async function setActiveSession(
  sessionId: number
) {
  await setAppState(
    "active_session_id",
    String(sessionId)
  );
}

export async function getActiveSessionId(): Promise<number | null> {
  const db = await getDatabase();

  const result = await db.select<any[]>(
    `
    SELECT value
    FROM app_state
    WHERE key = 'active_session_id'
    LIMIT 1
    `
  );

  if (!result.length) {
    return null;
  }

  const sessionId = Number(result[0].value);

  return Number.isFinite(sessionId)
    ? sessionId
    : null;
}