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

Uzylem Claude Code do wygenerowania prototypu wtyczki Chrome. Pierwsza wersja (v1) leczyla 10 kategorii wzorcow i generyczne komentarze. Testowanie na zywej stronie gazeta.pl pokazalo, ze:
- Selektory DOM byly za ogolne (gazeta.pl nie uzywa standardowych h1-h4 na naglowki)
- Prog detekcji (score >= 2) pomijal polowe clickbaitow
- Komentarze byly nudne — brakowalo im zloscliwosci oryginalu

## Iteracje

**v1 → v2**: Rozszerzenie z 10 do 16 kategorii wzorcow po dokladnej analizie pominietch tytulow. Dodano: obietnice szoku, prowokacje, wyzwania, ekspresyjne czasowniki, niedopowiedziana pointe, CAPS LOCK. Poprawiono selektory per-portal.

**v2 → v3**: Kluczowa zmiana — kazdy regex dostal swoj wlasny, kontekstowy komentarz ("snark"). Zamiast generycznego "Odejmij 95% dramaturgii" tooltip pokazuje teraz dokladnie KTORE slowo uruchomilo detekcje i daje mu spersonalizowany komentarz w stylu New Yorkera.

Przyklad: tytul zawiera "Polacy odkryli" → tooltip pokazuje:
> **"Polacy odkryli"** — zamien na "kilka osob z Radomia przeczytalo artykul". Nadal chcesz kliknac?

## Metodologia detekcji

Wtyczka nie uzywa AI — opiera sie na wzorcach regexowych (pattern matching). To swiadomy wybor:

1. **Dziala offline** — zero latencji, zero kosztow API, zero problemow z prywatnosciq
2. **Deterministyczna** — ten sam tytul zawsze dostaje ten sam wynik
3. **Transparentna** — kazdy wzorzec mozna przeczytac i zrozumiec
4. **Szybka** — skanowanie calej strony trwa <10ms

### 16 kategorii wzorcow

Kazda kategoria ma wage (weight), ktora wplywa na score:

| Kategoria | Waga | Przyklad triggera |
|---|---|---|
| Ukryta odpowiedz | 2 | "oto co", "jest nagranie", "kulisy" |
| Superlativ / przesada | 1 | "HIT", "szokujace", "miazga" |
| Obietnica szoku | 2 | "az sie wierzyc nie chce" |
| Zaimek wskazujacy | 2 | "ten preparat", "ta metoda" |
| Wyrwany cytat | 1 | cudzyslow w tytule |
| Dramaturgia serialu | 1 | "zaczelo sie niewinnie", "sa konsekwencje" |
| Zbiorowosc | 2 | "Polacy oszaleli", "bez szans" |
| Emocjonalny szantaz | 2 | "peknie ci serce", "ciarki" |
| Wyzwanie / rywalizacja | 1 | "a ty?", "wiekszosc odpada" |
| Prowokacja | 1 | "z pewnoscia go znacie" |
| Ekspresyjne czasowniki | 1 | "reaguje na", "grozi palcem" |
| Niedopowiedziana pointa | 1 | "prosty blad", "na co je stac" |
| Kwestionowanie wiedzy | 1 | "nie wiedziales?" |
| Ukryta cena | 1 | "kwota 3-cyfrowa", "a cena?" |
| Celebryci jako przyneta | 1 | "gwiazda pokazala" |
| KRZYK w tytule | 1 | CAPS LOCK, wykrzykniki |

### Scoring

- **CB 1** (zolty) — lekki clickbait, jedna technika o wadze 1
- **CB 2-3** (pomaranczowy) — solidny clickbait, kombinacja technik
- **CB 4-5** (czerwony) — ciezki clickbait, wiele technik jednoczesnie
- **CB 6+** (pulsujacy czerwony) — clickbait atomowy

Score >= 1 uruchamia badge. To swiadomie niski prog — na polskich portalach informacyjnych wieksosc tytulow zawiera co najmniej jeden chwyt.

## Psychologia — dlaczego clickbait dziala

Wtyczka opiera sie na badaniach George'a Loewensteina z Carnegie Mellon University (1994), ktory opisal mechanizm **luki informacyjnej** (information gap): gdy widzimy lukę w wiedzy, mozg odczuwa dyskomfort i chce ja zamknac. Clickbait celowo tworzy te luke — a po drugiej stronie jest zwykle banalnosc.

Kluczowe odkrycie z analizy gazeta.pl: polskie portale najczesciej lacza **ukryta odpowiedz + emocjonalny wzmacniacz + zbiorcowy podmiot**. Ta triada to motor 90% clickbaitow.

## Narzedzia

Prototyp stworzony przy uzyciu [Claude Code](https://claude.ai/claude-code) (Anthropic) — od pierwszego pomyslu do dzialajacego rozszerzenia Chrome w jednej sesji. Claude Code generowal kod, testowal wzorce na zywych danych z gazeta.pl (wstrzykujac JS przez Chrome DevTools), iterowal na podstawie feedback'u.

## Zrodla i inspiracje

- Jay Martel, Jonathan Stern — *Clickbait, Decoded*, The New Yorker, 12.03.2026
- George Loewenstein — *The Psychology of Curiosity: A Review and Reinterpretation*, 1994
- [Downworthy](https://downworthy.snipe.net/) — plugin przegladarkowy zamieniajacy hiperbole na cyniczne odpowiedniki (inspiracja, ang.)
- [Headline Cleaner](https://headlinecleaner.com/) — AI dekoder naglowkow (inspiracja, ang.)
- gazeta.pl, onet.pl, wp.pl — zrodla zywych przykladow do analizy

## Licencja

MIT — uzywaj, modyfikuj, dystrybuuj. Powolanie na autora mile widziane.
