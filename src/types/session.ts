export type Session = {
  id: number;
  project_id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export interface SessionWorkspaceState {
  activeProjectId: string | null;
  activeSessionId: string | null;
  activeModule: string | null;
  restoredAt: string | null;
}