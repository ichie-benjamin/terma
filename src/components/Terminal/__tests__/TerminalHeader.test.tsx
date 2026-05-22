import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import TerminalHeader from "../TerminalHeader";
import { AppProvider } from "../../../context/AppContext";

describe("TerminalHeader", () => {
  it("renders nothing when no active session", () => {
    const { container } = render(
      <AppProvider>
        <TerminalHeader />
      </AppProvider>,
    );
    expect(container.innerHTML).toBe("");
  });
});
