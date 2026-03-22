# Clickbait Dekoder

Wtyczka Chrome, ktora dekoduje clickbaitowe tytuly na polskich portalach informacyjnych.

Przy kazdym wykrytym clickbaicie dodaje kolorowy badge (CB 1-10) i tooltip, ktory pokazuje **dokladnie ktore slowo uruchomilo detekcje** i daje mu zlosliwy komentarz w stylu felietonu z New Yorkera.

## Jak to wyglada

Tytul: *"Fundamentalna zmiana". Polacy odkryli, jak obnizyc koszty kredytow*

→ Badge: **CB 3** (solidny clickbait)

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

## 16 kategorii wzorcow

| Kategoria | Przyklad triggera | Przyklad snarka |
|---|---|---|
| Ukryta odpowiedz | "jest nagranie" | *"jest nagranie" — nagranie istnieje. Sensacja? Zwykle nie.* |
| Superlativ | "skandaliczne" | *"skandaliczne" — skandal tak duzy, ze zmiescil sie w jednym kliknieciu.* |
| Obietnica szoku | "az sie wierzyc nie chce" | *Chce sie wierzyc. I uwierzysz. Bo tresc jest normalna.* |
| Zaimek wskazujacy | "ten preparat" | *"ten" zamiast nazwy = nazwa jest rozczarowujaca.* |
| Wyrwany cytat | cudzyslow w tytule | *Wyrwany z kontekstu brzmi dramatycznie. W pelnej rozmowie — zwyczajnie.* |
| Dramaturgia | "sa konsekwencje" | *Konsekwencje pewnie oznaczaja: ktos napisal oswiadczenie.* |
| Zbiorowosc | "Polacy oszaleli" | *Zamien na "kilka osob z Radomia". Nadal chcesz kliknac?* |
| Emocjonalny szantaz | "ciarki" | *Ciarki od przeciagu, nie od tresci.* |
| Wyzwanie | "a ty?" | *Clickbaitowy ekwiwalent lapania za rekaw.* |
| Prowokacja | "z pewnoscia go znacie" | *Nie znasz. I nie musisz.* |
| Ekspresyjne czasowniki | "reaguje na" | *Zareagowal. Czyli skomentowal. Jak codziennie.* |
| Niedopowiedziana pointa | "prosty blad" | *Jesli jest tak prosty, czemu nie jest w tytule?* |
| Kwestionowanie wiedzy | "nie wiedziales?" | *Wiedziales. Albo nie potrzebujesz wiedziec.* |
| Ukryta cena | "kwota 3-cyfrowa" | *Gdyby kwota byla szokujaca, podaliby ja.* |
| Celebryci | "gwiazda pokazala" | *Gwiazda zrobila cos normalnego. News, bo znana.* |
| KRZYK | CAPS LOCK | *Krzyk zastepuje tresc. Im glosniej, tym ciszej w artykule.* |

## Obslugiwane portale

gazeta.pl, onet.pl, wp.pl, pudelek.pl, fakt.pl, se.pl, pomponik.pl, o2.pl, interia.pl, tvn24.pl, dziendobry.tvn.pl, plotek.pl, sport.pl, money.pl, natemat.pl, noizz.pl, polsatnews.pl

## Skala badge'ow

| Badge | Kolor | Znaczenie |
|---|---|---|
| CB 1 | zolty | Lekki clickbait — jedna technika |
| CB 2-3 | pomaranczowy | Solidny clickbait — kombinacja technik |
| CB 4-5 | czerwony | Ciezki clickbait — wiele technik naraz |
| CB 6+ | pulsujacy czerwony | Clickbait atomowy |

## Dlaczego bez AI?

Wtyczka uzywa pattern matchingu (regex), nie AI. To swiadomy wybor:
- **Offline** — zero latencji, zero kosztow, zero wysylania danych
- **Szybka** — skan calej strony <10ms
- **Transparentna** — kazdy wzorzec mozna przeczytac i zrozumiec
- **Deterministyczna** — ten sam tytul = ten sam wynik

## Historia projektu

Przestalem czytac polskie portale, bo nie znosze clickbaitow. Zainspirowal mnie felieton ["Clickbait, Decoded"](https://www.newyorker.com/humor/shouts-murmurs) z The New Yorker (Jay Martel, Jonathan Stern, marzec 2026), ktory wysmiewal clickbaity w prosty i powtarzalny sposob. Pomyslalem, ze moze da sie stworzyc nakladke do przegladarki, ktora "przeswietlalaby" te manipulacje automatycznie.

Uzylem [Claude Code](https://claude.ai/claude-code) (Anthropic) do wygenerowania wtyczki — od pomyslu do dzialajacego rozszerzenia w jednej sesji.

Pelna historia i metodologia: [METHODOLOGY.md](METHODOLOGY.md)

## Licencja

[MIT](LICENSE) — Marcin Majsawicki, 2026
