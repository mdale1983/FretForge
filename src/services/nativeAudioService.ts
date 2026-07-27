import { invoke } from "@tauri-apps/api/core";

export type NativeTunerState = {
  frequency: number | null;
  clarity: number;
  input_level: number;
  channel_levels: number[];
  active_channel: number;
};

export type NativeInputDevice = {
  name: string;
  is_default_input: boolean;
  sample_rate: string;
};

export function listNativeAudioInputs() {
  return invoke<NativeInputDevice[]>("list_audio_input_devices");
}

export function startNativeAudioMonitor(deviceName: string, inputDeviceName: string, volume: number) {
  return invoke<string>("start_audio_monitor", {
    deviceName,
    inputDeviceName,
    volume,
  });
}

export function setNativeAudioMonitorVolume(volume: number) {
  return invoke<void>("set_audio_monitor_volume", { volume });
}

export function stopNativeAudioMonitor() {
  return invoke<void>("stop_audio_monitor");
}

export function testNativeAudioOutput(deviceName: string) {
  return invoke<string>("test_audio_output", { deviceName });
}

export function getNativeTunerState() {
  return invoke<NativeTunerState>("get_native_tuner_state");
}

export function pushNativeAudioSamples(samples: number[]) {
  return invoke<void>("push_audio_samples", { samples });
}
