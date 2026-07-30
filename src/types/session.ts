export interface Session {
  id: number;
  project_id: number;
  name: string;
  notes?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  active_workspace?: string | null;
  signal_chain_id?: number | null;
  rig_snapshot_json?: string | null;
}

export interface SessionWorkspaceState {
  activeProjectId: number | null;
  activeSessionId: number | null;
  activeModule: string | null;
  leftRailPinned: boolean;
  rightRailPinned: boolean;
  windowWidth: number | null;
  windowHeight: number | null;
  screenWidth: number | null;
  screenHeight: number | null;
  windowX: number | null;
  windowY: number | null;
  isMaximized: boolean;
  restoredWindowWidth: number | null;
  restoredWindowHeight: number | null;
  lastMonitorLabel: string | null;
  restoredAt: string | null;
}
