import { getDatabase } from "../lib/database";
import { getAppState, setAppState } from "./AppStateService";
import { SessionWorkspaceState } from "../types/session";

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
    updated_at,
    active_workspace
  )
  VALUES (?, ?, ?, ?, ?)
    `,
   [
    projectId,
    `Practice Session ${new Date().toLocaleDateString()}`,
    now,
    now,
    "forge",
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

export async function saveWorkspaceState(
  workspaceState: SessionWorkspaceState
) {
  localStorage.setItem(
    "fretforge_workspace_state",
    JSON.stringify(workspaceState)
  );
}

export async function loadWorkspaceState(): Promise<SessionWorkspaceState | null> {
  const storedWorkspaceState = localStorage.getItem(
    "fretforge_workspace_state"
  );

  if (!storedWorkspaceState) {
    return null;
  }

  return JSON.parse(storedWorkspaceState);
}

export async function clearWorkspaceState() {
  localStorage.removeItem("fretforge_workspace_state");
}

export async function deleteSession(sessionId: number) {
  const activeSessionId = await getActiveSessionId();

  if (activeSessionId === sessionId) {
    throw new Error("Cannot delete the active session.");
  }

  const db = await getDatabase();

  await db.execute(
    `
    DELETE FROM sessions
    WHERE id = ?
    `,
    [sessionId]
  );

  const workspaceState = await loadWorkspaceState();

  if (workspaceState?.activeSessionId === sessionId) {
    await clearWorkspaceState();
  }
}

export async function deleteInactiveSessionsForProject(projectId: number) {
  const activeSessionId = await getActiveSessionId();
  const db = await getDatabase();

  if (!activeSessionId) {
    return;
  }

  await db.execute(
    `
    DELETE FROM sessions
    WHERE project_id = ?
    AND id != ?
    `,
    [projectId, activeSessionId]
  );
}

export async function getSessionCountForProject(
  projectId: number
): Promise<number> {
  const db = await getDatabase();

  const result = await db.select<{ count: number }[]>(
    `
    SELECT COUNT(*) as count
    FROM sessions
    WHERE project_id = ?
    `,
    [projectId]
  );

  return result[0]?.count ?? 0;
}

export async function createRecoverySession(projectId: number) {
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
      `Recovery Session ${new Date().toLocaleString()}`,
      now,
      now,
    ]
  );

  return await getMostRecentSessionForProject(projectId);
}

export async function createFallbackSessionIfNeeded(
  projectId: number
) {
  const sessionCount = await getSessionCountForProject(projectId);

  if (sessionCount > 0) {
    return;
  }

  await createRecoverySession(projectId);
}

export async function getNextAvailableSessionForProject(
  projectId: number,
  excludedSessionId: number
) {
  const db = await getDatabase();

  const sessions = await db.select<Session[]>(
    `
    SELECT *
    FROM sessions
    WHERE project_id = ?
    AND id != ?
    ORDER BY updated_at DESC
    LIMIT 1
    `,
    [projectId, excludedSessionId]
  );

  return sessions[0] ?? null;
}

export async function switchToFallbackSessionBeforeDelete(
  projectId: number,
  sessionIdToDelete: number
) {
  const fallbackSession = await getNextAvailableSessionForProject(
    projectId,
    sessionIdToDelete
  );

  if (fallbackSession) {
    await setActiveSession(fallbackSession.id);
    return fallbackSession;
  }

  const recoverySession = await createRecoverySession(projectId);

  if (recoverySession) {
    await setActiveSession(recoverySession.id);
  }

  return recoverySession;
}