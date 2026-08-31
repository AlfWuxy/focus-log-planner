import { Checkbox } from "./Checkbox";
import {
  CheckIcon,
  DragIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
} from "../icons";
import { formatShortDate, formatWeekday } from "../date";
import type { TaskItem, WeekDay, WeekStatus } from "../types";

interface SectionHeadingProps {
  title: string;
  hint: string;
  id?: string;
}

const SectionHeading = ({ title, hint, id }: SectionHeadingProps) => (
  <div className="section-heading">
    <h2 id={id}>{title}</h2>
    <p>{hint}</p>
  </div>
);

interface BigThreeProps {
  tasks: TaskItem[];
  onToggle: (id: string, completed: boolean) => void;
  onMove: (id: string) => void;
  onEdit: () => void;
  readOnly?: boolean;
}

export const BigThree = ({ tasks, onToggle, onMove, onEdit, readOnly = false }: BigThreeProps) => (
  <section className="timeline-section big-three" aria-labelledby="big-three-title">
    <span className="timeline-node" aria-hidden="true" />
    <div className="section-heading">
      <h2 id="big-three-title">Big 3</h2>
      <p>Your three most important outcomes for today.</p>
    </div>
    <ol className="task-list">
      {tasks.map((task, index) => (
        <li key={task.id}>
          <span className="task-number" aria-hidden="true">{index + 1}</span>
          <Checkbox
            checked={task.completed}
            label={`${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.text}`}
            onChange={(completed) => onToggle(task.id, completed)}
            disabled={readOnly}
          />
          <span className={task.completed ? "task-text completed" : "task-text"}>
            {task.text}
          </span>
          {readOnly ? <span aria-hidden="true" /> : (
            <button
              type="button"
              className="icon-button drag-button"
              aria-label={`Move ${task.text} ${index === tasks.length - 1 ? "to the top" : "down"}`}
              onClick={() => onMove(task.id)}
            >
              <DragIcon />
            </button>
          )}
        </li>
      ))}
    </ol>
    {readOnly ? null : (
      <button type="button" className="text-button" onClick={onEdit}>
        <PlusIcon size={18} /> Add Big 3
      </button>
    )}
  </section>
);

interface NextActionSectionProps {
  text: string;
  completed: boolean;
  onToggle: (completed: boolean) => void;
  onEdit: () => void;
  readOnly?: boolean;
}

export const NextActionSection = ({
  text,
  completed,
  onToggle,
  onEdit,
  readOnly = false,
}: NextActionSectionProps) => (
  <section className="timeline-section next-action" aria-labelledby="next-action-title">
    <span className="timeline-node" aria-hidden="true" />
    <div className="section-heading">
      <h2 id="next-action-title">Next action</h2>
      <p>The single next step to move forward.</p>
    </div>
    <div className="next-action-row">
      <Checkbox
        checked={completed}
        label={`${completed ? "Mark incomplete" : "Mark complete"}: ${text}`}
        onChange={onToggle}
        disabled={readOnly}
      />
      <span className={completed ? "completed" : undefined}>{text}</span>
      {readOnly ? <span aria-hidden="true" /> : (
        <button type="button" className="icon-button" onClick={onEdit} aria-label="Edit next action">
          <PencilIcon />
        </button>
      )}
    </div>
  </section>
);

interface FocusHoursProps {
  hours: number;
  goal: number;
  onChange: (hours: number) => void;
  readOnly?: boolean;
}

export const FocusHours = ({ hours, goal, onChange, readOnly = false }: FocusHoursProps) => {
  const percent = Math.min(100, Math.max(0, (hours / goal) * 100));
  return (
    <section className="timeline-section focus-hours" aria-labelledby="focus-hours-title">
      <span className="timeline-node" aria-hidden="true" />
      <SectionHeading id="focus-hours-title" title="Focus hours" hint="Protect time for deep work." />
      <div className="focus-value" aria-live="polite">
        <strong>{hours.toFixed(1)}</strong>
        <span>/ {goal} hours</span>
      </div>
      <div className="focus-controls">
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Focus hours completed"
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={hours}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
        <div className="stepper">
          <button
            type="button"
            className="square-button"
            aria-label="Decrease focus hours"
            disabled={readOnly || hours <= 0}
            aria-disabled={readOnly || hours <= 0}
            onClick={() => {
              if (!readOnly) onChange(Math.max(0, hours - 0.5));
            }}
          >
            <MinusIcon />
          </button>
          <button
            type="button"
            className="square-button"
            aria-label="Increase focus hours"
            disabled={readOnly || hours >= goal}
            aria-disabled={readOnly || hours >= goal}
            onClick={() => {
              if (!readOnly) onChange(Math.min(goal, hours + 0.5));
            }}
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    </section>
  );
};

const statusLabel: Record<WeekStatus, string> = {
  completed: "Completed",
  partial: "Partial",
  "not-started": "Not started",
  "no-entry": "No entry",
};

const StatusMark = ({ status }: { status: WeekStatus }) => (
  <span className={`status-mark ${status}`} aria-label={statusLabel[status]}>
    {status === "completed" ? <CheckIcon size={19} /> : null}
  </span>
);

interface ThisWeekProps {
  days: WeekDay[];
  currentDate: string;
}

export const ThisWeek = ({ days, currentDate }: ThisWeekProps) => (
  <section className="timeline-section this-week" aria-labelledby="this-week-title">
    <span className="timeline-node muted" aria-hidden="true" />
    <SectionHeading id="this-week-title" title="This week" hint="A quick look at your execution." />
    <div className="week-scroll" tabIndex={0} aria-label="Weekly focus summary">
      <ol className="week-list">
        {days.map((day) => (
          <li key={day.date} className={day.date === currentDate ? "today" : undefined}>
            <span className="weekday">{formatWeekday(day.date)}</span>
            <span className="week-date">{formatShortDate(day.date)}</span>
            <StatusMark status={day.status} />
            <span className={day.hours === null ? "week-hours empty" : "week-hours"}>
              {day.hours === null ? "–" : `${day.hours.toFixed(1)}h`}
            </span>
          </li>
        ))}
      </ol>
    </div>
    <ul className="week-legend" aria-label="Status legend">
      {(["completed", "partial", "not-started", "no-entry"] as WeekStatus[]).map((status) => (
        <li key={status}>
          {status === "no-entry" ? <span className="legend-dash">–</span> : <StatusMark status={status} />}
          <span>{statusLabel[status]}</span>
        </li>
      ))}
    </ul>
  </section>
);
