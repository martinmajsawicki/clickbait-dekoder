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
2. **Dopasowanie regex** — kazdy tytul (20-250 znakow) jest testowany przeciwko 443 wzorcom regexowym w 21 kategoriach
3. **Scoring** — kazda trafiona kategoria dodaje swoja wage (1 lub 2) do wyniku; maksymalny wynik to 10
4. **Badge na obrazku** — przy wykrytym clickbaicie badge (CB 1-10) jest umieszczany na powiazanym obrazku (jesli istnieje), a nie w tekscie — lepiej widoczny i nie zaburza layoutu
5. **Tooltip** — po najechaniu na badge pojawia sie tooltip z nazwa kategorii, dopasowanym fragmentem tekstu i zlosliwym komentarzem
6. **Scoreboard** — plywajacy panel w prawym dolnym rogu strony (przesuwany) pokazuje liczbe wykrytych clickbaitow, liczbe przeskanowanych tytulow i procent clickbaitu na stronie
7. **MutationObserver** — wtyczka obserwuje dynamicznie ladowana tresc (infinite scroll) i automatycznie skanuje nowe elementy

## 21 kategorii wzorcow (443 regexow)

| # | Kategoria | Waga | Przyklad triggera |
|---|---|---|---|
| 1 | Ukryta odpowiedz | 2 | "oto co", "jest nagranie", "ujawniono", "kulisy", "nie moga uwierzyc", "tak wygladaja", "policzyli ile", "ostrzega", "zle wiesci", "tak dba/zarabia/mieszka" |
| 2 | Pytajnik w tytule (prawo Betteridge'a) | 1 | Znak `?` w tytule (tylko pytania zamkniete tak/nie; wylaczone: kto/co/gdzie/kiedy/jak/ile/z kim/kogo) |
| 3 | Superlativ / przesada | 1 | "HIT", "szokujace", "skandaliczne", "miazga", "rekordowe", "historyczne", "niebywale", "bez precedensu", "fatalne", "koszmarny", "deklasacja", "kompromitujace", "skandal", "magiczne", "odrazajace", "straszne", "zgroza", "obrzydliwe", "uderza w", "szoruje po dnie", "zrownuje z ziemia" |
| 4 | Obietnica szoku | 2 | "az sie wierzyc nie chce", "trudno uwierzyc", "nie do wiary" |
| 5 | Zaimek wskazujacy | 2 | "ten preparat", "ta metoda", "to urzadzenie", "te buty", "wyspiarskie panstwo", "pierwszy kraj w Europie" |
| 6 | Wyrwany cytat | 0 | Cudzyslow w tytule (waga 0 — sam nie uruchamia badge'a; exclude na tytuły programow TV) |
| 7 | Cytat jako przyneta | 1 | "przejmujace slowa", "mocne slowa", "wyznal", "zdradzil co" |
| 8 | Dramaturgia serialu | 1 | "ale potem", "sa konsekwencje", "zawrzalo", "bez litosci", "wydal wyrok", "odkryl karty", "i wtedy", "oto powod", "stracil kontrole", "burza", "awantura", "konflikt", "moze zmienic wszystko" |
| 9 | "Polacy oszaleli" | 2 | "Polacy oszaleli", "internet eksplodowal", "cala Polska", "wszyscy mowia", "rzucili sie", "sypia sie", "podzielil" |
| 10 | Emocjonalny szantaz | 2 | "peknie ci serce", "ciarki", "lzy/lzami", "wzruszy", "mrozi krew", "wyciskaja lzy", "na potege" |
| 11 | Wyzwanie / rywalizacja | 1 | "a ty?", "wiekszosc odpada", "quiz" |
| 12 | Prowokacja / wciaganie | 1 | "z pewnoscia go znacie", "na pewno widziales", "pamietasz go", "poznajesz" |
| 13 | Ekspresyjne czasowniki | 1 | "nie kryje wscieklosci/emocji", "ostro zareagowal", "grozi palcem", "trzesie rynkiem", "bez ogrodek", "mowi wprost" |
| 14 | Niedopowiedziana pointa | 1 | "prosty blad", "jeden szczegol", "na co je stac", "dal do myslenia" |
| 15 | Kwestionowanie wiedzy | 1 | "nie wiedziales?", "wiekszosc ludzi nie wie", "malo kto zna", "wiesz co/jak" |
| 16 | Ukryta cena/kwota | 1 | "kwota 3-cyfrowa", "a cena?", "tyle kosztuje/otrzymuja/zarabia", "za grosze", "kwoty moga dziwic" |
| 17 | Reklama natywna | 1 | "sprawdza sie", "koniec z", "polskiej marki", "skradnie serce", "ktora pokochasz" |
| 18 | Celebryci jako przyneta | 1 | "gwiazda pokazala", "celebryta", "najpiekniejsza polka", "najseksowniejsza" |
| 19 | KRZYK w tytule | 1 | CAPS LOCK (8+ wielkich liter), CAPS w srodku zdania, podwojne wykrzykniki |
| 20 | Cliffhanger / niedokonczenie | 1 | "..." (wielokropek na koncu), "mial byc zwykly/normalny" |
| 21 | Idiom bait | 1 | "zapalila mi sie lampka" |

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

## Obslugiwane portale (26)

| Portal | Status | % clickbaitu | Profil |
|---|---|---|---|
| gazeta.pl | przetestowany | ~54% | Historyczny poligon — zbiorowosc, ukryte odpowiedzi, cytaty |
| onet.pl | przetestowany | ~41% | Pytajniki Betteridge'a, celebryci, quizy |
| wp.pl | przetestowany | ~41% | Ekspresyjne czasowniki, dramaturgia serialowa, CAPS sportowe |
| fakt.pl | przetestowany | ~46% | Klasyczny tabloid — narracja emocjonalna, urgency, cliffhangery |
| interia.pl | przetestowany | ~30% | Portal informacyjny z premium — pytajniki, cytaty, superlativy |
| se.pl | przetestowany | ~60% | Wysoki clickbait — tabloidowy styl |
| plotek.pl | przetestowany | ~100% | Portal plotkarski — prawie kazdy tytul to clickbait |
| pudelek.pl | przetestowany | ~0% | Paradoks: tabloid bez clickbaitu — ujawnia zamiast ukrywac |
| pomponik.pl | przetestowany | ~78% | Portal gossip, narracja emocjonalna, cytaty jako przyneta |
| dziendobry.tvn.pl | przetestowany | ~23% | Niski CB, glownie horoskopy, lifestyle |
| natemat.pl | przetestowany | ~42% | Styl ambiwalentny, dobra zgodnosc z recenzentem ludzkim |
| o2.pl | przetestowany | ~35% | Portal informacyjny WP-style |
| polsatnews.pl | przetestowany | ~37% | Portal informacyjny |
| tvn24.pl | przetestowany | ~37% | Dominuja pytania Betteridge'a (90% wykrytych CB) |
| sport.pl | przetestowany | ~33% | Narracja sportowa (po dodaniu wzorcow sportowych) |
| money.pl | przetestowany | niski CB | Portal analityczny — false positive na naglowkach CAPS naprawiony |
| noizz.pl | przetestowany | niski CB | Lifestyle/wywiady — malo clickbaitu |
| tvrepublika.pl | przetestowany | w trakcie | CB polityczny/geopolityczny, superlativy, ukryte tozsamosci, DOM H2-bez-linkow |
| wyborcza.pl | przetestowany | ~14% | Jakosciowe dziennikarstwo — niski clickbait, poprawka "kogo" w Betteridge |
| nczas.com | przetestowany | ~6% | Portal prawicowy — niski CB, glownie cliffhangery, WordPress layout |
| dorzeczy.pl | przetestowany | ~44% | Portal konserwatywny — ciezki quote bait (13x cytat jako przyneta) |
| radiozet.pl | przetestowany | — | Portal radiowy |
| tokfm.pl | przetestowany | — | Portal radiowy |
| rmf24.pl | przetestowany | — | Portal informacyjny/radiowy |
| polskieradio24.pl | przetestowany | — | Portal radiowy publiczny |
| xyz.pl | przetestowany | — | Portal informacyjny |

Portale z dedykowanymi selektorami DOM: **gazeta.pl**, **onet.pl**, **wp.pl**, **tvn24.pl**, **interia.pl**, **fakt.pl**, **pomponik.pl**, **natemat.pl**, **money.pl**, **noizz.pl**, **tvrepublika.pl**, **dziendobry.tvn.pl** i inne. Kazdy portal ma zestaw selektorow specyficznych + domyslne (`h1-h4 a`, `article a`, `a[data-ga-action]`).

## Dlaczego bez AI?

Wtyczka uzywa pattern matchingu (regex), nie AI. To swiadomy wybor:
- **Offline** — zero latencji, zero kosztow, zero wysylania danych
- **Szybka** — skan calej strony <10ms
- **Transparentna** — kazdy wzorzec mozna przeczytac i zrozumiec
- **Deterministyczna** — ten sam tytul = ten sam wynik

## Czego nie wykrywa (ograniczenia regex)

Regex swietnie lapie **frazy-sygnaly** ("oto co", "nie uwierzysz", "sensacja"). Ale nie lapie **clickbaitu narracyjnego** — czyli tytulow, ktore buduja napiecie samym ukladem zdan, bez uzycia typowych slow-kluczy.

Przyklady clickbaitow, ktorych wtyczka NIE wykryje:

| Tytul | Dlaczego clickbait | Dlaczego regex nie lapie |
|---|---|---|
| "Mial rodzicow obcokrajowcow. Do niedawna nazywal sie inaczej" | Suspens narracyjny — ukrywa pointe | Brak slowa-klucza, cala manipulacja w strukturze zdan |
| "6 szt. na klienta. Limit konieczny. Kupuja kartonami. 2 dni i koniec" | Urgency — krotkie zdania buduja panik | Zaden pojedynczy fragment nie jest clickbaitowy |
| "Lokal dawal klientkom do zrozumienia: Za tania torebka, u nas nie jesz" | Clickbait klasowy/spoleczny — budzi oburzenie | Manipulacja jest w tresci, nie w slowie |
| "Pedofil gwalcil pasierbice, matka patrzyla. Jest wyrok" | Szok trescia, nie forma | Tresc jest faktycznie szokujaca — nie da sie odroznic od clickbaitu |

Do wykrywania takich tytulow potrzebne jest **AI** (analiza intencji, nie fraz). To planowane rozszerzenie — opcjonalny tryb AI on-hover.

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

[MIT](LICENSE) — Marcin Maj Sawicki, 2026
