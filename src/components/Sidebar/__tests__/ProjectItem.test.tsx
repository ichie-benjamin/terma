import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectItem from "../ProjectItem";
import { AppProvider } from "../../../context/AppContext";
import { createProject, createSession } from "../../../test/helpers";

vi.mock("../../../hooks/usePty", () => ({
  usePty: () => ({
    createSession: vi.fn(() => Promise.resolve("id")),
    closeSession: vi.fn(() => Promise.resolve()),
  }),
}));

function renderProject(project = createProject()) {
  return render(
    <AppProvider>
      <ProjectItem project={project} />
    </AppProvider>,
  );
}

describe("ProjectItem", () => {
  it("renders project name in uppercase", () => {
    renderProject();
    expect(screen.getByText("test-project")).toBeInTheDocument();
  });

  it("shows No sessions when project has no sessions", () => {
    renderProject();
    expect(screen.getByText("No sessions")).toBeInTheDocument();
  });

  it("renders sessions when project has sessions", () => {
    const project = createProject({
      sessions: [createSession({ name: "my session" })],
    });
    renderProject(project);
    expect(screen.getByText("my session")).toBeInTheDocument();
  });

  it("hides sessions when collapsed", () => {
    const project = createProject({
      collapsed: true,
      sessions: [createSession()],
    });
    renderProject(project);
    expect(screen.queryByText("session 1")).not.toBeInTheDocument();
  });

  it("shows add session button on hover", () => {
    renderProject();
    expect(screen.getByTitle("New terminal")).toBeInTheDocument();
  });

  it("shows remove folder button on hover", () => {
    renderProject();
    expect(screen.getByTitle("Remove folder")).toBeInTheDocument();
  });

  it("enters edit mode on double click", () => {
    renderProject();
    fireEvent.doubleClick(screen.getByText("test-project"));
    expect(screen.getByDisplayValue("test-project")).toBeInTheDocument();
  });
});
