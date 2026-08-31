# Privacy

Focus Log is designed to be useful before it sees any personal data.

## Demo mode

Demo mode uses fictional sample entries. Changes are stored in the current browser. The GitHub Pages build has no project-operated analytics service, account system, database, or hosted API.

Browser storage can still be read by someone with access to your device and browser profile. Clear the site's stored data before sharing a device or browser profile.

## Optional Notion mode

Notion mode is an opt-in local development feature.

- You create and control the Notion integration.
- The integration token and data-source configuration stay in `.env.local` or another server-only process environment.
- A separate local access key pairs the current tab with the loopback server and remains in tab-scoped `sessionStorage`.
- The browser talks to the Focus Log server. It never receives the Notion integration token.
- The server reads only the configured workspace content needed for the dashboard.
- Focus Log provides no route that creates, edits, archives, or deletes Notion content.
- The public GitHub Pages site does not host the Notion server and refuses to send a local access key from its public origin.

Notion processes requests under its own terms and privacy policy. Review the permissions shown by Notion before sharing any database with an integration.

## Repository hygiene

The public repository must never contain:

- Real journal or planning entries.
- Integration tokens or copied request headers.
- Local access keys.
- Database, data-source, page, workspace, or user identifiers.
- Private Notion URLs.
- Raw API responses, logs, browser traces, or screenshots containing personal content.
- The recovered local artifact under `private-archive/`.

Use synthetic data for fixtures, tests, bug reports, videos, and screenshots. Run `git diff --staged` before every commit and inspect generated artifacts before uploading them.

## Data removal

To remove demo data, clear storage for the Focus Log origin in your browser settings. Closing the tab session clears its local access key. To disconnect Notion, stop the local server, remove the integration's data-source access in Notion, and delete your local `.env.local` file. Rotate the Notion token immediately if it may have been exposed; replace the local access key if it appears in a capture or report.

## Self-hosting

Self-hosted operators choose their own infrastructure and become responsible for access control, encrypted transport, logs, retention, backups, incident response, and compliance. Avoid exposing the optional server directly to the public internet without authentication and rate limiting.
