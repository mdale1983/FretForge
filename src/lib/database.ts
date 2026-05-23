import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDatabase() {
  if (db) return db;

  db = await Database.load("sqlite:fretforge.db");

  return db;
}

export async function initializeDatabase() {
  const database = await getDatabase();

  // Projects table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      notes TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  try {
    await database.execute(`
      ALTER TABLE projects
      ADD COLUMN notes TEXT
    `);
  } catch {
    // Column already exists
  }

  try {
    await database.execute(`
      ALTER TABLE projects
      ADD COLUMN completed_at TEXT
    `);
  } catch {
    // Column already exists
  }

  await database.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Sessions table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      notes TEXT,
      completed_at TEXT,
      active_workspace TEXT NOT NULL DEFAULT 'forge',
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
  `);

  try {
    await database.execute(`
      ALTER TABLE sessions
      ADD COLUMN active_workspace TEXT NOT NULL DEFAULT 'forge'
    `);
  } catch {
    // Column already exists
  }

  try {
    await database.execute(`
      ALTER TABLE sessions
      ADD COLUMN notes TEXT
    `);
  } catch {
    // Column already exists
  }

  try {
    await database.execute(`
      ALTER TABLE sessions
      ADD COLUMN completed_at TEXT
    `);
  } catch {
    // Column already exists
  }

  console.log("FretForge database initialized.");
}