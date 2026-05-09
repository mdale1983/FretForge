type ForgeStatusBarProps = {
  version: string;
  theme: string;
  setTheme: (theme: string) => void;
};

function ForgeStatusBar({ version, theme, setTheme }: ForgeStatusBarProps) {
  return (
    <header
        className={`h-12 border-b flex items-center justify-between px-4 text-sm ${
            theme === "dark"
            ? "border-zinc-800 bg-zinc-900"
            : "border-zinc-300 bg-white"
        }`}
    >
      <div className="flex items-center gap-4">
        <div className="font-bold tracking-wide text-orange-400">
          FretForge
        </div>

        <div className={theme === "dark" ? "text-zinc-500" : "text-zinc-600"}>
            {version}
        </div>
      </div>

      <div
        className={`hidden xl:flex gap-4 ${
            theme === "dark" ? "text-zinc-300" : "text-zinc-700"
        }`}
      >
        <span>CPU: --%</span>
        <span>RAM: --%</span>
        <span>GPU: --%</span>
        <span>Audio: AXE I/O One</span>
        <span>48 kHz</span>
        <span>Latency: -- ms</span>
      </div>

      <div
        className={`flex items-center gap-3 ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-700"
        }`}
      >
        <span>Mic: Off</span>
        <span>Tuner: Ready</span>
        <span>Storage: NAS</span>

        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs hover:border-orange-400 hover:text-orange-400"
        >
            {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}

export default ForgeStatusBar;