/**
 * Clickbait Dekoder — prompt sędziego + budowanie/parsowanie batcha.
 *
 * Port JUDGE_SYSTEM_PROMPT i parsera z audit-tool/audit.js, rozszerzony o sekcję
 * traktującą sygnały regexowe jako MATERIAŁ DOWODOWY (nie wyrok). Ładowany w SW.
 *
 * Nie dotyka window/document. Eksport:
 *   globalThis.CBD.prompt = { JUDGE_SYSTEM_PROMPT, buildBatchPrompt, parseBatchResponse }
 */

(function (root) {
  const CBD = (root.CBD = root.CBD || {});
  const getProfile = CBD.profiles ? CBD.profiles.getProfile : () => ({ baseline: 40, note: 'Nieznany portal.' });

  // Opisy kategorii regexu (z AUDIT.md, sekcja 1). Wagi i filary bierzemy z cbd-patterns.js,
  // żeby katalog w prompcie nie rozjechał się z detektorem.
  const DESCRIPTIONS = {
    hidden_answer: 'Tytuł obiecuje odpowiedź, ale jej nie podaje — zmuszając do kliknięcia.',
    question_headline: 'Prawo Betteridge\'a: jeśli nagłówek jest pytaniem, odpowiedź brzmi "nie".',
    superlative: 'Inflacja przymiotników.',
    shock_promise: 'Tytuł zapowiada, że czytelnik dozna wstrząsu emocjonalnego.',
    demonstrative: '"Ten", "ta", "to" zamiast nazwy — bo nazwa rozczarowuje.',
    quote_bait: 'Sam cudzysłów nie wystarcza — potrzebuje drugiego trafienia z innej kategorii.',
    quote_amplifier: 'Słowa wzmacniające znaczenie cytatu.',
    serial_drama: 'Struktura narracyjna rodem z serialu — cliffhangery, napięcie, niedokończone wątki.',
    collective: 'Fałszywa zbiorowość — kilka osób staje się "całą Polską".',
    emotional_blackmail: 'Tytuł manipuluje emocjami czytelnika.',
    challenge: 'Portal prowokuje czytelnika do udowodnienia swojej wiedzy.',
    provocation: 'Clickbait gra na poczuciu winy lub ego czytelnika.',
    expressive_verbs: 'Pompowanie zwyczajnych czynności ekspresyjnymi czasownikami.',
    underpromise: 'Tytuł sugeruje puentę, ale jej nie podaje.',
    knowledge_question: 'Clickbait sugeruje, że czytelnik czegoś nie wie.',
    price_tease: 'Kwota jest ukryta w tytule, żeby wymusić kliknięcie.',
    native_ad: 'Artykuł sponsorowany ukryty pod nagłówkiem redakcyjnym.',
    celebrity_peek: 'Znana osoba przyciąga kliknięcia samym istnieniem.',
    caps_exclaim: 'Caps lock i wykrzykniki zastępują treść.',
    cliffhanger: 'Wielokropek, "stało się", "to mało powiedziane".',
    idiom_bait: '"Zapaliła się lampka", "szczęka opadła", "krew zagotowała".',
  };

  // Siła sygnału z wagi wzorca (legenda z AUDIT.md).
  const STRENGTH = { 2: 'silny', 1: 'lekki', 0: 'wspierający' };
  const PATTERNS = CBD.patterns ? CBD.patterns.PATTERNS : [];
  const PILLARS = CBD.patterns ? CBD.patterns.CATEGORY_PILLARS : {};
  const byName = new Map(PATTERNS.map((p) => [p.name, p]));

  function strengthOf(name) {
    const p = byName.get(name);
    return p ? STRENGTH[p.weight] || 'lekki' : null;
  }

  const CATALOG = PATTERNS.map((p) => {
    const pillars = (PILLARS[p.id] || []).join(', ');
    const meta = [pillars ? `filar ${pillars}` : 'reklama', STRENGTH[p.weight] || 'lekki'].join(', ');
    return `- ${p.name} (${meta}): ${DESCRIPTIONS[p.id] || ''}`.trimEnd();
  }).join('\n');

  // Persona redaktora (port audit.js:191-219) + sekcja o sygnałach regexowych.
  const JUDGE_SYSTEM_PROMPT = `Jesteś doświadczonym redaktorem naczelnym z 25-letnim stażem w polskich mediach. Widziałeś tysiące nagłówków i znasz kuchnię od środka.

Twój profil psychologiczny: wysoka sumienność (6/6), niska ugodowość (2/6), niska neurotyczność (1/6), otwartość na doświadczenia (5/6), niska ekstrawersja (2/6). Systematycznie sprawdzasz każdy tytuł. Nie szukasz kompromisu — jeśli tytuł jest clickbaitem, mówisz to. Nie reagujesz emocjonalnie na sensacyjny język — widzisz technikę, nie treść.

Oceniasz tytuły przez 4 filary clickbaitu:
1. UKRYWA INFORMACJĘ — celowo nie podaje kluczowego faktu, dając dość kontekstu by wywołać dyskomfort luki informacyjnej
2. WYOLBRZYMIA — język silniejszy niż fakty uzasadniają
3. ZASTĘPUJE FAKT EMOCJĄ — mówi JAK reagować zamiast CO się stało
4. KONSTRUUJE FAŁSZYWĄ NARRACJĘ — tworzy fabułę (konflikt, punkt kulminacyjny) tam, gdzie jest zwykłe zdarzenie

3 testy graniczne:
- UCZCIWOŚĆ: Czy czytelnik po samym tytule jest uczciwie poinformowany?
- SPEŁNIENIE: Czy artykuł prawdopodobnie pokryje obietnicę tytułu?
- SZACUNEK: Czy tytuł traktuje czytelnika jak inteligentną osobę?

NIE karzesz za: kreatywny żywy język, jeśli informacja jest w tytule; emocję adekwatną do skali zdarzenia; pytania analityczne.

WAŻNE: Profil portalu to tło: każdy tytuł oceniasz po jego treści, także na tabloidzie. Oceniasz probabilistycznie (0-100). Mierzysz EFEKT na czytelnika, nie zamiar autora.

--- SYGNAŁY REGEXOWE ---
Przy każdym tytule dostajesz listę "wykrytych sygnałów" z detektora regexowego. To MATERIAŁ DOWODOWY DO WERYFIKACJI, nie wyrok. Detektor wykrywa słowa i konstrukcje, a nie mechanizm, więc myli się w obie strony: bywa, że wskazuje technikę, a tytuł mimo to uczciwie informuje. Twoje zadania:
- POTWIERDŹ lub ODRZUĆ każdy sygnał (sygnał bywa fałszywy w kontekście portalu/sekcji).
- SKALIBRUJ wynik cb z uwzględnieniem profilu portalu.
- DODAJ filary, których regex nie złapał.
- ZŁAP false-negatives: tytuły z adnotacją "brak sygnału" też oceniaj od zera.
Masz pełne prawo zignorować sygnał, jeśli kontekst go unieważnia.

--- ZASADY REDAKCJI (decyzje redaktora prowadzącego) ---
- Quizy nie są clickbaitami.
- Jeśli jest brak informacji o czym to, to raczej clickbait.
- Jeśli silne emocje zamiast treści, to na pewno clickbait. Emocjonalny temat podany z faktami (kto, co, ile) to informacja.
- Pytanie oceniasz po informacji, nie po formie: "Sochan wyleci z NBA?" jest jasne; "Trump przesadził?" (nie wiadomo, w czym) i "Czego naprawdę boimy się w wiatrakach?" (nie mówią, czego) to clickbait.
- Niedopowiedzenie udające ważniejszy temat to clickbait (np. kwoty bez nazwy towaru, sugerujące ceny paliwa).
- Szczucie chorobą to clickbait.
- Paradoks ujawnia pointę, clickbait ją ukrywa.
- Konkretna liczba jest faktem, nie manipulacją.
- Narracja sportowa to relacja, nie manipulacja; "miażdży rywali" bez wyniku ukrywa informację.
- "Znany" bez nazwiska to zawsze clickbait.
- Materiał promocyjny oceniasz jak każdy tytuł.

Siła sygnału (z wagi wzorca w detektorze):
- silny — sam wystarczy na oznaczenie
- lekki — w kombinacji z innymi daje wyższy wynik; sam nie przesądza
- wspierający — sam nie wystarcza, potrzebuje drugiego trafienia z innej kategorii

--- KATALOG TECHNIK DETEKTORA ---
Nazwa techniki (filar, siła): co oznacza.
${CATALOG}`;

  // Buduje prompt batcha. items: [{ nr, title, signals:[{t,frag}] }]
  function buildBatchPrompt(items, host, section) {
    const profile = getProfile(host);
    const lines = items
      .map((it) => {
        const ev =
          it.signals && it.signals.length
            ? it.signals
                .map((s) => {
                  const strength = strengthOf(s.t);
                  return `      - [${s.t}${strength ? ' · ' + strength : ''}] fragment: "${s.frag}"`;
                })
                .join('\n')
            : '      - brak sygnału — kandydat na false-negative, oceń od zera';
        return `${it.nr}. "${it.title}"\n   Wykryte sygnały (do weryfikacji):\n${ev}`;
      })
      .join('\n');

    return `PORTAL: ${host}
PROFIL: ${profile.note}
SEKCJA: ${section || 'nieznana'}

Oceń poniższe tytuły. Dla KAŻDEGO zwróć obiekt JSON:
{ "nr": N, "cb": 0-100, "filary": [], "powod": "1 zdanie", "snark": "1 zdanie złośliwe w stylu New Yorkera albo null" }

ZASADY:
- cb 0-25 = nie CB, 26-50 = graniczny, 51-100 = CB
- filary: tablica numerów [1-4]; 1=ukrywa, 2=wyolbrzymia, 3=emocja, 4=fałszywa narracja; [] gdy nie CB
- snark: opisuje TECHNIKĘ manipulacji, nie treść; null gdy cb < 26

Odpowiedz TYLKO tablicą JSON, bez komentarzy.

Tytuły:
${lines}`;
  }

  // Parsowanie odpowiedzi modelu (port fallbacku z audit.js:501-525).
  function parseBatchResponse(raw) {
    if (!raw) return [];
    let cleaned = String(raw).replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (_) {}
    }
    return [];
  }

  CBD.prompt = { JUDGE_SYSTEM_PROMPT, buildBatchPrompt, parseBatchResponse };
})(typeof globalThis !== 'undefined' ? globalThis : self);
