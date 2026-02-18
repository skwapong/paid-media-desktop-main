# CLAUDE.md

## Project Overview

**Paid Media Suite** is an AI-native desktop application for paid media campaign management. Built with Electron + React, using Claude Skills (Tool Use/Function Calling) for deterministic AI-driven campaign planning, optimization, and reporting.

## Development

```bash
npm install              # Install dependencies
npm run dev              # Start dev mode (Vite + Electron)
npm run build            # Build (Vite + Electron)
npm run package:mac      # Package for macOS
npm run typecheck        # Type check both renderer and electron
npm run lint             # ESLint
npm run test             # Vitest
```

## Architecture

```
electron/           # Main process
├── main.ts         # Entry point, window management
├── preload.ts      # Context bridge for IPC (paidMediaSuite API)
├── ipc/            # IPC handlers (settings, window, chat, td-api, blueprints, pdf, platforms)
├── services/       # Backend services (claude-agent-client, auth-proxy, chat-session-manager)
└── utils/          # Shared utilities and IPC types

src/                # Renderer process (React)
├── App.tsx         # Main app component with routes
├── main.tsx        # React entry point
├── components/     # UI components
│   ├── layout/     # LeftSidebar, TopNavigation
│   ├── campaign/   # Chat page, brief editor, blueprints, segment selector
│   ├── campaigns/  # Campaign list, cards, stats
│   ├── optimize/   # Dashboard, HierarchicalTable
│   ├── ai-features/# AI feature panels (forecasting, anomalies, fatigue, etc.)
│   ├── chat/       # StreamingChatView, StreamingMessage, AgentThinking
│   ├── shared/     # AIChatPanel, LoadingStates
│   └── ui/         # Button, Toast, NotificationCenter
├── services/       # Parsers and business logic
├── stores/         # Zustand state management
├── styles/         # Global CSS (Tailwind)
├── types/          # TypeScript types (campaign, optimize, ai-features, etc.)
└── utils/          # Utilities

skills/             # Claude Skills (SKILL.md files)
└── paid-media-skills/  # 21 skill definitions
```

## Tech Stack

- **Electron 40** — Desktop framework
- **React 19** — UI framework
- **Vite** — Build tool
- **Zustand** — State management
- **Tailwind CSS 4** — Styling
- **Lucide React** — Icons
- **Recharts** — Charts and visualizations
- **TypeScript** — Language

## Key Patterns

- **IPC**: Main/renderer communication via `electron/preload.ts` context bridge (`window.paidMediaSuite`)
- **State**: Zustand stores in `src/stores/` for chat, brief, campaigns, blueprints, settings
- **Skills**: SKILL.md files in `skills/paid-media-skills/` loaded into Claude system prompt; LLM emits JSON in named code fences; parsers in `src/services/skillParsers.ts` extract and dispatch to stores
- **Styling**: Tailwind with CSS custom properties for theming (light/dark/system)
- **Security**: Context isolation enabled, no node integration in renderer

## Skill Code Fence Pattern

```
User message → Claude Agent SDK (skills in system prompt)
  → LLM emits ```skill-name-json code fence
    → Parser extracts JSON → Zustand store updated → UI renders
```
