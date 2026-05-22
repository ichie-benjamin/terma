import { useCallback, useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SerializeAddon } from "@xterm/addon-serialize";
import { ImageAddon } from "@xterm/addon-image";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import "@xterm/xterm/css/xterm.css";

interface TerminalViewProps {
  sessionId: string;
  cwd: string;
  isActive: boolean;
}

export default function TerminalView({ sessionId, cwd, isActive }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initialized = useRef(false);
  // Tracks the latest isActive value for callbacks created once on mount.
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  const handleRestart = useCallback(async () => {
    try {
      await invoke("close_session", { sessionId }).catch(() => {});
      await invoke("create_session", { sessionId, cwd });
      if (termRef.current) {
        termRef.current.reset();
      }
    } catch (err) {
      console.error("Failed to restart session:", err);
    }
  }, [sessionId, cwd]);

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;
    initialized.current = true;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      cursorWidth: 2,
      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'SF Mono', Menlo, Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.4,
      scrollback: 5000,
      theme: {
        background: "#1e1e1e",
        foreground: "#cccccc",
        cursor: "#aeafad",
        cursorAccent: "#1e1e1e",
        selectionBackground: "#264f78",
        selectionForeground: "#ffffff",
        black: "#000000",
        red: "#cd3131",
        green: "#0dbc79",
        yellow: "#e5e510",
        blue: "#2472c8",
        magenta: "#bc3fbc",
        cyan: "#11a8cd",
        white: "#e5e5e5",
        brightBlack: "#666666",
        brightRed: "#f14c4c",
        brightGreen: "#23d18b",
        brightYellow: "#f5f543",
        brightBlue: "#3b8eea",
        brightMagenta: "#d670d6",
        brightCyan: "#29b8db",
        brightWhite: "#e5e5e5",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon((_event, uri) => {
      openUrl(uri);
    }));
    const serializeAddon = new SerializeAddon();
    term.loadAddon(serializeAddon);
    // Render inline images (Sixel + iTerm IIP). storageLimit is in MB and
    // caps decoded-image memory; oldest images are evicted past the limit.
    term.loadAddon(new ImageAddon({ storageLimit: 64 }));

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Hide terminal until first fit to prevent unstyled content flash
    containerRef.current.style.opacity = "0";
    term.open(containerRef.current);

    requestAnimationFrame(() => {
      fitAddon.fit();
      if (containerRef.current) {
        containerRef.current.style.opacity = "1";
      }
    });

    // Send input to PTY
    term.onData((data) => {
      const encoder = new TextEncoder();
      const bytes = Array.from(encoder.encode(data));
      invoke("write_to_session", { sessionId, data: bytes }).catch(console.error);
    });

    // Handle resize
    term.onResize(({ cols, rows }) => {
      invoke("resize_session", { sessionId, cols, rows }).catch(console.error);
    });

    // Restore saved scrollback before live output. PTY data that arrives
    // before the restore finishes is buffered so history stays above it.
    let restored = false;
    const pending: Uint8Array[] = [];

    // Listen for PTY output
    let unlistenOutput: UnlistenFn | null = null;
    listen<number[]>(`terminal-output-${sessionId}`, (event) => {
      const data = new Uint8Array(event.payload);
      if (restored) {
        term.write(data);
      } else {
        pending.push(data);
      }
    }).then((fn) => {
      unlistenOutput = fn;
    });

    invoke<string | null>("load_session_content", { sessionId })
      .catch(() => null)
      .then((content) => {
        if (content) {
          term.write(content);
          term.write("\r\n\x1b[90m─── session restored ───\x1b[0m\r\n");
        }
        restored = true;
        for (const chunk of pending) term.write(chunk);
        pending.length = 0;
      });

    // Periodically persist scrollback so it can be restored after a restart.
    // The interval is cleared on unmount before the buffer is discarded.
    const saveTimer = setInterval(() => {
      try {
        const content = serializeAddon.serialize({ scrollback: 1000 });
        invoke("save_session_content", { sessionId, content }).catch(() => {});
      } catch {
        /* serialization can fail mid-write; skip this tick */
      }
    }, 5000);

    // Listen for PTY exit — auto-restart
    let unlistenExit: UnlistenFn | null = null;
    listen(`terminal-exit-${sessionId}`, () => {
      handleRestart();
    }).then((fn) => {
      unlistenExit = fn;
    });

    // ResizeObserver for container. Debounced so a continuous drag-resize
    // collapses into a single fit() once movement settles, and skipped for
    // inactive terminals (they re-fit when activated) — otherwise every open
    // session reflows its buffer on each tick and freezes the app.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (!isActiveRef.current) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (isActiveRef.current) fitAddon.fit();
      }, 100);
    });
    observer.observe(containerRef.current);

    return () => {
      unlistenOutput?.();
      unlistenExit?.();
      clearInterval(saveTimer);
      if (resizeTimer) clearTimeout(resizeTimer);
      observer.disconnect();
      term.dispose();
      initialized.current = false;
    };
  }, [sessionId]);

  // Focus terminal when it becomes active
  useEffect(() => {
    if (isActive && termRef.current) {
      requestAnimationFrame(() => {
        termRef.current?.focus();
        fitAddonRef.current?.fit();
      });
    }
  }, [isActive]);

  return (
    <div
      className="absolute inset-0"
      style={{
        padding: "10px 12px",
        visibility: isActive ? "visible" : "hidden",
        zIndex: isActive ? 1 : 0,
      }}
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
