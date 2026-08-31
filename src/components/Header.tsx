import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  DatabaseIcon,
  GearIcon,
  MenuIcon,
  NotionIcon,
  PencilIcon,
} from "../icons";
import type { DataSource } from "../types";

interface HeaderProps {
  dataSource: DataSource;
  canEdit: boolean;
  onSourceChange: (source: DataSource) => void;
  onEdit: () => void;
  onSettings: () => void;
}

export const Header = ({
  dataSource,
  canEdit,
  onSourceChange,
  onEdit,
  onSettings,
}: HeaderProps) => {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setSourceOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSourceOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const chooseSource = (source: DataSource) => {
    onSourceChange(source);
    setSourceOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="app-header">
      <div className="brand-block">
        <a className="brand" href="#main-content" aria-label="Focus Log home">
          Focus Log
        </a>
        <p>Plan the day. Learn from the week.</p>
      </div>

      <div className="header-actions" aria-label="App actions">
        <div className="source-menu" ref={menuRef}>
          <button
            type="button"
            className="button secondary source-trigger"
            aria-haspopup="menu"
            aria-expanded={sourceOpen}
            onClick={() => setSourceOpen((open) => !open)}
          >
            {dataSource === "demo" ? <DatabaseIcon /> : <NotionIcon />}
            <span>{dataSource === "demo" ? "Demo data" : "Notion"}</span>
            <ChevronDownIcon />
          </button>
          {sourceOpen ? (
            <div className="popover-menu" role="menu" aria-label="Choose data source">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={dataSource === "demo"}
                onClick={() => chooseSource("demo")}
              >
                <DatabaseIcon />
                <span><strong>Demo data</strong><small>Saved in this browser</small></span>
              </button>
              <button
                type="button"
                role="menuitemradio"
                aria-checked={dataSource === "notion"}
                onClick={() => chooseSource("notion")}
              >
                <NotionIcon />
                <span><strong>Notion</strong><small>Read from your workspace</small></span>
              </button>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="button secondary"
          onClick={() => chooseSource("notion")}
        >
          <NotionIcon />
          <span>Connect Notion</span>
        </button>
        <button
          type="button"
          className="button primary"
          onClick={onEdit}
          disabled={!canEdit}
          title={canEdit ? undefined : "Notion mode is read-only"}
        >
          <PencilIcon />
          <span>Edit day</span>
        </button>
      </div>

      <button
        type="button"
        className="mobile-menu-button"
        aria-label="Open app menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        <MenuIcon />
      </button>

      {mobileOpen ? (
        <nav className="mobile-menu" aria-label="App menu">
          <p className="mobile-menu-label">Data source</p>
          <button
            type="button"
            aria-current={dataSource === "demo" ? "true" : undefined}
            onClick={() => chooseSource("demo")}
          >
            <DatabaseIcon /> Demo data
          </button>
          <button
            type="button"
            aria-current={dataSource === "notion" ? "true" : undefined}
            onClick={() => chooseSource("notion")}
          >
            <NotionIcon /> Connect Notion
          </button>
          <button type="button" onClick={() => { setMobileOpen(false); onSettings(); }}>
            <GearIcon /> Settings
          </button>
        </nav>
      ) : null}
    </header>
  );
};
