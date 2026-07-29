import { openUrl } from "@tauri-apps/plugin-opener";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, ExternalLink, Play, RefreshCw, Square, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  closeStudioApplication,
  getFretForgeLinkState,
  launchStudioApplication,
  listFretForgeLinkSources,
  listStudioApplications,
  type StudioApplication,
  type FretForgeLinkState,
} from "../../services/studioApplicationService";

type Props = { theme: string };

const reaperSetupSteps = [
  { title: "Configure the AXE IO ONE", instruction: "In REAPER, open Options → Preferences → Audio → Device. Select ASIO, choose AXE IO ONE as the ASIO driver, set the sample rate to 48000 Hz, then click Apply.", result: "REAPER's upper-right status should show 48 kHz and ASIO." },
  { title: "Scan all VST plug-ins", instruction: "Open Options → Preferences → Plug-ins → VST. Keep every existing custom path and add any missing standard locations: %PROGRAMFILES(X86)%\\Steinberg\\VstPlugins; %PROGRAMFILES%\\Steinberg\\VstPlugins; %COMMONPROGRAMFILES%\\VST3; %LOCALAPPDATA%\\Programs\\Common\\VST3. Separate paths with semicolons, then click Re-scan. Do not replace paths for AmpliTube, TONEX, Neural DSP, or other plug-ins you already use.", result: "The FX browser should find FretForge Link and your installed amp simulators and effects—not only FretForge." },
  { title: "Prepare the guitar track and bus", instruction: "Arm your live guitar track, set Input: Mono → Input 1, and enable Record Monitoring. Route that track to your Guitar Bus. Additional guitar tracks can use the same bus, but do not arm two tracks using the same hardware input unless you intentionally want a duplicate signal.", result: "The live guitar track and Guitar Bus meters should both move when you pluck a string; REAPER does not need to be recording." },
  { title: "Add FretForge Link to the Guitar Bus", instruction: "Open the Guitar Bus FX window and add VST3: FretForge Link once. Leave Bypass off; no plug-in controls need adjustment. Place it before bus effects when you want a cleaner signal, or after them when you want FretForge to observe the final guitar mix.", result: "One FretForge Link instance monitors every guitar track routed through the Guitar Bus without competing plug-in instances." },
  { title: "Verify the connection", instruction: "Return to FretForge and pluck a string. Keep REAPER open, the input track armed, Record Monitoring enabled, routed to the Guitar Bus, and the bus FretForge Link active.", result: "FretForge Link should show Connected at 48 kHz and the orange meter should move." },
];

export default function StudioPathWorkspace({ theme }: Props) {
  const [apps, setApps] = useState<StudioApplication[]>([]);
  const [preferredId, setPreferredId] = useState(() => localStorage.getItem("fretforge.preferredDaw") ?? "reaper");
  const [setupAppId, setSetupAppId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [link, setLink] = useState<FretForgeLinkState | null>(null);
  const [linkSources, setLinkSources] = useState<FretForgeLinkState[]>([]);
  const [selectedLinkId, setSelectedLinkId] = useState(() => localStorage.getItem("fretforge.selectedLinkSource") ?? "");
  const [sourceNames, setSourceNames] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem("fretforge.linkSourceNames") ?? "{}"));
  const [scanning, setScanning] = useState(false);

  const loadApps = useCallback(async () => {
    try { setError(""); setApps(await listStudioApplications()); }
    catch (reason) { setError(String(reason)); }
  }, []);

  async function rescanApps() {
    try {
      setScanning(true); setError(""); setMessage("");
      const detectedApps = await listStudioApplications();
      setApps(detectedApps);
      if (!detectedApps.some((app) => app.installed)) {
        setMessage("No supported DAWs were found in the standard installation locations.");
      }
    } catch (reason) { setError(String(reason)); }
    finally { setScanning(false); }
  }

  useEffect(() => { loadApps(); }, [loadApps]);
  useEffect(() => {
    const timer = window.setInterval(loadApps, 3_000);
    return () => window.clearInterval(timer);
  }, [loadApps]);
  useEffect(() => {
    const refresh = async () => {
      try {
        const sources = await listFretForgeLinkSources();
        setLinkSources(sources);
        const selected = sources.find((source) => source.instance_id === selectedLinkId) ?? sources[0];
        if (selected && selected.instance_id !== selectedLinkId) {
          setSelectedLinkId(selected.instance_id);
          localStorage.setItem("fretforge.selectedLinkSource", selected.instance_id);
        }
        setLink(selected ?? await getFretForgeLinkState());
      } catch { setLink(null); setLinkSources([]); }
    };
    refresh();
    const timer = window.setInterval(refresh, 750);
    return () => window.clearInterval(timer);
  }, [selectedLinkId]);

  function selectLinkSource(id: string) {
    setSelectedLinkId(id); localStorage.setItem("fretforge.selectedLinkSource", id);
  }

  function renameLinkSource(id: string, name: string) {
    const next = { ...sourceNames, [id]: name };
    setSourceNames(next); localStorage.setItem("fretforge.linkSourceNames", JSON.stringify(next));
  }

  function linkSourceLabel(source: FretForgeLinkState) {
    if (sourceNames[source.instance_id]) return sourceNames[source.instance_id];
    const matchingSources = linkSources.filter((candidate) => candidate.source_name === source.source_name);
    if (matchingSources.length <= 1) return source.source_name;
    return `${source.source_name} ${matchingSources.findIndex((candidate) => candidate.instance_id === source.instance_id) + 1}`;
  }

  const preferred = useMemo(() => apps.find((app) => app.id === preferredId), [apps, preferredId]);
  const setupApp = apps.find((app) => app.id === setupAppId);
  const panel = theme === "dark" ? "border-zinc-800 bg-zinc-900/80" : "border-zinc-300 bg-white";
  const muted = theme === "dark" ? "text-zinc-400" : "text-zinc-600";

  function selectPreferred(id: string) {
    setPreferredId(id); localStorage.setItem("fretforge.preferredDaw", id);
    setMessage(`${apps.find((app) => app.id === id)?.name ?? "DAW"} is now preferred.`);
  }

  function openSetup(app: StudioApplication) {
    setSetupAppId(app.id);
    const saved = localStorage.getItem(`fretforge.dawSetup.${app.id}`);
    setCompletedSteps(saved ? JSON.parse(saved) : []);
    setActiveStep(0);
  }

  function toggleStep(index: number) {
    if (!setupAppId) return;
    const next = completedSteps.includes(index)
      ? completedSteps.filter((step) => step !== index)
      : [...completedSteps, index];
    setCompletedSteps(next);
    localStorage.setItem(`fretforge.dawSetup.${setupAppId}`, JSON.stringify(next));
  }

  function setupIsComplete(app: StudioApplication) {
    if (app.id !== "reaper") return false;
    const steps = app.id === setupAppId
      ? completedSteps
      : JSON.parse(localStorage.getItem(`fretforge.dawSetup.${app.id}`) ?? "[]");
    return reaperSetupSteps.every((_, index) => steps.includes(index));
  }

  async function launch(app: StudioApplication) {
    try {
      setBusyId(app.id); setError(""); setMessage("Releasing FretForge audio and launching the DAW…");
      await launchStudioApplication(app.id);
      setMessage(`${app.name} launched. FretForge Link is not installed yet; DAW connection is the next setup step.`);
      window.setTimeout(loadApps, 1_200);
    } catch (reason) { setError(String(reason)); }
    finally { setBusyId(""); }
  }

  async function close(app: StudioApplication) {
    if (!window.confirm(`Ask ${app.name} to close? It may prompt you to save unsaved work.`)) return;
    try {
      setBusyId(app.id); setError("");
      const requested = await closeStudioApplication(app.id);
      setMessage(requested ? `${app.name} received the close request.` : `${app.name} did not expose a closable window.`);
      window.setTimeout(loadApps, 1_200);
    } catch (reason) { setError(String(reason)); }
    finally { setBusyId(""); }
  }

  return <div className="space-y-5">
    <section className={`rounded-2xl border p-5 ${panel}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-xl font-semibold text-orange-400">Studio Applications</h2>
          <p className={`mt-1 text-sm ${muted}`}>Choose your preferred DAW, launch recording sessions, and configure FretForge Link.</p></div>
        <button disabled={scanning} onClick={rescanApps} className="flex items-center gap-2 rounded-lg border border-zinc-600 px-3 py-2 text-sm disabled:opacity-60"><RefreshCw size={15} className={scanning ? "animate-spin" : ""}/> {scanning ? "Scanning…" : "Rescan DAWs"}</button>
      </div>
      <label className="mt-4 block max-w-md text-xs uppercase tracking-wide text-zinc-500">Preferred DAW
        <select value={preferredId} onChange={(event) => selectPreferred(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm normal-case tracking-normal text-zinc-100">
          {apps.map((app) => <option key={app.id} value={app.id}>{app.name}{app.installed ? " (Installed)" : ""}{app.recommended ? " — Recommended" : ""}</option>)}
        </select>
      </label>
      {preferred && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className={setupIsComplete(preferred) ? "text-emerald-400" : "text-amber-400"}>{!preferred.installed ? "DAW not installed" : setupIsComplete(preferred) ? "Setup guide complete" : "Setup guide not completed"}</span>
        {preferred.id === "reaper" && <span className={link?.connected ? "text-emerald-400" : "text-zinc-500"}>{link?.connected ? "Live connection verified" : "Live connection not detected"}</span>}
      </div>}
      <div className="mt-4 rounded-xl border border-zinc-700 p-4">
        <div className="flex items-center justify-between gap-3">
          <div><p className="font-semibold">FretForge Link</p><p className={`text-xs ${muted}`}>{link?.connected ? `Receiving audio from the DAW at ${Math.round(link.sample_rate / 1000)} kHz` : link?.installed ? "Installed — add FretForge Link to an armed guitar track" : "Not installed"}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs ${link?.connected ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>{link?.connected ? "Connected" : link?.installed ? "Waiting for track" : "Install required"}</span>
        </div>
        {linkSources.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-zinc-500">ANALYSIS SOURCE<select value={link?.instance_id ?? ""} onChange={(event) => selectLinkSource(event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100">{linkSources.map((source) => <option key={source.instance_id} value={source.instance_id}>{linkSourceLabel(source)}</option>)}</select></label>
          {link && <label className="text-xs text-zinc-500">CUSTOM NAME (OPTIONAL)<input value={sourceNames[link.instance_id] ?? ""} placeholder={`Detected: ${link.source_name}`} onChange={(event) => renameLinkSource(link.instance_id, event.target.value)} className="mt-1 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"/></label>}
        </div>}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-orange-400 transition-[width] duration-100" style={{ width: `${Math.min(100, Math.max(0, (link?.input_peak ?? 0) * 100))}%` }}/></div>
      </div>
    </section>

    {(message || error) && <p className={`rounded-lg border p-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"}`}>{error || message}</p>}

    <div className="grid gap-4 lg:grid-cols-3">
      {apps.map((app) => <section key={app.id} className={`rounded-2xl border p-5 ${panel} ${app.id === preferredId ? "ring-1 ring-orange-500/60" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div><div className="flex items-center gap-2"><h3 className="text-lg font-semibold">{app.name}</h3>{app.recommended && <span title="Recommended"><Star size={16} className="fill-orange-400 text-orange-400"/></span>}</div>
            <p className={`mt-1 text-xs ${muted}`}>{app.integration}</p></div>
          <span className={`rounded-full px-2 py-1 text-xs ${app.running ? "bg-emerald-500/15 text-emerald-400" : app.installed ? "bg-sky-500/15 text-sky-400" : "bg-zinc-700/50 text-zinc-400"}`}>{app.running ? "Running" : app.installed ? "Installed" : app.free ? "Free" : "Evaluation"}</span>
        </div>
        {app.path && <p className="mt-3 truncate text-xs text-zinc-500" title={app.path}>{app.path}</p>}
        {app.installed && <p className={`mt-3 flex items-center gap-2 text-xs ${setupIsComplete(app) ? "text-emerald-400" : "text-amber-400"}`}>{setupIsComplete(app) ? <CheckCircle2 size={15}/> : <RefreshCw size={15}/>} {setupIsComplete(app) ? "FretForge Setup Complete" : "FretForge Setup Needed"}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          {app.installed ? <>
            <button disabled={busyId === app.id || app.running} onClick={() => launch(app)} className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><Play size={14}/> Launch</button>
            {app.running && <button disabled={busyId === app.id} onClick={() => close(app)} className="flex items-center gap-2 rounded-lg border border-zinc-600 px-3 py-2 text-sm"><Square size={13}/> Close</button>}
          </> : <button onClick={() => openUrl(app.download_url)} className="flex items-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white"><Download size={14}/> Official Download</button>}
          <button onClick={() => openSetup(app)} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm">{setupIsComplete(app) ? "Review Setup" : "Set Up"}</button>
          {preferredId !== app.id && <button onClick={() => selectPreferred(app.id)} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm">Make Default</button>}
        </div>
      </section>)}
    </div>

    {setupApp && <section className={`rounded-2xl border p-5 ${panel}`}>
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-orange-400">Set Up {setupApp.name}</h2><p className={`mt-1 text-sm ${muted}`}>Follow each instruction in order. FretForge saves your progress.</p></div><button onClick={() => setSetupAppId(null)} className="text-sm text-zinc-400">Close</button></div>
      {setupApp.id === "reaper" ? <>
        <div className="mt-5 flex gap-2">{reaperSetupSteps.map((step, index) => <button key={step.title} onClick={() => setActiveStep(index)} aria-label={`Open step ${index + 1}`} className={`h-2 flex-1 rounded-full ${completedSteps.includes(index) ? "bg-emerald-400" : index === activeStep ? "bg-orange-400" : "bg-zinc-700"}`}/>)}</div>
        <div className="mt-5 rounded-xl border border-zinc-700 p-5">
          <p className="text-xs uppercase tracking-widest text-orange-400">Step {activeStep + 1} of {reaperSetupSteps.length}</p>
          <h3 className="mt-2 text-lg font-semibold">{reaperSetupSteps[activeStep].title}</h3>
          <p className={`mt-3 leading-6 ${muted}`}>{reaperSetupSteps[activeStep].instruction}</p>
          <div className="mt-4 rounded-lg border border-sky-500/25 bg-sky-500/10 p-3 text-sm text-sky-300"><span className="font-semibold">What you should see: </span>{reaperSetupSteps[activeStep].result}</div>
          {activeStep === reaperSetupSteps.length - 1 && <div className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${link?.connected ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-300"}`}>{link?.connected ? <CheckCircle2 size={18}/> : <RefreshCw size={18}/>} {link?.connected ? "Connection verified — FretForge is receiving the REAPER track." : "Waiting for FretForge Link to connect…"}</div>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button disabled={activeStep === 0} onClick={() => setActiveStep((step) => step - 1)} className="flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm disabled:opacity-35"><ChevronLeft size={16}/> Back</button>
          <div className="flex gap-2"><button onClick={() => setupApp.installed ? launch(setupApp) : openUrl(setupApp.download_url)} className="flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm">{setupApp.installed ? <Play size={14}/> : <ExternalLink size={14}/>} {setupApp.installed ? "Open REAPER" : "Download"}</button><button onClick={() => { if (!completedSteps.includes(activeStep)) toggleStep(activeStep); if (activeStep < reaperSetupSteps.length - 1) setActiveStep((step) => step + 1); else setSetupAppId(null); }} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">{activeStep === reaperSetupSteps.length - 1 ? "Finish" : "Done — Continue"}<ChevronRight size={16}/></button></div>
        </div>
      </> : <div className="mt-5 rounded-xl border border-zinc-700 p-5"><p className={muted}>Guided integration for {setupApp.name} is being prepared. You can launch it now and use FretForge Link as the first effect on your armed guitar track.</p></div>}
    </section>}
  </div>;
}
