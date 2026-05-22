import { useAppState } from "../context/AppContext";
import { useUpdater } from "../hooks/useUpdater";

export default function StatusBar() {
  const { state } = useAppState();
  const { available, version, downloading, progress, installUpdate } = useUpdater();

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
      <div className="flex items-center gap-[8px]">
        {available && (
          <button
            className="flex items-center gap-[4px] text-[var(--accent)] hover:underline"
            onClick={installUpdate}
            disabled={downloading}
          >
            {downloading ? (
              <span>Updating… {Math.round(progress)}%</span>
            ) : (
              <span>Update v{version}</span>
            )}
          </button>
        )}
        {totalSessions > 0 && (
          <span className="text-[var(--text-dim)]">
            {totalSessions} session{totalSessions !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
