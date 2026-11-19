(function () {
  const api = typeof browser !== "undefined" ? browser : chrome;

  const DEFAULT_SETTINGS = {
    uiLang: "vi",
    provider: "google",
    targetLang: "vi",
    geminiKey: "",
    groqKey: ""
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

  let settings = { ...DEFAULT_SETTINGS };
  let appearance = { ...DEFAULT_APPEARANCE };
  let activeTabId = null;
  let currentSite = "other";
  function getSiteEmptyKeys() { if (currentSite === "youtube") return { opt: "opt_not_yt_only", msg: "msg_open_yt_only" }; if (currentSite === "bilibili") return { opt: "opt_not_bili", msg: "msg_open_bili" }; return { opt: "opt_not_yt", msg: "msg_open_yt" }; }
  let pageState = {
    isWatchPage: false,
    enabled: true,
    autoPause: false,
    loopCurrent: false,
    aiAsrActive: false,
    tracks: [],
    currentTrackIndex: 0,
    subtitles: [],
    activeIndex: -1
  };

  const btnEnable = document.getElementById("btn-enable");
  const btnAutoPause = document.getElementById("btn-autopause");
  const btnLoop = document.getElementById("btn-loop");
  const btnPrev = document.getElementById("btn-prev");
  const btnReplay = document.getElementById("btn-replay");
  const btnNext = document.getElementById("btn-next");
  const trackSelect = document.getElementById("track-select");
  const btnAiAsr = document.getElementById("btn-ai-asr");
  const btnOpenSrt = document.getElementById("btn-open-srt");
  const translatorSelect = document.getElementById("translator-select");
  const btnAppearance = document.getElementById("btn-appearance");
  const btnGear = document.getElementById("btn-gear");
  const btnDownload = document.getElementById("btn-download");
  const downloadPanel = document.getElementById("download-panel");
  const dlFormat = document.getElementById("dl-format");
  const btnDoDownload = document.getElementById("btn-do-download");
  const btnRetranslate = document.getElementById("btn-retranslate");
  const appearancePanel = document.getElementById("appearance-panel");
  const btnResetAppearance = document.getElementById("btn-reset-appearance");
  const statusBanner = document.getElementById("status-banner");
  const subList = document.getElementById("sub-list");

  const appDisplayMode = document.getElementById("app-display-mode");
  const appOrigSize = document.getElementById("app-orig-size");
  const appTransSize = document.getElementById("app-trans-size");
  const appOrigColor = document.getElementById("app-orig-color");
  const appTransColor = document.getElementById("app-trans-color");
  const appBgOpacity = document.getElementById("app-bg-opacity");
  const appBottom = document.getElementById("app-bottom");
  const appMaxWidth = document.getElementById("app-max-width");
  const appGlowMode = document.getElementById("app-glow-mode");
  const appGlowSpeed = document.getElementById("app-glow-speed");

  const valOrigSize = document.getElementById("val-orig-size");
  const valTransSize = document.getElementById("val-trans-size");
  const valBgOpacity = document.getElementById("val-bg-opacity");
  const valBottom = document.getElementById("val-bottom");
  const valMaxWidth = document.getElementById("val-max-width");
  const valGlowSpeed = document.getElementById("val-glow-speed");

  function t(key) {
    return window.dtT(settings.uiLang, key);
  }

  async function sendToTab(msg) {
    if (!activeTabId) return null;
    try {
      return await api.tabs.sendMessage(activeTabId, msg);
    } catch (e) {
      return null;
    }
  }

  function showStatus(msg, isError = false) {
    if (!msg) {
      statusBanner.style.display = "none";
      return;
    }
    statusBanner.textContent = msg;
    statusBanner.className = isError ? "lt-status-error" : "lt-status-info";
    statusBanner.style.display = "block";
  }

  function fillAppearanceInputs() {
    appDisplayMode.value = appearance.displayMode || "both";
    appOrigSize.value = appearance.origSize || 22;
    appTransSize.value = appearance.transSize || 16;
    appOrigColor.value = appearance.origColor || "#eef3fb";
    appTransColor.value = appearance.transColor || "#ecd08b";
    appBgOpacity.value = appearance.bgOpacity ?? 82;
    appBottom.value = appearance.bottomOffset ?? 58;
    appMaxWidth.value = appearance.maxWidth || 92;
    appGlowMode.value = appearance.glowMode === "spotify" ? "lyric" : (appearance.glowMode || "none");
    appGlowSpeed.value = appearance.glowSpeed || 1.0;

    valOrigSize.textContent = appearance.origSize + "px";
    valTransSize.textContent = appearance.transSize + "px";
    valBgOpacity.textContent = (appearance.bgOpacity ?? 82) + "%";
    valBottom.textContent = (appearance.bottomOffset ?? 58) + "px";
    valMaxWidth.textContent = (appearance.maxWidth || 92) + "%";
    valGlowSpeed.textContent = Number(appearance.glowSpeed || 1.0).toFixed(1) + "x";
  }

  function readAndBroadcastAppearance() {
    appearance = {
      displayMode: appDisplayMode.value,
      origSize: parseInt(appOrigSize.value, 10),
      transSize: parseInt(appTransSize.value, 10),
      origColor: appOrigColor.value,
      transColor: appTransColor.value,
      bgOpacity: parseInt(appBgOpacity.value, 10),
      bottomOffset: parseInt(appBottom.value, 10),
      maxWidth: parseInt(appMaxWidth.value, 10),
      glowMode: appGlowMode.value,
      glowSpeed: parseFloat(appGlowSpeed.value)
    };
    valOrigSize.textContent = appearance.origSize + "px";
    valTransSize.textContent = appearance.transSize + "px";
    valBgOpacity.textContent = appearance.bgOpacity + "%";
    valBottom.textContent = appearance.bottomOffset + "px";
    valMaxWidth.textContent = appearance.maxWidth + "%";
    valGlowSpeed.textContent = appearance.glowSpeed.toFixed(1) + "x";

    api.storage.local.set({ ltAppearance: appearance });
    sendToTab({ type: "APPEARANCE_UPDATED", appearance });
  }

  [appDisplayMode, appOrigSize, appTransSize, appOrigColor, appTransColor, appBgOpacity, appBottom, appMaxWidth, appGlowMode, appGlowSpeed].forEach((el) => {
    el.addEventListener("input", readAndBroadcastAppearance);
    el.addEventListener("change", readAndBroadcastAppearance);
  });

  btnResetAppearance.addEventListener("click", () => {
    appearance = { ...DEFAULT_APPEARANCE };
    fillAppearanceInputs();
    api.storage.local.set({ ltAppearance: appearance });
    sendToTab({ type: "APPEARANCE_UPDATED", appearance });
  });

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function renderToggleButtons() {
    btnEnable.textContent = pageState.enabled ? t("btn_on") : t("btn_off");
    btnEnable.classList.toggle("active", pageState.enabled);
    btnAutoPause.classList.toggle("active", pageState.autoPause);
    btnLoop.classList.toggle("active", pageState.loopCurrent);
    if (btnAiAsr) btnAiAsr.classList.toggle("active", !!pageState.aiAsrActive);
  }

  function renderTracks() {
    trackSelect.textContent = "";
    if (!pageState.tracks || pageState.tracks.length === 0) {
      const opt = document.createElement("option");
      opt.textContent = pageState.isWatchPage ? t("opt_no_sub") : t(getSiteEmptyKeys().opt);
      trackSelect.appendChild(opt);
      trackSelect.disabled = true;
      return;
    }
    trackSelect.disabled = false;
    pageState.tracks.forEach((tr, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = tr.name;
      trackSelect.appendChild(opt);
    });
    trackSelect.value = pageState.currentTrackIndex;
  }

  function renderSubtitles() {
    subList.textContent = "";
    if (!pageState.isWatchPage) {
      const div = document.createElement("div");
      div.className = "lt-empty";
      div.textContent = t(getSiteEmptyKeys().msg);
      subList.appendChild(div);
      return;
    }
    if (!pageState.subtitles || pageState.subtitles.length === 0) {
      const div = document.createElement("div");
      div.className = "lt-empty";
      div.textContent = pageState.tracks.length > 0 ? t("msg_loading_sub") : t("msg_no_sub");
      subList.appendChild(div);
      return;
    }
    pageState.subtitles.forEach((sub, index) => {
      const item = document.createElement("div");
      item.className = "lt-sub-item" + (index === pageState.activeIndex ? " active" : "");
      item.dataset.index = index;

      const timeSpan = document.createElement("span");
      timeSpan.className = "lt-sub-time";
      timeSpan.textContent = formatTime(sub.startMs / 1000);

      const contentDiv = document.createElement("div");
      const origP = document.createElement("div");
      origP.className = "lt-sub-orig";
      origP.textContent = sub.text;

      const transP = document.createElement("div");
      transP.className = "lt-sub-trans";
      transP.textContent = sub.trans || "...";

      contentDiv.append(origP, transP);
      item.append(timeSpan, contentDiv);
      item.addEventListener("click", () => sendToTab({ type: "SEEK_TO", startMs: sub.startMs }));
      subList.appendChild(item);
    });

    if (pageState.activeIndex !== -1) {
      subList.querySelector(`.lt-sub-item[data-index="${pageState.activeIndex}"]`)?.scrollIntoView({ behavior: "instant", block: "center" });
    }
  }

  function highlightActive(idx) {
    pageState.activeIndex = idx;
    subList.querySelector(".lt-sub-item.active")?.classList.remove("active");
    if (idx !== -1) {
      const el = subList.querySelector(`.lt-sub-item[data-index="${idx}"]`);
      if (el) {
        el.classList.add("active");
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }

  btnEnable.addEventListener("click", () => {
    pageState.enabled = !pageState.enabled;
    renderToggleButtons();
    sendToTab({ type: "TOGGLE_STATE", key: "enabled", value: pageState.enabled });
  });
  btnAutoPause.addEventListener("click", () => {
    pageState.autoPause = !pageState.autoPause;
    renderToggleButtons();
    sendToTab({ type: "TOGGLE_STATE", key: "autoPause", value: pageState.autoPause });
  });
  btnLoop.addEventListener("click", () => {
    pageState.loopCurrent = !pageState.loopCurrent;
    renderToggleButtons();
    sendToTab({ type: "TOGGLE_STATE", key: "loopCurrent", value: pageState.loopCurrent });
  });
  btnPrev.addEventListener("click", () => sendToTab({ type: "JUMP_SUB", offset: -1 }));
  btnReplay.addEventListener("click", () => sendToTab({ type: "REPLAY_TOGGLE" }));
  btnNext.addEventListener("click", () => sendToTab({ type: "JUMP_SUB", offset: 1 }));

  trackSelect.addEventListener("change", () => {
    pageState.currentTrackIndex = parseInt(trackSelect.value, 10);
    sendToTab({ type: "SELECT_TRACK", index: pageState.currentTrackIndex });
  });

  if (btnAiAsr) btnAiAsr.addEventListener("click", () => sendToTab({ type: "TOGGLE_AI_ASR" }));
  if (btnOpenSrt) {
    btnOpenSrt.addEventListener("click", () => {
      api.tabs.create({ url: api.runtime.getURL("options.html#srt") });
      window.close();
    });
  }

  translatorSelect.addEventListener("change", () => {
    settings.provider = translatorSelect.value;
    api.storage.local.set({ ltSettings: settings });
    const needsKey = (settings.provider === "gemini" && !settings.geminiKey) || (settings.provider === "groq" && !settings.groqKey);
    if (needsKey) {
      api.runtime.openOptionsPage();
      window.close();
    } else {
      sendToTab({ type: "SETTINGS_UPDATED", settings, retranslate: true });
    }
  });

  btnAppearance.addEventListener("click", () => {
    const show = appearancePanel.style.display === "none";
    appearancePanel.style.display = show ? "block" : "none";
    btnAppearance.classList.toggle("active", show);
    if (show && downloadPanel) {
      downloadPanel.style.display = "none";
      btnDownload.classList.remove("active");
    }
  });

  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      const show = downloadPanel.style.display === "none";
      downloadPanel.style.display = show ? "block" : "none";
      btnDownload.classList.toggle("active", show);
      if (show) {
        appearancePanel.style.display = "none";
        btnAppearance.classList.remove("active");
      }
    });
  }

  if (btnDoDownload) {
    btnDoDownload.addEventListener("click", async () => {
      if (!pageState.subtitles || pageState.subtitles.length === 0) {
        showStatus(t("msg_no_sub"), true);
        return;
      }
      const res = await sendToTab({ type: "DOWNLOAD_SUBS", format: dlFormat.value });
      if (res?.success) {
        downloadPanel.style.display = "none";
        btnDownload.classList.remove("active");
      }
    });
  }

  btnGear.addEventListener("click", () => {
    api.runtime.openOptionsPage();
    window.close();
  });

  btnRetranslate.addEventListener("click", () => sendToTab({ type: "RETRANSLATE" }));

  api.runtime.onMessage.addListener((msg) => {
    if (msg.type === "LT_ASR_STATE") {
      pageState.aiAsrActive = msg.active;
      renderToggleButtons();
    } else if (msg.type === "LT_POPUP_ACTIVE") {
      highlightActive(msg.activeIndex);
    } else if (msg.type === "LT_POPUP_PATCH_INDICES") {
      const indices = msg.indices || [];
      (msg.translations || []).forEach((tr, k) => {
        const subIdx = indices[k];
        if (subIdx === undefined) return;
        if (pageState.subtitles[subIdx]) pageState.subtitles[subIdx].trans = tr;
        const node = subList.querySelector(`.lt-sub-item[data-index="${subIdx}"] .lt-sub-trans`);
        if (node) node.textContent = tr || "...";
      });
    } else if (msg.type === "LT_POPUP_SYNC") {
      pageState.subtitles = msg.subtitles || [];
      pageState.activeIndex = msg.activeIndex ?? -1;
      renderSubtitles();
    } else if (msg.type === "LT_POPUP_STATUS") {
      showStatus(msg.statusMsg, msg.statusIsError);
    } else if (msg.type === "LT_POPUP_FULL_REFRESH") {
      pageState.tracks = msg.tracks || [];
      pageState.currentTrackIndex = msg.currentTrackIndex || 0;
      pageState.subtitles = msg.subtitles || [];
      pageState.activeIndex = -1;
      renderTracks();
      renderSubtitles();
    }
  });

  (async function init() {
    const stored = await api.storage.local.get(["ltSettings", "ltAppearance"]);
    if (stored?.ltSettings) settings = { ...DEFAULT_SETTINGS, ...stored.ltSettings };
    if (stored?.ltAppearance) { appearance = { ...DEFAULT_APPEARANCE, ...stored.ltAppearance }; if (!appearance.glowV2Migrated) { appearance.glowMode = "none"; appearance.glowV2Migrated = true; api.storage.local.set({ ltAppearance: appearance }); } }

    window.applyDtI18n(settings.uiLang || "vi");
    translatorSelect.value = settings.provider;
    fillAppearanceInputs();

    const tabs = await api.tabs.query({ active: true, currentWindow: true });
    activeTabId = tabs[0]?.id || null;
    const tabUrl = tabs[0]?.url || "";
    if (tabUrl.includes("youtube.com")) currentSite = "youtube";
    else if (tabUrl.includes("bilibili.com")) currentSite = "bilibili";

    const remote = await sendToTab({ type: "GET_STATE" });
    if (remote) {
      pageState = remote;
      if (remote.site) currentSite = remote.site;
      showStatus(remote.statusMsg, remote.statusIsError);
    } else {
      pageState.isWatchPage = false;
    }

    renderToggleButtons();
    renderTracks();
    renderSubtitles();
  })();
})();