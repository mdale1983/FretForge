import { useEffect, useState } from "react";
import { getActiveProjectId } from "../services/projectService";
import { useAsyncAction } from "../hooks/useAsyncAction";
import NewSessionModal from "./NewSessionModal";
import { setActiveProject } from "../services/projectService";
import {
  completeSession,
  getCompletedSessionsForProject,
  createSession,
  deleteSession,
  getActiveSessionId,
  getSessionsForProject,
  renameSession,
  reopenSession,
  setActiveSession,
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
  const sessionAction = useAsyncAction();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [isCompletedSessionsOpen, setIsCompletedSessionsOpen] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<Session[]>([]);
  const [currentActiveSessionId, setCurrentActiveSessionId] =
    useState<number | null>(null);
  const [renamingSessionId, setRenamingSessionId] =
    useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [editingNotesSessionId, setEditingNotesSessionId] =
    useState<number | null>(null);

  const [notesValue, setNotesValue] = useState("");
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const selectedSession =
    sessions.find((session) => session.id === currentActiveSessionId) ?? sessions[0] ?? null;
  const sessionQuery = "";
  const visibleSessions = selectedSession ? [selectedSession] : [];

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

  async function loadCompletedSessions() {
    if (!activeProjectId) {
      setCompletedSessions([]);
      return;
    }

    const loadedCompletedSessions =
      await getCompletedSessionsForProject(activeProjectId);

    setCompletedSessions(loadedCompletedSessions);
  }

  async function handleNewSession(projectId: number, name: string, notes: string) {
    await sessionAction.run(async () => {
      await setActiveProject(projectId);
      const newSession = await createSession(projectId, name, notes);

      if (newSession) {
        await setActiveSession(newSession.id);
      }

      await loadSessions();
      await onWorkstationStatusRefresh();
      setIsNewSessionOpen(false);
    }, "A new session could not be created.");
  }

  async function handleSelectSession(sessionId: number) {
    await sessionAction.run(async () => {
    await setActiveSession(sessionId);
    await loadSessions();
    await onWorkstationStatusRefresh();
    }, "The active session could not be changed.");
  }

  async function handleRenameSession(sessionId: number) {
    await sessionAction.run(async () => {
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
    }, "The session could not be renamed.");
  }

  async function handleSaveSessionNotes(sessionId: number) {
    await sessionAction.run(async () => {
    await updateSessionNotes(sessionId, notesValue);

    setEditingNotesSessionId(null);
    setNotesValue("");

    await loadSessions();
    await onWorkstationStatusRefresh();
    }, "The session notes could not be saved.");
  }

  async function handleDeleteSession(sessionId: number) {
    if (!activeProjectId) return;

    const confirmed = window.confirm(
      "Delete this session? This cannot be undone."
    );

    if (!confirmed) return;

    await sessionAction.run(async () => {
      await deleteSession(sessionId);

      await loadSessions();
      await onWorkstationStatusRefresh();
    }, "The session could not be deleted safely.");
  }

  async function handleCompleteSession(session: Session) {
    const confirmed = window.confirm(
      `Complete session "${session.name}"? It will move to Completed Sessions.`
    );

    if (!confirmed) return;

    await sessionAction.run(async () => {
    await completeSession(session.id);

    await loadSessions();
    await onWorkstationStatusRefresh();
    }, "The session could not be completed.");
  }

  async function handleReopenSession(session: Session) {
    await sessionAction.run(async () => {
      await reopenSession(session.id);
      await setActiveSession(session.id);
      setIsCompletedSessionsOpen(false);
      await loadCompletedSessions();
      await loadSessions();
      await onWorkstationStatusRefresh();
    }, "The completed session could not be reopened.");
  }

  async function handleDeleteCompletedSession(session: Session) {
    if (!window.confirm(`Permanently delete completed session "${session.name}"? This cannot be undone.`)) return;
    await sessionAction.run(async () => {
      await deleteSession(session.id);
      await loadCompletedSessions();
      await onWorkstationStatusRefresh();
    }, "The completed session could not be deleted.");
  }

  useEffect(() => {
    sessionAction.run(
      loadSessions,
      "Sessions could not be loaded. Please try again."
    );
  }, [refreshKey, sessionAction.run]);

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
      aria-busy={sessionAction.isPending}
      className={`flex h-full min-h-[420px] flex-col rounded-2xl border p-5 shadow-lg sm:p-6 ${
        theme === "dark"
          ? "border-zinc-800 bg-zinc-900/80 shadow-black/20"
          : "border-zinc-300 bg-white shadow-zinc-300/40"
      }`}
    >
      <div className="mb-5">
        <h2 className="mb-2 text-lg font-semibold tracking-tight sm:text-xl">
          Sessions
        </h2>

        {sessionAction.errorMessage && (
          <p className="mb-3 text-sm text-red-400" role="alert">
            {sessionAction.errorMessage}
          </p>
        )}

        {sessionAction.isPending && (
          <p className="mb-3 text-xs text-zinc-500">Updating session…</p>
        )}

        <div className="mb-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsNewSessionOpen(true)}
            disabled={!activeProjectId}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              theme === "dark"
                ? "bg-orange-500 text-black hover:bg-orange-400 disabled:bg-zinc-800 disabled:text-zinc-500"
                : "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-zinc-300 disabled:text-zinc-500"
            }`}
          >
            New Session
          </button>

          <button
            type="button"
            onClick={async () => {
              await loadCompletedSessions();
              setIsCompletedSessionsOpen(true);
            }}
            disabled={!activeProjectId}
            className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              theme === "dark"
                ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800 disabled:border-zinc-800 disabled:text-zinc-600"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 disabled:text-zinc-400"
            }`}
          >
            Completed Sessions
          </button>
        </div>

        <p
          className={`text-sm leading-relaxed ${
            theme === "dark" ? "text-zinc-400" : "text-zinc-600"
          }`}
        >
          {sessions.length} saved session
          {sessions.length === 1 ? "" : "s"} for the active project.
        </p>

        <div className="mt-4">
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-zinc-500">Selected Session</label>
          <select
            value={selectedSession?.id ?? ""}
            onChange={(event) => handleSelectSession(Number(event.target.value))}
            aria-label="Select session"
            disabled={!activeProjectId}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm disabled:opacity-50 ${
              theme === "dark"
                ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-900"
            }`}
          >
            {sessions.length === 0 && <option value="">No sessions available</option>}
            {sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {visibleSessions.length === 0 && (
          <div
            className={`rounded-xl border px-5 py-8 text-center text-sm leading-relaxed ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-950 text-zinc-500"
                : "border-zinc-300 bg-zinc-100 text-zinc-500"
            }`}
          >
            {!activeProjectId
              ? "Select or create a project before managing sessions."
              : sessions.length === 0
                ? "Please create your first session for this project."
                : `No sessions match “${sessionQuery.trim()}”.`}
          </div>
        )}

        {visibleSessions.map((session) => {
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
              className={`h-full min-h-[360px] max-w-full cursor-pointer overflow-hidden rounded-xl border px-4 py-4 text-sm transition-all duration-200 ${
                isActive
                  ? "border-orange-500 bg-orange-500/10 shadow-inner shadow-orange-500/10"
                  : theme === "dark"
                  ? "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900"
                  : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-200"
              }`}
            >
              <div className="flex h-full flex-col gap-3">
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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

                  <div className="text-xs text-zinc-500">
                    {new Date(session.updated_at).toLocaleString()}
                  </div>

                  <div className="mt-3 min-h-0 flex-1">
                    {editingNotesSessionId === session.id ? (
                      <div className="flex h-full min-h-0 flex-col gap-2">
                        <textarea
                          value={notesValue}
                          maxLength={250}
                          autoFocus
                          onChange={(event) => setNotesValue(event.target.value)}
                          onClick={(event) => event.stopPropagation()}
                          className={`min-h-[140px] w-full flex-1 resize-none rounded-md border px-3 py-2 text-xs outline-none ${
                            theme === "dark"
                              ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                              : "border-zinc-300 bg-white text-zinc-900"
                          }`}
                        />

                        <div
                          className={`text-right text-xs ${
                            theme === "dark" ? "text-zinc-500" : "text-zinc-600"
                          }`}
                        >
                          {notesValue.length} / 250 characters
                        </div>

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
                        className={`h-full min-h-[140px] max-w-full overflow-y-auto rounded-md border px-3 py-3 text-xs leading-relaxed break-words ${
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

                <div className={`mt-auto grid grid-cols-4 gap-1.5 border-t pt-4 ${theme === "dark" ? "border-zinc-800" : "border-zinc-300"}`}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setRenamingSessionId(session.id);
                      setRenameValue(session.name);
                    }}
                    className={`whitespace-nowrap rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
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
                    className={`whitespace-nowrap rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
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
                      handleCompleteSession(session);
                    }}
                    className={`whitespace-nowrap rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                      theme === "dark"
                        ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                        : "border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    Complete
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    className={`whitespace-nowrap rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors ${
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
      {isCompletedSessionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className={`w-full max-w-lg rounded-xl border p-6 shadow-xl ${
              theme === "dark"
                ? "border-zinc-800 bg-zinc-900"
                : "border-zinc-300 bg-white"
            }`}
          >
            <h2 className="mb-3 text-lg font-semibold">
              Completed Sessions
            </h2>

            <p
              className={`mb-5 text-sm ${
                theme === "dark" ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              Completed sessions are kept with the active project for later reference.
            </p>

            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {completedSessions.length === 0 ? (
                <div
                  className={`rounded-xl border px-5 py-8 text-center text-sm ${
                    theme === "dark"
                      ? "border-zinc-800 bg-zinc-950 text-zinc-500"
                      : "border-zinc-300 bg-zinc-100 text-zinc-500"
                  }`}
                >
                  No completed sessions for this project yet.
                </div>
              ) : (
                completedSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      theme === "dark"
                        ? "border-zinc-700 bg-zinc-950 text-zinc-300"
                        : "border-zinc-300 bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    <div className="font-medium text-orange-400">
                      {session.name}
                    </div>

                    <div className="mt-1 text-xs text-zinc-500">
                      Completed:{" "}
                      {session.completed_at
                        ? new Date(session.completed_at).toLocaleString()
                        : "Unknown"}
                    </div>

                    {session.notes?.trim() && (
                      <div
                        className={`mt-3 max-w-full overflow-hidden rounded-md border px-3 py-2 text-xs leading-relaxed break-words ${
                          theme === "dark"
                            ? "border-zinc-800 bg-zinc-900 text-zinc-400"
                            : "border-zinc-300 bg-white text-zinc-600"
                        }`}
                      >
                        {session.notes.trim()}
                      </div>
                    )}
                    <div className="mt-3 flex justify-end gap-2">
                      <button type="button" onClick={() => handleReopenSession(session)} className="rounded-md border border-emerald-500/50 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10">Reopen Session</button>
                      <button type="button" onClick={() => handleDeleteCompletedSession(session)} className="rounded-md border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10">Delete Permanently</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsCompletedSessionsOpen(false)}
                className={`rounded border px-4 py-2 text-sm ${
                  theme === "dark"
                    ? "border-zinc-700 hover:bg-zinc-800"
                    : "border-zinc-300 hover:bg-zinc-100"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {isNewSessionOpen && <NewSessionModal theme={theme} defaultProjectId={activeProjectId} onClose={() => setIsNewSessionOpen(false)} onCreate={handleNewSession} />}
    </div>
  );
}

export default SessionPanel;
