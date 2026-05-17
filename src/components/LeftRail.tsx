import {
  Pin,
  PinOff,
} from "lucide-react";
import { modules } from "../data/modules";

type LeftRailProps = {
  theme: string;
  activeModule: string;
  setActiveModule: (module: string) => void;
  leftPinned: boolean;
  setLeftPinned: (pinned: boolean) => void;
};

function LeftRail({
  activeModule,
  setActiveModule,
  leftPinned,
  setLeftPinned,
  theme,
}: LeftRailProps) {
  return (
    <aside
      className={`group border-r transition-all duration-300 overflow-hidden ${
        leftPinned ? "w-64" : "w-16 hover:w-64"
      } ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900"
          : "border-zinc-300 bg-white"
      }`}
    >
      <div
        className={`flex items-center justify-between h-12 px-3 border-b ${
          theme === "dark"
            ? "border-zinc-800"
            : "border-zinc-300"
        }`}
      >
        <span
          className={`font-semibold transition-opacity ${
            leftPinned
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          } ${
            theme === "dark"
              ? "text-orange-400"
              : "text-orange-600"
          }`}
        >
          Modules
        </span>

        <button
          onClick={() => setLeftPinned(!leftPinned)}
          className={`rounded-md p-2 transition-colors ${
            theme === "dark"
              ? "text-zinc-400 hover:bg-zinc-800 hover:text-orange-400"
              : "text-zinc-700 hover:bg-zinc-200 hover:text-orange-700"
          }`}
          title={leftPinned ? "Unpin rail" : "Pin rail"}
        >
          {leftPinned ? <PinOff size={16} /> : <Pin size={16} />}
        </button>
      </div>

      <nav className="p-2 space-y-1">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;

          return (
            <button
              key={module.name}
              onClick={() => setActiveModule(module.id)}
              title={module.name}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? theme === "dark"
                    ? "bg-orange-500/15 text-orange-400 shadow-inner"
                    : "bg-orange-200/70 text-orange-800 shadow-inner border border-orange-300"
                  : theme === "dark"
                    ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    : "text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              <Icon size={18} className="shrink-0" />

              <span
                className={`whitespace-nowrap transition-opacity ${
                  leftPinned
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {module.name}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default LeftRail;