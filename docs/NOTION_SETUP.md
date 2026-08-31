# Optional read-only Notion setup

The public demo needs no Notion account. Use this guide only when you want to view your own planning data through a local server.

## Security boundary

The integration token belongs in the server environment. Never prefix it with `VITE_`, place it in client code, paste it into an issue, or commit it. Focus Log also requires a separate local access key so an unrelated localhost client cannot use the server as a Notion broker. The Notion path is read-only and uses `Notion-Version: 2026-03-11`.

## 1. Create a Notion integration

1. Open Notion's integrations settings.
2. Create an internal integration for a development or personal workspace.
3. Grant read-content capability only.
4. Copy the token into a temporary password manager entry.

## 2. Share only the needed database

Open each planning data source in Notion and add the integration through the page's connection settings. Focus Log reads one Daily data source and one Notes data source. Share the narrowest possible page tree. Separate data sources with fictional rows are safest for development and screenshots.

## 3. Configure the local server

Copy the committed template:

```bash
cp .env.example .env.local
```

Set these required values:

```dotenv
NOTION_TOKEN=
NOTION_DAILY_DATA_SOURCE_ID=
NOTION_NOTES_DATA_SOURCE_ID=
FOCUS_LOG_LOCAL_TOKEN=
```

Generate a dedicated local access key with at least 32 characters, then paste the result into `FOCUS_LOG_LOCAL_TOKEN`:

```bash
openssl rand -hex 32
```

Do not reuse the Notion integration token. The local access key is entered into the Focus Log connection dialog, stored only in the current tab's `sessionStorage`, and sent to the loopback API as a request header.

Keep `.env.local` local. Focus Log's `.gitignore` excludes `.env` and all `.env.*` variants except the example template.

The example also lists optional property mappings. The default Daily schema uses `Day`, `Date`, `Big 3`, `Focus Hours`, `Result`, `Unfinished?`, `Reason`, and `Next Action`. Compatibility mappings are available for `FOCUS`, `PLAN`, `PROGRESS`, `REFLECTION`, `STATUS`, `TAGS`, and `URL`. Notes defaults to `Name` and `日期`, with optional `CONTENT`, `STATUS`, `TAGS`, and `URL`. Each environment variable follows this pattern:

```dotenv
NOTION_DAILY_BIG_THREE_FIELD=Big 3
NOTION_NOTES_CONTENT_FIELD=Content
```

`PORT` is optional and defaults to `8787`.

Database configuration is deployment-specific. Never reuse IDs from screenshots, archived HTML, sample logs, or another person's workspace.

## 4. Start both processes

```bash
npm ci
npm run dev:notion
```

The command starts the local API on `http://127.0.0.1:8787` and the Vite development server on the fixed origin `http://127.0.0.1:5173`. Open that exact Vite address, select the Notion source, and enter `FOCUS_LOG_LOCAL_TOKEN` in the connection dialog.

## 5. Verify the boundary

- Confirm the browser developer tools contain no Notion token.
- Confirm the Network panel calls `/api/notion/focus-log?date=YYYY-MM-DD`, includes only the separate local access key, and never calls `api.notion.com` directly.
- Confirm reads work with a fictional row.
- Confirm a missing or incorrect local access key receives `401` without contacting Notion.
- Confirm the interface provides no Notion create, edit, archive, or delete action.
- Stop the server and verify demo mode still works.

## Troubleshooting

### Missing configuration

Compare `.env.local` with `.env.example`. Restart the API after any environment change.

### Local access key rejected

Confirm the browser is open at `http://127.0.0.1:5173`, then paste the exact `FOCUS_LOG_LOCAL_TOKEN` value again. The app clears a rejected key from the tab session. Restart both processes after rotating the key.

### Unauthorized or restricted response

Confirm the token is current and that the integration is connected to the exact database or parent page. Do not broaden workspace access as a first response.

### Property mapping error

Compare your data-source properties with the names in `.env.example`. Property mapping belongs in local configuration, outside UI components.

### Rotating access

If the Notion token appears in a terminal capture, issue, commit, or browser bundle, revoke it in Notion immediately. Remove the exposed artifact, create a new token, and follow [SECURITY.md](../SECURITY.md). If the separate local access key is exposed, replace it and restart the local processes.
