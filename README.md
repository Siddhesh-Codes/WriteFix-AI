# WriteFix AI

WriteFix AI is a Chrome extension built with the WXT framework, React 19, TypeScript, and Tailwind CSS. It allows users to select text on any web page and instantly grammar-check, rewrite, summarize, retone, or transform it using AI or free language correction providers.

---

## Key Features

- **Floating Toolbar & Inline Overlay**: Appears near selected text on any web page for fast, one-click text correction and AI transformations.
- **Multi-Provider AI Engine**: Supports major AI providers including Google Gemini, OpenAI, Anthropic Claude, Groq, and OpenRouter, as well as an offline/free LanguageTool fallback.
- **Preset & Custom Actions**:
  - Fix Grammar & Spelling
  - Rephrase & Paraphrase
  - Professional / Casual Tone Adjustment
  - Conciseness & Summarization
  - Expansion & Elaboration
  - Custom User Prompts
- **Diff Visualizer**: Interactive side-by-side or inline diff highlighting additions, deletions, and modifications before replacing original text.
- **Grammar Explanations**: Detailed explanations for grammar, punctuation, and stylistic mistakes.
- **History & Favorites**: Auto-saves text corrections locally with support for tagging favorite transformations.
- **Keyboard Shortcuts & Context Menu**: Global shortcut (`Ctrl+Shift+G` or `Cmd+Shift+G`) and right-click menu trigger options.
- **Privacy-First Storage**: API keys, options, history, and user preferences remain stored locally in Chrome storage (`chrome.storage.local`).

---

## Technical Stack

- **Framework**: WXT (Web Extension Tools)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Validation**: Zod
- **Language**: TypeScript 5.7+
- **Manifest**: Chrome Extension Manifest V3

---

## Supported Providers & AI Models

1. **LanguageTool (Default / Fallback)**
   - No API Key required.
   - Ideal for grammar and spell-checking out of the box.

2. **Google Gemini**
   - Recommended Models: `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`
   - Endpoint: Google Generative Language API

3. **Groq**
   - Recommended Models: `llama-3.3-70b-versatile`, `mixtral-8x7b-32768`
   - High-speed inference provider.

4. **OpenAI**
   - Models: `gpt-4o`, `gpt-4o-mini`

5. **Anthropic Claude**
   - Models: `claude-3-5-sonnet-latest`, `claude-3-haiku-20240307`

6. **OpenRouter**
   - Flexible routing across open-source and proprietary models.

---

## Directory & File Structure

```
WriteFix AI/
├── assets/                  # Extension icons and graphics
├── components/
│   └── inline-popup/        # Inline UI components overlaid on web pages
│       ├── DiffView.tsx          # Visual text diff comparison component
│       ├── FloatingToolbar.tsx   # Selection trigger button
│       ├── InlinePopup.tsx       # Main popover UI for text action execution
│       └── MistakeExplainer.tsx  # Granular error explanation breakdown
├── entrypoints/
│   ├── background.ts        # Service worker handling commands and context menus
│   ├── content.ts           # Content script listening for selection and rendering UI
│   ├── options/             # Extension options page (API keys, provider config, prompts)
│   └── popup/               # Extension toolbar popup interface
├── hooks/                   # Custom React hooks (e.g. storage hooks)
├── lib/
│   ├── ai/                  # AI Provider integrations & prompt builder
│   │   ├── anthropic.ts
│   │   ├── fallback.ts
│   │   ├── gemini.ts
│   │   ├── groq.ts
│   │   ├── languagetool.ts
│   │   ├── model-defaults.ts
│   │   ├── openai.ts
│   │   ├── openrouter.ts
│   │   ├── prompt.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── cache/               # Caching layer for API calls
│   ├── correction/          # Text correction pipelines
│   ├── messaging/           # Extension runtime messaging interface
│   ├── selection/           # Text selection extraction and DOM placement
│   ├── storage/             # Chrome storage manager & schema migrations
│   │   ├── chrome-storage.ts
│   │   ├── favorites.ts
│   │   ├── history.ts
│   │   ├── migrations.ts
│   │   ├── settings.ts
│   │   └── types.ts
│   └── utils/               # Utility functions
├── public/                  # Static assets copied directly to build output
├── package.json             # NPM package configuration and scripts
├── tsconfig.json            # TypeScript compiler configuration
└── wxt.config.ts            # WXT framework configuration and Manifest V3 manifest
```

---

## Setup and Installation

### Prerequisites

- Node.js (v18.x or higher)
- npm or pnpm / yarn package manager

### 1. Clone the repository and install dependencies

```bash
npm install
```

### 2. Development Mode

To start the development server with hot-reloading for Google Chrome:

```bash
npm run dev
```

To run in Firefox:

```bash
npm run dev:firefox
```

This launches a separate browser instance with the extension pre-loaded.

---

## Building and Packaging

### Compile TypeScript Types

```bash
npm run compile
```

### Production Build

To build the extension for production (outputs to `.output/chrome-mv3` or `.output/firefox-mv2` / `.output/firefox-mv3`):

```bash
# Build for Chrome
npm run build

# Build for Firefox
npm run build:firefox
```

### Create Zip Distributions

To create production zip archives ready for submission to web stores:

```bash
# Package for Chrome Web Store
npm run zip

# Package for Firefox Add-ons
npm run zip:firefox
```

---

## Permissions & Manifest Details

Declared Manifest V3 permissions in `wxt.config.ts`:

- `activeTab`: Access the currently active tab to inspect and modify selected text.
- `storage`: Store user preferences, provider credentials, and historical logs locally.
- `contextMenus`: Register context menu options on highlighted text.
- `commands`: Bind global keyboard shortcuts (`Ctrl+Shift+G` / `Cmd+Shift+G`).

### Host Permissions

Connections are limited to supported API endpoints:
- `https://api.languagetool.org/*`
- `https://generativelanguage.googleapis.com/*`
- `https://api.groq.com/*`
- `https://openrouter.ai/*`
- `https://api.openai.com/*`
- `https://api.anthropic.com/*`

---

## Usage Guide

1. **Highlight Text**: Select any editable or plain text on any web page.
2. **Trigger WriteFix AI**:
   - Click the floating toolbar icon that appears near your selection.
   - Use the keyboard shortcut: `Ctrl+Shift+G` (Windows/Linux) or `Cmd+Shift+G` (macOS).
   - Right-click and choose **Improve Writing** from the context menu.
3. **Select Action**: Pick an action such as **Fix Grammar**, **Rephrase**, **Professional Tone**, or type a custom prompt.
4. **Review & Replace**: View the generated response and diff view, then click **Replace** to apply the change directly to the text field or copy it to the clipboard.

---

## License

ISC License
