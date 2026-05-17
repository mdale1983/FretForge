type RightRailProps = {
  activeModule: string;
  theme: string;
  onDeleteSession?: () => Promise<void>;
};
import { modules } from "../data/modules";
import { Trash2 } from "lucide-react";

function RightRail({ activeModule, theme, onDeleteSession }: RightRailProps) {
      const currentModule =
    modules.find((module) => module.id === activeModule) ?? modules[0];
  return (
    <aside
        className={`w-16 hover:w-72 transition-all duration-300 border-l overflow-hidden group ${
            theme === "dark"
            ? "border-zinc-800 bg-zinc-900"
            : "border-zinc-300 bg-white"
        }`}
 >
      <div className="p-4 whitespace-nowrap">
        <h2
            className={`text-orange-400 font-semibold mb-4 opacity-0 group-hover:opacity-100 transition-opacity ${
                theme === "dark"
                ? "text-orange-400"
                : "text-orange-500"
            }`}
        >
          Context
        </h2>

        <div
            className={`space-y-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity ${
                theme === "dark"
                ? "text-zinc-400"
                : "text-zinc-700"
            }`}
        >
            <p>Active module: {currentModule.name}</p>
            <p>Description: {currentModule.description}</p>
            <p>Project: None</p>
            <p>Storage mode: NAS</p>
            <p>Recovery: Ready</p>
            <p>Logs: Clean</p>
            <button
                onClick={() => void onDeleteSession?.()}
                className={`flex items-center gap-2 mt-4 px-3 py-2 rounded transition-colors ${
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