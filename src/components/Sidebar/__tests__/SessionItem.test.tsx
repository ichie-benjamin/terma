import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SessionItem from "../SessionItem";
import { AppProvider } from "../../../context/AppContext";

vi.mock("../../../hooks/usePty", () => ({
  usePty: () => ({
    createSession: vi.fn(() => Promise.resolve("id")),
    closeSession: vi.fn(() => Promise.resolve()),
  }),
}));

function renderSession(props = {}) {
  const defaultProps = {
    projectId: "p1",
    sessionId: "s1",
    name: "session 1",
    isActive: false,
  };
  return render(
    <AppProvider>
      <SessionItem {...defaultProps} {...props} />
    </AppProvider>,
  );
}

describe("SessionItem", () => {
  it("renders session name", () => {
    renderSession();
    expect(screen.getByText("session 1")).toBeInTheDocument();
  });

  it("renders with active styling when active", () => {
    renderSession({ isActive: true });
    const item = screen.getByText("session 1").closest("div");
    expect(item?.className).toContain("bg-[var(--bg-selected)]");
  });

  it("shows rename and close buttons", () => {
    renderSession();
    expect(screen.getByTitle("Rename")).toBeInTheDocument();
    expect(screen.getByTitle("Close")).toBeInTheDocument();
  });

  it("enters edit mode on double click", () => {
    renderSession();
    const nameEl = screen.getByText("session 1");
    fireEvent.doubleClick(nameEl.closest("div")!);
    expect(screen.getByDisplayValue("session 1")).toBeInTheDocument();
  });

  it("enters edit mode on right click", () => {
    renderSession();
    const nameEl = screen.getByText("session 1");
    fireEvent.contextMenu(nameEl.closest("div")!);
    expect(screen.getByDisplayValue("session 1")).toBeInTheDocument();
  });

  it("exits edit mode on escape", () => {
    renderSession();
    fireEvent.doubleClick(screen.getByText("session 1").closest("div")!);
    const input = screen.getByDisplayValue("session 1");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("session 1")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("session 1")).not.toBeInTheDocument();
  });

  it("applies project color to icon when active", () => {
    renderSession({ isActive: true, color: "#ff0000" });
    const svg = screen.getByText("session 1").closest("div")?.querySelector("svg");
    expect(svg?.style.color).toBe("rgb(255, 0, 0)");
  });
});
