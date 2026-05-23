export interface WorkstationTelemetry {
  cpu_usage: number;
  ram_used_mb: number;
  ram_total_mb: number;
  system_name: string;
  host_name: string;
  gpu_name: string;
  audio_device: string;
  sample_rate: string;
  buffer_size: string;
  latency: string;
}

export interface AudioDeviceInfo {
  name: string;
  is_default_output: boolean;
}