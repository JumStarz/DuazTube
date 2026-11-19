(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;
  const IS_BILI = location.hostname.includes("bilibili.com");
  const IS_YT = location.hostname.includes("youtube.com");

  const script = document.createElement("script");
  script.src = api.runtime.getURL("injected.js");
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();

  const DEFAULT_SETTINGS = {
    uiLang: "vi",
    provider: "google",
    targetLang: "vi",
    theme: "starlight",
    autoHideYtSubs: true,
    mergeShortSubs: true,
    defaultAutoPause: false,
    customPrompt: "",
    mymemoryEmail: "",
    geminiKey: "",
    geminiModel: "gemini-2.5-flash",
    groqKey: "",
    groqModel: "llama-3.3-70b-versatile",
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "qwen2.5:7b",
    customUrl: "https://openrouter.ai/api/v1/chat/completions",
    customKey: "",
    customModel: "google/gemini-2.0-flash-exp:free",
    whisperMode: "groq",
    whisperLang: "auto",
    whisperLocalUrl: "http://localhost:8000/v1/audio/transcriptions"
  };

  const DEFAULT_APPEARANCE = {
    displayMode: "both",
    origSize: 22,
    transSize: 16,
    origColor: "#eef3fb",
    transColor: "#ecd08b",
    bgOpacity: 82,
    bottomOffset: 58,
    maxWidth: 92,
    glowMode: "none",
    glowSpeed: 1.0
  };

  const state = {
    enabled: true,
    autoPause: false,
    loopCurrent: false,
    tracks: [],
    currentTrackIndex: 0,
    subtitles: [],
    rawJson3: null,
    activeIndex: -1,
    pausedAtIndex: -1,
    videoEl: null,
    currentVideoId: null,
    currentLang: IS_BILI ? "zh-CN" : "auto",
    translateRunId: 0,
    isTranslating: false,
    aiAsrActive: false,
    statusMsg: "",
    statusIsError: false,
    settings: { ...DEFAULT_SETTINGS },
    appearance: { ...DEFAULT_APPEARANCE }
  };

  api.storage.local.get(["ltSettings", "ltAppearance"], (res) => {
    if (res?.ltSettings) {
      state.settings = { ...DEFAULT_SETTINGS, ...res.ltSettings };
      state.autoPause = !!state.settings.defaultAutoPause;
    }
    if (res?.ltAppearance) {
      const app = { ...DEFAULT_APPEARANCE, ...res.ltAppearance };
      if (!app.glowV2Migrated) {
        app.glowMode = "none";
        app.glowV2Migrated = true;
        api.storage.local.set({ ltAppearance: app });
      }
      state.appearance = app;
      applyAppearanceToOverlay();
    } else {
      const app = { ...DEFAULT_APPEARANCE, glowV2Migrated: true };
      api.storage.local.set({ ltAppearance: app });
      state.appearance = app;
    }
  });

  api.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.ltAppearance?.newValue) {
      state.appearance = { ...DEFAULT_APPEARANCE, ...changes.ltAppearance.newValue };
      applyAppearanceToOverlay();
      if (state.activeIndex !== -1) renderOverlay(state.subtitles[state.activeIndex]);
    }
    if (changes.ltSettings?.newValue) {
      const oldS = state.settings;
      const newS = { ...DEFAULT_SETTINGS, ...changes.ltSettings.newValue };
      state.settings = newS;
      document.body?.classList.toggle("lt-hide-yt-subs", state.enabled && newS.autoHideYtSubs);

      if (IS_YT && oldS.mergeShortSubs !== newS.mergeShortSubs && state.rawJson3) {
        state.subtitles = parseJson3Events(state.rawJson3);
        retranslateAll();
      } else if (
        (oldS.provider !== newS.provider || oldS.targetLang !== newS.targetLang || oldS.customPrompt !== newS.customPrompt) &&
        state.subtitles.length > 0
      ) {
        retranslateAll();
      }
    }
  });

  let overlayEl, popupEl, syncTimer = null;
  let activeWordEls = [], lastGlowWordIdx = -2;
  let asrLoopTimer = null, currentRecorder = null;

  // Biến riêng cho Bilibili DOM fallback & SPA tracking
  let biliObservedWrap = null, biliDomObserver = null, lastBiliUrl = location.href, lastBiliDomText = "";
  const biliFetchedUrls = new Set();
  const biliDomCache = new Map();

  function isWatchPage() {
    if (IS_YT) return window.location.pathname === "/watch";
    if (IS_BILI) return location.pathname.includes("/video/") || location.pathname.includes("/bangumi/play/");
    return false;
  }

  function getPlayerContainer() {
    if (IS_YT) return document.getElementById("movie_player");
    if (IS_BILI) {
      return document.querySelector(".bpx-player-video-area") || document.querySelector(".bilibili-player-video-area");
    }
    return null;
  }

  function getVideoElement() {
    if (IS_YT) return document.querySelector("video.html5-main-video");
    if (IS_BILI) return document.querySelector(".bpx-player-video-wrap video, .bilibili-player-video video, video");
    return null;
  }

  function sendBgMessage(payload) {
    if (typeof browser !== "undefined" && browser.runtime?.sendMessage) {
      return browser.runtime.sendMessage(payload);
    }
    return new Promise((resolve) => chrome.runtime.sendMessage(payload, resolve));
  }

  function notifyPopup(payload) {
    try {
      const p = api.runtime.sendMessage(payload);
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e) {}
  }

  function setStatus(msg, isError = false) {
    state.statusMsg = msg;
    state.statusIsError = isError;
    notifyPopup({ type: "LT_POPUP_STATUS", statusMsg: msg, statusIsError: isError });
  }

  function applyAppearanceToOverlay() {
    if (!overlayEl) return;
    const a = state.appearance;
    const opacity = Math.max(0, Math.min(1, (a.bgOpacity ?? 82) / 100));

    overlayEl.style.setProperty("--lt-orig-size", (a.origSize || 22) + "px");
    overlayEl.style.setProperty("--lt-trans-size", (a.transSize || 16) + "px");
    overlayEl.style.setProperty("--lt-orig-color", a.origColor || "#eef3fb");
    overlayEl.style.setProperty("--lt-trans-color", a.transColor || "#ecd08b");
    overlayEl.style.setProperty("--lt-bottom", (a.bottomOffset ?? 58) + "px");
    overlayEl.style.setProperty("--lt-max-width", (a.maxWidth ?? 92) + "%");
    overlayEl.style.setProperty("--lt-bg", `rgba(14, 20, 36, ${opacity})`);
    overlayEl.style.setProperty(
      "--lt-border",
      opacity > 0.08 ? `rgba(216, 180, 103, ${Math.min(0.48, opacity * 0.55)})` : "transparent"
    );
    overlayEl.style.boxShadow = opacity > 0.08 ? "0 6px 20px rgba(5, 8, 18, 0.5)" : "none";

    const gm = a.glowMode || "none";
    const isGlow = gm === "lyric" || gm === "spotify" || gm === "wave";
    overlayEl.classList.toggle("lt-glow-on", isGlow);
    overlayEl.classList.toggle("lt-glow-wave", gm === "wave");
    const spd = Math.max(0.5, Math.min(2.0, parseFloat(a.glowSpeed) || 1.0));
    overlayEl.style.setProperty("--lt-wave-dur", (3.2 / spd).toFixed(2) + "s");
  }

  function ensureOverlayUI() {
    if (!document.body) return;

    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.id = "lt-overlay";
      overlayEl.style.display = "none";
    }
    applyAppearanceToOverlay();

    const playerContainer = getPlayerContainer();
    if (playerContainer && !playerContainer.contains(overlayEl)) {
      playerContainer.appendChild(overlayEl);
    }

    if (!popupEl) {
      popupEl = document.createElement("div");
      popupEl.id = "lt-dict-popup";
      popupEl.style.display = "none";
      document.body.appendChild(popupEl);
      document.addEventListener("click", (e) => {
        if (!popupEl.contains(e.target) && !e.target.classList.contains("lt-word")) {
          popupEl.style.display = "none";
        }
      });
    }

    document.body.classList.toggle("lt-hide-yt-subs", state.enabled && state.settings.autoHideYtSubs);
    bindVideoEvents();
  }

  function bindVideoEvents() {
    const v = getVideoElement();
    if (!v) return;
    if (state.videoEl !== v) state.videoEl = v;
    if (v.dataset.ltBound === "1") return;
    v.dataset.ltBound = "1";

    v.addEventListener("play", startSyncTimer);
    v.addEventListener("playing", startSyncTimer);
    v.addEventListener("pause", stopSyncTimer);
    v.addEventListener("ended", stopSyncTimer);
    v.addEventListener("seeked", onVideoSeeked);
    v.addEventListener("timeupdate", checkSubtitleTick);

    if (!v.paused) startSyncTimer();
  }

  function onVideoSeeked() {
    checkSubtitleTick();
    if (!state.videoEl || state.subtitles.length === 0 || state.aiAsrActive) return;
    const ms = state.videoEl.currentTime * 1000;
    const idx = findNearestSubtitleIndex(ms);
    if (state.subtitles[idx] && !state.subtitles[idx].trans && !state.statusIsError) {
      translateAllSubtitles(state.currentLang, idx);
    }
  }

  function startSyncTimer() {
    if (syncTimer) return;
    checkSubtitleTick();
    syncTimer = setInterval(checkSubtitleTick, 85);
  }

  function stopSyncTimer() {
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  }

  // --- BILIBILI LOGIC ---
  function loadBiliJsonData(jsonData) {
    if (!jsonData || !Array.isArray(jsonData.body)) return;
    const parsed = jsonData.body
      .map((item) => {
        const startMs = Math.round((Number(item.from) || 0) * 1000);
        const endMs = Math.max(startMs + 400, Math.round((Number(item.to) || (Number(item.from) || 0) + 2) * 1000));
        const text = (item.content || "").replace(/\s+/g, " ").trim();
        return { startMs, endMs, text, trans: biliDomCache.get(text) || "" };
      })
      .filter((c) => c.text);

    if (parsed.length === 0) return;

    ensureOverlayUI();
    state.currentVideoId = location.pathname;
    state.tracks = [{ languageCode: "zh-CN", name: "Bilibili Subtitle", isAuto: false }];
    state.currentTrackIndex = 0;
    state.subtitles = parsed;
    state.activeIndex = -1;
    state.pausedAtIndex = -1;
    state.currentLang = "zh-CN";

    notifyPopup({
      type: "LT_POPUP_FULL_REFRESH",
      tracks: state.tracks,
      currentTrackIndex: 0,
      subtitles: state.subtitles,
      activeIndex: -1
    });

    checkSubtitleTick();
    translateAllSubtitles("zh-CN");
  }

  function readBiliSubFromDom() {
    if (!biliObservedWrap) return "";
    let nodes = biliObservedWrap.querySelectorAll(".bili-subtitle-x-subtitle-panel-major-group .bili-subtitle-x-subtitle-panel-text");
    if (!nodes.length) {
      nodes = biliObservedWrap.querySelectorAll(".bili-subtitle-x-subtitle-panel-text, .bpx-player-subtitle-panel-text, .bilibili-player-video-subtitle-item-text");
    }
    return Array.from(nodes).map((el) => el.textContent.trim()).filter(Boolean).join(" ");
  }

  async function handleBiliDomTextChange() {
    if (state.subtitles.length > 0 || !state.enabled) return;
    const text = readBiliSubFromDom();
    if (text === lastBiliDomText) return;
    lastBiliDomText = text;

    if (!text) {
      renderOverlay(null);
      return;
    }

    ensureOverlayUI();
    const cached = biliDomCache.get(text);
    if (cached) {
      renderOverlay({ startMs: 0, endMs: 4000, text, trans: cached });
      return;
    }
    renderOverlay({ startMs: 0, endMs: 4000, text, trans: "" });

    api.runtime.sendMessage(
      {
        type: "TRANSLATE_BATCH",
        texts: [text],
        sourceLang: "zh-CN",
        targetLang: state.settings.targetLang || "vi",
        settings: state.settings
      },
      (res) => {
        if (res?.success && res.translations?.[0]) {
          biliDomCache.set(text, res.translations[0]);
          if (lastBiliDomText === text) {
            renderOverlay({ startMs: 0, endMs: 4000, text, trans: res.translations[0] });
          }
        }
      }
    );
  }

  function tickBiliObserver() {
    if (!IS_BILI || !isWatchPage()) return;
    if (location.href !== lastBiliUrl) {
      lastBiliUrl = location.href;
      state.subtitles = [];
      state.tracks = [];
      state.activeIndex = -1;
      lastBiliDomText = "";
      renderOverlay(null);
      window.postMessage({ type: "DT_BILI_RESCAN" }, "*");
    }

    ensureOverlayUI();
    if (state.subtitles.length > 0) return;

    const wrap =
      document.querySelector(".bpx-player-subtitle-wrap") ||
      document.querySelector(".bili-subtitle-x-subtitle-panel") ||
      document.querySelector(".bilibili-player-video-subtitle");

    if (!wrap) {
      if (biliObservedWrap) {
        biliObservedWrap = null;
        if (biliDomObserver) biliDomObserver.disconnect();
        lastBiliDomText = "";
        renderOverlay(null);
      }
      return;
    }

    if (wrap !== biliObservedWrap) {
      biliObservedWrap = wrap;
      if (biliDomObserver) biliDomObserver.disconnect();
      biliDomObserver = new MutationObserver(handleBiliDomTextChange);
      biliDomObserver.observe(wrap, { childList: true, subtree: true, characterData: true });
      handleBiliDomTextChange();
    }
  }

  if (IS_BILI) {
    setInterval(tickBiliObserver, 220);
  }

  // --- AI WHISPER REALTIME SPEECH-TO-TEXT ---
  function stopAiAsr() {
    state.aiAsrActive = false;
    if (asrLoopTimer) { clearTimeout(asrLoopTimer); asrLoopTimer = null; }
    if (currentRecorder && currentRecorder.state === "recording") {
      try { currentRecorder.stop(); } catch (e) {}
    }
    currentRecorder = null;
    setStatus("", false);
    notifyPopup({ type: "LT_ASR_STATE", active: false });
  }

  function startAiAsr() {
    ensureOverlayUI();
    const v = state.videoEl || getVideoElement();
    if (!v) { setStatus("Không tìm thấy trình phát video.", true); return; }
    if (state.settings.whisperMode === "groq" && !state.settings.groqKey?.trim()) {
      setStatus("Cần nhập Groq API Key miễn phí trong ⚙️ Cấu hình trình dịch trước.", true);
      return;
    }

    let stream = null;
    try {
      stream = v.captureStream ? v.captureStream() : (v.mozCaptureStream ? v.mozCaptureStream() : null);
    } catch (e) {}

    if (!stream || stream.getAudioTracks().length === 0) {
      setStatus("Không lấy được luồng âm thanh (hãy bật tiếng và phát video).", true);
      return;
    }

    const audioStream = new MediaStream([stream.getAudioTracks()[0]]);
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") ? "audio/ogg;codecs=opus" : "");

    state.aiAsrActive = true;
    state.currentLang = state.settings.whisperLang || "auto";
    setStatus("🎙 Đang nghe video và tạo phụ đề AI...", false);
    notifyPopup({ type: "LT_ASR_STATE", active: true });

    async function recordNextChunk() {
      if (!state.aiAsrActive) return;
      if (v.paused || v.ended) { asrLoopTimer = setTimeout(recordNextChunk, 600); return; }

      const chunkStartMs = Math.round(v.currentTime * 1000);
      const chunks = [];
      let rec;
      try {
        rec = mimeType ? new MediaRecorder(audioStream, { mimeType }) : new MediaRecorder(audioStream);
      } catch (e) {
        setStatus(`Lỗi MediaRecorder: ${e.message}`, true);
        stopAiAsr();
        return;
      }

      currentRecorder = rec;
      rec.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
      rec.onstop = async () => {
        if (!state.aiAsrActive) return;
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size > 1500) {
          const buf = await blob.arrayBuffer();
          const bytes = Array.from(new Uint8Array(buf));
          api.runtime.sendMessage(
            { type: "WHISPER_TRANSCRIBE", bytes, mimeType: blob.type, settings: state.settings },
            async (res) => {
              if (!state.aiAsrActive) return;
              if (!res?.success) {
                setStatus(`Lỗi Whisper: ${res?.error || "Không xác định"}`, true);
                stopAiAsr();
                return;
              }
              if (res.segments?.length > 0) {
                const newItems = res.segments.map((seg) => ({
                  startMs: chunkStartMs + seg.startOffsetMs,
                  endMs: chunkStartMs + Math.max(seg.endOffsetMs, seg.startOffsetMs + 1500),
                  text: seg.text,
                  trans: ""
                }));
                const trRes = await new Promise((resolve) => {
                  api.runtime.sendMessage(
                    {
                      type: "TRANSLATE_BATCH",
                      texts: newItems.map((x) => x.text),
                      sourceLang: state.currentLang,
                      targetLang: state.settings.targetLang || "vi",
                      settings: state.settings
                    },
                    resolve
                  );
                });
                if (trRes?.success && Array.isArray(trRes.translations)) {
                  newItems.forEach((item, idx) => { item.trans = trRes.translations[idx] || ""; });
                }
                state.subtitles.push(...newItems);
                state.subtitles.sort((a, b) => a.startMs - b.startMs);
                renderOverlay(newItems[newItems.length - 1]);
                notifyPopup({ type: "LT_POPUP_SYNC", subtitles: state.subtitles, activeIndex: state.subtitles.length - 1 });
              }
            }
          );
        }
        if (state.aiAsrActive) recordNextChunk();
      };

      rec.start();
      asrLoopTimer = setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 4800);
    }

    recordNextChunk();
  }

  // --- PARSE .SRT / .VTT ---
  function timeStrToMs(str) {
    const clean = str.trim().replace(",", ".");
    const parts = clean.split(":").map(Number);
    if (parts.length === 3) return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000);
    if (parts.length === 2) return Math.round((parts[0] * 60 + parts[1]) * 1000);
    return 0;
  }

  function parseSrtOrVtt(rawText) {
    const normalized = rawText.replace(/\r\n?/g, "\n").replace(/^WEBVTT[^\n]*\n+/i, "").trim();
    const blocks = normalized.split(/\n{2,}/);
    const subs = [];
    for (const block of blocks) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const timeLineIdx = lines.findIndex((l) => l.includes("-->"));
      if (timeLineIdx === -1) continue;
      const timeParts = lines[timeLineIdx].split("-->");
      if (timeParts.length < 2) continue;
      const startMs = timeStrToMs(timeParts[0]);
      const endMs = timeStrToMs(timeParts[1].split(/\s+/)[0]);
      const text = lines.slice(timeLineIdx + 1).join(" ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (text && endMs > startMs) subs.push({ startMs, endMs, text, trans: "" });
    }
    return subs;
  }

  function findSubtitleIndex(ms) {
    const subs = state.subtitles;
    const n = subs.length;
    if (n === 0) return -1;
    const cur = state.activeIndex;
    if (cur >= 0 && cur < n) {
      if (ms >= subs[cur].startMs && ms <= subs[cur].endMs) return cur;
      if (cur + 1 < n && ms >= subs[cur + 1].startMs && ms <= subs[cur + 1].endMs) return cur + 1;
    }
    let lo = 0, hi = n - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (ms < subs[mid].startMs) hi = mid - 1;
      else if (ms > subs[mid].endMs) lo = mid + 1;
      else return mid;
    }
    return -1;
  }

  function findNearestSubtitleIndex(ms) {
    const subs = state.subtitles;
    if (subs.length === 0) return 0;
    const exact = findSubtitleIndex(ms);
    if (exact !== -1) return exact;
    let lo = 0, hi = subs.length - 1, ans = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (subs[mid].startMs >= ms) { ans = mid; hi = mid - 1; }
      else { lo = mid + 1; }
    }
    return ans;
  }

  function checkSubtitleTick() {
    if (!state.videoEl || !state.enabled || state.subtitles.length === 0) return;

    const currentMs = state.videoEl.currentTime * 1000;
    const currentActive = state.subtitles[state.activeIndex];

    if (state.loopCurrent && currentActive && currentMs >= currentActive.endMs - 90) {
      state.videoEl.currentTime = currentActive.startMs / 1000 + 0.01;
      return;
    }
    if (
      state.autoPause &&
      currentActive &&
      state.pausedAtIndex !== state.activeIndex &&
      currentMs >= currentActive.endMs - 90 &&
      !state.videoEl.paused
    ) {
      state.videoEl.pause();
      state.pausedAtIndex = state.activeIndex;
      return;
    }

    const idx = findSubtitleIndex(currentMs);
    if (idx !== state.activeIndex) {
      state.activeIndex = idx;
      if (!state.aiAsrActive || idx !== -1) {
        renderOverlay(idx !== -1 ? state.subtitles[idx] : null);
      }
      notifyPopup({ type: "LT_POPUP_ACTIVE", activeIndex: idx });
    }
    updateWordGlow(currentMs);
  }

  function parseJson3Events(json3Data) {
    const rawEvents = (json3Data?.events || []).filter(
      (ev) => ev.segs && ev.segs.some((s) => s.utf8 && s.utf8.replace(/\n/g, "").trim() !== "")
    );

    const cleaned = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const ev = rawEvents[i];
      let text = ev.segs.map((s) => s.utf8).join("").replace(/\s+/g, " ").trim();
      text = text
        .replace(/\[\s*(?:music|âm nhạc|nhạc|instrumental|singing|applause|vỗ tay|laughter|cheering)\s*\]/gi, " ")
        .replace(/[♪♫]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!text) continue;

      const startMs = ev.tStartMs || 0;
      const nextStart = rawEvents[i + 1]?.tStartMs ?? startMs + 5000;
      const endMs = Math.max(startMs + 400, Math.min(startMs + (ev.dDurationMs || 4000), nextStart));

      if (cleaned.length > 0) {
        const prev = cleaned[cleaned.length - 1];
        const contrMatch = text.match(/^(['’](?:s|t|d|m|re|ve|ll))\b(.*)$/i);
        if (contrMatch && /[a-zA-Z]$/.test(prev.text)) {
          prev.text = prev.text + contrMatch[1];
          const rest = contrMatch[2].trim();
          if (!rest) { prev.endMs = Math.max(prev.endMs, endMs); continue; }
          cleaned.push({ startMs, endMs, text: rest, trans: "" });
          continue;
        }
      }
      cleaned.push({ startMs, endMs, text, trans: "" });
    }

    if (!state.settings.mergeShortSubs) return cleaned;

    const merged = [];
    const trailingWordsRe = /\b(a|an|the|my|your|his|her|its|our|their|to|of|in|on|at|for|with|by|from|and|but|or|so|that|which|who|when|where|if|as|is|are|was|were|be|been|have|has|had|will|would|can|could|should|do|does|did|don't|can't|won't|I'm|you're|we're|they're|it's)$/i;

    for (const item of cleaned) {
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        const gap = item.startMs - prev.endMs;
        const combinedLen = prev.text.length + 1 + item.text.length;
        const prevEndsSentence = /[.!?…\]"]$/.test(prev.text);
        const currWords = item.text.split(/\s+/).length;
        const prevEndsCommaOrLink = /[,;:\-–—]$/.test(prev.text) || trailingWordsRe.test(prev.text);
        const currStartsLower = /^[a-zà-ỹ0-9(,;'\"]/.test(item.text);

        if (!prevEndsSentence && gap < 1100 && combinedLen <= 125 && (currWords <= 3 || currStartsLower || prevEndsCommaOrLink)) {
          prev.text = `${prev.text} ${item.text}`.replace(/\s+/g, " ").trim();
          prev.endMs = Math.max(prev.endMs, item.endMs);
          continue;
        }
      }
      merged.push(item);
    }

    return merged;
  }

  function buildPendingBatches(startIdx, normalBatchSize) {
    const subs = state.subtitles;
    const n = subs.length;
    const batches = [];
    const added = new Set();

    function collectRange(from, to, size) {
      let cur = [];
      for (let i = from; i < to; i++) {
        if (!subs[i].trans && !added.has(i)) {
          cur.push(i);
          added.add(i);
          if (cur.length >= size) { batches.push(cur); cur = []; }
        }
      }
      if (cur.length > 0) batches.push(cur);
    }

    const safeStart = Math.max(0, Math.min(n - 1, startIdx));
    // Lô 0: chỉ 2 câu ngay tại vị trí đang phát để câu đầu hiện gần như tức thì (~120ms)
    const fastEnd = Math.min(n, safeStart + 2);
    collectRange(safeStart, fastEnd, 2);
    collectRange(fastEnd, n, normalBatchSize);
    collectRange(0, safeStart, normalBatchSize);
    return batches;
  }

  function retranslateAll() {
    biliDomCache.clear();
    if (IS_BILI && state.subtitles.length === 0) {
      lastBiliDomText = "";
      handleBiliDomTextChange();
      return;
    }
    state.subtitles.forEach((s) => (s.trans = ""));
    if (state.activeIndex !== -1) renderOverlay(state.subtitles[state.activeIndex]);
    notifyPopup({ type: "LT_POPUP_SYNC", subtitles: state.subtitles, activeIndex: state.activeIndex });
    const startIdx = state.videoEl ? findNearestSubtitleIndex(state.videoEl.currentTime * 1000) : 0;
    translateAllSubtitles(state.currentLang, startIdx);
  }

  async function translateAllSubtitles(sourceLang, startAt = null) {
    const provider = state.settings.provider;
    const isAI = ["gemini", "groq", "ollama", "custom"].includes(provider);
    const BATCH_SIZE = provider === "mymemory" ? 7 : (isAI ? 15 : 14);
    const targetVideoId = state.currentVideoId;
    const runId = ++state.translateRunId;
    const tl = state.settings.targetLang || "vi";

    const startIdx =
      startAt !== null
        ? startAt
        : (state.videoEl ? findNearestSubtitleIndex(state.videoEl.currentTime * 1000) : 0);

    const batches = buildPendingBatches(startIdx, BATCH_SIZE);
    if (batches.length === 0) return;

    state.isTranslating = true;
    setStatus(`Đang dịch (${provider.toUpperCase()})...`, false);

    async function runSingleBatch(indexList) {
      if (state.currentVideoId !== targetVideoId || state.translateRunId !== runId) return false;
      const texts = indexList.map((idx) => state.subtitles[idx].text);

      const res = await new Promise((resolve) => {
        api.runtime.sendMessage(
          { type: "TRANSLATE_BATCH", texts, sourceLang, targetLang: tl, settings: state.settings },
          resolve
        );
      });

      if (state.currentVideoId !== targetVideoId || state.translateRunId !== runId) return false;

      if (!res?.success) {
        state.isTranslating = false;
        setStatus(`Lỗi dịch: ${res?.error || "Không xác định"}`, true);
        return false;
      }

      if (Array.isArray(res.translations)) {
        let activeUpdated = false;
        res.translations.forEach((tr, k) => {
          const subIndex = indexList[k];
          if (state.subtitles[subIndex]) {
            state.subtitles[subIndex].trans = tr;
            if (subIndex === state.activeIndex) activeUpdated = true;
          }
        });
        if (activeUpdated && state.activeIndex !== -1) renderOverlay(state.subtitles[state.activeIndex]);
        notifyPopup({ type: "LT_POPUP_PATCH_INDICES", indices: indexList, translations: res.translations });
      }
      return true;
    }

    // Chạy song song Lô 0 (2 câu đầu) + Lô 1 (14 câu kế) cho các trình dịch nhanh
    if (provider !== "mymemory" && batches.length >= 2) {
      const head = batches.splice(0, 2);
      const okList = await Promise.all(head.map(runSingleBatch));
      if (okList.includes(false)) return;
    }

    for (const indexList of batches) {
      await new Promise((r) => setTimeout(r, 220));
      const ok = await runSingleBatch(indexList);
      if (!ok) return;
    }

    if (state.translateRunId === runId) {
      state.isTranslating = false;
      setStatus("", false);
    }
  }

  function updateWordGlow(currentMs) {
    const gm = state.appearance.glowMode || "none";
    if (gm === "none" || activeWordEls.length === 0) return;

    let activeWordIdx = -1;
    for (let i = 0; i < activeWordEls.length; i++) {
      if (currentMs >= activeWordEls[i].startMs) activeWordIdx = i;
      else break;
    }

    if (activeWordIdx === lastGlowWordIdx) return;
    lastGlowWordIdx = activeWordIdx;

    for (let i = 0; i < activeWordEls.length; i++) {
      const el = activeWordEls[i].el;
      if (i < activeWordIdx) {
        el.classList.remove("lt-dim", "lt-now");
        el.classList.add("lt-sung");
      } else if (i === activeWordIdx) {
        el.classList.remove("lt-dim", "lt-sung");
        el.classList.add("lt-now");
      } else {
        el.classList.remove("lt-sung", "lt-now");
        el.classList.add("lt-dim");
      }
    }
  }

  function renderOverlay(sub) {
    if (!overlayEl) return;
    overlayEl.textContent = "";
    activeWordEls = [];
    lastGlowWordIdx = -2;

    if (!sub || !sub.text || !state.enabled) {
      overlayEl.style.display = "none";
      return;
    }

    const mode = state.appearance.displayMode || "both";
    const showOrig = mode === "both" || mode === "orig";
    const showTrans = (mode === "both" || mode === "trans") && !!sub.trans;

    if (!showOrig && !showTrans) {
      overlayEl.style.display = "none";
      return;
    }

    overlayEl.style.display = "flex";

    if (showOrig) {
      const origLine = document.createElement("div");
      origLine.className = "lt-overlay-orig";
      const tokens = sub.text.split(/(\s+)/);
      const wordTokens = tokens.filter((tk) => !/^\s+$/.test(tk) && tk !== "");
      const totalChars = wordTokens.reduce((acc, w) => acc + w.length, 0) || 1;
      const spd = Math.max(0.5, Math.min(2.0, parseFloat(state.appearance.glowSpeed) || 1.0));
      const spanMs = Math.max(250, ((sub.endMs - sub.startMs) * 0.92) / spd);
      let accChars = 0;
      const useGlow = (state.appearance.glowMode || "none") !== "none";

      tokens.forEach((token) => {
        if (/^\s+$/.test(token)) {
          origLine.appendChild(document.createTextNode(token));
        } else if (token) {
          const wordStartMs = sub.startMs + Math.round((accChars / totalChars) * spanMs);
          accChars += token.length;

          const wordSpan = document.createElement("span");
          wordSpan.className = useGlow ? "lt-word lt-dim" : "lt-word";
          wordSpan.textContent = token;
          wordSpan.addEventListener("click", (e) => {
            e.stopPropagation();
            handleWordClick(token, wordSpan, sub.text);
          });
          origLine.appendChild(wordSpan);
          activeWordEls.push({ el: wordSpan, startMs: wordStartMs });
        }
      });
      overlayEl.appendChild(origLine);
      if (state.videoEl) updateWordGlow(state.videoEl.currentTime * 1000);
    }

    if (showTrans) {
      const transLine = document.createElement("div");
      transLine.className = "lt-overlay-trans";
      transLine.textContent = sub.trans;
      overlayEl.appendChild(transLine);
    }
  }

  async function saveWordToStorage(entry) {
    const res = await api.storage.local.get("ltSavedWords");
    const list = Array.isArray(res?.ltSavedWords) ? res.ltSavedWords : [];
    if (!list.some((item) => item.word.toLowerCase() === entry.word.toLowerCase())) {
      list.unshift({ ...entry, savedAt: Date.now() });
      await api.storage.local.set({ ltSavedWords: list });
    }
  }

  function handleWordClick(rawWord, targetEl, contextSentence = "") {
    if (state.videoEl && !state.videoEl.paused) state.videoEl.pause();
    const cleanWord = rawWord.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (!cleanWord) return;

    const rect = targetEl.getBoundingClientRect();
    popupEl.textContent = "...";
    popupEl.style.display = "block";
    popupEl.style.left = `${Math.max(10, rect.left + window.scrollX)}px`;
    popupEl.style.top = `${Math.max(10, rect.top + window.scrollY - 10)}px`;

    const currentTrack = state.tracks[state.currentTrackIndex];
    const sourceLang = currentTrack ? currentTrack.languageCode.split("-")[0] : (IS_BILI ? "zh-CN" : "auto");
    const tl = state.settings.targetLang || "vi";

    sendBgMessage({
      type: "TRANSLATE_WORD",
      text: cleanWord,
      contextSentence,
      sourceLang,
      targetLang: tl,
      settings: state.settings
    }).then((res) => {
        popupEl.textContent = "";
        if (!res || !res.success) {
          popupEl.textContent = "Không thể dịch từ này" + (res?.error ? " (" + res.error + ")" : ".");
          return;
        }
        const header = document.createElement("div");
        header.className = "lt-popup-header";
        const wordTitle = document.createElement("strong");
        wordTitle.textContent = cleanWord;

        const actionBtns = document.createElement("div");
        actionBtns.className = "lt-popup-actions";

        const saveBtn = document.createElement("button");
        saveBtn.className = "lt-speak-btn";
        saveBtn.textContent = "☆";
        saveBtn.title = "Save";
        saveBtn.addEventListener("click", async () => {
          await saveWordToStorage({
            word: cleanWord,
            meaning: res.translation,
            phonetic: res.phonetic || "",
            sentence: contextSentence || ""
          });
          saveBtn.textContent = "★";
          saveBtn.style.color = "#ecd08b";
        });

        const speakBtn = document.createElement("button");
        speakBtn.className = "lt-speak-btn";
        speakBtn.textContent = "🔊";
        speakBtn.addEventListener("click", () => {
          const utter = new SpeechSynthesisUtterance(cleanWord);
          utter.lang = currentTrack?.languageCode || (IS_BILI ? "zh-CN" : "en-US");
          window.speechSynthesis.speak(utter);
        });

        actionBtns.append(saveBtn, speakBtn);
        header.append(wordTitle, actionBtns);
        popupEl.appendChild(header);

        if (res.phonetic) {
          const phon = document.createElement("div");
          phon.className = "lt-popup-phonetic";
          phon.textContent = `/${res.phonetic}/`;
          popupEl.appendChild(phon);
        }
        const mainMean = document.createElement("div");
        mainMean.className = "lt-popup-meaning";
        mainMean.textContent = res.translation;
        popupEl.appendChild(mainMean);

        if (res.aiContextNote) {
          const aiBox = document.createElement("div");
          aiBox.className = "lt-popup-ai";
          aiBox.textContent = `✦ ${res.aiContextNote}`;
          popupEl.appendChild(aiBox);
        }

        if (res.dictEntries?.length > 0) {
          const dictBox = document.createElement("div");
          dictBox.className = "lt-popup-dict";
          res.dictEntries.forEach((entry) => {
            const row = document.createElement("div");
            const pos = document.createElement("em");
            pos.textContent = `${entry.pos}: `;
            row.append(pos, document.createTextNode(entry.terms));
            dictBox.appendChild(row);
          });
          popupEl.appendChild(dictBox);
        }
    }).catch((err) => {
      popupEl.textContent = "Lỗi kết nối: " + (err?.message || "Hãy tải lại trang.");
    });
  }

  function jumpSubtitle(offset) {
    const v = state.videoEl || getVideoElement();
    if (!v) return;
    state.videoEl = v;

    if (state.subtitles.length === 0) {
      if (IS_BILI) {
        v.currentTime = Math.max(0, Math.min(v.duration || v.currentTime + offset * 3, v.currentTime + offset * 3));
      }
      return;
    }

    const currentMs = v.currentTime * 1000;
    let targetIdx = state.activeIndex;
    if (targetIdx === -1) {
      targetIdx = state.subtitles.findIndex((s) => s.startMs > currentMs);
      if (targetIdx === -1) targetIdx = state.subtitles.length - 1;
      if (offset < 0) targetIdx = Math.max(0, targetIdx - 1);
    } else {
      targetIdx = Math.max(0, Math.min(state.subtitles.length - 1, targetIdx + offset));
    }
    state.pausedAtIndex = -1;
    v.currentTime = state.subtitles[targetIdx].startMs / 1000 + 0.01;
    v.play();
    checkSubtitleTick();
  }

  function replayOrToggle() {
    const v = state.videoEl || getVideoElement();
    if (!v) return;
    state.videoEl = v;
    if (v.paused) {
      if (state.activeIndex !== -1 && state.autoPause) {
        state.pausedAtIndex = -1;
        v.currentTime = state.subtitles[state.activeIndex].startMs / 1000 + 0.01;
      }
      v.play();
    } else {
      v.pause();
    }
  }

  document.addEventListener("keydown", (e) => {
    if (!state.enabled || !isWatchPage()) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === "a" || e.key === "A") { e.preventDefault(); jumpSubtitle(-1); }
    else if (e.key === "d" || e.key === "D") { e.preventDefault(); jumpSubtitle(1); }
    else if (e.key === "s" || e.key === "S") { e.preventDefault(); replayOrToggle(); }
  });

  function msToSubTime(ms, sep) {
    const safe = Math.max(0, Math.round(ms));
    const h = Math.floor(safe / 3600000);
    const m = Math.floor((safe % 3600000) / 60000);
    const s = Math.floor((safe % 60000) / 1000);
    const rem = safe % 1000;
    const p2 = (n) => (n < 10 ? "0" : "") + n;
    const p3 = (n) => (n < 10 ? "00" : n < 100 ? "0" : "") + n;
    return p2(h) + ":" + p2(m) + ":" + p2(s) + sep + p3(rem);
  }

  function exportSubtitles(format) {
    if (!state.subtitles || state.subtitles.length === 0) return false;
    const baseName = (document.title || "DuazTube_Subtitles")
      .replace(/\s*-\s*YouTube$/i, "")
      .replace(/_哔哩哔哩_bilibili$/i, "")
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim() || "DuazTube_Subtitles";

    let content = "";
    let ext = "srt";

    if (format === "txt_dual") {
      ext = "txt";
      content = state.subtitles.map((s) => (s.trans ? s.text + "\n" + s.trans : s.text)).join("\n\n");
    } else if (format === "vtt_dual") {
      ext = "vtt";
      content = "WEBVTT\n\n" + state.subtitles.map((s, i) => {
        const line = s.trans ? s.text + "\n" + s.trans : s.text;
        return (i + 1) + "\n" + msToSubTime(s.startMs, ".") + " --> " + msToSubTime(s.endMs, ".") + "\n" + line;
      }).join("\n\n");
    } else {
      ext = "srt";
      content = state.subtitles.map((s, i) => {
        let line = s.text;
        if (format === "srt_dual" && s.trans) line = s.text + "\n" + s.trans;
        else if (format === "srt_trans") line = s.trans || s.text;
        return (i + 1) + "\n" + msToSubTime(s.startMs, ",") + " --> " + msToSubTime(s.endMs, ",") + "\n" + line;
      }).join("\n\n");
    }

    const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = baseName + "." + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  }

  api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "GET_STATE") {
      sendResponse({
        isWatchPage: isWatchPage(),
        site: IS_BILI ? "bilibili" : (IS_YT ? "youtube" : "other"),
        enabled: state.enabled,
        autoPause: state.autoPause,
        loopCurrent: state.loopCurrent,
        aiAsrActive: state.aiAsrActive,
        tracks: state.tracks,
        currentTrackIndex: state.currentTrackIndex,
        subtitles: state.subtitles,
        activeIndex: state.activeIndex,
        statusMsg: state.statusMsg,
        statusIsError: state.statusIsError
      });
      return;
    }

    if (msg.type === "TOGGLE_STATE") {
      if (msg.key === "enabled") {
        state.enabled = msg.value;
        if (!state.enabled && overlayEl) overlayEl.style.display = "none";
        else if (state.enabled && state.activeIndex !== -1) renderOverlay(state.subtitles[state.activeIndex]);
        document.body?.classList.toggle("lt-hide-yt-subs", state.enabled && state.settings.autoHideYtSubs);
      } else if (msg.key === "autoPause") state.autoPause = msg.value;
      else if (msg.key === "loopCurrent") state.loopCurrent = msg.value;
      return;
    }

    if (msg.type === "TOGGLE_AI_ASR") {
      if (state.aiAsrActive) stopAiAsr();
      else startAiAsr();
      return;
    }

    if (msg.type === "LOAD_CUSTOM_SUBS") {
      stopAiAsr();
      ensureOverlayUI();
      const parsed = parseSrtOrVtt(msg.rawText || "");
      if (parsed.length === 0) {
        sendResponse({ success: false, error: "File phụ đề không hợp lệ hoặc rỗng." });
        return;
      }
      state.subtitles = parsed;
      state.activeIndex = -1;
      state.pausedAtIndex = -1;
      state.currentLang = msg.sourceLang || (IS_BILI ? "zh-CN" : "auto");
      notifyPopup({ type: "LT_POPUP_SYNC", subtitles: state.subtitles, activeIndex: -1 });
      checkSubtitleTick();
      translateAllSubtitles(state.currentLang);
      sendResponse({ success: true, count: parsed.length });
      return;
    }

    if (msg.type === "JUMP_SUB") { jumpSubtitle(msg.offset); return; }
    if (msg.type === "REPLAY_TOGGLE") { replayOrToggle(); return; }
    if (msg.type === "SEEK_TO") {
      const v = state.videoEl || getVideoElement();
      if (v) {
        state.videoEl = v;
        state.pausedAtIndex = -1;
        v.currentTime = msg.startMs / 1000 + 0.01;
        v.play();
        checkSubtitleTick();
      }
      return;
    }
    if (msg.type === "SELECT_TRACK") {
      stopAiAsr();
      state.currentTrackIndex = msg.index;
      setStatus("Đang tải phụ đề...", false);
      if (IS_YT) window.postMessage({ type: "LT_SELECT_TRACK", track: state.tracks[msg.index] }, "*");
      return;
    }
    if (msg.type === "SETTINGS_UPDATED") {
      state.settings = { ...DEFAULT_SETTINGS, ...msg.settings };
      if (msg.retranslate) retranslateAll();
      return;
    }
    if (msg.type === "APPEARANCE_UPDATED") {
      state.appearance = { ...DEFAULT_APPEARANCE, ...msg.appearance, glowV2Migrated: true };
      applyAppearanceToOverlay();
      if (state.activeIndex !== -1) renderOverlay(state.subtitles[state.activeIndex]);
      return;
    }
    if (msg.type === "DOWNLOAD_SUBS") { sendResponse({ success: exportSubtitles(msg.format || "srt_dual") }); return; }
    if (msg.type === "RETRANSLATE") { retranslateAll(); return; }
  });

  window.addEventListener("message", (event) => {
    if (IS_YT && event.data?.type === "LT_CAPTIONS_DATA") {
      stopAiAsr();
      ensureOverlayUI();
      state.currentVideoId = event.data.videoId;
      state.tracks = event.data.tracks || [];
      state.subtitles = [];
      state.rawJson3 = null;
      state.activeIndex = -1;
      renderOverlay(null);

      if (state.tracks.length === 0) setStatus("Video không có phụ đề (bấm 🎙 AI Sub hoặc 📂 Nạp .SRT).", false);
      else {
        const preferredIdx = state.tracks.findIndex((t) => !t.isAuto);
        state.currentTrackIndex = preferredIdx !== -1 ? preferredIdx : 0;
        setStatus("Đang tải phụ đề từ YouTube...", false);
      }
      notifyPopup({
        type: "LT_POPUP_FULL_REFRESH",
        tracks: state.tracks,
        currentTrackIndex: state.currentTrackIndex,
        subtitles: state.subtitles,
        activeIndex: -1
      });
    }

    if (IS_YT && event.data?.type === "LT_TIMEDTEXT_DATA") {
      if (event.data.videoId && state.currentVideoId && event.data.videoId !== state.currentVideoId) return;
      stopAiAsr();
      ensureOverlayUI();
      state.rawJson3 = event.data.data;
      state.subtitles = parseJson3Events(event.data.data);
      state.activeIndex = -1;
      state.pausedAtIndex = -1;
      notifyPopup({ type: "LT_POPUP_SYNC", subtitles: state.subtitles, activeIndex: -1 });

      if (state.subtitles.length > 0) {
        state.currentLang = event.data.lang ? event.data.lang.split("-")[0] : "auto";
        checkSubtitleTick();
        translateAllSubtitles(state.currentLang);
      } else {
        setStatus("Không tìm thấy lời phụ đề.", false);
      }
    }

    if (IS_BILI && event.data?.type === "DT_BILI_JSON") {
      biliFetchedUrls.add(event.data.url);
      loadBiliJsonData(event.data.data);
    }

    if (IS_BILI && event.data?.type === "DT_BILI_RESOURCE_URL") {
      const u = event.data.url;
      if (!u || biliFetchedUrls.has(u) || state.subtitles.length > 0) return;
      biliFetchedUrls.add(u);
      api.runtime.sendMessage({ type: "FETCH_BILI_SUB_URL", url: u }, (res) => {
        if (res?.success && res.data && state.subtitles.length === 0) {
          loadBiliJsonData(res.data);
        }
      });
    }
  });

  if (IS_YT) {
    window.addEventListener("yt-navigate-finish", () => {
      stopAiAsr();
      stopSyncTimer();
      state.videoEl = null;
      if (isWatchPage()) {
        setTimeout(() => { ensureOverlayUI(); window.postMessage({ type: "LT_REQUEST_CAPTIONS" }, "*"); }, 600);
      } else if (overlayEl) {
        overlayEl.style.display = "none";
      }
    });
  }
})();