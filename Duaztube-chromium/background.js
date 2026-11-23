const api = typeof browser !== "undefined" ? browser : chrome;

const sentenceCache = new Map();
let bingAuthCache = { ig: "", iid: "", key: "", token: "", origin: "https://www.bing.com", expiresAt: 0 };

const LANG_NAMES = {
  vi: "Tiếng Việt",
  en: "Tiếng Anh",
  ja: "Tiếng Nhật",
  ko: "Tiếng Hàn",
  "zh-CN": "Tiếng Trung",
  fr: "Tiếng Pháp",
  de: "Tiếng Đức"
};

async function getBingAuth() {
  if (bingAuthCache.token && Date.now() < bingAuthCache.expiresAt) return bingAuthCache;
  const res = await fetch("https://www.bing.com/translator", { credentials: "include" });
  if (!res.ok) throw new Error(`Không truy cập được Bing Translator (HTTP ${res.status})`);
  const origin = new URL(res.url).origin;
  const html = await res.text();
  const igMatch = html.match(/IG\s*:\s*["']([A-Za-z0-9]+)["']/);
  const iidMatch = html.match(/data-iid=["']([^"']+)["']/);
  const paramsMatch = html.match(/params_AbusePreventionHelper\s*=\s*\[(\d+)\s*,\s*["']([^"']+)["']\s*,\s*(\d+)\]/);
  if (!igMatch || !paramsMatch) throw new Error("Không lấy được phiên dịch từ Bing");
  bingAuthCache = {
    ig: igMatch[1],
    iid: iidMatch ? iidMatch[1] : "translator.5028",
    key: paramsMatch[1],
    token: paramsMatch[2],
    origin,
    expiresAt: Date.now() + 8 * 60 * 1000
  };
  return bingAuthCache;
}

async function translateGoogleSingle(text, sl = "auto", tl = "vi", withDict = false) {
  const dt = withDict ? "&dt=t&dt=bd&dt=rm" : "&dt=t";
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}${dt}&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google HTTP ${res.status}`);
  return await res.json();
}

async function translateGooglePost(texts, sl, tl) {
  const params = new URLSearchParams();
  texts.forEach((t) => params.append("q", t.replace(/\n+/g, " ").trim()));
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(sl || "auto")}&tl=${encodeURIComponent(tl || "vi")}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  if (!res.ok) throw new Error(`Google POST HTTP ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data) && data.length === texts.length) {
    return data.map((item) => (Array.isArray(item) ? String(item[0] || "") : String(item || "")).trim());
  }
  throw new Error("Google POST mismatch");
}

async function translateGoogleBatch(texts, sl, tl) {
  if (texts.length === 1) {
    try {
      const d = await translateGoogleSingle(texts[0], sl, tl, false);
      return [d[0]?.map((item) => item?.[0] || "").join("").trim() || ""];
    } catch (err) {
      if (String(err.message).includes("429")) {
        return await translateBingBatch(texts, sl, tl);
      }
      throw err;
    }
  }

  try {
    return await translateGooglePost(texts, sl, tl);
  } catch (e) {}

  try {
    const joined = texts.map((t, idx) => (idx === 0 ? t : `\n[[${idx}]]\n${t}`).replace(/\r/g, "")).join("");
    const data = await translateGoogleSingle(joined, sl, tl, false);
    const translatedFull = data[0]?.map((item) => item?.[0] || "").join("") || "";

    const parts = [];
    let cursor = 0;
    let valid = true;
    for (let i = 1; i < texts.length; i++) {
      const regex = new RegExp(`\\[\\[\\s*${i}\\s*\\]\\]`);
      const match = regex.exec(translatedFull.slice(cursor));
      if (!match) { valid = false; break; }
      parts.push(translatedFull.slice(cursor, cursor + match.index).trim());
      cursor += match.index + match[0].length;
    }
    if (valid) {
      parts.push(translatedFull.slice(cursor).trim());
      if (parts.length === texts.length && parts.every((p, i) => p || !texts[i].trim())) return parts;
    }

    const fbJoined = texts.map((t) => t.replace(/\n+/g, " ")).join("\n");
    const fbData = await translateGoogleSingle(fbJoined, sl, tl, false);
    const fbFull = fbData[0]?.map((item) => item?.[0] || "").join("") || "";
    const lines = fbFull.split("\n").map((s) => s.trim());
    if (lines.length === texts.length && lines.every((p, i) => p || !texts[i].trim())) return lines;

    const singleResults = [];
    for (const t of texts) {
      const d = await translateGoogleSingle(t, sl, tl, false);
      singleResults.push(d[0]?.map((item) => item?.[0] || "").join("").trim() || "");
      await new Promise((r) => setTimeout(r, 120));
    }
    return singleResults;
  } catch (err) {
    if (String(err.message).includes("429")) {
      return await translateBingBatch(texts, sl, tl);
    }
    throw err;
  }
}

async function translateBingSingle(text, tl, auth) {
  const body = new URLSearchParams({
    fromLang: "auto-detect",
    text: text.replace(/\n+/g, " ").trim(),
    to: tl || "vi",
    token: auth.token,
    key: auth.key,
    tryFetchingGenderDebiasedTranslations: "true"
  });
  const url = `${auth.origin}/ttranslatev3?isVertical=1&&IG=${encodeURIComponent(auth.ig)}&IID=${encodeURIComponent(auth.iid)}.1`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!res.ok) { bingAuthCache.token = ""; throw new Error(`Bing HTTP ${res.status}`); }
  const data = await res.json();
  if (!Array.isArray(data) || (data.statusCode && data.statusCode !== 200)) {
    bingAuthCache.token = "";
    throw new Error(`Bing mã ${data.statusCode || "?"}${data.errorMessage ? ": " + data.errorMessage : ""}`);
  }
  return (data[0]?.translations?.[0]?.text || "").trim();
}

async function translateBingChunk(texts, tl, auth) {
  if (texts.length === 1) {
    return [await translateBingSingle(texts[0], tl, auth)];
  }

  const joined = texts.map((t, idx) => (idx === 0 ? t : `\n[[${idx}]]\n${t}`).replace(/\r/g, "")).join("");
  const body = new URLSearchParams({
    fromLang: "auto-detect",
    text: joined,
    to: tl || "vi",
    token: auth.token,
    key: auth.key,
    tryFetchingGenderDebiasedTranslations: "true"
  });
  const url = `${auth.origin}/ttranslatev3?isVertical=1&&IG=${encodeURIComponent(auth.ig)}&IID=${encodeURIComponent(auth.iid)}.1`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!res.ok) { bingAuthCache.token = ""; throw new Error(`Bing HTTP ${res.status}`); }
  const data = await res.json();
  if (!Array.isArray(data) || (data.statusCode && data.statusCode !== 200)) {
    bingAuthCache.token = "";
    throw new Error(`Bing mã ${data.statusCode || "?"}${data.errorMessage ? ": " + data.errorMessage : ""}`);
  }

  const translatedFull = data[0]?.translations?.[0]?.text || "";
  const parts = [];
  let cursor = 0;
  let valid = true;
  for (let i = 1; i < texts.length; i++) {
    const regex = new RegExp(`\\[\\[\\s*${i}\\s*\\]\\]`);
    const match = regex.exec(translatedFull.slice(cursor));
    if (!match) { valid = false; break; }
    parts.push(translatedFull.slice(cursor, cursor + match.index).trim());
    cursor += match.index + match[0].length;
  }
  if (valid) {
    parts.push(translatedFull.slice(cursor).trim());
    if (parts.length === texts.length && parts.every((p, i) => p || !texts[i].trim())) return parts;
  }

  const bodyLines = new URLSearchParams({
    fromLang: "auto-detect",
    text: texts.map((t) => t.replace(/\n+/g, " ")).join("\n"),
    to: tl || "vi",
    token: auth.token,
    key: auth.key
  });
  const res2 = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: bodyLines.toString()
  });
  const data2 = await res2.json();
  const lines = (Array.isArray(data2) ? data2[0]?.translations?.[0]?.text : "")?.split("\n").map((s) => s.trim()) || [];
  if (lines.length === texts.length && lines.every((p, i) => p || !texts[i].trim())) return lines;

  // Dự phòng chắc chắn 100%: nếu Bing tự gộp dòng -> dịch từng câu lẻ để không bao giờ bị "..."
  const singleResults = [];
  for (const t of texts) {
    singleResults.push(await translateBingSingle(t, tl, auth));
    await new Promise((r) => setTimeout(r, 80));
  }
  return singleResults;
}
async function translateBingBatch(texts, sl, tl) {
  const auth = await getBingAuth();
  const results = [];
  let chunk = [];
  let charCount = 0;

  for (const t of texts) {
    const len = t.length + 8;
    if (chunk.length > 0 && (charCount + len > 750 || chunk.length >= 12)) {
      results.push(...(await translateBingChunk(chunk, tl, auth)));
      chunk = [];
      charCount = 0;
    }
    chunk.push(t);
    charCount += len;
  }
  if (chunk.length > 0) {
    results.push(...(await translateBingChunk(chunk, tl, auth)));
  }
  return results;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateMyMemoryRequest(q, src, target, email, attempt = 0) {
  const emailParam = email ? `&de=${encodeURIComponent(email)}` : "";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(src)}|${encodeURIComponent(target)}${emailParam}`;
  const res = await fetch(url);
  if (res.status === 429) {
    if (attempt < 2) {
      await sleep(1600 * (attempt + 1));
      return translateMyMemoryRequest(q, src, target, email, attempt + 1);
    }
    throw new Error("MyMemory quá tải tạm thời (429). Hãy đợi 1 phút, thêm Email trong ⚙️ hoặc chuyển sang Google/Bing.");
  }
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus && Number(data.responseStatus) !== 200) {
    throw new Error(data.responseDetails || `MyMemory lỗi mã ${data.responseStatus}`);
  }
  return data.responseData?.translatedText || "";
}

async function translateMyMemoryBatch(texts, sl, tl, email) {
  const src = !sl || sl === "auto" ? "en" : sl;
  const target = tl || "vi";
  if (src === target) return texts;

  const results = [];
  let chunk = [];
  let charCount = 0;

  async function processChunk(items) {
    if (items.length === 1) {
      return [await translateMyMemoryRequest(items[0].slice(0, 450), src, target, email)];
    }

    const joined = items.map((t, idx) => (idx === 0 ? t : `[[${idx}]] ${t}`).replace(/\n+/g, " ")).join(" ");
    const translatedFull = await translateMyMemoryRequest(joined, src, target, email);

    const parts = [];
    let cursor = 0;
    let valid = true;
    for (let i = 1; i < items.length; i++) {
      const regex = new RegExp(`\\[\\[\\s*${i}\\s*\\]\\]`);
      const match = regex.exec(translatedFull.slice(cursor));
      if (!match) { valid = false; break; }
      parts.push(translatedFull.slice(cursor, cursor + match.index).trim());
      cursor += match.index + match[0].length;
    }
    if (valid) {
      parts.push(translatedFull.slice(cursor).trim());
      if (parts.length === items.length) return parts;
    }

    const singleResults = [];
    for (const item of items) {
      singleResults.push(await translateMyMemoryRequest(item.slice(0, 450), src, target, email));
      await sleep(350);
    }
    return singleResults;
  }

  for (const t of texts) {
    const clean = t.replace(/\n+/g, " ").trim();
    const len = clean.length + 8;
    if (chunk.length > 0 && (charCount + len > 400 || chunk.length >= 7)) {
      results.push(...(await processChunk(chunk)));
      await sleep(200);
      chunk = [];
      charCount = 0;
    }
    chunk.push(clean);
    charCount += len;
  }
  if (chunk.length > 0) {
    results.push(...(await processChunk(chunk)));
    await sleep(200);
  }
  return results;
}

function buildBatchPrompt(texts, targetLangCode = "vi", customPrompt = "") {
  const targetLangName = LANG_NAMES[targetLangCode] || targetLangCode;
  const instruction = customPrompt?.trim()
    ? customPrompt.replace(/\{\{targetLang\}\}/gi, targetLangName)
    : `Bạn là chuyên gia dịch thuật phụ đề và lời bài hát. Hãy dịch danh sách các dòng thoại/lời bài hát sau sang ${targetLangName}. Lưu ý: một số dòng có thể là phụ đề tự động (ASR) bị nghe nhầm từ đồng âm (ví dụ "son" thay vì "sun") hoặc cắt câu lửng; hãy đọc ngữ cảnh liền mạch của cả đoạn trước và sau để hiểu đúng nghĩa thật rồi dịch thật tự nhiên, mượt mà và đúng sắc thái.`;

  return `${instruction}

Quy tắc định dạng BẮT BUỘC: Trả về DUY NHẤT một JSON array chứa đúng ${texts.length} chuỗi bản dịch tương ứng theo đúng thứ tự. Không thêm giải thích hay markdown.

Danh sách đầu vào (${texts.length} dòng):
${JSON.stringify(texts)}`;
}

function extractJsonArray(rawText, expectedLength) {
  let cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);
  const arr = JSON.parse(cleaned);
  if (!Array.isArray(arr)) throw new Error("AI không trả về mảng JSON");
  const result = [];
  for (let i = 0; i < expectedLength; i++) {
    result.push(typeof arr[i] === "string" ? arr[i].trim() : String(arr[i] ?? ""));
  }
  return result;
}

async function callGemini(prompt, settings, expectJson = false) {
  const key = settings.geminiKey?.trim();
  if (!key) throw new Error("Chưa nhập Gemini API Key");
  const model = settings.geminiModel?.trim() || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } };
  if (expectJson) body.generationConfig.responseMimeType = "application/json";
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Gemini HTTP ${res.status}`);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callOpenAICompatible(prompt, endpoint, apiKey, model) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "Bạn là trợ lý dịch thuật phụ đề chính xác, tự nhiên." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `AI HTTP ${res.status}`);
  return data.choices?.[0]?.message?.content || "";
}

async function callOllama(prompt, settings) {
  const baseUrl = (settings.ollamaUrl?.trim() || "http://localhost:11434").replace(/\/+$/, "");
  const model = settings.ollamaModel?.trim() || "qwen2.5:7b";
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: false, options: { temperature: 0.2 }, messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error("Ollama chặn CORS (hãy chạy với OLLAMA_ORIGINS=*)");
    throw new Error(`Ollama lỗi HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.message?.content || "";
}

async function runAIText(prompt, settings, expectJson = false) {
  const p = settings.provider;
  if (p === "gemini") return await callGemini(prompt, settings, expectJson);
  if (p === "groq") {
    const key = settings.groqKey?.trim();
    if (!key) throw new Error("Chưa nhập Groq API Key");
    return await callOpenAICompatible(prompt, "https://api.groq.com/openai/v1/chat/completions", key, settings.groqModel?.trim() || "llama-3.3-70b-versatile");
  }
  if (p === "ollama") return await callOllama(prompt, settings);
  if (p === "custom") {
    const url = settings.customUrl?.trim();
    if (!url) throw new Error("Chưa nhập Custom API URL");
    return await callOpenAICompatible(prompt, url, settings.customKey?.trim(), settings.customModel?.trim() || "gpt-4o-mini");
  }
  throw new Error("Trình dịch AI không hợp lệ");
}

async function runBatchTranslate(texts, sl, tl, settings) {
  const provider = settings.provider || "google";
  const results = new Array(texts.length);
  const missingTexts = [];
  const missingIndices = [];

  texts.forEach((t, idx) => {
    const key = `${provider}|${sl}|${tl}|${t}`;
    if (sentenceCache.has(key)) {
      results[idx] = sentenceCache.get(key);
    } else {
      missingTexts.push(t);
      missingIndices.push(idx);
    }
  });

  if (missingTexts.length === 0) return results;

  let translated = [];
  if (provider === "microsoft") translated = await translateBingBatch(missingTexts, sl, tl);
  else if (provider === "mymemory") translated = await translateMyMemoryBatch(missingTexts, sl, tl, settings.mymemoryEmail?.trim());
  else if (["gemini", "groq", "ollama", "custom"].includes(provider)) {
    const raw = await runAIText(buildBatchPrompt(missingTexts, tl, settings.customPrompt), settings, true);
    translated = extractJsonArray(raw, missingTexts.length);
  } else {
    translated = await translateGoogleBatch(missingTexts, sl, tl);
  }

  missingIndices.forEach((origIdx, k) => {
    const tr = translated[k] || "";
    results[origIdx] = tr;
    if (tr) {
      const key = `${provider}|${sl}|${tl}|${texts[origIdx]}`;
      if (sentenceCache.size > 4000) sentenceCache.delete(sentenceCache.keys().next().value);
      sentenceCache.set(key, tr);
    }
  });

  return results;
}

// --- LRCLIB SYNCED LYRICS FETCHER ---
function cleanMusicTitle(raw) {
  return (raw || "")
    .replace(/^\(\d+\)\s*/, "")
    .replace(/\s*-\s*YouTube$/i, "")
    .replace(/_哔哩哔哩_bilibili$/i, "")
    .replace(/[\(\[【]\s*(?:official|music\s*video|lyric\s*video|lyrics?|audio|m\/?v|hd|4k|hq|visualizer|live|ver\.?|version|vietsub|engsub|color\s*coded|full\s*ver|teaser|ost|prod\.?[^\)\]】]*|ft\.?[^\)\]】]*|feat\.?[^\)\]】]*)[^\)\]】]*[\)\]】]/gi, " ")
    .replace(/\s*\|\s*(?:official\s*(?:music\s*)?video|official\s*audio|lyric\s*video|m\/?v|lyrics?|vietsub).*$/i, "")
    .replace(/\s+(?:ft\.?|feat\.?)\s+.+$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanArtistName(raw) {
  return (raw || "")
    .replace(/\s*-\s*Topic$/i, "")
    .replace(/\s*VEVO$/i, "")
    .replace(/\s*Official$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normSearchStr(s) {
  return (s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

async function lrclibSearchRequest(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`https://lrclib.net/api/search?${qs}`, {
    headers: { "Lrclib-Client": "DuazTube v2.0.5 (https://github.com/duaztube)" }
  });
  if (!res.ok) throw new Error(`LRCLIB HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function pickBestLrclibMatch(candidates, expectedTrack, expectedArtist, durationSec) {
  const synced = candidates.filter((c) => c && typeof c.syncedLyrics === "string" && c.syncedLyrics.trim().length > 15);
  if (synced.length === 0) return null;

  const nTrack = normSearchStr(expectedTrack);
  const nArtist = normSearchStr(expectedArtist);

  let best = synced[0];
  let bestScore = -1e9;

  for (const item of synced) {
    let score = 0;
    const iTrack = normSearchStr(item.trackName);
    const iArtist = normSearchStr(item.artistName);

    if (nTrack && iTrack) {
      if (iTrack === nTrack) score += 40;
      else if (iTrack.includes(nTrack) || nTrack.includes(iTrack)) score += 20;
    }
    if (nArtist && iArtist) {
      if (iArtist === nArtist) score += 30;
      else if (iArtist.includes(nArtist) || nArtist.includes(iArtist)) score += 15;
    }
    if (durationSec > 0 && item.duration > 0) {
      const diff = Math.abs(item.duration - durationSec);
      if (diff <= 3) score += 50;
      else if (diff <= 8) score += 35;
      else if (diff <= 15) score += 20;
      else if (diff <= 30) score += 5;
      else if (diff > 50) score -= 25;
    }
    if (item.instrumental) score -= 50;

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return best;
}

async function fetchLrclibLyrics({ title = "", channel = "", duration = 0, customQuery = "" }) {
  const rawInput = (customQuery || "").trim() || title;
  const cleaned = cleanMusicTitle(rawInput);
  if (!cleaned) throw new Error("Không xác định được tên bài hát.");

  let artist = "";
  let track = cleaned;

  const sepMatch = cleaned.match(/^(.+?)\s*(?:-|–|—|\|)\s*(.+)$/);
  if (sepMatch) {
    artist = cleanArtistName(sepMatch[1]);
    track = cleanMusicTitle(sepMatch[2]);
  } else if (!customQuery && channel) {
    artist = cleanArtistName(channel);
  }

  let candidates = [];

  if (artist && track) {
    try {
      candidates = await lrclibSearchRequest({ track_name: track, artist_name: artist });
    } catch (e) {}
  }

  let best = pickBestLrclibMatch(candidates, track, artist, duration);

  if (!best) {
    const q = (customQuery || "").trim() || (artist && !normSearchStr(cleaned).includes(normSearchStr(artist)) ? `${artist} ${track}` : cleaned);
    try {
      const res2 = await lrclibSearchRequest({ q });
      best = pickBestLrclibMatch(res2, track, artist, duration);
    } catch (e) {}
  }

  if (!best && track && track !== cleaned) {
    try {
      const res3 = await lrclibSearchRequest({ q: track });
      best = pickBestLrclibMatch(res3, track, artist, duration);
    } catch (e) {}
  }

  if (!best) {
    throw new Error(`Không tìm thấy lời đồng bộ trên LRCLIB cho "${cleaned}". Hãy thử gõ gọn "Tên bài - Ca sĩ" rồi bấm Tìm.`);
  }

  return {
    trackName: best.trackName || track,
    artistName: best.artistName || artist,
    albumName: best.albumName || "",
    duration: best.duration || 0,
    syncedLyrics: best.syncedLyrics
  };
}

async function callWhisperASR(bytesArray, mimeType, settings) {
  const mode = settings.whisperMode || "groq";
  let url = "https://api.groq.com/openai/v1/audio/transcriptions";
  let headers = {};
  let model = "whisper-large-v3-turbo";

  if (mode === "groq") {
    const key = settings.groqKey?.trim();
    if (!key) throw new Error("Cần nhập Groq API Key trong ⚙️ Cấu hình trình dịch để tạo sub AI miễn phí.");
    headers["Authorization"] = `Bearer ${key}`;
  } else {
    url = settings.whisperLocalUrl?.trim() || "http://localhost:8000/v1/audio/transcriptions";
    model = settings.whisperLocalModel?.trim() || "whisper-1";
  }

  const uint8 = new Uint8Array(bytesArray);
  const ext = mimeType.includes("ogg") ? "ogg" : "webm";
  const blob = new Blob([uint8], { type: mimeType || "audio/webm" });

  const form = new FormData();
  form.append("file", blob, `audio.${ext}`);
  form.append("model", model);
  form.append("response_format", "verbose_json");
  if (settings.whisperLang && settings.whisperLang !== "auto") {
    form.append("language", settings.whisperLang);
  }

  const res = await fetch(url, { method: "POST", headers, body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Whisper HTTP ${res.status}`);

  const hallu = /^(thank you\.?|thanks for watching\.?|subtitles by.*|you|\.+|\s*)$/i;
  const segments = Array.isArray(data.segments) && data.segments.length > 0
    ? data.segments.map((s) => ({
        startOffsetMs: Math.round((s.start || 0) * 1000),
        endOffsetMs: Math.round((s.end || 3) * 1000),
        text: (s.text || "").trim()
      }))
    : (data.text ? [{ startOffsetMs: 0, endOffsetMs: 4800, text: data.text.trim() }] : []);

  return segments.filter((s) => s.text && !hallu.test(s.text));
}

api.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_LRCLIB_LYRICS") {
    (async () => {
      try {
        const data = await fetchLrclibLyrics(request);
        sendResponse({ success: true, ...data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.type === "TRANSLATE_WORD") {
    (async () => {
      try {
        const tl = request.targetLang || request.settings?.targetLang || "vi";
        const sl = request.sourceLang || "auto";
        let mainTranslation = "";
        let phonetic = "";
        const dictEntries = [];

        try {
          const data = await translateGoogleSingle(request.text, sl, tl, true);
          if (Array.isArray(data?.[0])) {
            mainTranslation = data[0].map((item) => (Array.isArray(item) && item[0]) ? item[0] : "").join("").trim();
            const phonItem = data[0].find((item) => Array.isArray(item) && typeof item[3] === "string" && item[3].trim());
            if (phonItem) phonetic = phonItem[3].trim();
          }
          if (Array.isArray(data?.[1])) {
            data[1].forEach((entry) => {
              if (Array.isArray(entry) && Array.isArray(entry[1]) && entry[1].length > 0) {
                dictEntries.push({ pos: entry[0] || "", terms: entry[1].slice(0, 4).join(", ") });
              }
            });
          }
        } catch (e) {
          try {
            const simple = await translateGoogleSingle(request.text, sl, tl, false);
            if (Array.isArray(simple?.[0])) {
              mainTranslation = simple[0].map((item) => (Array.isArray(item) && item[0]) ? item[0] : "").join("").trim();
            }
          } catch {
            const bingRes = await translateBingBatch([request.text], sl, tl);
            mainTranslation = bingRes[0] || "";
          }
        }

        if (!mainTranslation) throw new Error("Không nhận được bản dịch");

        let aiContextNote = "";
        const s = request.settings || {};
        if (["gemini", "groq", "ollama", "custom"].includes(s.provider) && request.contextSentence) {
          try {
            const langName = LANG_NAMES[tl] || tl;
            const prompt = `Giải thích ngắn gọn (1-2 câu bằng ${langName}) nghĩa của từ "${request.text}" trong câu sau: "${request.contextSentence}".`;
            aiContextNote = (await runAIText(prompt, s, false)).trim();
          } catch (e) { aiContextNote = `(${e.message})`; }
        }
        sendResponse({ success: true, translation: mainTranslation, phonetic, dictEntries, aiContextNote });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.type === "TRANSLATE_BATCH") {
    (async () => {
      try {
        const s = request.settings || { provider: "google" };
        const tl = request.targetLang || s.targetLang || "vi";
        const translations = await runBatchTranslate(request.texts || [], request.sourceLang || "auto", tl, s);
        sendResponse({ success: true, translations });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.type === "WHISPER_TRANSCRIBE") {
    (async () => {
      try {
        const s = request.settings || {};
        const segments = await callWhisperASR(request.bytes, request.mimeType, s);
        sendResponse({ success: true, segments });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.type === "FETCH_BILI_SUB_URL") {
    (async () => {
      try {
        const res = await fetch(request.url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (request.type === "TEST_TRANSLATE") {
    (async () => {
      try {
        const s = request.settings || { provider: "google" };
        const tl = s.targetLang || "vi";
        const translations = await runBatchTranslate(request.texts || ["I love you so"], "en", tl, s);
        sendResponse({ success: true, translations });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});