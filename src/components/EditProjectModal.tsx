import { useEffect, useState } from "react";
import { getSignalChains, type SignalChain } from "../features/signalforge/signalChainService";
import type { Project } from "../types/project";

type Props = {
  project: Project;
  theme: string;
  onClose: () => void;
  onSave: (name: string, notes: string, tuning: string, signalChain: SignalChain | null) => void;
};

const tuningOptions = ["Standard", "Eb Standard", "D Standard", "C# Standard", "C Standard", "Drop D", "Drop C#", "Drop C", "Drop B", "Drop A", "Standard 7", "Drop A 7", "Standard 8", "Drop E 8"];

export default function EditProjectModal({ project, theme, onClose, onSave }: Props) {
  const [name, setName] = useState(project.name);
  const [notes, setNotes] = useState(project.notes ?? "");
  const [tuning, setTuning] = useState(project.tuning ?? "C# Standard");
  const [signalChains, setSignalChains] = useState<SignalChain[]>([]);
  const [signalChainId, setSignalChainId] = useState<number | null>(project.signal_chain_id ?? null);
  const selectedChain = signalChains.find((chain) => chain.id === signalChainId) ?? null;
  const pedals = selectedChain?.blocks.filter((block) => !["instrument", "wireless", "interface", "daw"].includes(block.type)) ?? [];

  useEffect(() => { getSignalChains().then(setSignalChains).catch(() => setSignalChains([])); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border p-6 shadow-2xl ${theme === "dark" ? "border-zinc-700 bg-zinc-900" : "border-zinc-300 bg-white"}`}>
        <h2 className="text-xl font-bold text-orange-400">Edit Project</h2>
        <p className="mb-5 mt-1 text-sm text-zinc-500">Update the project setup used by future sessions.</p>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">Project Name</label>
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} className={`mb-4 w-full rounded border px-3 py-2 outline-none ${theme === "dark" ? "border-zinc-700 bg-zinc-950" : "border-zinc-300 bg-white"}`} />
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Tuning<select value={tuning} onChange={(event) => setTuning(event.target.value)} className={`rounded border px-3 py-2 text-sm normal-case ${theme === "dark" ? "border-zinc-700 bg-zinc-950" : "border-zinc-300 bg-white"}`}>{tuningOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="grid gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Pedalboard<select value={signalChainId ?? ""} onChange={(event) => setSignalChainId(event.target.value ? Number(event.target.value) : null)} className={`rounded border px-3 py-2 text-sm normal-case ${theme === "dark" ? "border-zinc-700 bg-zinc-950" : "border-zinc-300 bg-white"}`}><option value="">No pedalboard assigned</option>{signalChains.map((chain) => <option key={chain.id} value={chain.id}>{chain.name}</option>)}</select></label>
        </div>
        {selectedChain && <div className={`mb-4 rounded-xl border p-4 text-sm ${theme === "dark" ? "border-zinc-700 bg-zinc-950" : "border-zinc-300 bg-zinc-50"}`}><div className="font-semibold text-orange-400">{selectedChain.name}</div><p className="mt-2"><span className="text-zinc-500">Active:</span> {pedals.filter((pedal) => !pedal.bypassed).map((pedal) => pedal.label).join(", ") || "None"}</p><p className="mt-1"><span className="text-zinc-500">Bypassed:</span> {pedals.filter((pedal) => pedal.bypassed).map((pedal) => pedal.label).join(", ") || "None"}</p></div>}
        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</label>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={250} rows={5} className={`w-full resize-none rounded border px-3 py-2 text-sm ${theme === "dark" ? "border-zinc-700 bg-zinc-950" : "border-zinc-300 bg-white"}`} />
        <div className="mt-1 text-right text-xs text-zinc-500">{notes.length} / 250 characters</div>
        <div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="rounded border border-zinc-600 px-4 py-2 text-sm">Cancel</button><button disabled={!name.trim()} onClick={() => onSave(name, notes, tuning, selectedChain)} className="rounded border border-orange-500 px-4 py-2 text-sm text-orange-400 disabled:opacity-40">Save Project</button></div>
      </div>
    </div>
  );
}
