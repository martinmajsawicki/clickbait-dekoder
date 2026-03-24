# Metodologia i historia projektu

## Geneza

Przestalem czytac polskie portale informacyjne. Nie dlatego, ze nie interesuja mnie wiadomosci — dlatego, ze nie znosze clickbaitow. Kazdy tytul to obietnica sensacji, za ktora kryje sie banalnosc. Po kilku latach klikania i zalowania postanowilem przestac.

W marcu 2026 trafilem na felieton **"Clickbait, Decoded"** Jay'a Martela i Jonathana Sterna w The New Yorker (Shouts & Murmurs, 12.03.2026). Autorzy wzieli clickbaitowe tytuly i odczytali je doslownie. Efekt byl genialny w swojej prostocie:

- "She Rubbed an Onion on Her Face Every Morning — the Results Changed Her Life" → Nikt nie chcial z nia przebywac.
- "This Common Kitchen Ingredient Could Save Your Life" → Szklanka wody.

Pomyslalem: skoro mechanizm jest tak powtarzalny, to moze da sie go zautomatyzowac?

## Od felietonu do wtyczki

Zaczalem od analizy. Przegladalem strone glowna gazeta.pl (22 marca 2026) i zebralem 25 tytulow. 24 z 25 uzywaly co najmniej dwoch technik clickbaitowych jednoczesnie. Wzorce byly oczywiste — te same chwyty powtarzaly sie w kolko.

Spisalem 10 zasad dekodowania clickbaitu i ich odwrotnosc (10 zasad tworzenia). Potem pomyslalem: a gdyby przegladarka robila to automatycznie?

Uzylem Claude Code do wygenerowania prototypu wtyczki Chrome. Pierwsza wersja (v1) liczyla 10 kategorii wzorcow i generyczne komentarze. Testowanie na zywej stronie gazeta.pl pokazalo, ze:
- Selektory DOM byly za ogolne (gazeta.pl nie uzywa standardowych h1-h4 na naglowki)
- Prog detekcji (score >= 2) pomijal polowe clickbaitow
- Komentarze byly nudne — brakowalo im zloscliwosci oryginalu

## Iteracje

**v1 → v2**: Rozszerzenie z 10 do 16 kategorii wzorcow po dokladnej analizie pominietch tytulow. Dodano: obietnice szoku, prowokacje, wyzwania, ekspresyjne czasowniki, niedopowiedziana pointe, CAPS LOCK. Poprawiono selektory per-portal.

**v2 → v3**: Kluczowa zmiana — kazdy regex dostal swoj wlasny, kontekstowy komentarz ("snark"). Zamiast generycznego "Odejmij 95% dramaturgii" tooltip pokazuje teraz dokladnie KTORE slowo uruchomilo detekcje i daje mu spersonalizowany komentarz w stylu New Yorkera.

**v3 → v0.4**: Masowa ekspansja — 21 kategorii, 407 wzorcow, 26 portali. Szczegolowy audyt 16 portali z human review kazdego tytulu. Dodano: idiomy jako CB, zbitki miedzyzdaniowe, "znany bez nazwiska", interaktywne snarki na ambiwalentnych slowach, exclude na nazwy programow TV i akronimy. Skrypt auto-audytu (Puppeteer + Gemini Flash via OpenRouter).

**v0.4 → v0.5**: 443 wzorcow. Audyt wszystkich 26 portali. 4-filarowa definicja clickbaitu (ukrywanie informacji, wyolbrzymianie, emocja zamiast faktu, falszywa narracja). Persona redaktora z Big Five dla LLM-sedzi. Profile portali z bayesowskim priorem. 2-fazowy pipeline audytu: Gemini Flash (sedzia) + Claude Sonnet (reviewer + auto-fixy). Tracking metryk (error_rate, precision, recall, F1). Flaga --auto do automatycznych poprawek.

Przyklad: tytul zawiera "Polacy odkryli" → tooltip pokazuje:
> **"Polacy odkryli"** — zamien na "kilka osob z Radomia przeczytalo artykul". Nadal chcesz kliknac?

## Metodologia detekcji

Wtyczka nie uzywa AI — opiera sie na wzorcach regexowych (pattern matching). To swiadomy wybor:

1. **Dziala offline** — zero latencji, zero kosztow API, zero problemow z prywatnosciq
2. **Deterministyczna** — ten sam tytul zawsze dostaje ten sam wynik
3. **Transparentna** — kazdy wzorzec mozna przeczytac i zrozumiec
4. **Szybka** — skanowanie calej strony trwa <10ms

### 21 kategorii wzorcow (443 regexow)

Kazda kategoria ma wage (weight), ktora wplywa na score:

| Kategoria | Waga | Przyklad triggera |
|---|---|---|
| Ukryta odpowiedz | 2 | "oto co", "jest nagranie", "kulisy", "biją na alarm" |
| Pytajnik w tytule (prawo Betteridge'a) | 1 | pytanie zamkniete tak/nie |
| Superlativ / przesada | 1 | "HIT", "szokujace", "miazga", "doi Polakow" |
| Obietnica szoku | 2 | "az sie wierzyc nie chce", "nikt sie nie spodziewal" |
| Zaimek wskazujacy | 2 | "ten preparat", "ta metoda", "On/Ona/Ich" na pocz. |
| Wyrwany cytat | 0 | cudzyslow w tytule (sam nie daje badge) |
| Cytat jako przyneta | 1 | "mowi wprost", "przerwal milczenie" |
| Dramaturgia serialu | 1 | "zapadla cisza", "i wtedy", "dzialo sie" |
| Zbiorowosc | 2 | "Polacy oszaleli", "zaskoczylo wszystkich" |
| Emocjonalny szantaz | 2 | "peknie ci serce", "ciarki", "lamie serce" |
| Wyzwanie / rywalizacja | 1 | "a ty?", "wiekszosc odpada" |
| Prowokacja | 1 | "z pewnoscia go znacie", "no to uwazaj" |
| Ekspresyjne czasowniki | 1 | "nie przebierala w slowach", "ostro zareagowal" |
| Niedopowiedziana pointa | 1 | "prosty blad", "pokochasz ten", "kolejny [X]" |
| Kwestionowanie wiedzy | 1 | "nie wiedziales?", "malo kto zna" |
| Ukryta cena | 1 | "kwota 3-cyfrowa", "tyle zaplacisz" (bez kwoty!) |
| Reklama natywna | 1 | "sprawdza sie", "chroniq przed", "koniec z" |
| Celebryci jako przyneta | 1 | "gwiazda pokazala", "znany aktor" (bez nazwiska!) |
| KRZYK w tytule | 1 | CAPS LOCK (z exclude na akronimy), wykrzykniki |
| Cliffhanger / niedokonczenie | 1 | wielokropek, "stalo sie", "to malo powiedziane" |
| Idiom jako przyneta | 1 | "zapalila sie lampka", "szczeka opadla", "krew zagotowala" |

### Kluczowe decyzje edytorskie

1. **Trzy poziomy snarkow**:
   - **Pewniaki** (wysmiewaj): "nie uwierzysz", "ten trik", "Polacy oszaleli", "mowi wprost"
   - **Ambiwalentne** (opisz technike): "dramat", "skandal", "ostrzega", "historyczny"
   - **Emocjonalne** (opisz emocje): "brutalne", "koszmarne", "dramatyczne"

2. **Clickbait = 4 filary** (nie samo slowo):
   - **Filar 1: Ukrywa informacje** — celowo nie podaje kluczowego faktu, dajac dosc kontekstu by wywoalc dyskomfort luki informacyjnej
   - **Filar 2: Wyolbrzymia** — jezyk silniejszy niz fakty uzasadniaja
   - **Filar 3: Zastepuje fakt emocja** — mowi JAK reagowac zamiast CO sie stalo
   - **Filar 4: Falszywa narracja** — tworzy fabule (konflikt, punkt kulminacyjny) tam, gdzie jest zwykle zdarzenie

3. **Kontekst sekcji decyduje** — pytanie w [ANALIZA], [OPINIA], [DYLEMATY] nie jest clickbaitem.

4. **Sport to osobny swiat** — "rekordowy" bywa doslowny, "niesamowity" tez. Narracja sportowa != clickbait.

5. **"Znany bez nazwiska" = zawsze CB** — gdyby byl znany, podaliby nazwisko.

6. **Paradoks != clickbait** — "Pomocnik, ktory przeszkadzal" UJAWNIA pointe, nie ukrywa.

7. **Hatespeech != clickbait** — porownanie malzenstwa gejow do malzenstwa z koza to hatespeech, nie clickbait. Inny problem.

### Scoring

- **CB 1** (zolty) — lekki clickbait, jedna technika o wadze 1
- **CB 2-3** (pomaranczowy) — solidny clickbait, kombinacja technik
- **CB 4-5** (czerwony) — ciezki clickbait, wiele technik jednoczesnie
- **CB 6+** (pulsujacy czerwony) — clickbait atomowy

Score >= 1 uruchamia badge. To swiadomie niski prog — na polskich portalach informacyjnych wieksosc tytulow zawiera co najmniej jeden chwyt.

### Znane ograniczenia (granica regex)

Clickbait **strukturalny** — manipulacja jest w strukturze zdan, nie w slowach:
- "Mial rodzicow obcokrajowcow. Do niedawna nazywal sie inaczej"
- "6 szt. na klienta. Limit konieczny. Kupuja kartonami"
- Brak podmiotu w zdaniu (regexem nie sprawdzisz, czy zdanie ma podmiot)

Na to potrzebne AI (planowane jako opcjonalny tryb on-hover).

## Psychologia — dlaczego clickbait dziala

Wtyczka opiera sie na badaniach George'a Loewensteina z Carnegie Mellon University (1994), ktory opisal mechanizm **luki informacyjnej** (information gap): gdy widzimy luke w wiedzy, mozg odczuwa dyskomfort i chce ja zamknac. Clickbait celowo tworzy te luke — a po drugiej stronie jest zwykle banalnosc.

Kluczowe odkrycie z analizy 26 polskich portali: najczesciej lacza **ukryta odpowiedz + emocjonalny wzmacniacz + zbiorcowy podmiot**. Ta triada to motor 90% clickbaitow.

## Narzedzia

Projekt stworzony przy uzyciu [Claude Code](https://claude.ai/claude-code) (Anthropic) — od pierwszego pomyslu do dzialajacego rozszerzenia Chrome w trzech sesjach. Claude Code generowal kod, testowal wzorce na zywych danych (wstrzykujac JS przez Chrome automation), iterowal na podstawie feedback'u.

Skrypt auto-audytu (Puppeteer + Gemini Flash via OpenRouter) automatyzuje zbieranie tytulow i wstepna ocene — ale decyzje edytorskie podejmuje czlowiek.

## Zrodla i inspiracje

- Jay Martel, Jonathan Stern — *Clickbait, Decoded*, The New Yorker, 12.03.2026
- George Loewenstein — *The Psychology of Curiosity: A Review and Reinterpretation*, 1994
- [Downworthy](https://downworthy.snipe.net/) — plugin przegladarkowy zamieniajacy hiperbole na cyniczne odpowiedniki (inspiracja, ang.)
- [Headline Cleaner](https://headlinecleaner.com/) — AI dekoder naglowkow (inspiracja, ang.)
- 26 polskich portali informacyjnych — zrodla zywych przykladow do analizy

## Licencja

MIT — uzywaj, modyfikuj, dystrybuuj. Powolanie na autora mile widziane.
