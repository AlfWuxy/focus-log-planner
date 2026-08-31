import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  clearLocalAccessToken,
  isLoopbackNotionOrigin,
  loadLocalAccessToken,
  LOCAL_ACCESS_TOKEN_KEY,
  saveLocalAccessToken,
} from "./notion";
import { STORAGE_KEY } from "./storage";

const LOCAL_ACCESS_TOKEN = "focus-log-browser-test-key-0123456789abcdef";

describe("Focus Log interactions", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("keeps the local pairing key on loopback and tolerates blocked session storage", () => {
    expect(isLoopbackNotionOrigin({ origin: "http://127.0.0.1:5173" })).toBe(true);
    expect(isLoopbackNotionOrigin({ origin: "http://127.0.0.1:4173" })).toBe(false);
    expect(isLoopbackNotionOrigin({ origin: "http://localhost:5173" })).toBe(false);
    expect(isLoopbackNotionOrigin({ origin: "https://alfwuxy.github.io" })).toBe(false);

    const blockedStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(loadLocalAccessToken(blockedStorage)).toBe("");
    expect(saveLocalAccessToken(LOCAL_ACCESS_TOKEN, blockedStorage)).toBe("");
    expect(() => clearLocalAccessToken(blockedStorage)).not.toThrow();
  });

  it("updates focus hours and saves the change locally", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Increase focus hours" }));
    expect(screen.getByText("3.0")).toBeInTheDocument();

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(saved.state.focusHours).toBe(3);
    });
  });

  it("edits the daily plan through the dialog", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole("button", { name: "Edit day" })[0]);
    const dialog = screen.getByRole("dialog", { name: "Edit day" });
    const firstOutcome = within(dialog).getByRole("textbox", { name: "Big 3 outcome 1" });
    await user.clear(firstOutcome);
    await user.type(firstOutcome, "Draft the public README");
    await user.click(within(dialog).getByRole("button", { name: "Save day" }));

    expect(screen.getByText("Draft the public README")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Edit day" })).not.toBeInTheDocument();
  });

  it("toggles a Big 3 task with an accessible checkbox", async () => {
    const user = userEvent.setup();
    render(<App />);

    const checkbox = screen.getByRole("checkbox", {
      name: "Mark complete: Review two practice sets",
    });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText("Review two practice sets")).toHaveClass("completed");
  });

  it("loads a read-only Notion view and restores the local demo snapshot", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        date: "2026-08-31",
        source: "notion",
        daily: [{
          id: "daily-1",
          title: "Monday plan",
          date: "2026-08-31",
          focus: "Open the research notes",
          plan: "Check sources\nWrite an outline\nShare the draft",
          progress: "",
          reflection: "",
          status: "In progress",
          tags: [],
          url: null,
        }],
        notes: [{
          id: "note-n1",
          title: "Prepare Tuesday questions",
          date: "2026-09-01",
          content: "",
          status: "Open",
          tags: [],
          url: null,
        }],
        meta: { dailyCount: 1, notesCount: 1 },
      }),
    }));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Connect Notion" }));
    const accessDialog = screen.getByRole("dialog", { name: "Connect Notion" });
    await user.type(within(accessDialog).getByLabelText("Local access key"), LOCAL_ACCESS_TOKEN);
    await user.click(within(accessDialog).getByRole("button", { name: "Connect read-only" }));
    expect(await screen.findByText("Check sources")).toBeInTheDocument();
    expect(screen.getByText("Open the research notes")).toBeInTheDocument();
    expect(screen.getByText("Prepare Tuesday questions")).toBeInTheDocument();
    expect(sessionStorage.getItem(LOCAL_ACCESS_TOKEN_KEY)).toBe(LOCAL_ACCESS_TOKEN);
    expect(fetch).toHaveBeenCalledWith(
      "/api/notion/focus-log?date=2026-08-31",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          "X-Focus-Log-Token": LOCAL_ACCESS_TOKEN,
        },
      }),
    );

    await user.click(screen.getByRole("button", { name: "Notion" }));
    await user.click(screen.getByRole("menuitemradio", { name: /Demo data/ }));
    expect(screen.getByText("Finish the project outline")).toBeInTheDocument();
    expect(screen.queryByText("Check sources")).not.toBeInTheDocument();
  });

  it("keeps demo mode editable when a Notion connection fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({
        error: { message: "Notion read-only integration is not configured." },
      }),
    }));
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Connect Notion" }));
    const accessDialog = screen.getByRole("dialog", { name: "Connect Notion" });
    await user.type(within(accessDialog).getByLabelText("Local access key"), LOCAL_ACCESS_TOKEN);
    await user.click(within(accessDialog).getByRole("button", { name: "Connect read-only" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Notion is unavailable");
    expect(screen.getByText("Finish the project outline")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Edit day" })[0]).toBeEnabled();
    expect(screen.getByRole("button", { name: "Demo data" })).toBeInTheDocument();
  });
});
