type RightRailProps = {
  activeModule: string;
  theme: string;
  rightPinned: boolean;
  setRightPinned: (value: boolean) => void;
  sessionCount?: number;
};

import { modules } from "../data/modules";
import {
  PanelRight,
  Pin,
  PinOff,
} from "lucide-react";

function RightRail({
  activeModule,
  theme,
  rightPinned,
  setRightPinned,
  sessionCount,
}: RightRailProps) {
  const currentModule =
    modules.find((module) => module.id === activeModule) ?? modules[0];

  const labelClass =
    theme === "dark"
      ? "text-zinc-500"
      : "text-zinc-600";

  const valueClass =
    theme === "dark"
      ? "text-zinc-200"
      : "text-zinc-900";

  return (
    <aside
      className={`${
        rightPinned
          ? "w-[clamp(16rem,18vw,20rem)]"
          : "w-16 hover:w-[clamp(16rem,18vw,20rem)]"
      } transition-all duration-300 border-l overflow-hidden group ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900"
          : "border-zinc-300 bg-white"
      }`}
    >
      <div
        className={`absolute mt-4 ml-4 transition-opacity ${
          rightPinned
            ? "opacity-0"
            : "opacity-100 group-hover:opacity-0"
        } ${
          theme === "dark"
            ? "text-zinc-500"
            : "text-zinc-600"
        }`}
      >
        <PanelRight size={18} />
      </div>

      <div className="p-4 pr-6 break-words">
        <div className="mb-4 flex items-center justify-between">
          <h2
            className={`font-semibold transition-opacity ${
              rightPinned
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } ${
              theme === "dark"
                ? "text-orange-400"
                : "text-orange-600"
            }`}
          >
            Context
          </h2>

        </div>

        <div
          className={`space-y-3 text-sm transition-opacity ${
            rightPinned
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <div className="space-y-5">
            <div>
              <p className={`text-xs uppercase tracking-wide ${labelClass}`}>
                Active Module
              </p>
              <p className={valueClass}>
                {currentModule.name}
              </p>
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wide ${labelClass}`}>
                Description
              </p>
              <p className={`${valueClass} leading-relaxed`}>
                {currentModule.description}
              </p>
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wide ${labelClass}`}>
                Project
              </p>
              <p className={valueClass}>None</p>
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wide ${labelClass}`}>
                Storage
              </p>
              <p className={valueClass}>NAS</p>
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wide ${labelClass}`}>
                Recovery
              </p>
              <p className={valueClass}>Ready</p>
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wide ${labelClass}`}>
                Logs
              </p>
              <p className={valueClass}>Clean</p>
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wide ${labelClass}`}>
                Sessions
              </p>
              <p className={valueClass}>
                {sessionCount ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default RightRail;