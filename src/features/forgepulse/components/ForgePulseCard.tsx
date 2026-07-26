type ForgePulseCardProps = {
  theme: string;
  title: string;
  children: React.ReactNode;
};

// Shared visual shell for ForgePulse setup and preview sections
export function ForgePulseCard({
  theme,
  title,
  children,
}: ForgePulseCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-950/50"
          : "border-zinc-200 bg-zinc-50"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {title}
      </p>

      {children}
    </div>
  );
}
