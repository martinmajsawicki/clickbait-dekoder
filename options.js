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

// Wczytaj zapisane ustawienia.
chrome.storage.local.get(['cbd_key', 'cbd_enabled', 'cbd_model'], (r) => {
  $('key').value = r.cbd_key || '';
  $('enabled').checked = r.cbd_enabled === true;
  if (r.cbd_model) $('model').value = r.cbd_model;
});

$('save').addEventListener('click', () => {
  const key = $('key').value.trim();
  const enabled = $('enabled').checked;
  const model = $('model').value;
  if (enabled && !key) {
    setStatus('Włączono AI, ale brak klucza — wtyczka użyje samego regexu.', 'err');
  }
  chrome.storage.local.set({ cbd_key: key, cbd_enabled: enabled, cbd_model: model }, () => {
    setStatus('Zapisano.', 'ok');
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
    if (resp && resp.ok) setStatus('Klucz działa ✓ (odpowiedź: ' + resp.sample + ')', 'ok');
    else setStatus('Klucz nie działa: ' + (resp ? resp.error : 'brak odpowiedzi'), 'err');
  });
});
