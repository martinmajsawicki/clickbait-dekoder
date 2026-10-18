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

NIE karzesz za: kreatywny żywy język, jeśli informacja jest w tytule; emocję adekwatną do skali zdarzenia; pytania analityczne; reklamy (inny gatunek — cb: 0).

WAŻNE: Uwzględniasz profil portalu. Tabloid zaczynasz z domniemaniem clickbaitu. Dziennik opiniotwórczy — z domniemaniem uczciwości. Oceniasz probabilistycznie (0-100). Mierzysz EFEKT na czytelnika, nie zamiar autora.

--- SYGNAŁY REGEXOWE ---
Przy każdym tytule dostajesz listę "wykrytych sygnałów" z detektora regexowego. To MATERIAŁ DOWODOWY DO WERYFIKACJI, nie wyrok. Detektor ma ~0% false-positive, ale niski recall: gdy coś wykrył, prawdopodobnie ma rację co do TECHNIKI, ale może źle ocenić jej SIŁĘ w kontekście. Twoje zadania:
- POTWIERDŹ lub ODRZUĆ każdy sygnał (sygnał bywa fałszywy w kontekście portalu/sekcji).
- SKALIBRUJ wynik cb z uwzględnieniem profilu portalu.
- DODAJ filary, których regex nie złapał.
- ZŁAP false-negatives: tytuły z adnotacją "brak sygnału" też oceniaj od zera.
Masz pełne prawo zignorować sygnał, jeśli kontekst go unieważnia.`;

  // Buduje prompt batcha. items: [{ nr, title, signals:[{t,frag}] }]
  function buildBatchPrompt(items, host, section) {
    const profile = getProfile(host);
    const lines = items
      .map((it) => {
        const ev =
          it.signals && it.signals.length
            ? it.signals.map((s) => `      - [${s.t}] fragment: "${s.frag}"`).join('\n')
            : '      - brak sygnału — kandydat na false-negative, oceń od zera';
        return `${it.nr}. "${it.title}"\n   Wykryte sygnały (do weryfikacji):\n${ev}`;
      })
      .join('\n');

    return `PORTAL: ${host}
PROFIL: ${profile.note}
BASELINE CB: ~${profile.baseline}%
SEKCJA: ${section || 'nieznana'}

Oceń poniższe tytuły. Dla KAŻDEGO zwróć obiekt JSON:
{ "nr": N, "cb": 0-100, "filary": [], "powod": "1 zdanie", "snark": "1 zdanie złośliwe w stylu New Yorkera albo null" }

ZASADY:
- cb 0-25 = nie CB, 26-50 = graniczny, 51-100 = CB
- filary: tablica numerów [1-4]; 1=ukrywa, 2=wyolbrzymia, 3=emocja, 4=fałszywa narracja; [] gdy nie CB
- reklamy → cb: 0
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
