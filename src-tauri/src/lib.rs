use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::{mpsc, Arc, Mutex, OnceLock};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::path::{Path, PathBuf};
use std::process::Command;
use sysinfo::System;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{FromSample, Sample, SampleFormat, SizedSample, Stream};

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
static AUDIO_COMMANDS: OnceLock<mpsc::Sender<AudioCommand>> = OnceLock::new();

struct NativeAudioMonitor {
    _input_stream: Stream,
    _output_stream: Stream,
    playback_queue: Arc<Mutex<VecDeque<f32>>>,
    volume: Arc<Mutex<f32>>,
    analysis: Arc<Mutex<VecDeque<f32>>>,
    channel_levels: Arc<Mutex<Vec<f32>>>,
    active_channel: Arc<AtomicUsize>,
    test_samples_remaining: Arc<AtomicUsize>,
    sample_rate: u32,
}

#[derive(Serialize)]
struct AudioInputDeviceInfo {
    name: String,
    is_default_input: bool,
    sample_rate: String,
}

#[derive(Serialize)]
struct StudioApplicationInfo {
    id: String,
    name: String,
    path: Option<String>,
    installed: bool,
    running: bool,
    recommended: bool,
    free: bool,
    integration: String,
    download_url: String,
}

#[derive(Clone, Deserialize)]
struct FretForgeLinkTelemetry {
    connected: bool,
    timestamp_ms: u64,
    sample_rate: f64,
    input_rms: f64,
    input_peak: f64,
    plugin_version: String,
    #[serde(default)]
    frequency: f64,
    #[serde(default)]
    clarity: f64,
    #[serde(default = "legacy_link_id")]
    instance_id: String,
    #[serde(default = "default_link_source_name")]
    source_name: String,
    #[serde(default)]
    attacks: Vec<FretForgeAttackTelemetry>,
}

#[derive(Clone, Deserialize, Serialize)]
struct FretForgeAttackTelemetry {
    sequence: u64,
    timestamp_ms: i64,
    strength: f32,
}

fn legacy_link_id() -> String { "legacy".to_string() }
fn default_link_source_name() -> String { "FretForge Link".to_string() }

static FRET_FORGE_LINK_CACHE: OnceLock<Mutex<HashMap<String, FretForgeLinkTelemetry>>> = OnceLock::new();

#[derive(Serialize)]
struct FretForgeLinkState {
    instance_id: String,
    source_name: String,
    connected: bool,
    installed: bool,
    sample_rate: f64,
    input_rms: f64,
    input_peak: f64,
    plugin_version: String,
    frequency: f64,
    clarity: f64,
    attacks: Vec<FretForgeAttackTelemetry>,
}

struct StudioApplicationDefinition {
    id: &'static str,
    name: &'static str,
    process_names: &'static [&'static str],
    relative_paths: &'static [&'static str],
    recommended: bool,
    free: bool,
    integration: &'static str,
    download_url: &'static str,
}

#[derive(Serialize)]
struct AmpSimulatorInfo {
    id: String,
    name: String,
    installed: bool,
    standalone_path: Option<String>,
    plugin_paths: Vec<String>,
    recommended_role: String,
    download_url: String,
}

struct AmpSimulatorDefinition {
    id: &'static str,
    name: &'static str,
    standalone_paths: &'static [&'static str],
    plugin_tokens: &'static [&'static str],
    recommended_role: &'static str,
    download_url: &'static str,
}

const AMP_SIMULATORS: &[AmpSimulatorDefinition] = &[
    AmpSimulatorDefinition { id: "amplitube", name: "AmpliTube 5",
        standalone_paths: &["IK Multimedia\\AmpliTube 5\\AmpliTube 5.exe"],
        plugin_tokens: &["amplitube 5"], recommended_role: "Full amp, cabinet, and effects rig",
        download_url: "https://www.ikmultimedia.com/products/amplitube5/" },
    AmpSimulatorDefinition { id: "tonex", name: "TONEX",
        standalone_paths: &["IK Multimedia\\TONEX\\TONEX.exe"], plugin_tokens: &["tonex"],
        recommended_role: "Captured amps, cabinets, and drive tones",
        download_url: "https://www.ikmultimedia.com/products/tonex/" },
    AmpSimulatorDefinition { id: "guitar-rig", name: "Guitar Rig 7",
        standalone_paths: &["Native Instruments\\Guitar Rig 7\\Guitar Rig 7.exe"],
        plugin_tokens: &["guitar rig 7"], recommended_role: "Modular amps and creative effects",
        download_url: "https://www.native-instruments.com/products/komplete/guitar/guitar-rig-7-pro/" },
    AmpSimulatorDefinition { id: "neural-dsp", name: "Neural DSP Plug-ins",
        standalone_paths: &[], plugin_tokens: &["archetype", "fortin", "soldano", "mesa boogie", "morgan amps", "tone king"],
        recommended_role: "Artist and amplifier-specific guitar suites",
        download_url: "https://neuraldsp.com/plugins" },
    AmpSimulatorDefinition { id: "helix-native", name: "Helix Native",
        standalone_paths: &[], plugin_tokens: &["helix native"], recommended_role: "Helix amp and effects ecosystem",
        download_url: "https://line6.com/helix/helixnative.html" },
    AmpSimulatorDefinition { id: "bias-fx", name: "BIAS FX 2",
        standalone_paths: &["PositiveGrid\\BIAS FX 2\\BIAS FX 2.exe"], plugin_tokens: &["bias fx 2"],
        recommended_role: "Amp, pedalboard, and effects environment",
        download_url: "https://www.positivegrid.com/products/bias-fx-2" },
];

const STUDIO_APPLICATIONS: &[StudioApplicationDefinition] = &[
    StudioApplicationDefinition {
        id: "reaper", name: "REAPER", process_names: &["reaper"],
        relative_paths: &["REAPER (x64)\\reaper.exe", "REAPER\\reaper.exe"],
        recommended: true, free: false, integration: "FretForge Link + guided setup",
        download_url: "https://www.reaper.fm/download.php",
    },
    StudioApplicationDefinition {
        id: "cakewalk", name: "Cakewalk Sonar", process_names: &["Cakewalk"],
        relative_paths: &["Cakewalk\\Cakewalk Core\\Cakewalk.exe", "Cakewalk\\Sonar\\Cakewalk.exe"],
        recommended: false, free: true, integration: "FretForge Link + guided setup",
        download_url: "https://www.cakewalk.com/sonar",
    },
    StudioApplicationDefinition {
        id: "waveform", name: "Waveform Free", process_names: &["Waveform", "Waveform 14", "Waveform 13", "Waveform 12"],
        relative_paths: &["Tracktion\\Waveform 14\\Waveform 14.exe", "Tracktion\\Waveform 13\\Waveform 13.exe", "Tracktion\\Waveform 12\\Waveform 12.exe"],
        recommended: false, free: true, integration: "FretForge Link + guided setup",
        download_url: "https://www.tracktion.com/products/waveform-free",
    },
];

#[derive(Clone, Serialize)]
struct NativeTunerState {
    frequency: Option<f32>,
    clarity: f32,
    input_level: f32,
    channel_levels: Vec<f32>,
    active_channel: usize,
}

enum AudioCommand {
    Start {
        device_name: String,
        input_device_name: String,
        volume: f32,
        reply: mpsc::SyncSender<Result<String, String>>,
    },
    SetVolume {
        volume: f32,
        reply: mpsc::SyncSender<Result<(), String>>,
    },
    Stop {
        reply: mpsc::SyncSender<Result<(), String>>,
    },
    Test {
        device_name: String,
        reply: mpsc::SyncSender<Result<String, String>>,
    },
    GetTunerState {
        reply: mpsc::SyncSender<Result<NativeTunerState, String>>,
    },
    PushSamples {
        samples: Vec<f32>,
    },
}

fn device_words(name: &str) -> Vec<String> {
    name.to_lowercase()
        .split(|character: char| !character.is_ascii_alphanumeric())
        .filter(|word| word.len() > 1)
        .filter(|word| {
            !matches!(
                *word,
                "audio" | "device" | "input" | "output" | "line" | "speakers"
                    | "microphone" | "headphones" | "default" | "digital"
            )
        })
        .map(str::to_string)
        .collect()
}

fn device_match_score(candidate: &str, preferred: &str) -> usize {
    let candidate_words = device_words(candidate);
    let preferred_words = device_words(preferred);
    candidate_words
        .iter()
        .filter(|word| preferred_words.contains(word))
        .count()
}

fn find_named_output_device(name: &str) -> Result<cpal::Device, String> {
    let host = cpal::host_from_id(cpal::HostId::Asio)
        .map_err(|error| format!("Could not initialize ASIO: {error}"))?;
    let devices = host
        .output_devices()
        .map_err(|error| format!("Could not list output devices: {error}"))?;
    let mut best_match = None;
    let mut best_score = 0;

    for device in devices {
        let Ok(device_name) = device.name() else { continue };
        if device_name.eq_ignore_ascii_case(name) {
            return Ok(device);
        }

        let score = device_match_score(&device_name, name);
        if score > best_score {
            best_match = Some(device);
            best_score = score;
        }
    }

    best_match.filter(|_| best_score > 0)
        .or_else(|| host.default_output_device())
        .ok_or_else(|| format!("No ASIO driver matching '{name}' is available."))
}

fn find_matching_input_device(name: &str) -> Result<cpal::Device, String> {
    let host = cpal::default_host();
    let devices = host
        .input_devices()
        .map_err(|error| format!("Could not list input devices: {error}"))?;
    let mut best_match = None;
    let mut best_score = 0;

    for device in devices {
        let Ok(device_name) = device.name() else { continue };
        let score = device_match_score(&device_name, name);
        if score > best_score {
            best_match = Some(device);
            best_score = score;
        }
    }

    best_match.filter(|_| best_score > 0).ok_or_else(|| {
        format!("No recording input matching '{name}' was found.")
    })
}

fn find_named_input_device(name: &str) -> Result<cpal::Device, String> {
    let host = cpal::default_host();
    host.input_devices()
        .map_err(|error| format!("Could not list input devices: {error}"))?
        .find(|device| device.name().is_ok_and(|device_name| device_name.eq_ignore_ascii_case(name)))
        .ok_or_else(|| format!("The selected input device '{name}' is unavailable to native audio."))
}

fn build_input_stream<T>(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    samples: Arc<Mutex<VecDeque<f32>>>,
    capacity: usize,
    analysis: Arc<Mutex<VecDeque<f32>>>,
    input_sample_rate: u32,
    output_sample_rate: u32,
    channel_levels: Arc<Mutex<Vec<f32>>>,
    active_channel: Arc<AtomicUsize>,
) -> Result<Stream, String>
where
    T: SizedSample + Sample,
    f32: FromSample<T>,
{
    let channels = config.channels as usize;
    let mut resample_accumulator = 0_u64;
    device
        .build_input_stream(
            config,
            move |data: &[T], _| {
                let frame_count = data.len() / channels;
                if frame_count == 0 {
                    return;
                }
                let mut sums = vec![0.0_f32; channels];
                for frame in data.chunks_exact(channels) {
                    for (channel, sample) in frame.iter().enumerate() {
                        let value = sample.to_sample::<f32>();
                        sums[channel] += value * value;
                    }
                }
                let levels = sums
                    .into_iter()
                    .map(|sum| (sum / frame_count as f32).sqrt())
                    .collect::<Vec<_>>();
                let selected_channel = levels
                    .iter()
                    .enumerate()
                    .max_by(|(_, left), (_, right)| {
                        left.partial_cmp(right).unwrap_or(std::cmp::Ordering::Equal)
                    })
                    .map(|(channel, _)| channel)
                    .unwrap_or(0);
                if let Ok(mut current_levels) = channel_levels.lock() {
                    *current_levels = levels;
                }
                active_channel.store(selected_channel, Ordering::Relaxed);

                let Ok(mut queue) = samples.lock() else { return };
                let Ok(mut analysis_buffer) = analysis.lock() else { return };
                for frame in data.chunks_exact(channels) {
                    let mono = frame[selected_channel].to_sample::<f32>();

                    resample_accumulator += output_sample_rate as u64;
                    while resample_accumulator >= input_sample_rate as u64 {
                        resample_accumulator -= input_sample_rate as u64;
                        if queue.len() >= capacity {
                            queue.pop_front();
                        }
                        queue.push_back(mono);
                        if analysis_buffer.len() >= 4_096 {
                            analysis_buffer.pop_front();
                        }
                        analysis_buffer.push_back(mono);
                    }
                }
            },
            move |error| eprintln!("Native monitor input error: {error}"),
            None,
        )
        .map_err(|error| format!("Could not open the selected input: {error}"))
}

fn build_output_stream<T>(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    samples: Arc<Mutex<VecDeque<f32>>>,
    volume: Arc<Mutex<f32>>,
    test_samples_remaining: Arc<AtomicUsize>,
) -> Result<Stream, String>
where
    T: SizedSample + Sample + FromSample<f32>,
{
    let channels = config.channels as usize;
    let sample_rate = config.sample_rate.0 as f32;
    let mut test_phase = 0.0_f32;
    device
        .build_output_stream(
            config,
            move |data: &mut [T], _| {
                let level = volume.lock().map(|value| *value).unwrap_or(0.0);
                let Ok(mut queue) = samples.lock() else {
                    data.fill(T::from_sample(0.0));
                    return;
                };

                for frame in data.chunks_mut(channels) {
                    let test_remaining = test_samples_remaining.load(Ordering::Relaxed);
                    let sample = if test_remaining > 0 {
                        test_samples_remaining.fetch_sub(1, Ordering::Relaxed);
                        let value = (test_phase * std::f32::consts::TAU).sin() * 0.25;
                        test_phase = (test_phase + 440.0 / sample_rate) % 1.0;
                        value
                    } else {
                        queue.pop_front().unwrap_or(0.0) * level
                    };
                    for (channel_index, channel) in frame.iter_mut().enumerate() {
                        *channel = T::from_sample(if channel_index < 2 { sample } else { 0.0 });
                    }
                }
            },
            move |error| eprintln!("Native monitor output error: {error}"),
            None,
        )
        .map_err(|error| format!("Could not open the selected output: {error}"))
}

fn create_audio_monitor(
    device_name: String,
    input_device_name: String,
    volume: f32,
) -> Result<(NativeAudioMonitor, String), String> {
    let output_device = find_named_output_device(&device_name)?;
    let output_name = output_device
        .name()
        .unwrap_or_else(|_| device_name.clone());
    let input_device = output_device.clone();
    let input_name = input_device.name().unwrap_or(input_device_name);
    let input_config = input_device.default_input_config()
        .map_err(|error| format!("Could not read ASIO input configuration: {error}"))?;
    let output_config = output_device.default_output_config()
        .map_err(|error| format!("Could not read ASIO output configuration: {error}"))?;
    if input_config.sample_format() != output_config.sample_format() {
        return Err("The ASIO input and output sample formats do not match.".to_string());
    }
    let mut input_stream_config: cpal::StreamConfig = input_config.clone().into();
    let mut output_stream_config: cpal::StreamConfig = output_config.clone().into();
    input_stream_config.buffer_size = cpal::BufferSize::Fixed(512);
    output_stream_config.buffer_size = cpal::BufferSize::Fixed(512);
    let queue = Arc::new(Mutex::new(VecDeque::from(vec![0.0; 1_024])));
    let analysis = Arc::new(Mutex::new(VecDeque::new()));
    let channel_levels = Arc::new(Mutex::new(vec![0.0; input_stream_config.channels as usize]));
    let active_channel = Arc::new(AtomicUsize::new(0));
    let test_samples_remaining = Arc::new(AtomicUsize::new(0));
    let level = Arc::new(Mutex::new(volume.clamp(0.0, 1.0)));
    let capacity = input_stream_config.sample_rate.0 as usize / 5;

    let output_stream = match input_config.sample_format() {
        SampleFormat::F32 => build_output_stream::<f32>(
            &output_device,
            &output_stream_config,
            queue.clone(),
            level.clone(),
            test_samples_remaining.clone(),
        )?,
        SampleFormat::I16 => build_output_stream::<i16>(
            &output_device,
            &output_stream_config,
            queue.clone(),
            level.clone(),
            test_samples_remaining.clone(),
        )?,
        SampleFormat::U16 => build_output_stream::<u16>(
            &output_device,
            &output_stream_config,
            queue.clone(),
            level.clone(),
            test_samples_remaining.clone(),
        )?,
        SampleFormat::I32 => build_output_stream::<i32>(&output_device, &output_stream_config, queue.clone(), level.clone(), test_samples_remaining.clone())?,
        format => return Err(format!("Unsupported ASIO output sample format: {format:?}")),
    };

    let input_stream = match input_config.sample_format() {
        SampleFormat::F32 => build_input_stream::<f32>(&input_device, &input_stream_config, queue.clone(), capacity, analysis.clone(), input_stream_config.sample_rate.0, input_stream_config.sample_rate.0, channel_levels.clone(), active_channel.clone())?,
        SampleFormat::I16 => build_input_stream::<i16>(&input_device, &input_stream_config, queue.clone(), capacity, analysis.clone(), input_stream_config.sample_rate.0, input_stream_config.sample_rate.0, channel_levels.clone(), active_channel.clone())?,
        SampleFormat::U16 => build_input_stream::<u16>(&input_device, &input_stream_config, queue.clone(), capacity, analysis.clone(), input_stream_config.sample_rate.0, input_stream_config.sample_rate.0, channel_levels.clone(), active_channel.clone())?,
        SampleFormat::I32 => build_input_stream::<i32>(&input_device, &input_stream_config, queue.clone(), capacity, analysis.clone(), input_stream_config.sample_rate.0, input_stream_config.sample_rate.0, channel_levels.clone(), active_channel.clone())?,
        format => return Err(format!("Unsupported ASIO input sample format: {format:?}")),
    };

    input_stream.play().map_err(|error| format!("Could not start ASIO input: {error}"))?;
    output_stream
        .play()
        .map_err(|error| format!("Could not start ASIO output: {error}"))?;
    let message = format!(
        "Monitoring {input_name} through {output_name} at {} Hz",
        input_stream_config.sample_rate.0
    );
    let monitor = NativeAudioMonitor {
        _input_stream: input_stream,
        _output_stream: output_stream,
        playback_queue: queue,
        volume: level,
        analysis,
        channel_levels,
        active_channel,
        test_samples_remaining,
        sample_rate: input_stream_config.sample_rate.0,
    };
    Ok((monitor, message))
}

fn play_test_tone<T>(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
) -> Result<(), String>
where
    T: SizedSample + Sample + FromSample<f32>,
{
    let channels = config.channels as usize;
    let sample_rate = config.sample_rate.0 as f32;
    let mut phase = 0.0_f32;
    let stream = device
        .build_output_stream(
            config,
            move |data: &mut [T], _| {
                for frame in data.chunks_mut(channels) {
                    let sample = (phase * std::f32::consts::TAU).sin() * 0.12;
                    phase = (phase + 440.0 / sample_rate) % 1.0;
                    for channel in frame {
                        *channel = T::from_sample(sample);
                    }
                }
            },
            move |error| eprintln!("Native test output error: {error}"),
            None,
        )
        .map_err(|error| format!("Could not open the selected output: {error}"))?;
    stream
        .play()
        .map_err(|error| format!("Could not play the output test: {error}"))?;
    std::thread::sleep(Duration::from_millis(450));
    Ok(())
}

fn test_audio_output_on_device(device_name: String) -> Result<String, String> {
    let device = find_named_output_device(&device_name)?;
    let resolved_name = device.name().unwrap_or(device_name);
    let supported_config = device
        .default_output_config()
        .map_err(|error| format!("Could not read output configuration: {error}"))?;
    let config: cpal::StreamConfig = supported_config.clone().into();

    match supported_config.sample_format() {
        SampleFormat::F32 => play_test_tone::<f32>(&device, &config)?,
        SampleFormat::I16 => play_test_tone::<i16>(&device, &config)?,
        SampleFormat::U16 => play_test_tone::<u16>(&device, &config)?,
        SampleFormat::I32 => play_test_tone::<i32>(&device, &config)?,
        format => return Err(format!("Unsupported output sample format: {format:?}")),
    }

    Ok(format!("Test tone played through {resolved_name}"))
}

fn analyze_native_pitch(monitor: &NativeAudioMonitor) -> Result<NativeTunerState, String> {
    let analysis = monitor
        .analysis
        .lock()
        .map_err(|_| "Native tuner samples are unavailable.".to_string())?;
    let samples: Vec<f32> = analysis.iter().rev().take(2_048).copied().collect();
    drop(analysis);

    if samples.len() < 1_024 {
        return Ok(NativeTunerState {
            frequency: None,
            clarity: 0.0,
            input_level: 0.0,
            channel_levels: monitor.channel_levels.lock().map(|levels| levels.clone()).unwrap_or_default(),
            active_channel: monitor.active_channel.load(Ordering::Relaxed) + 1,
        });
    }

    let input_level =
        (samples.iter().map(|sample| sample * sample).sum::<f32>() / samples.len() as f32)
            .sqrt();
    if input_level < 0.0025 {
        return Ok(NativeTunerState {
            frequency: None,
            clarity: 0.0,
            input_level,
            channel_levels: monitor.channel_levels.lock().map(|levels| levels.clone()).unwrap_or_default(),
            active_channel: monitor.active_channel.load(Ordering::Relaxed) + 1,
        });
    }

    let minimum_lag = (monitor.sample_rate / 1_200).max(1) as usize;
    let maximum_lag = ((monitor.sample_rate / 55) as usize).min(samples.len() - 1);
    let mut best_lag = 0;
    let mut best_correlation = 0.0_f32;

    for lag in minimum_lag..=maximum_lag {
        let mut correlation = 0.0;
        let mut left_energy = 0.0;
        let mut right_energy = 0.0;
        for index in 0..samples.len() - lag {
            let left = samples[index];
            let right = samples[index + lag];
            correlation += left * right;
            left_energy += left * left;
            right_energy += right * right;
        }
        let normalized = correlation / (left_energy * right_energy).sqrt().max(f32::EPSILON);
        if normalized > best_correlation {
            best_correlation = normalized;
            best_lag = lag;
        }
    }

    Ok(NativeTunerState {
        frequency: (best_lag > 0 && best_correlation >= 0.75)
            .then_some(monitor.sample_rate as f32 / best_lag as f32),
        clarity: best_correlation,
        input_level,
        channel_levels: monitor.channel_levels.lock().map(|levels| levels.clone()).unwrap_or_default(),
        active_channel: monitor.active_channel.load(Ordering::Relaxed) + 1,
    })
}

fn audio_command_sender() -> &'static mpsc::Sender<AudioCommand> {
    AUDIO_COMMANDS.get_or_init(|| {
        let (sender, receiver) = mpsc::channel();
        std::thread::spawn(move || {
            let mut monitor: Option<NativeAudioMonitor> = None;

            while let Ok(command) = receiver.recv() {
                match command {
                    AudioCommand::Start {
                        device_name,
                        input_device_name,
                        volume,
                        reply,
                    } => {
                        let result = create_audio_monitor(device_name, input_device_name, volume).map(
                            |(new_monitor, message)| {
                                monitor = Some(new_monitor);
                                message
                            },
                        );
                        let _ = reply.send(result);
                    }
                    AudioCommand::SetVolume { volume, reply } => {
                        let result = monitor
                            .as_ref()
                            .ok_or_else(|| "Native monitoring is not running.".to_string())
                            .and_then(|active_monitor| {
                                *active_monitor.volume.lock().map_err(|_| {
                                    "Native audio volume is unavailable.".to_string()
                                })? = volume.clamp(0.0, 1.0);
                                Ok(())
                            });
                        let _ = reply.send(result);
                    }
                    AudioCommand::Stop { reply } => {
                        monitor = None;
                        let _ = reply.send(Ok(()));
                    }
                    AudioCommand::Test { device_name, reply } => {
                        let result = if let Some(active_monitor) = monitor.as_ref() {
                            active_monitor.test_samples_remaining.store(
                                (active_monitor.sample_rate / 2) as usize,
                                Ordering::Relaxed,
                            );
                            Ok("Test tone played through the active native output.".to_string())
                        } else {
                            test_audio_output_on_device(device_name)
                        };
                        let _ = reply.send(result);
                    }
                    AudioCommand::GetTunerState { reply } => {
                        let result = monitor
                            .as_ref()
                            .ok_or_else(|| "Native tuner is not running.".to_string())
                            .and_then(analyze_native_pitch);
                        let _ = reply.send(result);
                    }
                    AudioCommand::PushSamples { samples } => {
                        if let Some(active_monitor) = monitor.as_ref() {
                            if let Ok(mut queue) = active_monitor.analysis.lock() {
                                for sample in &samples {
                                    if queue.len() >= 4_096 { queue.pop_front(); }
                                    queue.push_back(*sample);
                                }
                            }
                            if let Ok(mut playback) = active_monitor.playback_queue.lock() {
                                for sample in samples {
                                    if playback.len() >= active_monitor.sample_rate as usize / 5 {
                                        playback.pop_front();
                                    }
                                    playback.push_back(sample);
                                }
                            }
                        }
                    }
                }
            }
        });
        sender
    })
}

fn send_audio_command<T>(
    build_command: impl FnOnce(mpsc::SyncSender<Result<T, String>>) -> AudioCommand,
) -> Result<T, String> {
    let (reply_sender, reply_receiver) = mpsc::sync_channel(1);
    audio_command_sender()
        .send(build_command(reply_sender))
        .map_err(|_| "Native audio thread is unavailable.".to_string())?;
    reply_receiver
        .recv()
        .map_err(|_| "Native audio thread did not respond.".to_string())?
}

#[tauri::command]
fn start_audio_monitor(device_name: String, input_device_name: String, volume: f32) -> Result<String, String> {
    send_audio_command(|reply| AudioCommand::Start {
        device_name,
        input_device_name,
        volume,
        reply,
    })
}

#[tauri::command]
fn set_audio_monitor_volume(volume: f32) -> Result<(), String> {
    send_audio_command(|reply| AudioCommand::SetVolume { volume, reply })
}

#[tauri::command]
fn stop_audio_monitor() -> Result<(), String> {
    send_audio_command(|reply| AudioCommand::Stop { reply })
}

#[tauri::command]
fn test_audio_output(device_name: String) -> Result<String, String> {
    send_audio_command(|reply| AudioCommand::Test { device_name, reply })
}

#[tauri::command]
fn get_native_tuner_state() -> Result<NativeTunerState, String> {
    send_audio_command(|reply| AudioCommand::GetTunerState { reply })
}

#[tauri::command]
fn push_audio_samples(samples: Vec<f32>) -> Result<(), String> {
    audio_command_sender()
        .send(AudioCommand::PushSamples { samples })
        .map_err(|_| "Native audio thread is unavailable.".to_string())
}

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

#[tauri::command]
fn list_audio_input_devices() -> Vec<AudioInputDeviceInfo> {
    let host = cpal::default_host();
    let default_name = host.default_input_device().and_then(|device| device.name().ok());
    let Ok(devices) = host.input_devices() else { return Vec::new() };

    devices.filter_map(|device| {
        let name = device.name().ok()?;
        let sample_rate = device.default_input_config()
            .map(|config| format!("{} kHz", config.sample_rate().0 / 1000))
            .unwrap_or_else(|_| "Rate Unknown".to_string());
        Some(AudioInputDeviceInfo {
            is_default_input: default_name.as_ref() == Some(&name),
            sample_rate,
            name,
        })
    }).collect()
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

fn find_studio_application(definition: &StudioApplicationDefinition) -> Option<PathBuf> {
    let roots = [
        std::env::var_os("ProgramFiles").map(PathBuf::from),
        std::env::var_os("ProgramFiles(x86)").map(PathBuf::from),
        std::env::var_os("LOCALAPPDATA").map(PathBuf::from),
    ];
    for root in roots.into_iter().flatten() {
        for relative_path in definition.relative_paths {
            let candidate = root.join(relative_path);
            if candidate.is_file() { return Some(candidate); }
        }
    }
    None
}

fn studio_application_is_running(system: &System, definition: &StudioApplicationDefinition) -> bool {
    system.processes().values().any(|process| {
        let process_name = process.name().to_string_lossy();
        definition.process_names.iter().any(|candidate| {
            process_name.eq_ignore_ascii_case(candidate)
                || process_name.eq_ignore_ascii_case(&format!("{candidate}.exe"))
        })
    })
}

fn collect_audio_plugins(directory: &Path, depth: usize, plugins: &mut Vec<PathBuf>) {
    if depth == 0 { return; }
    let Ok(entries) = std::fs::read_dir(directory) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let extension = path.extension().and_then(|value| value.to_str()).unwrap_or_default();
        if extension.eq_ignore_ascii_case("vst3") || extension.eq_ignore_ascii_case("dll") {
            plugins.push(path);
        } else if path.is_dir() {
            collect_audio_plugins(&path, depth - 1, plugins);
        }
    }
}

#[tauri::command]
fn list_amp_simulators() -> Vec<AmpSimulatorInfo> {
    let plugin_roots = [
        std::env::var_os("CommonProgramFiles").map(PathBuf::from).map(|root| root.join("VST3")),
        std::env::var_os("LOCALAPPDATA").map(PathBuf::from).map(|root| root.join("Programs\\Common\\VST3")),
        std::env::var_os("ProgramFiles").map(PathBuf::from).map(|root| root.join("Steinberg\\VstPlugins")),
        std::env::var_os("ProgramFiles(x86)").map(PathBuf::from).map(|root| root.join("Steinberg\\VstPlugins")),
    ];
    let mut audio_plugins = Vec::new();
    for root in plugin_roots.into_iter().flatten() {
        collect_audio_plugins(&root, 5, &mut audio_plugins);
    }
    let application_roots = [
        std::env::var_os("ProgramFiles").map(PathBuf::from),
        std::env::var_os("ProgramFiles(x86)").map(PathBuf::from),
        std::env::var_os("LOCALAPPDATA").map(PathBuf::from).map(|root| root.join("Programs")),
    ];

    AMP_SIMULATORS.iter().map(|definition| {
        let standalone_path = application_roots.iter().flatten().find_map(|root| {
            definition.standalone_paths.iter().map(|relative| root.join(relative)).find(|path| path.is_file())
        });
        let plugin_paths = audio_plugins.iter().filter(|path| {
            let name = path.file_stem().and_then(|value| value.to_str()).unwrap_or_default().to_lowercase();
            definition.plugin_tokens.iter().any(|token| name.contains(token))
        }).map(|path| path.to_string_lossy().into_owned()).collect::<Vec<_>>();
        AmpSimulatorInfo {
            id: definition.id.to_string(), name: definition.name.to_string(),
            installed: standalone_path.is_some() || !plugin_paths.is_empty(),
            standalone_path: standalone_path.map(|path| path.to_string_lossy().into_owned()),
            plugin_paths, recommended_role: definition.recommended_role.to_string(),
            download_url: definition.download_url.to_string(),
        }
    }).collect()
}

#[tauri::command]
fn list_studio_applications() -> Vec<StudioApplicationInfo> {
    let system = System::new_all();
    STUDIO_APPLICATIONS.iter().map(|definition| {
        let path = find_studio_application(definition);
        StudioApplicationInfo {
            id: definition.id.to_string(), name: definition.name.to_string(),
            installed: path.is_some(), running: studio_application_is_running(&system, definition),
            path: path.map(|value| value.to_string_lossy().into_owned()),
            recommended: definition.recommended, free: definition.free,
            integration: definition.integration.to_string(), download_url: definition.download_url.to_string(),
        }
    }).collect()
}

#[tauri::command]
fn launch_studio_application(id: String) -> Result<(), String> {
    let definition = STUDIO_APPLICATIONS.iter().find(|definition| definition.id == id)
        .ok_or_else(|| "Unknown studio application.".to_string())?;
    let path = find_studio_application(definition)
        .ok_or_else(|| format!("{} is not installed in a recognized location.", definition.name))?;
    let _ = stop_audio_monitor();
    Command::new(&path).current_dir(path.parent().unwrap_or_else(|| Path::new("."))).spawn()
        .map_err(|error| format!("Could not launch {}: {error}", definition.name))?;
    Ok(())
}

#[tauri::command]
fn close_studio_application(id: String) -> Result<bool, String> {
    let definition = STUDIO_APPLICATIONS.iter().find(|definition| definition.id == id)
        .ok_or_else(|| "Unknown studio application.".to_string())?;
    let process_names = definition.process_names.iter()
        .map(|name| format!("'{}'", name.replace('\'', "''"))).collect::<Vec<_>>().join(",");
    let script = format!("$closed=$false; Get-Process -Name @({process_names}) -ErrorAction SilentlyContinue | ForEach-Object {{ if ($_.CloseMainWindow()) {{ $closed=$true }} }}; Write-Output $closed");
    let output = Command::new("powershell").args(["-NoProfile", "-Command", &script]).output()
        .map_err(|error| format!("Could not request {} to close: {error}", definition.name))?;
    Ok(String::from_utf8_lossy(&output.stdout).trim().eq_ignore_ascii_case("true"))
}

fn fretforge_link_is_installed() -> bool {
    [
        std::env::var_os("ProgramFiles").map(PathBuf::from)
            .map(|root| root.join("Common Files\\VST3\\FretForgeLink.vst3")),
        std::env::var_os("LOCALAPPDATA").map(PathBuf::from)
            .map(|root| root.join("Programs\\Common\\VST3\\FretForgeLink.vst3")),
    ].into_iter().flatten().any(|path| path.exists())
}

fn refresh_fretforge_link_cache() -> Vec<FretForgeLinkTelemetry> {
    let cache = FRET_FORGE_LINK_CACHE.get_or_init(|| Mutex::new(HashMap::new()));
    if let Some(directory) = std::env::var_os("LOCALAPPDATA").map(PathBuf::from)
        .map(|root| root.join("FretForge")) {
        let mut paths = std::fs::read_dir(&directory).ok().into_iter().flatten()
            .filter_map(Result::ok).map(|entry| entry.path())
            .filter(|path| path.file_name().and_then(|name| name.to_str())
                .is_some_and(|name| name.starts_with("fretforge-link-") && name.ends_with(".json")))
            .collect::<Vec<_>>();
        let legacy = directory.join("fretforge-link.json");
        if legacy.is_file() { paths.push(legacy); }
        if let Ok(mut cached) = cache.lock() {
            for path in paths {
                if let Some(value) = std::fs::read_to_string(path).ok()
                    .and_then(|contents| serde_json::from_str::<FretForgeLinkTelemetry>(&contents).ok()) {
                    cached.insert(value.instance_id.clone(), value);
                }
            }
        }
    }
    cache.lock().map(|cached| cached.values().cloned().collect()).unwrap_or_default()
}

fn link_state(value: FretForgeLinkTelemetry, now_ms: u64) -> FretForgeLinkState {
    FretForgeLinkState {
        instance_id: value.instance_id, source_name: value.source_name,
        connected: value.connected && now_ms.saturating_sub(value.timestamp_ms) < 1_500,
        installed: fretforge_link_is_installed(), sample_rate: value.sample_rate,
        input_rms: value.input_rms, input_peak: value.input_peak,
        plugin_version: value.plugin_version, frequency: value.frequency, clarity: value.clarity,
        attacks: value.attacks,
    }
}

fn empty_link_state() -> FretForgeLinkState {
    FretForgeLinkState { instance_id: String::new(), source_name: "FretForge Link".to_string(),
        connected: false, installed: fretforge_link_is_installed(), sample_rate: 0.0,
        input_rms: 0.0, input_peak: 0.0, plugin_version: String::new(),
        frequency: 0.0, clarity: 0.0, attacks: Vec::new() }
}

#[tauri::command]
fn list_fretforge_link_sources() -> Vec<FretForgeLinkState> {
    let now_ms = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as u64;
    let mut sources = refresh_fretforge_link_cache().into_iter()
        .map(|value| link_state(value, now_ms)).filter(|source| source.connected).collect::<Vec<_>>();
    sources.sort_by(|left, right| left.instance_id.cmp(&right.instance_id));
    sources
}

#[tauri::command]
fn get_fretforge_link_state(source_id: Option<String>) -> FretForgeLinkState {
    let now_ms = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as u64;
    let sources = refresh_fretforge_link_cache();
    sources.iter().find(|value| {
        source_id.as_ref().is_some_and(|id| id == &value.instance_id)
            && value.connected
            && now_ms.saturating_sub(value.timestamp_ms) < 1_500
    }).cloned()
        .or_else(|| sources.into_iter().find(|value| value.connected && now_ms.saturating_sub(value.timestamp_ms) < 1_500))
        .map(|value| link_state(value, now_ms)).unwrap_or_else(empty_link_state)
}

#[tauri::command]
fn set_fretforge_link_gain(source_id: String, gain: f32) -> Result<(), String> {
    let directory = std::env::var_os("LOCALAPPDATA").map(PathBuf::from)
        .ok_or_else(|| "Windows local application data is unavailable.".to_string())?
        .join("FretForge");
    std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let safe_id = source_id.chars().filter(|character| character.is_ascii_alphanumeric() || *character == '-').collect::<String>();
    if safe_id.is_empty() { return Err("No active FretForge Link source was selected.".to_string()); }
    std::fs::write(directory.join(format!("fretforge-link-{safe_id}.gain")), gain.clamp(0.0, 1.5).to_string())
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_workstation_telemetry,
            list_audio_output_devices,
            list_audio_input_devices,
            start_audio_monitor,
            set_audio_monitor_volume,
            stop_audio_monitor,
            test_audio_output,
            get_native_tuner_state,
            push_audio_samples,
            list_studio_applications,
            list_amp_simulators,
            launch_studio_application,
            close_studio_application,
            list_fretforge_link_sources,
            get_fretforge_link_state,
            set_fretforge_link_gain
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
