import { createDemoState } from "./data";
import type { FocusLogState } from "./types";

export const STORAGE_KEY = "focus-log:state:v1";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface StoredEnvelope {
  version: 1;
  state: FocusLogState;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFocusLogState = (value: unknown): value is FocusLogState => {
  if (!isObject(value)) return false;

  return (
    typeof value.date === "string" &&
    Array.isArray(value.bigThree) &&
    isObject(value.nextAction) &&
    typeof value.focusHours === "number" &&
    typeof value.focusGoal === "number" &&
    Array.isArray(value.week) &&
    Array.isArray(value.upcomingNotes) &&
    Array.isArray(value.blockers) &&
    (value.dataSource === "demo" || value.dataSource === "notion")
  );
};

const getBrowserStorage = (): StorageLike | undefined => {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
};

export const loadFocusLog = (
  storage: StorageLike | undefined = getBrowserStorage(),
): FocusLogState => {
  if (!storage) return createDemoState();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createDemoState();
    const parsed: unknown = JSON.parse(raw);

    if (
      !isObject(parsed) ||
      parsed.version !== 1 ||
      !isFocusLogState(parsed.state)
    ) {
      return createDemoState();
    }

    return parsed.state;
  } catch {
    return createDemoState();
  }
};

export const saveFocusLog = (
  state: FocusLogState,
  storage: StorageLike | undefined = getBrowserStorage(),
): boolean => {
  if (!storage) return false;

  try {
    const envelope: StoredEnvelope = { version: 1, state };
    storage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
};

export const clearFocusLog = (
  storage: StorageLike | undefined = getBrowserStorage(),
): void => {
  storage?.removeItem(STORAGE_KEY);
};
