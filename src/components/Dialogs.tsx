import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CloseIcon } from "../icons";
import type { DataSource, TaskItem } from "../types";

interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  size?: "normal" | "wide";
}

const Modal = ({ title, description, onClose, children, size = "normal" }: ModalProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusableElements = () => Array.from(panel?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]',
    ) ?? []).filter((element) => !element.closest('[hidden]'));
    (panel?.querySelector<HTMLElement>('input:not(:disabled)') ?? focusableElements()[0] ?? headingRef.current)?.focus();

    // 限制键盘焦点在弹窗内，同时保留 Escape 和关闭后的焦点位置。
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const elements = focusableElements();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first) {
        event.preventDefault();
        headingRef.current?.focus();
      } else if (event.shiftKey && (document.activeElement === first || !elements.includes(document.activeElement as HTMLElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !elements.includes(document.activeElement as HTMLElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        ref={panelRef}
        className={`modal-panel ${size === "wide" ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title" ref={headingRef} tabIndex={-1}>{title}</h2>
            {description ? <p id="modal-description">{description}</p> : null}
          </div>
          <button type="button" className="icon-button close-button" onClick={onClose} aria-label="Close dialog">
            <CloseIcon />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
};

interface EditDayDialogProps {
  tasks: TaskItem[];
  nextAction: string;
  focusHours: number;
  focusGoal: number;
  onClose: () => void;
  onSave: (value: { tasks: string[]; nextAction: string; focusHours: number }) => void;
}

export const EditDayDialog = ({
  tasks,
  nextAction,
  focusHours,
  focusGoal,
  onClose,
  onSave,
}: EditDayDialogProps) => {
  const [taskValues, setTaskValues] = useState(() => tasks.map((task) => task.text));
  const [actionValue, setActionValue] = useState(nextAction);
  const [hoursValue, setHoursValue] = useState(focusHours);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      tasks: taskValues.map((value) => value.trim()).filter(Boolean),
      nextAction: actionValue.trim(),
      focusHours: hoursValue,
    });
  };

  return (
    <Modal
      title="Edit day"
      description="Keep today small enough to finish and specific enough to start."
      onClose={onClose}
      size="wide"
    >
      <form className="modal-form" onSubmit={submit}>
        <fieldset>
          <legend>Big 3</legend>
          <p className="field-hint">Your three most important outcomes.</p>
          {[0, 1, 2].map((index) => (
            <label className="numbered-field" key={index}>
              <span>{index + 1}</span>
              <input
                value={taskValues[index] ?? ""}
                onChange={(event) => setTaskValues((values) => {
                  const next = [...values];
                  next[index] = event.target.value;
                  return next;
                })}
                placeholder={`Outcome ${index + 1}`}
                aria-label={`Big 3 outcome ${index + 1}`}
              />
            </label>
          ))}
        </fieldset>
        <label className="field-block">
          <span>Next action</span>
          <input
            value={actionValue}
            onChange={(event) => setActionValue(event.target.value)}
            placeholder="The next visible step"
          />
        </label>
        <label className="field-block">
          <span>Focus hours</span>
          <input
            type="number"
            min="0"
            max={focusGoal}
            step="0.5"
            value={hoursValue}
            onChange={(event) => setHoursValue(Math.min(focusGoal, Math.max(0, Number(event.target.value))))}
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button primary">Save day</button>
        </div>
      </form>
    </Modal>
  );
};

interface AddNoteDialogProps {
  defaultDate: string;
  onClose: () => void;
  onSave: (date: string, note: string) => void;
}

export const AddNoteDialog = ({ defaultDate, onClose, onSave }: AddNoteDialogProps) => {
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  return (
    <Modal title="Add upcoming note" description="Leave a short cue for a future day." onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => {
        event.preventDefault();
        onSave(date, note.trim());
      }}>
        <label className="field-block">
          <span>Date</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </label>
        <label className="field-block">
          <span>Note</span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What should future-you remember?"
            required
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button primary">Add note</button>
        </div>
      </form>
    </Modal>
  );
};

interface AddReasonDialogProps {
  onClose: () => void;
  onSave: (label: string, count: number) => void;
}

export const AddReasonDialog = ({ onClose, onSave }: AddReasonDialogProps) => {
  const [label, setLabel] = useState("");
  const [count, setCount] = useState(1);
  return (
    <Modal title="Add a blocker" description="Name the friction so you can design around it." onClose={onClose}>
      <form className="modal-form" onSubmit={(event) => {
        event.preventDefault();
        onSave(label.trim(), count);
      }}>
        <label className="field-block">
          <span>Reason</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="What got in the way?"
            required
          />
        </label>
        <label className="field-block">
          <span>Times this week</span>
          <input
            type="number"
            min="1"
            max="9"
            value={count}
            onChange={(event) => setCount(Math.max(1, Number(event.target.value)))}
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button primary">Add reason</button>
        </div>
      </form>
    </Modal>
  );
};

interface NotionAccessDialogProps {
  localAvailable: boolean;
  onClose: () => void;
  onConnect: (token: string) => void;
}

export const NotionAccessDialog = ({
  localAvailable,
  onClose,
  onConnect,
}: NotionAccessDialogProps) => {
  const [token, setToken] = useState("");

  return (
    <Modal
      title="Connect Notion"
      description={localAvailable
        ? "Pair this tab with the read-only server running on your Mac."
        : "The public demo does not host a Notion server."}
      onClose={onClose}
    >
      {localAvailable ? (
        <form className="modal-form" onSubmit={(event) => {
          event.preventDefault();
          onConnect(token.trim());
        }}>
          <label className="field-block">
            <span>Local access key</span>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              minLength={32}
              autoComplete="off"
              spellCheck={false}
              aria-describedby="local-access-key-hint"
                required
            />
          </label>
          <p className="field-hint" id="local-access-key-hint">
            Use the separate <code>FOCUS_LOG_LOCAL_TOKEN</code> from <code>.env.local</code>.
            It stays in this browser tab and is cleared when the tab session ends.
          </p>
          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button primary">Connect read-only</button>
          </div>
        </form>
      ) : (
        <div className="settings-content">
          <p>
            Clone the repository, configure <code>.env.local</code>, and run <code>npm run dev:notion</code>
            to connect personal data. No access key is sent from GitHub Pages.
          </p>
          <div className="modal-actions">
            <button type="button" className="button primary" onClick={onClose}>Close</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

interface SettingsDialogProps {
  dataSource: DataSource;
  notionMessage: string;
  onSourceChange: (source: DataSource) => void;
  onReset: () => void;
  onClose: () => void;
}

export const SettingsDialog = ({
  dataSource,
  notionMessage,
  onSourceChange,
  onReset,
  onClose,
}: SettingsDialogProps) => {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <Modal title="Settings" description="Choose where Focus Log reads and saves your data." onClose={onClose}>
      <div className="settings-content">
        <fieldset className="source-settings">
          <legend>Data source</legend>
          <label>
            <input
              type="radio"
              name="source"
              checked={dataSource === "demo"}
              onChange={() => onSourceChange("demo")}
            />
            <span><strong>Demo data</strong><small>Private to this browser and available offline.</small></span>
          </label>
          <label>
            <input
              type="radio"
              name="source"
              checked={dataSource === "notion"}
              onChange={() => onSourceChange("notion")}
            />
            <span><strong>Notion</strong><small>{notionMessage}</small></span>
          </label>
        </fieldset>
        <div className="settings-reset">
          <div>
            <strong>Reset local demo</strong>
            <p>Restore the sample day and remove your browser-only edits.</p>
          </div>
          <button
            type="button"
            className={confirmReset ? "button danger" : "button secondary"}
            onClick={() => {
              if (confirmReset) onReset();
              else setConfirmReset(true);
            }}
          >
            {confirmReset ? "Confirm reset" : "Reset"}
          </button>
        </div>
      </div>
    </Modal>
  );
};
