import { useEffect, useState } from "react";
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

    if (workspaceState.activeSessionId) {
      console.log(
        "Restored workspace session:",
        workspaceState.activeSessionId
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
      activeSessionId: sessionId.toString(),
      activeModule,
      restoredAt: new Date().toISOString(),
    });
  }

  persistWorkspace();
}, [activeModule]);
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