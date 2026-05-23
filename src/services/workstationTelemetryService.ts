import { invoke } from "@tauri-apps/api/core";
import {
  AudioDeviceInfo,
  WorkstationTelemetry,
} from "../types/WorkstationTelemetry";

export type { AudioDeviceInfo };

export async function getWorkstationTelemetry() {
  return await invoke<WorkstationTelemetry>("get_workstation_telemetry");
}

export async function listAudioOutputDevices() {
  return await invoke<AudioDeviceInfo[]>("list_audio_output_devices");
}