import { getDatabase } from "../lib/database";
import { getAppState, setAppState } from "./AppStateService";

export interface Session {
  id: number;
  project_id: number;
  name: string;
  created_at: string;
  updated_at: string;
  active_workspace: string;
}

export async function createSession(projectId: number) {
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
      `Practice Session ${new Date().toLocaleDateString()}`,
      now,
      now,
    ]
  );

  return await getMostRecentSessionForProject(projectId);
}

export async function getMostRecentSessionForProject(projectId: number) {
  const db = await getDatabase();

  const sessions = await db.select<Session[]>(
    `
    SELECT *
    FROM sessions
    WHERE project_id = ?
    ORDER BY updated_at DESC
    LIMIT 1
    `,
    [projectId]
  );

  return sessions[0] ?? null;
}

export async function getOrCreateSessionForProject(projectId: number) {
  const existingSession = await getMostRecentSessionForProject(projectId);

  if (existingSession) {
    return existingSession;
  }

  return await createSession(projectId);
}

export async function setActiveSession(sessionId: number) {
  await setAppState("active_session_id", String(sessionId));
  await touchSession(sessionId);
}

export async function touchSession(sessionId: number) {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.execute(
    `
    UPDATE sessions
    SET updated_at = ?
    WHERE id = ?
    `,
    [now, sessionId]
  );
}

export async function getActiveSessionId(): Promise<number | null> {
  const value = await getAppState("active_session_id");

  if (!value) {
    return null;
  }

  const sessionId = Number(value);

  return Number.isFinite(sessionId) ? sessionId : null;
}

export async function getSessionsForProject(projectId: number) {
  const db = await getDatabase();

  const sessions = await db.select<Session[]>(
    `
    SELECT *
    FROM sessions
    WHERE project_id = ?
    ORDER BY updated_at DESC
    `,
    [projectId]
  );

  return sessions;
}

export async function getSessionById(sessionId: number) {
  const db = await getDatabase();

  const sessions = await db.select<Session[]>(
    `
    SELECT *
    FROM sessions
    WHERE id = ?
    LIMIT 1
    `,
    [sessionId]
  );

  return sessions[0] ?? null;
}

export async function setSessionWorkspace(
  sessionId: number,
  workspace: string
) {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.execute(
    `
    UPDATE sessions
    SET active_workspace = ?,
        updated_at = ?
    WHERE id = ?
    `,
    [workspace, now, sessionId]
  );
}
