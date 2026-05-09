import { useEffect, useState } from "react";
import NewProjectModal from "./NewProjectModal";
import {
  createProject,
  getActiveProjectId,
  getProjects,
  projectNameExists,
  renameProject,
  setActiveProject,
} from "../services/ProjectService";

type ProjectPanelProps = {
  theme: string;
  onProjectChanged: () => void;
};

function ProjectPanel({ theme, onProjectChanged }: ProjectPanelProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);

  const [projects, setProjects] = useState<any[]>([]);

  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  const [editingProjectName, setEditingProjectName] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const loadedProjects = await getProjects();
    const activeId = await getActiveProjectId();

    setProjects(loadedProjects);
    setActiveProjectId(activeId);
  }

  async function handleCreateProject(projectName: string) {
    const trimmedName = projectName.trim();

    if (!trimmedName) {
      return;
    }

    const nameExists = await projectNameExists(trimmedName);

    if (nameExists) {
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

    setActiveProjectId(projectId);
    onProjectChanged();
  }

  function startRenamingProject(
    projectId: number,
    projectName: string
  ) {
    setEditingProjectId(projectId);
    setEditingProjectName(projectName);
  }

  async function saveRenamedProject(projectId: number) {
    const trimmedName = editingProjectName.trim();

    if (!trimmedName) {
      return;
    }

    const nameExists = await projectNameExists(trimmedName);

    if (nameExists) {
      alert("A project with that name already exists.");
      return;
    }

    await renameProject(projectId, trimmedName);

    setEditingProjectId(null);
    setEditingProjectName("");

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
        <h2 className="font-semibold mb-2">Project Manager</h2>

        <p
          className={`text-sm mb-4 ${
            theme === "dark"
              ? "text-zinc-400"
              : "text-zinc-600"
          }`}
        >
          Create and load local FretForge projects.
        </p>

        <button
          onClick={() => setIsNewProjectOpen(true)}
          className="px-4 py-2 rounded border border-orange-500 text-orange-400 hover:bg-orange-500/10"
        >
          New Project
        </button>

        <div className="mt-4 space-y-2">
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;

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
                    if (editingProjectId !== project.id) {
                      handleSelectProject(project.id);
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
                    {editingProjectId === project.id ? (
                      <input
                        value={editingProjectName}
                        onChange={(event) =>
                          setEditingProjectName(event.target.value)
                        }
                        onClick={(event) => event.stopPropagation()}
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
                      <span>{project.name}</span>
                    )}

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
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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