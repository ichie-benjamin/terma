import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TerminalPanel from "../TerminalPanel";
import { AppProvider } from "../../../context/AppContext";

describe("TerminalPanel", () => {
  it("shows welcome screen when no sessions", () => {
    render(
      <AppProvider>
        <TerminalPanel />
      </AppProvider>,
    );
    expect(screen.getByText("Terma")).toBeInTheDocument();
    expect(screen.getByText("Project-aware terminal multiplexer")).toBeInTheDocument();
  });

  it("shows keyboard shortcuts on welcome screen", () => {
    render(
      <AppProvider>
        <TerminalPanel />
      </AppProvider>,
    );
    expect(screen.getByText("New session")).toBeInTheDocument();
    expect(screen.getByText("Quick switch")).toBeInTheDocument();
    expect(screen.getByText("Toggle sidebar")).toBeInTheDocument();
    expect(screen.getByText("Switch sessions")).toBeInTheDocument();
  });
});
