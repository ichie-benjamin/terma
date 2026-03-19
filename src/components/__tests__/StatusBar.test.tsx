import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBar from "../StatusBar";
import { AppProvider } from "../../context/AppContext";

function renderStatusBar() {
  return render(
    <AppProvider>
      <StatusBar />
    </AppProvider>,
  );
}

describe("StatusBar", () => {
  it("renders Terma when no active session", () => {
    renderStatusBar();
    expect(screen.getByText("Terma")).toBeInTheDocument();
  });

  it("does not show session count when no sessions", () => {
    renderStatusBar();
    expect(screen.queryByText(/session/i)).not.toBeInTheDocument();
  });
});
