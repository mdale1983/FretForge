import { useEffect, useMemo, useState } from "react";
import NewProjectModal from "./NewProjectModal";
import {
  completeProject,
  getCompletedProjects,
  createProject,
  deleteProject,
  getActiveProjectId,
  getProjects,
  renameProject,
  setActiveProject,
  updateProjectNotes,
} from "../services/projectService";
import { Project } from "../types/project";
import { useAsyncAction } from "../hooks/useAsyncAction";

type ProjectPanelProps = {
  theme: string;
  onProjectChanged: () => void;
};

function ProjectPanel({ theme, onProjectChanged }: ProjectPanelProps) {
  const projectAction = useAsyncAction();
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
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
  const [projectQuery, setProjectQuery] = useState("");
  const [projectSort, setProjectSort] = useState<"recent" | "name">("recent");

  const visibleProjects = useMemo(() => {
    const normalizedQuery = projectQuery.trim().toLocaleLowerCase();
    const filteredProjects = normalizedQuery
      ? projects.filter((project) =>
          project.name.toLocaleLowerCase().includes(normalizedQuery)
        )
      : projects;

    return projectSort === "name"
      ? [...filteredProjects].sort((left, right) =>
          left.name.localeCompare(right.name)
        )
      : filteredProjects;
  }, [projectQuery, projectSort, projects]);

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

  async function handleCreateProject(projectName: string, projectNotes: string) {
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

    const project = await createProject(trimmedName, projectNotes.trim());

    if (project) {
      await setActiveProject(project.id);
      setActiveProjectId(project.id);
    }

    setIsNewProjectOpen(false);

    await loadProjects();
    onProjectChanged();
    }, "The project could not be created. Please try again.");
  }

  async function handleSelectProject(projectId: number) {
    await projectAction.run(async () => {
    await setActiveProject(projectId);
    await loadProjects();
    onProjectChanged();
    }, "The active project could not be changed.");
  }

  function startRenamingProject(projectId: number, projectName: string) {
    setEditingProjectId(projectId);
    setEditingProjectName(projectName);
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

    if (projectPendingDelete.id === activeProjectId) {
      alert("You cannot delete the active project. Switch projects first.");
      setProjectPendingDelete(null);
      return;
    }

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
        className={`flex h-[420px] flex-col rounded-2xl border p-5 shadow-lg sm:p-6 ${
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

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <input
            type="search"
            value={projectQuery}
            onChange={(event) => setProjectQuery(event.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            className={`min-w-0 rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500 ${
              theme === "dark"
                ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-900"
            }`}
          />
          <select
            value={projectSort}
            onChange={(event) =>
              setProjectSort(event.target.value as "recent" | "name")
            }
            aria-label="Sort projects"
            className={`rounded-lg border px-3 py-2 text-sm ${
              theme === "dark"
                ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-900"
            }`}
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {visibleProjects.length === 0 && (
            <div
              className={`rounded-xl border px-5 py-8 text-center text-sm leading-relaxed ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-950 text-zinc-500"
                  : "border-zinc-300 bg-zinc-100 text-zinc-500"
              }`}
            >
              {projects.length === 0
                ? "No projects created yet. Create a project to begin building sessions, tones, and practice workflows."
                : `No projects match “${projectQuery.trim()}”.`}
            </div>
          )}

          {visibleProjects.map((project) => {
            const isActive = project.id === activeProjectId;

            return (
              <div
                key={project.id}
                className={`flex items-start gap-2 ${
                  theme === "dark" ? "text-zinc-300" : "text-zinc-700"
                }`}
              >
                <div
                  onClick={() => {
                    if (editingProjectId !== project.id) {
                      handleSelectProject(project.id);
                    }
                  }}
                  className={`flex-1 max-w-full overflow-hidden cursor-pointer rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                    isActive
                      ? "border-orange-500 bg-orange-500/10 text-orange-300 shadow-inner shadow-orange-500/10"
                      : theme === "dark"
                      ? "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900"
                      : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <div className="flex flex-col gap-3">
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

                            <div className="mt-1 text-xs text-zinc-500">
                              {isActive
                                ? "Active Project"
                                : `Last Opened: ${new Date(
                                    project.updated_at
                                  ).toLocaleDateString()}`}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 self-start pt-1">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            startRenamingProject(project.id, project.name);
                          }}
                          className="text-xs opacity-70 hover:opacity-100"
                        >
                          Rename
                        </button>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditingNotesProjectId(project.id);
                            setNotesValue(project.notes ?? "");
                          }}
                          className="text-xs text-blue-300 opacity-70 hover:opacity-100"
                        >
                          Edit Notes
                        </button>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCompleteProject(project);
                          }}
                          className="text-xs text-emerald-300 opacity-70 hover:opacity-100"
                        >
                          Complete
                        </button>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setProjectPendingDelete(project);
                          }}
                          className="text-xs text-red-400 opacity-70 hover:opacity-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {editingNotesProjectId === project.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesValue}
                          maxLength={250}
                          autoFocus
                          onChange={(event) => setNotesValue(event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          rows={4}
                          className={`w-full resize-none rounded-md border px-3 py-2 text-xs outline-none ${
                            theme === "dark"
                              ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                              : "border-zinc-300 bg-white text-zinc-900"
                          }`}
                        />

                        <div
                          className={`text-right text-xs ${
                            theme === "dark" ? "text-zinc-500" : "text-zinc-600"
                          }`}
                        >
                          {notesValue.length} / 250 characters
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSaveProjectNotes(project.id);
                            }}
                            className={`rounded-md border px-3 py-1 text-xs font-medium ${
                              theme === "dark"
                                ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                                : "border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            Save Notes
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingNotesProjectId(null);
                              setNotesValue("");
                            }}
                            className={`rounded-md border px-3 py-1 text-xs font-medium ${
                              theme === "dark"
                                ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`max-w-full overflow-hidden rounded-md border px-3 py-2 text-xs leading-relaxed break-words ${
                          theme === "dark"
                            ? "border-zinc-800 bg-zinc-950 text-zinc-400"
                            : "border-zinc-300 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        {project.notes?.trim() || "No project notes yet."}
                      </div>
                    )}
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
