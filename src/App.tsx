import { useEffect, useState } from "react";
import { getActiveSessionId, setSessionWorkspace } from "./services/SessionService";
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
        version="Prototype 0.6.3 — Session Restoration"
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