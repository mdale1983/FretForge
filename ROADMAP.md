# FretForge Roadmap

FretForge is a practical guitar workstation and coach. Product feedback should
remain musical, specific, and useful. Avoid points, badges, levels, streak
pressure, and other gamification mechanics.

## Completed foundation: Mentor Portal

- [x] Compare like-for-like ForgePulse sessions instead of mixing unrelated
  tempos and subdivisions.
- [x] Explain timing tendencies in plain language.
- [x] Recommend the next practice action and tempo from measured results.
- [x] Filter practice history by project and exercise.
- [x] Preserve timing strictness so comparisons never mix different scoring
  windows.
- [x] Visualize comparable-session progress and explain each result in plain
  coaching language.
- [x] Reopen the reviewed exercise directly in ForgePulse.
- [x] Let the user remove unwanted or test practice results from the review.
- [ ] Turn repeated comparable sessions into a multi-exercise, longer-term
  practice plan.
- Add longer-term views by project, technique, and date after the underlying
  session data is reliable.
- Keep detailed review in Mentor Portal rather than cluttering ForgePulse.

## Current focus: Integrated Practice

- [x] Give each ForgePulse run a real exercise identity instead of relying on
  generic mode labels.
- [x] Provide clear goals and playing instructions for each timing exercise.
- [x] Carry Mentor recommendations back into ForgePulse with the prescribed
  exercise, tempo, time signature, and scoring strictness.
- [x] Link post-session results directly to the saved Mentor review.
- [ ] Add technique-specific analyzers only when FretForge can measure them
  honestly. Bends, vibrato, slides, articulation, and chords must not reuse
  attack-timing scores as a fake proxy for technique quality.

## Planned: JamForge Riff Capture

1. Record, stop, replay, discard, and save dry guitar audio locally.
2. Attach captures to a project and session with tuning, tempo, rig, and notes.
3. Generate editable draft transcription for single-note riffs first.
4. Track pitch confidence separately from string/fret confidence.
5. Infer playable fingerings from tuning, fretboard position, adjacent notes,
   and user corrections; never present uncertain fingerings as guaranteed.
6. Preserve the original audio as the source of truth.
7. Add a fast tablature correction workflow, followed by bends, slides,
   hammer-ons, pull-offs, palm muting, and chords.
8. Open saved riffs in ForgePulse for looping and tempo-focused practice.
9. Consider a clearly indicated local "Save Last 30 Seconds" rolling buffer
   only after explicit recording and storage are reliable.
