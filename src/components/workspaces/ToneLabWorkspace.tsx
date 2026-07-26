import { useEffect, useState } from "react";
import { Copy, Plus, Save, SlidersHorizontal, Trash2 } from "lucide-react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import {
  createTonePreset,
  defaultTonePreset,
  deleteTonePreset,
  getTonePresets,
  updateTonePreset,
  type TonePreset,
  type TonePresetDraft,
} from "../../features/tonelab/tonePresetService";

type ToneLabWorkspaceProps = {
  theme: string;
};

type ToneControlKey = "gain" | "bass" | "mids" | "treble" | "presence";

const controls: { key: ToneControlKey; label: string }[] = [
  { key: "gain", label: "Gain" },
  { key: "bass", label: "Bass" },
  { key: "mids", label: "Mids" },
  { key: "treble", label: "Treble" },
  { key: "presence", label: "Presence" },
];

function toDraft(preset: TonePreset): TonePresetDraft {
  const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...draft } =
    preset;
  return draft;
}

export default function ToneLabWorkspace({ theme }: ToneLabWorkspaceProps) {
  const action = useAsyncAction();
  const [presets, setPresets] = useState<TonePreset[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<TonePresetDraft>(defaultTonePreset);
  const selectedPreset = presets.find((preset) => preset.id === selectedId);
  const isDirty = selectedPreset
    ? JSON.stringify(toDraft(selectedPreset)) !== JSON.stringify(draft)
    : false;

  async function loadPresets(preferredId?: number) {
    const loadedPresets = await getTonePresets();
    setPresets(loadedPresets);
    const selected =
      loadedPresets.find((preset) => preset.id === preferredId) ??
      loadedPresets.find((preset) => preset.id === selectedId) ??
      loadedPresets[0];

    setSelectedId(selected?.id ?? null);
    setDraft(selected ? toDraft(selected) : defaultTonePreset);
  }

  useEffect(() => {
    action.run(loadPresets, "Tone presets could not be loaded.");
  }, [action.run]);

  function selectPreset(preset: TonePreset) {
    if (
      preset.id !== selectedId &&
      isDirty &&
      !window.confirm("Discard unsaved changes to the current preset?")
    ) {
      return;
    }

    setSelectedId(preset.id);
    setDraft(toDraft(preset));
  }

  async function handleCreate() {
    if (isDirty && !window.confirm("Discard unsaved changes and create a new preset?")) {
      return;
    }

    await action.run(async () => {
      const created = await createTonePreset({
        ...defaultTonePreset,
        name: `Tone ${presets.length + 1}`,
      });
      await loadPresets(created?.id);
    }, "A new tone preset could not be created.");
  }

  async function handleSave() {
    if (!selectedId) return;
    const trimmedName = draft.name.trim();

    if (!trimmedName) {
      window.alert("Preset name cannot be empty.");
      return;
    }

    await action.run(async () => {
      await updateTonePreset(selectedId, { ...draft, name: trimmedName });
      await loadPresets(selectedId);
    }, "This tone preset could not be saved.");
  }

  async function handleDuplicate() {
    await action.run(async () => {
      const created = await createTonePreset({
        ...draft,
        name: `${draft.name.trim() || "Tone"} Copy`,
      });
      await loadPresets(created?.id);
    }, "This tone preset could not be duplicated.");
  }

  async function handleDelete() {
    if (!selectedId || !window.confirm(`Delete tone preset "${draft.name}"?`)) {
      return;
    }

    await action.run(async () => {
      await deleteTonePreset(selectedId);
      setSelectedId(null);
      await loadPresets();
    }, "This tone preset could not be deleted.");
  }

  const fieldClass = `mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500 ${
    theme === "dark"
      ? "border-zinc-700 bg-zinc-950 text-zinc-100"
      : "border-zinc-300 bg-white text-zinc-900"
  }`;

  return (
    <section
      aria-busy={action.isPending}
      className={`rounded-2xl border p-5 shadow-lg sm:p-6 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-black/20"
          : "border-zinc-300 bg-white text-zinc-900 shadow-zinc-300/40"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-orange-400">
            Tone Lab
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Store repeatable amp and EQ settings locally for recording and practice.
          </p>
        </div>
        <button type="button" onClick={handleCreate} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> New Preset
        </button>
      </div>

      {action.errorMessage && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
          {action.errorMessage}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-2">
          {presets.length === 0 ? (
            <div className="rounded-xl border border-zinc-700/60 p-5 text-sm text-zinc-500">
              Create your first preset to start documenting tones.
            </div>
          ) : (
            presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedId === preset.id
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-zinc-700/60 hover:border-zinc-600"
                }`}
              >
                <span className="block truncate text-sm font-semibold">{preset.name}</span>
                <span className="mt-1 block truncate text-xs text-zinc-500">{preset.amp_model}</span>
              </button>
            ))
          )}
        </aside>

        <div className="rounded-xl border border-zinc-700/60 p-4 sm:p-5">
          {selectedId ? (
            <>
              {isDirty && (
                <p className="mb-4 text-xs font-medium text-orange-400">
                  Unsaved changes
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs uppercase tracking-wide text-zinc-500">
                  Preset Name
                  <input className={fieldClass} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
                </label>
                <label className="text-xs uppercase tracking-wide text-zinc-500">
                  Amp / Model
                  <input className={fieldClass} value={draft.amp_model} onChange={(event) => setDraft((current) => ({ ...current, amp_model: event.target.value }))} />
                </label>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-5">
                {controls.map((control) => (
                  <label key={control.key} className="text-xs uppercase tracking-wide text-zinc-500">
                    <span className="flex justify-between"><span>{control.label}</span><span className="text-orange-400">{draft[control.key]}</span></span>
                    <input type="range" min={0} max={10} step={1} value={draft[control.key]} onChange={(event) => setDraft((current) => ({ ...current, [control.key]: Number(event.target.value) }))} className="mt-3 w-full accent-orange-500" />
                  </label>
                ))}
              </div>

              <label className="mt-6 block text-xs uppercase tracking-wide text-zinc-500">
                Notes
                <textarea className={`${fieldClass} min-h-24 resize-y`} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Cab, IR, guitar, pickup, mic position, pedals…" />
              </label>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"><Save size={15} /> Save</button>
                <button type="button" onClick={handleDuplicate} className="flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm"><Copy size={15} /> Duplicate</button>
                <button type="button" onClick={handleDelete} className="ml-auto flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-400"><Trash2 size={15} /> Delete</button>
              </div>
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center text-zinc-500">
              <SlidersHorizontal size={32} />
              <p className="mt-3 text-sm">Select or create a tone preset.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
