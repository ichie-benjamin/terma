import { useAppState } from "../../context/AppContext";
import { usePty } from "../../hooks/usePty";

export default function TerminalHeader() {
  const { state, dispatch } = useAppState();
  const { closeSession } = usePty();

  const activeSession = state.projects
    .flatMap((p) => p.sessions.map((s) => ({ project: p, session: s })))
    .find((item) => item.session.id === state.activeSessionId);

  if (!activeSession) return null;

  const handleClose = async () => {
    const { project, session } = activeSession;
    await closeSession(session.id);
    dispatch({ type: "REMOVE_SESSION", projectId: project.id, sessionId: session.id });
  };

  return (
    <div className="flex h-[36px] shrink-0 items-center justify-between bg-[var(--bg-sidebar)] px-[16px]" data-tauri-drag-region>
      <div className="flex items-center gap-[6px] text-[12px]">
        <span className="text-[var(--text-ghost)]">{activeSession.project.name}</span>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-[var(--text-ghost)]">
          <path d="M6 4v8l4-4-4-4z"/>
        </svg>
        <span className="text-[var(--text)]">{activeSession.session.name}</span>
      </div>
      <button
        onClick={handleClose}
        className="flex h-[22px] w-[22px] items-center justify-center rounded-[3px] text-[var(--text-ghost)] hover:text-[var(--text)] hover:bg-[var(--bg-hover)]"
        title="Close"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8.707l3.646 3.647.708-.708L8.707 8l3.647-3.646-.708-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z"/></svg>
      </button>
    </div>
  );
}
