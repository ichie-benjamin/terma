import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "../Sidebar";
import { AppProvider } from "../../../context/AppContext";

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

function renderSidebar() {
  return render(
    <AppProvider>
      <Sidebar />
    </AppProvider>,
  );
}

describe("Sidebar", () => {
  it("renders Explorer header", () => {
    renderSidebar();
    expect(screen.getByText("Explorer")).toBeInTheDocument();
  });

  it("renders Add Folder button", () => {
    renderSidebar();
    expect(screen.getByText("Add Folder")).toBeInTheDocument();
  });

  it("shows empty state when no projects", () => {
    renderSidebar();
    expect(screen.getByText("No folders opened yet.")).toBeInTheDocument();
  });

  it("shows Open a folder link", () => {
    renderSidebar();
    expect(screen.getByText("Open a folder")).toBeInTheDocument();
  });

  it("shows filter input when filter button is clicked", () => {
    renderSidebar();
    const filterButton = screen.getByTitle("Filter");
    fireEvent.click(filterButton);
    expect(screen.getByPlaceholderText("Type to filter...")).toBeInTheDocument();
  });

  it("hides filter input on escape", () => {
    renderSidebar();
    fireEvent.click(screen.getByTitle("Filter"));
    const input = screen.getByPlaceholderText("Type to filter...");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Type to filter...")).not.toBeInTheDocument();
  });
});
