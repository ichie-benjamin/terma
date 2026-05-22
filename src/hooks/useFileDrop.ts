import { useEffect, useRef } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { invoke } from "@tauri-apps/api/core";

// Single-quote a path for the shell so spaces and special chars survive.
function shellEscape(path: string): string {
  return `'${path.replace(/'/g, "'\\''")}'`;
}

/**
 * Listens for files dropped onto the window and writes their (shell-escaped)
 * paths into the active terminal session. Works for any file — images,
 * folders, etc. — since we only insert the path, not the contents.
 */
export function useFileDrop(activeSessionId: string | null) {
  // Keep the latest active session id available to the once-registered listener.
  const sessionRef = useRef(activeSessionId);
  sessionRef.current = activeSessionId;

  useEffect(() => {
    // `disposed` guards the async gap: under React StrictMode the effect's
    // cleanup can run before onDragDropEvent resolves, which would otherwise
    // leak the listener and double-write every dropped path.
    let disposed = false;
    let unlisten: (() => void) | null = null;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type !== "drop") return;
        const sessionId = sessionRef.current;
        const paths = event.payload.paths;
        if (!sessionId || !paths?.length) return;

        const text = paths.map(shellEscape).join(" ") + " ";
        const bytes = Array.from(new TextEncoder().encode(text));
        invoke("write_to_session", { sessionId, data: bytes }).catch(
          console.error,
        );
      })
      .then((fn) => {
        if (disposed) fn();
        else unlisten = fn;
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);
}
