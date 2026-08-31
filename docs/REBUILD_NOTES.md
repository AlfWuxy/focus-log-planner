# Origin and rebuild notes

## Background

Focus Log began as a personal local dashboard concept for answering two questions: what deserves attention today, and what can the past week teach me? A local HTML artifact was recovered on macOS and used to reconstruct the product intent.

The recovered artifact depended on a private workspace connector and embedded workspace-specific references. Publishing that file directly would have created privacy, portability, and maintainability problems. The open-source project is a fresh React and TypeScript implementation centered on a safe demo.

## What informed the rebuild

- The daily hierarchy: Big 3, next action, and focus hours.
- A compact seven-day execution view.
- Upcoming planning notes.
- A summary of repeated unfinished reasons.
- A calm desktop dashboard that remains usable on a narrow phone screen.
- A visible choice between demo data and an optional personal source.

The visual concept images are kept in `docs/images/concept-desktop.png` and `docs/images/concept-mobile.png`. Release screenshots use synthetic content and are linked from the README.

## What the public repository excludes

- Real daily logs and personal notes.
- Notion tokens and copied authorization headers.
- Database, view, page, workspace, MCP server, and user identifiers.
- Private URLs and live query results.
- The recovered HTML and its version history.
- Any screenshot or test trace containing private workspace content.

The local `private-archive/` directory is intentionally ignored by Git and is not part of the distributable application.

## Rebuild decisions

| Decision | Reason |
| --- | --- |
| Demo data is the default | Anyone can inspect and share the app safely |
| Browser persistence is local | The static demo needs no account or hosted database |
| React, TypeScript, and Vite | The UI stays approachable, testable, and deployable to Pages |
| Notion runs through an optional server | Tokens never enter the browser bundle |
| Notion support is read-only | The dashboard cannot alter a personal workspace |
| External fields are normalized | UI code has no dependency on private database IDs or raw API shapes |
| CI includes browser tests | Responsive interactions are part of the product contract |

## Reproducibility checklist

A public build is considered clean when:

1. A fresh clone installs with `npm ci` on Node.js 22.
2. `npm run check` passes without an `.env` file.
3. Playwright Chromium passes in demo mode.
4. `npm run build` produces a static app under `dist/`.
5. The built files contain no private identifier, URL, token, or real journal text.
6. GitHub Pages works without the optional server.
7. Repository screenshots show fictional demo data only.

## Name and license

The public project is named **Focus Log** and the proposed repository slug is `focus-log-planner`. The source and documentation are released under the MIT License.
