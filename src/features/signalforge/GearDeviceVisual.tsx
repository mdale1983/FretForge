import type { SignalBlockType } from "./signalChainService";
import { findCatalogItem } from "./gearCatalog";

type Props = { label: string; type: SignalBlockType; compact?: boolean; showPorts?: boolean; pedalboard?: boolean };

export default function GearDeviceVisual({ label, type, compact = false, showPorts = false, pedalboard = false }: Props) {
  const item = findCatalogItem(label, type);
  const color = item?.color ?? "#3f3f46";
  const pedal = ["tuner", "noise_gate", "compressor", "overdrive", "distortion", "delay", "eq", "pedal", "wireless"].includes(type);
  const displayName = item?.model ?? label;
  return <div className={`relative flex shrink-0 items-center justify-center ${pedalboard ? "h-full w-full" : compact ? "h-14 w-16" : "h-20 w-24"}`} aria-label={`${label} visual`}>
    <svg viewBox={pedalboard ? "0 0 96 180" : "0 0 96 80"} className="h-full w-full drop-shadow-md" role="img">
      {pedal ? <>
        <rect x={pedalboard ? 1 : 18} y={pedalboard ? 1 : 5} width={pedalboard ? 94 : 60} height={pedalboard ? 178 : 70} rx="9" fill={color} stroke="#71717a" strokeWidth="2"/>
        <circle cx={pedalboard ? 27 : 34} cy={pedalboard ? 31 : 22} r="5" fill="#18181b"/><circle cx={pedalboard ? 69 : 62} cy={pedalboard ? 31 : 22} r="5" fill="#18181b"/>
        <rect x={pedalboard ? 11 : 28} y={pedalboard ? 56 : 33} width={pedalboard ? 74 : 40} height={pedalboard ? 42 : 13} rx="2" fill="#09090b" opacity=".85"/>
        <circle cx="48" cy={pedalboard ? 148 : 61} r={pedalboard ? 11 : 7} fill="#27272a" stroke="#a1a1aa"/>
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
    {pedalboard && pedal && <span className="pointer-events-none absolute left-1/2 top-[43%] z-10 w-[66px] -translate-x-1/2 -translate-y-1/2 text-center text-[7px] font-bold leading-[8px] text-zinc-100 line-clamp-3">{displayName}</span>}
    {showPorts && item?.ports?.map((port) => <div key={port.id} className="absolute z-20 flex items-center gap-0.5" style={{ top: `${port.offset * 100}%`, [port.side]: compact ? "-6px" : "-8px", transform: "translateY(-50%)" }}>
      {port.side === "left" && <span className={`whitespace-nowrap rounded border border-orange-900 bg-zinc-950 font-bold text-orange-300 ${compact ? "px-0.5 text-[6px]" : "px-1 py-0.5 text-[7px]"}`}>{port.label}</span>}
      <span className={`rounded-full border border-zinc-200 bg-zinc-950 shadow-[0_0_0_2px_#27272a] ${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`} />
      {port.side === "right" && <span className={`whitespace-nowrap rounded border border-emerald-900 bg-zinc-950 font-bold text-emerald-300 ${compact ? "px-0.5 text-[6px]" : "px-1 py-0.5 text-[7px]"}`}>{port.label}</span>}
    </div>)}
  </div>;
}
