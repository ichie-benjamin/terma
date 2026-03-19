import { useState, useEffect, useRef, useMemo } from "react";
import { useAppState } from "../context/AppContext";

export default function QuickSwitch() {
  const { state, dispatch } = useAppState();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() =>
    state.projects.flatMap((p) =>
      p.sessions.map((s) => ({ sessionId: s.id, label: `${p.name} / ${s.name}` })),
    ), [state.projects]);

  const filtered = useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => { inputRef.current?.focus(); setQuery(""); setSelectedIndex(0); }, [state.quickSwitchOpen]);
  useEffect(() => { setSelectedIndex(0); }, [query]);

  if (!state.quickSwitchOpen) return null;

  const close = () => dispatch({ type: "SET_QUICK_SWITCH", open: false });
  const select = (id: string) => { dispatch({ type: "SET_ACTIVE_SESSION", sessionId: id }); close(); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[selectedIndex]) select(filtered[selectedIndex].sessionId); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20%]" onClick={close}>
      <div className="w-[500px] overflow-hidden rounded-[6px] border border-[var(--border-input)] bg-[var(--bg-sidebar)] shadow-[0_8px_30px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type to search sessions..."
          className="h-[32px] w-full border-b border-[var(--border)] bg-[var(--bg-input)] px-3 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-ghost)]"
        />
        <div className="max-h-[280px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[13px] text-[var(--text-ghost)]">No matches</div>
          ) : filtered.map((item, i) => (
            <button
              key={item.sessionId} onClick={() => select(item.sessionId)}
              className={`flex h-[22px] w-full items-center px-3 text-left text-[13px] ${
                i === selectedIndex ? "bg-[var(--bg-selected)] text-[var(--text-active)]" : "text-[var(--text)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
