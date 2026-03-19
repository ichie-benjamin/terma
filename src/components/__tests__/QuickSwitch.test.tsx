import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import QuickSwitch from "../QuickSwitch";
import { AppProvider } from "../../context/AppContext";

describe("QuickSwitch", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <AppProvider>
        <QuickSwitch />
      </AppProvider>,
    );
    expect(container.innerHTML).toBe("");
  });
});
