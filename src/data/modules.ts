import {
  Home,
  Guitar,
  Music,
  AudioWaveform,
  SlidersHorizontal,
  Cable,
  Wrench,
  Mic2,
  GraduationCap,
  Users,
  Radio,
  CircleDot,
  Volume2,
  CalendarDays,
} from "lucide-react";

export type ModuleId =
  | "forge"
  | "sessions"
  | "rhythm"
  | "lead"
  | "bass"
  | "theory"
  | "tuner"
  | "pulse"
  | "jam"
  | "tone"
  | "signal"
  | "workshop"
  | "studio"
  | "mentor"
  | "coach";

export const modules = [
  {
    id: "forge",
    icon: Home,
    name: "The Forge",
    description: "Dashboard and central workspace.",
  },
  {
    id: "sessions",
    icon: CalendarDays,
    name: "Sessions",
    description: "Projects, practice sessions, active rigs, notes, and history.",
  },
  {
    id: "rhythm",
    icon: Guitar,
    name: "Rhythm Foundry",
    description: "Rhythm guitar training and timing discipline.",
  },
  {
    id: "lead",
    icon: Music,
    name: "Lead Forge",
    description: "Bends, vibrato, phrasing, and articulation.",
  },
  {
    id: "bass",
    icon: AudioWaveform,
    name: "Bass Foundry",
    description: "Bass-focused timing, groove, and articulation.",
  },
  {
    id: "theory",
    icon: GraduationCap,
    name: "Theory Forge",
    description: "Scales, intervals, chords, rhythm theory, and fretboard knowledge.",
  },
  {
    id: "tuner",
    icon: Radio,
    name: "ForgeTune",
    description: "Live tuner, bend tracking, and tuning stability.",
  },
  {
    id: "pulse",
    icon: CircleDot,
    name: "ForgePulse",
    description: "Metronome, subdivisions, count-ins, and timing routines.",
  },
  {
    id: "jam",
    icon: Volume2,
    name: "JamForge",
    description: "Backing tracks, bookmarks, looping, and playback.",
  },
  {
    id: "tone",
    icon: SlidersHorizontal,
    name: "Tone Lab",
    description: "Amp settings, IRs, EQs, pedal chains, and tone exports.",
  },
  {
    id: "signal",
    icon: Cable,
    name: "Signal Forge",
    description: "Visual signal-chain building and routing.",
  },
  {
    id: "workshop",
    icon: Wrench,
    name: "The Workshop",
    description: "Floyd Rose, intonation, action, pickup height, and setup tracking.",
  },
  {
    id: "studio",
    icon: Mic2,
    name: "Studio Path",
    description: "DAW integration, recording workflows, session setup, and project handoff.",
  },
  {
    id: "mentor",
    icon: Music,
    name: "Mentor Portal",
    description: "Practice history, progress trends, and focused performance review.",
  },
  {
    id: "coach",
    icon: Users,
    name: "Coach Console",
    description: "Local-only teacher support.",
  },
] as const;
