import { useCallback, useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
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
    term.loadAddon(new WebLinksAddon());

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

    // Listen for PTY output
    let unlistenOutput: UnlistenFn | null = null;
    listen<number[]>(`terminal-output-${sessionId}`, (event) => {
      const data = new Uint8Array(event.payload);
      term.write(data);
    }).then((fn) => {
      unlistenOutput = fn;
    });

    // Listen for PTY exit — auto-restart
    let unlistenExit: UnlistenFn | null = null;
    listen(`terminal-exit-${sessionId}`, () => {
      handleRestart();
    }).then((fn) => {
      unlistenExit = fn;
    });

    // ResizeObserver for container
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        fitAddon.fit();
      });
    });
    observer.observe(containerRef.current);

    return () => {
      unlistenOutput?.();
      unlistenExit?.();
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
