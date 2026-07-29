import { useEffect, useRef, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  Edit3,
  Plus,
  Power,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import {
  createSignalChain,
  emptySignalBlocks,
  deleteSignalChain,
  getSignalChains,
  updateSignalChain,
  type SignalBlock,
  type SignalBlockType,
  type SignalChain,
} from "../../features/signalforge/signalChainService";
import { getFretForgeLinkState, type FretForgeLinkState } from "../../services/studioApplicationService";
import { listAmpSimulators, type AmpSimulator } from "../../services/signalApplicationService";
import GearDeviceVisual from "../../features/signalforge/GearDeviceVisual";
import { catalogLabel, findCatalogItem, gearCatalog } from "../../features/signalforge/gearCatalog";

type SignalForgeWorkspaceProps = { theme: string };

const blockOptions: { type: SignalBlockType; label: string }[] = [
  { type: "instrument", label: "Guitar / Pickups" },
  { type: "wireless", label: "Wireless System" },
  { type: "tuner", label: "Tuner Pedal" },
  { type: "noise_gate", label: "Noise Gate" },
  { type: "compressor", label: "Compressor" },
  { type: "overdrive", label: "Overdrive / Boost" },
  { type: "distortion", label: "Distortion" },
  { type: "delay", label: "Echo / Delay" },
  { type: "eq", label: "EQ Pedal" },
  { type: "pedal", label: "Other Pedal / Effect" },
  { type: "amp", label: "Physical Amp" },
  { type: "cab", label: "Physical Cabinet" },
  { type: "interface", label: "Audio Interface" },
  { type: "daw", label: "Recorder / Destination" },
];

function newBlock(type: SignalBlockType): SignalBlock {
  const option = blockOptions.find((item) => item.type === type)!;
  const catalogItem = gearCatalog.find((item) => item.type === type);
  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    type,
    label: catalogItem ? catalogLabel(catalogItem) : option.label,
    bypassed: false,
  };
}

type RoutingStep = {
  from: SignalBlock;
  fromPort: string;
  to: SignalBlock;
  toPort: string;
  reason?: string;
};

function buildRoutingSteps(blocks: SignalBlock[]): RoutingStep[] {
  const activeBlocks = blocks.filter((block) => !block.bypassed);
  const gateIndex = activeBlocks.findIndex((block) => {
    const profile = findCatalogItem(block.label, block.type)?.routingProfile;
    return profile === "detector_loop" || profile === "send_return_loop";
  });
  const gateProfile = gateIndex >= 0
    ? findCatalogItem(activeBlocks[gateIndex].label, activeBlocks[gateIndex].type)?.routingProfile
    : undefined;
  const gainTypes: SignalBlockType[] = ["overdrive", "distortion", "amp"];
  const isNoiseSource = (block: SignalBlock) => Boolean(findCatalogItem(block.label, block.type)?.createsNoise || gainTypes.includes(block.type));

  if (gateIndex < 0) {
    return activeBlocks.slice(0, -1).map((block, index) => ({
      from: block,
      fromPort: "OUTPUT",
      to: activeBlocks[index + 1],
      toPort: "INPUT",
    }));
  }

  const gate = activeBlocks[gateIndex];
  const noiseSources = activeBlocks.filter((block) => block.id !== gate.id && isNoiseSource(block));
  if (noiseSources.length === 0) {
    return activeBlocks.slice(0, -1).map((block, index) => ({ from: block, fromPort: "OUTPUT", to: activeBlocks[index + 1], toPort: "INPUT" }));
  }
  const cleanBeforeGate = activeBlocks.slice(0, gateIndex).filter((block) => !isNoiseSource(block));
  const cleanAfterCandidates = activeBlocks.slice(gateIndex + 1).filter((block) => !isNoiseSource(block));
  const cleanAfterGate = [
    ...cleanAfterCandidates.filter((block) => block.type !== "interface" && block.type !== "daw"),
    ...cleanAfterCandidates.filter((block) => block.type === "interface" || block.type === "daw"),
  ];
  const steps: RoutingStep[] = [];
  for (let index = 0; index < cleanBeforeGate.length - 1; index += 1) {
    steps.push({ from: cleanBeforeGate[index], fromPort: "OUTPUT", to: cleanBeforeGate[index + 1], toPort: "INPUT" });
  }
  if (cleanBeforeGate.length > 0) {
    steps.push({ from: cleanBeforeGate[cleanBeforeGate.length - 1], fromPort: "OUTPUT", to: gate, toPort: gateProfile === "send_return_loop" ? "INPUT" : "GUITAR IN" });
  }
  steps.push({ from: gate, fromPort: gateProfile === "send_return_loop" ? "SEND" : "GUITAR OUT", to: noiseSources[0], toPort: "INPUT" });
  for (let index = 0; index < noiseSources.length - 1; index += 1) {
    steps.push({ from: noiseSources[index], fromPort: "OUTPUT", to: noiseSources[index + 1], toPort: "INPUT" });
  }
  steps.push({ from: noiseSources[noiseSources.length - 1], fromPort: "OUTPUT", to: gate, toPort: gateProfile === "send_return_loop" ? "RETURN" : "DEC IN" });
  if (cleanAfterGate.length > 0) {
    steps.push({ from: gate, fromPort: gateProfile === "send_return_loop" ? "OUTPUT" : "DEC OUT", to: cleanAfterGate[0], toPort: "INPUT" });
    for (let index = 0; index < cleanAfterGate.length - 1; index += 1) {
      steps.push({ from: cleanAfterGate[index], fromPort: "OUTPUT", to: cleanAfterGate[index + 1], toPort: "INPUT" });
    }
  }
  return steps;
}

function GuitarEndpointVisual({ pickupCount, pickupLabels }: { pickupCount: 1 | 2 | 3; pickupLabels: string[] }) {
  const positions = pickupCount === 1 ? [63] : pickupCount === 2 ? [45, 67] : [40, 55, 70];
  return <div className="relative h-full w-full overflow-hidden rounded-[10px] bg-zinc-950">
    <img src="/assets/guitar-body-amber.png" alt="Amber electric guitar body" className="h-full w-full object-cover object-center" />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10" />
    {positions.map((top, index) => <div key={`${pickupLabels[index] ?? "pickup"}-${top}`} className="absolute left-1/2 w-[58%] -translate-x-1/2 rounded border border-zinc-100 bg-gradient-to-b from-zinc-200 via-zinc-500 to-zinc-200 px-1 py-1 shadow-lg" style={{ top: `${top}%` }}>
      <div className="flex justify-between">{[0, 1, 2, 3, 4, 5].map((pole) => <span key={pole} className="h-1 w-1 rounded-full bg-zinc-900" />)}</div>
      <span className="mt-0.5 block truncate text-center text-[6px] font-black text-zinc-950">{pickupLabels[index] ?? `PICKUP ${index + 1}`}</span>
    </div>)}
  </div>;
}

function PedalboardRoutingDiagram({ blocks, steps }: { blocks: SignalBlock[]; steps: RoutingStep[] }) {
  const cardWidth = 86;
  const cardHeight = 180;
  const instrumentWidth = 148;
  const spacing = 112;
  const gateIndex = blocks.findIndex((block) => {
    const profile = findCatalogItem(block.label, block.type)?.routingProfile;
    return profile === "detector_loop" || profile === "send_return_loop";
  });
  const gainTypes: SignalBlockType[] = ["overdrive", "distortion", "amp"];
  const noiseSourceIndices = blocks.reduce<number[]>((indices, block, index) => {
    const item = findCatalogItem(block.label, block.type);
    if (index !== gateIndex && (item?.createsNoise || gainTypes.includes(block.type))) indices.push(index);
    return indices;
  }, []);
  const noiseSourceSet = new Set(noiseSourceIndices);
  const hasDetectorLoop = gateIndex >= 0 && noiseSourceIndices.length > 0;
  const noiseBlocks = blocks.filter((_block, index) => noiseSourceSet.has(index));
  const topCandidates = blocks.filter((_block, index) => !noiseSourceSet.has(index));
  const instruments = topCandidates.filter((block) => block.type === "instrument");
  const destinations = topCandidates.filter((block) => block.type === "interface" || block.type === "daw");
  const cleanPedals = topCandidates.filter((block) => block.type !== "instrument" && block.type !== "interface" && block.type !== "daw");
  const instrumentBlock = instruments[0];
  const destinationBlock = destinations[0];
  const boardViewportRef = useRef<HTMLDivElement>(null);
  const [canvasColumns, setCanvasColumns] = useState(4);
  const [boardScale, setBoardScale] = useState(1);
  const pedalsPerRow = 3;
  const rowSpacing = 196;
  const cleanStartY = 6;
  const boardBottomInset = 6;
  const cleanRows = Math.max(1, Math.ceil(cleanPedals.length / pedalsPerRow));
  const noiseRows = Math.ceil(noiseBlocks.length / pedalsPerRow);
  const centerStartX = 24;
  const boardWidth = centerStartX + Math.max(0, canvasColumns - 1) * spacing + cardWidth + 24;
  const boardHeight = Math.max(246, cleanStartY + cleanRows * rowSpacing + noiseRows * rowSpacing + boardBottomInset - 16);
  const noiseStartY = boardHeight - boardBottomInset - cardHeight - Math.max(0, noiseRows - 1) * rowSpacing;
  const centeredLanePosition = (items: SignalBlock[], itemIndex: number, startY: number) => {
    const row = Math.floor(itemIndex / pedalsPerRow);
    const column = itemIndex % pedalsPerRow;
    const rowCount = Math.min(pedalsPerRow, items.length - row * pedalsPerRow);
    const rowWidth = Math.max(0, rowCount - 1) * spacing + cardWidth;
    return { x: (boardWidth - rowWidth) / 2 + column * spacing, y: startY + row * rowSpacing };
  };

  useEffect(() => {
    const viewport = boardViewportRef.current;
    if (!viewport) return;
    const updateLayout = (width: number) => {
      const nextColumns = width >= 1050 ? 8 : width >= 780 ? 6 : width >= 560 ? 5 : 4;
      setCanvasColumns(nextColumns);
      setBoardScale(Math.max(.8, Math.min(2, width / boardWidth)));
    };
    updateLayout(viewport.clientWidth);
    const observer = new ResizeObserver((entries) => updateLayout(entries[0]?.contentRect.width ?? viewport.clientWidth));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [boardWidth]);
  const positionFor = (index: number) => {
    const block = blocks[index];
    const instrumentIndex = instruments.findIndex((item) => item.id === block.id);
    if (instrumentIndex >= 0) return { x: -instrumentWidth, y: 20 + instrumentIndex * rowSpacing };
    const destinationIndex = destinations.findIndex((item) => item.id === block.id);
    if (destinationIndex >= 0) return { x: boardWidth, y: Math.max(30, (boardHeight - cardHeight) / 2 + destinationIndex * rowSpacing) };
    const noiseIndex = noiseBlocks.findIndex((item) => item.id === block.id);
    if (noiseIndex >= 0) {
      const row = Math.floor(noiseIndex / pedalsPerRow);
      const column = noiseIndex % pedalsPerRow;
      const rowCount = Math.min(pedalsPerRow, noiseBlocks.length - row * pedalsPerRow);
      const rowWidth = Math.max(0, rowCount - 1) * spacing + cardWidth;
      const rowsFromBottom = noiseRows - row - 1;
      return {
        x: (boardWidth - rowWidth) / 2 + column * spacing,
        y: boardHeight - boardBottomInset - cardHeight - rowsFromBottom * rowSpacing,
      };
    }
    const cleanIndex = cleanPedals.findIndex((item) => item.id === block.id);
    return centeredLanePosition(cleanPedals, cleanIndex, cleanStartY);
  };
  const portPoint = (blockIndex: number, port: string) => {
    const position = positionFor(blockIndex);
    if (blocks[blockIndex].type === "instrument") return { x: 0, y: boardHeight * .68 };
    if (blocks[blockIndex].type === "interface" || blocks[blockIndex].type === "daw") return { x: boardWidth, y: boardHeight / 2 };
    const item = findCatalogItem(blocks[blockIndex].label, blocks[blockIndex].type);
    const normalizedPort = port.toLowerCase().replace(/ /g, "_");
    const devicePort = item?.ports?.find((candidate) => candidate.id === normalizedPort || candidate.label === port);
    if (devicePort) return {
      x: devicePort.side === "left" ? position.x : position.x + cardWidth,
      y: position.y + cardHeight * devicePort.offset,
    };
    if (port === "INPUT" || port === "GUITAR IN" || port === "DEC IN" || port === "RETURN") return { x: position.x + cardWidth, y: position.y + cardHeight / 2 };
    return { x: position.x, y: position.y + cardHeight / 2 };
  };

  return (
    <div className="mt-5 min-w-0 overflow-hidden rounded-2xl border border-zinc-700 bg-[#181512] p-3 shadow-inner sm:p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">FretForge Wiring Plan</p>
        <p className="mt-1 text-xs text-zinc-500">FretForge places noisy gain pedals in the gate loop and time-based effects on the quiet output path.</p>
      </div>
      <div className="grid min-w-0 grid-cols-[148px_minmax(0,1fr)_96px] items-stretch gap-4 overflow-hidden rounded-xl border border-zinc-800 bg-[#181512] p-1">
        <div className="relative z-30 rounded-lg border border-orange-500/30 bg-zinc-950" style={{ height: boardHeight * boardScale }}>
          {instrumentBlock && <GuitarEndpointVisual pickupCount={findCatalogItem(instrumentBlock.label, instrumentBlock.type)?.pickupCount ?? 2} pickupLabels={findCatalogItem(instrumentBlock.label, instrumentBlock.type)?.pickupLabels ?? ["NECK", "BRIDGE"]}/>} 
          {instrumentBlock && <span className="absolute -right-4 h-0.5 w-4 -translate-y-1/2 bg-amber-400" style={{ top: "68%" }}/>} 
          {instrumentBlock && <span className="absolute -right-1.5 h-3 w-3 -translate-y-1/2 rounded-full border border-zinc-200 bg-zinc-950 shadow-[0_0_0_2px_#27272a]" style={{ top: "68%" }} aria-label="Guitar output jack"/>}
        </div>
      <div
        ref={boardViewportRef}
        className="relative min-w-0 overflow-x-auto overflow-y-hidden bg-zinc-950 bg-[length:100%_100%] bg-center bg-no-repeat"
        style={{ backgroundImage: "linear-gradient(rgb(0 0 0 / 24%), rgb(0 0 0 / 24%)), url('/assets/pedalboard-surface.png')" }}
      >
        <div className="relative z-10" style={{ width: boardWidth * boardScale, height: boardHeight * boardScale }}>
        <div className="relative origin-top-left" style={{ width: boardWidth, height: boardHeight, transform: `scale(${boardScale})` }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${boardWidth} ${boardHeight}`} aria-label="Pedalboard cable routing">
            {steps.map((step, index) => {
              const fromIndex = blocks.findIndex((block) => block.id === step.from.id);
              const toIndex = blocks.findIndex((block) => block.id === step.to.id);
              if (fromIndex < 0 || toIndex < 0) return null;
              const start = portPoint(fromIndex, step.fromPort);
              const end = portPoint(toIndex, step.toPort);
              const fromPortId = step.fromPort.toLowerCase().replace(/ /g, "_");
              const toPortId = step.toPort.toLowerCase().replace(/ /g, "_");
              const fromPortSide = step.from.type === "instrument"
                ? "right"
                : findCatalogItem(step.from.label, step.from.type)?.ports?.find((port) => port.id === fromPortId || port.label === step.fromPort)?.side ?? "left";
              const toPortSide = step.to.type === "interface" || step.to.type === "daw"
                ? "left"
                : findCatalogItem(step.to.label, step.to.type)?.ports?.find((port) => port.id === toPortId || port.label === step.toPort)?.side ?? "right";
              const isReturn = step.toPort === "DEC IN" || step.toPort === "RETURN";
              const changesLane = Math.abs(start.y - end.y) > 40;
              const returnY = boardHeight - 20 - (index % 2) * 10;
              const deltaX = end.x - start.x;
              const startStubX = start.x + (fromPortSide === "left" ? -14 : 14);
              const endStubX = end.x + (toPortSide === "left" ? -14 : 14);
              const mainRouteY = Math.max(8, Math.min(start.y, end.y) - 10 - (index % 2) * 5);
              const routesAroundTop = !changesLane && !isReturn && fromPortSide === "left" && toPortSide === "right" && end.x > start.x;
              const path = isReturn
                ? `M ${start.x} ${start.y} L ${startStubX} ${start.y} Q ${startStubX} ${returnY} ${startStubX + (endStubX - startStubX) * .18} ${returnY} L ${endStubX - (endStubX - startStubX) * .18} ${returnY} Q ${endStubX} ${returnY} ${endStubX} ${end.y} L ${end.x} ${end.y}`
                : routesAroundTop
                  ? `M ${start.x} ${start.y} L ${startStubX} ${start.y} Q ${startStubX} ${mainRouteY} ${startStubX + 12} ${mainRouteY} L ${endStubX - 12} ${mainRouteY} Q ${endStubX} ${mainRouteY} ${endStubX} ${end.y} L ${end.x} ${end.y}`
                : changesLane
                  ? `M ${start.x} ${start.y} L ${startStubX} ${start.y} C ${startStubX + deltaX * .3} ${start.y}, ${endStubX - deltaX * .3} ${end.y}, ${endStubX} ${end.y} L ${end.x} ${end.y}`
                  : `M ${start.x} ${start.y} C ${start.x + deltaX * .4} ${start.y}, ${end.x - deltaX * .4} ${end.y}, ${end.x} ${end.y}`;
              const cableColor = step.fromPort === "DEC OUT"
                ? "#4ade80"
                : step.toPort === "DEC IN"
                  ? "#fb923c"
                  : step.fromPort === "GUITAR OUT"
                    ? "#38bdf8"
                    : "#fbbf24";
              return <g key={`${step.from.id}-${step.fromPort}-${step.to.id}-${step.toPort}`}>
                <path d={path} fill="none" stroke="#09090b" strokeWidth="6" strokeLinecap="round" opacity=".75" />
                <path d={path} fill="none" stroke={cableColor} strokeWidth="2.5" strokeLinecap="round" />
              </g>;
            })}
          </svg>
          {hasDetectorLoop && <div className="absolute rounded-xl border border-dashed border-orange-500/30 bg-orange-500/5" style={{ left: (boardWidth - ((Math.min(pedalsPerRow, noiseBlocks.length) - 1) * spacing + cardWidth)) / 2 - 8, top: noiseStartY - 10, width: (Math.min(pedalsPerRow, noiseBlocks.length) - 1) * spacing + cardWidth + 16, height: Math.max(196, noiseRows * rowSpacing) }}><span className="absolute bottom-1.5 left-2 text-[7px] font-semibold uppercase tracking-[0.15em] text-orange-300">Noise-gate loop</span></div>}
          {blocks.map((block, index) => { const position = positionFor(index); const isEndpoint = block.type === "instrument" || block.type === "interface" || block.type === "daw"; if (isEndpoint) return null; return <div key={`board-${block.id}`} title={`${block.type.replace("_", " ")}: ${block.label}`} className={`absolute z-10 flex flex-col items-center justify-center rounded-xl bg-transparent p-0 text-center shadow-lg ${block.bypassed ? "opacity-45" : ""}`} style={{ left: position.x, top: position.y, width: cardWidth, height: cardHeight }}>
            <GearDeviceVisual label={block.label} type={block.type} compact showPorts pedalboard/>
          </div>; })}
        </div></div>
      </div>
        <div className="relative z-30 flex items-center justify-center rounded-lg border border-orange-500/30 bg-zinc-950" style={{ height: boardHeight * boardScale }}>
          {destinationBlock && <div className="relative flex h-[112px] w-[88px] flex-col items-center justify-start rounded-xl border border-orange-500/50 bg-zinc-950 px-2 pb-2 pt-3 text-center shadow-xl"><GearDeviceVisual label={destinationBlock.label} type={destinationBlock.type} compact/><span className="mt-auto line-clamp-2 w-full border-t border-zinc-800 pt-1 text-[8px] font-semibold leading-tight text-zinc-100">{findCatalogItem(destinationBlock.label, destinationBlock.type)?.model ?? destinationBlock.label}</span><span className="absolute -left-4 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-amber-400"/><span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-zinc-200 bg-zinc-950 shadow-[0_0_0_2px_#27272a]" aria-label="Interface input jack"/></div>}
        </div>
      </div>
    </div>
  );
}

export default function SignalForgeWorkspace({ theme }: SignalForgeWorkspaceProps) {
  const action = useAsyncAction();
  const [chains, setChains] = useState<SignalChain[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [blocks, setBlocks] = useState<SignalBlock[]>([]);
  const [blockType, setBlockType] = useState<SignalBlockType>("pedal");
  const [isBuildingNew, setIsBuildingNew] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [ampSimulators, setAmpSimulators] = useState<AmpSimulator[]>([]);
  const [scanningApps, setScanningApps] = useState(false);
  const [preferredAmpId, setPreferredAmpId] = useState(() => localStorage.getItem("fretforge.preferredAmpSimulator") ?? "amplitube");
  const [showRigGuide, setShowRigGuide] = useState(false);
  const [linkState, setLinkState] = useState<FretForgeLinkState | null>(null);
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

  async function scanAmpSimulators() {
    try { setScanningApps(true); setAmpSimulators(await listAmpSimulators()); }
    finally { setScanningApps(false); }
  }

  useEffect(() => { scanAmpSimulators(); }, []);
  useEffect(() => {
    const refresh = () => getFretForgeLinkState(localStorage.getItem("fretforge.selectedLinkSource") ?? undefined).then(setLinkState).catch(() => setLinkState(null));
    refresh(); const timer = window.setInterval(refresh, 750);
    return () => window.clearInterval(timer);
  }, []);

  async function handleCreate() {
    if ((isDirty || isBuildingNew) && !window.confirm("Discard unsaved changes and create a new chain?")) {
      return;
    }
    setSelectedId(null);
    setName(`Signal Chain ${chains.length + 1}`);
    setNotes("");
    setBlocks(emptySignalBlocks);
    setIsBuildingNew(true);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!name.trim()) return;
    await action.run(async () => {
      if (isBuildingNew) {
        const created = await createSignalChain(name.trim(), blocks, notes);
        await loadChains(created?.id);
      } else if (selectedId) {
        await updateSignalChain(selectedId, name.trim(), blocks, notes);
        await loadChains(selectedId);
      }
      setIsBuildingNew(false);
      setIsEditing(false);
    }, "This signal chain could not be saved.");
  }

  async function cancelNewChain() {
    setIsBuildingNew(false);
    setIsEditing(false);
    await action.run(loadChains, "Signal chains could not be loaded.");
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

  function selectCatalogGear(block: SignalBlock, catalogId: string) {
    const item = gearCatalog.find((candidate) => candidate.id === catalogId);
    if (item) updateBlock(block.id, { type: item.type, label: catalogLabel(item) });
  }

  function changeBlockType(block: SignalBlock, type: SignalBlockType) {
    const firstCatalogItem = gearCatalog.find((item) => item.type === type);
    const fallbackLabel = blockOptions.find((option) => option.type === type)?.label ?? "Device";
    updateBlock(block.id, {
      type,
      label: firstCatalogItem ? catalogLabel(firstCatalogItem) : fallbackLabel,
    });
  }

  function selectChain(chain: SignalChain) {
    if (
      chain.id !== selectedId &&
      (isDirty || isBuildingNew) &&
      !window.confirm("Discard unsaved changes to the current signal chain?")
    ) {
      return;
    }

    loadDraft(chain);
    setIsBuildingNew(false);
    setIsEditing(false);
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

  const preferredAmp = ampSimulators.find((simulator) => simulator.id === preferredAmpId);
  const clipping = (linkState?.input_peak ?? 0) >= 0.98;
  const lowSignal = linkState?.connected && (linkState.input_peak ?? 0) < 0.002;
  const hasCompletedSignalPath =
    blocks.length >= 2 &&
    blocks.every((block) => Boolean(findCatalogItem(block.label, block.type)));
  const routingSteps = buildRoutingSteps(blocks);

  return (
    <div className="space-y-5">
    {!isBuildingNew && <section className={`rounded-2xl border p-5 shadow-lg sm:p-6 ${theme === "dark" ? "border-zinc-800 bg-zinc-900/80 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-orange-400">Connected Guitar Rig</h2><p className="mt-2 text-sm text-zinc-500">Detect amp software, configure the REAPER route, and verify the live signal.</p></div><button onClick={scanAmpSimulators} disabled={scanningApps} className="flex items-center gap-2 rounded-lg border border-zinc-600 px-3 py-2 text-sm disabled:opacity-60"><RefreshCw size={15} className={scanningApps ? "animate-spin" : ""}/> {scanningApps ? "Scanning…" : "Scan Amp Sims"}</button></div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div><label className="text-xs uppercase tracking-wide text-zinc-500">Preferred Amp Simulator<select value={preferredAmpId} onChange={(event) => { setPreferredAmpId(event.target.value); localStorage.setItem("fretforge.preferredAmpSimulator", event.target.value); }} className={`${inputClass} mt-2 w-full`}>{ampSimulators.map((simulator) => <option key={simulator.id} value={simulator.id}>{simulator.name}{simulator.installed ? " (Installed)" : ""}</option>)}</select></label>
          {preferredAmp && <p className="mt-2 text-xs text-zinc-500">{preferredAmp.recommended_role}</p>}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{ampSimulators.map((simulator) => <div key={simulator.id} className={`rounded-xl border p-3 ${simulator.id === preferredAmpId ? "border-orange-500/60 bg-orange-500/5" : "border-zinc-700/60"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{simulator.name}</span><span className={`text-xs ${simulator.installed ? "text-emerald-400" : "text-zinc-500"}`}>{simulator.installed ? "Installed" : "Not found"}</span></div><p className="mt-1 text-xs text-zinc-500">{simulator.plugin_paths.length ? `${simulator.plugin_paths.length} plug-in${simulator.plugin_paths.length === 1 ? "" : "s"} detected` : simulator.standalone_path ? "Standalone app detected" : "Available from vendor"}</p>{!simulator.installed && <button onClick={() => openUrl(simulator.download_url)} className="mt-2 flex items-center gap-1 text-xs text-orange-400"><Download size={13}/> Official download</button>}</div>)}</div>
        </div>

        <div className="space-y-3"><div className={`rounded-xl border p-4 ${linkState?.connected ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}><div className="flex items-center gap-2">{linkState?.connected ? <CheckCircle2 size={18} className="text-emerald-400"/> : <Activity size={18} className="text-amber-400"/>}<span className="font-semibold">{linkState?.connected ? `${linkState.source_name} connected` : "Waiting for FretForge Link"}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800"><div className={`h-full transition-[width] ${clipping ? "bg-red-500" : "bg-orange-400"}`} style={{width: `${Math.min(100, (linkState?.input_peak ?? 0) * 100)}%`}}/></div><p className={`mt-2 text-xs ${clipping ? "text-red-400" : lowSignal ? "text-amber-400" : "text-zinc-500"}`}>{clipping ? "Clipping detected — lower the input gain." : lowSignal ? "Very low input — check the armed track and interface gain." : linkState?.connected ? "Signal route is active." : "Open the configured REAPER project and enable the Guitar Bus."}</p></div>
          <button onClick={() => setShowRigGuide((visible) => !visible)} className="w-full rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white">{showRigGuide ? "Hide Setup Guide" : "Set Up in REAPER"}</button>
        </div>
      </div>

      {showRigGuide && <div className="mt-5 rounded-xl border border-zinc-700 p-5"><h3 className="font-semibold text-orange-400">Recommended REAPER Route</h3><div className="mt-4 grid gap-2 text-sm"><p><span className="text-zinc-500">1.</span> Arm one guitar input track on AXE IO ONE Input 1 and enable Record Monitoring.</p><p><span className="text-zinc-500">2.</span> Add {preferredAmp?.name ?? "your amp simulator"} to the input track so you hear the processed guitar.</p><p><span className="text-zinc-500">3.</span> Route all guitar tracks to the GTR Bus.</p><p><span className="text-zinc-500">4.</span> Add FretForge Link once on the GTR Bus, before bus compression or limiting.</p><p><span className="text-zinc-500">5.</span> Return here and verify the source name, moving meter, and no clipping warning.</p></div><div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded bg-zinc-800 px-3 py-2">AXE Input</span><span>→</span><span className="rounded bg-zinc-800 px-3 py-2">Guitar Track</span><span>→</span><span className="rounded bg-zinc-800 px-3 py-2">{preferredAmp?.name ?? "Amp Sim"}</span><span>→</span><span className="rounded bg-zinc-800 px-3 py-2">GTR Bus</span><span>→</span><span className="rounded bg-zinc-800 px-3 py-2">FretForge Link</span></div>{clipping && <p className="mt-4 flex items-center gap-2 text-sm text-red-400"><AlertTriangle size={16}/> Resolve clipping before recording or analysis.</p>}</div>}
    </section>}
    <section className={`rounded-2xl border p-5 shadow-lg sm:p-6 ${theme === "dark" ? "border-zinc-800 bg-zinc-900/80 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-orange-400">{isBuildingNew ? "Build a New Physical Chain" : "Physical Guitar Chain"}</h2>
          <p className="mt-2 text-sm text-zinc-500">{isBuildingNew ? "Choose each device in the order your guitar signal travels. Save when the chain is complete." : "Document how the guitar, wireless system, pedals, amplifiers, and interface are physically connected."}</p>
        </div>
        {!isBuildingNew && <div className="flex w-full flex-wrap items-end gap-2 lg:w-auto">
          <label className="grid min-w-52 flex-1 gap-1 text-xs uppercase tracking-wide text-zinc-500 lg:flex-none">Signal Chain<select value={selectedId ?? ""} onChange={(event) => { const chain = chains.find((item) => item.id === Number(event.target.value)); if (chain) selectChain(chain); }} className={inputClass}>{chains.length === 0 && <option value="">No saved chains</option>}{chains.map((chain) => <option key={chain.id} value={chain.id}>{chain.name} · {chain.blocks.length} devices</option>)}</select></label>
          {selectedId && !isEditing && <button type="button" onClick={() => setIsEditing(true)} className="flex items-center justify-center gap-2 rounded-lg border border-orange-500 px-3 py-2 text-sm text-orange-400"><Edit3 size={15} /> Edit Chain</button>}
          <button type="button" onClick={handleCreate} className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} /> New Physical Chain</button>
        </div>}
      </div>

      {action.errorMessage && <p className="mt-4 text-sm text-red-400" role="alert">{action.errorMessage}</p>}

      <div className="mt-6 grid grid-cols-1 gap-5">
        <div className="min-w-0 rounded-xl border border-zinc-700/60 p-4 sm:p-5">
          {(selectedId || isBuildingNew) ? <>
            {isDirty && <p className="mb-4 text-xs font-medium text-orange-400">Unsaved changes</p>}
            {(isBuildingNew || isEditing) && <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
              <input value={name} onChange={(event) => setName(event.target.value)} readOnly={!isBuildingNew && !isEditing} className={inputClass} aria-label="Signal chain name" />
              {isBuildingNew && <button type="button" onClick={cancelNewChain} className="rounded-lg border border-zinc-600 px-3 py-2 text-sm">Cancel</button>}
              {(isBuildingNew || isEditing) && <button type="button" onClick={handleSave} className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white"><Save size={15} /> Save</button>}
            </div>}

            {!isBuildingNew && !isEditing && hasCompletedSignalPath && <PedalboardRoutingDiagram blocks={blocks} steps={routingSteps} />}

            {(isBuildingNew || isEditing) && <>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <label className="grid gap-1 text-xs uppercase tracking-wide text-zinc-500">Device Type<select value={blockType} onChange={(event) => setBlockType(event.target.value as SignalBlockType)} className={inputClass}>{blockOptions.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}</select></label>
              <button type="button" onClick={() => setBlocks((current) => [...current, newBlock(blockType)])} className="rounded-lg border border-orange-500 px-3 py-2 text-sm text-orange-400">Add Hardware Block</button>
            </div>

            <div className="mt-5 space-y-2">
              {blocks.map((block, index) => (<div key={block.id}>
                <div className={`grid items-end gap-3 rounded-xl border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] ${block.bypassed ? "border-zinc-800 opacity-50" : "border-zinc-700/60"}`}>
                  <label className="grid min-w-0 gap-1 text-xs uppercase tracking-wide text-zinc-500">Device Type<select value={block.type} onChange={(event) => changeBlockType(block, event.target.value as SignalBlockType)} className={inputClass}>{blockOptions.map((option) => <option key={option.type} value={option.type}>{option.label}</option>)}</select></label>
                  <label className="grid min-w-0 gap-1 text-xs uppercase tracking-wide text-zinc-500">Device Model<select value={findCatalogItem(block.label, block.type)?.id ?? ""} onChange={(event) => selectCatalogGear(block, event.target.value)} className={inputClass} aria-label={`${block.type} device model`}><option value="" disabled>Select a device</option>{gearCatalog.filter((item) => item.type === block.type).map((item) => <option key={item.id} value={item.id}>{catalogLabel(item)}</option>)}</select></label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="rounded p-2 disabled:opacity-25" aria-label="Move block up"><ArrowUp size={15} /></button>
                    <button type="button" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="rounded p-2 disabled:opacity-25" aria-label="Move block down"><ArrowDown size={15} /></button>
                    <button type="button" onClick={() => updateBlock(block.id, { bypassed: !block.bypassed })} className={`rounded p-2 ${block.bypassed ? "text-zinc-500" : "text-emerald-400"}`} aria-label="Toggle bypass"><Power size={15} /></button>
                    <button type="button" onClick={() => setBlocks((current) => current.filter((item) => item.id !== block.id))} className="rounded p-2 text-red-400" aria-label="Remove block"><Trash2 size={15} /></button>
                  </div>
                </div>
                {index < blocks.length - 1 && <div className="flex h-6 items-center justify-center text-orange-400"><ArrowDown size={16}/></div>}
              </div>))}
            </div>

            </>}

            {isEditing && <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${inputClass} mt-5 min-h-20 w-full resize-y`} placeholder="Routing notes, cable details, levels, or troubleshooting…" aria-label="Signal chain notes" />}
            {!isBuildingNew && <button type="button" onClick={handleDelete} className="mt-4 flex items-center gap-2 text-sm text-red-400"><Trash2 size={15} /> Delete Chain</button>}
          </> : <div className="flex min-h-64 items-center justify-center text-sm text-zinc-500">Select or create a signal chain.</div>}
        </div>
      </div>
    </section></div>
  );
}
