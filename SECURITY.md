# Security Policy

## Supported versions

Security fixes are applied to the latest release and the current `main` branch.

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| Earlier versions | No |

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature under **Security > Advisories > Report a vulnerability** for this repository. Please include:

- A concise description and likely impact.
- Reproduction steps or a minimal proof of concept.
- The affected version, browser, and operating system.
- Any evidence that a token, database identifier, workspace URL, or personal entry was exposed.
- A suggested fix, when available.

Avoid public issues, discussions, screenshots, or pull requests until the report has been reviewed. Remove real tokens and personal content from every attachment.

You should receive an acknowledgement within seven days. Maintainers will assess severity, coordinate a fix, and agree on disclosure timing with the reporter.

## Security model

- The GitHub Pages demo is static and includes synthetic data only.
- Browser data remains on the device in demo mode.
- Notion credentials are read by the optional local server from `.env.local` or its process environment and are never bundled into the browser application.
- A separate `FOCUS_LOG_LOCAL_TOKEN` authenticates the current local browser tab to the API. It is sent only to the loopback endpoint and kept in tab-scoped `sessionStorage`.
- The Notion adapter uses data-source query operations only and sends the version header `2026-03-11`.
- The client enables Notion only at `http://127.0.0.1:5173`; the Vite proxy also requires matching same-origin browser fetch metadata before forwarding a request.
- The server binds to `127.0.0.1`, accepts only the canonical frontend Origin, verifies the local token before every read, disables response caching, and returns normalized public errors.
- The repository intentionally excludes private archives, `.env` files, real database IDs, workspace links, and logs.

The local access key protects the loopback broker from unrelated browser origins and clients that do not possess the key. A process running as the same macOS account may be able to read `.env.local`; operating-system account security remains a prerequisite.

The project has no hosted Notion proxy. Anyone deploying a custom server is responsible for transport security, access control, secret storage, logging, backups, and retention.
