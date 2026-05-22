export type WorkstationStatus = {
  cpu: string;
  ram: string;
  gpu: string;

  audioDevice: string;
  sampleRate: string;
  latency: string;
  bufferSize: string;

  activeProject: string;
  activeSession: string;

  micState: "On" | "Off";
  tunerState: "Idle" | "Listening" | "Muted";
  storageState: "NAS Online" | "Local Fallback" | "Offline";
  recoveryState: string;
  logState: string;
};