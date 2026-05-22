import type { WorkstationStatus } from "../types/WorkstationStatus";

export const defaultWorkstationStatus: WorkstationStatus = {
  cpu: "CPU --",
  ram: "RAM --",
  gpu: "GPU --",

  audioDevice: "Audio: Not detected",
  sampleRate: "48 kHz",
  latency: "-- ms",

  activeProject: "No project selected",
  activeSession: "No active session",

  micState: "Off",
  tunerState: "Idle",
  storageState: "NAS Online",
  recoveryState: "Workspace Restorable",
  logState: "Clean",
};