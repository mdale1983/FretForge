import { invoke } from "@tauri-apps/api/core";

export type NativeVoiceCoachVoice = {
  name: string;
  lang: string;
  local: boolean;
};

export function listVoiceCoachVoices() {
  return invoke<NativeVoiceCoachVoice[]>("list_voice_coach_voices");
}

export async function synthesizeVoiceCoachAudio(
  message: string,
  voiceName: string,
  rate: number,
  pitch: number,
  volume: number
) {
  const bytes = await invoke<number[]>("synthesize_voice_coach_audio", {
    message,
    voiceName: voiceName || null,
    rate,
    pitch,
    volume,
  });
  return new Blob([new Uint8Array(bytes)], { type: "audio/wav" });
}
