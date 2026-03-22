/**
 * Clickbait Dekoder v3 — content script
 *
 * v3: Kontekstowe komentarze — każdy wykryty fragment dostaje
 *     spersonalizowany, złośliwy komentarz w stylu New Yorkera.
 *     Tooltip pokazuje DOKŁADNIE które słowo uruchomiło detekcję.
 */

// === GUARD AGAINST RE-ENTRY ===
let _isProcessing = false;

// === WZORCE CLICKBAITOWE ===
// Każdy regex ma swój `snark` — komentarz wyświetlany z wykrytym fragmentem.
// {0} w snark zostanie zastąpione dopasowanym fragmentem tekstu.

const PATTERNS = [
  {
    id: 'hidden_answer',
    name: 'Ukryta odpowiedź',
    weight: 2,
    rules: [
      { re: /oto,?\s*(co|jak|dlaczego|kto)\b/i, snark: '"{0}" — pewnie coś zupełnie zwyczajnego. "Oto" rzadko poprzedza rewolucję.' },
      { re: /sprawdź,?\s*(co|jak|dlaczego)/i, snark: '"{0}" — sprawdzili za ciebie. Odpowiedź: nic nadzwyczajnego.' },
      { re: /dowiedz się/i, snark: '"{0}" — dowiesz się, że nie warto było się dowiadywać.' },
      { re: /jest\s+(nagranie|wideo|film|zdjęcie)/i, snark: '"{0}" — nagranie istnieje. Sensacja? Zwykle nie.' },
      { re: /wiadomo/i, snark: '"{0}" — jeśli byłoby naprawdę ważne, napisaliby CO wiadomo.' },
      { re: /znamy\s+(szczegóły|powód|przyczynę)/i, snark: '"{0}" — gdyby szczegóły były ciekawe, byłyby w tytule.' },
      { re: /ujawniono/i, snark: '"{0}" — ujawniono coś, co prawdopodobnie i tak wszyscy wiedzieli.' },
      { re: /ujawni[ła]\s+(kulisy|szczegóły|prawdę)/i, snark: '"{0}" — za kulisami zwykle są kolejne kulisy, a za nimi — nuda.' },
      { re: /opublikował[aoy]?\s+(nagranie|zdjęci[ae]|wideo|film)/i, snark: '"{0}" — nagranie pewnie pokazuje dokładnie to, co sobie wyobrażasz.' },
      { re: /wyszł[aoey] na jaw/i, snark: '"{0}" — na jaw wyszło coś, co dało się przewidzieć.' },
      { re: /oto\s+prawda/i, snark: '"{0}" — prawda jest zwykle mniej ekscytująca niż tytuł.' },
      { re: /sekretn[yae]/i, snark: '"{0}" — sekret znany redakcji i 500 tysiącom czytelników.' },
      { re: /\b(jego|jej|ich|swój|swoje?go)\s+sekret\b/i, snark: '"{0}" — sekret tak intymny, że trafił do nagłówka tabloidowego portalu.' },
      { re: /\bznał[aoy]?\s+(jego|jej|ich)?\s*sekret/i, snark: '"{0}" — znała sekret, a teraz znają go wszyscy — łącznie z tobą, bez klikania.' },
      { re: /ta?jemnic[aąeę]/i, snark: '"{0}" — tajemnica tak dobrze strzeżona, że jest w nagłówku.' },
      { re: /co\s+(zrobił[aoy]?|powiedział[aoy]?|stało się)\s+potem/i, snark: '"{0}" — potem stało się coś zupełnie przewidywalnego.' },
      { re: /nie\s+uwierzysz/i, snark: '"{0}" — uwierzysz. I pożałujesz kliknięcia.' },
      { re: /nie\s+mog[ąa]\s+uwierzyć/i, snark: '"{0}" — mogą. Po prostu clickbait potrzebuje hiperbolii.' },
      { re: /to\s+nie\s+żart/i, snark: '"{0}" — skoro musisz zapewnić, że to nie żart, treść pewnie jest na granicy banalności.' },
      { re: /\btak\s+(wyglądaj[ąa]|wygląda)\b/i, snark: '"{0}" — wyglądają normalnie. Ale "wyglądają normalnie" nie generuje kliknięć.' },
      { re: /jak\s+(wtedy|kiedyś|dawniej)\s+wyglądał/i, snark: '"{0}" — wyglądali jak ludzie w danej epoce. Szok.' },
      { re: /(spójrzcie|patrzcie|zobaczcie),?\s+(jak|co|na)/i, snark: '"{0}" — spójrzcie: wygląda normalnie. Ale "wygląda normalnie" to nie nagłówek.' },
      { re: /policzyli\s+(ile|jak)/i, snark: '"{0}" — policzyli. Ale wynik jest zbyt nudny, żeby zmieścić się w tytule.' },
      { re: /wdarł[aoy]?\s+się/i, snark: '"{0}" — ktoś wszedł gdzieś, gdzie go nie zaproszono. To cała historia.' },
      { re: /wyjawił[aoy]?/i, snark: '"{0}" — wyjawił coś, co pewnie jest normalne. Gdyby było szokujące, napisaliby co.' },
      { re: /nie\s+(zgadniecie|zgadniesz)/i, snark: '"{0}" — zgadniesz. Albo ci będzie obojętne. W obu przypadkach — nie klikaj.' },
      { re: /kulisy\s+(rozwodu|afery|skandalu|sprawy|związku|rozstania|konfliktu)/i, snark: '"{0}" — za kulisami jest to samo co przed nimi, tylko bez makijażu.' },
      { re: /najnowsz[eay]\s+(wieści|informacj[eai])/i, snark: '"{0}" — gdyby wieści były dobre, napisaliby jakie. Ukryta wiadomość = brak wiadomości.' },
      { re: /(złe|koszmarne|fatalne|smutne|nowe)\s+wieści/i, snark: '"{0}" — jakie wieści? Tytuł nie mówi, bo wtedy nie klikniesz.' },
      { re: /\bostrzega\b/i, snark: '"{0}" — ostrzega przed czymś, co pewnie i tak wiesz. Gdyby było pilne, napisaliby przed czym.' },
      { re: /wyniki\s+(naszej\s+)?(sondy|ankiety|badania)/i, snark: '"{0}" — wynik ukryty w nagłówku = wynik banalny. Gdyby był szokujący, byłby w tytule.' },
      { re: /stanowczo\s+(zareagował[aoy]?|odpowiedział[aoy]?)/i, snark: '"{0}" — "stanowczo" = powiedział coś normalnego, ale głośniej.' },
      { re: /\b(hiszpanie|niemcy|anglicy|włosi|francuzi|ukraińcy|rosjanie|amerykanie|brytyjczycy|media)\s+pisz[ąa]\b/i, snark: '"{0}" — zagraniczne media piszą o wszystkim. Pytanie: co piszą? Tytuł tego nie zdradzi.' },
      { re: /jest\s+(nagranie|zdjęcie|wideo|film|dowód)/i, snark: '"{0}" — jest nagranie, ale nie pokażemy ci go w tytule. Musisz kliknąć. Sprytne, co?' },
      { re: /nikt\s+się\s+nie\s+spodziewał/i, snark: '"{0}" — spodziewali się. Po prostu nie tak bardzo, jak sugeruje nagłówek.' },
      { re: /nie\s+wyklucza/i, snark: '"{0}" — "nie wyklucza" = nie potwierdził, nie zaprzeczył, nie powiedział nic konkretnego.' },
      { re: /garść\s+(porad|uwag|wskazówek|tipów)/i, snark: '"{0}" — garść = 3-5 banalnych porad, które znasz.' },
    ],
  },
  {
    id: 'question_headline',
    name: 'Pytajnik w tytule (prawo Betteridge\'a)',
    weight: 1,
    rules: [
      {
        re: /\?/,
        // Skip: open Qs (kto/co/gdzie/kiedy/jak/ile/z kim — answer is never "no"),
        // conditional Qs ("Widzisz X?"), price Qs ("X zł?"), service Qs
        exclude: /\b(kto|co|gdzie|kiedy|jak|ile|jaki[me]?|któr[yae]|z\s+kim|czym|komu|dlaczego|skąd|dokąd)\b.*\?|o\s+której|transmisja|zł\s*\?|tys\.\s*zł/i,
        snark: '"{0}" — Prawo Betteridge\'a: jeśli nagłówek jest pytaniem, odpowiedź brzmi „nie".',
      },
    ],
  },
  {
    id: 'superlative',
    name: 'Superlativ / przesada',
    weight: 1,
    rules: [
      { re: /\bHIT\b/, snark: '"HIT" — w tłumaczeniu z clickbaitowego: "produkt, który istnieje".' },
      { re: /szok(ujące?|ował[aoy])?/i, snark: '"{0}" — w tłumaczeniu: "lekko zaskakujące, jeśli masz bardzo nudne życie".' },
      { re: /niesamowit[yae]/i, snark: '"{0}" — całkiem samowitne, gdy się okaże.' },
      { re: /niewiarygodne?/i, snark: '"{0}" — wiarygodne i raczej przyziemne.' },
      { re: /przełomow[yae]/i, snark: '"{0}" — przełom tak duży, że jutro nikt nie będzie pamiętał.' },
      { re: /rewolucyjn[yae]/i, snark: '"{0}" — rewolucyjne jak każda nowość, o której zapomnisz za tydzień.' },
      { re: /kosmiczn[yae]/i, snark: '"{0}" — na ziemi. Zdecydowanie na ziemi.' },
      { re: /brutaln[yae]/i, snark: '"{0}" — w clickbaicie "brutalne" oznacza "nieprzyjemne".' },
      { re: /skandaliczn[yae]/i, snark: '"{0}" — skandal tak duży, że zmieścił się w jednym kliknięciu.' },
      { re: /\bsensacj[aąęi]\b/i, snark: '"{0}" — gdyby to była prawdziwa sensacja, byłaby w nagłówku TVN24, nie w trzecim tytule na portalu.' },
      { re: /sensacyjn[yae]/i, snark: '"{0}" — sensacyjne dla redakcji. Dla czytelnika: normalne.' },
      { re: /fundamentaln[yae]/i, snark: '"{0}" — fundamentalna jak każda zmiana, o której zapomnisz za tydzień.' },
      { re: /wulgar[ny]/i, snark: '"{0}" — ktoś powiedział coś nieprzyjemnego. News o 11:00.' },
      { re: /dramatyczn[yae]/i, snark: '"{0}" — dramat w tym kontekście = ktoś się zdenerwował.' },
      { re: /nieludzk[ie]/i, snark: '"{0}" — ludzkie, po prostu nieprzyjemne.' },
      { re: /jak\s+marzenie/i, snark: '"{0}" — marzenie, z którego budzisz się po kliknięciu.' },
      { re: /bije\s+(na\s+głowę|konkurencję|rekordy)/i, snark: '"{0}" — nikogo nie bije. Sprzedaje się umiarkowanie.' },
      { re: /na\s+łopatki/i, snark: '"{0}" — łopatki nie ucierpiały.' },
      { re: /jak\s+nigdy/i, snark: '"{0}" — jak zawsze, tylko z wykrzyknikiem.' },
      { re: /miazga/i, snark: '"{0}" — w rzeczywistości: normalny wynik sportowy.' },
      { re: /masakra/i, snark: '"{0}" — nie dosłownie. Na szczęście.' },
      { re: /demolka/i, snark: '"{0}" — ktoś wygrał pewniej niż zwykle.' },
      { re: /kapitaln[yae]/i, snark: '"{0}" — w tłumaczeniu: "całkiem niezłe". W sporcie czasem pasuje, ale redakcja liczy, że klikniesz nie wiedząc, na co.' },
      { re: /rekordow[yae]/i, snark: '"{0}" — rekord, który przetrwa do następnego rekordu. W sporcie bywa prawdziwy — ale tytuł i tak ukrywa jaki.' },
      { re: /najlepsz[yae]/i, snark: '"{0}" — w sporcie pewnie prawda. Ale tytuł nie mówi w czym i o ile — bo wtedy nie klikniesz.' },
      { re: /najgorsz[yae]/i, snark: '"{0}" — najgorszy według kryteriów autora artykułu.' },
      { re: /największ[yae]/i, snark: '"{0}" — największy do następnego największego.' },
      { re: /pierwszy\s+raz/i, snark: '"{0}" — tak, kiedyś wszystko jest po raz pierwszy.' },
      { re: /rewolucj[aę]/i, snark: '"{0}" — rewolucja, po której nic się nie zmieni.' },
      { re: /obłędn[yae]/i, snark: '"{0}" — obłędne, czyli ładne. Ale "ładne" nie generuje kliknięć.' },
      { re: /zachwyca[jąe]?/i, snark: '"{0}" — zachwyca redakcję. Czytelnik oceni sam, jeśli kliknie.' },
      { re: /rozpal[ąi]\s+(zmysły|wyobraźnię)/i, snark: '"{0}" — zmysły zostaną nietknięte. To reklama, nie romans.' },
      { re: /niebywał[eayo]/i, snark: '"{0}" — bywałe. Po prostu rzadko opisywane.' },
      { re: /bez\s+precedensu/i, snark: '"{0}" — precedens pewnie istnieje, ale "z precedensem" to nie nagłówek.' },
      { re: /historyczn[yae]/i, snark: '"{0}" — historyczne jak każdy wtorek, jeśli wystarczająco się postarasz.' },
      { re: /katastrofaln[yae]/i, snark: '"{0}" — w clickbaicie katastrofa zaczyna się od 3% spadku.' },
      { re: /\bwstrząs(nęł[aoy]?|ając[yae])\b/i, snark: '"{0}" — wstrząśnięte zostały głównie klawisze redaktora.' },
      { re: /fataln[yae]/i, snark: '"{0}" — fatalne w nagłówku = złe w rzeczywistości. Ale "złe" nie klika się tak dobrze.' },
      { re: /koszmarny?[ae]?/i, snark: '"{0}" — koszmar to sen. Na jawie to "nieprzyjemne zdarzenie".' },
      { re: /niezwykł[yae]/i, snark: '"{0}" — zwykłe. Ale "zwykłe" nie przyciąga kliknięć.' },
      { re: /robi\s+wrażenie/i, snark: '"{0}" — robi wrażenie na redakcji. Czytelnik oceni sam — jeśli kliknie.' },
    ],
  },
  {
    id: 'shock_promise',
    name: 'Obietnica szoku',
    weight: 2,
    rules: [
      { re: /aż\s+się\s+(wierzyć\s+nie\s+chce|nie\s+chce\s+wierzyć)/i, snark: '"{0}" — chce się wierzyć. I uwierzysz. Bo treść jest normalna.' },
      { re: /trudno\s+uwierzyć/i, snark: '"{0}" — łatwo uwierzyć, bo to banał.' },
      { re: /nikt\s+się\s+nie\s+spodziewał/i, snark: '"{0}" — wielu się spodziewało. Redakcja po prostu liczy na twoją niewiedzę.' },
      { re: /tego\s+się\s+nie\s+spodziewał/i, snark: '"{0}" — spodziewał się. Każdy się spodziewał.' },
      { re: /nie\s+(do\s+wiary|do\s+uwierzenia)/i, snark: '"{0}" — jak najbardziej do wiary. Po prostu niezbyt ciekawe.' },
      { re: /nie\s+dowierza/i, snark: '"{0}" — dowierza, po prostu tak się mówi w nagłówkach.' },
      { re: /zaskakując[yae]\s+(wynik|zwrot|odkrycie|decyzja)/i, snark: '"{0}" — zaskakujące dla kogoś, kto nie śledził tematu.' },
    ],
  },
  {
    id: 'demonstrative',
    name: 'Zaimek wskazujący',
    weight: 2,
    rules: [
      { re: /\b(ten|ta|to|te)\s+(prosty|jeden|jedyny|nowy|niesamowity|szokujący|genialny)/i, snark: '"{0}" — gdyby trik był genialny, napisaliby jaki. Nie napisali.' },
      { re: /\bten\s+(trik|sposób|preparat|produkt|model|film|serial|artykuł|sprzęt|samochód|balsam|krem|serum|składnik|lek|suplement|napój)/i, snark: '"{0}" — "ten" zamiast nazwy = nazwa jest rozczarowująca.' },
      { re: /\bta\s+(metoda|dieta|sztuczka|marka|kobieta|gwiazda|herbata|roślina|sukienka)/i, snark: '"{0}" — "ta" zamiast nazwy, bo nazwa nie przyciągnęłaby kliknięcia.' },
      { re: /\bto\s+(urządzenie|zmieni|pomoże|sprawi|rozwiąże|uratuje|narzędzie|miejsce)/i, snark: '"{0}" — "to" zamiast nazwy. Gdyby nazwa robiła wrażenie, napisaliby ją.' },
      { re: /\bte\s+(kwietniki|buty|sukienki|spodnie|okulary|słuchawki|produkty)/i, snark: '"{0}" — "te" zamiast marki. Bo marka jest zbyt zwyczajna na nagłówek.' },
      { re: /tych\s+(aut|osób|ludzi|miast|telefonów)/i, snark: '"{0}" — "tych" to clickbaitowy odpowiednik mgły — kryje banalność.' },
    ],
  },
  {
    id: 'quote_bait',
    name: 'Wyrwany cytat',
    weight: 0, // Sam cudzysłów nie uruchamia badge'a — potrzebuje drugiego trafienia
    rules: [
      { re: /[""„""].{3,60}[""„""]/, snark: '{0} — brzmi dramatycznie wyrwane z kontekstu. W pełnej rozmowie to zdanie pewnie było o niczym.' },
    ],
  },
  {
    id: 'quote_amplifier',
    name: 'Cytat jako przynęta',
    weight: 1,
    rules: [
      { re: /przejmując[yae]\s+słow[aoy]/i, snark: '"{0}" — przejmujące dla redakcji. Dla czytelnika: normalna wypowiedź.' },
      { re: /mocne\s+słow[aoy]/i, snark: '"{0}" — mocne jak kawa rozpuszczalna. Nie espresso.' },
      { re: /gorzkie?\s+słow[aoy]/i, snark: '"{0}" — gorzkie, czyli ktoś powiedział coś krytycznego. Zdarza się.' },
      { re: /wyznał[aoy]?/i, snark: '"{0}" — wyznał coś, co wszyscy i tak wiedzieli.' },
      { re: /zdradził[aoy]?\s+(co|jak|że)/i, snark: '"{0}" — zdradził, ale tajemnicą poliszynela.' },
    ],
  },
  {
    id: 'serial_drama',
    name: 'Dramaturgia serialu',
    weight: 1,
    rules: [
      { re: /zaczęło się\s+(niewinnie|normalnie|zwyczajnie)/i, snark: '"{0}" — i pewnie tak się skończyło, tylko z większą liczbą kliknięć.' },
      { re: /\bale\s+potem\b/i, snark: '"{0}" — potem stało się coś przewidywalnego.' },
      { re: /nagły\s+(zwrot|koniec|finał)/i, snark: '"{0}" — tak nagły, że redakcja zdążyła napisać artykuł.' },
      { re: /\bnagle\s+(wyjawił|powiedział|zdradził|ogłosił|pokazał|zrobił|zmienił)/i, snark: '"{0}" — "nagle" to clickbaitowy adrenalina-booster. Pewnie planował to od tygodnia.' },
      { re: /piekło\s+trwało/i, snark: '"{0}" — w clickbaicie "piekło" = "nieprzyjemna sytuacja".' },
      { re: /dramat/i, snark: '"{0}" — dramat w nagłówku: ktoś miał ciężki dzień.' },
      { re: /są\s+konsekwencje/i, snark: '"{0}" — konsekwencje pewnie oznaczają: ktoś napisał oświadczenie.' },
      { re: /jest\s+(reakcja|odpowiedź|komentarz)/i, snark: '"{0}" — jest komentarz. Ktoś skomentował coś. To cała historia.' },
      { re: /to się działo/i, snark: '"{0}" — działo się to, co się zwykle dzieje.' },
      { re: /potem\s+było\s+(tylko\s+)?(gorzej|lepiej)/i, snark: '"{0}" — potem było tak, jak można było przewidzieć.' },
      { re: /wszystko\s+(jasne|się\s+wyjaśniło)/i, snark: '"{0}" — jasne było od początku, ale clickbait potrzebował napięcia.' },
      { re: /zapadł[aoy]\s+(cisza|milczenie)/i, snark: '"{0}" — cisza = nikt nic nie powiedział. Nagłówek z braku wiadomości.' },
      { re: /\bzniknął[aoy]?\b/i, snark: '"{0}" — spokojnie, nikt nie zniknął dosłownie. Pewnie nie strzelił gola albo wyszedł z kadru.' },
      { re: /niezręczn[aąeyo]\s+(sytuacj[aąęi]|moment)/i, snark: '"{0}" — "niezręcznie" = ktoś powiedział coś dziwnego. Publiczność przeżyła.' },
      { re: /mocny\s+(sygnał|przekaz|cios)/i, snark: '"{0}" — "mocny sygnał" bez treści = pusty sygnał. Gdyby był mocny, stałby w tytule.' },
      { re: /wydał[aoy]\s+się/i, snark: '"{0}" — wydało się coś, co pewnie i tak wszyscy podejrzewali.' },
      { re: /zawrzało/i, snark: '"{0}" — "zawrzało" w internecie = 20 osób napisało komentarze.' },
      { re: /bez\s+litości/i, snark: '"{0}" — z litością. Po prostu skrytykował. Ale "skrytykował" nie generuje klików.' },
      { re: /wydał[aoy]?\s+wyrok/i, snark: '"{0}" — "wydał wyrok" = powiedział swoją opinię. Nie był w todze.' },
      { re: /stracił[aoy]?\s+kontrolę/i, snark: '"{0}" — "stracił kontrolę" = wyraził emocje publicznie. W clickbaicie to wystarczy na nagłówek.' },
      { re: /odkrył[aoy]?\s+karty/i, snark: '"{0}" — karty odkryte, ale tytuł ich nie pokazuje. Musisz kliknąć.' },
      { re: /i\s+(się\s+)?zaczęło/i, snark: '"{0}" — niedokończone zdanie jako nagłówek. Klasyczny cliffhanger — bo samo zakończenie jest nudne.' },
      { re: /i\s+wtedy/i, snark: '"{0}" — "i wtedy" to clickbaitowy cliffhanger. Potem stało się coś zwyczajnego.' },
      { re: /oto\s+powód/i, snark: '"{0}" — powód jest banalny. Gdyby nie był, stałby w tytule.' },
    ],
  },
  {
    id: 'collective',
    name: '"Polacy oszaleli"',
    weight: 2,
    rules: [
      { re: /polacy\s+(oszaleli|nie\s+mogą|pokochali|wybierają|odkryli)/i, snark: '"{0}" — zamień na "kilka osób z Radomia przeczytało artykuł". Nadal chcesz kliknąć?' },
      { re: /internet\s+(oszalał|eksplodował|huczy)/i, snark: '"{0}" — internet sobie spokojnie istnieje. Trzy osoby coś udostępniły.' },
      { re: /wszyscy\s+(mówią|chcą|robią)/i, snark: '"{0}" — "wszyscy" = redakcja i troje znajomych autora.' },
      { re: /cała\s+(polska|europa|branża|sieć)/i, snark: '"{0}" — nie cała. Fragment. Mały fragment.' },
      { re: /robi\s+szał/i, snark: '"{0}" — szał w clickbaicie = umiarkowane zainteresowanie.' },
      { re: /bez\s+szans/i, snark: '"{0}" — z szansami. Po prostu mniejszymi.' },
      { re: /wściekli/i, snark: '"{0}" — zirytowani. Niekoniecznie wściekli.' },
      { re: /rzucili\s+się/i, snark: '"{0}" — "rzucili się" = kilka osób kupiło. Kartonami? Raczej sztukami.' },
      { re: /podzielił[aoy]?\s+\d/i, snark: '"{0}" — podzieliło, czyli jedni kliknęli A, drudzy B. To nie debata — to quiz.' },
    ],
  },
  {
    id: 'emotional_blackmail',
    name: 'Emocjonalny szantaż',
    weight: 2,
    rules: [
      { re: /pęknie\s+ci\s+serce/i, snark: '"{0}" — serce wytrzyma. Treść nie jest aż tak poruszająca.' },
      { re: /zatkało/i, snark: '"{0}" — nikogo nie zatkało. Może lekko zdziwił.' },
      { re: /łz[yaomie]/i, snark: '"{0}" — łzy co najwyżej ze znudzenia po kliknięciu.' },
      { re: /ciarki/i, snark: '"{0}" — ciarki od przeciągu, nie od treści.' },
      { re: /wzrusz/i, snark: '"{0}" — wzruszy cię bardziej rachunek za prąd.' },
      { re: /przejmując[yae]/i, snark: '"{0}" — przejmujące dla redakcji szukającej klików.' },
    ],
  },
  {
    id: 'challenge',
    name: 'Wyzwanie / rywalizacja',
    weight: 1,
    rules: [
      { re: /a\s+ty\s+(na\s+ile|ile|jak|co)\s/i, snark: '"{0}" — nie, nie musisz udowadniać niczego portalowi informacyjnemu.' },
      { re: /a\s+ty\??$/i, snark: '"{0}" — "a ty?" to clickbaitowy ekwiwalent łapania za rękaw.' },
      { re: /większość\s+(odpada|nie\s+zdaje|nie\s+wie)/i, snark: '"{0}" — większość nie odpada. Quiz jest łatwy. Ale klikniesz, żeby to udowodnić.' },
      { re: /tylko\s+(mistrz|geniusz|znawca|ekspert)\s/i, snark: '"{0}" — nie tylko mistrz. Każdy, kto umie czytać.' },
      { re: /quiz/i, snark: '"Quiz" — mechanizm gamifikacji. Odpowiesz na 10 pytań, obejrzysz 10 reklam.' },
    ],
  },
  {
    id: 'provocation',
    name: 'Prowokacja / wciąganie',
    weight: 1,
    rules: [
      { re: /z\s+pewnością\s+(go|ją|ich|je)\s+(znacie|pamiętacie|kojarzycie)/i, snark: '"{0}" — nie znasz. I nie musisz. Ale clickbait liczy na twoje ego.' },
      { re: /na\s+pewno\s+(widziałeś|słyszałeś|znasz|pamiętasz)/i, snark: '"{0}" — na pewno nie pamiętasz. I to w porządku.' },
      { re: /pamiętasz\s+(go|ją|to|ten)/i, snark: '"{0}" — nie pamiętasz. Clickbait liczy na twoje poczucie winy.' },
    ],
  },
  {
    id: 'expressive_verbs',
    name: 'Ekspresyjne czasowniki',
    weight: 1,
    rules: [
      { re: /nie\s+(kryje\s+(emocji|wściekłości|radości|złości|frustracji|łez|rozczarowania|oburzenia)|dowierza|gryzł[aoy]?\s+się\s+w\s+język)/i, snark: '"{0}" — kryje. Wszystko jest pod kontrolą. Po prostu skomentował.' },
      { re: /mówi\s+wprost/i, snark: '"{0}" — "mówi wprost" = powiedział to, co każdy mówi. Ale "wprost" brzmi odważnie.' },
      { re: /zabrał[aoy]?\s+głos/i, snark: '"{0}" — zabrał głos, czyli skomentował. Jak codziennie. Ale "zabrał głos" brzmi jak wystąpienie historyczne.' },
      { re: /ostro\s+(zareagował|skomentował|odpowiedział)/i, snark: '"{0}" — "ostro" w nagłówku = powiedział coś krytycznego normalnym tonem.' },
      { re: /jasno\s+(wyraził\s+się|powiedział|dał\s+do\s+zrozumienia)/i, snark: '"{0}" — jasno, czyli powiedział to, co myślał. Jak każdy dorosły człowiek.' },
      { re: /reaguj[eą]\s+na\s+(słowa|doniesienia|informacje|to)/i, snark: '"{0}" — zareagował. Czyli skomentował. Jak codziennie.' },
      { re: /grozi\s+palcem/i, snark: '"{0}" — grozi palcem = wydał oświadczenie prasowe.' },
      { re: /trzęsie\s+rynkiem/i, snark: '"{0}" — rynek nawet nie drgnął.' },
      { re: /wskazał\s+(błędy|problemy)/i, snark: '"{0}" — wskazał, czyli powiedział co mu się nie podoba. Normalka.' },
      { re: /nie\s+przebierał[aoy]?\s+w\s+słowach/i, snark: '"{0}" — przebierał. Ale jednym nieparlamentarnym.' },
    ],
  },
  {
    id: 'underpromise',
    name: 'Niedopowiedziana pointa',
    weight: 1,
    rules: [
      { re: /prosty\s+(błąd|trik|sposób|powód)/i, snark: '"{0}" — jeśli jest tak prosty, czemu nie jest w tytule? Bo nie jest ciekawy.' },
      { re: /jeden\s+(szczegół|detal|element|powód|krok)/i, snark: '"{0}" — jeden szczegół, który nie zmieścił się w tytule, bo jest banalny.' },
      { re: /na\s+co\s+(je|go|ją|ich)\s+stać/i, snark: '"{0}" — stać ich na normalne rzeczy. Ale clickbait potrzebuje tajemnicy.' },
      { re: /pokazał[aoy],?\s+na\s+co/i, snark: '"{0}" — pokazali to, co zwykle pokazują w swojej pracy.' },
      { re: /dał[aoy]\s+do\s+myślenia/i, snark: '"{0}" — dał do myślenia redakcji, że warto napisać clickbait.' },
      { re: /zgubił[aoy]?\s+go/i, snark: '"{0}" — gubił go szczegół tak prosty, że nie wart artykułu.' },
    ],
  },
  {
    id: 'knowledge_question',
    name: 'Kwestionowanie wiedzy',
    weight: 1,
    rules: [
      { re: /nie\s+(znałeś|wiedziałeś|spodziewałeś)/i, snark: '"{0}" — znałeś. Albo nie potrzebujesz wiedzieć. W obu przypadkach — nie klikaj.' },
      { re: /większość\s+(ludzi|osób|polaków)\s+nie\s+wie/i, snark: '"{0}" — większość wie. Ale clickbait liczy, że czujesz się wyjątkowy.' },
      { re: /mało\s+kto\s+(zna|wie|pamięta|słyszał)/i, snark: '"{0}" — mało kto, czyli więcej osób niż myślisz. Ale "wielu zna" to nie nagłówek.' },
      { re: /wiesz,?\s*(gdzie|co|jak|ile|dlaczego)/i, snark: '"{0}" — tak, wiesz. Albo nie, i nadal przeżyjesz.' },
    ],
  },
  {
    id: 'price_tease',
    name: 'Ukryta cena/kwota',
    weight: 1,
    rules: [
      { re: /kwota\s+\d-cyfrowa/i, snark: '"{0}" — gdyby kwota była szokująca, podaliby ją. Nie podali, bo nie jest.' },
      { re: /a\s+(cena|ile\s+kosztuje)\??/i, snark: '"{0}" — cena jest normalna. Gdyby nie była, byłaby w tytule.' },
      { re: /miło\s+się\s+zaskoczysz/i, snark: '"{0}" — nie zaskoczysz się. Cena jest taka jak w każdym sklepie.' },
      { re: /tyle\s+(kosztuje|kosztowało|zapłacił|zapłaciła|otrzymuj[eą]|zarabia|dostaj[eą]|wynosi)/i, snark: '"{0}" — tyle, ile można było przewidzieć.' },
      { re: /nawet\s+\d+%\s+taniej/i, snark: '"{0}" — "nawet" oznacza, że większość produktów jest taniej o 3%.' },
      { re: /za\s+grosze/i, snark: '"{0}" — za normalne pieniądze. Ale "za normalne pieniądze" to nie nagłówek.' },
      { re: /w\s+świetnych\s+cenach/i, snark: '"{0}" — ceny są normalne. "Świetne" robi za clickbait.' },
      { re: /czyści\s+magazyny/i, snark: '"{0}" — wyprzedają niesprzedane zapasy. To nie okazja — to logistyka.' },
    ],
  },
  {
    id: 'native_ad',
    name: 'Reklama natywna',
    weight: 1,
    rules: [
      { re: /sprawdzą\s+się/i, snark: '"{0}" — sprawdzą się = istnieją i działają. Ale to nie jest news.' },
      { re: /chronią\s+przed/i, snark: '"{0}" — tak, kurtka chroni przed wiatrem. To jej funkcja, nie sensacja.' },
      { re: /wygodne\s+jak\s+(kapcie|chmura|marzenie)/i, snark: '"{0}" — wygodne jak buty. Bo to są buty.' },
      { re: /koniec\s+z\s+/i, snark: '"{0}" — koniec z problemem, który nie jest aż tak wielki.' },
      { re: /załatwi[łl]?\s+(problem|sprawę|temat)/i, snark: '"{0}" — załatwił problem, którego nie miałeś, dopóki nie przeczytałeś tego tytułu.' },
      { re: /polskiej\s+(marki|sieciówki|firmy)/i, snark: '"{0}" — "polskiej marki" brzmi patriotycznie. Produkt jest normalny.' },
      { re: /skradnie\s+(serce|uwagę)/i, snark: '"{0}" — serce i uwaga zostaną na miejscu.' },
    ],
  },
  {
    id: 'celebrity_peek',
    name: 'Celebryci jako przynęta',
    weight: 1,
    rules: [
      { re: /gwiazd[aąy]\s+(pokazała|zdradziła|zaskoczyła|wyznała)/i, snark: '"{0}" — gwiazda zrobiła coś normalnego. News, bo znana.' },
      { re: /celebryt/i, snark: '"{0}" — celebryta w nagłówku = brak prawdziwego newsa.' },
    ],
  },
  {
    id: 'caps_exclaim',
    name: 'KRZYK w tytule',
    weight: 1,
    rules: [
      { re: /[A-ZĄĆĘŁŃÓŚŹŻ]{10,}/, snark: 'CAPS LOCK w tytule — krzyk zastępuje treść. Im głośniej tytuł krzyczy, tym ciszej jest w artykule.' },
      { re: /!{2,}/, snark: 'Podwójne wykrzykniki!! — jeden nie wystarczył, bo treść nie jest wystarczająco ekscytująca.' },
      { re: /\bMAMY\s+(ZŁOTO|MEDAL|MISTRZA)/i, snark: '"{0}" — entuzjazm caps-lockiem. Informacja zmieściłaby się w jednym zdaniu bez wykrzykników.' },
    ],
  },
];

// === ANALIZA TYTUŁU ===

function analyzeHeadline(text) {
  const matches = [];
  let totalScore = 0;

  for (const pattern of PATTERNS) {
    for (const rule of pattern.rules) {
      const match = text.match(rule.re);
      if (match && !(rule.exclude && rule.exclude.test(text))) {
        const matchedText = match[0];
        const snark = rule.snark.replace('{0}', matchedText);
        matches.push({
          name: pattern.name,
          snark,
          matchedText,
        });
        totalScore += pattern.weight;
        break; // One match per category
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

  const list = document.createElement('ul');
  list.className = 'cbd-tooltip-list';

  for (const match of analysis.matches) {
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
    (a, b) => (a.textContent?.length || 0) - (b.textContent?.length || 0)
  );

  let count = 0;

  for (const el of sortedElements) {
    if (el.querySelector('.cbd-badge')) continue;
    // Skip WP navigation tiles, ads, and section headers
    if (el.closest('[class*="header-services"], [class*="header-tile"]')) continue;

    let text = el.textContent?.trim().replace(/\s+/g, ' ');
    if (!text || text.length < 20 || text.length > 250) continue;
    // Skip WP internal promos and section navigation
    if (/^(REKLAMA|HOROSKOPY|PROGRAM TV|POGODA)\b/i.test(text)) continue;

    // Strip leading/trailing labels (PREMIUM, PILNE, category tags, author names)
    text = text.replace(/^(PREMIUM|PILNE|NOWE|NA ŻYWO|TYLKO U NAS|WASZ GŁOS|OPINIA|WYWIAD|KOMENTARZ|WYBORCZA\.PL)\s*/i, '');
    // Strip author names appended by WP/Onet (e.g. "...tekst Jakub Balcerski")
    text = text.replace(/\s+(Obserwuj|Obserwuj autorów).*$/i, '');
    text = text.replace(/\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+\s+[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+([-][A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]+)?$/,'');
    text = text.replace(
      /\s+(BIZNES|SPORT|KOBIETA|NEXT|MOTO|FILM|TENIS|PRENUMERATA|MATERIAŁ PROMOCYJNY|MOTO NEWS|OFERTY AVANTI24|OFERTY CZTERY KĄTY|LEKKOATLETYKA|SKOKI NARCIARSKIE|PIŁKA NOŻNA)$/i,
      ''
    );

    if (processed.has(text)) continue;
    if (el.closest('nav, footer, .menu, .sidebar-nav')) continue;
    if (text.length < 30 && !/[.!?""]/.test(text)) continue;
    // Skip subscription/promo banners — not articles
    if (/oferta\s+prenumerat|prenumerata\s+cyfrowa|sprawdź\s+ofertę|kup\s+teraz/i.test(text)) continue;

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

    // Always insert inside element (firstChild) so querySelector('.cbd-badge')
    // can detect it on re-runs and skip. Use position:absolute to escape overflow:hidden.
    const elPosition = window.getComputedStyle(el).position;
    if (elPosition === 'static') {
      el.style.position = 'relative';
    }
    wrapper.style.position = 'absolute';
    wrapper.style.top = '-8px';
    wrapper.style.left = '-4px';
    wrapper.style.display = 'inline-block';
    wrapper.style.zIndex = '10000';
    el.insertBefore(wrapper, el.firstChild);
    count++;
  }

  // Count ALL badges on page (not just this run — MutationObserver re-runs skip already-badged)
  const totalBadges = document.querySelectorAll('.cbd-badge').length;
  const totalScanned = Math.max(processed.size, totalBadges);

  console.log(
    `[Clickbait Dekoder] Przeskanowano ${totalScanned} tytułów, oznaczono ${totalBadges} clickbaitów (ten przebieg: +${count})`
  );

  // === FLOATING SCOREBOARD ===
  updateScoreboard(totalScanned, totalBadges);
  _isProcessing = false;
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
  }
  document.getElementById('cbd-sb-detected').textContent = detected;
  document.getElementById('cbd-sb-scanned').textContent = scanned;
  const pct = scanned > 0 ? Math.round((detected / scanned) * 100) : 0;
  document.getElementById('cbd-sb-pct').textContent = pct > 0
    ? `${pct}% tytułów to clickbait`
    : 'Czysto — brak clickbaitu';
}

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
