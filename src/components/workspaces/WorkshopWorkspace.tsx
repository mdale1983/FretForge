import { useEffect, useState } from "react";
import { Copy, Plus, Save, Trash2, Wrench } from "lucide-react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import {
  createInstrumentSetup,
  defaultInstrumentSetup,
  deleteInstrumentSetup,
  getInstrumentSetups,
  updateInstrumentSetup,
  type InstrumentSetup,
  type InstrumentSetupDraft,
} from "../../features/workshop/instrumentSetupService";

type WorkshopWorkspaceProps = { theme: string };

function toDraft(setup: InstrumentSetup): InstrumentSetupDraft {
  const { id: _id, created_at: _created, updated_at: _updated, ...draft } = setup;
  return draft;
}

export default function WorkshopWorkspace({ theme }: WorkshopWorkspaceProps) {
  const action = useAsyncAction();
  const [setups, setSetups] = useState<InstrumentSetup[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<InstrumentSetupDraft>(defaultInstrumentSetup);
  const selectedSetup = setups.find((setup) => setup.id === selectedId);
  const isDirty = selectedSetup
    ? JSON.stringify(toDraft(selectedSetup)) !== JSON.stringify(draft)
    : false;

  async function loadSetups(preferredId?: number) {
    const loaded = await getInstrumentSetups();
    setSetups(loaded);
    const selected =
      loaded.find((setup) => setup.id === preferredId) ??
      loaded.find((setup) => setup.id === selectedId) ??
      loaded[0];
    setSelectedId(selected?.id ?? null);
    setDraft(selected ? toDraft(selected) : defaultInstrumentSetup);
  }

  useEffect(() => {
    action.run(loadSetups, "Instrument setup records could not be loaded.");
  }, [action.run]);

  function selectSetup(setup: InstrumentSetup) {
    if (
      setup.id !== selectedId &&
      isDirty &&
      !window.confirm("Discard unsaved setup changes?")
    ) return;
    setSelectedId(setup.id);
    setDraft(toDraft(setup));
  }

  async function handleCreate() {
    if (isDirty && !window.confirm("Discard unsaved changes and create a new setup?")) return;
    await action.run(async () => {
      const created = await createInstrumentSetup({
        ...defaultInstrumentSetup,
        instrument_name: `Instrument ${setups.length + 1}`,
        service_date: new Date().toISOString().slice(0, 10),
      });
      await loadSetups(created?.id);
    }, "A new setup record could not be created.");
  }

  async function handleSave() {
    if (!selectedId || !draft.instrument_name.trim()) {
      window.alert("Instrument name cannot be empty.");
      return;
    }
    await action.run(async () => {
      await updateInstrumentSetup(selectedId, {
        ...draft,
        instrument_name: draft.instrument_name.trim(),
      });
      await loadSetups(selectedId);
    }, "This setup record could not be saved.");
  }

  async function handleDuplicate() {
    await action.run(async () => {
      const created = await createInstrumentSetup({
        ...draft,
        instrument_name: `${draft.instrument_name || "Instrument"} Copy`,
        service_date: new Date().toISOString().slice(0, 10),
      });
      await loadSetups(created?.id);
    }, "This setup record could not be duplicated.");
  }

  async function handleDelete() {
    if (!selectedId || !window.confirm(`Delete setup for "${draft.instrument_name}"?`)) return;
    await action.run(async () => {
      await deleteInstrumentSetup(selectedId);
      setSelectedId(null);
      await loadSetups();
    }, "This setup record could not be deleted.");
  }

  function updateField<Key extends keyof InstrumentSetupDraft>(
    key: Key,
    value: InstrumentSetupDraft[Key]
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const fieldClass = `mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500 ${
    theme === "dark"
      ? "border-zinc-700 bg-zinc-950 text-zinc-100"
      : "border-zinc-300 bg-white text-zinc-900"
  }`;

  const measurementFields: { key: keyof InstrumentSetupDraft; label: string; placeholder: string }[] = [
    { key: "action_low", label: "Low-string Action", placeholder: "e.g. 1.8 mm" },
    { key: "action_high", label: "High-string Action", placeholder: "e.g. 1.5 mm" },
    { key: "neck_relief", label: "Neck Relief", placeholder: "e.g. 0.20 mm" },
    { key: "pickup_height", label: "Pickup Height", placeholder: "e.g. 2.0 / 1.5 mm" },
  ];

  return (
    <section aria-busy={action.isPending} className={`rounded-2xl border p-5 shadow-lg sm:p-6 ${theme === "dark" ? "border-zinc-800 bg-zinc-900/80 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-xl font-semibold text-orange-400">The Workshop</h2><p className="mt-2 text-sm text-zinc-500">Keep repeatable setup measurements and maintenance notes for every instrument.</p></div>
        <button type="button" onClick={handleCreate} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /> New Setup</button>
      </div>
      {action.errorMessage && <p className="mt-4 text-sm text-red-400" role="alert">{action.errorMessage}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-2">
          {setups.length === 0 ? <p className="rounded-lg border border-zinc-700/60 p-4 text-sm text-zinc-500">Create your first instrument setup record.</p> : setups.map((setup) => (
            <button key={setup.id} type="button" onClick={() => selectSetup(setup)} className={`w-full rounded-lg border p-3 text-left ${selectedId === setup.id ? "border-orange-500 bg-orange-500/10" : "border-zinc-700/60"}`}>
              <span className="block truncate text-sm font-semibold">{setup.instrument_name}</span><span className="mt-1 block text-xs text-zinc-500">{setup.tuning} · {setup.string_gauge}</span>
            </button>
          ))}
        </aside>

        <div className="rounded-xl border border-zinc-700/60 p-4 sm:p-5">
          {selectedId ? <>
            {isDirty && <p className="mb-4 text-xs font-medium text-orange-400">Unsaved changes</p>}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs uppercase tracking-wide text-zinc-500">Instrument<input className={fieldClass} value={draft.instrument_name} onChange={(event) => updateField("instrument_name", event.target.value)} /></label>
              <label className="text-xs uppercase tracking-wide text-zinc-500">Tuning<input className={fieldClass} value={draft.tuning} onChange={(event) => updateField("tuning", event.target.value)} /></label>
              <label className="text-xs uppercase tracking-wide text-zinc-500">String Gauge<input className={fieldClass} value={draft.string_gauge} onChange={(event) => updateField("string_gauge", event.target.value)} /></label>
              {measurementFields.map((field) => <label key={field.key} className="text-xs uppercase tracking-wide text-zinc-500">{field.label}<input className={fieldClass} value={draft[field.key]} placeholder={field.placeholder} onChange={(event) => updateField(field.key, event.target.value)} /></label>)}
              <label className="text-xs uppercase tracking-wide text-zinc-500">Intonation<select className={fieldClass} value={draft.intonation_status} onChange={(event) => updateField("intonation_status", event.target.value)}><option>Not checked</option><option>In tune</option><option>Needs adjustment</option></select></label>
              <label className="text-xs uppercase tracking-wide text-zinc-500">Service Date<input type="date" className={fieldClass} value={draft.service_date} onChange={(event) => updateField("service_date", event.target.value)} /></label>
            </div>
            <label className="mt-5 block text-xs uppercase tracking-wide text-zinc-500">Notes<textarea className={`${fieldClass} min-h-24 resize-y`} value={draft.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Fret condition, tremolo balance, hardware, issues, or next steps…" /></label>
            <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={handleSave} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"><Save size={15} /> Save</button><button type="button" onClick={handleDuplicate} className="flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm"><Copy size={15} /> Duplicate</button><button type="button" onClick={handleDelete} className="ml-auto flex items-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-400"><Trash2 size={15} /> Delete</button></div>
          </> : <div className="flex min-h-64 flex-col items-center justify-center text-zinc-500"><Wrench size={32} /><p className="mt-3 text-sm">Select or create an instrument setup.</p></div>}
        </div>
      </div>
    </section>
  );
}
