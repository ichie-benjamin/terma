import { useEffect } from "react";
import { useAppState } from "../context/AppContext";
import { usePty } from "./usePty";

export function useKeyboardShortcuts() {
  const { state, dispatch } = useAppState();
  const { createSession, closeSession } = usePty();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      // Build flat list of all sessions with project info
      const allSessions = state.projects.flatMap((p) =>
        p.sessions.map((s) => ({ projectId: p.id, projectPath: p.path, session: s })),
      );

      const activeIndex = allSessions.findIndex(
        (item) => item.session.id === state.activeSessionId,
      );
      const activeProjectId = activeIndex >= 0 ? allSessions[activeIndex].projectId : null;

      // Cmd+B — Toggle sidebar
      if (e.key === "b" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "TOGGLE_SIDEBAR" });
        return;
      }

      // Cmd+P — Quick switch
      if (e.key === "p" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "SET_QUICK_SWITCH", open: !state.quickSwitchOpen });
        return;
      }

      // Cmd+N — New session in active project
      if (e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        if (!activeProjectId) return;
        const project = state.projects.find((p) => p.id === activeProjectId);
        if (!project) return;

        const sessionId = crypto.randomUUID();
        const session = {
          id: sessionId,
          name: `Session ${project.sessions.length + 1}`,
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: "ADD_SESSION", projectId: activeProjectId, session });
        createSession(sessionId, project.path).then(() => {
          dispatch({ type: "SET_ACTIVE_SESSION", sessionId });
        });
        return;
      }

      // Cmd+W — Close active session
      if (e.key === "w" && !e.shiftKey) {
        e.preventDefault();
        if (!state.activeSessionId || !activeProjectId) return;
        closeSession(state.activeSessionId).then(() => {
          dispatch({
            type: "REMOVE_SESSION",
            projectId: activeProjectId,
            sessionId: state.activeSessionId!,
          });
        });
        return;
      }

      // Cmd+↑ / Cmd+↓ — Previous/next session
      if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !e.shiftKey) {
        e.preventDefault();
        if (allSessions.length === 0) return;
        let newIndex: number;
        if (activeIndex < 0) {
          newIndex = 0;
        } else if (e.key === "ArrowUp") {
          newIndex = (activeIndex - 1 + allSessions.length) % allSessions.length;
        } else {
          newIndex = (activeIndex + 1) % allSessions.length;
        }
        dispatch({
          type: "SET_ACTIVE_SESSION",
          sessionId: allSessions[newIndex].session.id,
        });
        return;
      }

      // Cmd+Shift+↑/↓ — Previous/next project (select first session)
      if ((e.key === "ArrowUp" || e.key === "ArrowDown") && e.shiftKey) {
        e.preventDefault();
        if (state.projects.length === 0) return;
        const currentProjectIndex = state.projects.findIndex((p) => p.id === activeProjectId);
        let newProjectIndex: number;
        if (currentProjectIndex < 0) {
          newProjectIndex = 0;
        } else if (e.key === "ArrowUp") {
          newProjectIndex =
            (currentProjectIndex - 1 + state.projects.length) % state.projects.length;
        } else {
          newProjectIndex = (currentProjectIndex + 1) % state.projects.length;
        }
        const newProject = state.projects[newProjectIndex];
        if (newProject.sessions.length > 0) {
          dispatch({
            type: "SET_ACTIVE_SESSION",
            sessionId: newProject.sessions[0].id,
          });
        }
        return;
      }

      // Cmd+1-9 — Switch to session N in active project
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        if (!activeProjectId) return;
        const project = state.projects.find((p) => p.id === activeProjectId);
        if (!project) return;
        const session = project.sessions[num - 1];
        if (session) {
          dispatch({ type: "SET_ACTIVE_SESSION", sessionId: session.id });
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, dispatch, createSession, closeSession]);
}
