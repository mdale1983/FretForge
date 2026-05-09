import { getDatabase } from "../lib/database";

export async function setAppState(key: string, value: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.execute(
    `
    INSERT INTO app_state (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
    `,
    [key, value, now]
  );
}

export async function getAppState(key: string): Promise<string | null> {
  const db = await getDatabase();

  const rows = await db.select<{ value: string }[]>(
    `
    SELECT value
    FROM app_state
    WHERE key = ?
    LIMIT 1
    `,
    [key]
  );

  return rows.length > 0 ? rows[0].value : null;
}

export async function clearAppState(key: string) {
  const db = await getDatabase();

  await db.execute(
    `
    DELETE FROM app_state
    WHERE key = ?
    `,
    [key]
  );
}