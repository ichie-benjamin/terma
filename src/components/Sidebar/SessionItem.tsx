import { useState, useRef, useEffect } from "react";
import { useAppState } from "../../context/AppContext";
import { usePty } from "../../hooks/usePty";

interface SessionItemProps {
  projectId: string;
  sessionId: string;
  name: string;
  isActive: boolean;
  color?: string;
}

export default function SessionItem({ projectId, sessionId, name, isActive, color }: SessionItemProps) {
  const { dispatch } = useAppState();
  const { closeSession } = usePty();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== name) dispatch({ type: "RENAME_SESSION", projectId, sessionId, name: trimmed });
    setEditing(false);
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await closeSession(sessionId);
    dispatch({ type: "REMOVE_SESSION", projectId, sessionId });
  };

  if (editing) {
    return (
      <div className="flex h-[22px] items-center pl-[44px] pr-[12px]">
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(false); }}
          className="h-[18px] w-full rounded-[2px] border border-[var(--border-focus)] bg-[var(--bg-input)] px-1 text-[12px] text-[var(--text)] outline-none"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => dispatch({ type: "SET_ACTIVE_SESSION", sessionId })}
      onDoubleClick={() => { setEditName(name); setEditing(true); }}
      onContextMenu={(e) => { e.preventDefault(); setEditName(name); setEditing(true); }}
      className={`group flex h-[22px] cursor-pointer select-none items-center pl-[44px] pr-[12px] ${
        isActive
          ? "bg-[var(--bg-selected)] text-[var(--text-active)]"
          : "text-[var(--text-faint)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
      }`}
    >
      {/* Terminal prompt icon */}
      <svg
        width="14" height="14" viewBox="0 0 16 16" fill="currentColor"
        className="mr-[6px] shrink-0"
        style={{ color: isActive ? (color || "var(--text-active)") : "var(--text-ghost)" }}
      >
        <path d="M2 3.5l4.5 4.5L2 12.5l1 1 5.5-5.5L3 3l-1 .5zM8 13h6v-1H8v1z"/>
      </svg>

      {/* Session name — lowercase */}
      <span className="min-w-0 flex-1 truncate text-[12px]">{name}</span>

      {/* Hover actions */}
      <div className="flex shrink-0 items-center gap-[2px] opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); setEditName(name); setEditing(true); }}
          title="Rename"
          className="flex h-[18px] w-[18px] items-center justify-center rounded-[3px] text-[var(--text-ghost)] hover:text-[var(--text)]"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3 1.45 1.45-2.96 1.55zm3.83-2.06L4.47 9.76l6-6 1.77 1.77-6 6z"/></svg>
        </button>
        <button
          onClick={handleClose}
          title="Close"
          className="flex h-[18px] w-[18px] items-center justify-center rounded-[3px] text-[var(--text-ghost)] hover:text-[var(--text)]"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8.707l3.646 3.647.708-.708L8.707 8l3.647-3.646-.708-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z"/></svg>
        </button>
      </div>
    </div>
  );
}
