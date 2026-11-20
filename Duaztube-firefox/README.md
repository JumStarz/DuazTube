# DuazTube - Dual Subtitles & AI Translator for YouTube (Firefox)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Browser: Firefox](https://img.shields.io/badge/Firefox-109%2B-orange.svg)](https://www.mozilla.org/firefox/)

**DuazTube** is a lightweight, open-source Firefox extension designed for learning languages on YouTube (`youtube.com/watch`). It displays customizable dual subtitles, word-by-word Lyric Glow effects, instant contextual lookup, and AI-powered translation without cluttering YouTube's native layout.

## Key Features
- **YouTube-Only Scope**: Runs exclusively on `youtube.com/watch` pages. All controls live inside the toolbar Popup & full-page Dashboard (`options.html`).
- **Smart Subtitle Processing**: Automatically cleans `[Music]`/`♪` tags, fixes split contractions, merges broken fragments into full sentences, and prioritizes translating the segment you are currently watching.
- **Multiple Translators**:
  - **Free / No-Key**: Google Translate (context-aware), Bing / Microsoft Translator, MyMemory.
  - **AI Models (BYOK / Local)**: Google Gemini, Groq (Llama 3.3), Ollama (100% offline/local), and Custom OpenAI-compatible endpoints (OpenRouter, DeepSeek, etc.).
- **Interactive Learning & Shortcuts**:
  - Click any word on the subtitle to pause, translate, view phonetics & AI context explanation, listen to pronunciation (`🔊`), and save to Vocabulary (`☆` → export `.CSV` for Anki).
  - Shortcuts: `A` (Previous), `S` (Play/Pause/Replay), `D` (Next), plus **Auto-pause** and **Loop** modes.
- **Customizable Appearance & Lyric Glow**: Adjust font sizes, colors, background opacity, bottom offset, max width (up to 98%), and toggle **Lyric Glow** word-by-word highlight with adjustable speed (`0.5x–2.0x`).
- **For Videos Without Subtitles**: Real-time **AI Whisper** speech-to-text (Groq / Local) and local `.SRT`/`.VTT` file import.
- **Subtitle Export**: Download subtitles directly in `.SRT` (Dual / Original / Translation), `.VTT`, or `.TXT` formats.
- **Multi-language UI**: Supports **Tiếng Việt**, **English**, and **简体中文**.

## Installation
### From Firefox Add-ons (Recommended)
*(Add your AMO store link here once approved)*

### Manual / Developer Testing
1. Download or clone this repository.
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...** and select `manifest.json`.

## Privacy & Security
- **Zero Data Collection**: DuazTube does **not** collect, track, or send user data to any developer-owned server.
- **Local API Key Storage**: Your personal AI API keys (Gemini, Groq, etc.) are stored strictly locally in `browser.storage.local` and sent only to the official provider endpoint you choose.

## Support / Donate
If you find DuazTube helpful, consider supporting its development:
- Buy Me a Coffee: `https://buymeacoffee.com/YOUR_USERNAME`
- Ko-fi: `https://ko-fi.com/YOUR_USERNAME`

## Disclaimer
DuazTube is an independent open-source educational tool and is not affiliated with YouTube, Google, Microsoft, or Mozilla. Users are responsible for complying with the terms of their chosen translation API providers.

## License
Licensed under the [MIT License](LICENSE).