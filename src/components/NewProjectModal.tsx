import { useEffect, useState } from "react";
import { getSignalChains, type SignalChain } from "../features/signalforge/signalChainService";

type NewProjectModalProps = {
  theme: string;
  onClose: () => void;
  onCreate: (projectName: string, projectNotes: string, tuning: string, signalChain: SignalChain | null, sessionName: string, sessionNotes: string) => void;
};

function NewProjectModal({ theme, onClose, onCreate }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectNotes, setProjectNotes] = useState("");
  const [tuning, setTuning] = useState("C# Standard");
  const [signalChains, setSignalChains] = useState<SignalChain[]>([]);
  const [signalChainId, setSignalChainId] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [sessionName, setSessionName] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const tuningOptions = ["Standard", "Eb Standard", "D Standard", "C# Standard", "C Standard", "Drop D", "Drop C#", "Drop C", "Drop B", "Drop A", "Standard 7", "Drop A 7", "Standard 8", "Drop E 8"];
  const selectedChain = signalChains.find((chain) => chain.id === signalChainId) ?? null;
  const pedals = selectedChain?.blocks.filter((block) => !["instrument", "wireless", "interface", "daw"].includes(block.type)) ?? [];

  useEffect(() => { getSignalChains().then(setSignalChains).catch(() => setSignalChains([])); }, []);

  function handleCreate() {
    if (step === 1) {
      if (projectName.trim()) setStep(2);
      return;
    }
    onCreate(projectName, projectNotes, tuning, selectedChain, sessionName, sessionNotes);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border p-6 shadow-2xl ${
          theme === "dark"
            ? "border-zinc-700 bg-zinc-900"
            : "border-zinc-300 bg-white"
        }`}
      >
        <h2 className="mb-2 text-xl font-bold text-orange-400">
          {step === 1 ? "New Project" : "Create First Session"}
        </h2>

        <p
          className={`mb-4 text-sm ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
          }`}
        >
          {step === 1 ? "Create a local FretForge project." : `Add the first activity for ${projectName.trim()}.`}
        </p>

        {step === 1 ? <>

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

        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          <label className={`grid gap-2 text-xs font-medium uppercase tracking-wide ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`}>Project Tuning<select value={tuning} onChange={(event) => setTuning(event.target.value)} className={`rounded border px-3 py-2 text-sm normal-case outline-none ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`}>{tuningOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
          <label className={`grid gap-2 text-xs font-medium uppercase tracking-wide ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`}>Pedal Setup<select value={signalChainId ?? ""} onChange={(event) => setSignalChainId(event.target.value ? Number(event.target.value) : null)} className={`rounded border px-3 py-2 text-sm normal-case outline-none ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`}><option value="">No pedalboard assigned</option>{signalChains.map((chain) => <option key={chain.id} value={chain.id}>{chain.name}</option>)}</select></label>
        </div>

        {selectedChain && <div className={`mb-5 rounded-xl border p-4 text-sm ${theme === "dark" ? "border-zinc-700 bg-zinc-950" : "border-zinc-300 bg-zinc-50"}`}><div className="font-semibold text-orange-400">{selectedChain.name}</div><div className="mt-3 grid gap-2"><p><span className="text-zinc-500">Active pedals:</span> {pedals.filter((pedal) => !pedal.bypassed).map((pedal) => pedal.label).join(", ") || "None"}</p><p><span className="text-zinc-500">Bypassed pedals:</span> {pedals.filter((pedal) => pedal.bypassed).map((pedal) => pedal.label).join(", ") || "None"}</p></div></div>}
        </> : <>
          <label className={`mb-2 block text-xs font-medium uppercase tracking-wide ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`}>Session Activity</label>
          <input autoFocus value={sessionName} onChange={(event) => setSessionName(event.target.value)} className={`mb-4 w-full rounded border px-3 py-2 outline-none ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`} placeholder="Record intro, practice main riff, track bass lines..." />
          <label className={`mb-2 block text-xs font-medium uppercase tracking-wide ${theme === "dark" ? "text-zinc-500" : "text-zinc-600"}`}>Session Notes</label>
          <textarea value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} rows={5} maxLength={250} className={`mb-2 w-full resize-none rounded border px-3 py-2 text-sm outline-none ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`} placeholder="What should be accomplished in this session?" />
          <div className="mb-5 text-right text-xs text-zinc-500">{sessionNotes.length} / 250 characters</div>
          <div className={`mb-5 rounded-lg border p-3 text-sm ${theme === "dark" ? "border-zinc-700 bg-zinc-950" : "border-zinc-300 bg-zinc-50"}`}><span className="text-zinc-500">Project:</span> {projectName.trim()}</div>
        </>}

        <div className="flex justify-end gap-3">
          <button
            onClick={() => step === 2 ? setStep(1) : onClose()}
            className="rounded border border-zinc-500 px-4 py-2 text-zinc-400 hover:bg-zinc-500/10"
          >
            {step === 2 ? "Back" : "Cancel"}
          </button>

          <button
            onClick={handleCreate}
            disabled={step === 1 ? !projectName.trim() : !sessionName.trim()}
            className="rounded border border-orange-500 px-4 py-2 text-orange-400 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === 1 ? "Next" : "Create Project & Session"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewProjectModal;
