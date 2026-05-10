import { useState } from "react";

type NewProjectModalProps = {
  theme: string;
  onClose: () => void;
  onCreate: (projectName: string) => void;
};

function NewProjectModal({ theme, onClose, onCreate }: NewProjectModalProps) {
    const [projectName, setProjectName] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className={`w-full max-w-md rounded-xl border p-6 shadow-2xl ${
          theme === "dark"
            ? "border-zinc-700 bg-zinc-900"
            : "border-zinc-300 bg-white"
        }`}
      >
        <h2 className="text-xl font-bold text-orange-400 mb-2">
          New Project
        </h2>

        <p
          className={`text-sm mb-4 ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
          }`}
        >
          Create a local FretForge project.
        </p>

        <input
          autoFocus
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          onKeyDown={(event) => {
              if (event.key === "Enter") {
                  onCreate(projectName);
              }

              if (event.key === "Escape") {
                  onClose();
              }
          }}
          className={`w-full rounded border px-3 py-2 mb-4 outline-none ${
              theme === "dark"
              ? "border-zinc-700 bg-zinc-950 text-zinc-100"
              : "border-zinc-300 bg-white text-zinc-900"
          }`}
          placeholder="Project name"
      />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-zinc-500 text-zinc-400 hover:bg-zinc-500/10"
          >
            Cancel
          </button>

          <button
            onClick={() => onCreate(projectName)}
            className="px-4 py-2 rounded border border-orange-500 text-orange-400 hover:bg-orange-500/10"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewProjectModal;