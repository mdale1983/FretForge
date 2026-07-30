import { Session } from "../../types/session";

type CurrentSessionCardProps = {
  activeSession: Session | null;
  theme: string;
  onManage?: () => void;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function DetailRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">
        {label}
      </div>

      <div
        className={`mt-1 text-sm font-medium ${
          theme === "dark" ? "text-zinc-200" : "text-zinc-800"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function CurrentSessionCard({
  activeSession,
  theme,
  onManage,
}: CurrentSessionCardProps) {
  const sessionNotes = activeSession?.notes?.trim();

  return (
    <div
      className={`flex min-h-[360px] flex-col rounded-2xl border p-5 shadow-lg sm:p-6 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900/80 shadow-black/20 hover:border-zinc-700 hover:bg-zinc-900 hover:-translate-y-0.5"
          : "border-zinc-300 bg-white shadow-zinc-300/40 hover:border-zinc-400 hover:bg-zinc-50 hover:-translate-y-0.5"
      }`}
    >
      <h2
        className={`mb-4 text-base font-semibold tracking-tight sm:text-lg ${
          theme === "dark" ? "text-zinc-100" : "text-zinc-900"
        }`}
      >
        Current Session
      </h2>

      {!activeSession ? (
        <p
          className={`text-sm ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-700"
          }`}
        >
          Please create your first session.
        </p>
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div>
            <div className="text-lg font-semibold text-orange-400">
              {activeSession.name}
            </div>

          </div>

          <div
            className={`mt-4 min-h-[160px] flex-1 overflow-y-auto rounded-md border px-3 py-3 text-xs leading-relaxed break-words ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950 text-zinc-400"
                : "border-zinc-300 bg-zinc-50 text-zinc-600"
            }`}
          >
            {sessionNotes || "No session notes yet."}
          </div>

          <div className="mt-auto grid grid-cols-1 gap-3 pt-4">
            <DetailRow
              label="Created"
              value={formatDate(activeSession.created_at)}
              theme={theme}
            />

            <DetailRow
              label="Updated"
              value={formatDate(activeSession.updated_at)}
              theme={theme}
            />

            <DetailRow label="Status" value="Active" theme={theme} />
            {onManage && <button type="button" onClick={onManage} className="mt-1 rounded-lg border border-orange-500 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/10">Manage Sessions</button>}
          </div>
        </div>
      )}
    </div>
  );
}
