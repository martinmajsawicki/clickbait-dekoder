/**
 * Clickbait Dekoder v2 — content script
 * Skanuje tytuły na polskich portalach, wykrywa techniki clickbaitowe,
 * dodaje badge ze score'em i tooltip z dekodowaniem.
 *
 * v2: Rozszerzone wzorce po analizie gazeta.pl (22.03.2026)
 *     Dodano: obietnica szoku, prowokacja, wyzwanie, ekspresyjne czasowniki,
 *     "kulisy", "reaguje na", superlatywy stopnia najwyższego, CAPS/wykrzykniki,
 *     niedopowiedziana pointa, "opublikował nagranie"
 */

// === WZORCE CLICKBAITOWE ===

const PATTERNS = [
  {
    id: 'hidden_answer',
    name: 'Ukryta odpowiedź',
    decode: 'Gdyby odpowiedź była sensacyjna, byłaby w tytule.',
    patterns: [
      /oto,?\s*(co|jak|dlaczego|kto)/i,
      /sprawdź,?\s*(co|jak|dlaczego)/i,
      /dowiedz się/i,
      /jest\s+(nagranie|wideo|film|zdjęcie)/i,
      /wiadomo,?\s*(co|jak|kto|ile)/i,
      /znamy\s+(szczegóły|powód|przyczynę)/i,
      /ujawniono/i,
      /ujawni[ła]\s+(kulisy|szczegóły|prawdę)/i,
      /opublikował[aoy]?\s+(nagranie|zdjęci[ae]|wideo|film)/i,
      /wyszło na jaw/i,
      /oto\s+prawda/i,
      /sekretn[yae]/i,
      /ta?jemnic[aąeę]/i,
      /co\s+(zrobił[aoy]?|powiedział[aoy]?|stało się)\s+potem/i,
      /nie\s+uwierzysz/i,
      /wdarł[aoy]?\s+się/i,
      /kulisy\s+(rozwodu|afery|skandalu|sprawy|związku|rozstania|konfliktu)/i,
    ],
    weight: 2,
  },
  {
    id: 'superlative',
    name: 'Superlativ / przesada',
    decode: 'Odejmij 95% dramaturgii. "Szokujące" = "lekko zaskakujące".',
    patterns: [
      /\bHIT\b/,
      /szok(ujące?|ował[aoy])?/i,
      /niesamowit[yae]/i,
      /niewiarygodne?/i,
      /przełomow[yae]/i,
      /rewolucyjn[yae]/i,
      /fenomenaln[yae]/i,
      /kosmiczn[yae]/i,
      /brutaln[yae]/i,
      /skandaliczn[yae]/i,
      /sensacyjn[yae]/i,
      /fundamentaln[yae]/i,
      /wulgar[ny]/i,
      /dramatyczn[yae]/i,
      /nieludzk[ie]/i,
      /jak\s+marzenie/i,
      /bije\s+(na\s+głowę|konkurencję|rekordy)/i,
      /na\s+łopatki/i,
      /jak\s+nigdy/i,
      /absolutn[yae]/i,
      /totaln[yae]/i,
      /epic[kc]/i,
      /miazga/i,
      /masakra/i,
      /demolka/i,
      /pogrom/i,
      /kapitaln[yae]/i,
      /rekordow[yae]/i,
      /najlepsz[yae]/i,
      /najgorsz[yae]/i,
      /największ[yae]/i,
      /pierwszy\s+raz/i,
      /największ[yae]\s+eliminacj/i,
    ],
    weight: 1,
  },
  {
    id: 'shock_promise',
    name: 'Obietnica szoku',
    decode: '"Aż się wierzyć nie chce" = chce się wierzyć, i tak zrobisz po kliknięciu.',
    patterns: [
      /aż\s+się\s+(wierzyć\s+nie\s+chce|nie\s+chce\s+wierzyć)/i,
      /trudno\s+uwierzyć/i,
      /nikt\s+się\s+nie\s+spodziewał/i,
      /tego\s+się\s+nie\s+spodziewał/i,
      /nie\s+(do\s+wiary|do\s+uwierzenia)/i,
      /nie\s+dowierza/i,
      /wprost\s+nie\s+mogli\s+uwierzyć/i,
      /zaskakując[yae]\s+(wynik|zwrot|odkrycie|decyzja)/i,
    ],
    weight: 2,
  },
  {
    id: 'demonstrative',
    name: 'Zaimek wskazujący',
    decode: 'Zamień "ten trik" na konkretną nazwę. Nie da się? Bo nie warto.',
    patterns: [
      /\b(ten|ta|to|te|ci|tym|tych|tego|tej)\s+(prosty|jeden|jedyny|nowy|niesamowity|szokujący|genialny)/i,
      /\bten\s+(trik|sposób|preparat|produkt|model|film|serial|artykuł|sprzęt|samochód)/i,
      /\bta\s+(metoda|dieta|sztuczka|marka|kobieta|gwiazda)/i,
      /\bto\s+(zmieni|pomoże|sprawi|rozwiąże|uratuje)/i,
      /tych\s+(aut|osób|ludzi|miast|telefonów)/i,
    ],
    weight: 2,
  },
  {
    id: 'quote_bait',
    name: 'Wyrwany cytat',
    decode: 'W pełnym kontekście brzmi zupełnie zwyczajnie.',
    patterns: [
      /[""„"].{3,60}["""]/,
      /przejmując[yae]\s+słow[aoy]/i,
      /mocne\s+słow[aoy]/i,
      /gorzkie?\s+słow[aoy]/i,
      /wyznał[aoy]?/i,
      /zdradził[aoy]?\s+(co|jak|że)/i,
    ],
    weight: 1,
  },
  {
    id: 'serial_drama',
    name: 'Dramaturgia serialu',
    decode: 'Połącz zdania bez pauzy. Brzmi nudno? Bo jest nudne.',
    patterns: [
      /zaczęło się\s+(niewinnie|normalnie|zwyczajnie)/i,
      /\bale\s+potem\b/i,
      /nagły\s+(zwrot|koniec|finał)/i,
      /piekło\s+trwało/i,
      /koszmar\s/i,
      /dramat[yua]?\b/i,
      /\.{3}\s*$/,
      /—\s*(i|ale|a)\s/,
      /są\s+konsekwencje/i,
      /jest\s+(reakcja|odpowiedź|komentarz)/i,
      /to się działo/i,
      /a\s+tu\s+nagle/i,
      /i\s+wtedy/i,
      /potem\s+było\s+(tylko\s+)?(gorzej|lepiej)/i,
      /wszystko\s+(jasne|się\s+wyjaśniło)/i,
    ],
    weight: 1,
  },
  {
    id: 'collective',
    name: '"Polacy oszaleli"',
    decode: 'Zamień na "kilka tysięcy osób kupiło/zrobiło". Nadal chcesz kliknąć?',
    patterns: [
      /polacy\s+(oszaleli|nie\s+mogą|pokochali|wybierają|odkryli)/i,
      /internet\s+(oszalał|eksplodował|huczy)/i,
      /wszyscy\s+(mówią|chcą|robią)/i,
      /cała\s+(polska|europa|branża|sieć)/i,
      /robi\s+szał/i,
      /hitem?\s+(jest|stał|został)/i,
      /podbij[aą]\s+(rynek|internet|sieć)/i,
      /bez\s+szans/i,
      /wściekli/i,
    ],
    weight: 2,
  },
  {
    id: 'emotional_blackmail',
    name: 'Emocjonalny szantaż',
    decode: 'Gdy tytuł mówi ci co masz czuć — właśnie przyznał, że sam tego nie wywoła.',
    patterns: [
      /pęknie\s+ci\s+serce/i,
      /zatkało\s+(nas|mnie|ich)/i,
      /łzy\s+(w\s+oczach|same|cisną)/i,
      /nie\s+powstrzymasz\s+(łez|śmiechu|emocji)/i,
      /twoja\s+reakcja/i,
      /będziesz\s+(płakać|śmiać|zaskoczony)/i,
      /wzruszy\s+(cię|każdego)/i,
      /zmrozi\s+ci\s+krew/i,
      /ciarki/i,
      /przejmując[yae]/i,
    ],
    weight: 2,
  },
  {
    id: 'challenge',
    name: 'Wyzwanie / rywalizacja',
    decode: 'Dasz radę. Albo nie. W obu przypadkach nie dowiesz się niczego nowego.',
    patterns: [
      /a\s+ty\s+(na\s+ile|ile|jak|co)\s/i,
      /a\s+ty\??$/i,
      /ile\s+(dasz\s+radę|wytrzymasz)/i,
      /sprawdź\s+(czy\s+dasz\s+radę|swoją\s+wiedzę|się)/i,
      /większość\s+(odpada|nie\s+zdaje|nie\s+wie)/i,
      /tylko\s+(mistrz|geniusz|znawca|ekspert)\s/i,
      /quiz/i,
    ],
    weight: 1,
  },
  {
    id: 'provocation',
    name: 'Prowokacja / wciąganie',
    decode: 'Pewnie nie znasz. I pewnie ci to nie przeszkadza.',
    patterns: [
      /z\s+pewnością\s+(go|ją|ich|je)\s+(znacie|pamiętacie|kojarzycie)/i,
      /na\s+pewno\s+(widziałeś|słyszałeś|znasz|pamiętasz)/i,
      /każdy\s+(to\s+)?zna/i,
      /kojarzy(sz|cie)\??/i,
      /pamiętasz\s+(go|ją|to|ten)/i,
    ],
    weight: 1,
  },
  {
    id: 'expressive_verbs',
    name: 'Ekspresyjne czasowniki',
    decode: 'Ktoś normalnie skomentował sytuację. Nic nadzwyczajnego.',
    patterns: [
      /nie\s+(kryje\s+emocji|dowierza|gryzł[aoy]?\s+się\s+w\s+język)/i,
      /ostro\s+(zareagował|skomentował|odpowiedział)/i,
      /jasno\s+(wyraził\s+się|powiedział|dał\s+do\s+zrozumienia)/i,
      /reaguj[eą]\s+na\s+(słowa|doniesienia|informacje|to)/i,
      /grozi\s+palcem/i,
      /trzęsie\s+rynkiem/i,
      /wskazał\s+(błędy|problemy)/i,
      /nie\s+przebierał[aoy]?\s+w\s+słowach/i,
    ],
    weight: 1,
  },
  {
    id: 'underpromise',
    name: 'Niedopowiedziana pointa',
    decode: 'Ukryty szczegół jest pewnie banalny. Gdyby nie był — napisaliby go w tytule.',
    patterns: [
      /prosty\s+(błąd|trik|sposób|powód)/i,
      /jeden\s+(szczegół|detal|element|powód|krok)/i,
      /drobny\s+(detal|szczegół)/i,
      /mały\s+(krok|ruch)/i,
      /zgubił\s+go/i,
      /na\s+co\s+je\s+stać/i,
      /pokazał[aoy],?\s+na\s+co/i,
      /udowodnił[aoy]/i,
      /dał[aoy]\s+do\s+myślenia/i,
    ],
    weight: 1,
  },
  {
    id: 'knowledge_question',
    name: 'Kwestionowanie wiedzy',
    decode: 'Znałeś. Albo nie potrzebujesz wiedzieć.',
    patterns: [
      /nie\s+(znałeś|wiedziałeś|spodziewałeś)/i,
      /większość\s+(ludzi|osób|polaków)\s+nie\s+wie/i,
      /wciąż\s+robisz\s+to\s+źle/i,
      /popełniasz\s+ten\s+błąd/i,
      /wiesz,?\s*(gdzie|co|jak|ile|dlaczego)/i,
    ],
    weight: 1,
  },
  {
    id: 'price_tease',
    name: 'Ukryta cena/kwota',
    decode: 'Kwota jest albo oczywista, albo nieciekawa.',
    patterns: [
      /kwota\s+\d-cyfrowa/i,
      /a\s+(cena|ile\s+kosztuje)\??/i,
      /miło\s+się\s+zaskoczysz/i,
      /tyle\s+(kosztuje|kosztowało|zapłacił|zapłaciła)/i,
      /za\s+grosze/i,
      /za\s+bezcen/i,
      /taniej\s+nawet\s+o/i,
    ],
    weight: 1,
  },
  {
    id: 'celebrity_peek',
    name: 'Celebryci jako przynęta',
    decode: 'Znana osoba zrobiła coś normalnego. News bo znana, nie bo coś się stało.',
    patterns: [
      /gwiazd[aąy]\s+(pokazała|zdradziła|zaskoczyła|wyznała)/i,
      /celebryt/i,
      /znana\s+(aktorka|piosenkarka|gwiazda|modelka|prezenterka)/i,
      /fotoreporter(zy)?\s+przyłapali/i,
      /paparazzi/i,
    ],
    weight: 1,
  },
  {
    id: 'caps_exclaim',
    name: 'KRZYK w tytule',
    decode: 'Caps lock i wykrzykniki zastępują brak treści.',
    patterns: [
      /[A-ZĄĆĘŁŃÓŚŹŻ]{10,}/,
      /!{2,}/,
      /\bMAMY\s+(ZŁOTO|MEDAL|MISTRZA)/i,
    ],
    weight: 1,
  },
];

// === ANALIZA TYTUŁU ===

function analyzeHeadline(text) {
  const matches = [];
  let totalScore = 0;

  for (const pattern of PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(text)) {
        matches.push(pattern);
        totalScore += pattern.weight;
        break;
      }
    }
  }

  return {
    score: Math.min(totalScore, 10),
    matches,
    isClickbait: totalScore >= 1,
  };
}

// === GENEROWANIE DEKODOWANIA (bezpieczne DOM) ===

function buildTooltipElement(analysis) {
  const tooltip = document.createElement('div');
  tooltip.className = 'cbd-tooltip';

  const scoreLabel =
    analysis.score <= 1
      ? 'Lekki clickbait'
      : analysis.score <= 3
        ? 'Solidny clickbait'
        : analysis.score <= 5
          ? 'Ciężki clickbait'
          : 'Clickbait atomowy';

  const header = document.createElement('div');
  header.className = 'cbd-tooltip-header';

  const labelSpan = document.createElement('span');
  labelSpan.className = 'cbd-score-label';
  labelSpan.textContent = scoreLabel;

  const numberSpan = document.createElement('span');
  numberSpan.className = 'cbd-score-number';
  numberSpan.textContent = `${analysis.score}/10`;

  header.appendChild(labelSpan);
  header.appendChild(numberSpan);
  tooltip.appendChild(header);

  const subtitle = document.createElement('div');
  subtitle.className = 'cbd-tooltip-subtitle';
  subtitle.textContent = 'Techniki manipulacji:';
  tooltip.appendChild(subtitle);

  const list = document.createElement('ul');
  list.className = 'cbd-tooltip-list';

  for (const match of analysis.matches) {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = match.name;
    li.appendChild(b);
    li.appendChild(document.createTextNode(': ' + match.decode));
    list.appendChild(li);
  }
  tooltip.appendChild(list);

  const footer = document.createElement('div');
  footer.className = 'cbd-tooltip-footer';
  footer.textContent =
    'Dekodowanie: odpowiedź jest prawdopodobnie bardziej banalna niż sugeruje tytuł.';
  tooltip.appendChild(footer);

  return tooltip;
}

// === DOM: DODAWANIE BADGE'Y ===

function createBadge(analysis) {
  const badge = document.createElement('span');
  badge.className = 'cbd-badge';

  if (analysis.score <= 1) {
    badge.classList.add('cbd-badge--low');
  } else if (analysis.score <= 3) {
    badge.classList.add('cbd-badge--medium');
  } else if (analysis.score <= 5) {
    badge.classList.add('cbd-badge--high');
  } else {
    badge.classList.add('cbd-badge--extreme');
  }

  badge.textContent = `CB ${analysis.score}`;
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
  ],
  'onet.pl': [
    'a[class*="sectionLink"]',
    'a[class*="smallCardLink"]',
    'a[class*="CardLink"]',
    'article a',
    'h2 a',
    'h3 a',
  ],
  'wp.pl': [
    'a[class*="teaserLink"]',
    'a[class*="sc-"]',
    'h2 a',
    'h3 a',
    'article a',
  ],
  'tvn24.pl': ['a[class*="link"]', 'h2 a', 'h3 a', 'article a'],
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

  let count = 0;

  for (const el of allElements) {
    if (el.querySelector('.cbd-badge')) continue;

    let text = el.textContent?.trim().replace(/\s+/g, ' ');
    if (!text || text.length < 20 || text.length > 250) continue;

    // Strip trailing category labels
    text = text.replace(
      /\s+(BIZNES|SPORT|KOBIETA|NEXT|MOTO|FILM|TENIS|PRENUMERATA|MATERIAŁ PROMOCYJNY|MOTO NEWS|OFERTY AVANTI24)$/i,
      ''
    );

    if (processed.has(text)) continue;
    if (el.closest('nav, footer, .menu, .sidebar-nav')) continue;
    // Skip short nav-like links
    if (text.length < 30 && !/[.!?""]/.test(text)) continue;

    processed.add(text);

    const analysis = analyzeHeadline(text);
    if (!analysis.isClickbait) continue;

    const badge = createBadge(analysis);
    const tooltip = buildTooltipElement(analysis);

    const wrapper = document.createElement('span');
    wrapper.className = 'cbd-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline';

    badge.addEventListener('mouseenter', () => {
      tooltip.classList.add('cbd-tooltip--visible');
    });

    badge.addEventListener('mouseleave', () => {
      tooltip.classList.remove('cbd-tooltip--visible');
    });

    wrapper.appendChild(badge);
    wrapper.appendChild(tooltip);

    el.insertBefore(wrapper, el.firstChild);
    count++;
  }

  console.log(
    `[Clickbait Dekoder] Przeskanowano ${processed.size} tytułów, oznaczono ${count} clickbaitów`
  );
}

// Uruchom po załadowaniu strony
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', processPage);
} else {
  processPage();
}

// Obserwuj dynamicznie ładowaną treść (infinite scroll)
const observer = new MutationObserver((mutations) => {
  let hasNewContent = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      hasNewContent = true;
      break;
    }
  }
  if (hasNewContent) {
    clearTimeout(observer._debounce);
    observer._debounce = setTimeout(processPage, 500);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
