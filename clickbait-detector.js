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
      { re: /ta?jemnic[aąeęzy]/i, snark: '"{0}" — tajemnica tak dobrze strzeżona, że jest w nagłówku.' },
      { re: /takie\s+są\s+(jej|jego|ich)\s+(warunki|zasady|wymagania)/i, snark: '"{0}" — jakie warunki? Tytuł nie zdradza, bo wtedy nie klikniesz.' },
      { re: /co\s+(zrobił[aoy]?|powiedział[aoy]?|stało się)\s+potem/i, snark: '"{0}" — potem stało się coś zupełnie przewidywalnego.' },
      { re: /nie\s+uwierzysz/i, snark: '"{0}" — uwierzysz. I pożałujesz kliknięcia.' },
      { re: /będziecie\s+(zdziwieni|zaskoczeni|w\s+szoku|pod\s+wrażeniem)/i, snark: '"{0}" — nie będziecie. Ale redakcja liczy, że klikniecie żeby sprawdzić.' },
      { re: /nie\s+(widzieliście|widziałeś|widziałaś)/i, snark: '"{0}" — widzieliście. Albo jest normalnie. Ale "normalnie" nie generuje klików.' },
      { re: /nie\s+mog[ąa]\s+uwierzyć/i, snark: '"{0}" — mogą. Po prostu clickbait potrzebuje hiperbolii.' },
      { re: /to\s+nie\s+żart/i, snark: '"{0}" — skoro musisz zapewnić, że to nie żart, treść pewnie jest na granicy banalności.' },
      { re: /\btak\s+(dziś\s+)?(wyglądaj[ąa]|wygląda)/i, snark: '"{0}" — wyglądają normalnie. Ale "wyglądają normalnie" nie generuje kliknięć.' },
      { re: /\btak\s+(zdobył|zrobiła?|osiągnął|wygrał|zarobił)/i, snark: '"{0}" — JAK? Tytuł nie mówi. Technika: ukryj metodę, sprzedaj obietnicę.' },
      { re: /wiele\s+mówi\s+o/i, snark: '"{0}" — "wiele mówi" = redakcja sugeruje głębsze znaczenie. Artykuł powie: nic szczególnego.' },
      { re: /mówi[ąa]\s+sam[eay]\s+za\s+siebie/i, snark: '"{0}" — "mówią same za siebie" = redakcja chce żebyś kliknął i sam ocenił. Clickbait-outsourcing.' },
      { re: /jak\s+(wtedy|kiedyś|dawniej)\s+wyglądał/i, snark: '"{0}" — wyglądali jak ludzie w danej epoce. Szok.' },
      { re: /(spójrzcie|patrzcie|zobaczcie),?\s+(jak|co|na)/i, snark: '"{0}" — spójrzcie: wygląda normalnie. Ale "wygląda normalnie" to nie nagłówek.' },
      { re: /policzyli\s+(ile|jak)/i, snark: '"{0}" — policzyli. Ale wynik jest zbyt nudny, żeby zmieścić się w tytule.' },
      { re: /wdarł[aoy]?\s+się/i, snark: '"{0}" — ktoś wszedł gdzieś, gdzie go nie zaproszono. To cała historia.' },
      { re: /wyjawił[aoy]?/i, snark: '"{0}" — wyjawił coś, co pewnie jest normalne. Gdyby było szokujące, napisaliby co.' },
      { re: /nie\s+(zgadniecie|zgadniesz)/i, snark: '"{0}" — zgadniesz. Albo ci będzie obojętne. W obu przypadkach — nie klikaj.' },
      { re: /kulisy\s+(rozwodu|afery|skandalu|sprawy|związku|rozstania|konfliktu)/i, snark: '"{0}" — za kulisami jest to samo co przed nimi, tylko bez makijażu.' },
      { re: /zdradza\s+kulisy/i, snark: '"{0}" — zdradza kulisy = mówi to, co i tak wiadomo, ale z dramatyczną miną.' },
      { re: /nie\s+ma\s+(już\s+)?(złudzeń|wątpliwości)/i, snark: '"{0}" — złudzenia istniały głównie w nagłówku. W artykule: normalna analiza.' },
      { re: /najnowsz[eay]\s+(wieści|informacj[eai])/i, snark: '"{0}" — gdyby wieści były dobre, napisaliby jakie. Ukryta wiadomość = brak wiadomości.' },
      { re: /(złe|koszmarne|fatalne|smutne|nowe)\s+wieści/i, snark: '"{0}" — jakie wieści? Tytuł nie mówi, bo wtedy nie klikniesz.' },
      { re: /\bostrzega\b/i, snark: '"{0}" — tytuł mówi ŻE ostrzega, ale nie PRZED CZYM. Technika: ukryj treść ostrzeżenia.' },
      { re: /wyniki\s+(naszej\s+)?(sondy|ankiety|badania)/i, snark: '"{0}" — wynik ukryty w nagłówku = wynik banalny. Gdyby był szokujący, byłby w tytule.' },
      { re: /stanowczo\s+(zareagował[aoy]?|odpowiedział[aoy]?)/i, snark: '"{0}" — "stanowczo" = powiedział coś normalnego, ale głośniej.' },
      { re: /\b(hiszpanie|niemcy|anglicy|włosi|francuzi|ukraińcy|rosjanie|amerykanie|brytyjczycy|media)\s+pisz[ąa]\b/i, snark: '"{0}" — zagraniczne media piszą o wszystkim. Pytanie: co piszą? Tytuł tego nie zdradzi.' },
      { re: /jest\s+(nagranie|zdjęcie|wideo|film|dowód|raport|decyzja)/i, snark: '"{0}" — jest, ale tytuł nie mówi JAKA treść. Technika: zapowiedź bez informacji.' },
      { re: /nikt\s+się\s+nie\s+spodziewał/i, snark: '"{0}" — spodziewali się. Po prostu nie tak bardzo, jak sugeruje nagłówek.' },
      { re: /nie\s+wyklucza/i, snark: '"{0}" — "nie wyklucza" = nie potwierdził, nie zaprzeczył, nie powiedział nic konkretnego.' },
      { re: /garść\s+(porad|uwag|wskazówek|tipów)/i, snark: '"{0}" — garść = 3-5 banalnych porad, które znasz.' },
      { re: /^tak\s+\w+\s+(dba|wygląda|żyje|zarabia|mieszka|gotuje|ćwiczy|odżywia|ubiera|spędza|radzi|leczy|myje|trenuje)/i, snark: '"{0}" — "tak" = JAK, ale tytuł nie mówi jak. Gdyby sposób był ciekawy, opisaliby go.' },
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
        // Skip: open Qs, alternative Qs ("X, Y czy Z?"), price Qs
        exclude: /\b(kto|co|gdzie|kiedy|jak|ile|jaki[me]?|któr[yae]|z\s+kim|czym|komu|dlaczego|skąd|dokąd)\b.*\?|\w+,\s+\w+\s+czy\s+\w+.*\?|o\s+której|transmisja|zł\s*\?|tys\.\s*zł|jest\s+(handlow[aąy]|otwart[eay]|wolna|dniem\s+woln)/i,
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
      { re: /szok(ujące?|ował[aoy])?/i, snark: '"{0}" — słowo-emocja zamiast opisu. Technika: powiedz czytelnikowi co ma czuć, zanim przeczyta co się stało.' },
      { re: /niesamowit[yae]/i, snark: '"{0}" — całkiem samowitne, gdy się okaże.' },
      { re: /niewiarygodne?/i, snark: '"{0}" — wiarygodne i raczej przyziemne.' },
      { re: /przełomow[yae]/i, snark: '"{0}" — przełom tak duży, że jutro nikt nie będzie pamiętał.' },
      { re: /rewolucyjn[yae]/i, snark: '"{0}" — rewolucyjne jak każda nowość, o której zapomnisz za tydzień.' },
      { re: /kosmiczn[yae]/i, snark: '"{0}" — na ziemi. Zdecydowanie na ziemi.' },
      { re: /brutaln[yae]/i, snark: '"{0}" — przymiotnik emocjonalny. Mówi ci co czuć, zanim przeczytasz co się stało.' },
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
      { re: /zwala\s+z\s+nóg/i, snark: '"{0}" — nogi stabilne. Redakcja przesadza z efektem.' },
      { re: /jak\s+nigdy/i, snark: '"{0}" — jak zawsze, tylko z wykrzyknikiem.' },
      { re: /miazga/i, snark: '"{0}" — w rzeczywistości: normalny wynik sportowy.' },
      { re: /masakra/i, snark: '"{0}" — hiperboliczny skrót. Technika: jedno słowo-emocja zamiast opisu sytuacji.' },
      { re: /demolka/i, snark: '"{0}" — ktoś wygrał pewniej niż zwykle.' },
      { re: /[""„]zmiażdżył[aoy]?[""„"]/i, snark: '"{0}" — cudzysłów zdradza, że nawet redakcja wie, że przesadza. Ale kliki się liczą.' },
      { re: /\bzmiażdżył[aoy]?\b/i, snark: '"{0}" — w tłumaczeniu: wygrał wyraźnie. Ale "wygrał wyraźnie" to nie nagłówek.' },
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
      { re: /absolutnie\s+(unikatow|wyjątkow|niezwykł|jedyn)/i, snark: '"{0}" — "absolutnie" to wzmacniacz, który nie dodaje informacji. Bez niego zdanie mówi to samo.' },
      { re: /bez\s*precedens/i, snark: '"{0}" — precedens pewnie istnieje, ale "z precedensem" to nie nagłówek.' },
      { re: /historyczn[yae]/i, snark: '"{0}" — historyczne jak każdy wtorek, jeśli wystarczająco się postarasz.' },
      { re: /katastrofaln[yae]/i, snark: '"{0}" — w clickbaicie katastrofa zaczyna się od 3% spadku.' },
      { re: /\bwstrząs(nęł[aoy]?|ając[yae])\b/i, snark: '"{0}" — wstrząśnięte zostały głównie klawisze redaktora.' },
      { re: /fataln[yae]/i, snark: '"{0}" — fatalne w nagłówku = złe w rzeczywistości. Ale "złe" nie klika się tak dobrze.' },
      { re: /koszmarny?[ae]?/i, snark: '"{0}" — słowo emocjonalne zamiast opisu. Redakcja mówi ci co czuć, zamiast powiedzieć co się stało.' },
      { re: /(niezwykł|piękn|poruszając|niesamowit)[yae]\s+gest/i, snark: '"{0}" — gdyby gest był naprawdę niezwykły, opisaliby go w tytule. Nie opisali, bo sam w sobie nie jest wystarczająco ciekawy.' },
      { re: /niezwykł[yae]/i, snark: '"{0}" — przymiotnik zamiast opisu. Technika: oceń za czytelnika, zanim zobaczy fakty.' },
      { re: /robi\s+wrażenie/i, snark: '"{0}" — robi wrażenie na redakcji. Czytelnik oceni sam — jeśli kliknie.' },
      { re: /deklasacj[aąęi]/i, snark: '"{0}" — deklasacja w sporcie = wygrali wyraźniej niż zwykle. Normalnie to się nazywa "dobra forma".' },
      { re: /kompromitując[yae]/i, snark: '"{0}" — kompromitujące dla autora nagłówka. Treść jest mniej dramatyczna.' },
      { re: /\bskandal(em|u)?\b/i, snark: '"{0}" — jedno słowo, zero kontekstu. Idealna przynęta na kliknięcie.' },
      { re: /magiczn[yae]/i, snark: '"{0}" — magia istnieje tylko w nagłówkach. W artykule — normalna arytmetyka.' },
      { re: /odrażając[yae]/i, snark: '"{0}" — przymiotnik wartościujący. Redakcja ocenia za ciebie, zanim zobaczysz fakty.' },
      { re: /straszn[yae]/i, snark: '"{0}" — emocja narzucona z góry. Technika: powiedz czytelnikowi co czuć, zanim pozna szczegóły.' },
      { re: /\bzgroza\b/i, snark: '"{0}" — jednosłowna emocja jako nagłówek. Im krótsze hasło, tym silniejsza manipulacja.' },
      { re: /obrzydliw[yae]/i, snark: '"{0}" — emocja zamiast opisu. Technika: najpierw wzbudzić oburzenie, potem dać treść.' },
      { re: /wielki[ae]\s+(emocje|zmiany|nadzieje)/i, snark: '"{0}" — "wielkie" sugeruje skalę, która w artykule okaże się mniejsza.' },
      { re: /\bodchodzi\b/i, snark: '"{0}" — kto odchodzi? Tytuł celowo ukrywa podmiot, żebyś kliknął.' },
    ],
  },
  {
    id: 'shock_promise',
    name: 'Obietnica szoku',
    weight: 2,
    rules: [
      { re: /aż\s+się\s+(wierzyć\s+nie\s+chce|nie\s+chce\s+wierzyć)/i, snark: '"{0}" — chce się wierzyć. I uwierzysz. Bo treść jest normalna.' },
      { re: /trudno\s+uwierzyć/i, snark: '"{0}" — technika: narzuć emocję niedowierzania, zanim czytelnik pozna fakty.' },
      { re: /nikt\s+się\s+nie\s+spodziewał/i, snark: '"{0}" — wielu się spodziewało. Redakcja po prostu liczy na twoją niewiedzę.' },
      { re: /tego\s+się\s+nie\s+spodziewał/i, snark: '"{0}" — spodziewał się. Każdy się spodziewał.' },
      { re: /nie\s+(do\s+wiary|do\s+uwierzenia)/i, snark: '"{0}" — jak najbardziej do wiary. Po prostu niezbyt ciekawe.' },
      { re: /nie\s+dowierza/i, snark: '"{0}" — dowierza, po prostu tak się mówi w nagłówkach.' },
      { re: /zaskakując[yae]\s+(wynik|zwrot|odkrycie|decyzja|wyznanie|wypowiedź|słowa|deklaracja)/i, snark: '"{0}" — zaskakujące dla kogoś, kto nie śledził tematu.' },
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
      {
        re: /[""„""].{3,60}[""„""]/,
        exclude: /Taniec z gwiazdami|TzG|The Voice|MasterChef|Mam talent|Big Brother|Hotel Paradise|Rolnik szuka|Nasz nowy dom|Kuchenne rewolucje|Top Model|Bake Off|The Traitors|Zdrajcy|Sanatorium|halo tu polsat|Kocham cię,?\s*Polsko|Dzień Dobry|Lepsze włosy|Pytanie na śniadanie|Biur[oa]\s+Tajemnic|Piękn[aąey]\s+i\s+Besti[aąi]/i,
        snark: '{0} — brzmi dramatycznie wyrwane z kontekstu. W pełnej rozmowie to zdanie pewnie było o niczym.',
      },
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
      { re: /dramat/i, snark: '"{0}" — sprawdź: czy tytuł mówi KOGO dotyczy i CO się stało? Jeśli tak — uzasadnione. Jeśli ukrywa — clickbait.' },
      { re: /są\s+konsekwencje/i, snark: '"{0}" — konsekwencje pewnie oznaczają: ktoś napisał oświadczenie.' },
      { re: /jest\s+(reakcja|odpowiedź|komentarz)/i, snark: '"{0}" — tytuł mówi ŻE jest reakcja, ale nie JAKA. Technika: zapowiedz wydarzenie, ukryj treść.' },
      { re: /to się działo/i, snark: '"{0}" — działo się to, co się zwykle dzieje.' },
      { re: /się\s+dzieje/i, snark: '"{0}" — "się dzieje" = redakcja obiecuje akcję, ale nie mówi jaką. Klasyczna luka informacyjna.' },
      { re: /potem\s+było\s+(tylko\s+)?(gorzej|lepiej)/i, snark: '"{0}" — potem było tak, jak można było przewidzieć.' },
      { re: /wszystko\s+(jasne|się\s+wyjaśniło)/i, snark: '"{0}" — jasne było od początku, ale clickbait potrzebował napięcia.' },
      { re: /zapadł[aoy]\s+(cisza|milczenie)/i, snark: '"{0}" — cisza = nikt nic nie powiedział. Nagłówek z braku wiadomości.' },
      { re: /\bzniknął[aoy]?\b/i, snark: '"{0}" — spokojnie, nikt nie zniknął dosłownie. Pewnie nie strzelił gola albo wyszedł z kadru.' },
      { re: /niezręczn[aąeyo]\s+(sytuacj[aąęi]|moment)/i, snark: '"{0}" — "niezręcznie" = ktoś powiedział coś dziwnego. Publiczność przeżyła.' },
      { re: /mocny\s+(sygnał|przekaz|cios)/i, snark: '"{0}" — "mocny sygnał" bez treści = pusty sygnał. Gdyby był mocny, stałby w tytule.' },
      { re: /wydał[aoy]\s+się/i, snark: '"{0}" — wydało się coś, co pewnie i tak wszyscy podejrzewali.' },
      { re: /zawrzało/i, snark: '"{0}" — "zawrzało" w internecie = 20 osób napisało komentarze.' },
      { re: /\bburza\b/i, snark: '"{0}" — burza w nagłówku = kilka krytycznych komentarzy. W meteorologii byłoby ciekawiej.' },
      { re: /\bkonflikt\b/i, snark: '"{0}" — konflikt brzmi poważnie. Tytuł nie mówi o co — bo wtedy brzmiałoby banalnie.' },
      { re: /\bawantura\b/i, snark: '"{0}" — awantura = ktoś podniósł głos. Ale "podniósł głos" to nie nagłówek.' },
      { re: /bez\s+litości/i, snark: '"{0}" — z litością. Po prostu skrytykował. Ale "skrytykował" nie generuje klików.' },
      { re: /wydał[aoy]?\s+wyrok/i, snark: '"{0}" — "wydał wyrok" = powiedział swoją opinię. Nie był w todze.' },
      { re: /stracił[aoy]?\s+kontrolę/i, snark: '"{0}" — "stracił kontrolę" = wyraził emocje publicznie. W clickbaicie to wystarczy na nagłówek.' },
      { re: /odkrył[aoy]?\s+karty/i, snark: '"{0}" — karty odkryte, ale tytuł ich nie pokazuje. Musisz kliknąć.' },
      { re: /kradnie\s+show/i, snark: '"{0}" — "kradnie show" = zwróciła na siebie uwagę. Ale "zwróciła uwagę" nie klika się tak dobrze.' },
      { re: /i\s+(się\s+)?zaczęło/i, snark: '"{0}" — niedokończone zdanie jako nagłówek. Klasyczny cliffhanger — bo samo zakończenie jest nudne.' },
      { re: /i\s+wtedy/i, snark: '"{0}" — "i wtedy" to clickbaitowy cliffhanger. Potem stało się coś zwyczajnego.' },
      { re: /oto\s+powód/i, snark: '"{0}" — powód jest banalny. Gdyby nie był, stałby w tytule.' },
      { re: /(ważny|prosty|jeden)\s+powód/i, snark: '"{0}" — jaki powód? Tytuł go ukrywa, bo sam w sobie nie jest wystarczająco interesujący.' },
      { re: /nie\s+tak\s+(to\s+)?miał[aoy]?\s+(wyglądać|być|skończyć)/i, snark: '"{0}" — narracja odwróconych oczekiwań. Technika: zasugeruj rozczarowanie, nie pokazuj czym.' },
      { re: /może\s+zmienić\s+wszystko/i, snark: '"{0}" — "może zmienić wszystko" = nic konkretnego się jeszcze nie stało. Wielka obietnica, zero gwarancji.' },
      { re: /kradnie\s+show/i, snark: '"{0}" — "kradnie show" = ktoś zwrócił na siebie uwagę. W nagłówku to brzmi jak afera.' },
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
      { re: /oburzen[iya]/i, snark: '"{0}" — "oburzeni" = napisali komentarze. Jutro zapomną.' },
      { re: /rzucili\s+się/i, snark: '"{0}" — "rzucili się" = kilka osób kupiło. Kartonami? Raczej sztukami.' },
      { re: /sypi[ąa]\s+się/i, snark: '"{0}" — "sypią się" = kilka przypadków. Ale "kilka mandatów" nie straszy.' },
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
      { re: /oniemiel[aiy]/i, snark: '"{0}" — oniemieli na 3 sekundy, potem scrollowali dalej.' },
      { re: /łz[yaomie]/i, snark: '"{0}" — łzy co najwyżej ze znudzenia po kliknięciu.' },
      { re: /ciarki/i, snark: '"{0}" — ciarki od przeciągu, nie od treści.' },
      { re: /wzrusz/i, snark: '"{0}" — wzruszy cię bardziej rachunek za prąd.' },
      { re: /przejmując[yae]/i, snark: '"{0}" — przejmujące dla redakcji szukającej klików.' },
      { re: /wielkie\s+emocje/i, snark: '"{0}" — wielkie emocje = ktoś się uśmiechnął lub zapłakał. Ale "normalne emocje" to nie nagłówek.' },
      { re: /nie\s+wytrzymał[aoy]?/i, snark: '"{0}" — "nie wytrzymał" = zareagował emocjonalnie. W nagłówku brzmi jak eksplozja, w artykule — jak komentarz.' },
      { re: /porażaj[ąa]/i, snark: '"{0}" — "porażają" = redakcja mówi ci co masz czuć. Technika: narzuć emocję zanim pokażesz treść.' },
      { re: /(płakał[aoy]?|rozpłakał[aoy]?\s+się)\s+jak/i, snark: '"{0}" — technika: zamiast powiedzieć CO się stało, redakcja mówi JAK ktoś reagował. Emocja zastępuje informację.' },
      { re: /poruszając[yae]\s+(słow|histori|gest|scen)/i, snark: '"{0}" — redakcja mówi ci co masz czuć. Technika: emocja przed faktami.' },
      { re: /mroź[iąa]\s+krew/i, snark: '"{0}" — technika: emocja fizyczna (krew, ciarki, dreszcze) zamiast opisu zdarzenia.' },
      { re: /wyciskaj?[ąa]\s+łzy/i, snark: '"{0}" — redakcja obiecuje emocje. Technika: sprzedaj płacz zamiast treści.' },
      { re: /na\s+potęgę/i, snark: '"{0}" — "na potęgę" = wzmacniacz bez informacji. Technika: dodaj intensywność, ukryj szczegóły.' },
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
      { re: /znacie\s+(go|ją|ich|je)\b/i, snark: '"{0}" — może znacie, może nie. Ale clickbait liczy, że klikniecie żeby sprawdzić.' },
      { re: /poznajesz\s+(go|ją|ich)/i, snark: '"{0}" — nie poznajesz. I to jest OK.' },
    ],
  },
  {
    id: 'expressive_verbs',
    name: 'Ekspresyjne czasowniki',
    weight: 1,
    rules: [
      { re: /nie\s+(kryje\s+(emocji|wściekłości|radości|złości|frustracji|łez|rozczarowania|oburzenia)|dowierza|gryzł[aoy]?\s+się\s+w\s+język)/i, snark: '"{0}" — kryje. Wszystko jest pod kontrolą. Po prostu skomentował.' },
      { re: /mówi\s+wprost/i, snark: '"{0}" — gdyby mówił wprost, zacytowaliby go wprost. "Mówi wprost" = powiedział coś normalnego.' },
      { re: /przerwał[aoy]?\s+milczenie/i, snark: '"{0}" — milczenie trwało do momentu, aż redakcja potrzebowała kliknięć. Teraz "przerywa" — czyli skomentował.' },
      { re: /zabrał[aoy]?\s+głos/i, snark: '"{0}" — standardowy zwrot polityczny. Pytanie: tytuł mówi ŻE zabrał głos, ale czy mówi CO powiedział?' },
      { re: /ostro\s+(zareagował|skomentował|odpowiedział)/i, snark: '"{0}" — "ostro" w nagłówku = powiedział coś krytycznego normalnym tonem.' },
      { re: /głośno\s+(powiedział[aoy]?|mówi|skomentował[aoy]?)/i, snark: '"{0}" — "głośno" = powiedział. Ale "powiedział" nie generuje kliknięć.' },
      { re: /jasno\s+(wyraził\s+się|powiedział|dał\s+do\s+zrozumienia)/i, snark: '"{0}" — jasno, czyli powiedział to, co myślał. Jak każdy dorosły człowiek.' },
      { re: /reaguj[eą]\s+na\s+(słowa|doniesienia|informacje|to)/i, snark: '"{0}" — zareagował. Czyli skomentował. Jak codziennie.' },
      { re: /grozi\s+palcem/i, snark: '"{0}" — grozi palcem = wydał oświadczenie prasowe.' },
      { re: /trzęsie\s+rynkiem/i, snark: '"{0}" — rynek nawet nie drgnął.' },
      { re: /wskazał\s+(błędy|problemy)/i, snark: '"{0}" — wskazał, czyli powiedział co mu się nie podoba. Normalka.' },
      { re: /nie\s+przebierał[aoy]?\s+w\s+słowach/i, snark: '"{0}" — przebierał. Ale jednym nieparlamentarnym.' },
      { re: /bez\s+ogródek/i, snark: '"{0}" — "bez ogródek" = powiedział normalnie. Ale "powiedział normalnie" to nie nagłówek.' },
    ],
  },
  {
    id: 'underpromise',
    name: 'Niedopowiedziana pointa',
    weight: 1,
    rules: [
      { re: /prosty\s+(błąd|trik|sposób|powód)/i, snark: '"{0}" — jeśli jest tak prosty, czemu nie jest w tytule? Bo nie jest ciekawy.' },
      { re: /jeden\s+(szczegół|detal|element|powód|krok|cios|błąd|ruch|gest|odkrycie|wpis)/i, snark: '"{0}" — jeden szczegół, który nie zmieścił się w tytule, bo jest banalny.' },
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
      { re: /niewielu\s+(wie|zna|pamięta|słyszał)/i, snark: '"{0}" — wielu wie. Ale "wielu wie" nie daje poczucia ekskluzywności.' },
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
      { re: /\btyle\b.{0,30}(kosztuje|kosztowało|zapłacił|zapłaciła|otrzymuj[eą]|zarabia|dostaj[eą]|wynosi)/i, snark: '"{0}" — tyle, ile można było przewidzieć.' },
      { re: /nawet\s+\d+%\s+taniej/i, snark: '"{0}" — "nawet" oznacza, że większość produktów jest taniej o 3%.' },
      { re: /za\s+grosze/i, snark: '"{0}" — za normalne pieniądze. Ale "za normalne pieniądze" to nie nagłówek.' },
      { re: /w\s+świetnych\s+cenach/i, snark: '"{0}" — ceny są normalne. "Świetne" robi za clickbait.' },
      { re: /czyści\s+magazyny/i, snark: '"{0}" — wyprzedają niesprzedane zapasy. To nie okazja — to logistyka.' },
      { re: /kwot[ay]\s+(mog[ąa]\s+)?(dziwić|zaskoczyć|szokować)/i, snark: '"{0}" — kwoty nikogo nie zaskoczą. Gdyby były szokujące, podaliby je w tytule.' },
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
      { re: /któr[eyą]\s+pokochasz/i, snark: '"{0}" — "pokochasz" to obietnica emocji, której artykuł nie dostarczy.' },
    ],
  },
  {
    id: 'celebrity_peek',
    name: 'Celebryci jako przynęta',
    weight: 1,
    rules: [
      { re: /gwiazd[aąy]\s+(pokazała|zdradziła|zaskoczyła|wyznała)/i, snark: '"{0}" — gwiazda zrobiła coś normalnego. News, bo znana.' },
      { re: /celebryt/i, snark: '"{0}" — celebryta w nagłówku = brak prawdziwego newsa.' },
      { re: /najpiękniejsz[yae]\s+(polka|polska|aktorka|sportsmenka|tenisistka|lekkoatletka|siatkarka|piosenkarka|uczestniczka)/i, snark: '"{0}" — technika: oceń wygląd zamiast osiągnięć. O mężczyźnie by tak nie napisali.' },
      { re: /najseksowniejsi?[aey]?\s/i, snark: '"{0}" — clickbait obiektyfikujący. Technika: wygląd zamiast treści.' },
    ],
  },
  {
    id: 'caps_exclaim',
    name: 'KRZYK w tytule',
    weight: 1,
    rules: [
      { re: /[a-ząćęłńóśźż]\s+[A-ZĄĆĘŁŃÓŚŹŻ]{4,}\s+[a-ząćęłńóśźż]/, snark: 'CAPS w środku zdania — redakcja KRZYCZY jednym słowem, bo treść nie krzyczy sama.' },
      { re: /[A-ZĄĆĘŁŃÓŚŹŻ]{8,}/, snark: 'CAPS LOCK w tytule — krzyk zastępuje treść. Im głośniej tytuł krzyczy, tym ciszej jest w artykule.' },
      { re: /!{2,}/, snark: 'Podwójne wykrzykniki!! — jeden nie wystarczył, bo treść nie jest wystarczająco ekscytująca.' },
      { re: /\bMAMY\s+(ZŁOTO|MEDAL|MISTRZA)/i, snark: '"{0}" — entuzjazm caps-lockiem. Informacja zmieściłaby się w jednym zdaniu bez wykrzykników.' },
    ],
  },
  {
    id: 'cliffhanger',
    name: 'Cliffhanger / niedokończenie',
    weight: 1,
    rules: [
      { re: /\.{3}\s*$/, snark: '"..." — wielokropek na końcu = redakcja celowo urwała zdanie. Reszta jest nudna, dlatego jej nie napisali.' },
      { re: /miał[aoy]?\s+być\s+(zwykły|normalny|spokojny)/i, snark: '"{0}" — miał być zwykły, ale okazał się... nadal zwykły. Tylko z nagłówkiem.' },
    ],
  },
];

// === ANALIZA TYTUŁU ===

function analyzeHeadline(text, opts = {}) {
  const matches = [];
  let totalScore = 0;

  for (const pattern of PATTERNS) {
    // Skip question detection for analytical/opinion articles
    if (opts.isAnalytical && pattern.id === 'question_headline') continue;

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
  'interia.pl': ['a.tile-a', 'a.listitem-a', 'a[class*="tile"]', 'a[class*="news"]', 'h2 a', 'h3 a', 'article a'],
  'pudelek.pl': ['a[class*="tile"]', 'a[class*="article"]', 'h2 a', 'h3 a', 'article a'],
  'fakt.pl': ['a.padded-item-link', 'a.item-link', 'a[class*="item-link"]', 'h2 a', 'h3 a'],
  'o2.pl': ['a[class*="teaser"]', 'a[class*="wp-text-link"]', 'a[class*="wp-"]', 'h2 a', 'h3 a'],
  'pomponik.pl': ['a[class*="ids-card__anchor"]', 'a[class*="ids-undecorated"]', 'h2 a', 'h3 a', 'article a'],
  'se.pl': ['a[class*="tile"]', 'a[class*="article"]', 'h2 a', 'h3 a', 'article a'],
  'natemat.pl': ['a.page-link', 'a[class*="page-link"]', 'h2 a', 'h3 a', 'article a'],
  'tvn24.pl': ['a[class*="sc-"]', 'a[class*="link"]', 'h2 a', 'h3 a', 'article a'],
  'dziendobry.tvn.pl': ['a[class*="sc-"]', 'a[class*="link"]', 'h2 a', 'h3 a', 'article a'],
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
    // Skip elements that are primarily images (no meaningful text)
    if (el.querySelector('img') && el.textContent.trim().replace(/\s+/g,' ').length < 30) continue;
    // Skip WP navigation tiles, ads, and section headers
    if (el.closest('[class*="header-services"], [class*="header-tile"]')) continue;

    let text = el.textContent?.trim().replace(/\s+/g, ' ');
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

    if (processed.has(text)) continue;
    if (el.closest('nav, footer, .menu, .sidebar-nav')) continue;
    if (text.length < 30 && !/[.!?""]/.test(text)) continue;
    // Skip subscription/promo banners — not articles
    if (/oferta\s+prenumerat|prenumerata\s+cyfrowa|sprawdź\s+ofertę|kup\s+teraz/i.test(text)) continue;

    processed.add(text);

    const analysis = analyzeHeadline(text, { isAnalytical });
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
