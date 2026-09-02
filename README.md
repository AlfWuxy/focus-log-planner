# Focus Log

Plan the day. Learn from the week.

[![CI](https://github.com/AlfWuxy/focus-log-planner/actions/workflows/ci.yml/badge.svg)](https://github.com/AlfWuxy/focus-log-planner/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/AlfWuxy/focus-log-planner/actions/workflows/pages.yml/badge.svg)](https://github.com/AlfWuxy/focus-log-planner/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-2ea44f.svg)](LICENSE)

Focus Log turns a rough list of intentions into a small daily plan you can actually finish. Choose the three outcomes that matter most, define the next visible action, track focused time, keep short notes for the coming days, and review the patterns that helped or blocked the week.

[Open the live demo](https://alfwuxy.github.io/focus-log-planner/) · [Report a bug](https://github.com/AlfWuxy/focus-log-planner/issues/new?template=bug_report.yml) · [Suggest an idea](https://github.com/AlfWuxy/focus-log-planner/issues/new?template=feature_request.yml)

## Screenshots

| Desktop | Mobile |
| --- | --- |
| [![Focus Log desktop view](docs/images/app-desktop.png)](docs/images/app-desktop.png) | [![Focus Log mobile view](docs/images/app-mobile.png)](docs/images/app-mobile.png) |

## Why Focus Log

Focus Log is for people who want a calm daily workspace instead of a full project-management system. It keeps the decision surface deliberately small:

- **Big 3** for today's most important outcomes.
- **Next action** for the first concrete move.
- **Focus hours** for time spent on concentrated work.
- **Upcoming notes** for near-term reminders and ideas.
- **Weekly view** for completion patterns and recurring friction.

## A typical day

1. Write the three outcomes that would make today count.
2. Turn the most important outcome into one visible next action.
3. Check work off and update focused time during the day.
4. Add upcoming notes and record what got in the way.
5. Use the seven-day view to adjust the next plan.

The current app saves the demo workspace in the browser and lets you reorder the Big 3 manually. An optional local, read-only Notion connection can display configured daily entries and notes.

## What is next

Focus Log is being developed toward a faster capture-and-organize workflow:

- A **Quick Capture Inbox** for tasks, thoughts, and reminders before they are organized.
- **Suggested priority ordering** based on importance, deadline, effort, and energy, with the final choice left to the user.
- **Writing cleanup** that can turn rough notes into clearer task wording while preserving the original text for review.
- A real **day-by-day personal workspace** with carry-over tasks, history, search, and export.

These items are the next product direction and are not part of the current public demo yet.

## 中文简介

Focus Log 是一个轻量的每日任务与随手记录工具。它帮助你选出当天最重要的 Big 3，写清下一步行动，记录专注时长和未来几天的提醒，再通过七天视图观察完成情况和常见阻碍。

当前版本已经支持手动规划、勾选完成、调整 Big 3 顺序、添加未来笔记和本地保存。下一阶段会加入统一的随手记录收件箱、优先级建议、语句整理、逐日历史与导出。

## Try it

The [public demo](https://alfwuxy.github.io/focus-log-planner/) needs no account and contains only fictional sample content.

| Mode | Best for | Where data lives |
| --- | --- | --- |
| Demo | Trying the app, offline planning, and GitHub Pages | Current browser storage |
| Notion | Reading configured Daily and Notes data sources | Your Notion workspace through a local read-only server |

## Run locally

Requirements: [Node.js 22](https://nodejs.org/) and npm.

```bash
git clone https://github.com/AlfWuxy/focus-log-planner.git
cd focus-log-planner
npm ci
npm run dev
```

Open the local address printed by Vite. Demo mode needs no account or environment file.

For the optional Notion connection, follow the [Notion setup guide](docs/NOTION_SETUP.md), then run:

```bash
npm run dev:notion
```

## Data and privacy

- Demo data stays in the current browser unless you export or sync it yourself.
- The public build contains no private journal entries, database IDs, workspace links, or tokens.
- Notion access is optional, local, authenticated, and read-only.
- Private configuration, test output, and build artifacts are excluded from Git.

Read [Privacy](docs/PRIVACY.md), [Notion setup](docs/NOTION_SETUP.md), and the [Security Policy](SECURITY.md) before connecting personal data.

## Development

```bash
npm run check
npx playwright install chromium
npm run test:e2e
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development workflow.

## Project docs

- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Privacy](docs/PRIVACY.md)
- [Notion setup](docs/NOTION_SETUP.md)
- [Public rebuild notes](docs/REBUILD_NOTES.md)
- [Changelog](CHANGELOG.md)

## Contributing

Issues and focused pull requests are welcome. Keep sample data fictional and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Focus Log is available under the [MIT License](LICENSE).
