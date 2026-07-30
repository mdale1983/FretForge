export interface Project {
  id: number;
  name: string;
  notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  tuning?: string | null;
  signal_chain_id?: number | null;
  rig_snapshot_json?: string | null;
}
