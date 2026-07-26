import { getDatabase } from "../../lib/database";

export type InstrumentSetup = {
  id: number;
  instrument_name: string;
  tuning: string;
  string_gauge: string;
  action_low: string;
  action_high: string;
  neck_relief: string;
  pickup_height: string;
  intonation_status: string;
  service_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type InstrumentSetupDraft = Omit<
  InstrumentSetup,
  "id" | "created_at" | "updated_at"
>;

export const defaultInstrumentSetup: InstrumentSetupDraft = {
  instrument_name: "",
  tuning: "E Standard",
  string_gauge: "10–46",
  action_low: "",
  action_high: "",
  neck_relief: "",
  pickup_height: "",
  intonation_status: "Not checked",
  service_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export async function getInstrumentSetups() {
  const database = await getDatabase();
  return database.select<InstrumentSetup[]>(
    "SELECT * FROM instrument_setups ORDER BY updated_at DESC"
  );
}

export async function createInstrumentSetup(draft: InstrumentSetupDraft) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const result = await database.execute(
    `
    INSERT INTO instrument_setups (
      instrument_name, tuning, string_gauge, action_low, action_high,
      neck_relief, pickup_height, intonation_status, service_date, notes,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      draft.instrument_name,
      draft.tuning,
      draft.string_gauge,
      draft.action_low,
      draft.action_high,
      draft.neck_relief,
      draft.pickup_height,
      draft.intonation_status,
      draft.service_date,
      draft.notes,
      now,
      now,
    ]
  );
  const rows = await database.select<InstrumentSetup[]>(
    "SELECT * FROM instrument_setups WHERE id = ? LIMIT 1",
    [result.lastInsertId]
  );
  return rows[0] ?? null;
}

export async function updateInstrumentSetup(
  id: number,
  draft: InstrumentSetupDraft
) {
  const database = await getDatabase();
  await database.execute(
    `
    UPDATE instrument_setups
    SET instrument_name = ?, tuning = ?, string_gauge = ?, action_low = ?,
        action_high = ?, neck_relief = ?, pickup_height = ?,
        intonation_status = ?, service_date = ?, notes = ?, updated_at = ?
    WHERE id = ?
    `,
    [
      draft.instrument_name,
      draft.tuning,
      draft.string_gauge,
      draft.action_low,
      draft.action_high,
      draft.neck_relief,
      draft.pickup_height,
      draft.intonation_status,
      draft.service_date,
      draft.notes,
      new Date().toISOString(),
      id,
    ]
  );
}

export async function deleteInstrumentSetup(id: number) {
  const database = await getDatabase();
  await database.execute("DELETE FROM instrument_setups WHERE id = ?", [id]);
}
