import { useEffect, useState } from "react";
import { getCurrentWindow, LogicalPosition, LogicalSize } from "@tauri-apps/api/window";
import { 
  getActiveSessionId, 
  setSessionWorkspace,
  saveWorkspaceState,
  loadWorkspaceState,
} from "./services/SessionService";
import ForgeStatusBar from "./components/ForgeStatusBar";
import LeftRail from "./components/LeftRail";
import Workspace from "./components/Workspace";
import RightRail from "./components/RightRail";


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
            workspaceState.windowWidth,
            workspaceState.windowHeight
          )
        );

        await appWindow.setPosition(
          new LogicalPosition(
            workspaceState.windowX,
            workspaceState.windowY
          )
        );
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
        workspaceState.isMaximized
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

    await setSessionWorkspace(
      sessionId,
      activeModule
    );

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
      isMaximized: false,
      restoredAt: new Date().toISOString(),
    });
  }

  persistWorkspace();
}, [activeModule, leftPinned]);
  useEffect(() => {
    localStorage.setItem("fretforge.theme", theme);
  }, [theme]);
useEffect(() => {
  localStorage.setItem(
    "fretforge.leftPinned",
    String(leftPinned)
  );
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
        
       <Workspace
          activeModule={activeModule}
          theme={theme}
        />
      
      <RightRail
        activeModule={activeModule}
        theme={theme}
      />
        
      </div>
    </div>
  );
}

export default App;