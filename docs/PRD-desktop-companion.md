# Product Requirements Document (PRD): WriteFix AI Desktop Companion

- **Title**: WriteFix AI Desktop Companion — System-Wide Writing Assistant
- **Document Type**: Product Requirements Document (PRD)
- **Components**: WriteFix Desktop Companion (native app) + `@writefix/core` (shared package)
- **Status**: Draft — for review
- **Owner**: Siddhesh Shinde
- **Related**: WriteFix AI — Chrome Extension (existing, web-scope)

---

## 1. Summary

WriteFix AI currently corrects and transforms text on web pages via a Chrome extension. This PRD scopes a companion native application that extends the same correction/rewrite/tone/summarize experience to the rest of the operating system — desktop apps (WhatsApp Desktop, Telegram Desktop, Notepad, Word, Slack, etc.) that a browser extension structurally cannot reach.

The two products share one core engine. Provider integrations, prompt building, and diff logic are extracted into a shared package (`@writefix/core`) so behavior and quality stay consistent between the web extension and the desktop companion.

---

## 2. Problem Statement

A browser extension can only inject into pages rendered inside the browser's own engine. It has no access to native Windows applications — WhatsApp Desktop, Telegram Desktop, and Notepad are outside the extension's sandbox entirely, by design of the browser security model. There is no manifest permission or Chrome API that closes this gap.

Users currently have to copy text out of a native app, paste it into a browser tab running WriteFix, correct it, then copy it back — or avoid using WriteFix for the majority of their daily typing (chat apps, IDEs, documents), which happens outside the browser.

---

## 3. Goals

- Let a user trigger WriteFix's correction/rewrite/tone/summarize actions from any focused text field on Windows, regardless of which application owns it.
- Reuse the existing AI provider integrations, prompt logic, and diff/replace UX rather than rebuilding them.
- Keep the trigger fully explicit and user-initiated — no passive or continuous text capture.
- Ship a companion app that a security-conscious user (and antivirus heuristics) can trust at a glance.

---

## 4. Non-Goals (This Phase)

- macOS and Linux support — explicitly deferred to a later phase (different OS-level APIs entirely).
- Mobile (Android/iOS) system-wide support.
- Replacing the Chrome extension — it continues to own the in-browser experience.
- Cloud sync of history/favorites between extension and desktop app — tracked as an open question, not committed scope.

---

## 5. System Architecture

The system splits into two front-ends sharing one core:

- **WriteFix Extension** (existing) — Chrome MV3, content-script injection, browser tabs only.
- **WriteFix Desktop Companion** (new) — native background app, system tray, OS-level hotkey and text capture.
- **`@writefix/core`** (new, shared) — AI provider clients, prompt builder, response schema, diff engine. No UI, no platform-specific code.

### Extraction targets from the existing codebase into `@writefix/core`:

- `lib/ai/*` (`anthropic.ts`, `gemini.ts`, `groq.ts`, `openai.ts`, `openrouter.ts`, `languagetool.ts`, `fallback.ts`, `model-defaults.ts`)
- `lib/ai/prompt.ts`, `schema.ts`, `types.ts`
- Diff computation logic used by `DiffView.tsx` (UI stays separate; the diff algorithm moves to core)

---

## 6. How Capture & Replace Work (Windows)

Native apps expose no DOM, so there is no equivalent of a content script. Two complementary mechanisms are used, with automatic fallback between them.

### 6.1 Clipboard + simulated keystrokes (primary, universal)

1. User selects text in any application and presses the global hotkey (default `Ctrl+Shift+G`).
2. Companion app reads and caches the current clipboard contents (to restore later).
3. Companion app simulates `Ctrl+C`, then reads the new clipboard value — this is the captured selection.
4. Selection is sent to the selected AI provider through `@writefix/core`; a floating overlay appears near the cursor with the result and diff view.
5. On "Replace", the result is written to the clipboard, `Ctrl+V` is simulated into the focused field, and the user's original clipboard contents are restored a moment later.

This path works in effectively any text field — WhatsApp Desktop, Telegram Desktop, Notepad, Word, Slack — because it never depends on the target app's internals.

### 6.2 UI Automation — UIA (enhanced path, app-dependent)

On apps that expose a proper Text/Value pattern via Windows' accessibility API, the companion app can read and write the focused control directly — skipping the clipboard round-trip and enabling true in-place diffing. WhatsApp Desktop and Telegram Desktop are both Electron apps; Electron's UIA support is inconsistent between apps and between versions, so this must be verified empirically per app rather than assumed. Where UIA is unavailable or unreliable, the app falls back to 6.1 automatically.

*Known limitation*: If a target application is running elevated (as administrator) and the companion app is not, Windows blocks cross-privilege UIA and simulated input silently. This will be documented as a known limitation, not treated as a bug to chase.

---

## 7. Trigger Model

The companion app is idle by default. It performs no background reading of any kind. The only action that initiates a capture is the user pressing the configured global hotkey with text selected in the focused application.

- Default hotkey: `Ctrl+Shift+G` (matches the existing extension shortcut for consistency).
- Hotkey is remappable in settings.
- Registered via `RegisterHotKey` for the specific combination only — never a low-level keyboard hook that observes all keystrokes.
- A visible tray icon reflects state (idle / capturing / awaiting action) so the user always knows the app's status.

---

## 8. Technology Choice

Recommendation: **Tauri** (Rust core + React/TS UI).

- Reuse from extension: UI components, `@writefix/core`.
- Win32 / UIA access: Direct via `windows-rs` crate (robust).
- Input simulation: `enigo` crate.
- Footprint: Small, fast background process (no bundled Chromium runtime).
- Security: Lower attack surface than Electron native modules on Windows.

---

## 9. Security & Distribution

- Register only the specific hotkey combination via `RegisterHotKey` — never a raw low-level keyboard hook.
- Code-sign the Windows binary to prevent SmartScreen warnings.
- Explicit in-app privacy policy: only captured selection on hotkey trigger, cleared immediately after use.
- Persistent visible tray icon showing active/idle state.
- API keys and history remain local by default.

---

## 10. Phased Roadmap

- **Phase 1**: Extract shared core (`@writefix/core` workspace package containing AI providers, prompts, diff engine).
- **Phase 2**: MVP Companion App (Tauri tray app, global hotkey, clipboard capture/paste-back, floating overlay UI).
- **Phase 3**: UIA Enhancement (Direct read/write via UI Automation where supported).
- **Phase 4**: Settings & History (Local vs account-synced storage decisions).
- **Phase 5**: Packaging & Release (Auto-updater, code-signing, installer).
- **Phase 6**: macOS / Linux support.

---

## 11. Success Criteria

- Hotkey-triggered capture and replace succeeds reliably in Notepad, Word, WhatsApp Desktop, and Telegram Desktop.
- Original clipboard contents are restored after every replace operation with no data loss.
- Companion app is not flagged by mainstream antivirus/SmartScreen on code-signed builds.
- Median capture-to-overlay latency is sub-second (excluding AI provider network response time).

---

## 12. Open Questions

1. Should extension and desktop-app history/favorites sync via an account, or remain independently local?
2. Should elevated-app support (matching privilege for UIA) be a stated limitation or a future stretch goal?
3. Which providers get first-class desktop testing priority (same set as extension or trimmed MVP)?

---

## 13. Appendix — Shared vs. Platform-Specific Code

| Layer | Owner | Notes |
|---|---|---|
| AI provider clients | `@writefix/core` | `anthropic.ts`, `gemini.ts`, `groq.ts`, `openai.ts`, `openrouter.ts`, `languagetool.ts`, `fallback.ts` |
| Prompt building & schema | `@writefix/core` | `prompt.ts`, `schema.ts`, `types.ts` |
| Diff computation | `@writefix/core` | Algorithm only; rendering stays per-platform |
| Selection capture | Platform-specific | Extension: DOM selection API. Desktop: clipboard + UIA. |
| Text replacement | Platform-specific | Extension: DOM mutation. Desktop: simulated paste or UIA write. |
| Overlay / diff UI | Shared components, platform shell | React components reused; hosting shell differs. |
| Storage | Platform-specific (for now) | `chrome.storage.local` vs desktop local store. |
