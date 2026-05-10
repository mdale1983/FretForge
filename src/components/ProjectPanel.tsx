import { useEffect, useState } from "react";
import NewProjectModal from "./NewProjectModal";
import {
  createProject,
  deleteProject,
  getActiveProjectId,
  getProjects,
  renameProject,
  setActiveProject,
} from "../services/projectService";

type ProjectPanelProps = {
  theme: string;
  onProjectChanged: () => void;
};

function ProjectPanel({
  theme,
  onProjectChanged,
}: ProjectPanelProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] =
    useState(false);

  const [projects, setProjects] = useState<any[]>([]);

  const [activeProjectId, setActiveProjectId] =
    useState<number | null>(null);

  const [editingProjectId, setEditingProjectId] =
    useState<number | null>(null);

  const [editingProjectName, setEditingProjectName] =
    useState("");

  const [projectPendingDelete, setProjectPendingDelete] =
    useState<any | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const loadedProjects = await getProjects();
    const activeId = await getActiveProjectId();

    setProjects(loadedProjects);
    setActiveProjectId(activeId);
  }

  async function handleCreateProject(
    projectName: string
  ) {
    const trimmedName = projectName.trim();

    if (!trimmedName) {
      return;
    }

    const duplicateProject = projects.find(
      (project) =>
        project.name.toLowerCase() ===
        trimmedName.toLowerCase()
    );

    if (duplicateProject) {
      alert("A project with that name already exists.");
      return;
    }

    const project = await createProject(trimmedName);

    if (project) {
      await setActiveProject(project.id);
      setActiveProjectId(project.id);
    }

    setIsNewProjectOpen(false);

    await loadProjects();
    onProjectChanged();
  }

  async function handleSelectProject(projectId: number) {
    await setActiveProject(projectId);

    await loadProjects();

    onProjectChanged();
  }

  function startRenamingProject(
    projectId: number,
    projectName: string
  ) {
    setEditingProjectId(projectId);
    setEditingProjectName(projectName);
  }

  async function saveRenamedProject(
    projectId: number
  ) {
    const trimmedName = editingProjectName.trim();

    if (!trimmedName) {
      setEditingProjectId(null);
      setEditingProjectName("");
      return;
    }

    const duplicateProject = projects.find(
      (project) =>
        project.name.toLowerCase() ===
          trimmedName.toLowerCase() &&
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
  }

  async function handleDeleteProject() {
    if (!projectPendingDelete) {
      return;
    }

    if (
      projectPendingDelete.id === activeProjectId
    ) {
      alert(
        "You cannot delete the active project. Switch projects first."
      );

      setProjectPendingDelete(null);

      return;
    }

    await deleteProject(projectPendingDelete.id);

    setProjectPendingDelete(null);

    await loadProjects();
    onProjectChanged();
  }

  return (
    <>
      <div
        className={`rounded-xl border p-5 shadow-lg ${
          theme === "dark"
            ? "border-zinc-800 bg-zinc-900/80 shadow-black/20"
            : "border-zinc-300 bg-white shadow-zinc-300/40"
        }`}
      >
        <h2 className="mb-2 font-semibold">
          Project Manager
        </h2>

        <p
          className={`mb-4 text-sm ${
            theme === "dark"
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Create and load local FretForge projects.
        </p>

        <button
          onClick={() =>
            setIsNewProjectOpen(true)
          }
          className="rounded border border-orange-500 px-4 py-2 text-orange-400 hover:bg-orange-500/10"
        >
          New Project
        </button>

        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
          {projects.length === 0 && (
            <div
              className={`rounded border px-4 py-6 text-center text-sm ${
                theme === "dark"
                  ? "border-zinc-800 bg-zinc-950 text-zinc-500"
                  : "border-zinc-300 bg-zinc-100 text-zinc-500"
              }`}
            >
              No projects created yet.
            </div>
          )}

          {projects.map((project) => {
            const isActive =
              project.id === activeProjectId;

            return (
              <div
                key={project.id}
                className={`flex items-center gap-2 ${
                  theme === "dark"
                    ? "text-zinc-300"
                    : "text-zinc-700"
                }`}
              >
                <div
                  onClick={() => {
                    if (
                      editingProjectId !==
                      project.id
                    ) {
                      handleSelectProject(
                        project.id
                      );
                    }
                  }}
                  className={`flex-1 cursor-pointer rounded border px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "border-orange-500 bg-orange-500/10 text-orange-400"
                      : theme === "dark"
                      ? "border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800"
                      : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      {editingProjectId ===
                      project.id ? (
                        <input
                          autoFocus
                          onFocus={(event) => event.target.select()}
                          value={editingProjectName}
                          onChange={(event) =>
                            setEditingProjectName(
                              event.target.value
                            )
                          }
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                          onBlur={async () => {
                            await saveRenamedProject(
                              project.id
                            );
                          }}
                          onKeyDown={async (
                            event
                          ) => {
                            if (
                              event.key ===
                              "Enter"
                            ) {
                              await saveRenamedProject(
                                project.id
                              );
                            }

                            if (
                              event.key ===
                              "Escape"
                            ) {
                              setEditingProjectId(
                                null
                              );

                              setEditingProjectName(
                                ""
                              );
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
                          <span>
                            {project.name}
                          </span>

                          <span className="text-xs text-zinc-500">
                            {isActive
                              ? "Active Project"
                              : `Last Opened: ${new Date(
                                  project.updated_at
                                ).toLocaleDateString()}`}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();

                          startRenamingProject(
                            project.id,
                            project.name
                          );
                        }}
                        className="text-xs opacity-70 hover:opacity-100"
                      >
                        Rename
                      </button>

                      <button
                        onClick={(event) => {
                          event.stopPropagation();

                          setProjectPendingDelete(
                            project
                          );
                        }}
                        className="text-xs text-red-400 opacity-70 hover:opacity-100"
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
            <h2 className="mb-3 text-lg font-semibold">
              Delete Project
            </h2>

            <p
              className={`mb-6 text-sm ${
                theme === "dark"
                  ? "text-zinc-400"
                  : "text-zinc-600"
              }`}
            >
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {projectPendingDelete.name}
              </span>
              ?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setProjectPendingDelete(null)
                }
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

      {isNewProjectOpen && (
        <NewProjectModal
          theme={theme}
          onClose={() =>
            setIsNewProjectOpen(false)
          }
          onCreate={handleCreateProject}
        />
      )}
    </>
  );
}

export default ProjectPanel;