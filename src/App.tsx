import { useCallback, useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { BigThree, FocusHours, NextActionSection, ThisWeek } from "./components/DaySections";
import { Sidebar } from "./components/Sidebar";
import {
  AddNoteDialog,
  AddReasonDialog,
  EditDayDialog,
  NotionAccessDialog,
  SettingsDialog,
} from "./components/Dialogs";
import { addDays, describeRelativeDate, formatLongDate } from "./date";
import { createDemoState, makeId } from "./data";
import { GearIcon, PencilIcon } from "./icons";
import {
  fetchNotionFocusLog,
  isLoopbackNotionOrigin,
  isValidLocalAccessToken,
  loadLocalAccessToken,
  parseNotionBigThree,
  parseNotionReasons,
  saveLocalAccessToken,
} from "./notion";
import { clearFocusLog, loadFocusLog, saveFocusLog } from "./storage";
import type { DataSource, FocusLogState } from "./types";

type OpenDialog = "edit" | "note" | "notion" | "reason" | "settings" | null;
type NotionStatus = "idle" | "loading" | "connected" | "error";

export default function App() {
  const [state, setState] = useState<FocusLogState>(() => ({
    ...loadFocusLog(),
    dataSource: "demo",
  }));
  const demoSnapshot = useRef<FocusLogState>(state);
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [saved, setSaved] = useState(true);
  const [notionStatus, setNotionStatus] = useState<NotionStatus>("idle");
  const [notionMessage, setNotionMessage] = useState("Connect to read daily notes and tasks.");

  useEffect(() => {
    if (state.dataSource === "demo") {
      demoSnapshot.current = state;
      setSaved(saveFocusLog(state));
    }
  }, [state]);

  const connectNotion = useCallback(async (date: string, localAccessToken: string) => {
    setNotionStatus("loading");
    setNotionMessage("Connecting to Notion…");
    try {
      const response = await fetchNotionFocusLog(date, undefined, localAccessToken);
      setNotionStatus("connected");
      setNotionMessage(
        `Connected · ${response.meta.dailyCount} daily entr${response.meta.dailyCount === 1 ? "y" : "ies"} · ${response.meta.notesCount} note${response.meta.notesCount === 1 ? "" : "s"}`,
      );
      setState((current) => {
        const daily = response.daily[0];
        const planLines = parseNotionBigThree(daily?.bigThree || daily?.plan || "");
        const result = daily?.result || daily?.status || "";
        const dailyDone = /^(?:done|complete|completed|success)$/i.test(result);
        const weeklyStatus = dailyDone
          ? "completed"
          : daily
            ? "partial"
            : undefined;
        const nextAction = daily?.nextAction || daily?.focus || "";
        const focusHours = daily?.focusHours ?? Number(daily?.progress);
        const reasons = parseNotionReasons(daily?.reason || "");

        return {
          ...current,
          bigThree: planLines.length > 0
            ? planLines.map((text, index) => ({
              id: `notion-${daily.id}-${index}`,
              text,
              completed: dailyDone,
            }))
            : current.bigThree,
          nextAction: nextAction
            ? { text: nextAction, completed: dailyDone }
            : current.nextAction,
          focusHours: Number.isFinite(focusHours)
            ? Math.min(current.focusGoal, Math.max(0, focusHours))
            : current.focusHours,
          week: weeklyStatus
            ? current.week.map((day) => day.date === response.date
              ? {
                ...day,
                status: weeklyStatus,
                hours: Number.isFinite(focusHours) ? focusHours : day.hours,
              }
              : day)
            : current.week,
          upcomingNotes: response.notes.length > 0
            ? response.notes
              .filter((note) => note.date >= current.date)
              .slice(0, 5)
              .map((note) => ({
                id: note.id,
                date: note.date,
                note: note.title || note.content || describeRelativeDate(note.date, current.date),
              }))
            : current.upcomingNotes,
          blockers: reasons.length > 0
            ? reasons.map((label, index) => ({
              id: `notion-reason-${index}`,
              label,
              count: 1,
            }))
            : current.blockers,
          dataSource: "notion",
        };
      });
    } catch (error) {
      setState((current) => current.dataSource === "notion"
        ? { ...demoSnapshot.current, dataSource: "demo" }
        : current);
      setNotionStatus("error");
      setNotionMessage(
        error instanceof Error
          ? `Notion is unavailable. ${error.message}`
          : "Notion is unavailable. Demo data is still safe locally.",
      );
    }
  }, []);

  const activateNotion = useCallback((localAccessToken: string) => {
    if (state.dataSource === "demo") demoSnapshot.current = state;
    setDialog(null);
    void connectNotion(state.date, localAccessToken);
  }, [connectNotion, state]);

  const changeSource = useCallback((dataSource: DataSource) => {
    if (dataSource === "notion") {
      const localAccessToken = loadLocalAccessToken();
      if (!isLoopbackNotionOrigin() || !isValidLocalAccessToken(localAccessToken)) {
        setDialog("notion");
        return;
      }
      activateNotion(localAccessToken);
    } else {
      setState({ ...demoSnapshot.current, dataSource: "demo" });
      setNotionStatus("idle");
      setNotionMessage("Connect to read daily notes and tasks.");
    }
  }, [activateNotion]);

  const updateTask = (id: string, completed: boolean) => {
    setState((current) => ({
      ...current,
      bigThree: current.bigThree.map((task) => task.id === id ? { ...task, completed } : task),
    }));
  };

  const moveTask = (id: string) => {
    setState((current) => {
      const index = current.bigThree.findIndex((task) => task.id === id);
      if (index < 0 || current.bigThree.length < 2) return current;
      const next = [...current.bigThree];
      const target = index === next.length - 1 ? 0 : index + 1;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { ...current, bigThree: next };
    });
  };

  const saveEditedDay = (value: { tasks: string[]; nextAction: string; focusHours: number }) => {
    setState((current) => ({
      ...current,
      bigThree: value.tasks.slice(0, 3).map((text, index) => ({
        id: current.bigThree[index]?.id ?? makeId("big"),
        text,
        completed: current.bigThree[index]?.completed ?? false,
      })),
      nextAction: { ...current.nextAction, text: value.nextAction },
      focusHours: value.focusHours,
    }));
    setDialog(null);
  };

  const resetDemo = () => {
    clearFocusLog();
    const demo = createDemoState();
    demoSnapshot.current = demo;
    setState(demo);
    setNotionStatus("idle");
    setNotionMessage("Connect to read daily notes and tasks.");
    setDialog(null);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header
        dataSource={state.dataSource}
        canEdit={state.dataSource === "demo"}
        onSourceChange={changeSource}
        onEdit={() => setDialog("edit")}
        onSettings={() => setDialog("settings")}
      />

      <main id="main-content" className="dashboard">
        <div className="primary-column">
          <div className="day-heading">
            <div>
              <p>Today</p>
              <h1>{formatLongDate(state.date)}</h1>
            </div>
            <button
              type="button"
              className="button primary mobile-edit"
              onClick={() => setDialog("edit")}
              disabled={state.dataSource !== "demo"}
              title={state.dataSource === "demo" ? undefined : "Notion mode is read-only"}
            >
              <PencilIcon /> Edit day
            </button>
          </div>

          <div className="timeline">
            <BigThree
              tasks={state.bigThree}
              onToggle={updateTask}
              onMove={moveTask}
              onEdit={() => setDialog("edit")}
              readOnly={state.dataSource === "notion"}
            />
            <NextActionSection
              text={state.nextAction.text}
              completed={state.nextAction.completed}
              onToggle={(completed) => setState((current) => ({
                ...current,
                nextAction: { ...current.nextAction, completed },
              }))}
              onEdit={() => setDialog("edit")}
              readOnly={state.dataSource === "notion"}
            />
            <FocusHours
              hours={state.focusHours}
              goal={state.focusGoal}
              onChange={(focusHours) => setState((current) => ({ ...current, focusHours }))}
              readOnly={state.dataSource === "notion"}
            />
            <ThisWeek days={state.week} currentDate={state.date} />
          </div>
        </div>

        <Sidebar
          notes={state.upcomingNotes}
          blockers={state.blockers}
          currentDate={state.date}
          dataSource={state.dataSource}
          notionMessage={notionMessage}
          onAddNote={() => setDialog("note")}
          onAddReason={() => setDialog("reason")}
          onSourceChange={changeSource}
        />
      </main>

      <footer className="app-footer">
        <span className={saved ? "save-status saved" : "save-status"}>
          <span aria-hidden="true" /> {saved ? "Saved locally" : "Local save unavailable"}
        </span>
        <button type="button" onClick={() => setDialog("settings")}>
          <GearIcon /> Settings
        </button>
      </footer>

      <div className="sr-only" role="status" aria-live="polite">
        {notionStatus === "loading" ? "Connecting to Notion" : notionMessage}
      </div>

      {dialog === "edit" ? (
        <EditDayDialog
          tasks={state.bigThree}
          nextAction={state.nextAction.text}
          focusHours={state.focusHours}
          focusGoal={state.focusGoal}
          onClose={() => setDialog(null)}
          onSave={saveEditedDay}
        />
      ) : null}
      {dialog === "note" ? (
        <AddNoteDialog
          defaultDate={addDays(state.date, 1)}
          onClose={() => setDialog(null)}
          onSave={(date, note) => {
            setState((current) => ({
              ...current,
              upcomingNotes: [...current.upcomingNotes, { id: makeId("note"), date, note }]
                .sort((a, b) => a.date.localeCompare(b.date)),
            }));
            setDialog(null);
          }}
        />
      ) : null}
      {dialog === "reason" ? (
        <AddReasonDialog
          onClose={() => setDialog(null)}
          onSave={(label, count) => {
            setState((current) => ({
              ...current,
              blockers: [...current.blockers, { id: makeId("reason"), label, count }],
            }));
            setDialog(null);
          }}
        />
      ) : null}
      {dialog === "notion" ? (
        <NotionAccessDialog
          localAvailable={isLoopbackNotionOrigin()}
          onClose={() => setDialog(null)}
          onConnect={(token) => {
            const localAccessToken = saveLocalAccessToken(token);
            if (localAccessToken) activateNotion(localAccessToken);
          }}
        />
      ) : null}
      {dialog === "settings" ? (
        <SettingsDialog
          dataSource={state.dataSource}
          notionMessage={notionMessage}
          onSourceChange={changeSource}
          onReset={resetDemo}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
