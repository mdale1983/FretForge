import { invoke } from "@tauri-apps/api/core";

export type AmpSimulator = {
  id: string;
  name: string;
  installed: boolean;
  standalone_path: string | null;
  plugin_paths: string[];
  recommended_role: string;
  download_url: string;
};

export function listAmpSimulators() {
  return invoke<AmpSimulator[]>("list_amp_simulators");
}
