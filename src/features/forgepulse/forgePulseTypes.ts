// ==================================================
// ForgePulse Core Types
// ==================================================

export type Subdivision =
  | "whole"
  | "half"
  | "quarter"
  | "eighth"
  | "triplet"
  | "sixteenth";

export type TransportStatus =
  | "idle"
  | "ready"
  | "counting-in"
  | "playing";

export type ForgePulseMode =
  | "learn"
  | "practice"
  | "follow"
  | "master";

export type ForgePulseView =
  | "setup"
  | "readiness"
  | "session"
  | "results";

export type TimeSignature =
  | "2/4"
  | "3/4"
  | "4/4"
  | "5/4"
  | "6/8"
  | "7/8";
