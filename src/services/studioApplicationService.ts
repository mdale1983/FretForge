import { invoke } from "@tauri-apps/api/core";

export type StudioApplication = {
  id: string;
  name: string;
  path: string | null;
  installed: boolean;
  running: boolean;
  recommended: boolean;
  free: boolean;
  integration: string;
  download_url: string;
};

export type FretForgeLinkState = {
  instance_id: string;
  source_name: string;
  connected: boolean;
  installed: boolean;
  sample_rate: number;
  input_rms: number;
  input_peak: number;
  plugin_version: string;
  frequency: number;
  clarity: number;
};

export function listStudioApplications() {
  return invoke<StudioApplication[]>("list_studio_applications");
}

export function launchStudioApplication(id: string) {
  return invoke<void>("launch_studio_application", { id });
}

export function closeStudioApplication(id: string) {
  return invoke<boolean>("close_studio_application", { id });
}

export function getFretForgeLinkState(sourceId?: string) {
  return invoke<FretForgeLinkState>("get_fretforge_link_state", { sourceId });
}

export function listFretForgeLinkSources() {
  return invoke<FretForgeLinkState[]>("list_fretforge_link_sources");
}
