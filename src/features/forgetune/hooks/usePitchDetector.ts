import { useCallback, useEffect, useRef, useState } from "react";
import {
  audioPreferenceChangedEvent,
  findPreferredMediaDevice,
  routeAudioContextToPreferredDevice,
} from "../../../services/audioRoutingService";

const noteNames = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

function getSignalLevel(buffer: Float32Array) {
  return Math.sqrt(
    buffer.reduce((sum, sample) => sum + sample * sample, 0) / buffer.length
  );
}

function detectFrequency(buffer: Float32Array, sampleRate: number) {
  const signalLevel = getSignalLevel(buffer);

  if (signalLevel < 0.0025) return null;

  const minimumLag = Math.floor(sampleRate / 1_200);
  const maximumLag = Math.min(
    Math.floor(sampleRate / 55),
    buffer.length - 1
  );
  let bestLag = -1;
  let bestCorrelation = 0;

  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    let correlation = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;

    for (let index = 0; index < buffer.length - lag; index += 1) {
      const left = buffer[index];
      const right = buffer[index + lag];
      correlation += left * right;
      leftEnergy += left * left;
      rightEnergy += right * right;
    }

    const normalizedCorrelation =
      correlation / Math.sqrt(leftEnergy * rightEnergy || 1);

    if (normalizedCorrelation > bestCorrelation) {
      bestCorrelation = normalizedCorrelation;
      bestLag = lag;
    }
  }

  if (bestLag < 0 || bestCorrelation < 0.75) return null;
  return { frequency: sampleRate / bestLag, clarity: bestCorrelation };
}

function describePitch(frequency: number) {
  const midiNote = Math.round(69 + 12 * Math.log2(frequency / 440));
  const targetFrequency = 440 * 2 ** ((midiNote - 69) / 12);
  const cents = Math.round(1_200 * Math.log2(frequency / targetFrequency));
  const noteIndex = ((midiNote % 12) + 12) % 12;

  return {
    note: noteNames[noteIndex],
    octave: Math.floor(midiNote / 12) - 1,
    cents,
    targetFrequency,
  };
}

export function usePitchDetector() {
  const [isListening, setIsListening] = useState(false);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [clarity, setClarity] = useState(0);
  const [inputLevel, setInputLevel] = useState(0);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState("");
  const [monitorEnabled, setMonitorEnabled] = useState(false);
  const [monitorVolume, setMonitorVolume] = useState(0.35);
  const [activeInputLabel, setActiveInputLabel] = useState("");
  const [isPreferredOutputRouted, setIsPreferredOutputRouted] = useState<
    boolean | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startRequestRef = useRef(0);
  const monitorGainRef = useRef<GainNode | null>(null);

  const refreshInputDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    setInputDevices(devices.filter((device) => device.kind === "audioinput"));
  }, []);

  const stop = useCallback(() => {
    startRequestRef.current += 1;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    monitorGainRef.current = null;
    setIsListening(false);
    setFrequency(null);
    setClarity(0);
    setInputLevel(0);
    setActiveInputLabel("");
  }, []);

  const start = useCallback(async () => {
    stop();
    const requestId = startRequestRef.current;
    setErrorMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("Microphone access is unavailable on this device.");
      return;
    }

    try {
      let stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedInputId ? { exact: selectedInputId } : undefined,
          autoGainControl: false,
          echoCancellation: false,
          noiseSuppression: false,
        },
      });

      if (requestId !== startRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const availableDevices = await navigator.mediaDevices.enumerateDevices();
      const preferredInput = findPreferredMediaDevice(
        availableDevices,
        "audioinput"
      );
      const currentDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId;

      if (preferredInput && preferredInput.deviceId !== currentDeviceId) {
        stream.getTracks().forEach((track) => track.stop());
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: { exact: preferredInput.deviceId },
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
          },
        });

        if (requestId !== startRequestRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
      }
      const AudioContextClass =
        window.AudioContext ??
        (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;

      if (!AudioContextClass) {
        stream.getTracks().forEach((track) => track.stop());
        setErrorMessage("Live audio analysis is unavailable on this device.");
        return;
      }

      const context = new AudioContextClass();

      if (context.state === "suspended") {
        await context.resume();
      }

      try {
        setIsPreferredOutputRouted(
          await routeAudioContextToPreferredDevice(context)
        );
      } catch (error) {
        console.warn("Preferred tuner output is unavailable:", error);
        setIsPreferredOutputRouted(false);
      }

      const analyser = context.createAnalyser();
      const source = context.createMediaStreamSource(stream);
      const monitorGain = context.createGain();
      const samples = new Float32Array(2_048);
      let lastAnalysisAt = 0;

      analyser.fftSize = samples.length;
      analyser.smoothingTimeConstant = 0.15;
      source.connect(analyser);
      source.connect(monitorGain);
      monitorGain.connect(context.destination);
      monitorGain.gain.value = monitorEnabled ? monitorVolume : 0;
      streamRef.current = stream;
      audioContextRef.current = context;
      monitorGainRef.current = monitorGain;
      const activeDeviceId = stream.getAudioTracks()[0]?.getSettings().deviceId;
      setActiveInputLabel(stream.getAudioTracks()[0]?.label ?? "");
      if (activeDeviceId) setSelectedInputId(activeDeviceId);
      await refreshInputDevices();
      setIsListening(true);

      const analyze = (timestamp: number) => {
        if (timestamp - lastAnalysisAt >= 50) {
          analyser.getFloatTimeDomainData(samples);
          setInputLevel(Math.min(1, getSignalLevel(samples) * 12));
          const detectedPitch = detectFrequency(samples, context.sampleRate);

          setFrequency(detectedPitch?.frequency ?? null);
          setClarity(detectedPitch?.clarity ?? 0);
          lastAnalysisAt = timestamp;
        }

        animationFrameRef.current = requestAnimationFrame(analyze);
      };

      animationFrameRef.current = requestAnimationFrame(analyze);
    } catch (error) {
      console.error("ForgeTune microphone could not start:", error);
      setErrorMessage(
        "Microphone access was denied or no input device is available."
      );
    }
  }, [monitorEnabled, monitorVolume, refreshInputDevices, selectedInputId, stop]);

  useEffect(() => {
    refreshInputDevices().catch(() => undefined);
  }, [refreshInputDevices]);

  useEffect(() => {
    if (monitorGainRef.current) {
      monitorGainRef.current.gain.value = monitorEnabled ? monitorVolume : 0;
    }
  }, [monitorEnabled, monitorVolume]);

  useEffect(() => {
    const applyPreferredOutput = async () => {
      if (!audioContextRef.current) return;

      try {
        setIsPreferredOutputRouted(
          await routeAudioContextToPreferredDevice(audioContextRef.current)
        );
      } catch (error) {
        console.warn("Preferred tuner output is unavailable:", error);
        setIsPreferredOutputRouted(false);
      }
    };

    window.addEventListener(audioPreferenceChangedEvent, applyPreferredOutput);
    return () =>
      window.removeEventListener(
        audioPreferenceChangedEvent,
        applyPreferredOutput
      );
  }, []);

  useEffect(
    () => () => {
      stop();
    },
    [stop]
  );

  return {
    isListening,
    frequency,
    clarity,
    inputLevel,
    inputDevices,
    selectedInputId,
    setSelectedInputId,
    monitorEnabled,
    setMonitorEnabled,
    monitorVolume,
    setMonitorVolume,
    activeInputLabel,
    isPreferredOutputRouted,
    pitch: frequency ? describePitch(frequency) : null,
    errorMessage,
    start,
    stop,
  };
}
