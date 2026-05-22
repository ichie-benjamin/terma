import { useCallback, useRef } from "react";
import { AppProvider } from "./context/AppContext";
import Sidebar from "./components/Sidebar/Sidebar";
import TerminalPanel from "./components/Terminal/TerminalPanel";
import StatusBar from "./components/StatusBar";
import QuickSwitch from "./components/QuickSwitch";
import { useConfig } from "./hooks/useConfig";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useFileDrop } from "./hooks/useFileDrop";
import { useAppState } from "./context/AppContext";

const MIN_SIDEBAR_WIDTH = 160;
const MAX_SIDEBAR_WIDTH = 400;

function SidebarWithResize() {
  const { state, dispatch } = useAppState();
  const dragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (ev: MouseEvent) => {
        const width = Math.min(
          MAX_SIDEBAR_WIDTH,
          Math.max(MIN_SIDEBAR_WIDTH, ev.clientX),
        );
        dispatch({ type: "SET_SIDEBAR_WIDTH", width });
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [dispatch],
  );

  return (
    <div className="relative shrink-0" style={{ width: state.sidebarWidth }}>
      <Sidebar />
      {/* Resize handle — overlays the right edge */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 bottom-0 right-0 w-[5px] cursor-col-resize z-10 hover:bg-[var(--accent)] hover:opacity-40"
      />
    </div>
  );
}

function AppLayout() {
  const { state } = useAppState();

  useConfig();
  useKeyboardShortcuts();
  useFileDrop(state.activeSessionId);

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="flex flex-1 overflow-hidden">
        {state.sidebarVisible && <SidebarWithResize />}
        <TerminalPanel />
      </div>
      <StatusBar />
      <QuickSwitch />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

export default App;
