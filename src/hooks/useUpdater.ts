import { useState, useEffect, useCallback } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

interface UpdaterState {
  available: boolean;
  version: string | null;
  downloading: boolean;
  progress: number;
  error: string | null;
}

export function useUpdater() {
  const [state, setState] = useState<UpdaterState>({
    available: false,
    version: null,
    downloading: false,
    progress: 0,
    error: null,
  });
  const [update, setUpdate] = useState<Update | null>(null);

  const checkForUpdates = useCallback(async () => {
    try {
      const result = await check();
      if (result) {
        setUpdate(result);
        setState((s) => ({
          ...s,
          available: true,
          version: result.version,
          error: null,
        }));
      }
    } catch (err) {
      console.error("Update check failed:", err);
      setState((s) => ({ ...s, error: String(err) }));
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!update) return;
    try {
      setState((s) => ({ ...s, downloading: true, progress: 0 }));

      let totalBytes = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          totalBytes = event.data.contentLength;
        } else if (event.event === "Progress") {
          const downloaded = event.data.chunkLength;
          if (totalBytes > 0) {
            setState((s) => ({
              ...s,
              progress: Math.min(100, s.progress + (downloaded / totalBytes) * 100),
            }));
          }
        } else if (event.event === "Finished") {
          setState((s) => ({ ...s, progress: 100 }));
        }
      });

      await relaunch();
    } catch (err) {
      console.error("Update install failed:", err);
      setState((s) => ({ ...s, downloading: false, error: String(err) }));
    }
  }, [update]);

  // Check on mount, then every 4 hours
  useEffect(() => {
    checkForUpdates();
    const interval = setInterval(checkForUpdates, 4 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return { ...state, checkForUpdates, installUpdate };
}
