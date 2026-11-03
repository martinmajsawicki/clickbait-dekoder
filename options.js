/**
 * Clickbait Dekoder — logika options page.
 * Czyta/zapisuje ustawienia w chrome.storage.local i testuje klucz przez SW.
 */

const $ = (id) => document.getElementById(id);
const statusEl = $('status');

function setStatus(msg, kind) {
  statusEl.textContent = msg;
  statusEl.className = 'status' + (kind ? ' ' + kind : '');
}

// Ostatni wynik wywołania modelu, zapisywany przez service worker.
function showAiStatus(s) {
  const el = $('ai-status');
  if (!s) {
    el.textContent = '';
    return;
  }
  const when = new Date(s.ts).toLocaleString('pl-PL');
  el.textContent = s.ok
    ? `Ostatnie wywołanie AI (${s.model}, ${when}): działa ✓`
    : `Ostatnie wywołanie AI (${s.model}, ${when}): błąd — ${s.error}`;
  el.className = 'status ' + (s.ok ? 'ok' : 'err');
}

// Wczytaj zapisane ustawienia.
chrome.storage.local.get(['cbd_key', 'cbd_enabled', 'cbd_model', 'cbd_status'], (r) => {
  $('key').value = r.cbd_key || '';
  $('enabled').checked = r.cbd_enabled !== false; // domyślnie włączone
  // Zapisany model spoza listy (np. wycofany) — zostaje domyślny, czyli pierwsza opcja.
  if (r.cbd_model && [...$('model').options].some((o) => o.value === r.cbd_model)) {
    $('model').value = r.cbd_model;
  }
  showAiStatus(r.cbd_status);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.cbd_status) showAiStatus(changes.cbd_status.newValue);
});

$('save').addEventListener('click', () => {
  const key = $('key').value.trim();
  const enabled = $('enabled').checked;
  const model = $('model').value;
  chrome.storage.local.set({ cbd_key: key, cbd_enabled: enabled, cbd_model: model }, () => {
    if (enabled && !key) setStatus('Zapisano, ale brak klucza — wtyczka użyje samego regexu.', 'err');
    else setStatus('Zapisano.', 'ok');
  });
});

$('test').addEventListener('click', () => {
  const key = $('key').value.trim();
  const model = $('model').value;
  if (!key) {
    setStatus('Najpierw wklej klucz.', 'err');
    return;
  }
  setStatus('Testuję klucz…');
  chrome.runtime.sendMessage({ type: 'TEST_KEY', key, model }, (resp) => {
    if (chrome.runtime.lastError) {
      setStatus('Błąd komunikacji z service workerem: ' + chrome.runtime.lastError.message, 'err');
      return;
    }
    // Modele z myśleniem potrafią zużyć krótki limit na rozumowanie i zwrócić pustą treść —
    // odpowiedź bez błędu i tak oznacza, że klucz i model działają.
    if (resp && resp.ok) setStatus('Klucz działa ✓' + (resp.sample ? ' (odpowiedź: ' + resp.sample + ')' : ''), 'ok');
    else setStatus('Klucz nie działa: ' + (resp ? resp.error : 'brak odpowiedzi'), 'err');
  });
});
