import { useEffect, useRef, useState } from "react";
import { Pause, Play, Repeat2, Upload } from "lucide-react";
import {
  audioPreferenceChangedEvent,
  routeMediaElementToPreferredDevice,
} from "../../services/audioRoutingService";

type JamForgeWorkspaceProps = {
  theme: string;
};

function formatTime(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds)) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function JamForgeWorkspace({ theme }: JamForgeWorkspaceProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [trackName, setTrackName] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function resetTrackState() {
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setLoopStart(null);
    setLoopEnd(null);
    setIsLoopEnabled(false);
    setErrorMessage("");
  }

  function handleTrackSelected(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setErrorMessage("Choose a supported audio file.");
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    objectUrlRef.current = objectUrl;
    resetTrackState();
    setTrackName(file.name);

    if (audioRef.current) {
      audioRef.current.src = objectUrl;
      audioRef.current.load();
      routeMediaElementToPreferredDevice(audioRef.current).catch((error) => {
        console.warn("Preferred JamForge output is unavailable:", error);
      });
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio?.src) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      console.error("JamForge playback failed:", error);
      setErrorMessage("This audio file could not be played.");
    }
  }

  function seek(nextTime: number) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function setLoopStartAtPlayhead() {
    setLoopStart(currentTime);
    if (loopEnd !== null && loopEnd <= currentTime) {
      setLoopEnd(null);
      setIsLoopEnabled(false);
    }
  }

  function setLoopEndAtPlayhead() {
    if (loopStart === null || currentTime <= loopStart + 0.25) {
      setErrorMessage("Set loop start first, then move at least 0.25 seconds ahead.");
      return;
    }

    setErrorMessage("");
    setLoopEnd(currentTime);
    setIsLoopEnabled(true);
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const applyPreferredOutput = () => {
      if (!audioRef.current) return;
      routeMediaElementToPreferredDevice(audioRef.current).catch((error) => {
        console.warn("Preferred JamForge output is unavailable:", error);
      });
    };

    window.addEventListener(audioPreferenceChangedEvent, applyPreferredOutput);
    return () =>
      window.removeEventListener(
        audioPreferenceChangedEvent,
        applyPreferredOutput
      );
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  return (
    <section
      className={`rounded-2xl border p-5 shadow-lg sm:p-6 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-black/20"
          : "border-zinc-300 bg-white text-zinc-900 shadow-zinc-300/40"
      }`}
    >
      <audio
        ref={audioRef}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => setErrorMessage("This audio file could not be loaded.")}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;

          if (
            isLoopEnabled &&
            loopStart !== null &&
            loopEnd !== null &&
            audio.currentTime >= loopEnd
          ) {
            audio.currentTime = loopStart;
          }

          setCurrentTime(audio.currentTime);
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-orange-400">
            JamForge
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Load a local track, slow it down, and loop difficult passages for
            focused practice. Audio stays on this device.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          <Upload size={16} /> Load Track
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={(event) => handleTrackSelected(event.target.files?.[0])}
          />
        </label>
      </div>

      {errorMessage && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-zinc-700/60 p-5 sm:p-6">
        <p className="truncate text-sm font-semibold">
          {trackName || "No track loaded"}
        </p>

        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={!trackName}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white disabled:bg-zinc-700 disabled:text-zinc-500"
            aria-label={isPlaying ? "Pause track" : "Play track"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => seek(Number(event.target.value))}
              disabled={!trackName}
              aria-label="Track position"
              className="w-full accent-orange-500"
            />
            <div className="mt-1 flex justify-between text-xs tabular-nums text-zinc-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[auto_1fr]">
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Playback Speed
            <select
              value={playbackRate}
              onChange={(event) => setPlaybackRate(Number(event.target.value))}
              className={`mt-2 block rounded-lg border px-3 py-2 text-sm normal-case ${
                theme === "dark"
                  ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                  : "border-zinc-300 bg-white text-zinc-900"
              }`}
            >
              <option value={0.5}>50%</option>
              <option value={0.75}>75%</option>
              <option value={0.9}>90%</option>
              <option value={1}>100%</option>
              <option value={1.25}>125%</option>
            </select>
          </label>

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">A/B Loop</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={setLoopStartAtPlayhead} disabled={!trackName} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm disabled:opacity-50">
                Set A · {loopStart === null ? "—" : formatTime(loopStart)}
              </button>
              <button type="button" onClick={setLoopEndAtPlayhead} disabled={!trackName || loopStart === null} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm disabled:opacity-50">
                Set B · {loopEnd === null ? "—" : formatTime(loopEnd)}
              </button>
              <button
                type="button"
                onClick={() => setIsLoopEnabled((enabled) => !enabled)}
                disabled={loopStart === null || loopEnd === null}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-50 ${
                  isLoopEnabled
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-zinc-600"
                }`}
              >
                <Repeat2 size={15} /> {isLoopEnabled ? "Loop On" : "Loop Off"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoopStart(null);
                  setLoopEnd(null);
                  setIsLoopEnabled(false);
                }}
                disabled={loopStart === null && loopEnd === null}
                className="rounded-lg px-3 py-2 text-sm text-zinc-500 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
