import { useEffect, useState } from "react";
import { defaultWorkstationStatus } from "../data/defaultWorkstationStatus";
import {
  AudioDeviceInfo,
  getWorkstationTelemetry,
  listAudioOutputDevices,
} from "../services/workstationTelemetryService";
import { audioPreferenceChangedEvent } from "../services/audioRoutingService";

export function useWorkstationTelemetry() {
  // Current telemetry snapshot and audio-device preference
  const [workstationStatus, setWorkstationStatus] = useState(
    defaultWorkstationStatus
  );

  const [audioDevices, setAudioDevices] = useState<AudioDeviceInfo[]>([]);

  const [selectedAudioDevice, setSelectedAudioDevice] = useState(
    localStorage.getItem("fretforge.selectedAudioDevice") ?? ""
  );

  async function refreshSystemTelemetry() {
    try {
      const telemetry = await getWorkstationTelemetry();
      const detectedAudioDevices = await listAudioOutputDevices();

      setAudioDevices(detectedAudioDevices);

      const preferredAudioDevice =
        detectedAudioDevices.find(
          (device) => device.name === selectedAudioDevice
        ) ?? detectedAudioDevices.find((device) => device.is_default_output);

      setWorkstationStatus((previousStatus) => ({
        ...previousStatus,
        cpu: `CPU ${telemetry.cpu_usage.toFixed(0)}%`,
        ram: `RAM ${(telemetry.ram_used_mb / 1024).toFixed(1)} / ${(
          telemetry.ram_total_mb / 1024
        ).toFixed(1)} GB`,
        gpu: telemetry.gpu_name,
        audioDevice: preferredAudioDevice?.name ?? telemetry.audio_device,
        sampleRate:
          preferredAudioDevice?.sample_rate ?? telemetry.sample_rate,
        bufferSize: telemetry.buffer_size,
        latency: telemetry.latency,
      }));
    } catch (error) {
      console.error("Telemetry refresh failed:", error);
    }
  }

  // Refresh hardware telemetry while the application is open
  useEffect(() => {
    refreshSystemTelemetry();

    const telemetryInterval = window.setInterval(() => {
      refreshSystemTelemetry();
    }, 5000);

    return () => {
      window.clearInterval(telemetryInterval);
    };
  }, [selectedAudioDevice]);

  // Keep the selected output device across launches
  useEffect(() => {
    localStorage.setItem(
      "fretforge.selectedAudioDevice",
      selectedAudioDevice
    );
    window.dispatchEvent(new CustomEvent(audioPreferenceChangedEvent));
  }, [selectedAudioDevice]);

  return {
    workstationStatus,
    setWorkstationStatus,
    audioDevices,
    selectedAudioDevice,
    setSelectedAudioDevice,
    refreshSystemTelemetry,
  };
}
