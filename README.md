# WriteFix AI

WriteFix AI is an open-source writing assistant available as both a **Chrome Extension** and a **standalone Web Studio**. It lets users fix grammar, rephrase text, adjust tone, and polish writing using AI — all powered by free-tier API keys. Select text on any webpage and get instant corrections, or use the full-featured web editor at [writefix.siddhesh.tech](https://writefix.siddhesh.tech).

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Live Demo](#live-demo)
- [Architecture](#architecture)
- [Writing Modes](#writing-modes)
- [Supported AI Providers](#supported-ai-providers)
- [Prompt Engine](#prompt-engine)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Browser Extension Permissions](#browser-extension-permissions)
- [Privacy and Security](#privacy-and-security)
- [License](#license)

---

## Overview

WriteFix AI is a monorepo containing three packages:

1. **@writefix/core** — The shared AI engine: prompt builder, provider adapters, diff algorithm, rate limiter, and schema validation. Used by both the extension and the web studio.
2. **Chrome Extension** — A Manifest V3 browser extension built with WXT, React 19, and TypeScript. Injects a floating toolbar on any webpage so users can correct selected text in-place.
3. **Web Studio** — A standalone single-page application built with Vite and React. Provides a full-screen writing workspace with real-time diff visualization, mistake inspection, analytics, and revision history.

---

## Key Features

### Chrome Extension

- **Floating Toolbar**: Appears near selected text on any webpage for one-click corrections.
- **Inline Diff View**: Side-by-side comparison of original and corrected text, with word-level highlighting of insertions, deletions, and modifications.
- **Context Menu Integration**: Right-click any highlighted text and select "Improve Writing" to trigger correction.
- **Keyboard Shortcut**: `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (macOS) to invoke WriteFix on the current selection.
- **In-Place Replacement**: Apply corrections directly into text fields, contenteditable areas, and input elements.
- **Mistake Explanations**: Each correction includes a concise, teacher-like explanation of why the change was made.

### Web Studio

- **Full-Screen Writing Workspace**: A single-viewport layout (no page scrolling) with dual-pane input/output view.
- **Real-Time Diff Visualization**: Word-level Myers LCS diff with unified or split view, color-coded additions and deletions.
- **Mistake Inspector**: Categorized error cards (grammar, spelling, punctuation, capitalization, style) with accept/dismiss actions per correction.
- **Analytics Dashboard**: Writing health score, readability grade, sentence complexity analysis, and vocabulary richness metrics.
- **Tone Customizer**: Fine-tune formality, warmth, length, and complexity using slider controls.
- **Revision History**: Automatically saves every correction session with timestamps; browse and restore previous versions.
- **Settings Panel**: Configure API keys, select providers and models, set writing preferences, and manage custom rules.
- **Rate Limiter Display**: Live token-bucket indicator showing remaining API requests per minute.

### Shared (Core Engine)

- **Multi-Provider Support**: Works with Google Gemini, Groq, OpenAI, Anthropic Claude, OpenRouter, and LanguageTool.
- **Automatic Failover**: If one provider returns a rate-limit error (HTTP 429) or fails, the engine silently cascades to the next available provider.
- **Offline Heuristic Engine**: Zero-dependency local grammar checker that works without any API key or internet connection.
- **Token Bucket Rate Limiter**: Client-side rate limiting (30 requests/minute) to prevent upstream API bans.
- **Privacy-First Design**: API keys are stored exclusively in browser-local storage. No keys are ever transmitted to any server other than the selected AI provider.

---

## Live Demo

- **Web Studio**: [https://writefix.siddhesh.tech](https://writefix.siddhesh.tech)

---

## Architecture

```
                         +-------------------+
                         |   @writefix/core  |
                         |  (Shared Engine)   |
                         +--------+----------+
                                  |
                   +--------------+--------------+
                   |                             |
          +--------v--------+          +---------v---------+
          | Chrome Extension |          |    Web Studio     |
          | (WXT + React)    |          |   (Vite + React)  |
          +---------+--------+          +---------+---------+
                    |                             |
          Injects floating            Standalone SPA at
          toolbar on any              writefix.siddhesh.tech
          webpage via
          content script
```

### Core Engine Pipeline

```
User Text --> Pre-Processing --> Provider Selection --> API Call --> JSON Parsing
          --> Schema Validation --> Myers Diff Cross-Check --> Mistake Cards --> Output
```

1. **Pre-Processing**: Normalizes whitespace, protects code blocks and URLs from modification.
2. **Provider Selection**: Routes to the user's configured provider (Gemini, Groq, etc.) or falls back through the cascade.
3. **API Call**: Sends the optimized system prompt and user text to the selected provider with mode-specific sampling parameters.
4. **Schema Validation**: Validates the response against a strict Zod schema to ensure consistent output structure.
5. **Myers Diff Cross-Check**: Runs a word-level diff between the original and corrected text to verify all changes are accounted for in the mistake list; automatically appends any missed changes.

---

## Writing Modes

WriteFix AI supports multiple correction modes, each with calibrated sampling parameters:

### Primary Modes

| Mode | Description | Requires AI |
| :--- | :--- | :---: |
| Grammar | Fix spelling, grammar, punctuation, and capitalization with proofreader precision. | No |
| Professional | Executive-level formal tone for business and leadership communication. | Yes |
| Academic | Scholarly vocabulary, formal syntax, and rigorous academic flow. | Yes |
| Concise | Condense text to be brief, direct, and clear without losing substance. | Yes |
| Humanize | Remove robotic AI patterns and restore authentic human voice and cadence. | Yes |

### Tone Modifiers

Tone modifiers can be layered on top of any primary mode for additional stylistic refinement:

| Modifier | Effect |
| :--- | :--- |
| Natural | Fluid, conversational everyday English. |
| Simple | Plain vocabulary, shorter sentence structures. |
| Polite | Warm, respectful, diplomatic framing. |
| Shorter | Aggressive compression for ultra-brief output. |
| Indian Professional | Polite, respectful Indian workplace English conventions. |

---

## Supported AI Providers

All providers listed below offer free tiers that are sufficient for personal use:

| Provider | Default Model | Free-Tier Rate Limit | Latency |
| :--- | :--- | :--- | :--- |
| Groq | llama-3.3-70b-versatile | 30 RPM / 1,000 RPD | ~120ms |
| Google Gemini | gemini-3.5-flash-lite | 15 RPM / 1,500 RPD | ~400ms |
| OpenRouter | User-selected | 200 RPM (varies) | ~600ms |
| OpenAI | gpt-4o-mini | 500 RPM (paid) | ~500ms |
| Anthropic Claude | claude-sonnet-4 | 50 RPM (paid) | ~800ms |
| LanguageTool | N/A (rule-based) | 20 RPM / Unlimited | ~250ms |
| Offline Heuristics | N/A (local) | Unlimited | 0ms |

Users configure their preferred provider and API key in the Settings panel. The extension and web studio share the same provider adapters from `@writefix/core`.

---

## Prompt Engine

The prompt engine in `@writefix/core` uses several techniques to maximize correction quality on free-tier models:

### Few-Shot In-Context Learning

Three carefully crafted examples are included in every system prompt to calibrate the model's behavior across grammar-only fixes, professional rewrites, and code/URL preservation scenarios.

### Invariant Constraints

The system prompt enforces strict rules that prevent common LLM failure modes:

- Never alter facts, numbers, dates, proper names, or code.
- Never modify content inside backticks, fenced code blocks, or URLs.
- Preserve existing markdown formatting and paragraph structure.
- Apply the principle of minimal intervention: change only what the mode requires.
- Short-circuit unchanged text: if input is already correct, return it with confidence 100.

### Prompt Injection Defense

User-submitted text is wrapped in `<user_text_to_correct>` tags with explicit instructions to treat the content as raw data, never as executable instructions. This prevents prompt injection attacks where malicious text attempts to override system behavior.

### Per-Mode Sampling Parameters

Each writing mode has independently tuned `temperature` and `top_p` values:

| Mode | Temperature | Top-P |
| :--- | :---: | :---: |
| Grammar | 0.1 | 0.8 |
| Professional | 0.3 | 0.9 |
| Academic | 0.3 | 0.9 |
| Concise | 0.2 | 0.85 |
| Humanize | 0.7 | 0.95 |

### Structured JSON Output

Gemini providers use native `responseSchema` enforcement. Groq and OpenAI use `response_format: { type: "json_object" }`. All responses are validated against a Zod schema before reaching the UI.

---

## Project Structure

```
WriteFix AI/
|-- packages/
|   |-- core/                        # Shared AI engine (provider-agnostic)
|   |   |-- src/
|   |   |   |-- prompt.ts            # System prompt builder with few-shot examples
|   |   |   |-- gemini.ts            # Google Gemini provider adapter
|   |   |   |-- groq.ts              # Groq (LPU) provider adapter
|   |   |   |-- openai.ts            # OpenAI provider adapter
|   |   |   |-- anthropic.ts         # Anthropic Claude provider adapter
|   |   |   |-- openrouter.ts        # OpenRouter provider adapter
|   |   |   |-- languagetool.ts      # LanguageTool free API adapter
|   |   |   |-- heuristic.ts         # Offline heuristic grammar engine
|   |   |   |-- fallback.ts          # Automatic failover cascade logic
|   |   |   |-- diff-engine.ts       # Myers LCS word-level diff algorithm
|   |   |   |-- modes.ts             # Writing mode definitions and metadata
|   |   |   |-- model-defaults.ts    # Default model IDs and rate limits
|   |   |   |-- schema.ts            # Zod validation schemas
|   |   |   |-- types.ts             # TypeScript type definitions
|   |   |   |-- text-stats.ts        # Word count, readability, and text metrics
|   |   |   |-- writing-score.ts     # Writing quality score calculator
|   |   |   +-- index.ts             # Package entry point and re-exports
|   |   +-- test/
|   |       +-- prompt-engine.test.ts # Unit tests for the prompt engine
|   |
|   +-- web/                         # Web Studio (standalone SPA)
|       |-- src/
|       |   |-- App.tsx              # Root application component
|       |   |-- index.css            # Global styles and design tokens
|       |   |-- components/
|       |   |   |-- StudioEditor.tsx      # Main dual-pane writing editor
|       |   |   |-- Navbar.tsx            # Top navigation bar with provider status
|       |   |   |-- DiffViewer.tsx        # Word-level diff visualization
|       |   |   |-- MistakeInspector.tsx  # Categorized error cards
|       |   |   |-- SettingsModal.tsx     # API key and provider configuration
|       |   |   |-- HistoryDrawer.tsx     # Revision history side panel
|       |   |   |-- AnalyticsDashboard.tsx # Writing quality metrics
|       |   |   +-- ToneCustomizer.tsx    # Formality/warmth/length sliders
|       |   +-- services/
|       |       +-- web-orchestrator.ts   # Web-specific provider orchestration
|       |-- index.html               # SPA entry point
|       +-- vite.config.ts           # Vite build configuration
|
|-- assets/                          # Extension brand assets (icons, logo)
|-- components/
|   +-- inline-popup/                # Extension inline UI components
|       |-- DiffView.tsx             # In-page diff comparison
|       |-- FloatingToolbar.tsx      # Selection trigger button
|       |-- InlinePopup.tsx          # Main correction popover
|       +-- MistakeExplainer.tsx     # Per-mistake explanation cards
|-- entrypoints/
|   |-- background.ts               # Service worker (commands, context menus)
|   |-- content.ts                   # Content script (selection detection, UI injection)
|   |-- options/                     # Extension options page
|   +-- popup/                       # Extension toolbar popup
|-- hooks/                           # Custom React hooks
|-- lib/
|   |-- cache/                       # API response caching
|   |-- correction/                  # Text correction pipeline
|   |-- messaging/                   # Extension runtime messaging
|   |-- selection/                   # DOM text selection extraction
|   |-- storage/                     # Chrome storage manager and migrations
|   +-- utils/                       # Shared utility functions
|-- public/                          # Static assets for extension build
|-- scripts/
|   +-- build-web.js                 # Web Studio build script (Vite + dist mirroring)
|-- package.json                     # Root package configuration (npm workspaces)
|-- tsconfig.json                    # TypeScript compiler configuration
|-- wxt.config.ts                    # WXT framework and Manifest V3 configuration
+-- vercel.json                      # Vercel deployment configuration
```

---

## Getting Started

### Prerequisites

- Node.js v18.x or higher
- npm (included with Node.js)

### Installation

```bash
git clone https://github.com/Siddhesh-Codes/WriteFix-AI.git
cd WriteFix-AI
npm install
```

---

## Development

### Chrome Extension (Development Mode)

Start the WXT development server with hot-reloading. This launches a separate Chrome instance with the extension pre-loaded:

```bash
npm run dev
```

For Firefox:

```bash
npm run dev:firefox
```

### Web Studio (Development Mode)

Start the Vite development server at `http://localhost:5173`:

```bash
npm run dev:web
```

### Type Checking

Run the TypeScript compiler in check-only mode across the entire monorepo:

```bash
npm run compile
```

### Running Tests

Run the prompt engine unit tests:

```bash
npm run test:core
```

---

## Building for Production

### Web Studio

Build the web studio for production deployment (outputs to `dist/`):

```bash
npm run build
```

### Chrome Extension

Build the extension for Chrome (outputs to `.output/chrome-mv3/`):

```bash
npm run build:extension
```

Build for Firefox:

```bash
npm run build:firefox
```

### Create Distribution Archives

Package the extension for web store submission:

```bash
# Chrome Web Store
npm run zip

# Firefox Add-ons
npm run zip:firefox
```

---

## Deployment

### Web Studio (Vercel)

The web studio is deployed on Vercel and connected to this GitHub repository. Every push to `main` triggers an automatic production deployment.

**Build Command**: `npm run build:web`
**Output Directory**: `dist`
**Framework Preset**: Other

The live site is available at [writefix.siddhesh.tech](https://writefix.siddhesh.tech).

### Chrome Extension

Load the built extension from `.output/chrome-mv3/` as an unpacked extension in `chrome://extensions` (with Developer Mode enabled), or submit the zip archive to the Chrome Web Store.

---

## Browser Extension Permissions

Declared in `wxt.config.ts` under Manifest V3:

| Permission | Purpose |
| :--- | :--- |
| `activeTab` | Access the currently active tab to read and modify selected text. |
| `storage` | Store user preferences, API keys, correction history, and favorites locally. |
| `contextMenus` | Register the "Improve Writing" context menu item on text selections. |
| `commands` | Bind the global keyboard shortcut (`Ctrl+Shift+G` / `Cmd+Shift+G`). |

### Host Permissions

Network access is limited exclusively to supported AI provider endpoints:

- `https://api.languagetool.org/*`
- `https://generativelanguage.googleapis.com/*`
- `https://api.groq.com/*`
- `https://openrouter.ai/*`
- `https://api.openai.com/*`
- `https://api.anthropic.com/*`

---

## Privacy and Security

- **Local-Only Storage**: All API keys, user preferences, correction history, and favorites are stored exclusively in the browser's local storage (`chrome.storage.local` for the extension, `localStorage` for the web studio). Nothing is sent to any external server.
- **Direct API Communication**: The extension and web studio communicate directly with the selected AI provider's API. There is no intermediary proxy server, backend, or analytics collection.
- **No Telemetry**: WriteFix AI does not collect, transmit, or store any usage analytics, user text, or behavioral data.
- **Prompt Injection Defense**: User-submitted text is sandboxed within XML-style tags in the prompt, with explicit instructions to the AI model to treat it as data only.

---

## License

ISC License
