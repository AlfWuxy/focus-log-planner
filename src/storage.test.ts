import { describe, expect, it } from "vitest";
import { createDemoState } from "./data";
import { clearFocusLog, loadFocusLog, saveFocusLog, STORAGE_KEY } from "./storage";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("local persistence", () => {
  it("round-trips a focus log through the versioned envelope", () => {
    const storage = new MemoryStorage();
    const state = createDemoState();
    state.focusHours = 3.5;

    expect(saveFocusLog(state, storage)).toBe(true);
    expect(loadFocusLog(storage)).toEqual(state);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}").version).toBe(1);
  });

  it("falls back to the demo for corrupt or incompatible data", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "not-json");
    expect(loadFocusLog(storage)).toEqual(createDemoState());

    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, state: {} }));
    expect(loadFocusLog(storage)).toEqual(createDemoState());
  });

  it("clears only the Focus Log key", () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, "saved");
    storage.setItem("someone-else", "keep");
    clearFocusLog(storage);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem("someone-else")).toBe("keep");
  });
});
