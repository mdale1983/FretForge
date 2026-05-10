import { useEffect, useState } from "react";
import {
  getActiveProjectId,
} from "../services/projectService";

import {
  getSessionsForProject,
} from "../services/SessionService";

function SessionPanel({
  theme,
  refreshKey,
}: {
  theme: string;
  refreshKey: number;
}) {
  const [sessions, setSessions] = useState<any[]>([]);

    const [activeProjectId, setActiveProjectId] =
    useState<number | null>(null);

  useEffect(() => {
  loadSessions();
}, [refreshKey]);

  async function loadSessions() {
    const activeProjectId =
      await getActiveProjectId();
      setActiveProjectId(activeProjectId);

    if (!activeProjectId) {
      setSessions([]);
      return;
    }

    const loadedSessions =
      await getSessionsForProject(
        activeProjectId
      );

    setSessions(loadedSessions);
  }

  return (
    <div
      className={`rounded-xl border p-5 shadow-lg ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900/80 shadow-black/20"
          : "border-zinc-300 bg-white shadow-zinc-300/40"
      }`}
    >
      <h2 className="mb-2 font-semibold">
        Sessions
      </h2>

      <p
        className={`mb-4 text-sm ${
          theme === "dark"
            ? "text-zinc-400"
            : "text-zinc-600"
        }`}
      >
        {sessions.length} saved session
        {sessions.length === 1 ? "" : "s"} for the active project.
      </p>

      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {sessions.length === 0 && (
          <div
            className={`rounded border px-4 py-6 text-center text-sm ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950 text-zinc-500"
                : "border-zinc-300 bg-zinc-100 text-zinc-500"
            }`}
          >
            No sessions found.
          </div>
        )}

        {sessions.map((session, index) => {
            const isLatest = index === 0;

            return (
                <div
                key={session.id}
                className={`rounded border px-3 py-2 text-sm ${
                    isLatest
                    ? "border-orange-500 bg-orange-500/10"
                    : theme === "dark"
                    ? "border-zinc-700 bg-zinc-950 text-zinc-300"
                    : "border-zinc-300 bg-zinc-100 text-zinc-700"
                }`}
                >
                <div className="font-medium">
                    {session.name}
                </div>

                <div className="text-xs text-zinc-500">
                    {new Date(
                    session.updated_at
                    ).toLocaleString()}
                </div>
                </div>
            );
            })}
      </div>
    </div>
  );
}

export default SessionPanel;