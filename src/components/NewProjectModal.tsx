import { useState } from "react";

type NewProjectModalProps = {
  theme: string;
  onClose: () => void;
  onCreate: (projectName: string, projectNotes: string) => void;
};

function NewProjectModal({ theme, onClose, onCreate }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectNotes, setProjectNotes] = useState("");

  function handleCreate() {
    onCreate(projectName, projectNotes);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className={`w-full max-w-md rounded-xl border p-6 shadow-2xl ${
          theme === "dark"
            ? "border-zinc-700 bg-zinc-900"
            : "border-zinc-300 bg-white"
        }`}
      >
        <h2 className="mb-2 text-xl font-bold text-orange-400">
          New Project
        </h2>

        <p
          className={`mb-4 text-sm ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
          }`}
        >
          Create a local FretForge project.
        </p>

        <label
          className={`mb-2 block text-xs font-medium uppercase tracking-wide ${
            theme === "dark" ? "text-zinc-500" : "text-zinc-600"
          }`}
        >
          Project Name
        </label>

        <input
          autoFocus
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              handleCreate();
            }

            if (event.key === "Escape") {
              onClose();
            }
          }}
          className={`mb-4 w-full rounded border px-3 py-2 outline-none ${
            theme === "dark"
              ? "border-zinc-700 bg-zinc-950 text-zinc-100"
              : "border-zinc-300 bg-white text-zinc-900"
          }`}
          placeholder="Ashes to Dust"
        />

        <label
          className={`mb-2 block text-xs font-medium uppercase tracking-wide ${
            theme === "dark" ? "text-zinc-500" : "text-zinc-600"
          }`}
        >
          What is this project for?
        </label>

        <textarea
          value={projectNotes}
          onChange={(event) => setProjectNotes(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onClose();
            }
          }}
          rows={4}
          maxLength={250}
          className={`mb-2 w-full resize-none rounded border px-3 py-2 text-sm outline-none ${
            theme === "dark"
              ? "border-zinc-700 bg-zinc-950 text-zinc-100"
              : "border-zinc-300 bg-white text-zinc-900"
          }`}
          placeholder="Song, tone build, practice plan, setup log, recording workflow..."
        />

        <div
          className={`mb-5 text-right text-xs ${
            theme === "dark" ? "text-zinc-500" : "text-zinc-600"
          }`}
        >
          {projectNotes.length} / 250 characters
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded border border-zinc-500 px-4 py-2 text-zinc-400 hover:bg-zinc-500/10"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="rounded border border-orange-500 px-4 py-2 text-orange-400 hover:bg-orange-500/10"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewProjectModal;