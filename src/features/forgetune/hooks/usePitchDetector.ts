import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNativeTunerState,
  setNativeAudioMonitorVolume,
  startNativeAudioMonitor,
  stopNativeAudioMonitor,
  testNativeAudioOutput,
} from "../../../services/nativeAudioService";
import { getFretForgeLinkState } from "../../../services/studioApplicationService";

const noteNames = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

function describePitch(frequency: number) {
  const midiNote = Math.round(69 + 12 * Math.log2(frequency / 440));
  const targetFrequency = 440 * 2 ** ((midiNote - 69) / 12);
  return {
    note: noteNames[((midiNote % 12) + 12) % 12],
    octave: Math.floor(midiNote / 12) - 1,
    cents: Math.round(1200 * Math.log2(frequency / targetFrequency)),
    targetFrequency,
  };
}

export function usePitchDetector() {
  const [isListening, setIsListening] = useState(false);
  const [frequency, setFrequency] = useState<number | null>(null);
  const [clarity, setClarity] = useState(0);
  const [inputLevel, setInputLevel] = useState(0);
  const [channelLevels, setChannelLevels] = useState<number[]>([]);
  const [activeChannel, setActiveChannel] = useState(1);
  const [monitorEnabled, setMonitorEnabled] = useState(
    () => localStorage.getItem("fretforge.monitorRoute") !== "direct"
  );
  const [monitorVolume, setMonitorVolumeState] = useState(() => {
    const saved = Number(localStorage.getItem("fretforge.asioMonitorVolume"));
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 0.35;
  });
  const [activeInputLabel, setActiveInputLabel] = useState("");
  const [nativeMonitorStatus, setNativeMonitorStatus] = useState("");
  const [nativeMonitorError, setNativeMonitorError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const pollRef = useRef<number | null>(null);
  const usingDawLinkRef = useRef(false);

  const stop = useCallback(() => {
    if (pollRef.current !== null) window.clearInterval(pollRef.current);
    pollRef.current = null;
    usingDawLinkRef.current = false;
    stopNativeAudioMonitor().catch(() => undefined);
    setIsListening(false); setFrequency(null); setClarity(0); setInputLevel(0);
    setChannelLevels([]); setNativeMonitorStatus("");
  }, []);

  const start = useCallback(async () => {
    stop();
    try {
      setErrorMessage(""); setNativeMonitorError("");
      const link = await getFretForgeLinkState().catch(() => null);
      if (link?.connected) {
        usingDawLinkRef.current = true;
        setActiveInputLabel(`REAPER · FretForge Link · ${Math.round(link.sample_rate / 1000)} kHz`);
        setNativeMonitorStatus("DAW monitoring active — REAPER controls the guitar output.");
        setIsListening(true);
        const poll = async () => {
          try {
            const state = await getFretForgeLinkState();
            if (!state.connected) { setErrorMessage("FretForge Link disconnected. Return to Studio Path or restart the tuner to use native ASIO."); return; }
            setFrequency(state.frequency > 0 ? state.frequency : null);
            setClarity(state.clarity); setInputLevel(Math.min(1, state.input_peak * 4));
            setChannelLevels([state.input_peak]); setActiveChannel(1);
          } catch (error) { setErrorMessage(String(error)); }
        };
        await poll();
        pollRef.current = window.setInterval(poll, 75);
        return;
      }
      usingDawLinkRef.current = false;
      const status = await startNativeAudioMonitor("AXE IO ONE", "AXE IO ONE Input 1", monitorEnabled ? monitorVolume : 0);
      setActiveInputLabel("AXE IO ONE · ASIO Input 1 · 48 kHz");
      setNativeMonitorStatus(status); setIsListening(true);
      const poll = async () => {
        try {
          const state = await getNativeTunerState();
          setFrequency(state.frequency); setClarity(state.clarity);
          setInputLevel(Math.min(1, state.input_level * 12));
          setChannelLevels(state.channel_levels); setActiveChannel(state.active_channel);
        } catch (error) { setErrorMessage(String(error)); }
      };
      await poll();
      pollRef.current = window.setInterval(poll, 75);
    } catch (error) { setErrorMessage(String(error)); }
  }, [monitorEnabled, monitorVolume, stop]);

  useEffect(() => {
    if (isListening && !usingDawLinkRef.current) setNativeAudioMonitorVolume(monitorEnabled ? monitorVolume : 0)
      .catch((error) => setNativeMonitorError(String(error)));
  }, [isListening, monitorEnabled, monitorVolume]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("fretforge:tuner-pitch", {
      detail: { frequency, clarity, isListening },
    }));
  }, [clarity, frequency, isListening]);
  const setMonitorVolume = (volume: number) => {
    setMonitorVolumeState(volume);
    localStorage.setItem("fretforge.asioMonitorVolume", String(volume));
  };
  const monitorRoute = monitorEnabled ? "fretforge" : "direct";
  const setMonitorRoute = (route: string) => {
    const enabled = route === "fretforge";
    setMonitorEnabled(enabled);
    localStorage.setItem("fretforge.monitorRoute", enabled ? "fretforge" : "direct");
  };
  useEffect(() => {
    const handleRoute = (event: Event) => {
      setMonitorEnabled((event as CustomEvent<string>).detail === "fretforge");
    };
    window.addEventListener("fretforge:monitor-route", handleRoute);
    return () => window.removeEventListener("fretforge:monitor-route", handleRoute);
  }, []);
  useEffect(() => () => stop(), [stop]);

  const testOutput = async () => {
    try { setNativeMonitorError(""); setNativeMonitorStatus(await testNativeAudioOutput("AXE IO ONE")); }
    catch (error) { setNativeMonitorError(String(error)); }
  };

  return {
    isListening, frequency, clarity, inputLevel, channelLevels, activeChannel,
    inputDevices: [{ name: "AXE IO ONE", sample_rate: "48 kHz ASIO" }],
    selectedInputDevice: "AXE IO ONE", setSelectedInputDevice: (_value: string) => undefined,
    monitorEnabled, setMonitorEnabled, monitorRoute, setMonitorRoute,
    monitorVolume, setMonitorVolume,
    activeInputLabel, nativeMonitorStatus, nativeMonitorError, testOutput,
    pitch: frequency ? describePitch(frequency) : null, errorMessage, start, stop,
  };
}
