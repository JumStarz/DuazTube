<div align="center">

# ✦ DuazTube

**Dual Subtitles, Contextual Lookup & AI Translator for YouTube and Bilibili**

🌐 **English** | [Tiếng Việt](README.vi.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Browser: Firefox](https://img.shields.io/badge/Firefox-109%2B-orange.svg)](https://www.mozilla.org/firefox/)
[![Browser: Chromium](https://img.shields.io/badge/Chromium-Chrome%20%7C%20Edge%20%7C%20Brave-brightgreen.svg)](https://www.chromium.org/)

</div>

---

## Preview

### Lyric Glow & Dual Subtitles in Action
> Word-by-word **Lyric Glow** highlight (off by default — enable anytime in **Subtitle Style 🎨**) with customizable speed (`0.5x–2.0x`), font sizes, colors, and clean Starlight layout.



https://github.com/user-attachments/assets/dafef482-2be7-48c5-a160-2531abe5b9be



---

## Key Features
- **YouTube & Bilibili Support**: Runs exclusively on video watch pages (`youtube.com/watch`, `bilibili.com/video/*`, `bilibili.com/bangumi/play/*`). All controls live neatly inside the toolbar Popup & full-page Dashboard (`options.html`).
- **Synced Music Lyrics (LRCLIB)**: Fetch accurate, time-synced song lyrics directly from **LRCLIB** (100% free, no API key required) with one click (`🎵`), manual song search, and instant timing offset adjustment (`-1s` / `-0.5s` / `0s` / `+0.5s` / `+1s`) without re-translating — eliminating YouTube auto-caption mishearings on music videos.
- **Smart Subtitle Processing**: Automatically cleans `[Music]`/`♪` tags, fixes split contractions, merges broken fragments into natural, readable sentences, and prioritizes translating the segment you are currently watching for instant playback.
- **Multiple Translators**:
  - **Free / No-Key**: Google Translate (context-aware & batch POST), Bing / Microsoft Translator, MyMemory.
  - **AI Models (BYOK / Local)**: Google Gemini, Groq (Llama 3.3), Ollama (100% offline/local), and Custom OpenAI-compatible endpoints (OpenRouter, DeepSeek, etc.) with context-aware prompts that automatically infer and correct auto-caption (ASR) mistakes.
- **Interactive Learning & Shortcuts**:
  - Click any word on the subtitle to pause, translate, view phonetics & AI context explanation, listen to pronunciation (`🔊`), and save to Vocabulary (`☆` → export `.CSV` for Anki).
  - Shortcuts: `A` (Previous), `S` (Play/Pause/Replay), `D` (Next), plus **Auto-pause** and **Loop** modes.
- **Customizable Appearance & Lyric Glow**: Adjust font sizes, colors, background opacity, bottom offset, max width (up to 98%), and toggle **Lyric Glow** word-by-word highlight (off by default) with adjustable speed (`0.5x-2.0x`).
- **For Videos Without Subtitles**: Real-time **AI Whisper** speech-to-text (Groq / Local) and local `.SRT`/`.VTT` file import.
- **Subtitle Export**: Download subtitles directly in `.SRT` (Dual / Original / Translation), `.VTT`, or `.TXT` formats.
- **Multi-language UI**: Supports **Tiếng Việt**, **English**, and **简体中文**.

## Installation
### From Releases (Recommended)
Download `duaztube-firefox.zip` or `duaztube-chromium.zip` from the [Releases](https://github.com/JumStarz/DuazTube/releases) page.

### Manual / Developer Installation
- **Firefox (`Duaztube-firefox`)**:
  1. Open `about:debugging#/runtime/this-firefox`
  2. Click **Load Temporary Add-on...** and select `Duaztube-firefox/manifest.json`.
- **Chrome / Edge / Brave / Cốc Cốc (`Duaztube-chromium`)**:
  1. Open `chrome://extensions/` (or `edge://extensions/`) and enable **Developer mode**.
  2. Click **Load unpacked** and select the `Duaztube-chromium` folder.

## Privacy & Security
- **Zero Data Collection**: DuazTube does **not** collect, track, or send user data to any developer-owned server.
- **Local API Key Storage**: Your personal AI API keys (Gemini, Groq, etc.) are stored strictly locally in `storage.local` and sent only to the official provider endpoint you choose.

## Disclaimer
DuazTube is an independent open-source educational tool and is not affiliated with YouTube, Bilibili, Google, Microsoft, or Mozilla. Users are responsible for complying with the terms of their chosen translation API providers.

## License
Licensed under the [MIT License](LICENSE).
