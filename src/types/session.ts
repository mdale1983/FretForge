export type Session = {
  id: number;
  project_id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export interface SessionWorkspaceState {
  activeProjectId: number | null;
  activeSessionId: number | null;
  activeModule: string | null;
  leftRailPinned: boolean;
  windowWidth: number | null;
  windowHeight: number | null;
  screenWidth: number | null;
  screenHeight: number | null;
  windowX: number | null;
  windowY: number | null;
  isMaximized: boolean;
  restoredAt: string | null;
}