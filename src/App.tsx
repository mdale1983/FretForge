import { useEffect, useState } from "react";
import {
  getCurrentWindow,
  LogicalPosition,
  LogicalSize,
} from "@tauri-apps/api/window";
import {
  getActiveSessionId,
  setSessionWorkspace,
  saveWorkspaceState,
  loadWorkspaceState,
  getSessionCountForProject,
  getSessionById,
} from "./services/SessionService";
import ForgeStatusBar from "./components/ForgeStatusBar";
import LeftRail from "./components/LeftRail";
import Workspace from "./components/Workspace";
import RightRail from "./components/RightRail";
import {
  getActiveProjectId,
  getProjectById,
} from "./services/projectService";
import { useWorkstationTelemetry } from "./hooks/useWorkstationTelemetry";

function App() {
  // Persistent UI preferences
  const [activeModule, setActiveModule] = useState(
    localStorage.getItem("fretforge.activeModule") ?? "forge"
  );

  const [leftPinned, setLeftPinned] = useState(
    localStorage.getItem("fretforge.leftPinned") === "true"
  );

  const [rightPinned, setRightPinned] = useState(
    localStorage.getItem("fretforge.rightPinned") === "true"
  );

  const [theme, setTheme] = useState(
    localStorage.getItem("fretforge.theme") ?? "dark"
  );

  const [sessionCount, setSessionCount] = useState(0);

  // Live workstation telemetry and audio-device selection
  const {
    workstationStatus,
    setWorkstationStatus,
    audioDevices,
    selectedAudioDevice,
    setSelectedAudioDevice,
  } = useWorkstationTelemetry();

  // Workspace persistence
  async function saveCurrentWorkspaceState() {
    const sessionId = await getActiveSessionId();
    const appWindow = getCurrentWindow();
    const isMaximized = await appWindow.isMaximized();
    const windowPosition = await appWindow.outerPosition();
    const windowSize = await appWindow.innerSize();

    if (!sessionId) return;

    await saveWorkspaceState({
      activeProjectId: null,
      activeSessionId: sessionId,
      activeModule,
      leftRailPinned: leftPinned,
      rightRailPinned: rightPinned,
      windowWidth: windowSize.width,
      windowHeight: windowSize.height,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowX: windowPosition.x,
      windowY: windowPosition.y,
      isMaximized,
      restoredWindowWidth: isMaximized ? 1400 : windowSize.width,
      restoredWindowHeight: isMaximized ? 950 : windowSize.height,
      lastMonitorLabel: `${window.screen.width}x${window.screen.height}`,
      restoredAt: new Date().toISOString(),
    });
  }

  async function refreshWorkstationStatus() {
    const activeProjectId = await getActiveProjectId();
    const activeSessionId = await getActiveSessionId();

    const activeProject = activeProjectId
      ? await getProjectById(activeProjectId)
      : null;

    const activeSession = activeSessionId
      ? await getSessionById(activeSessionId)
      : null;

    setWorkstationStatus((previousStatus) => ({
      ...previousStatus,
      activeProject: activeProject
        ? activeProject.name
        : "No project selected",
      activeSession: activeSession
        ? activeSession.name
        : "No active session",
    }));
  }

  // Restore the last session, workspace, and window placement on startup
  useEffect(() => {
    async function restoreWorkspace() {
      const workspaceState = await loadWorkspaceState();

      if (!workspaceState) return;

      if (workspaceState.activeModule) {
        setActiveModule(workspaceState.activeModule);
      }

      if (typeof workspaceState.leftRailPinned === "boolean") {
        setLeftPinned(workspaceState.leftRailPinned);
      }

      if (typeof workspaceState.rightRailPinned === "boolean") {
        setRightPinned(workspaceState.rightRailPinned);
      }

      const appWindow = getCurrentWindow();

      if (
        workspaceState.windowWidth &&
        workspaceState.windowHeight &&
        typeof workspaceState.windowX === "number" &&
        typeof workspaceState.windowY === "number"
      ) {
        await appWindow.setSize(
          new LogicalSize(
            workspaceState.isMaximized
              ? workspaceState.restoredWindowWidth ?? 1400
              : workspaceState.windowWidth,
            workspaceState.isMaximized
              ? workspaceState.restoredWindowHeight ?? 950
              : workspaceState.windowHeight
          )
        );

        await appWindow.setPosition(
          new LogicalPosition(
            workspaceState.windowX,
            workspaceState.windowY
          )
        );

        if (workspaceState.isMaximized) {
          await appWindow.maximize();
        }
      }

      const activeProjectId = await getActiveProjectId();

      if (activeProjectId) {
        const count = await getSessionCountForProject(activeProjectId);
        setSessionCount(count);
      }

      await refreshWorkstationStatus();

      if (workspaceState.activeSessionId) {
        console.log(
          "Restored workspace session:",
          workspaceState.activeSessionId,
          "module:",
          workspaceState.activeModule,
          "window:",
          workspaceState.windowWidth,
          "x",
          workspaceState.windowHeight,
          "screen:",
          workspaceState.screenWidth,
          "x",
          workspaceState.screenHeight,
          "position:",
          workspaceState.windowX,
          workspaceState.windowY,
          "maximized:",
          workspaceState.isMaximized,
          "monitor:",
          workspaceState.lastMonitorLabel
        );
      }
    }

    restoreWorkspace();
  }, []);

  useEffect(() => {
    localStorage.setItem("fretforge.activeModule", activeModule);
  }, [activeModule]);

  useEffect(() => {
    async function persistWorkspace() {
      const sessionId = await getActiveSessionId();

      if (!sessionId) return;

      await setSessionWorkspace(sessionId, activeModule);
      await saveCurrentWorkspaceState();
    }

    persistWorkspace();
  }, [activeModule, leftPinned, rightPinned]);

  // Persist window changes after a short debounce
  useEffect(() => {
    let timeoutId: number | null = null;

    const handleWindowChange = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        saveCurrentWorkspaceState();
      }, 300);
    };

    window.addEventListener("resize", handleWindowChange);
    window.addEventListener("move", handleWindowChange);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      window.removeEventListener("resize", handleWindowChange);
      window.removeEventListener("move", handleWindowChange);
    };
  }, [activeModule, leftPinned, rightPinned]);

  useEffect(() => {
    localStorage.setItem("fretforge.theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("fretforge.leftPinned", String(leftPinned));
  }, [leftPinned]);

  useEffect(() => {
    localStorage.setItem("fretforge.rightPinned", String(rightPinned));
  }, [rightPinned]);

  // Application shell
  return (
    <div
      className={`flex h-screen w-screen flex-col overflow-hidden ${
        theme === "dark"
          ? "bg-zinc-950 text-zinc-100"
          : "bg-zinc-100 text-zinc-900"
      }`}
    >
      <ForgeStatusBar
        version="v0.6.4 — Workstation Dashboard"
        theme={theme}
        setTheme={setTheme}
        workstationStatus={workstationStatus}
        audioDevices={audioDevices}
        selectedAudioDevice={selectedAudioDevice}
        setSelectedAudioDevice={setSelectedAudioDevice}
      />

      <div className="flex flex-1 min-h-0">
        <LeftRail
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          leftPinned={leftPinned}
          setLeftPinned={setLeftPinned}
          theme={theme}
        />

        <Workspace
          activeModule={activeModule}
          theme={theme}
          onWorkstationStatusRefresh={refreshWorkstationStatus}
        />

        <RightRail
          activeModule={activeModule}
          theme={theme}
          rightPinned={rightPinned}
          setRightPinned={setRightPinned}
          sessionCount={sessionCount}
          activeProject={workstationStatus.activeProject}
          activeSession={workstationStatus.activeSession}
          storageState={workstationStatus.storageState}
          recoveryState={workstationStatus.recoveryState}
          logState={workstationStatus.logState}
        />
      </div>
    </div>
  );
}

export default App;
