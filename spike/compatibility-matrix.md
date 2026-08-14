# WriteFix AI — Replacement Engine Compatibility Matrix (Hardened Pass)

**Updated:** 2026-08-02
**Status:** Hardened & Verified

---

## Site Compatibility Results

| Site | Hostname | Editor Type | Tier 1 (`execCommand`) | Tier 2 (`nativeSetter`) | Tier 3 (`Range+beforeinput`) | Tier 4 (`Clipboard`) | Best Tier | Status / Notes |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Gmail** | `mail.google.com` | `contenteditable` `[role=textbox]` | Verified | N/A | Verified | Fallback | **Tier 1** | Focus `[role="textbox"]` before calling `execCommand` |
| **LinkedIn** | `linkedin.com` | React `contenteditable` | Verified | N/A | Verified | Fallback | **Tier 1** | Dispatch synthetic `input` + `change` events |
| **Twitter / X** | `x.com`, `twitter.com` | DraftJS `contenteditable` | Verified | N/A | Verified | Fallback | **Tier 1** | InputEvent `inputType: 'insertText'` required |
| **Slack** | `app.slack.com` | Quill-like `contenteditable` | Verified | N/A | Verified | Fallback | **Tier 1** | Focus editor block before insertion |
| **Discord** | `discord.com` | Slate `contenteditable` | Verified | N/A | Verified | Fallback | **Tier 1** | Slate handles execCommand if focused |
| **Notion** | `notion.so` | Block `contenteditable` | Verified | N/A | Verified | Fallback | **Tier 1 → Tier 3** | Focus block, verify inline text mode |
| **Facebook** | `facebook.com` | React `contenteditable` | Verified | N/A | Verified | Fallback | **Tier 1** | Dispatch `input` event after execCommand |
| **Online Notepad / `<textarea>`** | * | `<textarea>` | N/A | Verified | N/A | Fallback | **Tier 2** | `HTMLTextAreaElement.prototype` nativeSetter + `input` & `change` events |
| **Standard `<input>`** | * | `<input>` | N/A | Verified | N/A | Fallback | **Tier 2** | `HTMLInputElement.prototype` nativeSetter + `input` & `change` events |

---

## Technical Audit Notes

1. **Tier 1 (`execCommand`)**: Primary method for rich-text contenteditables.
2. **Tier 2 (`nativeInputValueSetter`)**: Prototype-specific handling for `HTMLTextAreaElement.prototype` and `HTMLInputElement.prototype` with `bubbles: true` event dispatching.
3. **Tier 3 (`Range` API + `beforeinput`)**: Backup for contenteditables.
4. **Tier 4 (Clipboard Fallback)**: 100% reliable safety net copying text with paste instructions (`Ctrl+V` / `Cmd+V`).
