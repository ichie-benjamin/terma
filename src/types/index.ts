export interface Project {
  id: string;
  name: string;
  path: string;
  sessions: Session[];
  collapsed: boolean;
  color?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  shell?: string;
  createdAt: string;
}

export interface AppSettings {
  theme: "dark" | "light";
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: "block" | "underline" | "bar";
  cursorBlink: boolean;
  scrollback: number;
  defaultShell: string | null;
  sidebarWidth: number;
  confirmOnClose: boolean;
  restoreOnStartup: boolean;
}

export interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
  maximized: boolean;
}

export interface AppState {
  projects: Project[];
  activeSessionId: string | null;
  sidebarWidth: number;
  sidebarVisible: boolean;
  settings: AppSettings;
  quickSwitchOpen: boolean;
}

export type Action =
  | { type: "ADD_PROJECT"; project: Project }
  | { type: "REMOVE_PROJECT"; projectId: string }
  | { type: "RENAME_PROJECT"; projectId: string; name: string }
  | { type: "TOGGLE_PROJECT"; projectId: string }
  | { type: "ADD_SESSION"; projectId: string; session: Session }
  | { type: "REMOVE_SESSION"; projectId: string; sessionId: string }
  | { type: "RENAME_SESSION"; projectId: string; sessionId: string; name: string }
  | { type: "SET_ACTIVE_SESSION"; sessionId: string | null }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_QUICK_SWITCH"; open: boolean }
  | { type: "SET_SIDEBAR_WIDTH"; width: number }
  | { type: "LOAD_STATE"; state: Partial<AppState> };

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  fontFamily: "JetBrains Mono, Menlo, monospace",
  fontSize: 14,
  lineHeight: 1.2,
  cursorStyle: "block",
  cursorBlink: true,
  scrollback: 5000,
  defaultShell: null,
  sidebarWidth: 240,
  confirmOnClose: true,
  restoreOnStartup: true,
};
