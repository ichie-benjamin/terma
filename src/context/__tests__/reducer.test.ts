import { describe, it, expect } from "vitest";
import { appReducer } from "../reducer";
import type { AppState } from "../../types";
import { DEFAULT_SETTINGS } from "../../types";

function createState(overrides: Partial<AppState> = {}): AppState {
  return {
    projects: [],
    activeSessionId: null,
    sidebarWidth: 240,
    sidebarVisible: true,
    settings: DEFAULT_SETTINGS,
    quickSwitchOpen: false,
    ...overrides,
  };
}

const project = {
  id: "p1",
  name: "project-1",
  path: "/tmp/p1",
  sessions: [],
  collapsed: false,
  color: "#519aba",
  createdAt: "2026-01-01T00:00:00Z",
};

const session = {
  id: "s1",
  name: "session 1",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("appReducer", () => {
  describe("ADD_PROJECT", () => {
    it("adds a project to the list", () => {
      const state = createState();
      const result = appReducer(state, { type: "ADD_PROJECT", project });
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe("project-1");
    });

    it("appends to existing projects", () => {
      const state = createState({ projects: [project] });
      const project2 = { ...project, id: "p2", name: "project-2" };
      const result = appReducer(state, { type: "ADD_PROJECT", project: project2 });
      expect(result.projects).toHaveLength(2);
    });
  });

  describe("REMOVE_PROJECT", () => {
    it("removes a project by id", () => {
      const state = createState({ projects: [project] });
      const result = appReducer(state, { type: "REMOVE_PROJECT", projectId: "p1" });
      expect(result.projects).toHaveLength(0);
    });

    it("clears activeSessionId if it belongs to the removed project", () => {
      const withSession = { ...project, sessions: [session] };
      const state = createState({ projects: [withSession], activeSessionId: "s1" });
      const result = appReducer(state, { type: "REMOVE_PROJECT", projectId: "p1" });
      expect(result.activeSessionId).toBeNull();
    });

    it("keeps activeSessionId if it belongs to another project", () => {
      const state = createState({
        projects: [project, { ...project, id: "p2", sessions: [session] }],
        activeSessionId: "s1",
      });
      const result = appReducer(state, { type: "REMOVE_PROJECT", projectId: "p1" });
      expect(result.activeSessionId).toBe("s1");
    });

    it("does nothing if project id not found", () => {
      const state = createState({ projects: [project] });
      const result = appReducer(state, { type: "REMOVE_PROJECT", projectId: "nonexistent" });
      expect(result.projects).toHaveLength(1);
    });
  });

  describe("RENAME_PROJECT", () => {
    it("renames a project", () => {
      const state = createState({ projects: [project] });
      const result = appReducer(state, { type: "RENAME_PROJECT", projectId: "p1", name: "new-name" });
      expect(result.projects[0].name).toBe("new-name");
    });

    it("does not affect other projects", () => {
      const project2 = { ...project, id: "p2", name: "project-2" };
      const state = createState({ projects: [project, project2] });
      const result = appReducer(state, { type: "RENAME_PROJECT", projectId: "p1", name: "renamed" });
      expect(result.projects[1].name).toBe("project-2");
    });
  });

  describe("TOGGLE_PROJECT", () => {
    it("toggles collapsed state", () => {
      const state = createState({ projects: [project] });
      const result = appReducer(state, { type: "TOGGLE_PROJECT", projectId: "p1" });
      expect(result.projects[0].collapsed).toBe(true);
    });

    it("toggles back to expanded", () => {
      const collapsed = { ...project, collapsed: true };
      const state = createState({ projects: [collapsed] });
      const result = appReducer(state, { type: "TOGGLE_PROJECT", projectId: "p1" });
      expect(result.projects[0].collapsed).toBe(false);
    });
  });

  describe("ADD_SESSION", () => {
    it("adds a session to a project", () => {
      const state = createState({ projects: [project] });
      const result = appReducer(state, { type: "ADD_SESSION", projectId: "p1", session });
      expect(result.projects[0].sessions).toHaveLength(1);
      expect(result.projects[0].sessions[0].name).toBe("session 1");
    });

    it("expands project when adding a session", () => {
      const collapsed = { ...project, collapsed: true };
      const state = createState({ projects: [collapsed] });
      const result = appReducer(state, { type: "ADD_SESSION", projectId: "p1", session });
      expect(result.projects[0].collapsed).toBe(false);
    });

    it("does not affect other projects", () => {
      const project2 = { ...project, id: "p2" };
      const state = createState({ projects: [project, project2] });
      const result = appReducer(state, { type: "ADD_SESSION", projectId: "p1", session });
      expect(result.projects[1].sessions).toHaveLength(0);
    });
  });

  describe("REMOVE_SESSION", () => {
    it("removes a session from a project", () => {
      const withSession = { ...project, sessions: [session] };
      const state = createState({ projects: [withSession] });
      const result = appReducer(state, { type: "REMOVE_SESSION", projectId: "p1", sessionId: "s1" });
      expect(result.projects[0].sessions).toHaveLength(0);
    });

    it("clears activeSessionId if removing the active session", () => {
      const withSession = { ...project, sessions: [session] };
      const state = createState({ projects: [withSession], activeSessionId: "s1" });
      const result = appReducer(state, { type: "REMOVE_SESSION", projectId: "p1", sessionId: "s1" });
      expect(result.activeSessionId).toBeNull();
    });

    it("keeps activeSessionId if removing a different session", () => {
      const session2 = { ...session, id: "s2" };
      const withSessions = { ...project, sessions: [session, session2] };
      const state = createState({ projects: [withSessions], activeSessionId: "s1" });
      const result = appReducer(state, { type: "REMOVE_SESSION", projectId: "p1", sessionId: "s2" });
      expect(result.activeSessionId).toBe("s1");
    });
  });

  describe("RENAME_SESSION", () => {
    it("renames a session", () => {
      const withSession = { ...project, sessions: [session] };
      const state = createState({ projects: [withSession] });
      const result = appReducer(state, {
        type: "RENAME_SESSION", projectId: "p1", sessionId: "s1", name: "renamed",
      });
      expect(result.projects[0].sessions[0].name).toBe("renamed");
    });
  });

  describe("SET_ACTIVE_SESSION", () => {
    it("sets the active session id", () => {
      const state = createState();
      const result = appReducer(state, { type: "SET_ACTIVE_SESSION", sessionId: "s1" });
      expect(result.activeSessionId).toBe("s1");
    });

    it("can set to null", () => {
      const state = createState({ activeSessionId: "s1" });
      const result = appReducer(state, { type: "SET_ACTIVE_SESSION", sessionId: null });
      expect(result.activeSessionId).toBeNull();
    });
  });

  describe("TOGGLE_SIDEBAR", () => {
    it("toggles sidebar visibility", () => {
      const state = createState({ sidebarVisible: true });
      const result = appReducer(state, { type: "TOGGLE_SIDEBAR" });
      expect(result.sidebarVisible).toBe(false);
    });

    it("toggles back to visible", () => {
      const state = createState({ sidebarVisible: false });
      const result = appReducer(state, { type: "TOGGLE_SIDEBAR" });
      expect(result.sidebarVisible).toBe(true);
    });
  });

  describe("SET_QUICK_SWITCH", () => {
    it("opens quick switch", () => {
      const state = createState();
      const result = appReducer(state, { type: "SET_QUICK_SWITCH", open: true });
      expect(result.quickSwitchOpen).toBe(true);
    });

    it("closes quick switch", () => {
      const state = createState({ quickSwitchOpen: true });
      const result = appReducer(state, { type: "SET_QUICK_SWITCH", open: false });
      expect(result.quickSwitchOpen).toBe(false);
    });
  });

  describe("SET_SIDEBAR_WIDTH", () => {
    it("sets sidebar width", () => {
      const state = createState();
      const result = appReducer(state, { type: "SET_SIDEBAR_WIDTH", width: 300 });
      expect(result.sidebarWidth).toBe(300);
    });
  });

  describe("LOAD_STATE", () => {
    it("merges partial state", () => {
      const state = createState();
      const result = appReducer(state, {
        type: "LOAD_STATE",
        state: { projects: [project], sidebarWidth: 280 },
      });
      expect(result.projects).toHaveLength(1);
      expect(result.sidebarWidth).toBe(280);
      expect(result.sidebarVisible).toBe(true); // unchanged
    });
  });

  describe("unknown action", () => {
    it("returns state unchanged", () => {
      const state = createState();
      // @ts-expect-error testing unknown action
      const result = appReducer(state, { type: "UNKNOWN" });
      expect(result).toBe(state);
    });
  });
});
