import { getDatabase } from "../lib/database";
import { Project } from "../types/project";
import { getAppState, setAppState } from "./AppStateService";

export async function createProject(name: string): Promise<Project | null> {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.execute(
    `
    INSERT INTO projects (name, created_at, updated_at)
    VALUES (?, ?, ?)
    `,
    [name, now, now]
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

export async function getProjects(): Promise<Project[]> {
  const db = await getDatabase();

  const projects = await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    ORDER BY updated_at DESC
  `
  );

  return projects;
}

export async function getMostRecentProject(): Promise<Project | null> {
  const db = await getDatabase();

  const projects = await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    ORDER BY updated_at DESC
    LIMIT 1
    `
  );

  return projects[0] ?? null;
}

export async function setActiveProject(projectId: number) {
  await setAppState("active_project_id", String(projectId));
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

export async function projectNameExists(name: string): Promise<boolean> {
  const db = await getDatabase();

  const projects = await db.select<Project[]>(
    `
    SELECT *
    FROM projects
    WHERE LOWER(name) = LOWER(?)
    LIMIT 1
    `,
    [name]
  );

  return projects.length > 0;
}

export async function deleteProject(projectId: number) {
  const db = await getDatabase();

  await db.execute(
    `
    DELETE FROM projects
    WHERE id = ?
    `,
    [projectId]
  );
}

export async function renameProject(
  projectId: number,
  newName: string
) {
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