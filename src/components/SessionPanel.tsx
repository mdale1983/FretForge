import { useEffect, useState } from "react";
import { getActiveProjectId } from "../services/ProjectService";
import {
  createSession,
  deleteSession,
  getActiveSessionId,
  getSessionsForProject,
  renameSession,
  setActiveSession,
  switchToFallbackSessionBeforeDelete,
  updateSessionNotes,
  type Session,
} from "../services/SessionService";

type SessionPanelProps = {
  theme: string;
  refreshKey: number;
  onWorkstationStatusRefresh: () => Promise<void>;
};

function SessionPanel({
  theme,
  refreshKey,
  onWorkstationStatusRefresh,
}: SessionPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [currentActiveSessionId, setCurrentActiveSessionId] =
    useState<number | null>(null);
  const [renamingSessionId, setRenamingSessionId] =
    useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [editingNotesSessionId, setEditingNotesSessionId] =
    useState<number | null>(null);

  const [notesValue, setNotesValue] = useState("");

  async function loadSessions() {
    const projectId = await getActiveProjectId();
    const sessionId = await getActiveSessionId();

    setActiveProjectId(projectId);
    setCurrentActiveSessionId(sessionId);

    if (!projectId) {
      setSessions([]);
      return;
    }

    const loadedSessions = await getSessionsForProject(projectId);
    setSessions(loadedSessions);
  }

  async function handleNewSession() {
    if (!activeProjectId) {
      window.alert("No active project selected.");
      return;
    }

    try {
      const newSession = await createSession(activeProjectId);

      if (newSession) {
        await setActiveSession(newSession.id);
      }

      await loadSessions();
      await onWorkstationStatusRefresh();
    } catch (error) {
      console.warn("New session failed:", error);
      window.alert("Could not create a new session.");
    }
  }

  async function handleSelectSession(sessionId: number) {
    await setActiveSession(sessionId);
    await loadSessions();
    await onWorkstationStatusRefresh();
  }

  async function handleRenameSession(sessionId: number) {
    const trimmedName = renameValue.trim();

    if (!trimmedName) {
      window.alert("Session name cannot be empty.");
      return;
    }

    await renameSession(sessionId, trimmedName);

    setRenamingSessionId(null);
    setRenameValue("");

    await loadSessions();
    await onWorkstationStatusRefresh();
  }

  async function handleSaveSessionNotes(sessionId: number) {
    await updateSessionNotes(sessionId, notesValue);

    setEditingNotesSessionId(null);
    setNotesValue("");

    await loadSessions();
    await onWorkstationStatusRefresh();
  }

  async function handleDeleteSession(sessionId: number) {
    if (!activeProjectId) return;

    const confirmed = window.confirm(
      "Delete this session? This cannot be undone."
    );

    if (!confirmed) return;

    const activeSessionId = await getActiveSessionId();

    try {
      if (activeSessionId === sessionId) {
        await switchToFallbackSessionBeforeDelete(activeProjectId, sessionId);
      }

      await deleteSession(sessionId);

      await loadSessions();
      await onWorkstationStatusRefresh();
    } catch (error) {
      console.warn("Session delete failed:", error);
      window.alert("Could not delete session safely.");
    }
  }

  useEffect(() => {
    loadSessions();
  }, [refreshKey]);

  useEffect(() => {
    const handleSessionsChanged = async () => {
      await loadSessions();
      await onWorkstationStatusRefresh();
    };

    window.addEventListener(
      "fretforge:sessions-changed",
      handleSessionsChanged
    );

    return () => {
      window.removeEventListener(
        "fretforge:sessions-changed",
        handleSessionsChanged
      );
    };
  }, [onWorkstationStatusRefresh]);

  return (
    <div
      className={`flex min-h-[420px] flex-col rounded-2xl border p-5 shadow-lg sm:p-6 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900/80 shadow-black/20"
          : "border-zinc-300 bg-white shadow-zinc-300/40"
      }`}
    >
      <div className="mb-5">
        <h2 className="mb-2 text-lg font-semibold tracking-tight sm:text-xl">
          Sessions
        </h2>

        <button
          type="button"
          onClick={handleNewSession}
          disabled={!activeProjectId}
          className={`mb-5 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:w-auto ${
            theme === "dark"
              ? "bg-orange-500 text-black hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500"
              : "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-zinc-300 disabled:text-zinc-500"
          }`}
        >
          New Session
        </button>

        <p
          className={`text-sm leading-relaxed ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
          }`}
        >
          {sessions.length} saved session
          {sessions.length === 1 ? "" : "s"} for the active project.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {sessions.length === 0 && (
          <div
            className={`rounded-xl border px-5 py-8 text-center text-sm leading-relaxed ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950 text-zinc-500"
                : "border-zinc-300 bg-zinc-100 text-zinc-500"
            }`}
          >
            No sessions found. Create a session to begin tracking recording,
            practice, and workflow progress.
          </div>
        )}

        {sessions.map((session) => {
          const isActive = session.id === currentActiveSessionId;

          return (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectSession(session.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  handleSelectSession(session.id);
                }
              }}
              className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? "border-orange-500 bg-orange-500/10 shadow-inner shadow-orange-500/10"
                  : theme === "dark"
                  ? "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900"
                  : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-200"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="min-w-0 flex-1">
                  {renamingSessionId === session.id ? (
                    <input
                      value={renameValue}
                      autoFocus
                      onChange={(event) =>
                        setRenameValue(event.target.value)
                      }
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleRenameSession(session.id);
                        }

                        if (event.key === "Escape") {
                          setRenamingSessionId(null);
                          setRenameValue("");
                        }
                      }}
                      className={`w-full rounded-md border px-2 py-1 text-sm outline-none ${
                        theme === "dark"
                          ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                          : "border-zinc-300 bg-white text-zinc-900"
                      }`}
                    />
                  ) : (
                    <div
                      className={`font-medium ${
                        theme === "dark"
                          ? "text-zinc-100"
                          : "text-zinc-900"
                      }`}
                    >
                      {session.name}
                    </div>
                  )}

                  <div className="mt-1 text-xs text-zinc-500">
                    Session #{session.id}
                    {isActive ? " — Active" : ""}
                  </div>

                  <div className="text-xs text-zinc-500">
                    {new Date(session.updated_at).toLocaleString()}
                  </div>

                  <div className="mt-3">
                    {editingNotesSessionId === session.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesValue}
                          autoFocus
                          onChange={(event) => setNotesValue(event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          rows={4}
                          className={`w-full resize-none rounded-md border px-3 py-2 text-xs outline-none ${
                            theme === "dark"
                              ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                              : "border-zinc-300 bg-white text-zinc-900"
                          }`}
                        />

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSaveSessionNotes(session.id);
                            }}
                            className={`rounded-md border px-3 py-1 text-xs font-medium ${
                              theme === "dark"
                                ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                                : "border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            Save Notes
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditingNotesSessionId(null);
                              setNotesValue("");
                            }}
                            className={`rounded-md border px-3 py-1 text-xs font-medium ${
                              theme === "dark"
                                ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`rounded-md border px-3 py-2 text-xs leading-relaxed ${
                          theme === "dark"
                            ? "border-zinc-800 bg-zinc-950 text-zinc-400"
                            : "border-zinc-300 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        {session.notes?.trim() || "No notes yet."}
                      </div>
                    )}
                  </div>

                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setRenamingSessionId(session.id);
                      setRenameValue(session.name);
                    }}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                      theme === "dark"
                        ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    Rename
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingNotesSessionId(session.id);
                      setNotesValue(session.notes ?? "");
                    }}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                      theme === "dark"
                        ? "border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
                        : "border-blue-400 text-blue-700 hover:bg-blue-50"
                    }`}
                  >
                    Edit Notes
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                      theme === "dark"
                        ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
                        : "border-red-400 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SessionPanel;