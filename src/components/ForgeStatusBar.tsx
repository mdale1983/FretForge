type ForgeStatusBarProps = {
  theme: string;
  setTheme: (theme: string) => void;
};

function ForgeStatusBar({
  theme,
  setTheme,
}: ForgeStatusBarProps) {
  return (
    <header
      className={`grid h-16 shrink-0 grid-cols-[1fr_auto] items-center border-b px-4 sm:px-5 text-sm ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900"
          : "border-zinc-300 bg-white"
      }`}
    >
      <div className="min-w-0 text-center">
        <div className="text-base font-bold tracking-wide text-orange-400">
          The Forge Dashboard
        </div>

        <div
          className={`mt-0.5 text-xs tracking-wide ${
            theme === "dark"
              ? "text-zinc-500"
              : "text-zinc-600"
          }`}
        >
          Central Workspace
        </div>
      </div>

      <button
        onClick={() =>
          setTheme(
            theme === "dark" ? "light" : "dark"
          )
        }
        className={`ml-4 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
          theme === "dark"
            ? "border-zinc-700 text-zinc-300 hover:border-orange-400 hover:bg-zinc-800 hover:text-orange-400"
            : "border-zinc-300 text-zinc-700 hover:border-orange-500 hover:bg-zinc-100 hover:text-orange-600"
        }`}
      >
        {theme === "dark" ? "Light" : "Dark"}
      </button>
    </header>
  );
}

export default ForgeStatusBar;