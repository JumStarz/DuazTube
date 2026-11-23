<div align="center">

# ✦ DuazTube

**Dual Subtitles, Synced Lyrics, Contextual Lookup & AI Translator for YouTube and Bilibili**

🌐 **English** | [Tiếng Việt](README.vi.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox%20Add--ons-Install%20Now-FF7139?logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/firefox/addon/duaztube/)
[![Browser: Firefox](https://img.shields.io/badge/Firefox-140%2B-orange.svg)](https://addons.mozilla.org/firefox/addon/duaztube/)
[![Browser: Chromium](https://img.shields.io/badge/Chromium-Chrome%20%7C%20Edge%20%7C%20Brave-brightgreen.svg)](https://github.com/JumStarz/DuazTube/releases)

</div>

---

## Preview

### Lyric Glow & Dual Subtitles in Action
> Word-by-word **Lyric Glow** highlight (off by default — enable anytime in **Subtitle Style 🎨**) with customizable speed (`0.5x–2.0x`), font sizes, colors, and clean Starlight layout.



https://github.com/user-attachments/assets/dafef482-2be7-48c5-a160-2531abe5b9be



---

## Popup & Player Controls Guide

| Button / Icon | Function |
| :--- | :--- |
| **DuazTube Logo** *(on video player bar)* | 1-click quick toggle to turn dual subtitles On/Off directly beside the `CC` (YouTube) or `字幕` (Bilibili) button. |
| **On / Off** | Quickly show or hide the dual subtitle overlay on the video. |
| **Auto-pause** | Automatically pauses the video at the end of every subtitle line (great for listening & shadowing). |
| **Loop** | Continuously repeats the current subtitle line until turned off. |
| `⏮ Prev (A)` / `⏯ Play/Replay (S)` / `Next (D) ⏭` | Jump to the previous/next line or play/pause/replay the current line (works with keyboard shortcuts `A`, `S`, `D`). |
| `🎵` | Fetch accurate, time-synced song lyrics from **LRCLIB** (free, no key), search songs manually, and adjust timing offset (`-1s` / `-0.5s` / `0s` / `+0.5s` / `+1s`) for MVs with intros. |
| `🎙 AI Sub` | Start/stop real-time **AI Whisper** speech-to-text for videos without subtitles. |
| `📂` | Import a local `.SRT` or `.VTT` subtitle file from your computer. |
| `🎨` | Customize subtitle appearance (Dual/Original/Translation mode, font sizes, colors, background opacity, bottom position, max width, and **Lyric Glow**). |
| `⚙️` | Open the full Settings & Dashboard page (API keys, target language, custom AI prompt, saved vocabulary list & Anki `.CSV` export, UI language). |
| `⬇` | Download the current subtitles as `.SRT` (Dual / Original / Translation), `.VTT`, or `.TXT`. |
| `🔄` | Force re-translate all subtitles of the current video. |

> **Tip (On-video Dictionary):** Click any word directly on the subtitle to look it up, click `🔊` to hear pronunciation, or click `☆` (`★`) to save it to your Vocabulary list.

## Installation

### Firefox (Recommended — Official Store)
Install directly from the **Firefox Add-ons Store**:
- 👉 **[Install DuazTube on Firefox Add-ons](https://addons.mozilla.org/firefox/addon/duaztube/)**

### Chrome / Edge / Brave / Cốc Cốc (Chromium)
1. Download `Duaztube-chromium.zip` from the [Releases](https://github.com/JumStarz/DuazTube/releases) page and extract it.
2. Open `chrome://extensions/` (or `edge://extensions/`) and enable **Developer mode**.
3. Click **Load unpacked** and select the extracted `Duaztube-chromium` folder.

### Manual / Developer Installation (Firefox)
1. Clone this repository or download `Duaztube-firefox.zip` from [Releases](https://github.com/JumStarz/DuazTube/releases).
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...** and select `Duaztube-firefox/manifest.json`.

## Privacy & Security
- **Zero Data Collection**: DuazTube does **not** collect, track, or send user data to any developer-owned server.
- **Local API Key Storage**: Your personal AI API keys (Gemini, Groq, etc.) are stored strictly locally in `storage.local` and sent only to the official provider endpoint you choose.

## Support
DuazTube is 100% free and open-source. If you find it helpful, consider supporting its development:
- 🎮 [PlayerDuo (Vietnam)](https://playerduo.net.vn/12897348) · ☕ [Gumroad (Global)](https://jumstar.gumroad.com/l/donate)

## Disclaimer
DuazTube is an independent open-source educational tool and is not affiliated with YouTube, Bilibili, Google, Microsoft, or Mozilla. Users are responsible for complying with the terms of their chosen translation API providers.

## License
Licensed under the [MIT License](LICENSE).
