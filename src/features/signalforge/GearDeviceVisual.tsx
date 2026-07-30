import type { SignalBlockType } from "./signalChainService";
import { findCatalogItem } from "./gearCatalog";

type Props = { label: string; type: SignalBlockType; compact?: boolean; showPorts?: boolean; pedalboard?: boolean };

type PedalVisualProfile = {
  knobs: number;
  footswitches: 1 | 2;
  screen?: boolean;
  sliders?: number;
  accent?: string;
};

function pedalVisualProfile(id: string | undefined, type: SignalBlockType): PedalVisualProfile {
  if (id === "empress-paraeq-mkii-deluxe") return { knobs: 8, footswitches: 2, accent: "#d97706" };
  if (id === "boss-ge-7") return { knobs: 0, footswitches: 1, sliders: 7, accent: "#ef4444" };
  if (id === "mxr-ten-band-eq") return { knobs: 0, footswitches: 1, sliders: 10, accent: "#ef4444" };
  if (id === "source-audio-eq2") return { knobs: 1, footswitches: 2, screen: true, accent: "#38bdf8" };
  if (id === "strymon-timeline") return { knobs: 7, footswitches: 2, screen: true, accent: "#22d3ee" };
  if (id?.includes("decimator")) return { knobs: 1, footswitches: 1, accent: "#ef4444" };
  if (id === "boss-ns-2") return { knobs: 3, footswitches: 1, accent: "#f97316" };
  if (type === "wireless" || type === "tuner") return { knobs: 0, footswitches: 1, screen: true, accent: "#22c55e" };
  if (type === "delay") return { knobs: 4, footswitches: id?.includes("strymon") ? 2 : 1, screen: id === "boss-dd-8", accent: "#38bdf8" };
  if (type === "compressor") return { knobs: id === "xotic-sp-compressor" ? 2 : 4, footswitches: 1, accent: "#facc15" };
  if (type === "overdrive" || type === "distortion") return { knobs: 3, footswitches: 1, accent: type === "overdrive" ? "#facc15" : "#ef4444" };
  if (type === "eq") return { knobs: 5, footswitches: 1, accent: "#f97316" };
  return { knobs: 2, footswitches: 1, accent: "#f59e0b" };
}

function knobPositions(count: number) {
  if (count <= 0) return [];
  const firstRowCount = Math.min(4, count);
  const secondRowCount = count - firstRowCount;
  const row = (amount: number, y: number) => Array.from({ length: amount }, (_, index) => ({
    x: amount === 1 ? 48 : 19 + index * (58 / (amount - 1)),
    y,
  }));
  return [...row(firstRowCount, 31), ...row(secondRowCount, 55)];
}

export default function GearDeviceVisual({ label, type, compact = false, showPorts = false, pedalboard = false }: Props) {
  const item = findCatalogItem(label, type);
  const color = item?.color ?? "#3f3f46";
  const pedal = ["tuner", "noise_gate", "compressor", "overdrive", "distortion", "delay", "eq", "pedal", "wireless"].includes(type);
  const displayName = item?.model ?? label;
  const profile = pedalVisualProfile(item?.id, type);
  const sliderCount = profile.sliders ?? 0;
  const manufacturer = item?.manufacturer ?? "FretForge";
  return <div className={`relative flex shrink-0 items-center justify-center ${pedalboard ? "h-full w-full" : compact ? "h-14 w-16" : "h-20 w-24"}`} aria-label={`${label} visual`}>
    <svg viewBox={pedalboard ? "0 0 96 180" : "0 0 96 80"} className="h-full w-full drop-shadow-md" role="img">
      {pedal ? <>
        <rect x={pedalboard ? 1 : 18} y={pedalboard ? 1 : 5} width={pedalboard ? 94 : 60} height={pedalboard ? 178 : 70} rx="9" fill={color} stroke="#71717a" strokeWidth="2"/>
        {pedalboard ? <>
          <text x="48" y="15" textAnchor="middle" fill="#f4f4f5" fontSize="7" fontWeight="700" opacity=".95">{manufacturer.toUpperCase().slice(0, 18)}</text>
          <rect x="8" y="19" width="80" height="2" rx="1" fill={profile.accent} opacity=".85"/>
          {knobPositions(profile.knobs).map((position, index) => <g key={`knob-${index}`}><circle cx={position.x} cy={position.y} r="7" fill="#18181b" stroke="#a1a1aa" strokeWidth="1.2"/><line x1={position.x} y1={position.y - 1} x2={position.x} y2={position.y - 5} stroke="#f4f4f5" strokeWidth="1.2" strokeLinecap="round"/></g>)}
          {sliderCount > 0 && Array.from({ length: sliderCount }, (_, index) => { const x = 12 + index * (72 / Math.max(1, sliderCount - 1)); const thumbY = 43 + (index % 3) * 8; return <g key={`slider-${index}`}><line x1={x} y1="29" x2={x} y2="76" stroke="#27272a" strokeWidth="2"/><rect x={x - 2.5} y={thumbY} width="5" height="8" rx="1" fill={profile.accent}/></g>; })}
          {profile.screen && <g><rect x="14" y={profile.knobs ? 66 : 31} width="68" height="34" rx="3" fill="#09090b" stroke={profile.accent} strokeWidth="1"/><rect x="21" y={profile.knobs ? 73 : 38} width="54" height="4" rx="2" fill={profile.accent} opacity=".75"/><rect x="28" y={profile.knobs ? 83 : 48} width="40" height="3" rx="1.5" fill="#d4d4d8" opacity=".65"/></g>}
          <rect x="10" y={profile.screen ? 105 : profile.sliders ? 85 : profile.knobs > 4 ? 78 : 66} width="76" height="28" rx="3" fill="#09090b" opacity=".86"/>
          {profile.footswitches === 2 && <circle cx="27" cy="148" r="10" fill="#27272a" stroke="#d4d4d8"/>}
          <circle cx={profile.footswitches === 2 ? 69 : 48} cy="148" r="10" fill="#27272a" stroke="#d4d4d8"/>
          <circle cx="48" cy="123" r="2.5" fill={profile.accent}/>
        </> : <>
          <circle cx="34" cy="22" r="5" fill="#18181b"/><circle cx="62" cy="22" r="5" fill="#18181b"/>
          <rect x="28" y="33" width="40" height="13" rx="2" fill="#09090b" opacity=".85"/>
          <circle cx="48" cy="61" r="7" fill="#27272a" stroke="#a1a1aa"/>
        </>}
      </> : type === "instrument" ? <>
        <path d="M24 58c-7-8-5-20 4-24 5-2 8 0 12-4 4-5 2-10 8-13 6 3 5 8 9 13 4 4 8 2 12 4 9 4 11 16 4 24-6 8-13 10-24 9-11 1-19-1-25-9z" fill={color} stroke="#a1a1aa" strokeWidth="2"/>
        <path d="M48 24l25-18 6 7-25 19z" fill="#a16207" stroke="#d4d4d8" strokeWidth="1"/>
        <path d="M74 5l11-3 4 5-9 7z" fill="#92400e" stroke="#d4d4d8" strokeWidth="1"/>
        <rect x="43" y="31" width="5" height="27" rx="2" fill="#e4e4e7" transform="rotate(-4 43 31)"/>
        <rect x="52" y="31" width="5" height="27" rx="2" fill="#e4e4e7" transform="rotate(4 52 31)"/>
        <circle cx="48" cy="58" r="3" fill="#f59e0b"/>
      </> : <>
        <rect x="8" y="18" width="80" height="45" rx="6" fill={color} stroke="#71717a" strokeWidth="2"/>
        <circle cx="22" cy="40" r="6" fill="#09090b"/><circle cx="74" cy="40" r="6" fill="#09090b"/>
        <rect x="34" y="29" width="28" height="22" rx="2" fill="#09090b" opacity=".8"/>
      </>}
    </svg>
    {pedalboard && pedal && <span className={`pointer-events-none absolute left-1/2 z-10 w-[74px] -translate-x-1/2 -translate-y-1/2 text-center text-[9px] font-bold leading-[10px] text-zinc-100 line-clamp-3 drop-shadow-[0_1px_1px_rgba(0,0,0,.9)] ${profile.screen ? "top-[67%]" : profile.sliders ? "top-[56%]" : profile.knobs > 4 ? "top-[52%]" : "top-[45%]"}`}>{displayName}</span>}
    {showPorts && item?.ports?.map((port) => <div key={port.id} className={`absolute z-20 rounded-full border border-zinc-200 bg-zinc-950 shadow-[0_0_0_2px_#27272a] ${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`} style={{ top: `${port.offset * 100}%`, [port.side]: compact ? "-5px" : "-6px", transform: "translateY(-50%)" }}>
      <span className={`absolute whitespace-nowrap rounded border bg-zinc-950 font-bold shadow-sm ${port.side === "left" ? "bottom-[calc(100%+3px)] right-[calc(100%+5px)] border-orange-900 text-orange-300" : "top-[calc(100%+3px)] left-[calc(100%+5px)] border-emerald-900 text-emerald-300"} ${compact ? "px-1 py-0.5 text-[6px] leading-none" : "px-1 py-0.5 text-[7px]"}`}>{port.label}</span>
    </div>)}
  </div>;
}
