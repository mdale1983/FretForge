import Database from "@tauri-apps/plugin-sql";

let databasePromise: Promise<Database> | null = null;

export async function getDatabase() {
  databasePromise ??= Database.load("sqlite:fretforge.db");
  return databasePromise;
}

async function addColumnIfMissing(
  database: Database,
  table: "projects" | "sessions",
  column: string,
  definition: string
) {
  const columns = await database.select<{ name: string }[]>(
    `PRAGMA table_info(${table})`
  );

  if (!columns.some((existingColumn) => existingColumn.name === column)) {
    await database.execute(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
    );
  }
}

export async function initializeDatabase() {
  const database = await getDatabase();

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

  await addColumnIfMissing(database, "projects", "notes", "TEXT");
  await addColumnIfMissing(database, "projects", "completed_at", "TEXT");

  await database.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

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

  await addColumnIfMissing(
    database,
    "sessions",
    "active_workspace",
    "TEXT NOT NULL DEFAULT 'forge'"
  );
  await addColumnIfMissing(database, "sessions", "notes", "TEXT");
  await addColumnIfMissing(database, "sessions", "completed_at", "TEXT");

  await database.execute(`
    CREATE TABLE IF NOT EXISTS forgepulse_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      session_id INTEGER,
      mode TEXT NOT NULL,
      bpm INTEGER NOT NULL,
      subdivision TEXT NOT NULL,
      time_signature TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id),
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS tone_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amp_model TEXT NOT NULL,
      gain INTEGER NOT NULL,
      bass INTEGER NOT NULL,
      mids INTEGER NOT NULL,
      treble INTEGER NOT NULL,
      presence INTEGER NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS signal_chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      chain_json TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}
