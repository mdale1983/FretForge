import type { Subdivision } from "./forgePulseTypes";

export type PracticeExercise = {
  id: string;
  name: string;
  skill: "Timing" | "Picking";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  subdivision: Subdivision;
  recommendedBpm: number;
  objective: string;
  instructions: string;
};

export const practiceExercises: PracticeExercise[] = [
  {
    id: "sustained-whole-notes",
    name: "Sustained Whole Notes",
    skill: "Timing",
    difficulty: "Beginner",
    subdivision: "whole",
    recommendedBpm: 80,
    objective: "Control the start of each note and let it sustain cleanly.",
    instructions: "Attack on beat 1, let the note ring through beats 2, 3, and 4, then attack again on the next beat 1.",
  },
  {
    id: "steady-half-notes",
    name: "Steady Half Notes",
    skill: "Timing",
    difficulty: "Beginner",
    subdivision: "half",
    recommendedBpm: 90,
    objective: "Place attacks evenly across a full measure.",
    instructions: "Attack on beats 1 and 3. Let each note ring for two beats without adding another attack.",
  },
  {
    id: "quarter-note-lock",
    name: "Quarter-Note Lock",
    skill: "Timing",
    difficulty: "Beginner",
    subdivision: "quarter",
    recommendedBpm: 100,
    objective: "Keep one attack centered around every beat.",
    instructions: "Attack once on every click. Keep the space between attacks even and avoid adding notes between clicks.",
  },
  {
    id: "eighth-note-alternate-picking",
    name: "Eighth-Note Alternate Picking",
    skill: "Picking",
    difficulty: "Intermediate",
    subdivision: "eighth",
    recommendedBpm: 80,
    objective: "Keep downstrokes and upstrokes even at two attacks per beat.",
    instructions: "Alternate down and up strokes. Attack on the click and halfway to the next click while counting 1-and, 2-and.",
  },
  {
    id: "triplet-control",
    name: "Triplet Control",
    skill: "Picking",
    difficulty: "Intermediate",
    subdivision: "triplet",
    recommendedBpm: 70,
    objective: "Fit three evenly spaced attacks inside every beat.",
    instructions: "Play three equal attacks per click while counting 1-trip-let, 2-trip-let. Do not let the third note rush into the next beat.",
  },
  {
    id: "sixteenth-note-control",
    name: "Sixteenth-Note Control",
    skill: "Picking",
    difficulty: "Advanced",
    subdivision: "sixteenth",
    recommendedBpm: 60,
    objective: "Maintain four even alternate-picked attacks per beat.",
    instructions: "Alternate pick four equal attacks per click while counting 1-e-and-a. Start slowly enough that every attack remains distinct.",
  },
];

export const defaultPracticeExerciseId = "quarter-note-lock";

export function getPracticeExercise(id: string | null | undefined) {
  return practiceExercises.find((exercise) => exercise.id === id) ?? practiceExercises.find((exercise) => exercise.id === defaultPracticeExerciseId)!;
}

export function inferLegacyExerciseId(subdivision: Subdivision) {
  return practiceExercises.find((exercise) => exercise.subdivision === subdivision)?.id ?? defaultPracticeExerciseId;
}
