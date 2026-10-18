/**
 * Clickbait Dekoder v3 — content script
 *
 * v3: Kontekstowe komentarze — każdy wykryty fragment dostaje
 *     spersonalizowany, złośliwy komentarz w stylu New Yorkera.
 *     Tooltip pokazuje DOKŁADNIE które słowo uruchomiło detekcję.
 */

// === GUARD AGAINST RE-ENTRY ===
let _isProcessing = false;


// === WZORCE I ANALIZA REGEXOWA ===
// Przeniesione do cbd-patterns.js (PATTERNS, CATEGORY_PILLARS, analyzeHeadlineCore)
// oraz cbd-judge.js (judgeRegex, qualifiesForApi). Oba ładowane wcześniej w
// content_scripts i wystawione na globalThis.CBD. Ten plik odpowiada za render + DOM.
const { judgeRegex, qualifiesForApi } = CBD.judge;

// === STAN: REJESTR BADGE'Y + KOLEJKA API ===
// pendingBadges trzyma uchwyt {badge, tooltip} pod unikalnym id, żeby werdykt
// modelu (asynchroniczny) mógł zaktualizować istniejący badge w miejscu.
const pendingBadges = new Map();
let _badgeSeq = 0;

// Kolejka tytułów do dosądzenia przez model. Wysyłana batchem do service workera.
const apiQueue = [];
let _flushTimer = null;

// Ustawienia z chrome.storage (opt-in). Domyślnie LLM wyłączony.
let settings = { enabled: false, hasKey: false };

function loadSettings() {
  try {
    if (typeof chrome === 'undefined' || !chrome.storage) return;
    chrome.storage.local.get(['cbd_enabled', 'cbd_key'], (res) => {
      settings.enabled = res.cbd_enabled === true;
      settings.hasKey = typeof res.cbd_key === 'string' && res.cbd_key.length > 0;
    });
    chrome.storage.onChanged?.addListener((changes, area) => {
      if (area !== 'local') return;
      if ('cbd_enabled' in changes) settings.enabled = changes.cbd_enabled.newValue === true;
      if ('cbd_key' in changes) settings.hasKey = !!changes.cbd_key.newValue;
    });
  } catch (e) {
    /* storage niedostępny — działamy na samym regexie */
  }
}

// Aktualizuje istniejący badge werdyktem modelu (lub usuwa, gdy model odrzucił).
function updateBadge(id, verdict) {
  const entry = pendingBadges.get(id);
  if (!entry) return; // DOM zniknął — ignorujemy
  if (verdict.cb < 1) {
    // Model odrzucił clickbait (regex dał false-positive) — sprzątamy.
    entry.tooltip.remove();
    entry.wrapper.remove();
    pendingBadges.delete(id);
    refreshScoreboard();
    return;
  }
  entry.badge.className = 'cbd-badge ' + badgeClassForScore(verdict.cb);
  entry.badge.textContent = `CB ${verdict.cb}`;
  fillTooltip(entry.tooltip, verdict);
  entry.verdict = verdict;
}

// Wysyła zebraną kolejkę do service workera (debounce). No-op gdy LLM wyłączony.
function flushApiQueue() {
  _flushTimer = null;
  if (!settings.enabled || !settings.hasKey) {
    apiQueue.length = 0;
    return;
  }
  if (apiQueue.length === 0) return;
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    apiQueue.length = 0;
    return;
  }
  const items = apiQueue.splice(0, apiQueue.length);
  try {
    chrome.runtime.sendMessage({ type: 'JUDGE_BATCH', items }, (resp) => {
      // Odpowiedzi przychodzą przyrostowo przez onMessage; tu tylko łykamy lastError.
      void chrome.runtime.lastError;
    });
  } catch (e) {
    /* SW uśpiony/niedostępny — badge zostaje regexowy */
  }
}

function enqueueForApi(item) {
  if (!settings.enabled || !settings.hasKey) return;
  apiQueue.push(item);
  if (!_flushTimer) _flushTimer = setTimeout(flushApiQueue, 300);
}

// Odbiór werdyktów modelu od service workera.
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'JUDGE_RESULT' && Array.isArray(msg.verdicts)) {
      for (const { id, verdict } of msg.verdicts) updateBadge(id, verdict);
      refreshScoreboard();
    }
  });
}

// === GENEROWANIE DEKODOWANIA (bezpieczne DOM) ===

// Buduje tooltip z werdyktu (regexowego lub modelu). Werdykt regexowy niesie
// matches[]; werdykt modelu może nieść sam snark + techniques — oba obsłużone.
function buildTooltipElement(verdict) {
  const tooltip = document.createElement('div');
  tooltip.className = 'cbd-tooltip';
  fillTooltip(tooltip, verdict);
  return tooltip;
}

// Wypełnia (lub odświeża w miejscu) zawartość tooltipa. Używane przez
// buildTooltipElement i przez updateBadge przy aktualizacji werdyktem modelu.
function fillTooltip(tooltip, verdict) {
  tooltip.textContent = '';

  const cb = verdict.cb;
  const scoreLabel =
    cb <= 1
      ? 'Lekki clickbait'
      : cb <= 3
        ? 'Solidny clickbait'
        : cb <= 5
          ? 'Ciężki clickbait'
          : 'Clickbait atomowy';

  const header = document.createElement('div');
  header.className = 'cbd-tooltip-header';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'cbd-score-label';
  labelSpan.textContent = scoreLabel;

  const numberSpan = document.createElement('span');
  numberSpan.className = 'cbd-score-number';
  numberSpan.textContent = `${cb}/10` + (verdict.source === 'api' || verdict.source === 'cache' ? ' · AI' : '');

  header.appendChild(labelSpan);
  header.appendChild(numberSpan);
  tooltip.appendChild(header);

  const list = document.createElement('ul');
  list.className = 'cbd-tooltip-list';

  const items =
    verdict.matches && verdict.matches.length
      ? verdict.matches
      : verdict.snark
        ? [{ name: (verdict.techniques && verdict.techniques[0]) || 'Werdykt modelu', snark: verdict.snark }]
        : [];

  for (const match of items) {
    const li = document.createElement('li');

    const categorySpan = document.createElement('span');
    categorySpan.className = 'cbd-category';
    categorySpan.textContent = match.name;
    li.appendChild(categorySpan);

    li.appendChild(document.createElement('br'));

    const snarkSpan = document.createElement('span');
    snarkSpan.className = 'cbd-snark';
    snarkSpan.textContent = match.snark;
    li.appendChild(snarkSpan);

    list.appendChild(li);
  }
  tooltip.appendChild(list);
}

// === DOM: DODAWANIE BADGE'Y ===

function badgeClassForScore(cb) {
  if (cb <= 1) return 'cbd-badge--low';
  if (cb <= 3) return 'cbd-badge--medium';
  if (cb <= 5) return 'cbd-badge--high';
  return 'cbd-badge--extreme';
}

function createBadge(verdict) {
  const badge = document.createElement('span');
  badge.className = 'cbd-badge';
  badge.classList.add(badgeClassForScore(verdict.cb));
  badge.textContent = `CB ${verdict.cb}`;
  return badge;
}

// === SELEKTORY SPECYFICZNE DLA PORTALI ===

const SITE_SELECTORS = {
  'gazeta.pl': [
    'a[class*="tile"]',
    'a[class*="link"]',
    'a[href*="gazeta.pl/"]',
    'a[href*="wyborcza"]',
    'a[href*="sport.pl"]',
    'a[href*="tokfm"]',
    'a[href*="plotek"]',
    'a.newest__link',
    '.sectionTiles__box a',
    '.mostPopular a',
    '.weekendBest a',
    'a.asideColumn__link',
    'a[class*="salesModule__article"]',
  ],
  'onet.pl': [
    'a[class*="sectionLink"]',
    'a[class*="smallCardLink"]',
    'a[class*="CardLink"]',
    'a[class*="itemLink"]',
    'a[class*="teaser"]',
    'article a',
    'h2 a',
    'h3 a',
  ],
  'wp.pl': [
    'a[class*="teaserLink"]',
    'a[class*="teaser"]',
    'a[class*="wp-text-link"]',
    'a[class*="wp-header-tile"]',
    'a[class*="sc-"]',
    'h2 a',
    'h3 a',
    'article a',
  ],
  'interia.pl': ['a.tile-a', 'a.listitem-a', 'a[class*="tile"]', 'a[class*="news"]', 'h2 a', 'h3 a', 'article a'],
  'pudelek.pl': ['a[class*="tile"]', 'a[class*="article"]', 'h2 a', 'h3 a', 'article a'],
  'fakt.pl': ['a.padded-item-link', 'a.item-link', 'a[class*="item-link"]', 'h2 a', 'h3 a'],
  'o2.pl': ['a[class*="teaser"]', 'a[class*="wp-text-link"]', 'a[class*="wp-"]', 'h2 a', 'h3 a'],
  'pomponik.pl': ['a[class*="ids-card__anchor"]', 'a[class*="ids-undecorated"]', 'h2 a', 'h3 a', 'article a'],
  'se.pl': ['a[class*="tile"]', 'a[class*="article"]', 'h2 a', 'h3 a', 'article a'],
  // natemat.pl: SPA — headless Chrome nie widzi treści (consent wall?). Działa w prawdziwym Chrome.
  'natemat.pl': ['a.page-link', 'a[class*="page-link"]', 'a[class*="item"]', 'a[class*="tile"]', 'h2 a', 'h3 a', 'article a'],
  'money.pl': ['a[class*="sc-"]', 'a[href*="money.pl/"]', 'h2 a', 'h3 a', 'article a'],
  'noizz.pl': ['a.itemLink', 'a[class*="itemLink"]', 'a[class*="item"]', 'h2 a', 'h3 a', 'article a'],
  'polsatnews.pl': ['a.news__link', 'a.urgent__link', 'a.section__link', 'a.report-widget__link', 'a.tabs__link', 'h2 a', 'h3 a'],
  'tvn24.pl': ['a[class*="sc-"]', 'a[class*="link"]', 'h2 a', 'h3 a', 'article a'],
  'tvrepublika.pl': ['[class*="article-"] h2', '[class*="article-"] h2 a', 'h2 a', 'h3 a'],
  'dziendobry.tvn.pl': ['a[class*="sc-"]', 'a[class*="link"]', 'h2 a', 'h3 a', 'article a'],
  'radiozet.pl': ['a.box__item__link', 'a.box__timeline__list__item__link', 'a.box__alert__title__text__item', 'a[class*="box__"]', 'h2 a', 'h3 a'],
  'rmf24.pl': ['a.t0', 'a.t1', 'a.t2', 'a.t3', 'a.t4', 'h2 a', 'h3 a', 'article a'],
  'tokfm.pl': ['a[class*="box__"]', 'a[class*="item"]', 'h2 a', 'h3 a', 'article a'],
  'polskieradio24.pl': ['a[class*="article"]', 'a[class*="news"]', 'h2 a', 'h3 a', 'article a'],
  'wyborcza.pl': ['a[class*="entry"]', 'a[class*="article"]', 'a[class*="sc-"]', 'h2 a', 'h3 a', 'article a'],
  'xyz.pl': ['a[class*="article"]', 'a[class*="post"]', 'h2 a', 'h3 a', 'article a'],
  'nczas.com': ['h3.entry-title a', '.entry-title a', 'h2 a', 'h3 a', 'article a'],
  'dorzeczy.pl': ['li.bli a strong.t', 'h2 a', 'h3 a'],
  _default: ['h1 a', 'h2 a', 'h3 a', 'h4 a', 'article a', 'a[data-ga-action]'],
};

function getSelectors() {
  const host = window.location.hostname;
  for (const [domain, sels] of Object.entries(SITE_SELECTORS)) {
    if (domain !== '_default' && host.includes(domain)) {
      return [...sels, ...SITE_SELECTORS._default];
    }
  }
  return SITE_SELECTORS._default;
}

// === GŁÓWNA LOGIKA ===

function processPage() {
  _isProcessing = true;
  const selectors = getSelectors();
  const processed = new Set();
  const allElements = new Set();

  for (const selector of selectors) {
    try {
      document.querySelectorAll(selector).forEach((el) => allElements.add(el));
    } catch (e) {
      // Invalid selector — skip
    }
  }

  // Sort: smallest (leaf) elements first, so parents are processed after children
  const sortedElements = [...allElements].sort(
    (a, b) => ((a.innerText || a.textContent)?.length || 0) - ((b.innerText || b.textContent)?.length || 0)
  );

  let count = 0;

  for (const el of sortedElements) {
    if (el.querySelector('.cbd-badge') || el.getAttribute('data-cbd-processed')) continue;
    // Skip elements that are primarily images (no meaningful text)
    if (el.querySelector('img') && (el.innerText || el.textContent).trim().replace(/\s+/g,' ').length < 30) continue;
    // Skip WP navigation tiles, ads, and section headers
    if (el.closest('[class*="header-services"], [class*="header-tile"]')) continue;

    // innerText reads only VISIBLE text (excludes hidden children, category labels, lead paragraphs)
    // textContent reads ALL text including hidden elements — causes false matches on dorzeczy, tvrepublika
    let text = (el.innerText || el.textContent)?.trim().replace(/\s+/g, ' ');
    if (!text || text.length < 20 || text.length > 250) continue;
    // Skip WP internal promos and section navigation
    if (/^(REKLAMA|HOROSKOPY|PROGRAM TV|POGODA)\b/i.test(text)) continue;

    // Detect analytical/opinion section tags BEFORE stripping (reduces false positives)
    const isAnalytical = /Strefa\s+wojn|Dylematy|Analiz[aę]|Opini[aę]|Ekonomi[aę]|Wywiad|Komentarz|Felieton|Debata|Raport|\[OPINIA\]|\[ANALIZA\]|\[KOMENTARZ\]|\[WYWIAD\]|\[RAPORT\]|\[DEBATA\]/i.test(text);

    // Strip leading labels (PREMIUM, PILNE, timestamps, category tags, author names)
    text = text.replace(/^(PREMIUM|PILNE|NOWE|NA ŻYWO|TYLKO U NAS|WASZ GŁOS|OPINIA|WYWIAD|KOMENTARZ|WYBORCZA\.PL|WIDEO)\s*/i, '');
    text = text.replace(/^\d{1,2}:\d{2}\s+/, ''); // Strip timestamps (19:14 ...)
    text = text.replace(/^(Pon|Wt|Śr|Czw|Pt|Sob|Nie|pn|wt|śr|czw|pt|sb|nd)\s+\d{1,2}:\d{2}\s+/i, ''); // naTemat day+time
    text = text.replace(/^\d{1,4}\s+/, ''); // Strip SE.pl numeric prefixes (96 Relacja..., 40 Psychologia...)
    text = text.replace(/^(DUŻO ZDJĘĆ|ZDJĘCIA|MOCNE|WAŻNE|TYLKO U NAS|EXCLUSIVE)\s+/i, ''); // Strip SE/fakt tags
    // Strip author names appended by WP/Onet (e.g. "...tekst Jakub Balcerski")
    text = text.replace(/\s+(Obserwuj|Obserwuj autorów).*$/i, '');
    text = text.replace(/\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+([-][A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?$/,'');
    text = text.replace(
      /\s+(BIZNES|SPORT|KOBIETA|NEXT|MOTO|FILM|TENIS|PRENUMERATA|MATERIAŁ PROMOCYJNY|MOTO NEWS|OFERTY AVANTI24|OFERTY CZTERY KĄTY|LEKKOATLETYKA|SKOKI NARCIARSKIE|PIŁKA NOŻNA)$/i,
      ''
    );

    // Strip section headers (BLOG EKONOMICZNY, MAT. SPONSOROWANY etc.)
    text = text.replace(/^(BLOG\s+EKONOMICZNY[^|]*\|?\s*|MAT\.\s*SPONSOROWANY\s*)/i, '');
    text = text.replace(/\s*\[(ANALIZA|OPINIA|KOMENTARZ|WYWIAD|RAPORT|DEBATA)\]\s*$/i, '');

    if (processed.has(text)) continue;
    if (el.closest('nav, footer, .menu, .sidebar-nav')) continue;
    if (text.length < 30 && !/[.!?""]/.test(text)) continue;
    // Skip subscription/promo banners — not articles
    if (/oferta\s+prenumerat|prenumerata\s+cyfrowa|sprawdź\s+ofertę|kup\s+teraz|ogłoszenia\s+(mieszkań|nieruchomości)|SPRAWDŹ$/i.test(text)) continue;

    processed.add(text);

    const verdict = judgeRegex(text, { isAnalytical });
    if (verdict.cb < 1) continue;

    const badge = createBadge(verdict);
    const tooltip = buildTooltipElement(verdict);
    const badgeId = ++_badgeSeq;
    badge.setAttribute('data-cbd-id', String(badgeId));

    const wrapper = document.createElement('span');
    wrapper.className = 'cbd-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline';

    function positionTooltip() {
      const rect = badge.getBoundingClientRect();
      // Position tooltip below badge, clamped to viewport
      let top = rect.bottom + 6;
      let left = rect.left;
      // Clamp right edge
      if (left + 350 > window.innerWidth) {
        left = window.innerWidth - 360;
      }
      if (left < 10) left = 10;
      // If below viewport, show above badge
      if (top + 200 > window.innerHeight) {
        top = rect.top - 10;
        tooltip.style.transform = 'translateY(-100%)';
      } else {
        tooltip.style.transform = '';
      }
      tooltip.style.top = top + 'px';
      tooltip.style.left = left + 'px';
    }

    badge.addEventListener('mouseenter', () => {
      positionTooltip();
      tooltip.classList.add('cbd-tooltip--visible');
    });

    badge.addEventListener('mouseleave', () => {
      tooltip.classList.remove('cbd-tooltip--visible');
    });

    // Click as fallback — works even when overlay blocks hover (hero images)
    badge.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isVisible = tooltip.classList.contains('cbd-tooltip--visible');
      // Hide all other tooltips first
      document.querySelectorAll('.cbd-tooltip--visible').forEach(t => t.classList.remove('cbd-tooltip--visible'));
      if (!isVisible) {
        positionTooltip();
        tooltip.classList.add('cbd-tooltip--visible');
      }
    });

    wrapper.appendChild(badge);
    // Append tooltip to body so it escapes overflow:hidden parents
    document.body.appendChild(tooltip);

    // Try to place badge on associated image instead of text
    // Search up to 3 levels up for an img element
    let imgTarget = null;
    let searchEl = el;
    for (let i = 0; i < 4 && searchEl; i++) {
      const img = searchEl.querySelector('img, picture, [style*="background-image"]');
      if (img && img.offsetHeight > 50) {
        imgTarget = img.closest('a, div, figure, picture') || img.parentElement;
        break;
      }
      searchEl = searchEl.parentElement;
    }

    const targetEl = imgTarget || el;
    const targetPosition = window.getComputedStyle(targetEl).position;
    if (targetPosition === 'static') {
      targetEl.style.position = 'relative';
    }
    wrapper.style.position = 'absolute';
    wrapper.style.top = '8px';
    wrapper.style.left = '8px';
    wrapper.style.display = 'inline-block';
    wrapper.style.zIndex = '10000';

    if (imgTarget) {
      // Place on image — more visible, doesn't obscure text
      imgTarget.appendChild(wrapper);
    } else {
      // Fallback: place inside text element
      el.insertBefore(wrapper, el.firstChild);
    }
    // Mark the original link so re-runs skip it
    el.setAttribute('data-cbd-processed', 'true');

    // Zarejestruj uchwyt, by werdykt modelu mógł zaktualizować ten badge.
    pendingBadges.set(badgeId, { badge, tooltip, wrapper, title: text, verdict });

    // Dosądzenie przez model tylko dla przypadków niepewnych (i gdy LLM włączony).
    if (verdict.status === 'pending') {
      const sectionLabel = (
        el.closest('section, [class*="section"]')?.querySelector('h2, h3, [class*="header"]')?.textContent || ''
      )
        .trim()
        .slice(0, 40);
      enqueueForApi({
        id: badgeId,
        title: text,
        host: window.location.hostname,
        section: sectionLabel,
        // Dowody dla modelu: technika + fragment, który ją uruchomił (bez snarka — lżejszy prompt).
        signals: verdict.matches.map((m) => ({ t: m.name, frag: m.matchedText })),
        isAnalytical,
      });
    }
    count++;
  }

  // Count ALL badges on page (not just this run — MutationObserver re-runs skip already-badged)
  const totalBadges = document.querySelectorAll('.cbd-badge').length;
  const totalScanned = Math.max(processed.size, totalBadges);

  console.log(
    `[Clickbait Dekoder] Przeskanowano ${totalScanned} tytułów, oznaczono ${totalBadges} clickbaitów (ten przebieg: +${count})`
  );

  // === FLOATING SCOREBOARD ===
  _lastScanned = totalScanned;
  updateScoreboard(totalScanned, totalBadges);
  _isProcessing = false;
}

// Przelicza scoreboard po asynchronicznej zmianie liczby badge'y (werdykty modelu).
let _lastScanned = 0;
function refreshScoreboard() {
  const detected = document.querySelectorAll('.cbd-badge').length;
  updateScoreboard(Math.max(_lastScanned, detected), detected);
}

function updateScoreboard(scanned, detected) {
  let sb = document.getElementById('cbd-scoreboard');
  if (!sb) {
    sb = document.createElement('div');
    sb.id = 'cbd-scoreboard';
    sb.innerHTML = `
      <div class="cbd-sb-header">🔍 CLICKBAIT DEKODER</div>
      <div class="cbd-sb-stats">
        <div class="cbd-sb-stat">
          <span class="cbd-sb-number" id="cbd-sb-detected">0</span>
          <span class="cbd-sb-label">clickbaitów</span>
        </div>
        <div class="cbd-sb-divider"></div>
        <div class="cbd-sb-stat">
          <span class="cbd-sb-number cbd-sb-number--dim" id="cbd-sb-scanned">0</span>
          <span class="cbd-sb-label">tytułów</span>
        </div>
      </div>
      <div class="cbd-sb-pct" id="cbd-sb-pct"></div>
    `;
    document.body.appendChild(sb);

    // Make scoreboard draggable
    let isDragging = false, offsetX = 0, offsetY = 0;
    sb.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - sb.getBoundingClientRect().left;
      offsetY = e.clientY - sb.getBoundingClientRect().top;
      sb.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      sb.style.left = (e.clientX - offsetX) + 'px';
      sb.style.top = (e.clientY - offsetY) + 'px';
      sb.style.right = 'auto';
      sb.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => {
      isDragging = false;
      sb.style.cursor = 'grab';
    });
    sb.style.cursor = 'grab';
  }
  document.getElementById('cbd-sb-detected').textContent = detected;
  document.getElementById('cbd-sb-scanned').textContent = scanned;
  const pct = scanned > 0 ? Math.round((detected / scanned) * 100) : 0;
  document.getElementById('cbd-sb-pct').textContent = pct > 0
    ? `${pct}% tytułów to clickbait`
    : 'Czysto — brak clickbaitu';
}

// Zamknij wszystkie tooltips po kliknięciu poza badge
document.addEventListener('click', (e) => {
  if (!e.target.closest('.cbd-badge')) {
    document.querySelectorAll('.cbd-tooltip--visible').forEach(t => t.classList.remove('cbd-tooltip--visible'));
  }
});

// Wczytaj ustawienia (opt-in LLM) zanim ruszy przetwarzanie.
loadSettings();

// Uruchom po załadowaniu strony
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processPage);
} else {
  processPage();
}

// Obserwuj dynamicznie ładowaną treść (infinite scroll)
const observer = new MutationObserver((mutations) => {
  if (_isProcessing) return; // Prevent re-entry from our own DOM changes
  let hasNewContent = false;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      // Skip our own badge/tooltip/scoreboard insertions
      if (node.nodeType === 1 && (node.classList?.contains('cbd-wrapper') ||
          node.classList?.contains('cbd-badge') || node.id === 'cbd-scoreboard')) continue;
      hasNewContent = true;
      break;
    }
    if (hasNewContent) break;
  }
  if (hasNewContent) {
    clearTimeout(observer._debounce);
    observer._debounce = setTimeout(processPage, 500);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
