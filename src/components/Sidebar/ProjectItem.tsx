import { useState, useRef, useEffect } from "react";
import { useAppState } from "../../context/AppContext";
import { usePty } from "../../hooks/usePty";
import type { Project } from "../../types";
import SessionItem from "./SessionItem";

interface ProjectItemProps {
  project: Project;
}

export default function ProjectItem({ project }: ProjectItemProps) {
  const { state, dispatch } = useAppState();
  const { createSession } = usePty();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  const commitRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== project.name) dispatch({ type: "RENAME_PROJECT", projectId: project.id, name: trimmed });
    setEditing(false);
  };

  const handleAddSession = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const sessionId = crypto.randomUUID();
    dispatch({ type: "ADD_SESSION", projectId: project.id, session: { id: sessionId, name: `session ${project.sessions.length + 1}`, createdAt: new Date().toISOString() } });
    await createSession(sessionId, project.path);
    dispatch({ type: "SET_ACTIVE_SESSION", sessionId });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: "REMOVE_PROJECT", projectId: project.id });
  };

  return (
    <div>
      {/* Folder header — padded from sidebar edge */}
      <div
        className="group flex h-[28px] cursor-pointer select-none items-center pl-[16px] pr-[12px] hover:bg-[var(--bg-hover)]"
        onClick={() => dispatch({ type: "TOGGLE_PROJECT", projectId: project.id })}
      >
        {/* Twistie chevron */}
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="currentColor"
          className={`mr-[4px] shrink-0 text-[var(--text-dim)] transition-transform duration-100 ${project.collapsed ? "" : "rotate-90"}`}
        >
          <path d="M6 4v8l4-4-4-4z"/>
        </svg>

        {/* Folder name — bold uppercase */}
        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditing(false); }}
            className="h-[20px] min-w-0 flex-1 rounded-[2px] border border-[var(--border-focus)] bg-[var(--bg-input)] px-1 text-[11px] font-bold uppercase text-[var(--text)] outline-none"
          />
        ) : (
          <span
            className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.5px] text-[var(--text-dim)]"
            onDoubleClick={(e) => { e.stopPropagation(); setEditName(project.name); setEditing(true); }}
          >
            {project.name}
          </span>
        )}

        {/* Hover actions */}
        <div className="flex shrink-0 items-center gap-[2px] opacity-0 group-hover:opacity-100">
          <button onClick={handleAddSession} title="New terminal"
            className="flex h-[20px] w-[20px] items-center justify-center rounded-[3px] text-[var(--text-ghost)] hover:text-[var(--text)]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14 7H8V1H7v6H1v1h6v6h1V8h6V7z"/></svg>
          </button>
          <button onClick={handleRemove} title="Remove folder"
            className="flex h-[20px] w-[20px] items-center justify-center rounded-[3px] text-[var(--text-ghost)] hover:text-[var(--text)]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8.707l3.646 3.647.708-.708L8.707 8l3.647-3.646-.708-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z"/></svg>
          </button>
        </div>
      </div>

      {/* Sessions — significantly more indented than folder */}
      {!project.collapsed && (
        <div className="pb-[2px]">
          {project.sessions.length === 0 && (
            <div className="h-[22px] flex items-center pl-[44px] pr-[12px] text-[12px] italic text-[var(--text-ghost)]">
              No sessions
            </div>
          )}
          {project.sessions.map((session) => (
            <SessionItem
              key={session.id}
              projectId={project.id}
              sessionId={session.id}
              name={session.name}
              isActive={session.id === state.activeSessionId}
              color={project.color}
            />
          ))}
        </div>
      )}
    </div>
  );
}
