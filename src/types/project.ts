export interface Project {
  id: number;
  name: string;
  notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  project_id: number;
  name: string;
  notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}