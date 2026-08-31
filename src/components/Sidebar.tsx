import { CalendarIcon, NotionIcon, PlusIcon } from "../icons";
import { describeRelativeDate, formatShortDate } from "../date";
import type { BlockerReason, DataSource, UpcomingNote } from "../types";

interface SidebarProps {
  notes: UpcomingNote[];
  blockers: BlockerReason[];
  currentDate: string;
  dataSource: DataSource;
  notionMessage: string;
  onAddNote: () => void;
  onAddReason: () => void;
  onSourceChange: (source: DataSource) => void;
}

export const Sidebar = ({
  notes,
  blockers,
  currentDate,
  dataSource,
  notionMessage,
  onAddNote,
  onAddReason,
  onSourceChange,
}: SidebarProps) => {
  const maxCount = Math.max(1, ...blockers.map((reason) => reason.count));

  return (
    <aside className="sidebar" aria-label="Notes, blockers, and data source">
      <section className="sidebar-section upcoming" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title">Upcoming notes</h2>
        <p>Your plan for the next couple of days.</p>
        <ul className="note-list">
          {notes.map((note) => (
            <li key={note.id}>
              <span className="calendar-box"><CalendarIcon /></span>
              <span>
                <strong>{formatShortDate(note.date)}</strong>
                <small>{note.note || describeRelativeDate(note.date, currentDate)}</small>
              </span>
            </li>
          ))}
        </ul>
        {dataSource === "demo" ? (
          <button type="button" className="text-button" onClick={onAddNote}>
            <PlusIcon size={18} /> Add note
          </button>
        ) : null}
      </section>

      <section className="sidebar-section blockers" aria-labelledby="blockers-title">
        <h2 id="blockers-title">What got in the way</h2>
        <p>Top reasons tasks didn’t get done.</p>
        <ul className="blocker-list">
          {blockers.map((reason) => (
            <li key={reason.id}>
              <span>{reason.label}</span>
              <span className="reason-track" aria-hidden="true">
                <span style={{ width: `${(reason.count / maxCount) * 68}%` }} />
              </span>
              <strong aria-label={`${reason.count} occurrences`}>{reason.count}</strong>
            </li>
          ))}
        </ul>
        {dataSource === "demo" ? (
          <button type="button" className="text-button" onClick={onAddReason}>
            <PlusIcon size={18} /> Add reason
          </button>
        ) : null}
      </section>

      <section className="data-source-card" aria-labelledby="data-source-title">
        <h2 id="data-source-title">Data source</h2>
        <p>{dataSource === "demo" ? "Your data is saved locally." : notionMessage}</p>
        <button
          type="button"
          className="source-choice"
          aria-pressed={dataSource === "demo"}
          onClick={() => onSourceChange("demo")}
        >
          <span className={`radio-mark ${dataSource === "demo" ? "selected" : ""}`} aria-hidden="true" />
          <span><strong>Demo data (offline)</strong><small>Explore Focus Log with sample data.</small></span>
        </button>
        <button
          type="button"
          className="source-choice"
          aria-pressed={dataSource === "notion"}
          onClick={() => onSourceChange("notion")}
        >
          <span className={`radio-mark ${dataSource === "notion" ? "selected" : ""}`} aria-hidden="true" />
          <span><strong>Connect Notion</strong><small>Read your daily notes and tasks.</small></span>
          <NotionIcon />
        </button>
      </section>
    </aside>
  );
};
