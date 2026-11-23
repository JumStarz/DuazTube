(function () {
  const IS_BILI = location.hostname.includes("bilibili.com");
  const IS_YT = location.hostname.includes("youtube.com");

  let lastVideoId = null;
  let capturedForVideo = null;
  const capturedBiliUrls = new Set();

  function isSubRequest(url) {
    if (typeof url !== "string") return false;
    if (IS_YT) return url.includes("/api/timedtext");
    if (IS_BILI) {
      const u = url.toLowerCase();
      return u.includes("subtitle") && !/\.(png|svg|jpg|jpeg|webp|css|js|mp4|m4s)(\?|$)/.test(u);
    }
    return false;
  }

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this._ltIsSub = isSubRequest(url);
    this._ltUrl = this._ltIsSub ? url : "";
    return origOpen.apply(this, arguments);
  };

  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    if (this._ltIsSub) {
      this.addEventListener("load", function () {
        try {
          if (this.responseText && this.responseText.trim().startsWith("{")) {
            handleCapturedJson(this._ltUrl, JSON.parse(this.responseText));
          }
        } catch (e) {}
      });
    }
    return origSend.apply(this, arguments);
  };

  const origFetch = window.fetch;
  window.fetch = function (...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
    if (!isSubRequest(url)) {
      return origFetch.apply(this, args);
    }
    return origFetch.apply(this, args).then(async (response) => {
      try {
        const text = await response.clone().text();
        if (text && text.trim().startsWith("{")) {
          handleCapturedJson(url, JSON.parse(text));
        }
      } catch (e) {}
      return response;
    });
  };

  function handleCapturedJson(url, data) {
    if (IS_YT) {
      try {
        const u = new URL(url, window.location.origin);
        const vid = u.searchParams.get("v") || getYtVideoId();
        const lang = u.searchParams.get("lang") || "";
        const tlang = u.searchParams.get("tlang") || "";
        if (!tlang) {
          capturedForVideo = vid;
          window.postMessage({ type: "LT_TIMEDTEXT_DATA", videoId: vid, lang, data }, "*");
        }
      } catch (e) {}
    } else if (IS_BILI) {
      if (data && Array.isArray(data.body) && data.body.length > 0) {
        capturedBiliUrls.add(url);
        window.postMessage({ type: "DT_BILI_JSON", url, data }, "*");
      }
    }
  }

  // --- YOUTUBE ---
  function getYtVideoId() {
    return new URLSearchParams(window.location.search).get("v");
  }

  function triggerPlayerCaptions(track) {
    const player = document.getElementById("movie_player");
    if (!player) return;
    try {
      if (typeof player.loadModule === "function") player.loadModule("captions");
      if (track && typeof player.setOption === "function") {
        player.setOption("captions", "track", { languageCode: track.languageCode, vssId: track.vssId });
      }
    } catch (e) {}

    setTimeout(() => {
      const ccBtn = document.querySelector(".ytp-subtitles-button");
      if (ccBtn && ccBtn.getAttribute("aria-pressed") === "false") {
        ccBtn.click();
      } else if (capturedForVideo !== getYtVideoId() && ccBtn) {
        ccBtn.click();
        setTimeout(() => ccBtn.click(), 120);
      }
    }, 250);
  }

  function extractYtCaptions() {
    if (!IS_YT || window.location.pathname !== "/watch") return;
    const currentVideoId = getYtVideoId();
    if (!currentVideoId) return;

    const player = document.getElementById("movie_player");
    if (!player || typeof player.getPlayerResponse !== "function") {
      setTimeout(extractYtCaptions, 400);
      return;
    }
    const playerResponse = player.getPlayerResponse();
    if (playerResponse?.videoDetails?.videoId !== currentVideoId) {
      setTimeout(extractYtCaptions, 400);
      return;
    }
    if (currentVideoId === lastVideoId) return;
    lastVideoId = currentVideoId;
    capturedForVideo = null;

    const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    const mappedTracks = tracks.map((t) => ({
      languageCode: t.languageCode,
      vssId: t.vssId,
      name: t.name?.simpleText || t.languageCode,
      baseUrl: t.baseUrl,
      isAuto: t.kind === "asr"
    }));

    window.postMessage({ type: "LT_CAPTIONS_DATA", videoId: currentVideoId, tracks: mappedTracks }, "*");
    if (mappedTracks.length > 0) {
      triggerPlayerCaptions(mappedTracks.find((t) => !t.isAuto) || mappedTracks[0]);
    }
  }

  // --- BILIBILI ---
  function scanBiliResources() {
    if (!IS_BILI) return;
    try {
      const entries = performance.getEntriesByType("resource");
      for (const entry of entries) {
        if (isSubRequest(entry.name) && !capturedBiliUrls.has(entry.name)) {
          capturedBiliUrls.add(entry.name);
          window.postMessage({ type: "DT_BILI_RESOURCE_URL", url: entry.name }, "*");
        }
      }
    } catch (e) {}
  }

  if (IS_YT) {
    window.addEventListener("yt-navigate-finish", () => {
      lastVideoId = null;
      capturedForVideo = null;
      setTimeout(extractYtCaptions, 350);
    });
    window.addEventListener("message", (event) => {
      if (event.data?.type === "LT_REQUEST_CAPTIONS") {
        lastVideoId = null;
        extractYtCaptions();
      } else if (event.data?.type === "LT_SELECT_TRACK") {
        capturedForVideo = null;
        triggerPlayerCaptions(event.data.track);
      }
    });
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", extractYtCaptions);
    else extractYtCaptions();
  }

  if (IS_BILI) {
    scanBiliResources();
    setTimeout(scanBiliResources, 250);
    setTimeout(scanBiliResources, 650);
    setTimeout(scanBiliResources, 1100);
    setInterval(scanBiliResources, 1500);
    window.addEventListener("message", (event) => {
      if (event.data?.type === "DT_BILI_RESCAN") scanBiliResources();
    });
  }
})();