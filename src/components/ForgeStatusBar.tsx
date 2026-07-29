import { useEffect, useRef, useState } from "react";
import type { WorkstationStatus } from "../types/WorkstationStatus";

type ForgeStatusBarProps = {
  version: string;
  theme: string;
  setTheme: (theme: string) => void;
  workstationStatus: WorkstationStatus;
  audioDevices: {
    name: string;
    is_default_output: boolean;
  }[];
  selectedAudioDevice: string;
  setSelectedAudioDevice: (device: string) => void;
};

type TuningOption = {
  name: string;
  stringCount: 6 | 7 | 8;
  notes: string[];
};

const tuningOptions: TuningOption[] = [
  { name: "Standard", stringCount: 6, notes: ["E", "A", "D", "G", "B", "E"] },
  { name: "Eb Standard", stringCount: 6, notes: ["Eb", "Ab", "Db", "Gb", "Bb", "Eb"] },
  { name: "D Standard", stringCount: 6, notes: ["D", "G", "C", "F", "A", "D"] },
  { name: "C# Standard", stringCount: 6, notes: ["C#", "F#", "B", "E", "G#", "C#"] },
  { name: "C Standard", stringCount: 6, notes: ["C", "F", "Bb", "Eb", "G", "C"] },
  { name: "Drop D", stringCount: 6, notes: ["D", "A", "D", "G", "B", "E"] },
  { name: "Drop C#", stringCount: 6, notes: ["C#", "G#", "C#", "F#", "A#", "D#"] },
  { name: "Drop C", stringCount: 6, notes: ["C", "G", "C", "F", "A", "D"] },
  { name: "Drop B", stringCount: 6, notes: ["B", "F#", "B", "E", "G#", "C#"] },
  { name: "Drop A", stringCount: 6, notes: ["A", "E", "A", "D", "F#", "B"] },

  { name: "Standard 7", stringCount: 7, notes: ["B", "E", "A", "D", "G", "B", "E"] },
  { name: "Bb Standard 7", stringCount: 7, notes: ["Bb", "Eb", "Ab", "Db", "Gb", "Bb", "Eb"] },
  { name: "A Standard 7", stringCount: 7, notes: ["A", "D", "G", "C", "F", "A", "D"] },
  { name: "Drop A 7", stringCount: 7, notes: ["A", "E", "A", "D", "G", "B", "E"] },
  { name: "Drop G# 7", stringCount: 7, notes: ["G#", "D#", "G#", "C#", "F#", "A#", "D#"] },

  { name: "Standard 8", stringCount: 8, notes: ["F#", "B", "E", "A", "D", "G", "B", "E"] },
  { name: "Drop E 8", stringCount: 8, notes: ["E", "B", "E", "A", "D", "G", "B", "E"] },
  { name: "Drop F# 8", stringCount: 8, notes: ["F#", "C#", "F#", "B", "E", "A", "C#", "F#"] },
  { name: "E Standard 8", stringCount: 8, notes: ["E", "A", "D", "G", "C", "F", "A", "D"] },
];

const pitchClasses: Record<string, number> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5,
  "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

function targetFrequencies(tuning: TuningOption) {
  const baseline = tuning.stringCount === 6 ? 40 : tuning.stringCount === 7 ? 35 : 30;
  let previousMidi = baseline - 1;
  return tuning.notes.map((note, index) => {
    const pitchClass = pitchClasses[note];
    let midi = index === 0
      ? baseline + ((((pitchClass - baseline) % 12) + 18) % 12) - 6
      : previousMidi + 1;
    while (((midi % 12) + 12) % 12 !== pitchClass) midi += 1;
    previousMidi = midi;
    return 440 * 2 ** ((midi - 69) / 12);
  });
}

function ForgeStatusBar({
  version,
  theme,
  setTheme,
  workstationStatus,
}: ForgeStatusBarProps) {
  const [stringCount, setStringCount] = useState<6 | 7 | 8>(6);
  const [selectedTuning, setSelectedTuning] = useState<TuningOption>(
    tuningOptions.find((tuning) => tuning.name === "C# Standard") ??
      tuningOptions[0]
  );
  const [monitorRoute, setMonitorRoute] = useState(
    () => localStorage.getItem("fretforge.monitorRoute") ?? "fretforge"
  );

  const changeMonitorRoute = (route: string) => {
    setMonitorRoute(route);
    localStorage.setItem("fretforge.monitorRoute", route);
    window.dispatchEvent(new CustomEvent("fretforge:monitor-route", { detail: route }));
  };
  const [liveCents, setLiveCents] = useState<(number | null)[]>(
    () => Array(selectedTuning.stringCount).fill(null)
  );
  const liveCentsRef = useRef<(number | null)[]>(liveCents);
  const pitchCandidateRef = useRef<{ index: number; readings: number[] } | null>(null);

  useEffect(() => {
    const emptyReadings = Array(selectedTuning.stringCount).fill(null);
    setLiveCents(emptyReadings);
    liveCentsRef.current = emptyReadings;
    pitchCandidateRef.current = null;
    const targets = targetFrequencies(selectedTuning);
    const handlePitch = (event: Event) => {
      const { frequency, clarity, isListening } = (event as CustomEvent<{
        frequency: number | null; clarity: number; isListening: boolean;
      }>).detail;
      if (!isListening || !frequency || clarity < 0.75) return;
      const offsets = targets.map((target) => 1200 * Math.log2(frequency / target));
      const activeIndex = offsets.reduce((best, value, index) =>
        Math.abs(value) < Math.abs(offsets[best]) ? index : best, 0);
      if (Math.abs(offsets[activeIndex]) > 300) return;
      const cents = Math.round(offsets[activeIndex]);
      const previousCandidate = pitchCandidateRef.current;
      const candidate = previousCandidate?.index === activeIndex &&
        Math.abs(previousCandidate.readings[previousCandidate.readings.length - 1] - cents) <= 8
        ? { index: activeIndex, readings: [...previousCandidate.readings.slice(-7), cents] }
        : { index: activeIndex, readings: [cents] };
      pitchCandidateRef.current = candidate;

      const previousReading = liveCentsRef.current[activeIndex];
      const replacingConfirmedTune = previousReading !== null && Math.abs(previousReading) <= 2 && Math.abs(cents) > 2;
      const requiredReadings = replacingConfirmedTune ? 8 : 4;
      if (candidate.readings.length < requiredReadings) return;
      const spread = Math.max(...candidate.readings) - Math.min(...candidate.readings);
      if (spread > 5) return;
      const sorted = [...candidate.readings].sort((left, right) => left - right);
      const settledCents = sorted[Math.floor(sorted.length / 2)];
      setLiveCents((current) => {
        const next = current.map((value, index) => index === activeIndex ? settledCents : value);
        liveCentsRef.current = next;
        return next;
      });
    };
    window.addEventListener("fretforge:tuner-pitch", handlePitch);
    return () => window.removeEventListener("fretforge:tuner-pitch", handlePitch);
  }, [selectedTuning]);

  const availableTunings = tuningOptions.filter(
    (tuning) => tuning.stringCount === stringCount
  );

  const dividerClass =
    theme === "dark" ? "border-zinc-800" : "border-zinc-200";

  const labelClass =
    theme === "dark" ? "text-zinc-500" : "text-zinc-500";

  const tileClass =
    theme === "dark"
      ? "border-zinc-700 bg-zinc-950 text-zinc-200 shadow-inner shadow-black/20"
      : "border-zinc-400 bg-zinc-50 text-zinc-900 shadow-sm shadow-zinc-400/40";

  const selectClass =
    theme === "dark"
      ? "border-zinc-700 bg-zinc-950 text-zinc-200"
      : "border-zinc-300 bg-white text-zinc-800";

  return (
    <header
      className={`relative shrink-0 border-b text-sm ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900"
          : "border-zinc-300 bg-white"
      }`}
    >
      <div className="min-h-16 px-4 py-3 text-center sm:px-5">
        <div className="text-base font-bold tracking-wide text-orange-400">
          The Forge Dashboard
        </div>

        <div
          className={`mt-0.5 text-xs tracking-wide ${
            theme === "dark" ? "text-zinc-500" : "text-zinc-600"
          }`}
        >
          {workstationStatus.activeProject} :: {workstationStatus.activeSession}
        </div>
      </div>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`absolute right-4 top-3 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
          theme === "dark"
            ? "border-zinc-700 text-zinc-300 hover:border-orange-400 hover:bg-zinc-800 hover:text-orange-400"
            : "border-zinc-300 text-zinc-700 hover:border-orange-500 hover:bg-zinc-100 hover:text-orange-600"
        }`}
      >
        {theme === "dark" ? "Light" : "Dark"}
      </button>

      <div
        className={`absolute right-4 top-12 text-[10px] ${
          theme === "dark" ? "text-zinc-600" : "text-zinc-500"
        }`}
      >
        {version}
      </div>

      <div
        className={`grid grid-cols-[1fr_1.6fr_1.4fr] border-t ${dividerClass}`}
      >
        <section className="px-4 py-2 text-center">
          <div
            className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${labelClass}`}
          >
            Status
          </div>

          <div className="flex flex-col items-center gap-1.5">
            {[
              workstationStatus.cpu,
              workstationStatus.ram,
              workstationStatus.gpu,
            ].map((item) => (
              <div
                key={item}
                className={`w-52 rounded-md border px-3 py-1 text-xs font-medium ${tileClass}`}
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section
          className={`border-l px-4 py-2 text-center ${dividerClass}`}
        >
          <div
            className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${labelClass}`}
          >
            Audio
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <select
              value={monitorRoute}
              onChange={(event) => changeMonitorRoute(event.target.value)}
              className={`w-64 rounded-md border px-3 py-1 text-xs font-medium outline-none ${selectClass}`}
            >
              <option value="fretforge">FretForge ASIO → AXE outputs 1–2</option>
              <option value="direct">AXE hardware/direct monitoring</option>
            </select>

            <div
              className={`w-64 rounded-md border px-3 py-1 text-xs font-medium ${tileClass}`}
            >
              AXE IO ONE · ASIO · 48 kHz
            </div>

            <div className="grid w-64 grid-cols-2 gap-1.5">
              <div
                className={`rounded-md border px-3 py-1 text-xs font-medium ${tileClass}`}
              >
                <>
                  <div>Buffer</div>
                  <div>{workstationStatus.bufferSize}</div>
                </>
              </div>

              <div
                className={`rounded-md border px-3 py-1 text-xs font-medium ${tileClass}`}
              >
                <>
                  <div>Latency</div>
                  <div>{workstationStatus.latency}</div>
                </>
              </div>
            </div>
          </div>
        </section>

        <section
          className={`border-l px-4 py-2 text-center ${dividerClass}`}
        >
          <div
            className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${labelClass}`}
          >
            Tuner
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${labelClass}`}
              >
                String
              </span>

              <select
                value={stringCount}
                onChange={(event) => {
                  const nextStringCount = Number(
                    event.target.value
                  ) as 6 | 7 | 8;

                  const nextTuning =
                    tuningOptions.find(
                      (tuning) =>
                        tuning.stringCount === nextStringCount
                    ) ?? tuningOptions[0];

                  setStringCount(nextStringCount);
                  setSelectedTuning(nextTuning);
                }}
                className={`rounded-md border px-2 py-1 text-xs outline-none ${selectClass}`}
              >
                <option value={6}>6 String</option>
                <option value={7}>7 String</option>
                <option value={8}>8 String</option>
              </select>

              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${labelClass}`}
              >
                Tuning
              </span>

              <select
                value={selectedTuning.name}
                onChange={(event) => {
                  const tuning = availableTunings.find(
                    (option) =>
                      option.name === event.target.value
                  );

                  if (tuning) {
                    setSelectedTuning(tuning);
                  }
                }}
                className={`rounded-md border px-2 py-1 text-xs outline-none ${selectClass}`}
              >
                {availableTunings.map((tuning) => (
                  <option
                    key={tuning.name}
                    value={tuning.name}
                  >
                    {tuning.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {selectedTuning.notes.map((note, index) => {
                const cents = liveCents[index];
                const hasReading = cents !== null;
                const isInTune = hasReading && Math.abs(cents) <= 2;

                return (
                  <div
                    key={`${selectedTuning.name}-${index}-${note}`}
                    className={`flex h-[4.5rem] w-12 flex-col items-center justify-center rounded-md border transition-all duration-200 ${
                      !hasReading
                        ? theme === "dark"
                          ? "border-zinc-700 bg-zinc-950"
                          : "border-zinc-300 bg-zinc-50"
                        : isInTune
                        ? theme === "dark"
                          ? "border-emerald-500/50 bg-emerald-500/10"
                          : "border-emerald-500/50 bg-emerald-100"
                        : theme === "dark"
                        ? "border-orange-500/40 bg-orange-500/10"
                        : "border-orange-500/40 bg-orange-100"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-bold leading-none ${
                        isInTune
                          ? theme === "dark"
                            ? "text-emerald-200"
                            : "text-emerald-700"
                          : theme === "dark"
                          ? "text-orange-200"
                          : "text-orange-600"
                      }`}
                    >
                      {selectedTuning.stringCount - index}
                    </span>

                    <span
                      className={`mt-1 text-sm font-bold leading-none ${
                        isInTune
                          ? theme === "dark"
                            ? "text-emerald-300"
                            : "text-emerald-700"
                          : theme === "dark"
                          ? "text-orange-300"
                          : "text-orange-700"
                      }`}
                    >
                      {note}
                    </span>

                    <span
                      className={`mt-1 text-[10px] font-bold leading-none ${
                        isInTune
                          ? theme === "dark"
                            ? "text-emerald-300"
                            : "text-emerald-700"
                          : theme === "dark"
                          ? "text-orange-200"
                          : "text-orange-700"
                      }`}
                    >
                      {!hasReading
                        ? "—"
                        : isInTune
                        ? "✓"
                        : `${cents > 0 ? "+" : ""}${cents}¢`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </header>
  );
}

export default ForgeStatusBar;
