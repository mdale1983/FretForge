use serde::Serialize;
use std::sync::OnceLock;
use sysinfo::System;
use cpal::traits::{DeviceTrait, HostTrait};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[derive(Serialize)]
struct WorkstationTelemetry {
    cpu_usage: f32,
    ram_used_mb: u64,
    ram_total_mb: u64,
    system_name: String,
    host_name: String,
    gpu_name: String,
    audio_device: String,
    sample_rate: String,
    buffer_size: String,
    latency: String,
}

#[derive(Serialize)]
struct AudioDeviceInfo {
    name: String,
    is_default_output: bool,
    sample_rate: String,
}

struct CachedDeviceTelemetry {
    gpu_name: String,
    audio_device: String,
    sample_rate: String,
    buffer_size: String,
    latency: String,
}

static DEVICE_TELEMETRY_CACHE: OnceLock<CachedDeviceTelemetry> = OnceLock::new();

fn get_cached_device_telemetry() -> &'static CachedDeviceTelemetry {
    DEVICE_TELEMETRY_CACHE.get_or_init(|| CachedDeviceTelemetry {
        gpu_name: detect_gpu_name(),
        audio_device: detect_audio_device_cpal(),
        sample_rate: detect_sample_rate_cpal(),
        buffer_size: detect_buffer_size_cpal(),
        latency: "DAW Managed".to_string(),
    })
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg(target_os = "windows")]
fn detect_gpu_name() -> String {
    use std::process::Command;

    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "(Get-CimInstance Win32_VideoController | Select-Object -First 1 -ExpandProperty Name)",
        ])
        .output();

    match output {
        Ok(result) => {
            let gpu_name = String::from_utf8_lossy(&result.stdout).trim().to_string();

            if gpu_name.is_empty() {
                "GPU Unknown".to_string()
            } else {
                let gpu_name = gpu_name
                    .replace("NVIDIA GeForce ", "")
                    .replace("AMD Radeon ", "")
                    .replace("Intel(R) ", "")
                    .replace("Intel ", "");

                format!("GPU {}", gpu_name)
            }
        }
        Err(_) => "GPU Unknown".to_string(),
    }
}

fn detect_audio_device_cpal() -> String {
    let host = cpal::default_host();

    match host.default_output_device() {
        Some(device) => match device.name() {
            Ok(name) => name,
            Err(_) => "Audio Unknown".to_string(),
        },
        None => "No Audio Device".to_string(),
    }
}

#[tauri::command]
fn list_audio_output_devices() -> Vec<AudioDeviceInfo> {
    let host = cpal::default_host();

    let default_name = host
        .default_output_device()
        .and_then(|device| device.name().ok());

    let Ok(devices) = host.output_devices() else {
        return Vec::new();
    };

    devices
        .filter_map(|device| {
            let name = device.name().ok()?;

            let sample_rate = match device.default_output_config() {
                Ok(config) => format!("{} kHz", config.sample_rate().0 / 1000),
                Err(_) => "Rate Unknown".to_string(),
            };

            Some(AudioDeviceInfo {
                is_default_output: default_name.as_ref() == Some(&name),
                sample_rate,
                name,
            })
        })
        .collect()
}

fn detect_sample_rate_cpal() -> String {
    let host = cpal::default_host();

    let Some(device) = host.default_output_device() else {
        return "Rate Unknown".to_string();
    };

    match device.default_output_config() {
        Ok(config) => {
            let sample_rate = config.sample_rate().0;
            format!("{} kHz", sample_rate / 1000)
        }
        Err(_) => "Rate Unknown".to_string(),
    }
}

fn detect_buffer_size_cpal() -> String {
    let host = cpal::default_host();

    let Some(device) = host.default_output_device() else {
        return "DAW Managed".to_string();
    };

    match device.default_output_config() {
        Ok(config) => match config.buffer_size() {
            cpal::SupportedBufferSize::Range { min, max } => {
                if *min == 0 && *max > 1_000_000 {
                    "DAW Managed".to_string()
                } else {
                    format!("Buffer {}-{}", min, max)
                }
            }
            cpal::SupportedBufferSize::Unknown => {
                "DAW Managed".to_string()
            }
        },
        Err(_) => "DAW Managed".to_string(),
    }
}

#[cfg(not(target_os = "windows"))]
fn detect_gpu_name() -> String {
    "GPU Pending".to_string()
}

#[tauri::command]
fn get_workstation_telemetry() -> WorkstationTelemetry {
    let mut system = System::new_all();
    let device_telemetry = get_cached_device_telemetry();

    system.refresh_cpu_all();
    system.refresh_memory();

    WorkstationTelemetry {
        cpu_usage: system.global_cpu_usage(),
        ram_used_mb: system.used_memory() / 1024 / 1024,
        ram_total_mb: system.total_memory() / 1024 / 1024,
        system_name: System::name().unwrap_or_else(|| "Unknown OS".to_string()),
        host_name: System::host_name().unwrap_or_else(|| "Unknown Host".to_string()),
        gpu_name: device_telemetry.gpu_name.clone(),
        audio_device: device_telemetry.audio_device.clone(),
        sample_rate: device_telemetry.sample_rate.clone(),
        buffer_size: device_telemetry.buffer_size.clone(),
        latency: device_telemetry.latency.clone(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_workstation_telemetry,
            list_audio_output_devices
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}