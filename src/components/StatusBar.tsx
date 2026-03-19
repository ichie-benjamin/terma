import { useAppState } from "../context/AppContext";

export default function StatusBar() {
  const { state } = useAppState();

  const activeItem = state.projects
    .flatMap((p) => p.sessions.map((s) => ({ project: p, session: s })))
    .find((item) => item.session.id === state.activeSessionId);

  const totalSessions = state.projects.reduce((sum, p) => sum + p.sessions.length, 0);

  return (
    <div className="flex h-[22px] shrink-0 items-center justify-between border-t border-[var(--border)] bg-[var(--bg-sidebar)] px-[10px] text-[11px]">
      <div className="flex items-center gap-[6px]">
        {activeItem && (
          <div
            className="h-[6px] w-[6px] rounded-full"
            style={{ backgroundColor: activeItem.project.color || "var(--accent)" }}
          />
        )}
        {activeItem ? (
          <span className="text-[var(--text)]">
            {activeItem.project.name} &middot; {activeItem.session.name}
          </span>
        ) : (
          <span className="text-[var(--text-dim)]">Terma</span>
        )}
      </div>
      {totalSessions > 0 && (
        <span className="text-[var(--text-dim)]">
          {totalSessions} session{totalSessions !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
