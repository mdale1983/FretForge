import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Plus,
  Power,
  Save,
  Trash2,
} from "lucide-react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import {
  createSignalChain,
  defaultSignalBlocks,
  deleteSignalChain,
  getSignalChains,
  updateSignalChain,
  type SignalBlock,
  type SignalBlockType,
  type SignalChain,
} from "../../features/signalforge/signalChainService";

type SignalForgeWorkspaceProps = { theme: string };

const blockOptions: { type: SignalBlockType; label: string }[] = [
  { type: "instrument", label: "Instrument" },
  { type: "pedal", label: "Pedal / Effect" },
  { type: "amp", label: "Amp" },
  { type: "cab", label: "Cab / IR" },
  { type: "interface", label: "Audio Interface" },
  { type: "daw", label: "DAW / Recorder" },
];

function newBlock(type: SignalBlockType): SignalBlock {
  const option = blockOptions.find((item) => item.type === type)!;
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    type,
    label: option.label,
    bypassed: false,
  };
}

export default function SignalForgeWorkspace({ theme }: SignalForgeWorkspaceProps) {
  const action = useAsyncAction();
  const [chains, setChains] = useState<SignalChain[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [blocks, setBlocks] = useState<SignalBlock[]>([]);
  const [blockType, setBlockType] = useState<SignalBlockType>("pedal");
  const selectedChain = chains.find((chain) => chain.id === selectedId);
  const isDirty = selectedChain
    ? selectedChain.name !== name ||
      selectedChain.notes !== notes ||
      JSON.stringify(selectedChain.blocks) !== JSON.stringify(blocks)
    : false;

  function loadDraft(chain: SignalChain | undefined) {
    setSelectedId(chain?.id ?? null);
    setName(chain?.name ?? "");
    setNotes(chain?.notes ?? "");
    setBlocks(chain?.blocks ?? []);
  }

  async function loadChains(preferredId?: number) {
    const loaded = await getSignalChains();
    setChains(loaded);
    loadDraft(
      loaded.find((chain) => chain.id === preferredId) ??
        loaded.find((chain) => chain.id === selectedId) ??
        loaded[0]
    );
  }

  useEffect(() => {
    action.run(loadChains, "Signal chains could not be loaded.");
  }, [action.run]);

  async function handleCreate() {
    if (isDirty && !window.confirm("Discard unsaved changes and create a new chain?")) {
      return;
    }

    await action.run(async () => {
      const created = await createSignalChain(
        `Signal Chain ${chains.length + 1}`,
        defaultSignalBlocks.map((block) => ({ ...block }))
      );
      await loadChains(created?.id);
    }, "A signal chain could not be created.");
  }

  async function handleSave() {
    if (!selectedId || !name.trim()) return;
    await action.run(async () => {
      await updateSignalChain(selectedId, name.trim(), blocks, notes);
      await loadChains(selectedId);
    }, "This signal chain could not be saved.");
  }

  async function handleDuplicate() {
    await action.run(async () => {
      const created = await createSignalChain(`${name || "Signal Chain"} Copy`, blocks, notes);
      await loadChains(created?.id);
    }, "This signal chain could not be duplicated.");
  }

  async function handleDelete() {
    if (!selectedId || !window.confirm(`Delete signal chain "${name}"?`)) return;
    await action.run(async () => {
      await deleteSignalChain(selectedId);
      setSelectedId(null);
      await loadChains();
    }, "This signal chain could not be deleted.");
  }

  function updateBlock(id: string, updates: Partial<SignalBlock>) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, ...updates } : block))
    );
  }

  function selectChain(chain: SignalChain) {
    if (
      chain.id !== selectedId &&
      isDirty &&
      !window.confirm("Discard unsaved changes to the current signal chain?")
    ) {
      return;
    }

    loadDraft(chain);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= blocks.length) return;
    setBlocks((current) => {
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [
        reordered[destination],
        reordered[index],
      ];
      return reordered;
    });
  }

  const inputClass = `rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500 ${
    theme === "dark"
      ? "border-zinc-700 bg-zinc-950 text-zinc-100"
      : "border-zinc-300 bg-white text-zinc-900"
  }`;

  return (
    <section className={`rounded-2xl border p-5 shadow-lg sm:p-6 ${theme === "dark" ? "border-zinc-800 bg-zinc-900/80 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-orange-400">Signal Forge</h2>
          <p className="mt-2 text-sm text-zinc-500">Document and compare repeatable instrument-to-recording signal paths.</p>
        </div>
        <button type="button" onClick={handleCreate} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /> New Chain</button>
      </div>

      {action.errorMessage && <p className="mt-4 text-sm text-red-400" role="alert">{action.errorMessage}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-2">
          {chains.length === 0 ? <p className="rounded-lg border border-zinc-700/60 p-4 text-sm text-zinc-500">Create your first signal chain.</p> : chains.map((chain) => (
            <button key={chain.id} type="button" onClick={() => selectChain(chain)} className={`w-full rounded-lg border p-3 text-left ${selectedId === chain.id ? "border-orange-500 bg-orange-500/10" : "border-zinc-700/60"}`}>
              <span className="block truncate text-sm font-semibold">{chain.name}</span>
              <span className="mt-1 block text-xs text-zinc-500">{chain.blocks.length} blocks</span>
            </button>
          ))}
        </aside>

        <div className="rounded-xl border border-zinc-700/60 p-4 sm:p-5">
          {selectedId ? <>
            {isDirty && <p className="mb-4 text-xs font-medium text-orange-400">Unsaved changes</p>}
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} aria-label="Signal chain name" />
              <button type="button" onClick={handleDuplicate} className="flex items-center justify-center gap-2 rounded-lg border border-zinc-600 px-3 py-2 text-sm"><Copy size={15} /> Duplicate</button>
              <button type="button" onClick={handleSave} className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white"><Save size={15} /> Save</button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <select value={blockType} onChange={(event) => setBlockType(event.target.value as SignalBlockType)} className={inputClass}>{blockOptions.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}</select>
              <button type="button" onClick={() => setBlocks((current) => [...current, newBlock(blockType)])} className="rounded-lg border border-orange-500 px-3 py-2 text-sm text-orange-400">Add Block</button>
            </div>

            <div className="mt-5 space-y-2">
              {blocks.map((block, index) => (
                <div key={block.id} className={`grid items-center gap-2 rounded-xl border p-3 sm:grid-cols-[auto_1fr_auto] ${block.bypassed ? "border-zinc-800 opacity-50" : "border-zinc-700/60"}`}>
                  <span className="rounded bg-zinc-800 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-400">{block.type}</span>
                  <input value={block.label} onChange={(event) => updateBlock(block.id, { label: event.target.value })} className={inputClass} aria-label={`${block.type} block name`} />
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="rounded p-2 disabled:opacity-25" aria-label="Move block up"><ArrowUp size={15} /></button>
                    <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="rounded p-2 disabled:opacity-25" aria-label="Move block down"><ArrowDown size={15} /></button>
                    <button type="button" onClick={() => updateBlock(block.id, { bypassed: !block.bypassed })} className={`rounded p-2 ${block.bypassed ? "text-zinc-500" : "text-emerald-400"}`} aria-label="Toggle bypass"><Power size={15} /></button>
                    <button type="button" onClick={() => setBlocks((current) => current.filter((item) => item.id !== block.id))} className="rounded p-2 text-red-400" aria-label="Remove block"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>

            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${inputClass} mt-5 min-h-20 w-full resize-y`} placeholder="Routing notes, cable details, levels, or troubleshooting…" aria-label="Signal chain notes" />
            <button type="button" onClick={handleDelete} className="mt-4 flex items-center gap-2 text-sm text-red-400"><Trash2 size={15} /> Delete Chain</button>
          </> : <div className="flex min-h-64 items-center justify-center text-sm text-zinc-500">Select or create a signal chain.</div>}
        </div>
      </div>
    </section>
  );
}
