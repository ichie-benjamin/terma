import { useState, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppState } from "../../context/AppContext";
import ProjectItem from "./ProjectItem";

const PROJECT_COLORS = [
  "#519aba", "#89d185", "#cca700", "#f14c4c", "#c586c0",
  "#ce9178", "#4ec9b0", "#d16d9e", "#569cd6", "#e37933",
];

export default function Sidebar() {
  const { state, dispatch } = useAppState();
  const [filter, setFilter] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const filterRef = useRef<HTMLInputElement>(null);

  const handleAddProject = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (!selected) return;

    const path = selected as string;
    const name = path.split("/").pop() || path.split("\\").pop() || "Project";
    const projectId = crypto.randomUUID();
    const colorIndex = state.projects.length % PROJECT_COLORS.length;

    dispatch({
      type: "ADD_PROJECT",
      project: {
        id: projectId, name, path, sessions: [], collapsed: false,
        color: PROJECT_COLORS[colorIndex], createdAt: new Date().toISOString(),
      },
    });

    const sessionId = crypto.randomUUID();
    dispatch({ type: "ADD_SESSION", projectId, session: { id: sessionId, name: "session 1", createdAt: new Date().toISOString() } });
    // Switch instantly; the TerminalView spawns the PTY when it mounts.
    dispatch({ type: "SET_ACTIVE_SESSION", sessionId });
  };

  const toggleFilter = () => {
    const next = !filterVisible;
    setFilterVisible(next);
    if (!next) setFilter("");
    else setTimeout(() => filterRef.current?.focus(), 0);
  };

  const lowerFilter = filter.toLowerCase();
  const filteredProjects = filter
    ? state.projects
        .map((p) => ({ ...p, sessions: p.sessions.filter((s) => s.name.toLowerCase().includes(lowerFilter) || p.name.toLowerCase().includes(lowerFilter)) }))
        .filter((p) => p.name.toLowerCase().includes(lowerFilter) || p.sessions.length > 0)
    : state.projects;

  return (
    <div
      className="flex h-full w-full flex-col bg-[var(--bg-sidebar)]"
    >
      {/* Explorer header */}
      <div className="flex h-[35px] shrink-0 items-center justify-between pl-[20px] pr-[12px]" data-tauri-drag-region>
        <span className="select-none text-[11px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFilter}
            className={`flex h-[22px] w-[22px] items-center justify-center rounded-[3px] ${
              filterVisible ? "text-[var(--text)]" : "text-[var(--text-ghost)] hover:text-[var(--text)]"
            }`}
            title="Filter"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M15.25 13.836l-3.99-3.99a5.5 5.5 0 1 0-1.414 1.414l3.99 3.99a1 1 0 0 0 1.414-1.414zM2 6.5a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0z"/></svg>
          </button>
          <button
            onClick={handleAddProject}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-[3px] text-[var(--text-ghost)] hover:text-[var(--text)]"
            title="Add Folder"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 7H8V1H7v6H1v1h6v6h1V8h6V7z"/></svg>
          </button>
        </div>
      </div>

      {/* Filter */}
      {filterVisible && (
        <div className="px-[16px] pb-2">
          <input
            ref={filterRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") toggleFilter(); }}
            placeholder="Type to filter..."
            className="h-[24px] w-full rounded-[2px] border border-[var(--border-input)] bg-[var(--bg-input)] px-2 text-[12px] text-[var(--text)] outline-none placeholder:text-[var(--text-ghost)] focus:border-[var(--border-focus)]"
          />
        </div>
      )}

      {/* Tree content */}
      <div className="thin-scroll flex-1 overflow-y-auto pt-[4px]">
        {filteredProjects.length === 0 && state.projects.length === 0 && (
          <div className="px-[20px] pt-4">
            <p className="text-[13px] leading-[1.6] text-[var(--text-dim)]">
              No folders opened yet.
            </p>
            <button
              onClick={handleAddProject}
              className="mt-2 text-[13px] text-[var(--accent)] hover:underline"
            >
              Open a folder
            </button>
          </div>
        )}
        {filteredProjects.length === 0 && state.projects.length > 0 && (
          <p className="px-[20px] pt-4 text-[13px] text-[var(--text-dim)]">No results found.</p>
        )}
        {filteredProjects.map((project) => (
          <ProjectItem key={project.id} project={project} />
        ))}
      </div>

      {/* Bottom add folder */}
      <div className="shrink-0 border-t border-[var(--border)] p-2">
        <button
          onClick={handleAddProject}
          className="flex h-[26px] w-full items-center justify-center gap-[6px] rounded-[3px] text-[12px] text-[var(--text-dim)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14 7H8V1H7v6H1v1h6v6h1V8h6V7z"/></svg>
          Add Folder
        </button>
      </div>
    </div>
  );
}
