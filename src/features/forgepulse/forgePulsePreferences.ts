import type {
  ForgePulseMode,
  Subdivision,
  TimeSignature,
} from "./forgePulseTypes";
import { defaultPracticeExerciseId, inferLegacyExerciseId, practiceExercises } from "./practiceExerciseCatalog";

const storageKey = "fretforge.forgepulse.preferences";

export type ForgePulsePreferences = {
  exerciseId: string;
  mode: ForgePulseMode;
  bpm: number;
  subdivision: Subdivision;
  timeSignature: TimeSignature;
  countInEnabled: boolean;
  timerEnabled: boolean;
  durationMinutes: number;
  accentEnabled: boolean;
  volume: number;
};

export const defaultForgePulsePreferences: ForgePulsePreferences = {
  exerciseId: defaultPracticeExerciseId,
  mode: "learn",
  bpm: 120,
  subdivision: "quarter",
  timeSignature: "4/4",
  countInEnabled: false,
  timerEnabled: false,
  durationMinutes: 5,
  accentEnabled: true,
  volume: 0.7,
};

export function loadForgePulsePreferences(): ForgePulsePreferences {
  const storedPreferences = localStorage.getItem(storageKey);

  if (!storedPreferences) return defaultForgePulsePreferences;

  try {
    const stored = JSON.parse(storedPreferences) as Partial<ForgePulsePreferences>;
    const modes: ForgePulseMode[] = ["learn", "practice", "follow", "master"];
    const subdivisions: Subdivision[] = [
      "whole",
      "half",
      "quarter",
      "eighth",
      "triplet",
      "sixteenth",
    ];
    const timeSignatures: TimeSignature[] = [
      "2/4",
      "3/4",
      "4/4",
      "5/4",
      "6/8",
      "7/8",
    ];

    return {
      exerciseId: practiceExercises.some((exercise) => exercise.id === stored.exerciseId)
        ? stored.exerciseId as string
        : inferLegacyExerciseId(subdivisions.includes(stored.subdivision as Subdivision) ? stored.subdivision as Subdivision : defaultForgePulsePreferences.subdivision),
      mode: modes.includes(stored.mode as ForgePulseMode)
        ? (stored.mode as ForgePulseMode)
        : defaultForgePulsePreferences.mode,
      bpm:
        typeof stored.bpm === "number"
          ? Math.min(240, Math.max(40, stored.bpm))
          : defaultForgePulsePreferences.bpm,
      subdivision: subdivisions.includes(stored.subdivision as Subdivision)
        ? (stored.subdivision as Subdivision)
        : defaultForgePulsePreferences.subdivision,
      timeSignature: timeSignatures.includes(
        stored.timeSignature as TimeSignature
      )
        ? (stored.timeSignature as TimeSignature)
        : defaultForgePulsePreferences.timeSignature,
      countInEnabled:
        typeof stored.countInEnabled === "boolean"
          ? stored.countInEnabled
          : defaultForgePulsePreferences.countInEnabled,
      timerEnabled:
        typeof stored.timerEnabled === "boolean"
          ? stored.timerEnabled
          : defaultForgePulsePreferences.timerEnabled,
      durationMinutes:
        typeof stored.durationMinutes === "number" &&
        [1, 5, 10, 15, 30].includes(stored.durationMinutes)
          ? stored.durationMinutes
          : defaultForgePulsePreferences.durationMinutes,
      accentEnabled:
        typeof stored.accentEnabled === "boolean"
          ? stored.accentEnabled
          : defaultForgePulsePreferences.accentEnabled,
      volume:
        typeof stored.volume === "number"
          ? Math.min(1, Math.max(0.1, stored.volume))
          : defaultForgePulsePreferences.volume,
    };
  } catch {
    localStorage.removeItem(storageKey);
    return defaultForgePulsePreferences;
  }
}

export function saveForgePulsePreferences(
  preferences: ForgePulsePreferences
) {
  localStorage.setItem(storageKey, JSON.stringify(preferences));
}
