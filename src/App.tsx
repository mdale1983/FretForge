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
  deleteSession,
  switchToFallbackSessionBeforeDelete,
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
import { defaultWorkstationStatus } from "./data/defaultWorkstationStatus";
import {
  AudioDeviceInfo,
  getWorkstationTelemetry,
  listAudioOutputDevices,
} from "./services/workstationTelemetryService";

function App() {
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

  const [workstationStatus, setWorkstationStatus] = useState(
    defaultWorkstationStatus
  );

  const [audioDevices, setAudioDevices] = useState<AudioDeviceInfo[]>([]);

  const [selectedAudioDevice, setSelectedAudioDevice] = useState(
    localStorage.getItem("fretforge.selectedAudioDevice") ?? ""
  );

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

  async function refreshSystemTelemetry() {
    try {
     const telemetry = await getWorkstationTelemetry();
     const detectedAudioDevices = await listAudioOutputDevices();

     setAudioDevices(detectedAudioDevices);
     const preferredAudioDevice =
      detectedAudioDevices.find(
        (device) => device.name === selectedAudioDevice
      ) ?? detectedAudioDevices.find((device) => device.is_default_output);

     console.log("Detected audio output devices:", audioDevices);

      setWorkstationStatus((previousStatus) => ({
        ...previousStatus,
        cpu: `CPU ${telemetry.cpu_usage.toFixed(0)}%`,
        ram: `RAM ${(telemetry.ram_used_mb / 1024).toFixed(1)} / ${(telemetry.ram_total_mb / 1024).toFixed(1)} GB`,
        gpu: telemetry.gpu_name,
        audioDevice: preferredAudioDevice?.name ?? telemetry.audio_device,
        sampleRate: preferredAudioDevice?.sample_rate ?? telemetry.sample_rate,
        bufferSize: telemetry.buffer_size,
        latency: telemetry.latency,
      }));
    } catch (error) {
      console.error("Telemetry refresh failed:", error);
    }
  }

  useEffect(() => {
    refreshSystemTelemetry();

    const telemetryInterval = window.setInterval(() => {
      refreshSystemTelemetry();
    }, 5000);

    return () => {
      window.clearInterval(telemetryInterval);
    };
  }, []);

  async function handleDeleteSession() {
    const sessionId = await getActiveSessionId();
    const projectId = await getActiveProjectId();

    if (!sessionId) return;
    if (!projectId) return;

    const confirmed = window.confirm(
      "Delete this session? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      await switchToFallbackSessionBeforeDelete(projectId, sessionId);
      await deleteSession(sessionId);
      const updatedSessionCount =
        await getSessionCountForProject(projectId);

      setSessionCount(updatedSessionCount);
      await saveCurrentWorkspaceState();
      await refreshWorkstationStatus();

      window.dispatchEvent(new Event("fretforge:sessions-changed"));

      window.alert("Session deleted. FretForge switched to a fallback session.");
    } catch (error) {
      console.warn("Session delete failed:", error);
      window.alert("Could not delete session safely.");
    }
  }

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
    localStorage.setItem(
      "fretforge.selectedAudioDevice",
      selectedAudioDevice
    );
  }, [selectedAudioDevice]);

  useEffect(() => {
    async function persistWorkspace() {
      const sessionId = await getActiveSessionId();

      if (!sessionId) return;

      await setSessionWorkspace(sessionId, activeModule);
      await saveCurrentWorkspaceState();
    }

    persistWorkspace();
  }, [activeModule, leftPinned]);

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
  }, [activeModule, leftPinned]);

  useEffect(() => {
    localStorage.setItem("fretforge.theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("fretforge.leftPinned", String(leftPinned));
  }, [leftPinned]);

  useEffect(() => {
    localStorage.setItem("fretforge.rightPinned", String(rightPinned));
  }, [rightPinned]);

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