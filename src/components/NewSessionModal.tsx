import { useEffect, useState } from "react";
import { getProjects } from "../services/projectService";
import type { Project } from "../types/project";

type Props = {
  theme: string;
  defaultProjectId: number | null;
  onClose: () => void;
  onCreate: (projectId: number, name: string, notes: string) => void;
};

export default function NewSessionModal({ theme, defaultProjectId, onClose, onCreate }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState<number | null>(defaultProjectId);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  useEffect(() => { getProjects().then((items) => { setProjects(items); if (!projectId && items[0]) setProjectId(items[0].id); }); }, []);
  const fieldClass = `w-full rounded-lg border px-3 py-2 outline-none ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className={`w-full max-w-lg rounded-xl border p-6 shadow-2xl ${theme === "dark" ? "border-zinc-700 bg-zinc-900" : "border-zinc-300 bg-white"}`}>
      <h2 className="text-xl font-bold text-orange-400">New Session</h2>
      <p className="mt-2 text-sm text-zinc-500">Create an activity and attach it to an open project.</p>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Project<select value={projectId ?? ""} onChange={(event) => setProjectId(Number(event.target.value))} className={`${fieldClass} text-sm normal-case`}><option value="" disabled>Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
        <label className="grid gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Session Activity<input autoFocus value={name} onChange={(event) => setName(event.target.value)} className={`${fieldClass} text-sm normal-case`} placeholder="Record intro, practice main riff, track bass lines..." /></label>
        <label className="grid gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Session Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} maxLength={250} className={`${fieldClass} resize-none text-sm normal-case`} placeholder="What should be accomplished?" /></label>
      </div>
      <div className="mt-2 text-right text-xs text-zinc-500">{notes.length} / 250 characters</div>
      <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-zinc-600 px-4 py-2 text-sm">Cancel</button><button type="button" disabled={!projectId || !name.trim()} onClick={() => projectId && onCreate(projectId, name.trim(), notes.trim())} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Create Session</button></div>
    </div>
  </div>;
}
