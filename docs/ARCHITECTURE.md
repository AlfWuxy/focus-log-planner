# Architecture

Focus Log separates a static, demo-first interface from an optional read-only integration. This keeps the public demo simple and places credentials behind a server boundary.

## System map

```text
┌──────────────────────────────────────────────────────────┐
│ Browser                                                  │
│ React UI -> data-source interface -> demo storage        │
│          -> tab-scoped access key -> optional local API  │
└──────────────────────────────────────────┬───────────────┘
                                           │ read-only JSON
┌──────────────────────────────────────────▼───────────────┐
│ Optional local server on 127.0.0.1:8787                │
│ exact origin + key + date -> normalization -> errors   │
└──────────────────────────────────────────┬───────────────┘
                                           │ HTTPS, token stays here
┌──────────────────────────────────────────▼───────────────┐
│ Notion API, version 2026-03-11                          │
└──────────────────────────────────────────────────────────┘
```

## Runtime modes

### Demo mode

The React application loads synthetic fixtures and persists edits in browser storage. It makes no Notion request and needs no backend. This is the mode deployed to GitHub Pages.

### Notion mode

The user enters a separate `FOCUS_LOG_LOCAL_TOKEN` in the local connection dialog. The browser keeps that key in tab-scoped `sessionStorage` and sends it in `X-Focus-Log-Token` when calling `GET /api/notion/focus-log?date=YYYY-MM-DD`. The React client enables this path only at the exact origin `http://127.0.0.1:5173`. Before proxying, Vite requires same-origin browser fetch metadata and a matching referrer, then forwards the key and writes the canonical Origin. The server verifies the exact Origin and key before it reads configuration or contacts Notion. It queries the Daily and Notes data sources in parallel, selects the fields needed by the dashboard, and returns normalized JSON.

The Notion integration token is never sent to React. The local access key authenticates calls to this loopback API and must remain separate from the Notion token. Browser fetch metadata adds defense against a page on another local origin; it is not an authentication credential. No Notion write endpoint exists in the application contract. The server calls only `POST /v1/data_sources/{id}/query`, which is Notion's read query operation.

## Repository boundaries

| Area | Responsibility |
| --- | --- |
| `src/` | React interface, view models, demo data, and browser-side persistence |
| `server/` | Optional environment validation and read-only Notion adapter |
| `tests/` | Browser-level scenarios and user-visible regressions |
| `docs/` | Public architecture, privacy, setup, and provenance notes |
| `.github/` | CI, Pages deployment, and community templates |

## Data contract

The interface works with a small planning model:

- Date and day label.
- Up to three priority outcomes and completion state.
- One next action and completion state.
- Focus hours and target.
- Daily execution state for the seven-day overview.
- Upcoming note titles and dates.
- Aggregated unfinished-reason labels and counts.

The adapter owns any mapping from external property names into this model. Components remain independent from Notion data-source IDs and raw API response shapes. The normalized Notion response contains a requested date, `daily` and `notes` arrays, the source label, and item counts. Entries contain selected text, status, tags, sanitized Notion URLs, and timestamps.

## Deployment

The production build is a static Vite bundle. Under GitHub Actions, Vite uses `/focus-log-planner/` as its base path. The Pages workflow uploads `dist/` and deploys it through GitHub's official Pages actions.

The Notion server is absent from the Pages artifact. The public app refuses to send a local access key from a non-loopback origin. A contributor who needs Notion mode runs the server locally or deploys a separately designed service with appropriate authentication, secret storage, and network controls.

## Failure behavior

- Demo mode remains usable when Notion is unavailable.
- A missing or short local server key produces a setup error before Notion configuration is read.
- A missing or incorrect request key produces `401` before Notion is contacted.
- Missing Notion configuration produces a clear setup error before any request leaves the machine.
- The server validates calendar dates and permits only the fixed local frontend origin.
- Responses use `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Upstream errors are normalized and do not expose tokens or raw private responses.
- The interface identifies its active data source so users know whether they are viewing demo or Notion data.

## Design constraints

- Static demo remains the primary public experience.
- All public fixtures and screenshots use fictional content.
- External integrations stay replaceable behind the data-source interface.
- Accessibility and small-screen behavior are release requirements.
- Read-only means no create, update, archive, or delete operation against Notion.
