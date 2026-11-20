(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;

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
    maxWidth: 88
  };

  const PROVIDER_LABELS = {
    google: "Google Translate",
    microsoft: "Bing / Microsoft",
    mymemory: "MyMemory",
    gemini: "AI Gemini",
    groq: "AI Groq Llama",
    ollama: "AI Ollama (Local)",
    custom: "AI Custom"
  };

  const LANG_LABELS = {
    vi: "Tiếng Việt",
    en: "English",
    ja: "日本語",
    ko: "한국어",
    "zh-CN": "简体中文",
    fr: "Français"
  };

  let settings = { ...DEFAULT_SETTINGS };
  let appearance = { ...DEFAULT_APPEARANCE };

  const toastEl = document.getElementById("toast");
  function showToast(msg) {
    toastEl.textContent = msg || window.dtT(settings.uiLang, "toast_saved");
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2000);
  }

  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".tab-section");
  function switchTab(tabId) {
    navItems.forEach((b) => b.classList.toggle("active", b.dataset.tab === tabId));
    sections.forEach((s) => s.classList.toggle("active", s.id === `tab-${tabId}`));
  }
  navItems.forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
  document.getElementById("pill-provider").addEventListener("click", () => switchTab("providers"));

  document.getElementById("nav-search").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    navItems.forEach((btn) => {
      btn.style.display = !q || btn.textContent.toLowerCase().includes(q) ? "flex" : "none";
    });
  });

  function applyTheme() {
    document.body.className = settings.theme === "classic" ? "theme-classic" : "theme-starlight";
  }

  function updateOverviewBanner() {
    document.getElementById("ov-provider-name").textContent = PROVIDER_LABELS[settings.provider] || settings.provider;
    document.getElementById("ov-lang-name").textContent = `AutoDetect → ${LANG_LABELS[settings.targetLang] || settings.targetLang}`;
  }

  const optUiLang = document.getElementById("opt-ui-lang");
  const optTargetLang = document.getElementById("opt-target-lang");
  const optTheme = document.getElementById("opt-theme");
  const optHideYt = document.getElementById("opt-hide-yt");
  const optMergeShort = document.getElementById("opt-merge-short");
  const optAutoPause = document.getElementById("opt-auto-pause");

  function saveSettings(msg) {
    api.storage.local.set({ ltSettings: settings });
    window.applyDtI18n(settings.uiLang);
    updateOverviewBanner();
    applyTheme();
    showToast(msg);
  }

  [optUiLang, optTargetLang, optTheme, optHideYt, optMergeShort, optAutoPause].forEach((el) => {
    el.addEventListener("change", () => {
      settings.uiLang = optUiLang.value;
      settings.targetLang = optTargetLang.value;
      settings.theme = optTheme.value;
      settings.autoHideYtSubs = optHideYt.value === "true";
      settings.mergeShortSubs = optMergeShort.value === "true";
      settings.defaultAutoPause = optAutoPause.value === "true";
      saveSettings();
      renderVocab();
    });
  });

  const apMode = document.getElementById("ap-mode");
  const apOrigSize = document.getElementById("ap-orig-size");
  const apTransSize = document.getElementById("ap-trans-size");
  const apOrigColor = document.getElementById("ap-orig-color");
  const apTransColor = document.getElementById("ap-trans-color");
  const apOpacity = document.getElementById("ap-opacity");
  const apBottom = document.getElementById("ap-bottom");
  const apMaxWidth = document.getElementById("ap-max-width");
  const apGlowMode = document.getElementById("ap-glow-mode");
  const apGlowSpeed = document.getElementById("ap-glow-speed");

  const pvBox = document.getElementById("preview-overlay");
  const pvOrig = document.getElementById("pv-orig");
  const pvTrans = document.getElementById("pv-trans");

  function renderPreview() {
    document.getElementById("ap-orig-size-val").textContent = `${appearance.origSize}px`;
    document.getElementById("ap-trans-size-val").textContent = `${appearance.transSize}px`;
    document.getElementById("ap-opacity-val").textContent = `${appearance.bgOpacity}%`;
    document.getElementById("ap-bottom-val").textContent = appearance.bottomOffset + "px";
    document.getElementById("ap-width-val").textContent = (appearance.maxWidth || 92) + "%";
    const spVal = document.getElementById("ap-glow-speed-val"); if (spVal) spVal.textContent = Number(appearance.glowSpeed || 1.0).toFixed(1) + "x";
    pvBox.style.maxWidth = (appearance.maxWidth || 92) + "%";

    const op = appearance.bgOpacity / 100;
    pvBox.style.background = `rgba(14, 20, 36, ${op})`;
    pvBox.style.border = op > 0.08 ? `1px solid rgba(216, 180, 103, ${Math.min(0.48, op * 0.55)})` : "none";
    pvBox.style.bottom = `${Math.min(130, Math.max(10, Math.round(appearance.bottomOffset * 0.65)))}px`;

    pvOrig.style.fontSize = `${appearance.origSize}px`;
    pvOrig.style.color = appearance.origColor;
    pvOrig.style.display = appearance.displayMode === "trans" ? "none" : "block";

    pvTrans.style.fontSize = `${appearance.transSize}px`;
    pvTrans.style.color = appearance.transColor;
    pvTrans.style.display = appearance.displayMode === "orig" ? "none" : "block";
  }

  function fillAppearance() {
    apMode.value = appearance.displayMode;
    apOrigSize.value = appearance.origSize;
    apTransSize.value = appearance.transSize;
    apOrigColor.value = appearance.origColor;
    apTransColor.value = appearance.transColor;
    apOpacity.value = appearance.bgOpacity;
    apBottom.value = appearance.bottomOffset;
    if (apMaxWidth) apMaxWidth.value = appearance.maxWidth || 88;
    renderPreview();
  }

  [apMode, apOrigSize, apTransSize, apOrigColor, apTransColor, apOpacity, apBottom, apMaxWidth, apGlowMode, apGlowSpeed].forEach((el) => {
    el.addEventListener("input", () => {
      appearance = {
        displayMode: apMode.value,
        origSize: parseInt(apOrigSize.value, 10),
        transSize: parseInt(apTransSize.value, 10),
        origColor: apOrigColor.value,
        transColor: apTransColor.value,
        bgOpacity: parseInt(apOpacity.value, 10),
        bottomOffset: parseInt(apBottom.value, 10),
        maxWidth: apMaxWidth ? parseInt(apMaxWidth.value, 10) : 88
      };
      renderPreview();
      api.storage.local.set({ ltAppearance: appearance });
    });
  });

  document.getElementById("ap-reset").addEventListener("click", () => {
    appearance = { ...DEFAULT_APPEARANCE };
    fillAppearance();
    api.storage.local.set({ ltAppearance: appearance });
    showToast();
  });

  const pvProvider = document.getElementById("pv-provider");
  const pvMymemoryEmail = document.getElementById("pv-mymemory-email");
  const pvGeminiKey = document.getElementById("pv-gemini-key");
  const pvGeminiModel = document.getElementById("pv-gemini-model");
  const pvGroqKey = document.getElementById("pv-groq-key");
  const pvGroqModel = document.getElementById("pv-groq-model");
  const pvOllamaUrl = document.getElementById("pv-ollama-url");
  const pvOllamaModel = document.getElementById("pv-ollama-model");
  const pvCustomUrl = document.getElementById("pv-custom-url");
  const pvCustomKey = document.getElementById("pv-custom-key");
  const pvCustomModel = document.getElementById("pv-custom-model");
  const pvWhisperMode = document.getElementById("pv-whisper-mode");
  const pvWhisperLang = document.getElementById("pv-whisper-lang");
  const pvWhisperUrl = document.getElementById("pv-whisper-url");

  function collectProviders() {
    settings.provider = pvProvider.value;
    settings.mymemoryEmail = pvMymemoryEmail ? pvMymemoryEmail.value.trim() : "";
    settings.geminiKey = pvGeminiKey.value.trim();
    settings.geminiModel = pvGeminiModel.value.trim() || "gemini-2.5-flash";
    settings.groqKey = pvGroqKey.value.trim();
    settings.groqModel = pvGroqModel.value.trim() || "llama-3.3-70b-versatile";
    settings.ollamaUrl = pvOllamaUrl.value.trim() || "http://localhost:11434";
    settings.ollamaModel = pvOllamaModel.value.trim() || "qwen2.5:7b";
    settings.customUrl = pvCustomUrl.value.trim();
    settings.customKey = pvCustomKey.value.trim();
    settings.customModel = pvCustomModel.value.trim();
    if (pvWhisperMode) settings.whisperMode = pvWhisperMode.value;
    if (pvWhisperLang) settings.whisperLang = pvWhisperLang.value;
    if (pvWhisperUrl) settings.whisperLocalUrl = pvWhisperUrl.value.trim();
  }

  document.getElementById("btn-save-providers").addEventListener("click", () => {
    collectProviders();
    saveSettings();
  });

  document.getElementById("btn-test-provider").addEventListener("click", () => {
    collectProviders();
    const resEl = document.getElementById("test-result");
    resEl.style.color = "var(--accent)";
    resEl.textContent = "...";
    api.runtime.sendMessage(
      { type: "TEST_TRANSLATE", texts: ["I've got to get away and let you go"], settings },
      (res) => {
        if (res?.success) resEl.textContent = `✔ "${res.translations[0]}"`;
        else { resEl.style.color = "#ff8fa3"; resEl.textContent = `✘ ${res?.error || "Error"}`; }
      }
    );
  });

  const prCustomPrompt = document.getElementById("pr-custom-prompt");
  document.getElementById("btn-save-prompt").addEventListener("click", () => {
    settings.customPrompt = prCustomPrompt.value.trim();
    saveSettings();
  });
  document.getElementById("btn-reset-prompt").addEventListener("click", () => {
    settings.customPrompt = "";
    prCustomPrompt.value = "";
    saveSettings();
  });

  async function renderVocab() {
    const container = document.getElementById("vocab-list");
    const res = await api.storage.local.get("ltSavedWords");
    const list = Array.isArray(res?.ltSavedWords) ? res.ltSavedWords : [];
    container.textContent = "";

    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "provider-card";
      empty.textContent = window.dtT(settings.uiLang, "vb_empty");
      container.appendChild(empty);
      return;
    }

    list.forEach((item, idx) => {
      const card = document.createElement("div");
      card.className = "vocab-item";
      const left = document.createElement("div");
      const top = document.createElement("div");
      const w = document.createElement("span");
      w.className = "vocab-word";
      w.textContent = item.word;
      top.appendChild(w);
      if (item.phonetic) {
        const ph = document.createElement("span");
        ph.className = "vocab-phon";
        ph.textContent = `/${item.phonetic}/`;
        top.appendChild(ph);
      }
      const mean = document.createElement("div");
      mean.className = "vocab-mean";
      mean.textContent = item.meaning;
      left.append(top, mean);
      if (item.sentence) {
        const sent = document.createElement("div");
        sent.className = "vocab-sent";
        sent.textContent = `"${item.sentence}"`;
        left.appendChild(sent);
      }
      const btns = document.createElement("div");
      btns.className = "vocab-btns";
      const speak = document.createElement("button");
      speak.className = "pill-btn";
      speak.textContent = "🔊";
      speak.addEventListener("click", () => window.speechSynthesis.speak(new SpeechSynthesisUtterance(item.word)));
      const del = document.createElement("button");
      del.className = "pill-btn danger";
      del.textContent = "✕";
      del.addEventListener("click", async () => {
        list.splice(idx, 1);
        await api.storage.local.set({ ltSavedWords: list });
        renderVocab();
      });
      btns.append(speak, del);
      card.append(left, btns);
      container.appendChild(card);
    });
  }

  document.getElementById("btn-clear-vocab").addEventListener("click", async () => {
    await api.storage.local.set({ ltSavedWords: [] });
    renderVocab();
  });

  document.getElementById("btn-export-csv").addEventListener("click", async () => {
    const res = await api.storage.local.get("ltSavedWords");
    const list = res?.ltSavedWords || [];
    const csvRows = ["Word,Phonetic,Meaning,Sentence"];
    list.forEach((x) => {
      const esc = (s) => `"${String(s || "").replace(/"/g, '""')}"`;
      csvRows.push([esc(x.word), esc(x.phonetic), esc(x.meaning), esc(x.sentence)].join(","));
    });
    downloadFile("duaztube-vocab.csv", "\uFEFF" + csvRows.join("\n"), "text/csv;charset=utf-8");
  });

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportAllJson() {
    const all = await api.storage.local.get(["ltSettings", "ltAppearance", "ltSavedWords"]);
    downloadFile("duaztube-backup.json", JSON.stringify(all, null, 2), "application/json");
  }

  const fileInput = document.getElementById("file-import");
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      await api.storage.local.set(data);
      await loadAll();
      showToast();
    } catch {
      showToast("Invalid JSON");
    }
  });

  document.getElementById("btn-quick-export").addEventListener("click", exportAllJson);
  document.getElementById("btn-export-json").addEventListener("click", exportAllJson);
  document.getElementById("btn-quick-import").addEventListener("click", () => fileInput.click());
  document.getElementById("btn-import-json").addEventListener("click", () => fileInput.click());

  const srtFileInput = document.getElementById("srt-file-input");
  const srtRawText = document.getElementById("srt-raw-text");
  const srtSrcLang = document.getElementById("srt-src-lang");
  const srtStatus = document.getElementById("srt-status");

  if (srtFileInput) {
    srtFileInput.addEventListener("change", async (e) => {
      const f = e.target.files[0];
      if (f) srtRawText.value = await f.text();
    });
  }

  const btnApplySrt = document.getElementById("btn-apply-srt");
  if (btnApplySrt) {
    btnApplySrt.addEventListener("click", async () => {
      const rawText = srtRawText.value.trim();
      if (!rawText) { srtStatus.style.color = "#ff8fa3"; srtStatus.textContent = "Empty file."; return; }
      const tabs = await api.tabs.query({ url: "*://*.youtube.com/watch*" });
      if (!tabs || tabs.length === 0) { srtStatus.style.color = "#ff8fa3"; srtStatus.textContent = "No YouTube video tab found."; return; }
      const targetTab = tabs.find((t) => t.active) || tabs[0];
      try {
        const res = await api.tabs.sendMessage(targetTab.id, { type: "LOAD_CUSTOM_SUBS", rawText, sourceLang: srtSrcLang.value });
        if (res?.success) { srtStatus.style.color = "var(--accent)"; srtStatus.textContent = `✔ Loaded ${res.count} lines!`; }
        else { srtStatus.style.color = "#ff8fa3"; srtStatus.textContent = res?.error || "Error"; }
      } catch {
        srtStatus.style.color = "#ff8fa3"; srtStatus.textContent = "Please reload the YouTube tab.";
      }
    });
  }

  async function loadAll() {
    const stored = await api.storage.local.get(["ltSettings", "ltAppearance"]);
    if (stored?.ltSettings) {
      settings = { ...DEFAULT_SETTINGS, ...stored.ltSettings };
      if (settings.theme === "frieren") settings.theme = "starlight";
    }
    if (stored?.ltAppearance) appearance = { ...DEFAULT_APPEARANCE, ...stored.ltAppearance };

    optUiLang.value = settings.uiLang || "vi";
    optTargetLang.value = settings.targetLang;
    optTheme.value = settings.theme;
    optHideYt.value = String(settings.autoHideYtSubs);
    optMergeShort.value = String(settings.mergeShortSubs);
    optAutoPause.value = String(settings.defaultAutoPause);

    pvProvider.value = settings.provider;
    if (pvMymemoryEmail) pvMymemoryEmail.value = settings.mymemoryEmail || "";
    pvGeminiKey.value = settings.geminiKey;
    pvGeminiModel.value = settings.geminiModel;
    pvGroqKey.value = settings.groqKey;
    pvGroqModel.value = settings.groqModel;
    pvOllamaUrl.value = settings.ollamaUrl;
    pvOllamaModel.value = settings.ollamaModel;
    pvCustomUrl.value = settings.customUrl;
    pvCustomKey.value = settings.customKey;
    pvCustomModel.value = settings.customModel;
    if (pvWhisperMode) pvWhisperMode.value = settings.whisperMode || "groq";
    if (pvWhisperLang) pvWhisperLang.value = settings.whisperLang || "auto";
    if (pvWhisperUrl) pvWhisperUrl.value = settings.whisperLocalUrl || "http://localhost:8000/v1/audio/transcriptions";
    prCustomPrompt.value = settings.customPrompt || "";

    window.applyDtI18n(settings.uiLang || "vi");
    applyTheme();
    updateOverviewBanner();
    fillAppearance();
    renderVocab();
  }

  if (window.location.hash === "#srt") switchTab("srt");
  // Demo hiệu ứng Spotify Glow chạy liên tục trong khung Preview
  const previewWords = "Learning a new language opens up a whole new world.".split(" ");
  pvOrig.textContent = "";
  const pvWordSpans = previewWords.map((w, i) => {
    const sp = document.createElement("span");
    sp.className = "pv-word";
    sp.textContent = (i > 0 ? " " : "") + w;
    pvOrig.appendChild(sp);
    return sp;
  });
  let pvStep = 0;
  let pvLastTick = 0; function tickPreview() { const now = Date.now(); const stepMs = 420 / Math.max(0.5, parseFloat(appearance.glowSpeed) || 1.0); if (now - pvLastTick < stepMs) { requestAnimationFrame(tickPreview); return; } pvLastTick = now;
    const gm = appearance.glowMode || "spotify";
    const on = gm !== "none";
    pvBox.classList.toggle("pv-glow-on", on);
    if (!on) {
      pvWordSpans.forEach((s) => s.classList.remove("pv-dim", "pv-sung", "pv-now"));
      return;
    }
    pvWordSpans.forEach((s, i) => {
      s.classList.toggle("pv-sung", i < pvStep);
      s.classList.toggle("pv-now", i === pvStep);
      s.classList.toggle("pv-dim", i > pvStep);
    });
    pvStep = (pvStep + 1) % pvWordSpans.length;
    requestAnimationFrame(tickPreview); } requestAnimationFrame(tickPreview);

  loadAll();
})();