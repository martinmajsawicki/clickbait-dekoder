/**
 * Clickbait Dekoder — service worker (warstwa API, BYO-key).
 *
 * Odbiera batch tytułów (JUDGE_BATCH) z content scriptu, sprawdza cache,
 * dosądza niepewne tytuły modelem przez OpenRouter (klucz użytkownika), zwraca
 * werdykty (JUDGE_RESULT) przyrostowo do karty. Klucz API nigdy nie opuszcza SW.
 */

importScripts('cbd-profiles.js', 'cbd-prompt.js');

const { buildBatchPrompt, parseBatchResponse, JUDGE_SYSTEM_PROMPT } = self.CBD.prompt;

const DEFAULT_MODEL = 'google/gemini-2.0-flash-001';
const BATCH_SIZE = 15;
const CACHE_PREFIX = 'cbd:v1:';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_MAX = 5000;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// In-flight cache keys — dedup równoległych żądań o ten sam tytuł.
const inFlight = new Set();

// === Ustawienia ===
async function getSettings() {
  const r = await chrome.storage.local.get(['cbd_key', 'cbd_enabled', 'cbd_model']);
  return {
    key: r.cbd_key || '',
    enabled: r.cbd_enabled === true,
    model: r.cbd_model || DEFAULT_MODEL,
  };
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
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
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
// Respektuje progi semantyczne promptu: 0-25 = nie CB (cb 0 → badge znika),
// 26-100 → skala 1-10 (26≈1, 100≈10). Dzięki temu /10 wreszcie coś znaczy,
// a model może usunąć false-positive regexa.
function modelCbToBadge(cb100) {
  if (!Number.isFinite(cb100) || cb100 < 26) return 0;
  const scaled = Math.round(1 + ((cb100 - 26) * 9) / 74);
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
    if (inFlight.has(k)) continue; // ktoś już pyta o ten tytuł
    inFlight.add(k);
    it._k = k;
    misses.push(it);
  }
  if (cachedVerdicts.length) sendVerdicts(tabId, cachedVerdicts);

  // 2. Brakujące — batche po BATCH_SIZE.
  try {
    for (let i = 0; i < misses.length; i += BATCH_SIZE) {
      const slice = misses.slice(i, i + BATCH_SIZE);
      const numbered = slice.map((it, idx) => ({ ...it, nr: idx + 1 }));
      let results = [];
      try {
        const prompt = buildBatchPrompt(numbered, host, section);
        const raw = await callLLM(prompt, { key: settings.key, model: settings.model, systemPrompt: JUDGE_SYSTEM_PROMPT });
        results = parseBatchResponse(raw);
      } catch (e) {
        console.warn('[CBD] LLM batch error:', e.message); // tytuły zostają regexowe
        continue;
      }
      const byNr = new Map(results.map((r) => [r.nr, r]));
      const out = [];
      for (const it of numbered) {
        const mr = byNr.get(it.nr);
        if (!mr) continue; // brak w odpowiedzi → werdykt regexowy zostaje
        const verdict = toVerdict(mr, it);
        await cacheSet(host, it.title, verdict, settings.model);
        out.push({ id: it.id, verdict });
      }
      if (out.length) sendVerdicts(tabId, out);
    }
  } finally {
    for (const it of misses) if (it._k) inFlight.delete(it._k);
  }
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
