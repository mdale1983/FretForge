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
      className={`group shrink-0 border-r transition-all duration-300 overflow-hidden ${
        leftPinned ? "w-64" : "w-16 hover:w-64 lg:hover:w-72"
      } ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900"
          : "border-zinc-300 bg-white"
      }`}
    >
      <div
        className={`flex h-14 items-center justify-between border-b px-3 ${
          theme === "dark"
            ? "border-zinc-800"
            : "border-zinc-300"
        }`}
      >
        <span
          className={`text-sm font-semibold tracking-wide uppercase transition-opacity ${
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
          className={`rounded-lg p-2 transition-all duration-200 ${
            theme === "dark"
              ? "text-zinc-400 hover:bg-zinc-800 hover:text-orange-400"
              : "text-zinc-700 hover:bg-zinc-200 hover:text-orange-700"
          }`}
          title={leftPinned ? "Unpin rail" : "Pin rail"}
        >
          {leftPinned ? <PinOff size={16} /> : <Pin size={16} />}
        </button>
      </div>

      <nav className="space-y-1.5 p-2">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;

          return (
            <button
              key={module.name}
              onClick={() => setActiveModule(module.id)}
              title={module.name}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? theme === "dark"
                    ? "border border-orange-500/30 bg-orange-500/15 text-orange-300 shadow-inner shadow-orange-500/10"
                    : "bg-orange-200/70 text-orange-800 shadow-inner border border-orange-300"
                  : theme === "dark"
                    ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 hover:border hover:border-zinc-700"
                    : "text-zinc-800 hover:border hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              <Icon size={18} className="shrink-0 opacity-90" />

              <span
                className={`whitespace-nowrap text-sm font-medium transition-opacity duration-200 ${
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