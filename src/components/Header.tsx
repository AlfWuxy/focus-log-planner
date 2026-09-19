import { useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCheck, Home, ListTodo } from "lucide-react";
import {
  ChevronDownIcon, DatabaseIcon, GearIcon, MenuIcon, NotionIcon, PencilIcon,
} from "../icons";
import type { DataSource } from "../types";

interface HeaderProps {
  dataSource: DataSource;
  canEdit: boolean;
  saved: boolean;
  onSourceChange: (source: DataSource) => void;
  onEdit: () => void;
  onSettings: () => void;
}

const sections = [
  { id: "main-content", label: "Today", Icon: Home },
  { id: "this-week", label: "This week", Icon: CalendarDays },
  { id: "upcoming", label: "Upcoming", Icon: ListTodo },
];

export const Header = ({ dataSource, canEdit, saved, onSourceChange, onEdit, onSettings }: HeaderProps) => {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.slice(1);
    return sections.some((section) => section.id === hash) ? hash : "main-content";
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const sourceTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateSection = () => {
      const hash = window.location.hash.slice(1);
      setActiveSection(sections.some((section) => section.id === hash) ? hash : "main-content");
    };
    window.addEventListener("hashchange", updateSection);
    return () => window.removeEventListener("hashchange", updateSection);
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setSourceOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (sourceOpen) sourceTriggerRef.current?.focus();
      if (mobileOpen) mobileTriggerRef.current?.focus();
      setSourceOpen(false);
      setMobileOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen, sourceOpen]);

  const chooseSource = (source: DataSource) => {
    // 弹窗关闭后，焦点应回到仍在页面中的菜单按钮。
    if (mobileOpen) mobileTriggerRef.current?.focus();
    else if (sourceOpen) sourceTriggerRef.current?.focus();
    setSourceOpen(false);
    setMobileOpen(false);
    onSourceChange(source);
  };

  return (
    <>
      <header className="app-header">
        <a className="brand" href="#main-content" aria-label="Focus Log home" onClick={() => setActiveSection("main-content")}>
          <span className="app-icon"><CheckCheck size={27} strokeWidth={2.1} /></span>
          <span className="brand-block"><strong>Focus Log</strong><small>A little clarity, every day.</small></span>
        </a>
        <div className="header-actions" aria-label="App actions">
          <div className="source-menu" ref={menuRef}>
            <button ref={sourceTriggerRef} type="button" className="button secondary source-trigger" aria-expanded={sourceOpen} aria-controls="source-choices" onClick={() => setSourceOpen((open) => !open)}>
              {dataSource === "demo" ? <DatabaseIcon size={17} /> : <NotionIcon size={17} />}
              <span>{dataSource === "demo" ? "Demo data" : "Notion"}</span><ChevronDownIcon size={16} />
            </button>
            {sourceOpen ? (
              <div id="source-choices" className="popover-menu" role="group" aria-label="Choose data source">
                <button type="button" aria-pressed={dataSource === "demo"} onClick={() => chooseSource("demo")}>
                  <DatabaseIcon /><span><strong>Demo data</strong><small>Saved in this browser</small></span>
                </button>
                <button type="button" aria-pressed={dataSource === "notion"} onClick={() => chooseSource("notion")}>
                  <NotionIcon /><span><strong>Connect Notion</strong><small>Read-only connection</small></span>
                </button>
              </div>
            ) : null}
          </div>
          <button type="button" className="button primary" onClick={onEdit} disabled={!canEdit} title={canEdit ? undefined : "Notion mode is read-only"}>
            <PencilIcon size={17} /><span>Edit day</span>
          </button>
        </div>
        <button ref={mobileTriggerRef} type="button" className="mobile-menu-button icon-button" aria-label="Open app menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}><MenuIcon size={23} /></button>
        {mobileOpen ? (
          <nav className="mobile-menu" aria-label="App menu">
            <p className="mobile-menu-label">Data source</p>
            <button type="button" aria-current={dataSource === "demo" ? "true" : undefined} onClick={() => chooseSource("demo")}><DatabaseIcon /> Demo data</button>
            <button type="button" aria-current={dataSource === "notion" ? "true" : undefined} onClick={() => chooseSource("notion")}><NotionIcon /> Connect Notion</button>
          </nav>
        ) : null}
      </header>
      <aside className="navigation-rail" aria-label="Workspace navigation">
        <nav className="section-navigation" aria-label="Planner sections">
          {sections.map(({ id, label, Icon }) => (
            <a key={id} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined} onClick={() => setActiveSection(id)}><Icon size={21} strokeWidth={1.7} /><span>{label}</span></a>
          ))}
          <button type="button" onClick={onSettings}><GearIcon size={21} /><span>Settings</span></button>
        </nav>
        <div className="rail-bottom">
          <div className="local-status"><DatabaseIcon size={17} /><span>{dataSource === "notion" ? "Read-only view" : saved ? "Saved locally" : "Save unavailable"}</span><span className={saved ? "status-dot" : "status-dot error"} /></div>
          <button type="button" className="rail-source" onClick={onSettings}><span>Data source</span><strong>{dataSource === "demo" ? "Local" : "Notion"}</strong><ChevronDownIcon size={15} /></button>
        </div>
      </aside>
    </>
  );
};
