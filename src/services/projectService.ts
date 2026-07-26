import { getDatabase } from "../lib/database";
import { Project } from "../types/project";
import { getAppState, setAppState } from "./AppStateService";
import {
  getOrCreateSessionForProject,
  setActiveSession,
} from "./SessionService";

// Project creation
export async function createProject(
  name: string,
  notes = ""
): Promise<Project | null> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.execute(
    `
    INSERT INTO projects (name, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?)
    `,
    [name, notes, now, now]
  );

  const projects = await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    WHERE name = ?
    ORDER BY created_at DESC
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

  const session = await getOrCreateSessionForProject(projectId);

  if (session) {
    await setActiveSession(session.id);
  }
}

export async function getActiveProjectId(): Promise<number | null> {
  const value = await getAppState("active_project_id");

  if (!value) {
    return null;
  }

  const projectId = Number(value);
  return Number.isFinite(projectId) ? projectId : null;
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

  const activeProjectId = await getActiveProjectId();

  if (activeProjectId === projectId) {
    await setAppState("active_project_id", "");
    await setAppState("active_session_id", "");
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
