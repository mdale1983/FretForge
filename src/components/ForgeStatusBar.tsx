type ForgeStatusBarProps = {
  version: string;
  theme: string;
  setTheme: (theme: string) => void;
};

function ForgeStatusBar({ version, theme, setTheme }: ForgeStatusBarProps) {
  return (
    <header
        className={`flex h-14 items-center justify-between border-b px-4 sm:px-5 text-sm shrink-0 ${
            theme === "dark"
            ? "border-zinc-800 bg-zinc-900"
            : "border-zinc-300 bg-white"
        }`}
    >
      <div className="flex items-center gap-5 min-w-0">
        <div className="text-base font-bold tracking-wide text-orange-400 whitespace-nowrap">
          FretForge
        </div>

        <div
          className={`hidden sm:block whitespace-nowrap ${
            theme === "dark"
              ? "text-zinc-500"
              : "text-zinc-600"
          }`}
        >
            {version}
        </div>
      </div>

      <div
        className={`hidden xl:flex items-center gap-5 px-6 ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
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
        className={`flex items-center gap-4 shrink-0 ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
        }`}
      >
        <span className="hidden lg:inline">Mic: Off</span>
        <span>Tuner: Ready</span>
        <span className="hidden md:inline">
          Storage: NAS
        </span>

        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              theme === "dark"
                ? "border-zinc-700 text-zinc-300 hover:border-orange-400 hover:text-orange-400 hover:bg-zinc-800"
                : "border-zinc-300 text-zinc-700 hover:border-orange-500 hover:text-orange-600 hover:bg-zinc-100"
            }`}
        >
            {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}

export default ForgeStatusBar;