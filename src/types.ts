export type DataSource = "demo" | "notion";

export type WeekStatus = "completed" | "partial" | "not-started" | "no-entry";

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface NextAction {
  text: string;
  completed: boolean;
}

export interface WeekDay {
  date: string;
  status: WeekStatus;
  hours: number | null;
}

export interface UpcomingNote {
  id: string;
  date: string;
  note: string;
}

export interface BlockerReason {
  id: string;
  label: string;
  count: number;
}

export interface FocusLogState {
  date: string;
  bigThree: TaskItem[];
  nextAction: NextAction;
  focusHours: number;
  focusGoal: number;
  week: WeekDay[];
  upcomingNotes: UpcomingNote[];
  blockers: BlockerReason[];
  dataSource: DataSource;
}
