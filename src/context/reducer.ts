import { AppState, Action } from "../types";

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_PROJECT":
      return {
        ...state,
        projects: [...state.projects, action.project],
      };

    case "REMOVE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.projectId),
        activeSessionId: state.projects
          .find((p) => p.id === action.projectId)
          ?.sessions.some((s) => s.id === state.activeSessionId)
          ? null
          : state.activeSessionId,
      };

    case "RENAME_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.projectId ? { ...p, name: action.name } : p,
        ),
      };

    case "TOGGLE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.projectId ? { ...p, collapsed: !p.collapsed } : p,
        ),
      };

    case "ADD_SESSION":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.projectId
            ? { ...p, sessions: [...p.sessions, action.session], collapsed: false }
            : p,
        ),
      };

    case "REMOVE_SESSION":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.projectId
            ? { ...p, sessions: p.sessions.filter((s) => s.id !== action.sessionId) }
            : p,
        ),
        activeSessionId:
          state.activeSessionId === action.sessionId ? null : state.activeSessionId,
      };

    case "RENAME_SESSION":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.projectId
            ? {
                ...p,
                sessions: p.sessions.map((s) =>
                  s.id === action.sessionId ? { ...s, name: action.name } : s,
                ),
              }
            : p,
        ),
      };

    case "SET_ACTIVE_SESSION":
      return {
        ...state,
        activeSessionId: action.sessionId,
      };

    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        sidebarVisible: !state.sidebarVisible,
      };

    case "SET_QUICK_SWITCH":
      return {
        ...state,
        quickSwitchOpen: action.open,
      };

    case "SET_SIDEBAR_WIDTH":
      return {
        ...state,
        sidebarWidth: action.width,
      };

    case "LOAD_STATE":
      return {
        ...state,
        ...action.state,
      };

    default:
      return state;
  }
}
