import { useEffect, useRef, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppState } from "../context/AppContext";
import type { AppState } from "../types";

interface TermaConfig {
  version: number;
  projects: AppState["projects"];
  settings: AppState["settings"];
  window: {
    width: number;
    height: number;
    x: number;
    y: number;
    maximized: boolean;
  };
}

export function useConfig() {
  const { state, dispatch } = useAppState();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);

  // Load config on mount and re-create PTY sessions
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    invoke<TermaConfig>("load_config")
      .then(async (config) => {
        dispatch({
          type: "LOAD_STATE",
          state: {
            projects: config.projects,
            settings: config.settings,
            sidebarWidth: config.settings.sidebarWidth,
          },
        });

        // Re-create PTY sessions for all restored projects
        for (const project of config.projects) {
          for (const session of project.sessions) {
            try {
              await invoke("create_session", { sessionId: session.id, cwd: project.path });
            } catch (err) {
              console.error(`Failed to restore session ${session.id}:`, err);
            }
          }
        }

        // Set the first session as active if none is set
        const allSessions = config.projects.flatMap((p) => p.sessions);
        if (allSessions.length > 0) {
          dispatch({ type: "SET_ACTIVE_SESSION", sessionId: allSessions[0].id });
        }
      })
      .catch((err) => {
        console.error("Failed to load config:", err);
      });
  }, [dispatch]);

  // Debounced save on state change
  const saveConfig = useCallback(() => {
    if (!loaded.current) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      const config: TermaConfig = {
        version: 1,
        projects: state.projects,
        settings: state.settings,
        window: {
          width: 1200,
          height: 800,
          x: 100,
          y: 100,
          maximized: false,
        },
      };

      invoke("save_config", { config }).catch((err: unknown) => {
        console.error("Failed to save config:", err);
      });
    }, 500);
  }, [state.projects, state.settings]);

  useEffect(() => {
    saveConfig();
  }, [saveConfig]);
}
