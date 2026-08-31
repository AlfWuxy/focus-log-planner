# Contributing to Focus Log

Thanks for helping make daily planning calmer, clearer, and easier to inspect.

## Before you start

- Search existing issues and pull requests.
- Open an issue before a large UI, storage, or Notion integration change.
- Keep personal journal content, real database IDs, workspace URLs, and tokens out of every commit, fixture, screenshot, issue, and test artifact.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md) and [Security Policy](SECURITY.md).

## Local development

Use Node.js 22 and npm.

```bash
npm ci
npm run dev
```

Demo mode is the normal development path. It requires no account or secret.

To work on the optional Notion adapter, copy the environment template and follow [docs/NOTION_SETUP.md](docs/NOTION_SETUP.md). Use a separate development workspace populated only with fictional entries.

## Quality checks

Before opening a pull request, run:

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

Add or update tests when behavior changes. Prefer user-visible assertions over implementation details. Confirm both a desktop viewport and a small mobile viewport for layout changes.

## Pull requests

Keep each pull request focused. Explain:

1. What changed.
2. Why the change is useful.
3. How reviewers can verify it.
4. Whether any file moved and where it belongs.
5. Whether shell scripts or Git hooks changed, including the `bash -n` result.
6. Whether Notion verification remains to be completed.

The repository pull request template includes these fields.

Use concise commit titles in this form:

```text
feat: add keyboard reorder controls
fix: preserve focus hours after refresh
docs: clarify local Notion setup
style: improve mobile week layout
refactor: isolate demo storage adapter
chore: update repository scripts
```

## Scope and design principles

- Make demo mode useful on its own.
- Keep the static GitHub Pages build independent from the optional server.
- Treat the server as a narrow read-only boundary.
- Preserve keyboard access, visible focus states, readable contrast, and responsive behavior.
- Keep data adapters replaceable and UI components unaware of credentials.
- Write code and configuration comments in Chinese.

## Reporting security problems

Please do not open a public issue for a vulnerability or accidental data exposure. Follow [SECURITY.md](SECURITY.md) instead.
