import { useEffect, useState } from "react";
import { modules } from "../data/modules";
import { Project } from "../types/project";
import {
  getActiveProjectId,
  getMostRecentProject,
  getProjectById,
  setActiveProject,
} from "../services/ProjectService";
import ProjectPanel from "./ProjectPanel";

type WorkspaceProps = {
  activeModule: string;
  theme: string;
};

function getWorkspaceCards(activeModule: string, recentProject: Project | null) {
  switch (activeModule) {
    case "rhythm":
      return [
        ["Rhythm Foundry", "Rhythm guitar training workspace."],
        ["Downpicking", "Speed, endurance, and consistency tracking."],
        ["Palm Muting", "Tightness, control, and mute cleanup routines."],
        ["Timing", "Grid discipline and click-lock practice."],
        ["Gallops", "Triplet and metal rhythm pattern training."],
      ];

    case "lead":
      return [
        ["Lead Forge", "Lead guitar development workspace."],
        ["Bends", "Pitch accuracy and bend control tracking."],
        ["Vibrato", "Width, speed, and consistency routines."],
        ["Phrasing", "Musical phrase-building and articulation."],
        ["Technique", "Legato, picking, slides, and expressive control."],
      ];

    case "bass":
      return [
        ["Bass Foundry", "Bass-focused development workspace."],
        ["Groove", "Timing, pocket, and consistency training."],
        ["Finger Control", "Alternate fingers, muting, and articulation."],
        ["Low-End Lock", "Bass/rhythm guitar alignment routines."],
      ];

    case "theory":
      return [
        ["Theory Forge", "Practical theory for guitar and bass."],
        ["Scales", "Scale shapes, intervals, and fretboard mapping."],
        ["Chords", "Chord construction and harmonic function."],
        ["Rhythm Theory", "Subdivision, accents, meter, and syncopation."],
      ];

    case "jam":
      return [
        ["JamForge", "Backing track and loop workspace."],
        ["Imported Tracks", "Load and organize practice tracks."],
        ["Bookmarks", "Mark sections, riffs, solos, and transitions."],
        ["Looping", "Repeat difficult sections for focused practice."],
      ];

    case "tuner":
      return [
        ["ForgeTune", "Live tuner monitor ready."],
        ["Pitch Detection", "Realtime pitch tracking placeholder."],
        ["Tuning Stability", "Stability analysis placeholder."],
      ];

    case "pulse":
      return [
        ["ForgePulse", "Metronome engine placeholder."],
        ["BPM", "Current BPM: 120"],
        ["Subdivision", "Quarter notes"],
      ];

    case "tone":
      return [
        ["Tone Lab", "Tone management system."],
        ["Amp Profiles", "5150 Block Letter"],
        ["IR Library", "Celestion V30 collection"],
      ];

    default:
      return [
        [
          "Current Project",
          recentProject ? recentProject.name : "No project loaded.",
        ],
        ["ForgeTune", "Live tuner monitor placeholder."],
        ["ForgePulse", "Metronome and timing trainer placeholder."],
        ["Tone Lab", "Amp, IR, EQ, and pedal-chain storage."],
        ["Storage", "NAS primary. Local recovery fallback."],
        ["Privacy", "No telemetry. No accounts. No hidden uploads."],
      ];
  }
}

function Workspace({ activeModule, theme }: WorkspaceProps) {
  const [recentProject, setRecentProject] = useState<Project | null>(null);

  async function loadCurrentProject() {
    const activeProjectId = await getActiveProjectId();

    if (activeProjectId) {
      const activeProject = await getProjectById(activeProjectId);

      if (activeProject) {
        setRecentProject(activeProject);
        return;
      }
    }

    const recentProject = await getMostRecentProject();

    if (recentProject) {
      await setActiveProject(recentProject.id);
      setRecentProject(recentProject);
    }
  }

  useEffect(() => {
    loadCurrentProject();
  }, []);

  const currentModule =
    modules.find((module) => module.id === activeModule) ?? modules[0];

  return (
    <main
      className={`flex-1 p-6 overflow-auto ${
        theme === "dark" ? "bg-zinc-950" : "bg-zinc-100"
      }`}
    >
      <section className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-orange-400 mb-2">
          {currentModule.name}
        </h1>

        <p
          className={`mb-6 ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
          }`}
        >
          {currentModule.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeModule === "forge" && (
            <ProjectPanel theme={theme} onProjectChanged={loadCurrentProject} />
          )}

          {getWorkspaceCards(activeModule, recentProject).map(([title, body]) => (
            <div
              key={title}
              className={`rounded-xl border p-5 shadow-lg transition-colors ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-900/80 shadow-black/20 hover:border-zinc-700"
                  : "border-zinc-300 bg-white shadow-zinc-300/40 hover:border-zinc-400"
              }`}
            >
              <h2 className="font-semibold mb-2">{title}</h2>

              <p
                className={`text-sm leading-relaxed ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Workspace;