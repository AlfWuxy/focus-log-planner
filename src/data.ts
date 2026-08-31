import type { FocusLogState } from "./types";

export const DEMO_DATE = "2026-08-31";

export const createDemoState = (): FocusLogState => ({
  date: DEMO_DATE,
  bigThree: [
    { id: "big-1", text: "Finish the project outline", completed: true },
    { id: "big-2", text: "Review two practice sets", completed: false },
    { id: "big-3", text: "Send the follow-up email", completed: false },
  ],
  nextAction: {
    text: "Write the first paragraph",
    completed: false,
  },
  focusHours: 2.5,
  focusGoal: 4,
  week: [
    { date: "2026-08-31", status: "partial", hours: 2.5 },
    { date: "2026-09-01", status: "no-entry", hours: null },
    { date: "2026-09-02", status: "no-entry", hours: null },
    { date: "2026-09-03", status: "completed", hours: 4 },
    { date: "2026-09-04", status: "partial", hours: 2 },
    { date: "2026-09-05", status: "no-entry", hours: null },
    { date: "2026-09-06", status: "completed", hours: 3.5 },
  ],
  upcomingNotes: [
    { id: "note-1", date: "2026-09-01", note: "Tomorrow" },
    { id: "note-2", date: "2026-09-02", note: "Wednesday" },
  ],
  blockers: [
    { id: "reason-1", label: "Too many tasks", count: 3 },
    { id: "reason-2", label: "Low energy", count: 2 },
    { id: "reason-3", label: "Waiting on someone", count: 1 },
  ],
  dataSource: "demo",
});

export const makeId = (prefix: string): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
