import type {
  ForgePulseMode,
  Subdivision,
} from "./forgePulseTypes";

// ==================================================
// ForgePulse Mode Metadata
// ==================================================

export const modeTitles: Record<ForgePulseMode, string> = {
  learn: "Rhythm Fundamentals",
  practice: "Standard Metronome Practice",
  follow: "Custom Rhythm Following",
  master: "Advanced Internal Timing",
};

export const modeDifficulty: Record<ForgePulseMode, string> = {
  learn: "Beginner",
  practice: "Intermediate",
  follow: "Advanced",
  master: "Expert",
};

export const modeSessionTitles: Record<ForgePulseMode, string> = {
  learn: "Mastering Whole Notes in 4/4",
  practice: "Developing Quarter Note Timing",
  follow: "Following Basic Rhythm Patterns",
  master: "Advanced Internal Timing",
};

export const modeObjectives: Record<ForgePulseMode, string> = {
  learn: "Understand note durations, subdivisions, and counting.",
  practice: "Maintain consistent timing and rhythmic accuracy.",
  follow: "Synchronize with custom rhythm patterns and riffs.",
  master: "Develop internal timing with reduced metronome support.",
};

export const modeDescriptions: Record<ForgePulseMode, string> = {
  learn:
    "Learn rhythm fundamentals, note values, subdivisions, and timing concepts.",
  practice:
    "Standard metronome operation for daily timing practice.",
  follow:
    "Follow custom rhythm patterns and riff structures.",
  master:
    "Advanced timing exercises with reduced click assistance.",
};

// ==================================================
// ForgePulse Display Labels
// ==================================================

export const subdivisionLabels: Record<Subdivision, string> = {
  whole: "WHOLE NOTES",
  half: "HALF NOTES",
  quarter: "QUARTER NOTES",
  eighth: "EIGHTH NOTES",
  triplet: "EIGHTH-NOTE TRIPLETS",
  sixteenth: "SIXTEENTH NOTES",
};
