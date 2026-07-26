import { getDatabase } from "../../lib/database";

export type TonePreset = {
  id: number;
  name: string;
  amp_model: string;
  gain: number;
  bass: number;
  mids: number;
  treble: number;
  presence: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type TonePresetDraft = Omit<
  TonePreset,
  "id" | "created_at" | "updated_at"
>;

export const defaultTonePreset: TonePresetDraft = {
  name: "New Tone",
  amp_model: "5150-style high gain",
  gain: 5,
  bass: 5,
  mids: 5,
  treble: 5,
  presence: 5,
  notes: "",
};

export async function getTonePresets() {
  const database = await getDatabase();
  return database.select<TonePreset[]>(
    "SELECT * FROM tone_presets ORDER BY updated_at DESC"
  );
}

export async function createTonePreset(draft: TonePresetDraft) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const result = await database.execute(
    `
    INSERT INTO tone_presets (
      name, amp_model, gain, bass, mids, treble, presence, notes,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      draft.name,
      draft.amp_model,
      draft.gain,
      draft.bass,
      draft.mids,
      draft.treble,
      draft.presence,
      draft.notes,
      now,
      now,
    ]
  );

  const rows = await database.select<TonePreset[]>(
    "SELECT * FROM tone_presets WHERE id = ? LIMIT 1",
    [result.lastInsertId]
  );
  return rows[0] ?? null;
}

export async function updateTonePreset(id: number, draft: TonePresetDraft) {
  const database = await getDatabase();
  await database.execute(
    `
    UPDATE tone_presets
    SET name = ?, amp_model = ?, gain = ?, bass = ?, mids = ?, treble = ?,
        presence = ?, notes = ?, updated_at = ?
    WHERE id = ?
    `,
    [
      draft.name,
      draft.amp_model,
      draft.gain,
      draft.bass,
      draft.mids,
      draft.treble,
      draft.presence,
      draft.notes,
      new Date().toISOString(),
      id,
    ]
  );
}

export async function deleteTonePreset(id: number) {
  const database = await getDatabase();
  await database.execute("DELETE FROM tone_presets WHERE id = ?", [id]);
}
