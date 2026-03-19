import { render } from "@testing-library/react";
import { AppProvider } from "../context/AppContext";
import type { ReactNode } from "react";

export function renderWithProvider(ui: ReactNode) {
  return render(<AppProvider>{ui}</AppProvider>);
}

export function createProject(overrides = {}) {
  return {
    id: "project-1",
    name: "test-project",
    path: "/tmp/test-project",
    sessions: [],
    collapsed: false,
    color: "#519aba",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function createSession(overrides = {}) {
  return {
    id: "session-1",
    name: "session 1",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
