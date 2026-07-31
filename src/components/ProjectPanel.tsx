import { useEffect, useState } from "react";
import NewProjectModal from "./NewProjectModal";
import EditProjectModal from "./EditProjectModal";
import {
  completeProject,
  getCompletedProjects,
  createProject,
  deleteProject,
  getActiveProjectId,
  getProjects,
  renameProject,
  reopenProject,
  setActiveProject,
  updateProjectNotes,
  updateProjectSettings,
} from "../services/projectService";
import { Project } from "../types/project";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { createSession, setActiveSession } from "../services/SessionService";

type ProjectPanelProps = {
  theme: string;
  onProjectChanged: () => void;
};

function ProjectPanel({ theme, onProjectChanged }: ProjectPanelProps) {
  const projectAction = useAsyncAction();
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [projectBeingEdited, setProjectBeingEdited] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  const [isCompletedProjectsOpen, setIsCompletedProjectsOpen] = useState(false);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [editingNotesProjectId, setEditingNotesProjectId] =
    useState<number | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [projectPendingDelete, setProjectPendingDelete] =
    useState<Project | null>(null);
  const selectedProject =
    projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null;
  const projectQuery = "";

  useEffect(() => {
    projectAction.run(
      loadProjects,
      "Projects could not be loaded. Please try again."
    );
  }, [projectAction.run]);

  async function loadProjects() {
    const loadedProjects = await getProjects();
    const activeId = await getActiveProjectId();

    setProjects(loadedProjects);
    setActiveProjectId(activeId);
  }

  async function loadCompletedProjects() {
    const loadedCompletedProjects = await getCompletedProjects();
    setCompletedProjects(loadedCompletedProjects);
  }

  async function handleCreateProject(projectName: string, projectNotes: string, tuning: string, signalChain: import("../features/signalforge/signalChainService").SignalChain | null, sessionName: string, sessionNotes: string) {
    await projectAction.run(async () => {
    const trimmedName = projectName.trim();

    if (!trimmedName) return;

    const duplicateProject = projects.find(
      (project) => project.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (duplicateProject) {
      alert("A project with that name already exists.");
      return;
    }

    const project = await createProject(trimmedName, projectNotes.trim(), tuning, signalChain);

    if (project) {
      await setActiveProject(project.id);
      setActiveProjectId(project.id);
      const session = await createSession(project.id, sessionName, sessionNotes);
      if (session) await setActiveSession(session.id);
    }

    setIsNewProjectOpen(false);

    await loadProjects();
    onProjectChanged();
    }, "The project could not be created. Please try again.");
  }

  async function handleDeleteCompletedProject(project: Project) {
    if (!window.confirm(`Permanently delete completed project "${project.name}" and all of its sessions? This cannot be undone.`)) return;
    await projectAction.run(async () => {
      await deleteProject(project.id);
      await loadCompletedProjects();
      await loadProjects();
      onProjectChanged();
    }, "The completed project could not be deleted.");
  }

  async function handleReopenProject(project: Project) {
    await projectAction.run(async () => {
      await reopenProject(project.id);
      await setActiveProject(project.id);
      setIsCompletedProjectsOpen(false);
      await loadCompletedProjects();
      await loadProjects();
      onProjectChanged();
    }, "The completed project could not be reopened.");
  }

  async function handleUpdateProject(name: string, notes: string, tuning: string, signalChain: import("../features/signalforge/signalChainService").SignalChain | null) {
    if (!projectBeingEdited) return;
    const duplicate = projects.some((project) => project.id !== projectBeingEdited.id && project.name.toLowerCase() === name.trim().toLowerCase());
    if (duplicate) { window.alert("A project with that name already exists."); return; }
    await projectAction.run(async () => {
      await updateProjectSettings(projectBeingEdited.id, name, notes, tuning, signalChain);
      setProjectBeingEdited(null);
      await loadProjects();
      onProjectChanged();
    }, "The project settings could not be saved.");
  }

  async function handleSelectProject(projectId: number) {
    await projectAction.run(async () => {
    await setActiveProject(projectId);
    await loadProjects();
    onProjectChanged();
    }, "The active project could not be changed.");
  }

  async function saveRenamedProject(projectId: number) {
    await projectAction.run(async () => {
    const trimmedName = editingProjectName.trim();

    if (!trimmedName) {
      setEditingProjectId(null);
      setEditingProjectName("");
      return;
    }

    const duplicateProject = projects.find(
      (project) =>
        project.name.toLowerCase() === trimmedName.toLowerCase() &&
        project.id !== projectId
    );

    if (duplicateProject) {
      alert("A project with that name already exists.");
      return;
    }

    await renameProject(projectId, trimmedName);

    setEditingProjectId(null);
    setEditingProjectName("");

    await loadProjects();
    onProjectChanged();
    }, "The project could not be renamed.");
  }

  async function handleSaveProjectNotes(projectId: number) {
    await projectAction.run(async () => {
    await updateProjectNotes(projectId, notesValue);

    setEditingNotesProjectId(null);
    setNotesValue("");

    await loadProjects();
    onProjectChanged();
    }, "The project notes could not be saved.");
  }

  async function handleDeleteProject() {
    await projectAction.run(async () => {
    if (!projectPendingDelete) return;

    await deleteProject(projectPendingDelete.id);

    setProjectPendingDelete(null);

    await loadProjects();
    onProjectChanged();
    }, "The project could not be deleted.");
  }

  async function handleCompleteProject(project: Project) {
    const confirmed = window.confirm(
      `Complete project "${project.name}"? This will also complete all sessions inside it.`
    );

    if (!confirmed) return;

    await projectAction.run(async () => {
    await completeProject(project.id);

    await loadProjects();
    onProjectChanged();
    }, "The project could not be completed.");
  }

  return (
    <>
      <div
        aria-busy={projectAction.isPending}
        className={`flex h-full min-h-[420px] flex-col rounded-2xl border p-5 shadow-lg sm:p-6 ${
          theme === "dark"
            ? "border-zinc-800 bg-zinc-900/80 shadow-black/20"
            : "border-zinc-300 bg-white shadow-zinc-300/40"
        }`}
      >
        <div className="mb-5">
          <h2 className="mb-2 text-lg font-semibold tracking-tight sm:text-xl">
            Project Manager
          </h2>

          <p
            className={`text-sm leading-relaxed ${
              theme === "dark" ? "text-zinc-400" : "text-zinc-600"
            }`}
          >
            Create, organize, and manage local FretForge projects.
          </p>

          {projectAction.errorMessage && (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {projectAction.errorMessage}
            </p>
          )}

          {projectAction.isPending && (
            <p className="mt-3 text-xs text-zinc-500">Updating project…</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsNewProjectOpen(true)}
            className="rounded-lg border border-orange-500 px-4 py-2.5 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/10"
          >
            New Project
          </button>

          <button
            onClick={async () => {
              await loadCompletedProjects();
              setIsCompletedProjectsOpen(true);
            }}
            className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-500/10"
          >
            Completed Projects
          </button>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-zinc-500">Selected Project</label>
          <select
            value={selectedProject?.id ?? ""}
            disabled={projects.length === 0}
            onChange={(event) => handleSelectProject(Number(event.target.value))}
            aria-label="Select project"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm ${
              theme === "dark"
                ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-900"
            }`}
          >
            {projects.length === 0 && <option value="">No projects available</option>}
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>

        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {!selectedProject && (
            <div
              className={`rounded-xl border px-5 py-8 text-center text-sm leading-relaxed ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-950 text-zinc-500"
                  : "border-zinc-300 bg-zinc-100 text-zinc-500"
              }`}
            >
              {projects.length === 0
                ? "Please create your first project to begin."
                : `No projects match “${projectQuery.trim()}”.`}
            </div>
          )}

          {selectedProject && [selectedProject].map((project) => {
            const isActive = project.id === activeProjectId;
            const rigSnapshot = (() => {
              try {
                return project.rig_snapshot_json
                  ? JSON.parse(project.rig_snapshot_json) as { name?: string; blocks?: { type: string; label: string; bypassed: boolean }[] }
                  : null;
              } catch { return null; }
            })();
            const pedals = rigSnapshot?.blocks?.filter(
              (block) => !["instrument", "wireless", "interface", "daw"].includes(block.type)
            ) ?? [];
            const activePedals = pedals.filter((pedal) => !pedal.bypassed).map((pedal) => pedal.label);
            const bypassedPedals = pedals.filter((pedal) => pedal.bypassed).map((pedal) => pedal.label);

            return (
              <div
                key={project.id}
                className={`flex h-full items-stretch gap-2 ${
                  theme === "dark" ? "text-zinc-300" : "text-zinc-700"
                }`}
              >
                <div
                  onClick={() => {
                    if (editingProjectId !== project.id) {
                      handleSelectProject(project.id);
                    }
                  }}
                  className={`flex min-h-[360px] flex-1 max-w-full cursor-pointer flex-col overflow-hidden rounded-xl border px-4 py-4 text-left text-sm transition-all duration-200 ${
                    isActive
                      ? "border-orange-500 bg-orange-500/10 text-orange-300 shadow-inner shadow-orange-500/10"
                      : theme === "dark"
                      ? "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900"
                      : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <div className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {editingProjectId === project.id ? (
                          <input
                            autoFocus
                            onFocus={(event) => event.target.select()}
                            value={editingProjectName}
                            onChange={(event) =>
                              setEditingProjectName(event.target.value)
                            }
                            onClick={(event) => event.stopPropagation()}
                            onBlur={async () => {
                              await saveRenamedProject(project.id);
                            }}
                            onKeyDown={async (event) => {
                              if (event.key === "Enter") {
                                await saveRenamedProject(project.id);
                              }

                              if (event.key === "Escape") {
                                setEditingProjectId(null);
                                setEditingProjectName("");
                              }
                            }}
                            className={`w-full rounded border px-2 py-1 text-sm outline-none ${
                              theme === "dark"
                                ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                                : "border-zinc-300 bg-white text-zinc-900"
                            }`}
                          />
                        ) : (
                          <>
                            <div
                              className={`font-medium ${
                                theme === "dark"
                                  ? "text-zinc-100"
                                  : "text-zinc-900"
                              }`}
                            >
                              {project.name}
                            </div>
                          </>
                        )}
                      </div>

                    </div>

                    <div className={`grid gap-3 rounded-xl border p-4 ${
                      theme === "dark"
                        ? "border-orange-500/30 bg-orange-500/5"
                        : "border-orange-300 bg-orange-50"
                    }`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-zinc-500">Tuning</div>
                          <div className="mt-1 font-medium">{project.tuning || "C# Standard"}</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-zinc-500">Pedalboard</div>
                          <div className="mt-1 font-medium">{rigSnapshot?.name || "Not assigned"}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Active Pedals</div>
                        <div className="mt-1 leading-relaxed">{activePedals.join(", ") || "None"}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Bypassed Pedals</div>
                        <div className="mt-1 leading-relaxed">{bypassedPedals.join(", ") || "None"}</div>
                      </div>
                    </div>

                    <div className="flex min-h-[110px] flex-1 flex-col">
                      <div className="mb-1.5 text-[11px] uppercase tracking-wide text-zinc-500">Notes</div>
                      {editingNotesProjectId === project.id ? (
                        <div className="flex min-h-0 flex-1 flex-col gap-2">
                          <textarea value={notesValue} maxLength={250} autoFocus onChange={(event) => setNotesValue(event.target.value)} onClick={(event) => event.stopPropagation()} className={`min-h-[80px] w-full flex-1 resize-none rounded-md border px-3 py-2 text-xs outline-none ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`} />
                          <div className="text-right text-xs text-zinc-500">{notesValue.length} / 250 characters</div>
                          <div className="flex gap-2">
                            <button type="button" onClick={(event) => { event.stopPropagation(); handleSaveProjectNotes(project.id); }} className="rounded-md border border-emerald-500/40 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10">Save Notes</button>
                            <button type="button" onClick={(event) => { event.stopPropagation(); setEditingNotesProjectId(null); setNotesValue(""); }} className="rounded-md border border-zinc-600 px-3 py-1 text-xs font-medium hover:bg-zinc-500/10">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`min-h-[80px] flex-1 overflow-y-auto rounded-md border px-3 py-3 text-xs leading-relaxed break-words ${theme === "dark" ? "border-zinc-800 bg-zinc-950 text-zinc-400" : "border-zinc-300 bg-zinc-50 text-zinc-600"}`}>{project.notes?.trim() || "No project notes yet."}</div>
                      )}
                    </div>

                    <div className={`mt-auto grid grid-cols-3 items-center gap-1.5 border-t pt-4 ${
                      theme === "dark" ? "border-zinc-800" : "border-zinc-300"
                    }`}>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setProjectBeingEdited(project);
                        }}
                        className="whitespace-nowrap rounded-md border border-blue-500/50 px-2 py-1.5 text-[11px] text-blue-300 hover:bg-blue-500/10"
                      >
                        Edit Project
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCompleteProject(project);
                        }}
                        className="whitespace-nowrap rounded-md border border-emerald-500/50 px-2 py-1.5 text-[11px] text-emerald-300 hover:bg-emerald-500/10"
                      >
                        Complete
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setProjectPendingDelete(project);
                        }}
                        className="whitespace-nowrap rounded-md border border-red-500/50 px-2 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {projectPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className={`w-full max-w-md rounded-xl border p-6 shadow-xl ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900"
                : "border-zinc-300 bg-white"
            }`}
          >
            <h2 className="mb-3 text-lg font-semibold">Delete Project</h2>

            <p
              className={`mb-6 text-sm ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Are you sure you want to delete{" "}
              <span className="font-semibold">{projectPendingDelete.name}</span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProjectPendingDelete(null)}
                className={`rounded border px-4 py-2 text-sm ${
                  theme === "dark"
                    ? "border-zinc-700 hover:bg-zinc-800"
                    : "border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await handleDeleteProject();
                }}
                className="rounded border border-red-500 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {projectBeingEdited && <EditProjectModal project={projectBeingEdited} theme={theme} onClose={() => setProjectBeingEdited(null)} onSave={handleUpdateProject} />}
        {isCompletedProjectsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div
              className={`w-full max-w-lg rounded-xl border p-6 shadow-xl ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-900"
                  : "border-zinc-300 bg-white"
              }`}
            >
              <h2 className="mb-3 text-lg font-semibold">
                Completed Projects
              </h2>

              <p
                className={`mb-5 text-sm ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                Completed projects are kept for later reference.
              </p>

              <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {completedProjects.length === 0 ? (
                  <div
                    className={`rounded-xl border px-5 py-8 text-center text-sm ${
                      theme === "dark"
                        ? "border-zinc-800 bg-zinc-950 text-zinc-500"
                        : "border-zinc-300 bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    No completed projects yet.
                  </div>
                ) : (
                  completedProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`rounded-xl border px-4 py-3 text-sm ${
                        theme === "dark"
                          ? "border-zinc-700 bg-zinc-950 text-zinc-300"
                          : "border-zinc-300 bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      <div className="font-medium text-orange-400">
                        {project.name}
                      </div>

                      <div className="mt-1 text-xs text-zinc-500">
                        Completed:{" "}
                        {project.completed_at
                          ? new Date(project.completed_at).toLocaleString()
                          : "Unknown"}
                      </div>

                      {project.notes?.trim() && (
                        <div
                          className={`mt-3 max-w-full overflow-hidden rounded-md border px-3 py-2 text-xs leading-relaxed break-words ${
                            theme === "dark"
                              ? "border-zinc-800 bg-zinc-900 text-zinc-400"
                              : "border-zinc-300 bg-white text-zinc-600"
                          }`}
                        >
                          {project.notes.trim()}
                        </div>
                      )}
                      <div className={`mt-3 grid gap-2 rounded-lg border p-3 text-xs ${theme === "dark" ? "border-zinc-800 bg-zinc-900" : "border-zinc-300 bg-white"}`}>
                        <div><span className="text-zinc-500">Tuning:</span> {project.tuning || "C# Standard"}</div>
                        <div><span className="text-zinc-500">Pedalboard:</span> {(() => { try { return project.rig_snapshot_json ? JSON.parse(project.rig_snapshot_json).name || "Not assigned" : "Not assigned"; } catch { return "Not assigned"; } })()}</div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button type="button" onClick={() => handleReopenProject(project)} className="rounded-md border border-emerald-500/50 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10">Reopen Project</button>
                        <button type="button" onClick={() => handleDeleteCompletedProject(project)} className="rounded-md border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10">Delete Permanently</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsCompletedProjectsOpen(false)}
                  className={`rounded border px-4 py-2 text-sm ${
                    theme === "dark"
                      ? "border-zinc-700 hover:bg-zinc-800"
                      : "border-zinc-300 hover:bg-zinc-100"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {isNewProjectOpen && (
        <NewProjectModal
          theme={theme}
          onClose={() => setIsNewProjectOpen(false)}
          onCreate={handleCreateProject}
        />
      )}
    </>
  );
}

export default ProjectPanel;
