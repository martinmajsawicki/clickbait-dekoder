# Clickbait Dekoder

Wtyczka Chrome, ktora dekoduje clickbaitowe tytuly na polskich portalach informacyjnych.

Przy kazdym wykrytym clickbaicie dodaje kolorowy badge (CB 1-10) i tooltip, ktory pokazuje **dokladnie ktore slowo uruchomilo detekcje** i daje mu zlosliwy komentarz w stylu felietonu z New Yorkera.

## Jak to wyglada

Tytul: *"Fundamentalna zmiana". Polacy odkryli, jak obnizyc koszty kredytow*

> Badge: **CB 3** (solidny clickbait)

Tooltip:
> **SUPERLATIV**
> *"Fundamentalna" — fundamentalna jak kazda zmiana, o ktorej zapomnisz za tydzien.*
>
> **"POLACY OSZALELI"**
> *"Polacy odkryli" — zamien na "kilka osob z Radomia przeczytalo artykul". Nadal chcesz kliknac?*

## Instalacja

1. Pobierz lub sklonuj to repozytorium
2. Otworz `chrome://extensions` w Chrome
3. Wlacz **Developer mode** (prawy gorny rog)
4. Kliknij **Load unpacked**
5. Wskaz folder z plikami wtyczki
6. Wejdz na dowolny obslugiwany portal

## Jak dziala

1. **Skanowanie DOM** — po zaladowaniu strony wtyczka przeszukuje elementy linkow i naglowkow, uzywajac selektorow specyficznych dla kazdego portalu (a takze zestawu domyslnego)
2. **Dopasowanie regex** — kazdy tytul (20-250 znakow) jest testowany przeciwko 180 wzorcom regexowym w 19 kategoriach
3. **Scoring** — kazda trafiona kategoria dodaje swoja wage (1 lub 2) do wyniku; maksymalny wynik to 10
4. **Badge + tooltip** — przy wykrytym clickbaicie pojawia sie kolorowy badge (CB 1-10), a po najechaniu myszka — tooltip z nazwa kategorii, dopasowanym fragmentem tekstu i zlosliwym komentarzem
5. **Scoreboard** — plywajacy panel w prawym dolnym rogu strony pokazuje liczbe wykrytych clickbaitow, liczbe przeskanowanych tytulow i procent clickbaitu na stronie
6. **MutationObserver** — wtyczka obserwuje dynamicznie ladowana tresc (infinite scroll) i automatycznie skanuje nowe elementy

## 19 kategorii wzorcow (180 regexow)

| # | Kategoria | Waga | Liczba regexow | Przyklad triggera |
|---|---|---|---|---|
| 1 | Ukryta odpowiedz | 2 | 36 | "oto co", "jest nagranie", "ujawniono", "kulisy", "nie moga uwierzyc", "tak wygladaja", "policzyli ile", "ostrzega", "zle wiesci" |
| 2 | Pytajnik w tytule (prawo Betteridge'a) | 1 | 1 | Znak `?` w tytule (tylko pytania zamkniete tak/nie; wylaczone: kto/co/gdzie/kiedy/jak/ile/z kim) |
| 3 | Superlativ / przesada | 1 | 41 | "HIT", "szokujace", "skandaliczne", "miazga", "rekordowe", "historyczne", "niebywale", "bez precedensu", "fatalne", "koszmarny" |
| 4 | Obietnica szoku | 2 | 7 | "az sie wierzyc nie chce", "trudno uwierzyc", "nie do wiary" |
| 5 | Zaimek wskazujacy | 2 | 6 | "ten preparat", "ta metoda", "to urzadzenie", "te buty" |
| 6 | Wyrwany cytat | 0 | 1 | Cudzyslow w tytule (waga 0 — sam nie uruchamia badge'a) |
| 7 | Cytat jako przyneta | 1 | 5 | "przejmujace slowa", "mocne slowa", "wyznal", "zdradzil co" |
| 8 | Dramaturgia serialu | 1 | 28 | "ale potem", "sa konsekwencje", "zawrzalo", "bez litosci", "wydal wyrok", "odkryl karty", "i wtedy", "oto powod", "stracil kontrole" |
| 9 | "Polacy oszaleli" | 2 | 9 | "Polacy oszaleli", "internet eksplodowal", "cala Polska", "wszyscy mowia", "rzucili sie" |
| 10 | Emocjonalny szantaz | 2 | 6 | "peknie ci serce", "ciarki", "lzy/lzami", "wzruszy" |
| 11 | Wyzwanie / rywalizacja | 1 | 5 | "a ty?", "wiekszosc odpada", "quiz" |
| 12 | Prowokacja / wciaganie | 1 | 3 | "z pewnoscia go znacie", "na pewno widziales", "pamietasz go" |
| 13 | Ekspresyjne czasowniki | 1 | 8 | "nie kryje wscieklosci/emocji", "ostro zareagowal", "grozi palcem", "trzesie rynkiem" |
| 14 | Niedopowiedziana pointa | 1 | 6 | "prosty blad", "jeden szczegol", "na co je stac", "dal do myslenia" |
| 15 | Kwestionowanie wiedzy | 1 | 4 | "nie wiedziales?", "wiekszosc ludzi nie wie", "malo kto zna" |
| 16 | Ukryta cena/kwota | 1 | 8 | "kwota 3-cyfrowa", "a cena?", "tyle kosztuje/otrzymuja/zarabia", "za grosze" |
| 17 | Reklama natywna | 1 | 7 | "sprawdza sie", "koniec z", "polskiej marki", "skradnie serce" |
| 18 | Celebryci jako przyneta | 1 | 2 | "gwiazda pokazala", "celebryta" |
| 19 | KRZYK w tytule | 1 | 3 | CAPS LOCK (10+ wielkich liter), podwojne wykrzykniki |

## Skala badge'ow

| Badge | Kolor | Znaczenie |
|---|---|---|
| CB 1 | zolty | Lekki clickbait — jedna technika |
| CB 2-3 | pomaranczowy | Solidny clickbait — kombinacja technik |
| CB 4-5 | czerwony | Ciezki clickbait — wiele technik naraz |
| CB 6+ | pulsujacy czerwony | Clickbait atomowy |

## Scoreboard

Plywajacy panel w prawym dolnym rogu strony (ciemne tlo, pomaranczowa ramka) pokazuje:

- **Liczbe wykrytych clickbaitow** (duza czerwona cyfra)
- **Liczbe przeskanowanych tytulow** (szara cyfra)
- **Procent clickbaitu** na stronie (np. "72% tytulow to clickbait")

Panel aktualizuje sie automatycznie przy kazdym skanie (takze po dolaczeniu nowej tresci przez infinite scroll).

## Obslugiwane portale (17)

gazeta.pl, onet.pl, wp.pl, pudelek.pl, fakt.pl, se.pl, pomponik.pl, o2.pl, interia.pl, tvn24.pl, dziendobry.tvn.pl, plotek.pl, sport.pl, money.pl, natemat.pl, noizz.pl, polsatnews.pl

Portale z dedykowanymi selektorami DOM: **gazeta.pl**, **onet.pl**, **wp.pl**, **tvn24.pl**. Pozostale portale uzywaja selektorow domyslnych (`h1-h4 a`, `article a`, `a[data-ga-action]`).

## Dlaczego bez AI?

Wtyczka uzywa pattern matchingu (regex), nie AI. To swiadomy wybor:
- **Offline** — zero latencji, zero kosztow, zero wysylania danych
- **Szybka** — skan calej strony <10ms
- **Transparentna** — kazdy wzorzec mozna przeczytac i zrozumiec
- **Deterministyczna** — ten sam tytul = ten sam wynik

## Struktura plikow

| Plik | Opis |
|---|---|
| `manifest.json` | Manifest Chrome Extension (v3) |
| `clickbait-detector.js` | Glowny skrypt — wzorce, analiza, DOM, scoreboard |
| `styles.css` | Style badge'ow, tooltipow i scoreboardu |
| `icon48.png` / `icon128.png` | Ikony wtyczki |
| `METHODOLOGY.md` | Historia projektu i metodologia detekcji |

## Historia projektu

Przestalem czytac polskie portale, bo nie znosze clickbaitow. Zainspirowal mnie felieton ["Clickbait, Decoded"](https://www.newyorker.com/humor/shouts-murmurs) z The New Yorker (Jay Martel, Jonathan Stern, marzec 2026), ktory wysmiewal clickbaity w prosty i powtarzalny sposob. Pomyslalem, ze moze da sie stworzyc nakladke do przegladarki, ktora "przeswietlalaby" te manipulacje automatycznie.

Uzylem [Claude Code](https://claude.ai/claude-code) (Anthropic) do wygenerowania wtyczki — od pomyslu do dzialajacego rozszerzenia w jednej sesji.

Pelna historia i metodologia: [METHODOLOGY.md](METHODOLOGY.md)

## Licencja

[MIT](LICENSE) — Marcin Majsawicki, 2026
