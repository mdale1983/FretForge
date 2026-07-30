import { getDatabase } from "../../lib/database";

export type SignalBlockType =
  | "instrument"
  | "wireless"
  | "tuner"
  | "noise_gate"
  | "compressor"
  | "overdrive"
  | "distortion"
  | "delay"
  | "eq"
  | "pedal"
  | "amp"
  | "cab"
  | "interface"
  | "daw";

export type SignalBlock = {
  id: string;
  type: SignalBlockType;
  label: string;
  bypassed: boolean;
  pickupCount?: 1 | 2 | 3;
  pickupTechnology?: "active" | "passive";
  pickupModel?: string;
};

export type SignalChain = {
  id: number;
  name: string;
  blocks: SignalBlock[];
  notes: string;
  created_at: string;
  updated_at: string;
};

type SignalChainRow = Omit<SignalChain, "blocks"> & { chain_json: string };

export const defaultSignalBlocks: SignalBlock[] = [
  { id: "instrument", type: "instrument", label: "Guitar / Pickups", bypassed: false },
  { id: "wireless", type: "wireless", label: "Wireless System", bypassed: false },
  { id: "tuner", type: "tuner", label: "Tuner", bypassed: false },
  { id: "noise-gate", type: "noise_gate", label: "Noise Gate", bypassed: false },
  { id: "overdrive", type: "overdrive", label: "Overdrive / Boost", bypassed: false },
  { id: "eq", type: "eq", label: "Pedal EQ", bypassed: false },
  { id: "interface", type: "interface", label: "Audio Interface", bypassed: false },
];

export const emptySignalBlocks: SignalBlock[] = [];

function parseChain(row: SignalChainRow): SignalChain {
  let blocks = defaultSignalBlocks;

  try {
    const parsed = JSON.parse(row.chain_json);
    if (Array.isArray(parsed)) blocks = (parsed as SignalBlock[]).map((storedBlock) => {
      const block = { ...storedBlock, bypassed: Boolean(storedBlock.bypassed) };
      if (block.type !== "instrument" || block.pickupCount) return block;
      const active = /\b(emg|fishman|blackouts?)\b/i.test(block.label);
      const pickupCount = /single|1 pickup/i.test(block.label) ? 1 : /three|3 pickup/i.test(block.label) ? 3 : 2;
      return {
        ...block,
        pickupCount,
        pickupTechnology: active ? "active" : "passive",
        pickupModel: active ? block.label : undefined,
      };
    });
  } catch {
    blocks = defaultSignalBlocks;
  }

  return { ...row, blocks };
}

export async function getSignalChains() {
  const database = await getDatabase();
  const rows = await database.select<SignalChainRow[]>(
    "SELECT * FROM signal_chains ORDER BY updated_at DESC"
  );
  return rows.map(parseChain);
}

export async function createSignalChain(
  name: string,
  blocks = defaultSignalBlocks,
  notes = ""
) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const result = await database.execute(
    `
    INSERT INTO signal_chains (name, chain_json, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    `,
    [name, JSON.stringify(blocks), notes, now, now]
  );
  const rows = await database.select<SignalChainRow[]>(
    "SELECT * FROM signal_chains WHERE id = ? LIMIT 1",
    [result.lastInsertId]
  );
  return rows[0] ? parseChain(rows[0]) : null;
}

export async function updateSignalChain(
  id: number,
  name: string,
  blocks: SignalBlock[],
  notes: string
) {
  const database = await getDatabase();
  await database.execute(
    `
    UPDATE signal_chains
    SET name = ?, chain_json = ?, notes = ?, updated_at = ?
    WHERE id = ?
    `,
    [name, JSON.stringify(blocks), notes, new Date().toISOString(), id]
  );
}

export async function deleteSignalChain(id: number) {
  const database = await getDatabase();
  await database.execute("DELETE FROM signal_chains WHERE id = ?", [id]);
}
