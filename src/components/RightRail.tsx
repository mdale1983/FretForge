type RightRailProps = {
  activeModule: string;
  theme: string;
  rightPinned: boolean;
  setRightPinned: (value: boolean) => void;
  onDeleteSession?: () => Promise<void>;
  sessionCount?: number;
};

import { modules } from "../data/modules";
import { Pin, PinOff, Trash2 } from "lucide-react";

function RightRail({
  activeModule,
  theme,
  rightPinned,
  setRightPinned,
  onDeleteSession,
  sessionCount,
}: RightRailProps) {
  const currentModule =
    modules.find((module) => module.id === activeModule) ?? modules[0];

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
                : "text-orange-500"
            }`}
          >
            Context
          </h2>

          <button
            onClick={() => setRightPinned(!rightPinned)}
            className={`rounded p-1 transition-colors ${
              rightPinned
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            } ${
              theme === "dark"
                ? "text-zinc-500 hover:text-orange-400"
                : "text-zinc-500 hover:text-orange-600"
            }`}
            title={
              rightPinned
                ? "Unpin right rail"
                : "Pin right rail"
            }
          >
            {rightPinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>
        </div>

        <div
          className={`space-y-3 text-sm transition-opacity ${
            rightPinned
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          } ${
            theme === "dark"
              ? "text-zinc-400"
              : "text-zinc-700"
          }`}
        >
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Active Module
              </p>
              <p className="text-zinc-200">
                {currentModule.name}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Description
              </p>
              <p className="text-zinc-300 leading-relaxed">
                {currentModule.description}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Project
              </p>
              <p className="text-zinc-300">None</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Storage
              </p>
              <p className="text-zinc-300">NAS</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Recovery
              </p>
              <p className="text-zinc-300">Ready</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Logs
              </p>
              <p className="text-zinc-300">Clean</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Sessions
              </p>
              <p className="text-zinc-300">
                {sessionCount ?? 0}
              </p>
            </div>
          </div>

          <button
            onClick={() => void onDeleteSession?.()}
            className={`flex w-full items-center justify-center gap-2 mt-4 px-3 py-2 rounded transition-colors ${
              theme === "dark"
                ? "bg-red-950 hover:bg-red-900 text-red-300"
                : "bg-red-100 hover:bg-red-200 text-red-700"
            }`}
          >
            <Trash2 size={16} />
            <span>Delete Session</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default RightRail;