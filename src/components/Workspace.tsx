import { useEffect, useState } from "react";
import { modules } from "../data/modules";
import { Project } from "../types/project";
import { Session } from "../types/session";
import CurrentProjectCard from "./dashboard/CurrentProjectCard";
import CurrentSessionCard from "./dashboard/CurrentSessionCard";
import {
  getActiveProjectId,
  getMostRecentProject,
  getProjectById,
  setActiveProject,
} from "../services/projectService";
import {
  getActiveSessionId,
  getSessionById,
  getSessionCountForProject,
} from "../services/SessionService";
import ProjectPanel from "./ProjectPanel";
import SessionPanel from "./SessionPanel";
import ForgePulseWorkspace from "./workspaces/ForgePulseWorkspace";
import ForgeTuneWorkspace from "./workspaces/ForgeTuneWorkspace";
import JamForgeWorkspace from "./workspaces/JamForgeWorkspace";
import ToneLabWorkspace from "./workspaces/ToneLabWorkspace";
import SignalForgeWorkspace from "./workspaces/SignalForgeWorkspace";
import WorkshopWorkspace from "./workspaces/WorkshopWorkspace";
import StudioPathWorkspace from "./workspaces/StudioPathWorkspace";
import MentorPortalWorkspace from "./workspaces/MentorPortalWorkspace";

type WorkspaceProps = {
  activeModule: string;
  setActiveModule: (module: string) => void;
  theme: string;
  onWorkstationStatusRefresh: () => Promise<void>;
};

// Placeholder cards for workspaces that do not yet have dedicated views
function getWorkspaceCards(activeModule: string) {
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

    case "pulse":
      return [];

    default:
      return [];
  }
}

function Workspace({
  activeModule,
  setActiveModule,
  theme,
  onWorkstationStatusRefresh,
}: WorkspaceProps) {
  // Active project and session summary state
  const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
  const [recentProject, setRecentProject] = useState<Project | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [projectSessionCount, setProjectSessionCount] = useState(0);

  async function refreshProjectSessionDetails(project: Project) {
    const activeSessionId = await getActiveSessionId();

    const currentSession = activeSessionId
      ? await getSessionById(activeSessionId)
      : null;

    const sessionCount = await getSessionCountForProject(project.id);

    setActiveSession(currentSession);
    setProjectSessionCount(sessionCount);
  }

  async function loadCurrentProject() {
    const activeProjectId = await getActiveProjectId();

    if (activeProjectId) {
      const activeProject = await getProjectById(activeProjectId);

      if (activeProject) {
        setRecentProject(activeProject);
        await refreshProjectSessionDetails(activeProject);
        return;
      }
    }

    const mostRecentProject = await getMostRecentProject();

    if (mostRecentProject) {
      await setActiveProject(mostRecentProject.id);
      setRecentProject(mostRecentProject);
      await refreshProjectSessionDetails(mostRecentProject);
      return;
    }

    setRecentProject(null);
    setActiveSession(null);
    setProjectSessionCount(0);
  }

  // Load the most relevant project when the workspace first mounts
  useEffect(() => {
    loadCurrentProject();
  }, []);

  useEffect(() => {
    const refreshProjects = () => { loadCurrentProject(); };
    window.addEventListener("fretforge:projects-changed", refreshProjects);
    return () => window.removeEventListener("fretforge:projects-changed", refreshProjects);
  }, []);

  const currentModule =
    modules.find((module) => module.id === activeModule) ?? modules[0];

  const workspaceCards = getWorkspaceCards(activeModule);

  // Active workspace layout
  return (
    <main
      className={`flex min-h-0 flex-1 flex-col overflow-auto px-4 pb-6 pt-0 sm:px-6 lg:px-8 ${
        theme === "dark" ? "bg-zinc-950" : "bg-zinc-100"
      }`}
    >
      <section className="mx-auto flex min-h-full w-full max-w-[1600px] flex-1 flex-col">
        <div
          className={`sticky top-0 z-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pb-4 mb-8 ${
            theme === "dark"
              ? "bg-zinc-950 border-b border-zinc-800"
              : "bg-zinc-100 border-b border-zinc-300"
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-400 tracking-tight mb-3">
            {currentModule.name}
          </h1>

          <p
            className={`max-w-3xl text-sm sm:text-base leading-relaxed mb-4 ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            {currentModule.description}
          </p>

          {activeModule === "forge" && (
            <div className="flex flex-wrap gap-3">
              <button
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                    : "bg-zinc-200 hover:bg-zinc-300 text-zinc-900"
                }`}
                onClick={() =>
                  window.alert(
                    [
                      "FretForge Privacy & Data",
                      "",
                      "• No telemetry",
                      "• No hidden uploads",
                      "• No mandatory accounts",
                      "• User-owned data",
                      "• Local-first operation",
                      "• Exportable projects",
                      "• Portable backups",
                      "• PII rejected before save",
                    ].join("\n")
                  )
                }
              >
                Privacy & Data
              </button>
            </div>
          )}
        </div>

        <div className={`grid flex-1 grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-5 ${activeModule === "sessions" || activeModule === "forge" ? "items-stretch" : "items-start"}`}>
          {activeModule === "forge" && (
            <>
              <CurrentProjectCard
                project={recentProject}
                activeSession={activeSession}
                sessionCount={projectSessionCount}
                theme={theme}
                onManage={() => setActiveModule("sessions")}
              />
              <CurrentSessionCard
                activeSession={activeSession}
                theme={theme}
                onManage={() => setActiveModule("sessions")}
              />
            </>
          )}

          {activeModule === "sessions" && (
            <div className="col-span-full grid h-full min-h-[420px] grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
              <ProjectPanel
                theme={theme}
                onProjectChanged={async () => {
                  await loadCurrentProject();
                  setSessionRefreshKey((current) => current + 1);
                  await onWorkstationStatusRefresh();
                }}
              />
              <SessionPanel
                theme={theme}
                refreshKey={sessionRefreshKey}
                onWorkstationStatusRefresh={async () => {
                  await loadCurrentProject();
                  await onWorkstationStatusRefresh();
                }}
              />
            </div>
          )}

          {activeModule === "pulse" && (
            <div className="col-span-full">
              <ForgePulseWorkspace theme={theme} />
            </div>
          )}

          {activeModule === "tuner" && (
            <div className="col-span-full">
              <ForgeTuneWorkspace theme={theme} />
            </div>
          )}

          {activeModule === "jam" && (
            <div className="col-span-full">
              <JamForgeWorkspace theme={theme} />
            </div>
          )}

          {activeModule === "tone" && (
            <div className="col-span-full">
              <ToneLabWorkspace theme={theme} />
            </div>
          )}

          {activeModule === "signal" && (
            <div className="col-span-full">
              <SignalForgeWorkspace theme={theme} />
            </div>
          )}

          {activeModule === "workshop" && (
            <div className="col-span-full">
              <WorkshopWorkspace theme={theme} />
            </div>
          )}

          {activeModule === "studio" && (
            <div className="col-span-full">
              <StudioPathWorkspace theme={theme} />
            </div>
          )}

          {activeModule === "mentor" && (
            <div className="col-span-full">
              <MentorPortalWorkspace theme={theme} onOpenForgePulse={() => setActiveModule("pulse")} />
            </div>
          )}

          {workspaceCards.map(([title, body]) => (
            <div
              key={title}
              className={`flex flex-col rounded-2xl border p-5 sm:p-6 shadow-lg transition-all duration-200 min-h-[160px] max-h-none ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-900/80 shadow-black/20 hover:border-zinc-700 hover:bg-zinc-900 hover:-translate-y-0.5"
                  : "border-zinc-300 bg-white shadow-zinc-300/40 hover:border-zinc-400 hover:bg-zinc-50 hover:-translate-y-0.5"
              }`}
            >
              <h2
                className={`text-base sm:text-lg font-semibold tracking-tight mb-3 ${
                  theme === "dark" ? "text-zinc-100" : "text-zinc-900"
                }`}
              >
                {title}
              </h2>

              <p
                className={`text-sm sm:text-[15px] leading-relaxed flex-1 whitespace-pre-line ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-700"
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
