import { useEffect, useMemo, useState } from "react";
import { getActiveProjectId } from "../services/projectService";
import { useAsyncAction } from "../hooks/useAsyncAction";
import {
  completeSession,
  getCompletedSessionsForProject,
  createSession,
  deleteSession,
  getActiveSessionId,
  getSessionsForProject,
  renameSession,
  setActiveSession,
  switchToFallbackSessionBeforeDelete,
  updateSessionNotes,
  assignSignalChainToSession,
  type Session,
} from "../services/SessionService";
import { getSignalChains, type SignalChain } from "../features/signalforge/signalChainService";
import { buildRoutingSteps, routingStepKey } from "../features/signalforge/signalRoutingService";

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
  const [signalChains, setSignalChains] = useState<SignalChain[]>([]);
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
  const [sessionQuery, setSessionQuery] = useState("");
  const [sessionSort, setSessionSort] = useState<"recent" | "name">("recent");

  const visibleSessions = useMemo(() => {
    const normalizedQuery = sessionQuery.trim().toLocaleLowerCase();
    const filteredSessions = normalizedQuery
      ? sessions.filter((session) =>
          session.name.toLocaleLowerCase().includes(normalizedQuery)
        )
      : sessions;

    return sessionSort === "name"
      ? [...filteredSessions].sort((left, right) =>
          left.name.localeCompare(right.name)
        )
      : filteredSessions;
  }, [sessionQuery, sessionSort, sessions]);

  async function loadSessions() {
    const projectId = await getActiveProjectId();
    const sessionId = await getActiveSessionId();

    setActiveProjectId(projectId);
    setCurrentActiveSessionId(sessionId);

    if (!projectId) {
      setSessions([]);
      setSignalChains([]);
      return;
    }

    const loadedSessions = await getSessionsForProject(projectId);
    setSessions(loadedSessions);
    setSignalChains(await getSignalChains());
  }

  function isRigSetupComplete(chain: SignalChain) {
    const signature = buildRoutingSteps(chain.blocks).map(routingStepKey).join("|");
    return Boolean(signature) && localStorage.getItem(`fretforge.signalChainSetupConfirmed.${chain.id}`) === signature;
  }

  function snapshotName(session: Session) {
    try {
      return session.rig_snapshot_json ? (JSON.parse(session.rig_snapshot_json) as { name?: string }).name : undefined;
    } catch {
      return undefined;
    }
  }

  async function handleAssignRig(sessionId: number, chainId: number | null) {
    const chain = signalChains.find((item) => item.id === chainId) ?? null;
    await sessionAction.run(async () => {
      await assignSignalChainToSession(sessionId, chain);
      await loadSessions();
      await onWorkstationStatusRefresh();
    }, "The active rig could not be saved to this session.");
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

  async function handleNewSession() {
    if (!activeProjectId) {
      window.alert("No active project selected.");
      return;
    }

    await sessionAction.run(async () => {
      const newSession = await createSession(activeProjectId);

      if (newSession) {
        await setActiveSession(newSession.id);
      }

      await loadSessions();
      await onWorkstationStatusRefresh();
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
      const activeSessionId = await getActiveSessionId();

      if (activeSessionId === sessionId) {
        await switchToFallbackSessionBeforeDelete(activeProjectId, sessionId);
      }

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
      className={`flex h-[420px] flex-col rounded-2xl border p-5 shadow-lg sm:p-6 ${
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
            onClick={handleNewSession}
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
          {visibleSessions.length === sessions.length
            ? sessions.length
            : `${visibleSessions.length} of ${sessions.length}`} saved session
          {sessions.length === 1 ? "" : "s"} for the active project.
        </p>

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <input
            type="search"
            value={sessionQuery}
            onChange={(event) => setSessionQuery(event.target.value)}
            placeholder="Search sessions"
            aria-label="Search sessions"
            disabled={!activeProjectId}
            className={`min-w-0 rounded-lg border px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-50 ${
              theme === "dark"
                ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-900"
            }`}
          />
          <select
            value={sessionSort}
            onChange={(event) =>
              setSessionSort(event.target.value as "recent" | "name")
            }
            aria-label="Sort sessions"
            disabled={!activeProjectId}
            className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-50 ${
              theme === "dark"
                ? "border-zinc-700 bg-zinc-950 text-zinc-100"
                : "border-zinc-300 bg-white text-zinc-900"
            }`}
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
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
                ? "No sessions found. Create a session to begin tracking recording, practice, and workflow progress."
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
              className={`max-w-full overflow-hidden cursor-pointer rounded-xl border px-4 py-3 text-sm transition-all duration-200 ${
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

                  <div className="mt-3 rounded-lg border border-zinc-700/60 p-3" onClick={(event) => event.stopPropagation()}>
                    <div className="flex items-center justify-between gap-2"><label className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500" htmlFor={`session-rig-${session.id}`}>Active Rig</label>{session.signal_chain_id && <span className={`text-[10px] ${signalChains.find((chain) => chain.id === session.signal_chain_id && isRigSetupComplete(chain)) ? "text-emerald-400" : "text-amber-400"}`}>{signalChains.find((chain) => chain.id === session.signal_chain_id && isRigSetupComplete(chain)) ? "Setup ready" : "Setup needs review"}</span>}</div>
                    <select id={`session-rig-${session.id}`} value={session.signal_chain_id ?? ""} onChange={(event) => handleAssignRig(session.id, event.target.value ? Number(event.target.value) : null)} className={`mt-2 w-full rounded-md border px-2 py-1.5 text-xs outline-none ${theme === "dark" ? "border-zinc-700 bg-zinc-950 text-zinc-100" : "border-zinc-300 bg-white text-zinc-900"}`}><option value="">No rig selected</option>{signalChains.map((chain) => <option key={chain.id} value={chain.id}>{chain.name}{isRigSetupComplete(chain) ? " · Ready" : " · Needs setup"}</option>)}</select>
                    {session.rig_snapshot_json && <p className="mt-2 text-[10px] text-zinc-500">Session snapshot: {snapshotName(session) ?? "Saved rig"}</p>}
                  </div>

                  <div className="mt-3">
                    {editingNotesSessionId === session.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={notesValue}
                          maxLength={250}
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
                        className={`max-w-full overflow-hidden rounded-md border px-3 py-2 text-xs leading-relaxed break-words ${
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
                      handleCompleteSession(session);
                    }}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
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
    </div>
  );
}

export default SessionPanel;
