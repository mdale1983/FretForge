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
        theme === "dark"
            ? "border-zinc-800 bg-zinc-900"
            : "border-zinc-300 bg-white"
        } ${
        leftPinned ? "w-64" : "w-16 hover:w-64"
      }`}
    >
      <div className={`flex items-center justify-between h-12 px-3 border-b ${
        theme === "dark"
            ? "border-zinc-800"
            : "border-zinc-300"
        }`}
        >
        <span
          className={`text-xs uppercase tracking-widest transition-opacity ${
            theme === "dark"
                ? "text-zinc-500"
                : "text-zinc-600"
            } ${
            leftPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          Modules
        </span>

        <button
          onClick={() => setLeftPinned(!leftPinned)}
          className={`rounded-md p-2 hover:text-orange-400 ${
            theme === "dark"
                ? "text-zinc-400 hover:bg-zinc-800"
                : "text-zinc-700 hover:bg-zinc-200"
            }`}
          title={leftPinned ? "Unpin rail" : "Pin rail"}
        >
          {leftPinned ? <PinOff size={16} /> : <Pin size={16} />}
        </button>
      </div>

      <nav className="p-2 space-y-1">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id

          return (
            <button
              key={module.name}
              onClick={() => setActiveModule(module.id)}               
              title={module.name}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                    ? "bg-orange-500/15 text-orange-400 shadow-inner"
                    : theme === "dark"
                    ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    : "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950"
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