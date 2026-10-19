/**
 * Clickbait Dekoder — service worker (warstwa API, BYO-key).
 *
 * Odbiera batch tytułów (JUDGE_BATCH) z content scriptu, sprawdza cache,
 * dosądza niepewne tytuły modelem przez OpenRouter (klucz użytkownika), zwraca
 * werdykty (JUDGE_RESULT) przyrostowo do karty. Klucz API nigdy nie opuszcza SW.
 */

importScripts('cbd-patterns.js', 'cbd-profiles.js', 'cbd-prompt.js');

const { buildBatchPrompt, parseBatchResponse, JUDGE_SYSTEM_PROMPT } = self.CBD.prompt;

const DEFAULT_MODEL = 'google/gemini-3.8-flash';
// Parametry per model. 3.8 Flash z ograniczonym myśleniem: jakość jak Gemini 2.5 Pro
// przy czasie ~9 s na batch (pomiar 2026-10-19, ../clickbait-audit-tool/eval/README.md).
const MODEL_OPTIONS = {
  'google/gemini-3.8-flash': { reasoning: { effort: 'low' } },
};
// Modele wycofane z OpenRoutera — zapisany wybór użytkownika przechodzi na domyślny.
const RETIRED_MODELS = new Set(['google/gemini-2.0-flash-001', 'anthropic/claude-3.5-haiku']);
const BATCH_SIZE = 15;
const CACHE_PREFIX = 'cbd:v1:';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_MAX = 5000;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// In-flight: klucz cache → lista dodatkowych chętnych [{ tabId, id }].
// Ten sam tytuł w drugim miejscu strony (albo w drugiej karcie) nie pyta modelu
// drugi raz, tylko dostaje werdykt z zapytania, które już trwa.
const inFlight = new Map();

// === Ustawienia ===
async function getSettings() {
  const r = await chrome.storage.local.get(['cbd_key', 'cbd_enabled', 'cbd_model']);
  return {
    key: r.cbd_key || '',
    enabled: r.cbd_enabled === true,
    model: r.cbd_model && !RETIRED_MODELS.has(r.cbd_model) ? r.cbd_model : DEFAULT_MODEL,
  };
}

// === Status warstwy AI (widoczny w scoreboardzie i w opcjach) ===
async function setStatus(ok, model, error = '') {
  await chrome.storage.local.set({ cbd_status: { ok, model, error: error.slice(0, 200), ts: Date.now() } });
}
function reportError(tabId, ids, message) {
  if (tabId == null) return;
  chrome.tabs.sendMessage(tabId, { type: 'JUDGE_ERROR', ids, error: message }, () => void chrome.runtime.lastError);
}

// === Hash (cyrb53) do klucza cache ===
function cyrb53(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
function normTitle(t) {
  return (t || '').trim().replace(/\s+/g, ' ').toLowerCase();
}
function cacheKey(host, title) {
  return CACHE_PREFIX + (host || '') + ':' + cyrb53(normTitle(title));
}

// === Cache ===
async function cacheGet(host, title, model) {
  const k = cacheKey(host, title);
  const r = await chrome.storage.local.get(k);
  const entry = r[k];
  if (!entry) return null;
  if (entry.model !== model) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
  return { ...entry.verdict, source: 'cache' };
}
async function cacheSet(host, title, verdict, model) {
  const k = cacheKey(host, title);
  await chrome.storage.local.set({ [k]: { verdict, ts: Date.now(), model } });
  maybeGc();
}

let _gcBusy = false;
async function maybeGc() {
  if (_gcBusy || Math.random() > 0.02) return; // ~2% szans na skan
  _gcBusy = true;
  try {
    const all = await chrome.storage.local.get(null);
    const entries = Object.entries(all).filter(([k]) => k.startsWith(CACHE_PREFIX));
    const now = Date.now();
    const expired = entries.filter(([, v]) => now - v.ts > CACHE_TTL_MS).map(([k]) => k);
    if (expired.length) await chrome.storage.local.remove(expired);
    const live = entries.length - expired.length;
    if (live > CACHE_MAX) {
      const survivors = entries.filter(([k]) => !expired.includes(k)).sort((a, b) => a[1].ts - b[1].ts);
      const drop = survivors.slice(0, Math.ceil(live * 0.2)).map(([k]) => k);
      if (drop.length) await chrome.storage.local.remove(drop);
    }
  } catch (e) {
    /* GC best-effort */
  } finally {
    _gcBusy = false;
  }
}

// === OpenRouter (port callLLM z audit.js, retry 429) ===
async function callLLM(prompt, { key, model, systemPrompt, maxTokens = 4000, temperature = 0.1, _retry = 0 }) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/martinmajsawicki/clickbait-dekoder',
      'X-Title': 'Clickbait Dekoder',
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, ...(MODEL_OPTIONS[model] || {}) }),
  });

  if (!res.ok) {
    if (res.status === 429 && _retry < 2) {
      await new Promise((r) => setTimeout(r, 10000));
      return callLLM(prompt, { key, model, systemPrompt, maxTokens, temperature, _retry: _retry + 1 });
    }
    const err = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// === Adapter: wynik modelu (cb 0-100) → Verdict (cb 0-10) ===
// Próg badge'a 40 (pomiar 2026-10-18 na 123 tytułach z ręczną oceną: przy 26
// model oznaczał większość uczciwych tytułów z dolnej części strefy "graniczny").
// Poniżej progu cb 0 → badge znika; 40-100 → skala 1-10 (40≈1, 100≈10).
const BADGE_MIN_CB100 = 40;
function modelCbToBadge(cb100) {
  if (!Number.isFinite(cb100) || cb100 < BADGE_MIN_CB100) return 0;
  const scaled = Math.round(1 + ((cb100 - BADGE_MIN_CB100) * 9) / (100 - BADGE_MIN_CB100));
  return Math.max(1, Math.min(scaled, 10));
}

function toVerdict(modelResult, item) {
  const cb100 = Number(modelResult?.cb);
  const cb = Number.isFinite(cb100) ? modelCbToBadge(cb100) : item.signals?.length ? 1 : 0;
  const techniques = [...new Set((item.signals || []).map((s) => s.t))];
  return {
    cb,
    pillars: Array.isArray(modelResult?.filary) ? modelResult.filary : [],
    snark: modelResult?.snark || '',
    techniques,
    source: 'api',
    status: 'final',
  };
}

// === Główna obsługa batcha ===
async function handleBatch(items, tabId) {
  const settings = await getSettings();
  if (!settings.enabled || !settings.key) return; // opt-in / brak klucza → nic
  if (!Array.isArray(items) || items.length === 0) return;

  const host = items[0].host || '';
  const section = items[0].section || '';

  // 1. Cache + dedup in-flight.
  const misses = [];
  const cachedVerdicts = [];
  for (const it of items) {
    const cached = await cacheGet(host, it.title, settings.model);
    if (cached) {
      cachedVerdicts.push({ id: it.id, verdict: cached });
      continue;
    }
    const k = cacheKey(host, it.title);
    if (inFlight.has(k)) {
      inFlight.get(k).push({ tabId, id: it.id }); // ktoś już pyta o ten tytuł — czekamy na jego werdykt
      continue;
    }
    inFlight.set(k, []);
    it._k = k;
    misses.push(it);
  }
  if (cachedVerdicts.length) sendVerdicts(tabId, cachedVerdicts);

  // 2. Brakujące — batche po BATCH_SIZE, wysyłane równolegle (model z "myśleniem"
  // odpowiada ~10 s na batch; po kolei ostatnie badge'e na dużej stronie czekałyby pół minuty).
  const slices = [];
  for (let i = 0; i < misses.length; i += BATCH_SIZE) slices.push(misses.slice(i, i + BATCH_SIZE));
  try {
    await Promise.all(slices.map((slice) => judgeSlice(slice, { host, section, tabId, settings })));
  } finally {
    for (const it of misses) if (it._k) inFlight.delete(it._k);
  }
}

// Jeden batch: zapytanie do modelu, cache, werdykty do karty i do czekających powtórek.
async function judgeSlice(slice, { host, section, tabId, settings }) {
  const numbered = slice.map((it, idx) => ({ ...it, nr: idx + 1 }));
  let results = [];
  try {
    const prompt = buildBatchPrompt(numbered, host, section);
    const raw = await callLLM(prompt, { key: settings.key, model: settings.model, systemPrompt: JUDGE_SYSTEM_PROMPT });
    results = parseBatchResponse(raw);
    if (results.length === 0) throw new Error('nieczytelna odpowiedź modelu');
  } catch (e) {
    // Tytuły zostają regexowe; błąd trafia do scoreboardu i opcji.
    console.warn('[CBD] LLM batch error:', e.message);
    await setStatus(false, settings.model, e.message);
    reportError(tabId, slice.map((it) => it.id), e.message);
    for (const it of slice) {
      for (const w of inFlight.get(it._k) || []) reportError(w.tabId, [w.id], e.message);
    }
    return;
  }
  await setStatus(true, settings.model);
  const byNr = new Map(results.map((r) => [Number(r.nr), r]));
  const out = [];
  for (const it of numbered) {
    const mr = byNr.get(it.nr);
    if (!mr) continue; // brak w odpowiedzi → werdykt regexowy zostaje
    const verdict = toVerdict(mr, it);
    await cacheSet(host, it.title, verdict, settings.model);
    out.push({ id: it.id, verdict });
    for (const w of inFlight.get(it._k) || []) sendVerdicts(w.tabId, [{ id: w.id, verdict }]);
  }
  if (out.length) sendVerdicts(tabId, out);
}

function sendVerdicts(tabId, verdicts) {
  if (tabId == null) return;
  chrome.tabs.sendMessage(tabId, { type: 'JUDGE_RESULT', verdicts }, () => void chrome.runtime.lastError);
}

// === Test klucza (z options page) ===
async function testKey(key, model) {
  try {
    const raw = await callLLM('Odpowiedz jednym słowem: OK', {
      key,
      model: model || DEFAULT_MODEL,
      maxTokens: 5,
    });
    return { ok: true, sample: (raw || '').slice(0, 40) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// === Router wiadomości ===
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;
  if (msg.type === 'JUDGE_BATCH') {
    handleBatch(msg.items, sender.tab?.id);
    return; // odpowiedzi idą przez chrome.tabs.sendMessage
  }
  if (msg.type === 'TEST_KEY') {
    testKey(msg.key, msg.model).then(sendResponse);
    return true; // async sendResponse
  }
});
