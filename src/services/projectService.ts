import { getDatabase } from "../lib/database";
import { Project } from "../types/project";
import { clearAppState, getAppState, setAppState } from "./AppStateService";
import type { SignalChain } from "../features/signalforge/signalChainService";

// Project creation
export async function createProject(
  name: string,
  notes = "",
  tuning = "C# Standard",
  signalChain: SignalChain | null = null,
): Promise<Project | null> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.execute(
    `
    INSERT INTO projects (name, notes, tuning, signal_chain_id, rig_snapshot_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [name, notes, tuning, signalChain?.id ?? null, signalChain ? JSON.stringify({ source_chain_id: signalChain.id, name: signalChain.name, blocks: signalChain.blocks, notes: signalChain.notes, captured_at: now }) : null, now, now]
  );

  const projects = await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    WHERE name = ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [name]
  );

  return projects[0] ?? null;
}

// Active and completed project queries
export async function getProjects(): Promise<Project[]> {
  const db = await getDatabase();

  return await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    WHERE completed_at IS NULL
    ORDER BY updated_at DESC
    `
  );
}

export async function getCompletedProjects(): Promise<Project[]> {
  const db = await getDatabase();

  return await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    WHERE completed_at IS NOT NULL
    ORDER BY completed_at DESC
    `
  );
}

export async function getMostRecentProject(): Promise<Project | null> {
  const db = await getDatabase();

  const projects = await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    WHERE completed_at IS NULL
    ORDER BY updated_at DESC
    LIMIT 1
    `
  );

  return projects[0] ?? null;
}

// Active project coordination
export async function setActiveProject(projectId: number) {
  const db = await getDatabase();
  const matchingProjects = await db.select<{ id: number }[]>(
    `
    SELECT id
    FROM projects
    WHERE id = ?
      AND completed_at IS NULL
    LIMIT 1
    `,
    [projectId]
  );

  if (matchingProjects.length === 0) {
    throw new Error("Cannot activate a missing or completed project.");
  }

  const now = new Date().toISOString();

  await db.execute(
    `
    UPDATE projects
    SET updated_at = ?
    WHERE id = ?
      AND completed_at IS NULL
    `,
    [now, projectId]
  );

  await setAppState("active_project_id", String(projectId));

  const sessions = await db.select<{ id: number }[]>("SELECT id FROM sessions WHERE project_id = ? AND completed_at IS NULL ORDER BY updated_at DESC LIMIT 1", [projectId]);
  if (sessions[0]) await setAppState("active_session_id", String(sessions[0].id));
  else await clearAppState("active_session_id");
}

export async function getActiveProjectId(): Promise<number | null> {
  const value = await getAppState("active_project_id");

  if (!value) {
    return null;
  }

  const projectId = Number(value);

  if (!Number.isFinite(projectId)) {
    await clearAppState("active_project_id");
    return null;
  }

  const db = await getDatabase();
  const projects = await db.select<{ id: number }[]>(
    `
    SELECT id
    FROM projects
    WHERE id = ?
      AND completed_at IS NULL
    LIMIT 1
    `,
    [projectId]
  );

  if (projects.length === 0) {
    await clearAppState("active_project_id");
    return null;
  }

  return projectId;
}

export async function getProjectById(projectId: number): Promise<Project | null> {
  const db = await getDatabase();

  const projects = await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    WHERE id = ?
    LIMIT 1
    `,
    [projectId]
  );

  return projects.length > 0 ? projects[0] : null;
}

// Project validation and editable content
export async function projectNameExists(name: string): Promise<boolean> {
  const db = await getDatabase();

  const projects = await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    WHERE LOWER(name) = LOWER(?)
      AND completed_at IS NULL
    LIMIT 1
    `,
    [name]
  );

  return projects.length > 0;
}

export async function updateProjectNotes(projectId: number, notes: string) {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.execute(
    `
    UPDATE projects
    SET
      notes = ?,
      updated_at = ?
    WHERE id = ?
    `,
    [notes, now, projectId]
  );
}

// Project lifecycle
export async function completeProject(projectId: number) {
  const db = await getDatabase();
  const activeProjectId = await getActiveProjectId();

  const now = new Date().toISOString();

  await db.execute(
    `
    UPDATE projects
    SET
      completed_at = ?,
      updated_at = ?
    WHERE id = ?
    `,
    [now, now, projectId]
  );

  await db.execute(
    `
    UPDATE sessions
    SET
      completed_at = ?,
      updated_at = ?
    WHERE project_id = ?
      AND completed_at IS NULL
    `,
    [now, now, projectId]
  );

  if (activeProjectId === projectId) {
    await clearAppState("active_project_id");
    await clearAppState("active_session_id");
  }
}

export async function reopenProject(projectId: number) {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.execute(
    `
    UPDATE projects
    SET
      completed_at = NULL,
      updated_at = ?
    WHERE id = ?
    `,
    [now, projectId]
  );
}

export async function deleteProject(projectId: number) {
  const db = await getDatabase();
  const activeProjectId = await getActiveProjectId();

  await db.execute(
    `
    DELETE FROM sessions
    WHERE project_id = ?
    `,
    [projectId]
  );

  await db.execute(
    `
    DELETE FROM projects
    WHERE id = ?
    `,
    [projectId]
  );

  if (activeProjectId === projectId) {
    await clearAppState("active_project_id");
    await clearAppState("active_session_id");
    localStorage.removeItem("fretforge_workspace_state");
  }
}

export async function renameProject(projectId: number, newName: string) {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.execute(
    `
    UPDATE projects
    SET
      name = ?,
      updated_at = ?
    WHERE id = ?
    `,
    [newName, now, projectId]
  );
}
