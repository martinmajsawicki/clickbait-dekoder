# Clickbait Dekoder v3 — Audyt bazy wzorców i wyników per portal

**Data audytu:** 22 marca 2026
**Wersja rozszerzenia:** v3 (kontekstowe snarki)
**Autor audytu:** Marcin Majsawicki
**Status:** Dokument żywy — aktualizowany po każdym audycie

---

## Sekcja 1: Baza chwytów clickbaitowych (kompletna)

Rozszerzenie wykrywa **252 wzorce regexowe** pogrupowane w **20 kategorii**. Każdy wzorzec ma przypisany komentarz (snark) w stylu New Yorkera — złośliwy, ale celny.

### Legenda

- **Waga 2** — silny sygnał clickbaitu (sam wystarczy na oznaczenie)
- **Waga 1** — lekki sygnał (w kombinacji z innymi daje wyższy score)
- **Waga 0** — sygnał wspierający (nie uruchamia badge'a sam, potrzebuje drugiego trafienia)
- `{0}` w snarku = dopasowany fragment tekstu

---

### 1. Ukryta odpowiedź (`hidden_answer`) — waga 2

Najliczniejsza kategoria. Tytuł obiecuje odpowiedź, ale jej nie podaje — zmuszając do kliknięcia.

| # | Wzorzec | Regex | Przykład z portalu | Snark |
|---|---------|-------|-------------------|-------|
| 1 | Oto co/jak | `oto,?\s*(co\|jak\|dlaczego\|kto)\b` | Oto, co Polacy jedzą na śniadanie | Pewnie coś zupełnie zwyczajnego. "Oto" rzadko poprzedza rewolucję. |
| 2 | Sprawdź co/jak | `sprawdź,?\s*(co\|jak\|dlaczego)` | Sprawdź, jak zmienił się aktor po 20 latach | Sprawdzili za ciebie. Odpowiedź: nic nadzwyczajnego. |
| 3 | Dowiedz się | `dowiedz się` | Dowiedz się, dlaczego lekarze biją na alarm | Dowiesz się, że nie warto było się dowiadywać. |
| 4 | Jest nagranie/zdjęcie | `jest\s+(nagranie\|wideo\|film\|zdjęcie)` | Jest nagranie z momentu wypadku | Nagranie istnieje. Sensacja? Zwykle nie. |
| 5 | Wiadomo | `wiadomo` | Wiadomo, kto zastąpi trenera | Jeśli byłoby naprawdę ważne, napisaliby CO wiadomo. |
| 6 | Znamy szczegóły | `znamy\s+(szczegóły\|powód\|przyczynę)` | Znamy szczegóły wypadku na A2 | Gdyby szczegóły były ciekawe, byłyby w tytule. |
| 7 | Ujawniono | `ujawniono` | Ujawniono majątek posła | Ujawniono coś, co prawdopodobnie i tak wszyscy wiedzieli. |
| 8 | Ujawniła kulisy | `ujawni[ła]\s+(kulisy\|szczegóły\|prawdę)` | Ujawniła kulisy rozstania z gwiazdą | Za kulisami zwykle są kolejne kulisy, a za nimi — nuda. |
| 9 | Opublikował nagranie | `opublikował[aoy]?\s+(nagranie\|zdjęci[ae]\|wideo\|film)` | Opublikowała zdjęcia z wakacji | Nagranie pewnie pokazuje dokładnie to, co sobie wyobrażasz. |
| 10 | Wyszło na jaw | `wyszł[aoey] na jaw` | Wyszło na jaw, ile zarabia prezenter | Na jaw wyszło coś, co dało się przewidzieć. |
| 11 | Oto prawda | `oto\s+prawda` | Oto prawda o polskim systemie emerytalnym | Prawda jest zwykle mniej ekscytująca niż tytuł. |
| 12 | Sekretny | `sekretn[yae]` | Sekretna lista polityków z aferą | Sekret znany redakcji i 500 tysiącom czytelników. |
| 13 | Jego/jej sekret | `\b(jego\|jej\|ich\|swój\|swoje?go)\s+sekret\b` | Jej sekret pięknej skóry po pięćdziesiątce | Sekret tak intymny, że trafił do nagłówka tabloidowego portalu. |
| 14 | Znała sekret | `\bznał[aoy]?\s+(jego\|jej\|ich)?\s*sekret` | Znała jego sekret od lat | Znała sekret, a teraz znają go wszyscy — łącznie z tobą, bez klikania. |
| 15 | Tajemnica | `ta?jemnic[aąeę]` | Tajemnica wyspy na Mazurach | Tajemnica tak dobrze strzeżona, że jest w nagłówku. |
| 16 | Co zrobił potem | `co\s+(zrobił[aoy]?\|powiedział[aoy]?\|stało się)\s+potem` | Co powiedziała potem, zaskoczyło wszystkich | Potem stało się coś zupełnie przewidywalnego. |
| 17 | Nie uwierzysz | `nie\s+uwierzysz` | Nie uwierzysz, co znaleźli w piwnicy | Uwierzysz. I pożałujesz kliknięcia. |
| 18 | Nie mogą uwierzyć | `nie\s+mog[ąa]\s+uwierzyć` | Eksperci nie mogą uwierzyć w wyniki | Mogą. Po prostu clickbait potrzebuje hiperbolii. |
| 19 | To nie żart | `to\s+nie\s+żart` | Cena spadła o 90%. To nie żart | Skoro musisz zapewnić, że to nie żart, treść pewnie jest na granicy banalności. |
| 20 | Tak wyglądają | `\btak\s+(wyglądaj[ąa]\|wygląda)\b` | Tak wyglądają najdroższe mieszkania w Warszawie | Wyglądają normalnie. Ale "wyglądają normalnie" nie generuje kliknięć. |
| 21 | Jak wtedy wyglądał | `jak\s+(wtedy\|kiedyś\|dawniej)\s+wyglądał` | Jak kiedyś wyglądała Edyta Górniak | Wyglądali jak ludzie w danej epoce. Szok. |
| 22 | Spójrzcie/zobaczcie | `(spójrzcie\|patrzcie\|zobaczcie),?\s+(jak\|co\|na)` | Zobaczcie, jak mieszka aktorka | Spójrzcie: wygląda normalnie. Ale "wygląda normalnie" to nie nagłówek. |
| 23 | Policzyli ile | `policzyli\s+(ile\|jak)` | Policzyli, ile kosztuje wychowanie dziecka | Policzyli. Ale wynik jest zbyt nudny, żeby zmieścić się w tytule. |
| 24 | Wdarł się | `wdarł[aoy]?\s+się` | Wdarł się do domu celebryty | Ktoś wszedł gdzieś, gdzie go nie zaproszono. To cała historia. |
| 25 | Wyjawił | `wyjawił[aoy]?` | Wyjawił prawdziwy powód odejścia | Wyjawił coś, co pewnie jest normalne. Gdyby było szokujące, napisaliby co. |
| 26 | Nie zgadniecie | `nie\s+(zgadniecie\|zgadniesz)` | Nie zgadniecie, kto wygrał konkurs | Zgadniesz. Albo ci będzie obojętne. W obu przypadkach — nie klikaj. |
| 27 | Kulisy afery | `kulisy\s+(rozwodu\|afery\|skandalu\|sprawy\|związku\|rozstania\|konfliktu)` | Kulisy rozwodu znanej pary | Za kulisami jest to samo co przed nimi, tylko bez makijażu. |
| 28 | Najnowsze wieści | `najnowsz[eay]\s+(wieści\|informacj[eai])` | Najnowsze wieści ws. katastrofy | Gdyby wieści były dobre, napisaliby jakie. Ukryta wiadomość = brak wiadomości. |
| 29 | Złe/nowe wieści | `(złe\|koszmarne\|fatalne\|smutne\|nowe)\s+wieści` | Smutne wieści dotyczące aktora | Jakie wieści? Tytuł nie mówi, bo wtedy nie klikniesz. |
| 30 | Ostrzega | `\bostrzega\b` | Ekspert ostrzega przed popularnym lekiem | Ostrzega przed czymś, co pewnie i tak wiesz. |
| 31 | Wyniki sondy | `wyniki\s+(naszej\s+)?(sondy\|ankiety\|badania)` | Wyniki naszej sondy zaskakują | Wynik ukryty w nagłówku = wynik banalny. |
| 32 | Stanowczo zareagował | `stanowczo\s+(zareagował[aoy]?\|odpowiedział[aoy]?)` | Stanowczo zareagował na zarzuty | "Stanowczo" = powiedział coś normalnego, ale głośniej. |
| 33 | Media/narody piszą | `\b(hiszpanie\|niemcy\|...)\s+pisz[ąa]\b` | Niemcy piszą o polskim zawodniku | Zagraniczne media piszą o wszystkim. Pytanie: co piszą? Tytuł tego nie zdradzi. |
| 34 | Jest nagranie (v2) | `jest\s+(nagranie\|zdjęcie\|wideo\|film\|dowód)` | Jest dowód na oszustwo | Jest nagranie, ale nie pokażemy ci go w tytule. Musisz kliknąć. |
| 35 | Nikt się nie spodziewał | `nikt\s+się\s+nie\s+spodziewał` | Nikt się nie spodziewał takiego wyniku | Spodziewali się. Po prostu nie tak bardzo, jak sugeruje nagłówek. |
| 36 | Nie wyklucza | `nie\s+wyklucza` | Premier nie wyklucza podwyżki podatków | "Nie wyklucza" = nie potwierdził, nie zaprzeczył, nie powiedział nic konkretnego. |
| 37 | Garść porad | `garść\s+(porad\|uwag\|wskazówek\|tipów)` | Garść porad na majówkę | Garść = 3-5 banalnych porad, które znasz. |
| 38 | Jest nagranie/dowód (dup) | (pokrywa się z #4/#34 — różne konteksty match) | — | — |

---

### 2. Pytajnik w tytule (`question_headline`) — waga 1

Prawo Betteridge'a: jeśli nagłówek jest pytaniem, odpowiedź brzmi "nie".

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Pytajnik (z exclude) | `\?` (wyklucza pytania otwarte kto/co/gdzie/kiedy/ile) | Czy Polska jest gotowa na kryzys? | Prawo Betteridge'a: jeśli nagłówek jest pytaniem, odpowiedź brzmi "nie". |

**Uwaga:** Wzorzec ma rozbudowany filtr `exclude` — ignoruje pytania otwarte (kto, co, gdzie, kiedy, jak, ile), pytania o ceny (zł?), transmisje i godziny.

---

### 3. Superlativ / przesada (`superlative`) — waga 1

Największa kategoria pod względem liczby reguł. Inflacja przymiotników.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | HIT | `\bHIT\b` | HIT cenowy w Biedronce | W tłumaczeniu z clickbaitowego: "produkt, który istnieje". |
| 2 | Szokujące | `szok(ujące?\|ował[aoy])?` | Szokujące wyznanie gwiazdy | W tłumaczeniu: "lekko zaskakujące, jeśli masz bardzo nudne życie". |
| 3 | Niesamowite | `niesamowit[yae]` | Niesamowity dom polskiej aktorki | Całkiem samowitne, gdy się okaże. |
| 4 | Niewiarygodne | `niewiarygodne?` | Niewiarygodne zdjęcia z kosmosu | Wiarygodne i raczej przyziemne. |
| 5 | Przełomowe | `przełomow[yae]` | Przełomowe odkrycie polskich naukowców | Przełom tak duży, że jutro nikt nie będzie pamiętał. |
| 6 | Rewolucyjne | `rewolucyjn[yae]` | Rewolucyjna metoda odchudzania | Rewolucyjne jak każda nowość, o której zapomnisz za tydzień. |
| 7 | Kosmiczne | `kosmiczn[yae]` | Kosmiczne ceny mieszkań | Na ziemi. Zdecydowanie na ziemi. |
| 8 | Brutalne | `brutaln[yae]` | Brutalna prawda o emeryturach | W clickbaicie "brutalne" oznacza "nieprzyjemne". |
| 9 | Skandaliczne | `skandaliczn[yae]` | Skandaliczne zachowanie posła | Skandal tak duży, że zmieścił się w jednym kliknięciu. |
| 10 | Sensacja | `\bsensacj[aąęi]\b` | Sensacja transferowa w Legii | Gdyby to była prawdziwa sensacja, byłaby w nagłówku TVN24. |
| 11 | Sensacyjne | `sensacyjn[yae]` | Sensacyjne doniesienia z giełdy | Sensacyjne dla redakcji. Dla czytelnika: normalne. |
| 12 | Fundamentalne | `fundamentaln[yae]` | Fundamentalna zmiana w podatkach | Fundamentalna jak każda zmiana, o której zapomnisz za tydzień. |
| 13 | Wulgarne | `wulgar[ny]` | Wulgarna odpowiedź polityka | Ktoś powiedział coś nieprzyjemnego. News o 11:00. |
| 14 | Dramatyczne | `dramatyczn[yae]` | Dramatyczna sytuacja na granicy | Dramat w tym kontekście = ktoś się zdenerwował. |
| 15 | Nieludzkie | `nieludzk[ie]` | Nieludzkie traktowanie w szpitalu | Ludzkie, po prostu nieprzyjemne. |
| 16 | Jak marzenie | `jak\s+marzenie` | Mieszkanie jak marzenie za grosze | Marzenie, z którego budzisz się po kliknięciu. |
| 17 | Bije rekordy | `bije\s+(na\s+głowę\|konkurencję\|rekordy)` | Nowy model bije na głowę konkurencję | Nikogo nie bije. Sprzedaje się umiarkowanie. |
| 18 | Na łopatki | `na\s+łopatki` | Położył rywala na łopatki | Łopatki nie ucierpiały. |
| 19 | Jak nigdy | `jak\s+nigdy` | Tanie jak nigdy dotąd | Jak zawsze, tylko z wykrzyknikiem. |
| 20 | Miazga | `miazga` | Miazga w derbach! | W rzeczywistości: normalny wynik sportowy. |
| 21 | Masakra | `masakra` | Masakra cenowa w elektromarkecie | Nie dosłownie. Na szczęście. |
| 22 | Demolka | `demolka` | Demolka! Polacy rozgromili rywali | Ktoś wygrał pewniej niż zwykle. |
| 23 | Kapitalne | `kapitaln[yae]` | Kapitalny mecz Świątek | W tłumaczeniu: "całkiem niezłe". |
| 24 | Rekordowe | `rekordow[yae]` | Rekordowe temperatury w marcu | Rekord, który przetrwa do następnego rekordu. |
| 25 | Najlepsze | `najlepsz[yae]` | Najlepsze restauracje w Polsce | W sporcie pewnie prawda. Ale tytuł nie mówi w czym i o ile. |
| 26 | Najgorsze | `najgorsz[yae]` | Najgorszy wynik od lat | Najgorszy według kryteriów autora artykułu. |
| 27 | Największe | `największ[yae]` | Największa inwestycja w historii regionu | Największy do następnego największego. |
| 28 | Pierwszy raz | `pierwszy\s+raz` | Po raz pierwszy w historii polskiej piłki | Tak, kiedyś wszystko jest po raz pierwszy. |
| 29 | Rewolucja | `rewolucj[aę]` | Rewolucja w komunikacji miejskiej | Rewolucja, po której nic się nie zmieni. |
| 30 | Obłędne | `obłędn[yae]` | Obłędna stylizacja gwiazdy | Obłędne, czyli ładne. Ale "ładne" nie generuje kliknięć. |
| 31 | Zachwyca | `zachwyca[jąe]?` | Nowa kolekcja zachwyca | Zachwyca redakcję. Czytelnik oceni sam, jeśli kliknie. |
| 32 | Rozpali zmysły | `rozpal[ąi]\s+(zmysły\|wyobraźnię)` | Film, który rozpali zmysły | Zmysły zostaną nietknięte. To reklama, nie romans. |
| 33 | Niebywałe | `niebywał[eayo]` | Niebywałe sceny na stadionie | Bywałe. Po prostu rzadko opisywane. |
| 34 | Bez precedensu | `bez\s+precedensu` | Decyzja bez precedensu | Precedens pewnie istnieje, ale "z precedensem" to nie nagłówek. |
| 35 | Historyczne | `historyczn[yae]` | Historyczny moment dla polskiej nauki | Historyczne jak każdy wtorek, jeśli wystarczająco się postarasz. |
| 36 | Katastrofalne | `katastrofaln[yae]` | Katastrofalne prognozy dla emerytów | W clickbaicie katastrofa zaczyna się od 3% spadku. |
| 37 | Wstrząsnęło | `\bwstrząs(nęł[aoy]?\|ając[yae])\b` | Wstrząsające nagranie z kamerki | Wstrząśnięte zostały głównie klawisze redaktora. |
| 38 | Fatalne | `fataln[yae]` | Fatalne wieści z frontu | Fatalne w nagłówku = złe w rzeczywistości. |
| 39 | Koszmarne | `koszmarny?[ae]?` | Koszmarny wypadek na autostradzie | Koszmar to sen. Na jawie to "nieprzyjemne zdarzenie". |
| 40 | Niezwykłe | `niezwykł[yae]` | Niezwykłe odkrycie w piwnicy | Zwykłe. Ale "zwykłe" nie przyciąga kliknięć. |
| 41 | Robi wrażenie | `robi\s+wrażenie` | Nowa siedziba robi wrażenie | Robi wrażenie na redakcji. Czytelnik oceni sam — jeśli kliknie. |

---

### 4. Obietnica szoku (`shock_promise`) — waga 2

Tytuł zapowiada, że czytelnik dozna wstrząsu emocjonalnego.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Aż się wierzyć nie chce | `aż\s+się\s+(wierzyć\s+nie\s+chce\|nie\s+chce\s+wierzyć)` | Aż się wierzyć nie chce, ile kosztuje | Chce się wierzyć. I uwierzysz. Bo treść jest normalna. |
| 2 | Trudno uwierzyć | `trudno\s+uwierzyć` | Trudno uwierzyć w te ceny | Łatwo uwierzyć, bo to banał. |
| 3 | Nikt się nie spodziewał | `nikt\s+się\s+nie\s+spodziewał` | Nikt się nie spodziewał tego wyniku | Wielu się spodziewało. Redakcja liczy na twoją niewiedzę. |
| 4 | Tego się nie spodziewał | `tego\s+się\s+nie\s+spodziewał` | Tego się nie spodziewał nawet trener | Spodziewał się. Każdy się spodziewał. |
| 5 | Nie do wiary | `nie\s+(do\s+wiary\|do\s+uwierzenia)` | To nie do wiary, co się stało | Jak najbardziej do wiary. Po prostu niezbyt ciekawe. |
| 6 | Nie dowierza | `nie\s+dowierza` | Bohater nie dowierza własnym oczom | Dowierza, po prostu tak się mówi w nagłówkach. |
| 7 | Zaskakujący wynik | `zaskakując[yae]\s+(wynik\|zwrot\|odkrycie\|decyzja)` | Zaskakujący zwrot w sprawie | Zaskakujące dla kogoś, kto nie śledził tematu. |

---

### 5. Zaimek wskazujący (`demonstrative`) — waga 2

"Ten", "ta", "to" zamiast nazwy — bo nazwa rozczarowuje.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Ten prosty/nowy | `\b(ten\|ta\|to\|te)\s+(prosty\|jeden\|jedyny\|nowy\|...)` | Ten jeden prosty trik na ból głowy | Gdyby trik był genialny, napisaliby jaki. Nie napisali. |
| 2 | Ten preparat/produkt | `\bten\s+(trik\|sposób\|preparat\|produkt\|...)` | Ten krem zmienił jej skórę | "Ten" zamiast nazwy = nazwa jest rozczarowująca. |
| 3 | Ta metoda/dieta | `\bta\s+(metoda\|dieta\|sztuczka\|...)` | Ta dieta podbija internet | "Ta" zamiast nazwy, bo nazwa nie przyciągnęłaby kliknięcia. |
| 4 | To urządzenie/zmieni | `\bto\s+(urządzenie\|zmieni\|pomoże\|...)` | To urządzenie zmieni twoje poranki | "To" zamiast nazwy. Gdyby nazwa robiła wrażenie, napisaliby ją. |
| 5 | Te buty/produkty | `\bte\s+(kwietniki\|buty\|sukienki\|...)` | Te buty nosi cała Warszawa | "Te" zamiast marki. Bo marka jest zbyt zwyczajna na nagłówek. |
| 6 | Tych aut/osób | `tych\s+(aut\|osób\|ludzi\|miast\|telefonów)` | Unikaj tych aut jak ognia | "Tych" to clickbaitowy odpowiednik mgły — kryje banalność. |

---

### 6. Wyrwany cytat (`quote_bait`) — waga 0

Sam cudzysłów nie uruchamia badge'a — potrzebuje drugiego trafienia z innej kategorii.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Cytat 3-60 znaków | `[""„""].{3,60}[""„""]` | "Jestem w szoku" — powiedziała gwiazda | Brzmi dramatycznie wyrwane z kontekstu. W pełnej rozmowie to zdanie pewnie było o niczym. |

---

### 7. Cytat jako przynęta (`quote_amplifier`) — waga 1

Słowa wzmacniające znaczenie cytatu.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Przejmujące słowa | `przejmując[yae]\s+słow[aoy]` | Przejmujące słowa matki ofiary | Przejmujące dla redakcji. Dla czytelnika: normalna wypowiedź. |
| 2 | Mocne słowa | `mocne\s+słow[aoy]` | Mocne słowa premiera | Mocne jak kawa rozpuszczalna. Nie espresso. |
| 3 | Gorzkie słowa | `gorzkie?\s+słow[aoy]` | Gorzkie słowa trenera po meczu | Gorzkie, czyli ktoś powiedział coś krytycznego. Zdarza się. |
| 4 | Wyznał | `wyznał[aoy]?` | Aktorka wyznała bolesną prawdę | Wyznał coś, co wszyscy i tak wiedzieli. |
| 5 | Zdradził co/jak | `zdradził[aoy]?\s+(co\|jak\|że)` | Zdradziła, jak wygląda jej poranek | Zdradził, ale tajemnicą poliszynela. |

---

### 8. Dramaturgia serialu (`serial_drama`) — waga 1

Struktura narracyjna rodem z serialu — cliffhangery, napięcie, niedokończone wątki.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Zaczęło się niewinnie | `zaczęło się\s+(niewinnie\|normalnie\|zwyczajnie)` | Zaczęło się niewinnie, a skończyło dramatem | I pewnie tak się skończyło, tylko z większą liczbą kliknięć. |
| 2 | Ale potem | `\bale\s+potem\b` | Weszli do domu, ale potem... | Potem stało się coś przewidywalnego. |
| 3 | Nagły zwrot | `nagły\s+(zwrot\|koniec\|finał)` | Nagły zwrot w sprawie Amber Gold | Tak nagły, że redakcja zdążyła napisać artykuł. |
| 4 | Nagle wyjawił | `\bnagle\s+(wyjawił\|powiedział\|zdradził\|...)` | Nagle ogłosił decyzję o odejściu | "Nagle" to clickbaitowy adrenalina-booster. Pewnie planował to od tygodnia. |
| 5 | Piekło trwało | `piekło\s+trwało` | Piekło trwało 3 godziny | W clickbaicie "piekło" = "nieprzyjemna sytuacja". |
| 6 | Dramat | `dramat` | Dramat na drodze do pracy | Dramat w nagłówku: ktoś miał ciężki dzień. |
| 7 | Są konsekwencje | `są\s+konsekwencje` | Są konsekwencje po aferze | Konsekwencje pewnie oznaczają: ktoś napisał oświadczenie. |
| 8 | Jest reakcja | `jest\s+(reakcja\|odpowiedź\|komentarz)` | Jest reakcja prezydenta | Jest komentarz. Ktoś skomentował coś. To cała historia. |
| 9 | To się działo | `to się działo` | Na stadionie to się działo! | Działo się to, co się zwykle dzieje. |
| 10 | Potem było gorzej | `potem\s+było\s+(tylko\s+)?(gorzej\|lepiej)` | Potem było tylko gorzej | Potem było tak, jak można było przewidzieć. |
| 11 | Wszystko jasne | `wszystko\s+(jasne\|się\s+wyjaśniło)` | Wszystko jasne ws. transferu | Jasne było od początku, ale clickbait potrzebował napięcia. |
| 12 | Zapadła cisza | `zapadł[aoy]\s+(cisza\|milczenie)` | Po tych słowach zapadła cisza | Cisza = nikt nic nie powiedział. Nagłówek z braku wiadomości. |
| 13 | Zniknął | `\bzniknął[aoy]?\b` | Piłkarz zniknął z kadry | Spokojnie, nikt nie zniknął dosłownie. |
| 14 | Niezręczna sytuacja | `niezręczn[aąeyo]\s+(sytuacj[aąęi]\|moment)` | Niezręczna sytuacja na antenie | "Niezręcznie" = ktoś powiedział coś dziwnego. Publiczność przeżyła. |
| 15 | Mocny sygnał | `mocny\s+(sygnał\|przekaz\|cios)` | Mocny sygnał od prezesa NBP | "Mocny sygnał" bez treści = pusty sygnał. |
| 16 | Wydało się | `wydał[aoy]?\s+się` | W końcu się wydało | Wydało się coś, co pewnie i tak wszyscy podejrzewali. |
| 17 | Zawrzało | `zawrzało` | W internecie zawrzało po słowach ministra | "Zawrzało" w internecie = 20 osób napisało komentarze. |
| 18 | Bez litości | `bez\s+litości` | Skrytykował bez litości | Z litością. Po prostu skrytykował. |
| 19 | Wydał wyrok | `wydał[aoy]?\s+wyrok` | Eksperci wydali wyrok ws. diety | "Wydał wyrok" = powiedział swoją opinię. Nie był w todze. |
| 20 | Stracił kontrolę | `stracił[aoy]?\s+kontrolę` | Stracił kontrolę na wizji | "Stracił kontrolę" = wyraził emocje publicznie. |
| 21 | Odkrył karty | `odkrył[aoy]?\s+karty` | Prezes odkrył karty | Karty odkryte, ale tytuł ich nie pokazuje. Musisz kliknąć. |
| 22 | I zaczęło się | `i\s+(się\s+)?zaczęło` | Wstał od stołu i się zaczęło | Niedokończone zdanie jako nagłówek. Klasyczny cliffhanger. |
| 23 | I wtedy | `i\s+wtedy` | Spojrzał w kamerę i wtedy... | "I wtedy" to clickbaitowy cliffhanger. Potem stało się coś zwyczajnego. |
| 24 | Oto powód | `oto\s+powód` | Oto powód, dla którego Polacy nie oszczędzają | Powód jest banalny. Gdyby nie był, stałby w tytule. |

---

### 9. "Polacy oszaleli" (`collective`) — waga 2

Fałszywa zbiorowość — kilka osób staje się "całą Polską".

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Polacy oszaleli | `polacy\s+(oszaleli\|nie\s+mogą\|pokochali\|wybierają\|odkryli)` | Polacy oszaleli na punkcie tego kremu | Zamień na "kilka osób z Radomia przeczytało artykuł". |
| 2 | Internet oszalał | `internet\s+(oszalał\|eksplodował\|huczy)` | Internet huczy po słowach ministra | Internet sobie spokojnie istnieje. Trzy osoby coś udostępniły. |
| 3 | Wszyscy mówią | `wszyscy\s+(mówią\|chcą\|robią)` | Wszyscy mówią o tej sukience | "Wszyscy" = redakcja i troje znajomych autora. |
| 4 | Cała Polska | `cała\s+(polska\|europa\|branża\|sieć)` | Cała Polska żyje tą aferą | Nie cała. Fragment. Mały fragment. |
| 5 | Robi szał | `robi\s+szał` | Produkt robi szał w drogeriach | Szał w clickbaicie = umiarkowane zainteresowanie. |
| 6 | Bez szans | `bez\s+szans` | Rywale bez szans | Z szansami. Po prostu mniejszymi. |
| 7 | Wściekli | `wściekli` | Kibice wściekli po decyzji sędziego | Zirytowani. Niekoniecznie wściekli. |
| 8 | Rzucili się | `rzucili\s+się` | Polacy rzucili się na promocję | "Rzucili się" = kilka osób kupiło. Kartonami? Raczej sztukami. |
| 9 | Podzielił | `podzielił[aoy]?\s+\d` | Film podzielił 2 miliony widzów | Podzieliło, czyli jedni kliknęli A, drudzy B. To nie debata — to quiz. |

---

### 10. Emocjonalny szantaż (`emotional_blackmail`) — waga 2

Tytuł manipuluje emocjami czytelnika.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Pęknie ci serce | `pęknie\s+ci\s+serce` | Pęknie ci serce, gdy to zobaczysz | Serce wytrzyma. Treść nie jest aż tak poruszająca. |
| 2 | Zatkało | `zatkało` | Zatkało nawet prowadzącego | Nikogo nie zatkało. Może lekko zdziwił. |
| 3 | Łzy | `łz[yaomie]` | Łzy w oczach po tym filmie | Łzy co najwyżej ze znudzenia po kliknięciu. |
| 4 | Ciarki | `ciarki` | Ciarki na plecach! | Ciarki od przeciągu, nie od treści. |
| 5 | Wzrusz- | `wzrusz` | Film wzruszył miliony | Wzruszy cię bardziej rachunek za prąd. |
| 6 | Przejmujące | `przejmując[yae]` | Przejmujące sceny z pogrzebu | Przejmujące dla redakcji szukającej klików. |

---

### 11. Wyzwanie / rywalizacja (`challenge`) — waga 1

Portal prowokuje czytelnika do udowodnienia swojej wiedzy.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | A ty na ile / ile | `a\s+ty\s+(na\s+ile\|ile\|jak\|co)\s` | A ty na ile znasz polskie przysłowia? | Nie musisz udowadniać niczego portalowi informacyjnemu. |
| 2 | A ty? | `a\s+ty\??$` | Wszyscy już wiedzą. A ty? | "A ty?" to clickbaitowy ekwiwalent łapania za rękaw. |
| 3 | Większość odpada | `większość\s+(odpada\|nie\s+zdaje\|nie\s+wie)` | Większość odpada na 5. pytaniu | Większość nie odpada. Quiz jest łatwy. |
| 4 | Tylko mistrz/geniusz | `tylko\s+(mistrz\|geniusz\|znawca\|ekspert)\s` | Tylko geniusz rozwiąże ten test | Nie tylko mistrz. Każdy, kto umie czytać. |
| 5 | Quiz | `quiz` | Quiz: rozpoznaj polskie miasto po zdjęciu | Mechanizm gamifikacji. Odpowiesz na 10 pytań, obejrzysz 10 reklam. |

---

### 12. Prowokacja / wciąganie (`provocation`) — waga 1

Clickbait gra na poczuciu winy lub ego czytelnika.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Z pewnością go znacie | `z\s+pewnością\s+(go\|ją\|ich\|je)\s+(znacie\|pamiętacie\|kojarzycie)` | Z pewnością ją pamiętacie z lat 90. | Nie znasz. I nie musisz. Ale clickbait liczy na twoje ego. |
| 2 | Na pewno widziałeś | `na\s+pewno\s+(widziałeś\|słyszałeś\|znasz\|pamiętasz)` | Na pewno znasz tę piosenkę | Na pewno nie pamiętasz. I to w porządku. |
| 3 | Pamiętasz go/ją | `pamiętasz\s+(go\|ją\|to\|ten)` | Pamiętasz ją z programu? | Nie pamiętasz. Clickbait liczy na twoje poczucie winy. |

---

### 13. Ekspresyjne czasowniki (`expressive_verbs`) — waga 1

Pompowanie zwyczajnych czynności ekspresyjnymi czasownikami.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Nie kryje emocji | `nie\s+(kryje\s+(emocji\|wściekłości\|...)\|dowierza\|gryzł się w język)` | Nie kryje emocji po porażce | Kryje. Wszystko jest pod kontrolą. Po prostu skomentował. |
| 2 | Mówi wprost | `mówi\s+wprost` | Minister mówi wprost o podwyżkach | "Mówi wprost" = powiedział to, co każdy mówi. |
| 3 | Zabrał głos | `zabrał[aoy]?\s+głos` | Prezes zabrał głos ws. kryzysu | Zabrał głos, czyli skomentował. Jak codziennie. |
| 4 | Ostro zareagował | `ostro\s+(zareagował\|skomentował\|odpowiedział)` | Ostro zareagował na prowokację | "Ostro" w nagłówku = powiedział coś krytycznego normalnym tonem. |
| 5 | Jasno wyraził się | `jasno\s+(wyraził\s+się\|powiedział\|dał\s+do\s+zrozumienia)` | Jasno dał do zrozumienia swoje stanowisko | Jasno, czyli powiedział to, co myślał. Jak każdy dorosły człowiek. |
| 6 | Reaguje na słowa | `reaguj[eą]\s+na\s+(słowa\|doniesienia\|informacje\|to)` | Reagują na doniesienia o zwolnieniach | Zareagował. Czyli skomentował. Jak codziennie. |
| 7 | Grozi palcem | `grozi\s+palcem` | UE grozi palcem Big Techom | Grozi palcem = wydał oświadczenie prasowe. |
| 8 | Trzęsie rynkiem | `trzęsie\s+rynkiem` | Start-up trzęsie rynkiem | Rynek nawet nie drgnął. |
| 9 | Wskazał błędy | `wskazał\s+(błędy\|problemy)` | Audytor wskazał błędy w budżecie | Wskazał, czyli powiedział co mu się nie podoba. Normalka. |
| 10 | Nie przebierał w słowach | `nie\s+przebierał[aoy]?\s+w\s+słowach` | Nie przebierał w słowach po meczu | Przebierał. Ale jednym nieparlamentarnym. |

---

### 14. Niedopowiedziana pointa (`underpromise`) — waga 1

Tytuł sugeruje puentę, ale jej nie podaje.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Prosty błąd/trik | `prosty\s+(błąd\|trik\|sposób\|powód)` | Prosty błąd, który rujnuje dietę | Jeśli jest tak prosty, czemu nie jest w tytule? Bo nie jest ciekawy. |
| 2 | Jeden szczegół | `jeden\s+(szczegół\|detal\|element\|powód\|krok)` | Jeden szczegół zmienił wszystko | Jeden szczegół, który nie zmieścił się w tytule, bo jest banalny. |
| 3 | Na co ich stać | `na\s+co\s+(je\|go\|ją\|ich)\s+stać` | Zobaczcie, na co ich stać | Stać ich na normalne rzeczy. Ale clickbait potrzebuje tajemnicy. |
| 4 | Pokazał na co | `pokazał[aoy],?\s+na\s+co` | Pokazali, na co ich stać | Pokazali to, co zwykle pokazują w swojej pracy. |
| 5 | Dał do myślenia | `dał[aoy]\s+do\s+myślenia` | Ten film daje do myślenia | Dał do myślenia redakcji, że warto napisać clickbait. |
| 6 | Zgubił go | `zgubił[aoy]?\s+go` | Jeden błąd zgubił go w finale | Gubił go szczegół tak prosty, że nie wart artykułu. |

---

### 15. Kwestionowanie wiedzy (`knowledge_question`) — waga 1

Clickbait sugeruje, że czytelnik czegoś nie wie.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Nie znałeś/wiedziałeś | `nie\s+(znałeś\|wiedziałeś\|spodziewałeś)` | Nie wiedziałeś, że to jest nielegalne? | Znałeś. Albo nie potrzebujesz wiedzieć. |
| 2 | Większość nie wie | `większość\s+(ludzi\|osób\|polaków)\s+nie\s+wie` | Większość Polaków nie wie o tym przepisie | Większość wie. Ale clickbait liczy, że czujesz się wyjątkowy. |
| 3 | Mało kto zna | `mało\s+kto\s+(zna\|wie\|pamięta\|słyszał)` | Mało kto pamięta ten serial | Mało kto, czyli więcej osób niż myślisz. |
| 4 | Wiesz, gdzie/co | `wiesz,?\s*(gdzie\|co\|jak\|ile\|dlaczego)` | Wiesz, ile naprawdę kosztuje benzyna? | Tak, wiesz. Albo nie, i nadal przeżyjesz. |

---

### 16. Ukryta cena / kwota (`price_tease`) — waga 1

Kwota jest ukryta w tytule, żeby wymusić kliknięcie.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Kwota X-cyfrowa | `kwota\s+\d-cyfrowa` | Kwota 6-cyfrowa na koncie emerytki | Gdyby kwota była szokująca, podaliby ją. |
| 2 | A cena? | `a\s+(cena\|ile\s+kosztuje)\??` | Wygląda jak milion. A cena? | Cena jest normalna. Gdyby nie była, byłaby w tytule. |
| 3 | Miło się zaskoczysz | `miło\s+się\s+zaskoczysz` | Miło się zaskoczysz cenami w tym sklepie | Nie zaskoczysz się. Cena jest taka jak w każdym sklepie. |
| 4 | Tyle kosztuje | `tyle\s+(kosztuje\|kosztowało\|zapłacił\|...)` | Tyle kosztuje nowy iPhone w Polsce | Tyle, ile można było przewidzieć. |
| 5 | Nawet X% taniej | `nawet\s+\d+%\s+taniej` | Nawet 70% taniej w wyprzedaży | "Nawet" oznacza, że większość produktów jest taniej o 3%. |
| 6 | Za grosze | `za\s+grosze` | Dom za grosze pod Warszawą | Za normalne pieniądze. Ale "za normalne pieniądze" to nie nagłówek. |
| 7 | W świetnych cenach | `w\s+świetnych\s+cenach` | Smartfony w świetnych cenach | Ceny są normalne. "Świetne" robi za clickbait. |
| 8 | Czyści magazyny | `czyści\s+magazyny` | Znana marka czyści magazyny | Wyprzedają niesprzedane zapasy. To nie okazja — to logistyka. |

---

### 17. Reklama natywna (`native_ad`) — waga 1

Artykuł sponsorowany ukryty pod nagłówkiem redakcyjnym.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Sprawdzą się | `sprawdzą\s+się` | Sprawdzą się na wiosnę | Sprawdzą się = istnieją i działają. Ale to nie jest news. |
| 2 | Chronią przed | `chronią\s+przed` | Chronią przed wiatrem i deszczem | Tak, kurtka chroni przed wiatrem. To jej funkcja, nie sensacja. |
| 3 | Wygodne jak kapcie | `wygodne\s+jak\s+(kapcie\|chmura\|marzenie)` | Wygodne jak kapcie, a wyglądają elegancko | Wygodne jak buty. Bo to są buty. |
| 4 | Koniec z | `koniec\s+z\s+` | Koniec z bólem kręgosłupa | Koniec z problemem, który nie jest aż tak wielki. |
| 5 | Załatwił problem | `załatwi[łl]?\s+(problem\|sprawę\|temat)` | Ten gadżet załatwił problem z porządkiem | Załatwił problem, którego nie miałeś, dopóki nie przeczytałeś tego tytułu. |
| 6 | Polskiej marki | `polskiej\s+(marki\|sieciówki\|firmy)` | Hity polskiej marki w promocji | "Polskiej marki" brzmi patriotycznie. Produkt jest normalny. |
| 7 | Skradnie serce | `skradnie\s+(serce\|uwagę)` | Ta kolekcja skradnie twoje serce | Serce i uwaga zostaną na miejscu. |

---

### 18. Celebryci jako przynęta (`celebrity_peek`) — waga 1

Znana osoba przyciąga kliknięcia samym istnieniem.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | Gwiazda pokazała | `gwiazd[aąy]\s+(pokazała\|zdradziła\|zaskoczyła\|wyznała)` | Gwiazda pokazała swoje mieszkanie | Gwiazda zrobiła coś normalnego. News, bo znana. |
| 2 | Celebryta | `celebryt` | Celebrytka przerwała milczenie | Celebryta w nagłówku = brak prawdziwego newsa. |

---

### 19. KRZYK w tytule (`caps_exclaim`) — waga 1

Caps lock i wykrzykniki zastępują treść.

| # | Wzorzec | Regex | Przykład | Snark |
|---|---------|-------|---------|-------|
| 1 | CAPS LOCK 10+ liter | `[A-ZĄĆĘŁŃÓŚŹŻ]{10,}` | NIESAMOWITE odkrycie w Tatrach | CAPS LOCK w tytule — krzyk zastępuje treść. |
| 2 | Podwójne wykrzykniki | `!{2,}` | Polska wygrała!! | Podwójne wykrzykniki — jeden nie wystarczył, bo treść nie jest wystarczająco ekscytująca. |
| 3 | MAMY ZŁOTO | `\bMAMY\s+(ZŁOTO\|MEDAL\|MISTRZA)` | MAMY ZŁOTO! Polka mistrzynią świata | Entuzjazm caps-lockiem. Informacja zmieściłaby się w jednym zdaniu bez wykrzykników. |

---

## Sekcja 2: Wyniki audytu per portal

Audyt przeprowadzono 22 marca 2026 na stronach głównych trzech największych portali informacyjnych. Rozszerzenie skanowało wszystkie widoczne tytuły (łącznie z dynamicznie doładowanymi).

---

### gazeta.pl

**Profil clickbaitowy:** Intensywne użycie wzorca zbiorowego ("Polacy oszaleli"), ukryte odpowiedzi ("oto co", "jest nagranie"), wyrwane cytaty wzmocnione emocjonalnymi przymiotnikami. Gazeta.pl jest historycznym poligonem doświadczalnym tego rozszerzenia — pierwsze 25 tytułów do analizy pochodziło właśnie stąd.

**Statystyka z audytu:** ~60-70% tytułów na stronie głównej uruchamia co najmniej jeden wzorzec.

#### Wykryte clickbaity — najlepsze przykłady

| Tytuł (przykład wzorcowy) | Score | Wykryte kategorie | Snark (główny) |
|---|---|---|---|
| Polacy oszaleli na punkcie tego produktu. Oto, co o nim mówią eksperci | CB 4 | collective + hidden_answer + demonstrative | "Polacy oszaleli" — zamień na "kilka osób z Radomia przeczytało artykuł" |
| "Jestem w szoku". Znamy szczegóły afery w szpitalu | CB 3 | quote_bait + hidden_answer + superlative | "Znamy szczegóły" — gdyby były ciekawe, byłyby w tytule |
| Sprawdź, co znaleziono w popularnym ketchupie. Nie uwierzysz | CB 4 | hidden_answer + hidden_answer (nie uwierzysz) | "Nie uwierzysz" — uwierzysz. I pożałujesz kliknięcia |
| Ta metoda na odchudzanie podbija internet. Wszyscy o niej mówią | CB 4 | demonstrative + collective | "Ta metoda" — "ta" zamiast nazwy, bo nazwa nie przyciągnęłaby kliknięcia |
| Pęknie ci serce. Aktorka wyznała prawdę o swojej chorobie | CB 4 | emotional_blackmail + quote_amplifier | "Pęknie ci serce" — serce wytrzyma |
| Nikt się nie spodziewał takiego wyniku sondy. Jest nagranie reakcji | CB 4 | shock_promise + hidden_answer | "Nikt się nie spodziewał" — wielu się spodziewało |
| Jak kiedyś wyglądała znana prezenterka? Trudno uwierzyć | CB 3 | hidden_answer + shock_promise | "Trudno uwierzyć" — łatwo uwierzyć, bo to banał |

#### Pominięte clickbaity — i dlaczego

| Tytuł (pominięty) | Dlaczego nie wykryty | Komentarz |
|---|---|---|
| Miał być zwykły spacer. Wrócił z czymś, co zmieniło jego życie | Narracja bez triggera regexowego — "zwykły spacer" i "zmienił życie" nie są w bazie osobno | Chwyt opiera się na strukturze narracyjnej, nie na słowach-kluczach. Wymagałby analizy semantycznej. |
| Nowe zasady od kwietnia. Kogo dotkną najbardziej? | Pytanie otwarte ("kogo") wyłączone z detekcji pytajnika | Prawo Betteridge'a nie stosuje się do pytań otwartych — słuszne wyłączenie, ale tytuł wciąż ukrywa odpowiedź. |
| Po wakacjach było inaczej. Teraz opowiada, jak to przeżył | Brak słów-triggerów z bazy | Narracja typu "before/after" — potencjalna nowa kategoria do dodania. |

#### Fałszywe alarmy (naprawione w v3)

| Tytuł (fałszywy alarm) | Problem | Rozwiązanie |
|---|---|---|
| Kto wygra wybory? Najnowsze sondaże | Pytajnik wykryty jako clickbait, ale to pytanie otwarte z "kto" | Dodano exclude na pytania otwarte (kto/co/gdzie/kiedy/ile) |
| Ile kosztuje nowy tramwaj? Sprawdzamy | Pytajnik + "ile" = legalne pytanie | Exclude na "ile" w regexie pytajnikowym |
| Mecz o 20:30. Gdzie transmisja? | Pytanie serwisowe, nie clickbait | Exclude na "transmisja" i "o której" |

---

### onet.pl

**Profil clickbaitowy:** Dominacja pytajników (prawo Betteridge'a), celebrytów jako przynęty, quizów jako mechanizmu gamifikacji. Onet intensywnie wykorzystuje cytaty wzmocnione przymiotnikami ("mocne słowa", "gorzkie słowa"). Styl bardziej tabloidowy niż gazeta.pl.

**Statystyka z audytu:** ~50-60% tytułów na stronie głównej uruchamia co najmniej jeden wzorzec.

#### Wykryte clickbaity — najlepsze przykłady

| Tytuł (przykład wzorcowy) | Score | Wykryte kategorie | Snark (główny) |
|---|---|---|---|
| Quiz: tylko geniusz rozpozna te polskie miasta. Większość odpada na 5. pytaniu | CB 3 | challenge + challenge (większość odpada) | "Tylko geniusz" — nie tylko. Każdy, kto umie czytać. |
| Gwiazda pokazała swoje mieszkanie. Zatkało nawet fachowców | CB 3 | celebrity_peek + emotional_blackmail | "Gwiazda pokazała" — gwiazda zrobiła coś normalnego. News, bo znana. |
| Czy grozi nam kolejna podwyżka stóp? Ekonomista mówi wprost | CB 2 | question_headline + expressive_verbs | Prawo Betteridge'a: odpowiedź brzmi "nie". |
| Mocne słowa trenera po porażce. "To nie do wiary" | CB 3 | quote_amplifier + shock_promise + quote_bait | "Mocne słowa" — mocne jak kawa rozpuszczalna. |
| A ty na ile znasz polską geografię? Ten quiz robi furorę | CB 2 | challenge + demonstrative | "A ty na ile" — nie musisz udowadniać niczego portalowi |
| Pamiętasz ją z lat 90.? Tak wygląda dziś. Nie do wiary | CB 4 | provocation + hidden_answer + shock_promise | "Pamiętasz ją" — nie pamiętasz. Clickbait liczy na twoje poczucie winy. |
| Zdradziła, jak wygląda jej poranny rytuał. Przejmujące słowa | CB 2 | quote_amplifier + quote_amplifier (wyznał) | "Zdradziła, jak" — tajemnicą poliszynela. |

#### Pominięte clickbaity — i dlaczego

| Tytuł (pominięty) | Dlaczego nie wykryty | Komentarz |
|---|---|---|
| Wstawała codziennie o 4:30. Po roku efekty były widoczne | Narracja "journey" bez słów-kluczowych | Schemat "rutyna + obietnica efektu" — nietypowy, trudny do regexu. |
| Jedno zdjęcie mówi więcej niż tysiąc słów | Brak triggera — chwyt oparty na przysłowiu | Metaforyczny clickbait — poza zasięgiem pattern matching. |

#### Fałszywe alarmy (naprawione w v3)

| Tytuł (fałszywy alarm) | Problem | Rozwiązanie |
|---|---|---|
| Cena masła: 8,99 zł? To już norma | Pytajnik po kwocie w zł — to pytanie retoryczne, nie clickbait | Dodano exclude na `zł\s*\?` i `tys\.\s*zł` |
| Widzisz tę różnicę? Test wzroku online | "Widzisz X?" to pytanie o percepcję, nie clickbait Betteridge'a | Rozważane do dodania jako exclude |

---

### wp.pl

**Profil clickbaitowy:** Ekspresyjne czasowniki ("zabrał głos", "nie kryje emocji"), dramaturgia serialowa ("ale potem", "nagły zwrot"), polityczny clickbait ("mocny sygnał", "jest reakcja"). WP stosuje też agresywne CAPS LOCK w nagłówkach sportowych. Styl portalu stawia na napięcie i emocje — nawet w tematach przyziemnych.

**Statystyka z audytu:** ~55-65% tytułów na stronie głównej uruchamia co najmniej jeden wzorzec.

#### Wykryte clickbaity — najlepsze przykłady

| Tytuł (przykład wzorcowy) | Score | Wykryte kategorie | Snark (główny) |
|---|---|---|---|
| MAMY ZŁOTO! Polka mistrzynią świata w biegu na 400 m | CB 2 | caps_exclaim + caps_exclaim (!!) | CAPS LOCK — krzyk zastępuje treść |
| Minister zabrał głos ws. podwyżek. Nie przebierał w słowach | CB 2 | expressive_verbs + expressive_verbs | "Zabrał głos" = skomentował. Jak codziennie. |
| Nagły zwrot w sprawie budżetu. Są konsekwencje | CB 2 | serial_drama + serial_drama (konsekwencje) | "Nagły zwrot" — tak nagły, że redakcja zdążyła napisać artykuł. |
| Nie kryje emocji po porażce. Ostro skomentował decyzję sędziego | CB 2 | expressive_verbs + expressive_verbs (ostro) | "Nie kryje emocji" — kryje. Wszystko jest pod kontrolą. |
| Internet zawrzało po słowach posła. Jest reakcja opozycji | CB 2 | serial_drama (zawrzało) + serial_drama (jest reakcja) | "Zawrzało" = 20 osób napisało komentarze. |
| Cała Polska żyje tą aferą. Dramat na komisji sejmowej | CB 3 | collective + serial_drama (dramat) | "Cała Polska" — nie cała. Fragment. Mały fragment. |
| Odkrył karty. Mocny sygnał od prezesa spółki | CB 2 | serial_drama + serial_drama (mocny sygnał) | "Odkrył karty" — ale tytuł ich nie pokazuje. Musisz kliknąć. |
| Stracił kontrolę na wizji. Niezręczna sytuacja w studiu | CB 2 | serial_drama + serial_drama (niezręczna) | "Stracił kontrolę" = wyraził emocje publicznie |

#### Pominięte clickbaity — i dlaczego

| Tytuł (pominięty) | Dlaczego nie wykryty | Komentarz |
|---|---|---|
| Wchodzi do gabinetu, a tam... | Wielokropek jako cliffhanger nie jest w bazie | Potencjalny nowy wzorzec: `\.\.\.$` (wielokropek na końcu tytułu). |
| Zmiana, na którą nikt nie zwrócił uwagi. A powinien | "A powinien" to niedopowiedzenie bez triggera | Narracja oceniająca — trudna do ujęcia regexem bez fałszywych alarmów. |
| Sprawdzamy, ile Polacy wydali na Wielkanoc. Kwoty mogą dziwić | "Kwoty mogą dziwić" nie pasuje do "kwota X-cyfrowa" | Potencjalne rozszerzenie kategorii price_tease o "kwoty mogą dziwić/zaskoczyć". |

#### Fałszywe alarmy (naprawione w v3)

| Tytuł (fałszywy alarm) | Problem | Rozwiązanie |
|---|---|---|
| Nagłówki nawigacji WP (HOROSKOPY, PROGRAM TV) | Wielkie litery w menu wykrywane jako CAPS LOCK clickbait | Dodano filtr `^(REKLAMA\|HOROSKOPY\|PROGRAM TV\|POGODA)` w preprocessingu |
| Kafelki usług WP (linki header-services) | Detektywistyczne selektory łapały elementy nawigacyjne | Dodano `el.closest('[class*="header-services"]')` jako exclude |
| Autor: Jan Kowalski (dopisany do tytułu) | Imię i nazwisko autora wliczone w tekst tytułu → fałszywie wydłużony match | Dodano regex stripujący trailing author names |

---

## Podsumowanie i wnioski

### Skuteczność detekcji

| Portal | Tytułów na stronie | Wykrytych CB | Procent | Fałszywe alarmy (po poprawkach v3) |
|---|---|---|---|---|
| gazeta.pl | ~80-120 | ~55-80 | ~65% | <3% |
| onet.pl | ~90-130 | ~50-70 | ~55% | <3% |
| wp.pl | ~100-150 | ~60-90 | ~60% | <2% |

### Triada clickbaitowa polskich portali

Najczęstsza kombinacja chwytów (odkryta na gazeta.pl, potwierdzona na pozostałych):

> **Ukryta odpowiedź + emocjonalny wzmacniacz + zbiorowy podmiot**

Przykład: "Polacy oszaleli na punkcie tego kremu. Oto, co mówią eksperci. Nie uwierzysz"
Score: CB 6 (collective 2 + hidden_answer 2 + demonstrative 2)

### Znane ograniczenia

1. **Clickbait narracyjny** — tytuły oparte na strukturze fabularnej ("Miał być zwykły dzień...") bez słów-triggerów umykają detekcji.
2. **Clickbait metaforyczny** — przysłowia i metafory ("Jedno zdjęcie mówi więcej niż tysiąc słów") są poza zasięgiem regex.
3. **Wielokropek jako cliffhanger** — `...` na końcu tytułu nie jest osobną kategorią (potencjalne rozszerzenie).
4. **Kontekst sportowy** — część superlativów ("rekordowy", "kapitalny", "najlepszy") jest uzasadniona w kontekście sportowym, ale detektor tego nie rozróżnia.

### Plan na kolejne audyty

- [x] Dodać kategorię: wielokropek jako cliffhanger (`\.\.\.$`) — DONE v0.4
- [x] Rozważyć kategorię: "before/after" narracja ("Miał być zwykły dzień") — DONE v0.4
- [x] Rozszerzyć price_tease o "kwoty mogą dziwić/zaskoczyć" — DONE v0.4
- [x] Przetestować na interia.pl — DONE, 50/263 = 19%
- [x] Przetestować na pudelek.pl — DONE, paradoks: niski clickbait
- [x] Przetestować na fakt.pl — DONE, klasyczny tabloid
- [x] Przetestować na tvn24.pl — DONE, ~37%, dominacja Betteridge (90%)
- [x] Przetestować na pomponik.pl — DONE, ~78%
- [x] Przetestować na dziendobry.tvn.pl — DONE, ~23%
- [x] Przetestować na natemat.pl — DONE, ~42%
- [x] Przetestować na money.pl — DONE, niski CB
- [x] Przetestować na noizz.pl — DONE, niski CB
- [x] Przetestować na sport.pl — DONE, 4% → ~33% po dodaniu wzorców sportowych
- [x] Przetestować na tvrepublika.pl — DONE, CB polityczny/geopolityczny
- [x] Przetestować na wyborcza.pl — DONE, ~14%
- [ ] Zmierzyć recall (ile clickbaitów omija detekcję) ręcznym audytem 100 tytułów
- [x] Dodać selektory SE.pl po testach — DONE

---

## Audyt runda 2 (22 marca 2026, wieczór) — interia.pl, pudelek.pl, fakt.pl

### interia.pl — 50/263 = 19%

**Profil**: Portal informacyjny z sekcjami premium. Styl clickbaitu zbliżony do onet.pl — dużo pytajników, cytatów wyrwanych z kontekstu, superlativów sportowych. Specyfika: prefiksy "NA ŻYWO" i znaczniki czasu (18:42, 17:54) w tytułach.

**Wykryte (przykłady z trafnymi snarkami):**
- CB 2 "Idzie gwałtowne załamanie pogody. **Wiadomo**, kiedy zaatakuje chłód" → ukryta odpowiedź ✅
- CB 1 "**Fatalna** sytuacja Widzewa" → superlativ ✅
- CB 1 "Dramat zaczął się podczas czwartej doby" → dramaturgia ✅
- CB 2 "Polacy **oszaleli** na punkcie tej muzyki" → zbiorowość ✅

**Pominięte clickbaity → nowe wzorce dodane:**
- "Iran zapowiada **bezprecedensowe**" → naprawiony regex (jedno słowo)
- "**Deklasacja** w Poznaniu" → dodane `deklasacja`
- "**Kompromitujące** pół godziny" → dodane `kompromitujące`
- "**Skandal**. Papież domaga się" → dodane `\bskandal\b` (rzeczownik)
- "**Zdradza kulisy**" → dodane (bez dopełniacza)
- "Nie ma już **złudzeń**" → dodane

**False positives**: brak (19% to niski recall, ale wysoka precyzja)

### pudelek.pl — paradoks niskiego clickbaitu

**Profil**: Tabloid plotkarski. Paradoksalnie **mało clickbaitu** w klasycznym sensie — tytuły są tak długie i opisowe, że ujawniają całą treść.

**Kluczowe odkrycie**: Pudelek nie ukrywa odpowiedzi. Zamiast "Gwiazda zrobiła COŚ. Nie uwierzysz!" pisze "Julia Wieniawa i jej NOWY CHŁOPAK bawili się razem na urodzinowej balandze przyjaciółki artystki (FOTO)". To nie clickbait — to kompletna wiadomość.

**Techniki Pudelka (nie-clickbaitowe ale stylowe):**
- CAPS na emocjonalnych słowach: "NOWY CHŁOPAK", "ODMIENIONE", "OKRADA"
- Nawiasy z typem contentu: "(FOTO)", "(ZDJĘCIA)", "(WIDEO)"
- Pytajniki w nawiasach: "(?)" — autoironia redakcji

**Wniosek**: Pudelek to tabloid, ale NIE clickbait portal. Różnica: clickbait ukrywa, tabloid ujawnia.

### fakt.pl — klasyczny tabloid

**Profil**: Tradycyjny tabloid (Axel Springer). Silna narracja emocjonalna, urgency, cliffhangery.

**Typowe chwyty fakt.pl:**
- Narracja emocjonalna: "Płakał jak mały chłopiec, codziennie myślał o tym jednym błędzie"
- Ukryta odpowiedź + urgency: "Oto, co stanie się z naszymi rachunkami. Kluczowa data"
- Wielokropek cliffhanger: "Dzieci spały. Wtedy zapali..."
- Superlativy: "obrzydliwe zbrodnie", "najlepszy konkurs w historii"
- "Zaskakujące wyznanie" — klasyczny trigger

**Wniosek**: Fakt.pl dobrze pasuje do istniejących wzorców. Po przeładowaniu rozszerzenia powinien mieć 30-40% detekcji.

---

## Audyt uzupełniający: onet.pl — przypadki zgłoszone przez użytkownika

7 tytułów przesłanych jako screenshoty. Analiza:

| Tytuł | Clickbait? | Akcja |
|---|---|---|
| "Była nim oczarowana. Dopóki nie znalazła stosu **tajemniczych** kopert" | TAK | Naprawiono regex `/tajemnic[aąeęzy]/` |
| "Varga: historia powtarza się na naszych oczach" | NIE — felieton/opinia | Poprawnie bez badge'a |
| "To, co zobaczyłem, było **odrażające**. Wojna o strój plażowy" | TAK | Dodane `/odrażając[yae]/` |
| "Wielki talent myśli o wyjeździe. **Takie są jej warunki**" | TAK | Dodane `/takie są (jej\|jego) warunki/` |
| "Nawrocki nazwany Judaszem. **Jeden cios** zaboli go najmocniej" | TAK | Rozszerzono `/jeden (cios\|błąd\|ruch)/` |
| "Ruszyły kontrole. **Sypią się** mandaty" | TAK | Dodane `/sypi[ąa] się/` |
| "**Burza** w sprawie sztabu Świątek" | TAK | Dodane `/\bburza\b/` |

**Wynik**: 6/7 to clickbait, 1/7 poprawnie bez badge'a. Wszystkie naprawione.

---

*Dokument żywy. Ostatnia aktualizacja: 23 marca 2026. 252 wzorce, 20 kategorii, 19 portali obsługiwanych.*

---

## Zasady odkryte podczas audytu (sesja 23.03.2026)

### Paradoks ≠ Clickbait
"Pomocnik, który przeszkadzał" — paradoks w tytule UJAWNIA pointę (sprzeczność: pomagał ale przeszkadzał). Clickbait UKRYWA. Paradoks intryguje przez zaskoczenie, clickbait przez brak informacji.

### Konkretna liczba = nie clickbait
"Zniknęło tysiąc firm" — liczba jest konkretna i weryfikowalna. To fakt, nie manipulacja. Natomiast "ogrywa konkurencję" to ocena bez dowodu — ukrywa JAK.

### Zbitka "prosiła, ale..."
"Prosiła, ale ją zignorowali" — klasyczna zbitka: akcja + kontrast + ukryty przedmiot. O CO prosiła? Tytuł buduje napięcie bez informacji. Trudne do złapania regexem bo "ale" jest powszechne.

### Odmiana polska = koszmar regexu
"Taniec z gwiazdami" → "Tańca z gwiazdami" (dopełniacz). Każdy tytuł programu TV ma 7 form. Trzeba pisać regexy odmianowe: `/Tan(iec|[cń]a|[cń]em|cu)\s+(z\s+)?gwiazd/i`.

### Narracja sportowa ≠ clickbait
"I wtedy ruszył niesamowity Pietuszewski" — narracja emocjonalna w kontekście sportowym to opis wydarzeń, nie manipulacja. Sport z natury jest dramatyczny — "niesamowity" może być uzasadnione. Problem: regex nie odróżnia kontekstu sportowego od tabloidowego.

### Badge na obrazku
Badge umieszczany na powiązanym obrazku (zamiast w tekście) jest lepiej widoczny i nie zaburza layoutu strony. Wtyczka szuka elementu `img`/`picture`/`background-image` w drzewie DOM do 4 poziomów w górę od wykrytego linku.

---

## Audyt runda 3 (23 marca 2026) — masowe testy nowych portali

### pomponik.pl — ~78%

**Profil**: Portal gossip (Interia/Polsat). Wysoki clickbait — narracja emocjonalna, cytaty jako przynęta, ukryte odpowiedzi.

**Typowe chwyty:**
- Cytaty wyrwane z kontekstu: "Przejmujące słowa" + cudzysłów
- Ukryta odpowiedź: "Wiadomo, co się stało", "Oto, co powiedziała"
- Emocjonalny szantaż: "Łzy", "Wzruszenie", "Ciarki"

**False positive naprawiony**: Tytuły programów TV w cudzysłowie (np. tytuły odcinków "Tańca z gwiazdami") wykrywane jako `quote_bait`. Naprawione przez dodanie exclude na nazwy programów TV z odmianą polską.

**Wniosek**: Pomponik to wysokiej klasy clickbait portal — prawie 4 na 5 tytułów używa co najmniej jednej techniki manipulacji.

---

### dziendobry.tvn.pl — ~23%

**Profil**: Portal lifestyle (TVN). Niski clickbait, głównie horoskopy i porady zdrowotne.

**Specyfika DOM**: Styled-components (`sc-*` selektory) wymagające dopasowania selektorów CSS.

**Typowe chwyty (gdy występują):**
- Superlativy w poradach: "najlepsze", "najgorsze"
- Ukryta odpowiedź w horoskopach: "oto co czeka"
- Pytajniki w artykułach zdrowotnych

**Wniosek**: Niski poziom clickbaitu. Portal bardziej informacyjny/poradnikowy niż tabloidowy.

---

### natemat.pl — ~42%

**Profil**: Portal opiniotwórczy z ambiwalentnym stylem clickbaitu. Mieszanka rzetelnych nagłówków z clickbaitowymi.

**Specyfika**: Prefiksy dnia tygodnia i godziny w tytułach (np. "Pon 18:42 ...") — wymagały stripowania w preprocessingu.

**Typowe chwyty:**
- Pytajniki Betteridge'a
- Dramaturgia serialu: "ale potem", "zawrzało"
- Superlativy: "szokujące", "sensacyjne"

**Zgodność z recenzentem ludzkim**: Dobra — większość oznaczeń pokrywa się z oceną ręczną.

**Wniosek**: Portal na granicy — wiele tytułów balansuje między informacją a manipulacją. Detektor radzi sobie dobrze z tym ambiwalentnym stylem.

---

### money.pl — niski CB

**Profil**: Portal analityczny/finansowy. Niski clickbait — treści merytoryczne, konkretne dane.

**False positive naprawiony**: Nagłówki sekcji w CAPS LOCK (np. "BLOG EKONOMICZNY", "MAT. SPONSOROWANY") wykrywane jako `caps_exclaim`. Naprawione przez stripowanie tych prefiksów w preprocessingu.

**Wniosek**: Portal analityczny generuje mało clickbaitu. Tytuły są konkretne i informacyjne.

---

### noizz.pl — niski CB

**Profil**: Portal lifestyle/wywiady (Ringier Axel Springer). Niski clickbait — treści kulturalne, wywiady.

**Wniosek**: Mało clickbaitu. Styl redakcyjny bliższy magazynowi niż tabloidowi.

---

### tvn24.pl — ~37%

**Profil**: Portal informacyjny (TVN/Warner Bros. Discovery). Clickbait zdominowany przez pytania Betteridge'a.

**Kluczowe odkrycie**: 90% wykrytych clickbaitów to pytajniki w tytule — zamknięte pytania tak/nie, na które odpowiedź brzmi "nie" lub "nie wiadomo". Reszta to sporadyczne superlativy i dramaturgia.

**Typowe chwyty:**
- Pytajniki Betteridge'a: "Czy grozi nam...?", "Czy to koniec...?"
- Ekspresyjne czasowniki: "zabrał głos", "mówi wprost"

**Wniosek**: TVN24 clickbaituje głównie pytajnikami. Styl bardziej powściągliwy niż portale tabloidowe.

---

### sport.pl — 4% → ~33% (po dodaniu wzorców sportowych)

**Profil**: Portal sportowy (Agora). Bardzo niski clickbait przed dodaniem wzorców specyficznych dla sportu.

**Problem**: Detektor nie rozpoznawał clickbaitu sportowego — "miażdży", "deklasacja", "demolka" nie były w bazie. Po dodaniu wzorców sportowych wynik wzrósł z 4% do ~33%.

**Nowe wzorce dodane:**
- `miażdży` — w sporcie clickbait, bo ukrywa wynik
- `deklasacja` — sportowy superlativ
- `ogrywa konkurencję/rywali` — ocena bez konkretów
- `zwala z nóg` — hiperboliczny superlativ
- `powala` — sportowa przesada

**Zasada odkryta**: Narracja sportowa ("i wtedy ruszył niesamowity Pietuszewski") to NIE clickbait — to opis emocjonalnego wydarzenia sportowego. Natomiast "miażdży rywali" BEZ podania wyniku to clickbait, bo ukrywa informację.

---

### tvrepublika.pl — CB polityczny/geopolityczny

**Profil**: Portal informacyjny/opiniotwórczy (prawicowy). Clickbait polityczny i geopolityczny.

**Specyfika DOM**: Nagłówki H2 bez linków — wymagały specjalnych selektorów `[class*="article-"] h2`.

**Typowe chwyty:**
- Superlativy polityczne: "sensacyjne", "skandaliczne", "historyczne"
- Ukryte tożsamości: "ten polityk", "ta partia" — zaimki zamiast nazw
- Dramaturgia serialu: "zawrzało", "jest reakcja"

**Wniosek**: Clickbait typowy dla portali opiniotwórczych — gra na emocjach politycznych, ukrywanie tożsamości podmiotów.

---

### wyborcza.pl — ~14%

**Profil**: Portal jakościowego dziennikarstwa (Agora). Niski clickbait.

**False positive naprawiony**: Pytania z "kogo" (np. "Kogo dotyczy ta zmiana?") nie były wyłączone z detekcji Betteridge'a. Dodano "kogo" do listy exclude w regexie pytajnikowym.

**Dodatkowe exclude**: Banery subskrypcyjne ("oferta prenumerat", "prenumerata cyfrowa") i tagi analityczne ([OPINIA], [ANALIZA]) stripowane w preprocessingu.

**Wniosek**: Jakościowe dziennikarstwo = niski clickbait. 14% to głównie sporadyczne pytajniki i superlativy w sekcji sportowej.

---

## Podsumowanie audytu runda 3

### Skuteczność po rozszerzeniu

| Portal | % clickbaitu | Profil | Uwagi |
|---|---|---|---|
| pomponik.pl | ~78% | gossip | quote_bait FP na tytułach TV naprawiony |
| dziendobry.tvn.pl | ~23% | lifestyle | styled-components selektory |
| natemat.pl | ~42% | opiniotwórczy | dobra zgodność z oceną ludzką |
| money.pl | niski | analityczny | CAPS FP na nagłówkach sekcji naprawiony |
| noizz.pl | niski | lifestyle | mało materiału do detekcji |
| tvn24.pl | ~37% | informacyjny | 90% CB to pytania Betteridge'a |
| sport.pl | ~33% | sportowy | po dodaniu wzorców sportowych (z 4%) |
| tvrepublika.pl | w trakcie | polityczny | DOM H2-bez-linków, CB geopolityczny |
| wyborcza.pl | ~14% | jakościowy | "kogo" dodane do Betteridge exclude |

### Zasady edytorskie odkryte w rundzie 3

1. **Paradoks ≠ Clickbait** — paradoks UJAWNIA (sprzeczność), clickbait UKRYWA (brak informacji)
2. **Konkretna liczba = nie clickbait** — "zniknęło tysiąc firm" to fakt; "ogrywa konkurencję" to ukryta ocena
3. **"Prosiła, ale..."** — zbitka akcja+kontrast+ukryty przedmiot. Trudne do regex bo "ale" jest powszechne
4. **Odmiana polska = koszmar** — każdy tytuł TV ma 7 form odmiany. Regex musi je przewidzieć
5. **Narracja sportowa ≠ clickbait** — emocjonalny opis meczu to relacja, nie manipulacja
6. **Badge na obrazku** — umieszczanie badge'a na zdjęciu zamiast w tekście poprawia widoczność
