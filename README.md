# Paid Media Suite

AI-native desktop application for paid media campaign management, powered by Claude AI and built with Electron + React.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-UNLICENSED-red)

## Overview

Paid Media Suite leverages Claude's Agent SDK and a skill-based architecture to provide intelligent, data-driven campaign planning, optimization, and reporting. The application uses deterministic AI interactions through structured Claude Skills for reliable campaign management workflows.

## Features

- **AI-Powered Campaign Planning** - Natural language campaign brief creation with intelligent plan generation
- **Media Mix Recommendations** - Data-driven platform selection and budget allocation
- **Campaign Blueprint Management** - Structured campaign configurations with hierarchical organization
- **Performance Optimization** - Real-time dashboards with actionable insights
- **Multi-Platform Support** - Integrated support for Google Ads, Meta, TikTok, LinkedIn, and 14+ platforms
- **A/B Test Recommendations** - AI-generated experiment suggestions
- **Attribution Analysis** - Multi-touch attribution modeling
- **Dark/Light Theme** - System-aware theming with custom Treasure Data design tokens

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Electron** | 40.1.0 | Desktop framework |
| **React** | 19.2.4 | UI framework |
| **TypeScript** | 5.7.2 | Type safety |
| **Vite** | 7.3.1 | Build tool & dev server |
| **Tailwind CSS** | 4.1.18 | Styling |
| **Zustand** | 5.0.2 | State management |
| **Claude Agent SDK** | 0.1.0 | AI integration |
| **Recharts** | 3.4.0 | Data visualization |
| **Lucide React** | 0.563.0 | Icons |

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Anthropic API Key** for Claude integration

### Installation

```bash
# Clone the repository
git clone https://github.com/skwapong/paid-media-desktop-main.git
cd paid-media-desktop-main

# Install dependencies
npm install

# Set up environment variables
# Create .env file with your Anthropic API key
echo "ANTHROPIC_API_KEY=your_api_key_here" > .env
```

### Development

```bash
# Start development server (hot reload enabled)
npm run dev

# Type checking
npm run typecheck

# Run tests
npm run test

# Lint code
npm run lint
```

The app will launch in development mode with hot module replacement for the renderer process and automatic restart for the main process.

## Architecture

### Project Structure

```
paid-media-desktop-main/
├── electron/              # Main process (Node.js)
│   ├── main.ts           # Application entry point
│   ├── preload.ts        # Context bridge (IPC)
│   ├── ipc/              # IPC handlers
│   │   ├── chat.ts       # Chat/AI interactions
│   │   ├── blueprints.ts # Campaign blueprint CRUD
│   │   ├── platforms.ts  # Platform integrations
│   │   └── settings.ts   # App settings
│   └── services/
│       ├── claude-agent-client.ts  # Claude SDK wrapper
│       ├── chat-session-manager.ts # Session management
│       └── auth-proxy.ts           # Auth middleware
│
├── src/                  # Renderer process (React)
│   ├── components/       # UI components
│   │   ├── campaign/     # Campaign creation & management
│   │   ├── campaigns/    # Campaign list views
│   │   ├── optimize/     # Performance dashboards
│   │   ├── chat/         # Streaming chat interface
│   │   └── ui/           # Shared UI primitives
│   ├── stores/           # Zustand state stores
│   ├── services/         # Business logic & parsers
│   └── types/            # TypeScript definitions
│
└── skills/               # Claude Skills (AI functions)
    └── paid-media-skills/
        ├── create-campaign-plan/
        ├── recommend-media-mix/
        ├── recommend-budget-allocation/
        ├── analyze-attribution/
        └── ... (21 total skills)
```

### IPC Communication

```typescript
// Renderer → Main (via preload context bridge)
window.paidMediaSuite.chat.sendMessage({ content: "Create a campaign" })
window.paidMediaSuite.blueprints.save(blueprint)
window.paidMediaSuite.settings.get()

// Main → Renderer (via webContents)
mainWindow.webContents.send('chat:stream', chunk)
mainWindow.webContents.send('blueprint:updated', data)
```

### Claude Skills System

The app uses a **skill-based architecture** where Claude emits structured JSON in named code fences:

```
1. User message → Claude Agent SDK
2. Skills loaded into system prompt (from skills/ directory)
3. Claude emits structured output:
   ```create-campaign-plan-json
   { "campaign": {...}, "platforms": [...] }
   ```
4. Parser extracts JSON → Zustand store updated
5. UI automatically re-renders
```

**Available Skills** (21 total):
- `create-campaign-plan` - Generate campaign structures
- `recommend-media-mix` - Platform selection with rationale
- `recommend-budget-allocation` - Budget distribution
- `analyze-attribution` - Attribution modeling
- `benchmark-performance` - Competitive analysis
- `recommend-ab-tests` - A/B test suggestions
- `generate-optimization-actions` - Performance improvements
- And 14 more...

## Build & Package

### Production Build

```bash
# Build for current platform
npm run build
npm run package

# Platform-specific builds
npm run package:mac    # macOS (.dmg, .app)
npm run package:win    # Windows (.exe)
```

### Build Output

```
dist/
├── electron/          # Compiled main process
└── renderer/          # Built React app

dist-electron/         # Packaged apps
├── mac/              # macOS builds
└── win/              # Windows builds
```

## Configuration

### Electron Builder

See `electron-builder.yml` for packaging configuration:
- App ID: `com.treasuredata.paidmediasuite`
- Code signing (macOS/Windows)
- Auto-update configuration
- File associations

### Tailwind Theme

Custom Treasure Data design tokens in `src/styles/globals.css`:

```css
:root {
  --td-navy: #131023;
  --td-blue: #3A61FF;
  --td-dark: #0A0A0F;
  /* ... */
}
```

## Development Notes

### Security

- Context isolation enabled
- No `nodeIntegration` in renderer
- Preload script whitelist IPC channels
- Content Security Policy enforced

### State Management

Zustand stores for:
- `chatStore` - Chat messages, streaming state
- `blueprintStore` - Campaign blueprints
- `campaignStore` - Campaign list & filters
- `settingsStore` - User preferences
- `briefEditorStore` - Campaign brief editing

### Testing

```bash
npm run test          # Run Vitest unit tests
npm run typecheck     # TypeScript validation
npm run lint          # ESLint checks
```

## Troubleshooting

### Common Issues

**App won't start in dev mode:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run dev
```

**IPC not working:**
- Check `electron/preload.ts` exposes the API
- Verify `contextIsolation: true` in `electron/main.ts`
- Check console for IPC errors

**Styles not loading:**
- Ensure Tailwind is processing: `npm run dev` rebuilds CSS
- Check `@tailwindcss/postcss` is in `postcss.config.js`

## Contributing

This is a private Treasure Data project. For internal contributors:

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test: `npm run typecheck && npm run test`
3. Commit with conventional commits: `feat: add new feature`
4. Push and create PR: `git push origin feature/your-feature`

## License

UNLICENSED - Proprietary software for Treasure Data internal use.

## Author

**Treasure Data DevAI Unit**

---

**Need help?** Check `CLAUDE.md` for AI-specific development patterns or contact the DevAI team.
