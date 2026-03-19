import { invoke } from "@tauri-apps/api/core";

export function usePty() {
  async function createSession(sessionId: string, cwd: string): Promise<string> {
    return await invoke<string>("create_session", { sessionId, cwd });
  }

  async function writeToSession(sessionId: string, data: string): Promise<void> {
    const encoder = new TextEncoder();
    const bytes = Array.from(encoder.encode(data));
    await invoke("write_to_session", { sessionId, data: bytes });
  }

  async function resizeSession(sessionId: string, cols: number, rows: number): Promise<void> {
    await invoke("resize_session", { sessionId, cols, rows });
  }

  async function closeSession(sessionId: string): Promise<void> {
    await invoke("close_session", { sessionId });
  }

  return { createSession, writeToSession, resizeSession, closeSession };
}
