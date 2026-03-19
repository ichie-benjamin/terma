import { useAppState } from "../../context/AppContext";
import TerminalHeader from "./TerminalHeader";
import TerminalView from "./TerminalView";

export default function TerminalPanel() {
  const { state } = useAppState();

  const allSessions = state.projects.flatMap((p) =>
    p.sessions.map((s) => ({ projectId: p.id, session: s, cwd: p.path })),
  );

  if (allSessions.length === 0) {
    return (
      <div className="flex flex-1 flex-col bg-[var(--bg-sidebar)]">
        <div className="flex flex-1 items-center justify-center rounded-tl-[14px] bg-[var(--bg-editor)]">
          <div className="flex flex-col items-center gap-[20px]">
            {/* Logo / app name */}
            <div className="flex items-center gap-[10px]">
              <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--accent)]">
                <path d="M2 3.5l4.5 4.5L2 12.5l1 1 5.5-5.5L3 3l-1 .5zM8 13h6v-1H8v1z"/>
              </svg>
              <span className="text-[20px] font-light text-[var(--text)]">Terma</span>
            </div>

            <p className="text-[13px] text-[var(--text-ghost)]">Project-aware terminal multiplexer</p>

            {/* Shortcuts */}
            <div className="mt-[8px] flex flex-col gap-[8px] text-[12px]">
              <div className="flex items-center gap-[12px]">
                <kbd className="rounded-[3px] border border-[var(--border-input)] bg-[var(--bg-input)] px-[6px] py-[2px] text-[11px] text-[var(--text-dim)]">⌘ N</kbd>
                <span className="text-[var(--text-faint)]">New session</span>
              </div>
              <div className="flex items-center gap-[12px]">
                <kbd className="rounded-[3px] border border-[var(--border-input)] bg-[var(--bg-input)] px-[6px] py-[2px] text-[11px] text-[var(--text-dim)]">⌘ P</kbd>
                <span className="text-[var(--text-faint)]">Quick switch</span>
              </div>
              <div className="flex items-center gap-[12px]">
                <kbd className="rounded-[3px] border border-[var(--border-input)] bg-[var(--bg-input)] px-[6px] py-[2px] text-[11px] text-[var(--text-dim)]">⌘ B</kbd>
                <span className="text-[var(--text-faint)]">Toggle sidebar</span>
              </div>
              <div className="flex items-center gap-[12px]">
                <kbd className="rounded-[3px] border border-[var(--border-input)] bg-[var(--bg-input)] px-[6px] py-[2px] text-[11px] text-[var(--text-dim)]">⌘ ↑↓</kbd>
                <span className="text-[var(--text-faint)]">Switch sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg-sidebar)]">
      <TerminalHeader />
      <div className="relative flex-1 rounded-tl-[14px] overflow-hidden bg-[var(--bg-editor)]">
        {allSessions.map(({ session, cwd }) => (
          <TerminalView
            key={session.id}
            sessionId={session.id}
            cwd={cwd}
            isActive={session.id === state.activeSessionId}
          />
        ))}
      </div>
    </div>
  );
}
