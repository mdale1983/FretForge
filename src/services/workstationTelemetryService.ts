import { invoke } from "@tauri-apps/api/core";
import type { WorkstationTelemetry } from "../types/WorkstationTelemetry";

export async function getWorkstationTelemetry(): Promise<WorkstationTelemetry> {
  return await invoke<WorkstationTelemetry>("get_workstation_telemetry");
}