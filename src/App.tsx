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
} from "./services/SessionService";
import ForgeStatusBar from "./components/ForgeStatusBar";
import LeftRail from "./components/LeftRail";
import Workspace from "./components/Workspace";
import RightRail from "./components/RightRail";
import { getActiveProjectId } from "./services/ProjectService";

function App() {
  const [activeModule, setActiveModule] = useState(
    localStorage.getItem("fretforge.activeModule") ?? "forge"
  );

  const [leftPinned, setLeftPinned] = useState(
    localStorage.getItem("fretforge.leftPinned") === "true"
  );

  const [theme, setTheme] = useState(
    localStorage.getItem("fretforge.theme") ?? "dark"
  );

  async function saveCurrentWorkspaceState() {
    const sessionId = await getActiveSessionId();
    const appWindow = getCurrentWindow();
    const isMaximized = await appWindow.isMaximized();

    if (!sessionId) return;

    await saveWorkspaceState({
      activeProjectId: null,
      activeSessionId: sessionId,
      activeModule,
      leftRailPinned: leftPinned,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowX: window.screenX,
      windowY: window.screenY,
      isMaximized,
      restoredWindowWidth: isMaximized ? 1400 : window.innerWidth,
      restoredWindowHeight: isMaximized ? 950 : window.innerHeight,
      lastMonitorLabel: `${window.screen.width}x${window.screen.height}`,
      restoredAt: new Date().toISOString(),
    });
  }

  async function handleDeleteSession() {
    const sessionId = await getActiveSessionId();

    if (!sessionId) return;

    const confirmed = window.confirm(
      "Delete this session? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      await deleteSession(sessionId);
    } catch (error) {
      console.warn("Session delete blocked:", error);
      window.alert("Cannot delete the active session yet.");
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

  return (
    <div
      className={`h-screen w-screen overflow-hidden ${
        theme === "dark"
          ? "bg-zinc-950 text-zinc-100"
          : "bg-zinc-100 text-zinc-900"
      }`}
    >
      <ForgeStatusBar
        version="v0.6.3 — Session Workspace Restoration"
        theme={theme}
        setTheme={setTheme}
      />

      <div className="flex h-[calc(100vh-3rem)]">
        <LeftRail
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          leftPinned={leftPinned}
          setLeftPinned={setLeftPinned}
          theme={theme}
        />

        <Workspace activeModule={activeModule} theme={theme} />

        <RightRail
          activeModule={activeModule}
          theme={theme}
          onDeleteSession={handleDeleteSession}
        />
      </div>
    </div>
  );
}

export default App;