# Clickbait Dekoder

**English version: [below](#english)**

Wtyczka Chrome, która dekoduje clickbaitowe tytuły na polskich portalach informacyjnych.

Przy każdym wykrytym clickbaicie dodaje kolorowy badge (CB 1-10) i tooltip, który pokazuje **dokładnie, które słowo uruchomiło detekcję**, i daje mu złośliwy komentarz w stylu felietonu z New Yorkera.

Działa w dwóch warstwach. Wzorce regex dają plakietkę natychmiast, bez klucza i bez internetu. Tytuły, przy których regex nie ma pewności, może dodatkowo ocenić model AI. Warstwa AI jest opcjonalna i domyślnie wyłączona: włączasz ją w ustawieniach wtyczki własnym kluczem OpenRouter.

## Jak to wygląda

Tytuł: *„Fundamentalna zmiana”. Polacy odkryli, jak obniżyć koszty kredytów*

> Badge: **CB 3** (solidny clickbait)

Tooltip:
> **SUPERLATIV**
> *„Fundamentalna” — fundamentalna jak każda zmiana, o której zapomnisz za tydzień.*
>
> **„POLACY OSZALELI”**
> *„Polacy odkryli” — zamień na „kilka osób z Radomia przeczytało artykuł”. Nadal chcesz kliknąć?*

Reakcje wtyczki na 50 prawdziwych tytułów z 10 portali z 19 października 2026 (plakietka, źródło oceny, komentarz, uzasadnienie modelu) są w [examples/2026-10-19-tytuly.md](examples/2026-10-19-tytuly.md).

## Instalacja

1. Pobierz lub sklonuj to repozytorium
2. Otwórz `chrome://extensions` w Chrome
3. Włącz **Developer mode** (prawy górny róg)
4. Kliknij **Load unpacked**
5. Wskaż folder z plikami wtyczki
6. Wejdź na dowolny obsługiwany portal

Od tej chwili działa warstwa regex. Warstwę AI włączasz osobno (niżej).

## Włączenie AI

1. Wygeneruj klucz na [openrouter.ai/keys](https://openrouter.ai/keys)
2. Otwórz ustawienia wtyczki: `chrome://extensions` → Clickbait Dekoder → **Szczegóły** → **Opcje rozszerzenia**
3. Wklej **klucz API OpenRouter**
4. Zaznacz **„Używaj modelu AI do dosądzania niepewnych tytułów”**
5. Wybierz model (domyślny: Gemini 3.8 Flash) i kliknij **Zapisz**
6. **Test klucza** pokazuje, czy klucz i model działają

Do wyboru są cztery modele:

| Model | Opis w ustawieniach |
|---|---|
| Gemini 3.8 Flash | domyślny, najtrafniejszy |
| Gemini 2.5 Flash | tańszy, przepuszcza więcej clickbaitów |
| Gemini 2.5 Flash-Lite | najtańszy, więcej fałszywych alarmów |
| GPT-4.1 mini | |

Domyślny model działa z ograniczonym myśleniem (reasoning effort „low”). Wybrałem go pomiarem na tytułach ocenionych ręcznie. Przy wyborze liczyło się, żeby model dawał mało fałszywych alarmów, bo badge niesie złośliwy komentarz i fałszywy alarm to niesprawiedliwy zarzut wobec redakcji.

## Jak działa

1. **Skanowanie DOM**: po załadowaniu strony wtyczka przeszukuje elementy linków i nagłówków, używając selektorów specyficznych dla każdego portalu (a także zestawu domyślnego)
2. **Dopasowanie regex**: każdy tytuł (20-250 znaków) jest testowany przeciwko 447 wzorcom regexowym w 21 kategoriach
3. **Scoring**: każda trafiona kategoria dodaje swoją wagę (1 lub 2) do wyniku; maksymalny wynik to 10
4. **Badge na obrazku**: przy wykrytym clickbaicie badge (CB 1-10) jest umieszczany na powiązanym obrazku (jeśli istnieje i prowadzi do tego samego artykułu), a nie w tekście: lepiej widoczny i nie zaburza layoutu
5. **Ocena modelu** (gdy AI jest włączone): tytuły niepewne, czyli z wynikiem regexu 0, 1 albo 2, idą paczkami do modelu razem z tym, co znalazł w nich regex. Model ocenia tytuł w skali 0-100, przypisuje filary clickbaitu i pisze komentarz. Wynik regexu 3 i wyżej zostaje bez zmian, model go nie sprawdza. Wyjątek: każdy tytuł z cytatem ocenia model, bo regex myli cytat z nazwą programu
6. **Aktualizacja badge'a**: werdykt modelu zmienia, usuwa albo dodaje badge. Tytuł, w którym regex nic nie znalazł, dostaje badge dopiero wtedy, gdy model uzna go za clickbait
7. **Tooltip**: po najechaniu na badge pojawia się tooltip z nazwą kategorii, dopasowanym fragmentem tekstu i złośliwym komentarzem
8. **Scoreboard**: pływający panel w prawym dolnym rogu strony (przesuwany) pokazuje liczbę wykrytych clickbaitów, liczbę przeskanowanych tytułów i procent clickbaitu na stronie
9. **MutationObserver**: wtyczka obserwuje dynamicznie ładowaną treść (infinite scroll) i automatycznie skanuje nowe elementy

## Regex i model: dwie warstwy

Warstwa regex działa zawsze i bez klucza:
- **Offline**: zero latencji, zero kosztów, zero wysyłania danych
- **Szybka**: skan całej strony <10ms
- **Transparentna**: każdy wzorzec można przeczytać i zrozumieć
- **Deterministyczna**: ten sam tytuł = ten sam wynik

Regex świetnie łapie **frazy-sygnały** („oto co”, „nie uwierzysz”, „sensacja”). Ale nie łapie **clickbaitu narracyjnego**, czyli tytułów, które budują napięcie samym układem zdań, bez użycia typowych słów-kluczy. Do wykrywania takich tytułów potrzebne jest **AI** (analiza intencji, nie fraz).

Przy włączonym AI regex przestaje być tylko detektorem, a staje się **materiałem dowodowym** dla modelu: przekazuje mu, która technika trafiła i w który fragment, a model kalibruje wynik z uwzględnieniem profilu portalu. Powód: definicja clickbaitu jest kontekstowa, czysty regex tego nie rozróżnia.

Świadomy koszt: przy włączonym AI tracimy „offline” i „<10ms” dla tytułów niepewnych (badge regexowy pojawia się natychmiast, werdykt AI później, po kilku do kilkudziesięciu sekund), a „deterministyczna” staje się miękka.

## Prywatność i koszt

Przy włączonym AI do OpenRouter wysyłane są wyłącznie: tekst tytułu, domena portalu, nagłówek działu strony, w którym stoi tytuł, nazwy wykrytych technik i fragmenty tytułu, które je uruchomiły. Nigdy adres (URL) artykułu.

Klucz API przechowywany jest lokalnie w przeglądarce (nieszyfrowany) i nie opuszcza Twojego komputera poza wywołaniami do OpenRouter.

Wywołania modelu płaci właściciel klucza. Koszt ograniczają dwie rzeczy: tytuły pewne dla regexu (wynik 3 i wyżej, bez cytatu) nie idą do modelu, a werdykt zapisuje się w pamięci przeglądarki na 7 dni, więc ten sam tytuł to jedno wywołanie na tydzień, także gdy pojawia się w kilku miejscach strony albo w kilku kartach.

## Czym jest clickbait: 4 filary

Tytuł jest clickbaitem, gdy robi co najmniej jedną z czterech rzeczy:

- **Filar 1: Ukrywa informacje**: celowo nie podaje kluczowego faktu, dając dość kontekstu, by wywołać dyskomfort luki informacyjnej
- **Filar 2: Wyolbrzymia**: język silniejszy, niż fakty uzasadniają
- **Filar 3: Zastępuje fakt emocją**: mówi JAK reagować zamiast CO się stało
- **Filar 4: Fałszywa narracja**: tworzy fabułę (konflikt, punkt kulminacyjny) tam, gdzie jest zwykłe zdarzenie

## Zasady redakcyjne

Instrukcja dla modelu powstała z moich decyzji redakcyjnych, podjętych przy ręcznej ocenie kilku próbek tytułów z portali. Te same zasady stosowałem przy pisaniu wzorców regex.

Jeśli tytuł składa się z więcej niż jednego zdania, ocenia się go w całości. Pierwsze zdanie może być CB, ale drugie może dawać pełną informację, wtedy całość nie jest CB. I odwrotnie: pierwsze zdanie może być OK, ale drugie dodaje clickbaitowy element.

### Kiedy tytuł jest clickbaitem

- **Jeśli jest brak informacji, o czym to, to raczej clickbait.**
- **Jeśli silne emocje zamiast treści, to na pewno clickbait.**
- **Pytanie ocenia się po informacji, nie po formie.** Pytanie sugerujące sensację, której nie ma, to clickbait; pytanie o realną możliwość nie.
- **„Znany bez nazwiska” = zawsze CB**: gdyby był znany, podaliby nazwisko.
- **Niedopowiedzenie udające ważniejszy temat to clickbait.**
- **Szczucie chorobą to clickbait.**
- **Ogólne słowo-zdarzenie bez opisu to clickbait**: gdyby było coś więcej, zbudowaliby na tym tytuł.
- **Brak kraju lub podmiotu w sensacyjnej wiadomości to clickbait.**
- **Mglisty opis zdarzenia, który sugeruje sensację, to clickbait.**
- **Cytat bez mówcy**: jeśli cytat do zrozumienia wymaga wiedzy, kto to powiedział, a tytuł tego nie podaje, to clickbait. Wyobraźnia dopowiada, że mówił ktoś ważny i że to opinia kluczowa. Gdy z tytułu wynika, kto mówi, cytat jest w porządku.
- **Poradnik, który nie mówi, czego dotyczy, to clickbait.** Poradnik bywa graniczny: jego tytuł trudno streścić.
- **Chaos informacyjny to clickbait**: tak mało informacji, że nie wiadomo, o co chodzi, więc trzeba kliknąć.
- **Tytuł grający na FOMO to clickbait.**
- **Materiał promocyjny oceniany jak każdy tytuł.**
- **Słaby clickbait istnieje**: tytuły muszą być atrakcyjne, więc czasem chowają coś, co mogłyby podać.

### Kiedy tytuł informuje

- **Kontekst sekcji decyduje**: pytanie w [ANALIZA], [OPINIA], [DYLEMATY] nie jest clickbaitem.
- **Sport to osobny świat**: „rekordowy” bywa dosłowny, „niesamowity” też.
- **Relacja na żywo to nie tekst po meczu.**
- **Emocje obok podanego wyniku to nie clickbait**: wynik podany, historia opowiedziana.
- **Paradoks ≠ clickbait**: „Pomocnik, który przeszkadzał” UJAWNIA pointę, nie ukrywa.
- **Ukryty szczegół powiązany z podanym sednem to nie clickbait.**
- **Powszechnie znany kontekst uzupełnia tytuł.**
- **Opisowy cytat o nazwanym temacie to nie clickbait.**
- **Wyświechtana opinia nie ma siły clickbaitu.**
- **Pytanie o długą listę to nie clickbait.** Jeśli odpowiedź to jedna albo dwie osoby czy rzeczy, można je podać w tytule.
- **Quizy nie są clickbaitami.**
- **Hatespeech ≠ clickbait**: to inny problem.

### Komentarze

Snarki mają opisywać TECHNIKĘ manipulacji, nie bagatelizować treści. Są trzy poziomy:
- **Pewniaki** (wyśmiewaj): „nie uwierzysz”, „ten trik”, „Polacy oszaleli”, „mówi wprost”
- **Ambiwalentne** (opisz technikę): „dramat”, „skandal”, „ostrzega”, „historyczny”
- **Emocjonalne** (opisz emocje): „brutalne”, „koszmarne”, „dramatyczne”

## 21 kategorii wzorców (447 regexów)

| # | Kategoria | Waga | Przykład triggera |
|---|---|---|---|
| 1 | Ukryta odpowiedź | 2 | "oto co", "jest nagranie", "ujawniono", "kulisy", "nie mogą uwierzyć", "tak wyglądają", "policzyli ile", "ostrzega", "złe wieści", "tak dba/zarabia/mieszka" |
| 2 | Pytajnik w tytule (prawo Betteridge'a) | 1 | Znak `?` w tytule (tylko pytania zamknięte tak/nie; wyłączone: kto/co/gdzie/kiedy/jak/ile/z kim/kogo) |
| 3 | Superlativ / przesada | 1 | "HIT", "szokujące", "skandaliczne", "miazga", "rekordowe", "historyczne", "niebywałe", "bez precedensu", "fatalne", "koszmarny", "deklasacja", "kompromitujące", "skandal", "magiczne", "odrażające", "straszne", "zgroza", "obrzydliwe", "uderza w", "szoruje po dnie", "zrównuje z ziemią" |
| 4 | Obietnica szoku | 2 | "aż się wierzyć nie chce", "trudno uwierzyć", "nie do wiary" |
| 5 | Zaimek wskazujący | 2 | "ten preparat", "ta metoda", "to urządzenie", "te buty", "wyspiarskie państwo", "pierwszy kraj w Europie" |
| 6 | Wyrwany cytat | 0 | Cudzysłów w tytule (waga 0: sam nie uruchamia badge'a; exclude na tytuły programów TV) |
| 7 | Cytat jako przynęta | 1 | "przejmujące słowa", "mocne słowa", "wyznał", "zdradził co" |
| 8 | Dramaturgia serialu | 1 | "ale potem", "są konsekwencje", "zawrzało", "bez litości", "wydał wyrok", "odkrył karty", "i wtedy", "oto powód", "stracił kontrolę", "burza", "awantura", "konflikt", "może zmienić wszystko" |
| 9 | "Polacy oszaleli" | 2 | "Polacy oszaleli", "internet eksplodował", "cała Polska", "wszyscy mówią", "rzucili się", "sypią się", "podzielił" |
| 10 | Emocjonalny szantaż | 2 | "pęknie ci serce", "ciarki", "łzy/łzami", "wzruszy", "mrozi krew", "wyciskają łzy", "na potęgę" |
| 11 | Wyzwanie / rywalizacja | 1 | "a ty?", "większość odpada" (tytuły quizów wyłączone) |
| 12 | Prowokacja / wciąganie | 1 | "z pewnością go znacie", "na pewno widziałeś", "pamiętasz go", "poznajesz" |
| 13 | Ekspresyjne czasowniki | 1 | "nie kryje wściekłości/emocji", "ostro zareagował", "grozi palcem", "trzęsie rynkiem", "bez ogródek", "mówi wprost" |
| 14 | Niedopowiedziana pointa | 1 | "prosty błąd", "jeden szczegół", "na co je stać", "dał do myślenia" |
| 15 | Kwestionowanie wiedzy | 1 | "nie wiedziałeś?", "większość ludzi nie wie", "mało kto zna", "wiesz co/jak" |
| 16 | Ukryta cena/kwota | 1 | "kwota 3-cyfrowa", "a cena?", "tyle kosztuje/otrzymują/zarabia", "za grosze", "kwoty mogą dziwić" |
| 17 | Reklama natywna | 1 | "sprawdza się", "koniec z", "polskiej marki", "skradnie serce", "którą pokochasz" |
| 18 | Celebryci jako przynęta | 1 | "gwiazda pokazała", "celebryta", "najpiękniejsza Polka", "najseksowniejsza" |
| 19 | KRZYK w tytule | 1 | CAPS LOCK (8+ wielkich liter, z exclude na akronimy), CAPS w środku zdania, podwójne wykrzykniki |
| 20 | Cliffhanger / niedokończenie | 1 | "..." (wielokropek na końcu), "miał być zwykły/normalny" |
| 21 | Idiom jako przynęta | 1 | "zapaliła mi się lampka", "szczęka opadła", "krew zagotowała" |

## Skala badge'ów

| Badge | Kolor | Znaczenie |
|---|---|---|
| CB 1 | żółty | Lekki clickbait: jedna technika |
| CB 2-3 | pomarańczowy | Solidny clickbait: kombinacja technik |
| CB 4-5 | czerwony | Ciężki clickbait: wiele technik naraz |
| CB 6+ | pulsujący czerwony | Clickbait atomowy |

Przy włączonym AI ocena modelu (0-100) przechodzi na tę samą skalę: 40 to CB 1, 100 to CB 10. Poniżej 40 badge znika.

## Scoreboard

Pływający panel w prawym dolnym rogu strony (ciemne tło, pomarańczowa ramka) pokazuje:

- **Liczbę wykrytych clickbaitów** (duża czerwona cyfra)
- **Liczbę przeskanowanych tytułów** (szara cyfra)
- **Procent clickbaitu** na stronie (np. „72% tytułów to clickbait”)
- **Status AI** (gdy AI jest włączone): „AI: działa” albo „AI: błąd, oceny z samego regexu”. Szczegóły błędu są w ustawieniach wtyczki

Panel aktualizuje się automatycznie przy każdym skanie (także po dołączeniu nowej treści przez infinite scroll) i po każdym werdykcie modelu.

## Obsługiwane portale (26)

Procent clickbaitu pochodzi z audytów samego regexu (marzec 2026).

| Portal | % clickbaitu | Profil |
|---|---|---|
| gazeta.pl | ~54% | Historyczny poligon: zbiorowość, ukryte odpowiedzi, cytaty |
| onet.pl | ~41% | Pytajniki Betteridge'a, celebryci, quizy |
| wp.pl | ~41% | Ekspresyjne czasowniki, dramaturgia serialowa, CAPS sportowe |
| fakt.pl | ~46% | Klasyczny tabloid: narracja emocjonalna, urgency, cliffhangery |
| interia.pl | ~30% | Portal informacyjny z premium: pytajniki, cytaty, superlativy |
| se.pl | ~60% | Wysoki clickbait: tabloidowy styl |
| plotek.pl | ~100% | Portal plotkarski: prawie każdy tytuł to clickbait |
| pudelek.pl | ~0% | Paradoks: tabloid bez clickbaitu, ujawnia zamiast ukrywać |
| pomponik.pl | ~78% | Portal gossip, narracja emocjonalna, cytaty jako przynęta |
| dziendobry.tvn.pl | ~23% | Niski CB, głównie horoskopy, lifestyle |
| natemat.pl | ~42% | Styl ambiwalentny, dobra zgodność z recenzentem ludzkim |
| o2.pl | ~35% | Portal informacyjny WP-style |
| polsatnews.pl | ~37% | Portal informacyjny |
| tvn24.pl | ~37% | Dominują pytania Betteridge'a (90% wykrytych CB) |
| sport.pl | ~33% | Narracja sportowa (po dodaniu wzorców sportowych) |
| money.pl | niski CB | Portal analityczny: false positive na nagłówkach CAPS naprawiony |
| noizz.pl | niski CB | Lifestyle/wywiady: mało clickbaitu |
| tvrepublika.pl | — | CB polityczny/geopolityczny, superlativy, ukryte tożsamości, DOM H2-bez-linków |
| wyborcza.pl | ~14% | Jakościowe dziennikarstwo: niski clickbait, poprawka „kogo” w Betteridge |
| nczas.com | ~6% | Portal prawicowy: niski CB, głównie cliffhangery, WordPress layout |
| dorzeczy.pl | ~44% | Portal konserwatywny: ciężki quote bait (13x cytat jako przynęta) |
| radiozet.pl | — | Portal radiowy |
| tokfm.pl | — | Portal radiowy |
| rmf24.pl | — | Portal informacyjny/radiowy |
| polskieradio24.pl | — | Portal radiowy publiczny |
| xyz.pl | — | Portal informacyjny |

Portale z dedykowanymi selektorami DOM: **gazeta.pl**, **onet.pl**, **wp.pl**, **tvn24.pl**, **interia.pl**, **fakt.pl**, **pomponik.pl**, **natemat.pl**, **money.pl**, **noizz.pl**, **tvrepublika.pl**, **dziendobry.tvn.pl** i inne. Każdy portal ma zestaw selektorów specyficznych + domyślne (`h1-h4 a`, `article a`, `a[data-ga-action]`).

## Czego sam regex nie wykrywa

Bez AI wtyczka nie łapie clickbaitu narracyjnego: manipulacja jest w strukturze zdań, nie w słowach. Takie tytuły ocenia model, gdy AI jest włączone.

| Tytuł | Dlaczego clickbait | Dlaczego regex nie łapie |
|---|---|---|
| „Miał rodziców obcokrajowców. Do niedawna nazywał się inaczej” | Suspens narracyjny: ukrywa pointę | Brak słowa-klucza, cała manipulacja w strukturze zdań |
| „6 szt. na klienta. Limit konieczny. Kupują kartonami. 2 dni i koniec” | Urgency: krótkie zdania budują panikę | Żaden pojedynczy fragment nie jest clickbaitowy |
| „Lokal dawał klientkom do zrozumienia: Za tania torebka, u nas nie jesz” | Clickbait klasowy/społeczny: budzi oburzenie | Manipulacja jest w treści, nie w słowie |
| „Pedofil gwałcił pasierbicę, matka patrzyła. Jest wyrok” | Szok treścią, nie formą | Treść jest faktycznie szokująca: nie da się odróżnić od clickbaitu |

## Struktura plików

| Plik | Opis |
|---|---|
| `manifest.json` | Manifest Chrome Extension (v3) |
| `cbd-patterns.js` | Wzorce regex, przypisanie kategorii do filarów, analiza tytułu |
| `cbd-judge.js` | Werdykt regexu i wybór tytułów, które idą do modelu |
| `cbd-profiles.js` | Profile portali dla modelu |
| `cbd-prompt.js` | Instrukcja dla modelu (zasady redakcyjne) i budowa zapytania |
| `clickbait-detector.js` | Skrypt strony: selektory, badge, tooltip, scoreboard, aktualizacja werdyktem modelu |
| `background.js` | Service worker: zapytania do OpenRouter, pamięć werdyktów (7 dni), status AI |
| `options.html` / `options.js` | Ustawienia: klucz, włącznik AI, model, test klucza |
| `styles.css` | Style badge'ów, tooltipów i scoreboardu |
| `icon48.png` / `icon128.png` | Ikony wtyczki |
| `METHODOLOGY.md` | Historia projektu i metodologia detekcji |
| `AUDIT.md` | Baza chwytów i wyniki audytów portali |
| `ADAPTING.md` | Jak przerobić wtyczkę na inny język (po angielsku) |
| `examples/` | Prawdziwe tytuły z portali i reakcje wtyczki |

Jak przerobić wtyczkę na angielski albo inny język, opisuje [ADAPTING.md](ADAPTING.md) (po angielsku).

## Historia projektu

Przestałem czytać polskie portale, bo nie znoszę clickbaitów. Zainspirował mnie felieton [„Clickbait, Decoded”](https://www.newyorker.com/humor/shouts-murmurs) z The New Yorker (Jay Martel, Jonathan Stern, marzec 2026), który wyśmiewał clickbaity w prosty i powtarzalny sposób. Pomyślałem, że może da się stworzyć nakładkę do przeglądarki, która „prześwietlałaby” te manipulacje automatycznie.

Użyłem [Claude Code](https://claude.ai/claude-code) (Anthropic) do wygenerowania wtyczki: od pomysłu do działającego rozszerzenia w jednej sesji.

W październiku 2026 (wersje 0.5 i 0.6) doszła warstwa AI. Instrukcję dla modelu zbudowałem z decyzji redakcyjnych podjętych przy ręcznej ocenie tytułów, a domyślny model wybrałem pomiarem na tych ocenach.

Pełna historia i metodologia: [METHODOLOGY.md](METHODOLOGY.md)

## Zastrzeżenia

- Plakietka ocenia konstrukcję tytułu. Nie ocenia rzetelności artykułu, prawdziwości podanych w nim faktów ani intencji autorów.
- Oceny, komentarze i uzasadnienia modelu powstają automatycznie, w chwili wyświetlenia strony, i mogą być błędne.
- Projekt jest niezależny i niezwiązany z wymienionymi portalami. Nazwy portali i cytowane tytuły służą analizie i krytyce.
- Kod udostępniony jest na licencji MIT, bez gwarancji (szczegóły w [LICENSE](LICENSE)).

## Licencja

[MIT](LICENSE): Marcin Maj Sawicki, 2026

---

## English

Clickbait Dekoder is a Chrome extension that decodes clickbait headlines on Polish news sites.

It works on Polish sites and Polish headlines only. Badges, tooltips, comments and the settings page are in Polish. Want it for English or another language? See [ADAPTING.md](ADAPTING.md).

For every clickbait it detects, it adds a coloured badge (CB 1-10) and a tooltip that shows **exactly which word triggered the detection**, with a snarky comment in the style of a New Yorker humour piece.

It works in two layers. Regex patterns put the badge up instantly, with no key and no internet connection. Headlines the regex is unsure about can also be judged by an AI model. The AI layer is optional and off by default: you switch it on in the extension settings with your own OpenRouter key.

### What it looks like

Headline: *„Fundamentalna zmiana”. Polacy odkryli, jak obniżyć koszty kredytów* ("A fundamental change". Poles have discovered how to cut the cost of their loans)

> Badge: **CB 3** (solid clickbait)

Tooltip (translated):
> **SUPERLATIVE**
> *"Fundamental" — fundamental like every change you'll have forgotten in a week.*
>
> **"POLES HAVE GONE MAD"**
> *"Poles have discovered" — replace with "a few people from Radom read the article". Still want to click?*

#### Real headlines, 19 October 2026 (translated)

Four of the 50 headlines from 10 sites in [examples/2026-10-19-tytuly.md](examples/2026-10-19-tytuly.md) (Polish). Headlines, comments and model reasons below are English translations; the extension shows them in Polish.

| Headline | Badge | Source | Comment | Model's reason |
|---|---|---|---|---|
| „Na Wszystkich Świętych robię przepyszną galaretę. Używam tylko tych mięs” (For All Saints' Day I make a delicious meat jelly. I only use these meats), gazeta.pl | CB 7 | AI | A classic culinary trick: instead of serving the ingredients on a platter, the editors hide the pork behind a demonstrative pronoun. | The headline deliberately hides the key information behind the demonstrative "these meats", forcing a click to get the recipe. |
| „Gwałtowne ulewy w turystycznym kraju. Wydano nakaz pozostania w domach” (Violent downpours in a tourist country. Stay-at-home order issued), wp.pl | CB 7 | AI | Geography according to the tabloids: every country south of the Baltic simply becomes a "tourist country". | The headline conceals the name of the country hit by the disaster, replacing it with a vague phrase about a "tourist country". |
| „Jest jak nowy! Niezwykłe odkrycie podczas remontu. Historyczny napis znów zdobi wejście do kamienicy” (Good as new! An extraordinary discovery during renovation. A historic inscription adorns the tenement entrance once again), se.pl | CB 3 | regex | "Extraordinary discovery" — they could have described it, but they didn't. Because a description doesn't get clicked as well. | |
| „USA nie wykluczają odwetu wobec UE. Chodzi o Starlinka” (The US doesn't rule out retaliation against the EU. It's about Starlink), tvn24.pl | — | AI | | The headline reliably reports the US threat of retaliation against the EU and gives the reason for the dispute straight away. |

### Installation

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Turn on **Developer mode** (top right corner)
4. Click **Load unpacked**
5. Point it to the folder with the extension files
6. Open any supported site

The regex layer works from this point on. The AI layer is switched on separately (below).

### Turning on AI

1. Generate a key at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Open the extension settings: `chrome://extensions` → Clickbait Dekoder → **Details** → **Extension options**
3. Paste your **OpenRouter API key** („Klucz API OpenRouter”)
4. Tick **„Używaj modelu AI do dosądzania niepewnych tytułów”** (use an AI model to judge uncertain headlines)
5. Pick a model (default: Gemini 3.8 Flash) and click **Zapisz** (Save)
6. **Test klucza** (Test key) shows whether the key and the model work

There are four models to choose from:

| Model | Description in settings |
|---|---|
| Gemini 3.8 Flash | default, most accurate |
| Gemini 2.5 Flash | cheaper, lets more clickbait through |
| Gemini 2.5 Flash-Lite | cheapest, more false alarms |
| GPT-4.1 mini | |

The default model runs with limited thinking (reasoning effort "low"). I picked it by measurement on hand-labelled headlines. What mattered was a low false-alarm rate: the badge carries a snarky comment, so a false alarm is an unfair accusation against the newsroom.

### How it works

1. **DOM scan**: once the page loads, the extension searches link and heading elements, using selectors specific to each site (plus a default set)
2. **Regex matching**: every headline (20-250 characters) is tested against 447 regex patterns in 21 categories
3. **Scoring**: each matched category adds its weight (1 or 2) to the score; the maximum score is 10
4. **Badge on the image**: for detected clickbait, the badge (CB 1-10) goes on the related image (if there is one and it links to the same article) rather than into the text: easier to see, and it doesn't break the layout
5. **Model judgement** (when AI is on): uncertain headlines, meaning a regex score of 0, 1 or 2, go to the model in batches together with whatever the regex found in them. The model rates the headline from 0 to 100, assigns clickbait pillars and writes a comment. A regex score of 3 or more stays as it is, and the model doesn't check it. The exception: every headline with a quote goes to the model, because the regex confuses quotes with TV show titles
6. **Badge update**: the model's verdict changes, removes or adds a badge. A headline in which the regex found nothing gets a badge only once the model judges it to be clickbait
7. **Tooltip**: hovering over the badge shows a tooltip with the category name, the matched fragment and a snarky comment
8. **Scoreboard**: a floating, draggable panel in the bottom right corner shows the number of clickbait headlines detected, the number of headlines scanned and the percentage of clickbait on the page
9. **MutationObserver**: the extension watches dynamically loaded content (infinite scroll) and scans new elements automatically

### Regex and model: two layers

The regex layer always works, with no key:
- **Offline**: zero latency, zero cost, zero data sent anywhere
- **Fast**: scanning a whole page takes <10ms
- **Transparent**: every pattern can be read and understood
- **Deterministic**: same headline = same result

Regex is great at catching **signal phrases** ("here's what", "you won't believe", "sensation"). But it misses **narrative clickbait**: headlines that build tension through the arrangement of sentences alone, without the usual keywords. Catching those takes **AI** (analysing intent, not phrases).

With AI on, the regex stops being only a detector and becomes **evidence** for the model: it tells the model which technique fired and on which fragment, and the model calibrates the result taking the site's profile into account. The reason: the definition of clickbait depends on context, and plain regex can't tell the difference.

The conscious trade-off: with AI on, uncertain headlines lose "offline" and "<10ms" (the regex badge appears instantly, the AI verdict later, after a few to a few dozen seconds), and "deterministic" becomes soft.

### Privacy and cost

With AI on, only the following is sent to OpenRouter: the headline text, the site's domain, the heading of the page section the headline sits in, the names of the detected techniques and the headline fragments that triggered them. Never the article's address (URL).

The API key is stored locally in the browser (unencrypted) and doesn't leave your computer except in calls to OpenRouter.

Model calls are paid for by the key's owner. Two things keep the cost down: headlines the regex is sure about (score 3 or more, no quote) don't go to the model, and each verdict is kept in the browser's storage for 7 days, so the same headline means one call a week, even when it appears in several places on the page or in several tabs.

### What clickbait is: 4 pillars

A headline is clickbait when it does at least one of four things:

- **Pillar 1: It hides information**: it deliberately withholds the key fact, while giving enough context to create the discomfort of an information gap
- **Pillar 2: It exaggerates**: the language is stronger than the facts justify
- **Pillar 3: It replaces fact with emotion**: it tells you HOW to react instead of WHAT happened
- **Pillar 4: It invents a narrative**: it builds a plot (conflict, climax) where there is an ordinary event

### Editorial rules

The model's instructions grew out of my editorial decisions, made while labelling several samples of headlines from these sites by hand. I applied the same rules when writing the regex patterns.

A headline made of more than one sentence is judged as a whole. The first sentence may be clickbait while the second gives the full information, and then the whole is not clickbait. And the other way round: the first sentence may be fine, while the second adds a clickbait element.

#### When a headline is clickbait

- **If it's unclear what it's about, it's probably clickbait.**
- **Strong emotions in place of content: definitely clickbait.**
- **A question is judged by its information, not its form.** A question suggesting a sensation that isn't there is clickbait; a question about a real possibility isn't.
- **"A well-known person" with no name = always clickbait**: if they were well known, they'd have given the name.
- **Understatement posing as a bigger story is clickbait.**
- **Using someone's illness as bait is clickbait.**
- **A vague event-word with no description is clickbait**: if there were more to it, they'd have built the headline on it.
- **A sensational story with no country or subject is clickbait.**
- **A foggy description of an event that suggests a sensation is clickbait.**
- **A quote with no speaker**: if understanding the quote requires knowing who said it, and the headline doesn't say, it's clickbait. Imagination fills in that someone important said it and that it's a key opinion. When the headline makes clear who is speaking, the quote is fine.
- **A how-to that doesn't say what it's about is clickbait.** How-tos can be borderline: their headlines are hard to summarise.
- **Information chaos is clickbait**: so little information that you can't tell what it's about, so you have to click.
- **A headline playing on FOMO is clickbait.**
- **Promotional content is judged like any other headline.**
- **Weak clickbait exists**: headlines have to be attractive, so sometimes they hold back something they could have said.

#### When a headline informs

- **The section's context decides**: a question under [ANALIZA] (analysis), [OPINIA] (opinion) or [DYLEMATY] (dilemmas) is not clickbait.
- **Sport is a world of its own**: "record-breaking" is often literal, and so is "incredible".
- **A live report is not a post-match piece.**
- **Emotions next to a stated result are not clickbait**: the result is given, the story is told.
- **Paradox ≠ clickbait**: "The midfielder who got in the way" REVEALS the punchline rather than hiding it.
- **A hidden detail tied to a stated core is not clickbait.**
- **Widely known context completes the headline.**
- **A descriptive quote on a named subject is not clickbait.**
- **A worn-out opinion has no clickbait power.**
- **A question about a long list is not clickbait.** If the answer is one or two people or things, they could have been given in the headline.
- **Quizzes are not clickbait.**
- **Hate speech ≠ clickbait**: that's a different problem.

#### Comments

The snarky comments are meant to describe the TECHNIQUE of manipulation, not to belittle the content. There are three levels:
- **Sure things** (mock them): „nie uwierzysz” (you won't believe), „ten trik” (this trick), „Polacy oszaleli” (Poles have gone mad), „mówi wprost” (says it straight)
- **Ambivalent** (describe the technique): „dramat” (drama), „skandal” (scandal), „ostrzega” (warns), „historyczny” (historic)
- **Emotional** (describe the emotion): „brutalne” (brutal), „koszmarne” (nightmarish), „dramatyczne” (dramatic)

### 21 pattern categories (447 regexes)

Triggers are Polish; English glosses in brackets.

| # | Category | Weight | Example triggers |
|---|---|---|---|
| 1 | Hidden answer | 2 | "oto co" (here's what), "jest nagranie" (there's footage), "kulisy" (behind the scenes), "nie mogą uwierzyć" (they can't believe it), "złe wieści" (bad news) |
| 2 | Question headline (Betteridge's law) | 1 | `?` in the headline (closed yes/no questions only; questions with who/what/where/when/how/how much are excluded) |
| 3 | Superlative / exaggeration | 1 | "HIT", "szokujące" (shocking), "miazga" (a crushing), "bez precedensu" (unprecedented), "zgroza" (horror), "szoruje po dnie" (scrapes the bottom) |
| 4 | Shock promise | 2 | "aż się wierzyć nie chce" (hard to believe), "nie do wiary" (unbelievable) |
| 5 | Demonstrative pronoun | 2 | "ten preparat" (this supplement), "ta metoda" (this method), "wyspiarskie państwo" (an island nation), "pierwszy kraj w Europie" (the first country in Europe) |
| 6 | Out-of-context quote | 0 | Quotation marks in the headline (weight 0: never triggers a badge on its own; TV show titles excluded) |
| 7 | Quote as bait | 1 | "przejmujące słowa" (moving words), "mocne słowa" (strong words), "wyznał" (he confessed) |
| 8 | Soap-opera drama | 1 | "ale potem" (but then), "zawrzało" (things boiled over), "i wtedy" (and then), "burza" (storm), "może zmienić wszystko" (could change everything) |
| 9 | "Poles have gone mad" | 2 | "Polacy oszaleli" (Poles have gone mad), "internet eksplodował" (the internet exploded), "cała Polska" (all of Poland), "wszyscy mówią" (everyone's talking) |
| 10 | Emotional blackmail | 2 | "pęknie ci serce" (it'll break your heart), "ciarki" (chills), "łzy" (tears), "mrozi krew" (blood-curdling) |
| 11 | Challenge / competition | 1 | "a ty?" (and you?), "większość odpada" (most people fail); quiz headlines excluded |
| 12 | Provocation / pulling in | 1 | "z pewnością go znacie" (you surely know him), "pamiętasz go" (remember him?), "poznajesz" (recognise them?) |
| 13 | Expressive verbs | 1 | "nie kryje wściekłości" (can't hide her fury), "ostro zareagował" (reacted sharply), "bez ogródek" (bluntly), "mówi wprost" (says it straight) |
| 14 | Unspoken punchline | 1 | "prosty błąd" (a simple mistake), "jeden szczegół" (one detail), "dał do myślenia" (gave food for thought) |
| 15 | Questioning your knowledge | 1 | "nie wiedziałeś?" (didn't you know?), "mało kto zna" (few people know) |
| 16 | Hidden price / amount | 1 | "kwota 3-cyfrowa" (a 3-digit sum), "a cena?" (and the price?), "tyle kosztuje" (this is what it costs), "za grosze" (for pennies) |
| 17 | Native advertising | 1 | "sprawdza się" (works great), "koniec z" (no more), "polskiej marki" (from a Polish brand), "którą pokochasz" (you'll love) |
| 18 | Celebrity bait | 1 | "gwiazda pokazała" (a star showed), "celebryta" (celebrity), "najpiękniejsza Polka" (the most beautiful Polish woman) |
| 19 | SHOUTING | 1 | CAPS LOCK (8+ capital letters, acronyms excluded), caps mid-sentence, double exclamation marks |
| 20 | Cliffhanger | 1 | "..." (ellipsis at the end), "miał być zwykły" (it was supposed to be ordinary) |
| 21 | Idiom as bait | 1 | "zapaliła mi się lampka" (a warning light went on), "szczęka opadła" (jaw dropped), "krew zagotowała" (blood boiled) |

### Badge scale

| Badge | Colour | Meaning |
|---|---|---|
| CB 1 | yellow | Light clickbait: one technique |
| CB 2-3 | orange | Solid clickbait: a combination of techniques |
| CB 4-5 | red | Heavy clickbait: many techniques at once |
| CB 6+ | pulsing red | Atomic clickbait |

With AI on, the model's rating (0-100) maps onto the same scale: 40 is CB 1, 100 is CB 10. Below 40 the badge disappears.

### Scoreboard

A floating panel in the bottom right corner of the page (dark background, orange border) shows:

- **The number of clickbait headlines detected** (big red number)
- **The number of headlines scanned** (grey number)
- **The percentage of clickbait** on the page (e.g. "72% tytułów to clickbait", 72% of headlines are clickbait)
- **AI status** (when AI is on): „AI: działa” (AI: working) or „AI: błąd, oceny z samego regexu” (AI: error, ratings from regex only). Error details are in the extension settings

The panel updates automatically with every scan (including when new content arrives through infinite scroll) and after every model verdict.

### Supported sites (26)

Clickbait percentages come from audits of the regex alone (March 2026).

| Site | % clickbait | Profile |
|---|---|---|
| gazeta.pl | ~54% | The original testing ground: collectives, hidden answers, quotes |
| onet.pl | ~41% | Betteridge questions, celebrities, quizzes |
| wp.pl | ~41% | Expressive verbs, soap-opera drama, sports CAPS |
| fakt.pl | ~46% | Classic tabloid: emotional narrative, urgency, cliffhangers |
| interia.pl | ~30% | News portal with premium content: questions, quotes, superlatives |
| se.pl | ~60% | High clickbait: tabloid style |
| plotek.pl | ~100% | Gossip site: almost every headline is clickbait |
| pudelek.pl | ~0% | Paradox: a tabloid without clickbait, it reveals instead of hiding |
| pomponik.pl | ~78% | Gossip site, emotional narrative, quotes as bait |
| dziendobry.tvn.pl | ~23% | Low clickbait, mostly horoscopes, lifestyle |
| natemat.pl | ~42% | Ambivalent style, good agreement with the human reviewer |
| o2.pl | ~35% | WP-style news portal |
| polsatnews.pl | ~37% | News portal |
| tvn24.pl | ~37% | Dominated by Betteridge questions (90% of detected clickbait) |
| sport.pl | ~33% | Sports narrative (after adding sports patterns) |
| money.pl | low | Analytical portal: false positive on CAPS headings fixed |
| noizz.pl | low | Lifestyle/interviews: little clickbait |
| tvrepublika.pl | — | Political/geopolitical clickbait, superlatives, hidden identities, DOM with H2s without links |
| wyborcza.pl | ~14% | Quality journalism: low clickbait, "kogo" (whom) fix in Betteridge |
| nczas.com | ~6% | Right-wing portal: low clickbait, mostly cliffhangers, WordPress layout |
| dorzeczy.pl | ~44% | Conservative portal: heavy quote bait (13x quote as bait) |
| radiozet.pl | — | Radio portal |
| tokfm.pl | — | Radio portal |
| rmf24.pl | — | News/radio portal |
| polskieradio24.pl | — | Public radio portal |
| xyz.pl | — | News portal |

Sites with dedicated DOM selectors: **gazeta.pl**, **onet.pl**, **wp.pl**, **tvn24.pl**, **interia.pl**, **fakt.pl**, **pomponik.pl**, **natemat.pl**, **money.pl**, **noizz.pl**, **tvrepublika.pl**, **dziendobry.tvn.pl** and others. Each site has its own set of selectors plus the defaults (`h1-h4 a`, `article a`, `a[data-ga-action]`).

### What regex alone can't catch

Without AI the extension misses narrative clickbait: the manipulation is in the structure of the sentences, not in the words. With AI on, the model judges these headlines.

| Headline | Why it's clickbait | Why regex misses it |
|---|---|---|
| „Miał rodziców obcokrajowców. Do niedawna nazywał się inaczej” (His parents were foreigners. Until recently he had a different name) | Narrative suspense: hides the punchline | No keyword, all the manipulation is in the sentence structure |
| „6 szt. na klienta. Limit konieczny. Kupują kartonami. 2 dni i koniec” (6 per customer. Limit needed. They're buying by the box. 2 days and it's over) | Urgency: short sentences build panic | No single fragment is clickbait |
| „Lokal dawał klientkom do zrozumienia: Za tania torebka, u nas nie jesz” (The restaurant made it clear to customers: bag too cheap, you don't eat here) | Class/social clickbait: stirs outrage | The manipulation is in the content, not in a word |
| „Pedofil gwałcił pasierbicę, matka patrzyła. Jest wyrok” (Paedophile raped his stepdaughter while her mother watched. There's a verdict) | Shock through content, not form | The content really is shocking: impossible to tell apart from clickbait |

### Files

| File | Description |
|---|---|
| `manifest.json` | Chrome Extension manifest (v3) |
| `cbd-patterns.js` | Regex patterns, mapping of categories to pillars, headline analysis |
| `cbd-judge.js` | Regex verdict and the choice of headlines that go to the model |
| `cbd-profiles.js` | Site profiles for the model |
| `cbd-prompt.js` | Model instructions (editorial rules) and request building |
| `clickbait-detector.js` | Page script: selectors, badge, tooltip, scoreboard, updates from model verdicts |
| `background.js` | Service worker: OpenRouter requests, verdict storage (7 days), AI status |
| `options.html` / `options.js` | Settings: key, AI switch, model, key test |
| `styles.css` | Styles for badges, tooltips and the scoreboard |
| `icon48.png` / `icon128.png` | Extension icons |
| `METHODOLOGY.md` | Project history and detection methodology (Polish) |
| `AUDIT.md` | Catalogue of techniques and site audit results (Polish) |
| `ADAPTING.md` | How to adapt the extension to another language |
| `examples/` | Real headlines from the sites and the extension's reactions (Polish) |

### Project history

I stopped reading Polish news sites because I can't stand clickbait. I was inspired by the New Yorker piece ["Clickbait, Decoded"](https://www.newyorker.com/humor/shouts-murmurs) (Jay Martel, Jonathan Stern, March 2026), which mocked clickbait in a simple, repeatable way. I thought it might be possible to build a browser overlay that would "X-ray" these manipulations automatically.

I used [Claude Code](https://claude.ai/claude-code) (Anthropic) to generate the extension: from idea to working extension in a single session.

In October 2026 (versions 0.5 and 0.6) the AI layer arrived. I built the model's instructions from editorial decisions made while labelling headlines by hand, and picked the default model by measurement on those labels.

Full history and methodology (Polish): [METHODOLOGY.md](METHODOLOGY.md)

### Disclaimer

- A badge rates how a headline is built. It does not rate the article's reliability, the truth of the facts in it or the authors' intentions.
- The model's ratings, comments and reasons are generated automatically, when the page is displayed, and may be wrong.
- This is an independent project, not affiliated with any of the sites listed. Site names and quoted headlines are used for analysis and criticism.
- The code is released under the MIT license, without warranty (see [LICENSE](LICENSE)).

### License

[MIT](LICENSE): Marcin Maj Sawicki, 2026
