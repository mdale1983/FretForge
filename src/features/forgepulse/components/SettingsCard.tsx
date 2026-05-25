type SettingsCardProps = {
  title: string;
  children: React.ReactNode;
};

export function SettingsCard({ title, children }: SettingsCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h2>

      <div className="space-y-4">{children}</div>
    </section>
  );
}