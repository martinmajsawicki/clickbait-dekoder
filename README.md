# Clickbait Dekoder

Wtyczka Chrome, która dekoduje clickbaitowe tytuły na polskich portalach informacyjnych. Pokazuje, jakie techniki manipulacji zastosowano i jakie jest prawdopodobne banalne znaczenie tytułu.

## Jak działa

Wtyczka skanuje tytuły artykułów i sprawdza je pod kątem **16 kategorii wzorców clickbaitowych**. Przy każdym wykrytym clickbaicie dodaje kolorowy badge z wynikiem (CB 1-10) i tooltip z opisem technik.

### Przykład

Tytuł: *"Fundamentalna zmiana". Polacy odkryli, jak obniżyć koszty kredytów*

Badge: **CB 3** (solidny clickbait)
- **Wyrwany cytat**: W pełnym kontekście brzmi zupełnie zwyczajnie.
- **Zbiorowość**: Zamień "Polacy odkryli" na "kilka tysięcy osób kupiło". Nadal chcesz kliknąć?

## 16 kategorii wzorców

| Kategoria | Przykład |
|---|---|
| Ukryta odpowiedź | "Oto co zrobiła potem", "Jest nagranie" |
| Superlativ / przesada | "HIT!", "szokujące", "miazga", "kapitalny" |
| Obietnica szoku | "Aż się wierzyć nie chce", "nie dowierza" |
| Zaimek wskazujący | "Ten preparat", "ta metoda" |
| Wyrwany cytat | "Przejmujące słowa...", cudzysłowy w tytule |
| Dramaturgia serialu | "Zaczęło się niewinnie", "są konsekwencje" |
| Zbiorowość | "Polacy oszaleli", "bez szans" |
| Emocjonalny szantaż | "Pęknie ci serce", "ciarki" |
| Wyzwanie / rywalizacja | "A ty na ile odpowiesz?", "większość odpada" |
| Prowokacja | "Z pewnością go znacie" |
| Ekspresyjne czasowniki | "Reaguje na", "ostro zareagował" |
| Niedopowiedziana pointa | "Prosty błąd", "na co je stać" |
| Kwestionowanie wiedzy | "Nie wiedziałeś?", quiz |
| Ukryta cena | "Kwota 3-cyfrowa", "a cena?" |
| Celebryci jako przynęta | "Gwiazda pokazała" |
| KRZYK w tytule | CAPS LOCK, podwójne wykrzykniki |

## Obsługiwane portale

gazeta.pl, onet.pl, wp.pl, pudelek.pl, fakt.pl, se.pl, pomponik.pl, o2.pl, interia.pl, tvn24.pl, dziendobry.tvn.pl, plotek.pl, sport.pl, money.pl, natemat.pl, noizz.pl, polsatnews.pl

## Instalacja

1. Pobierz lub sklonuj to repozytorium
2. Otwórz `chrome://extensions` w Chrome
3. Włącz **Developer mode** (prawy górny róg)
4. Kliknij **Load unpacked**
5. Wskaż folder z plikami wtyczki
6. Wejdź na dowolny obsługiwany portal

## Skala badge'ów

- **CB 1** (zolty) — lekki clickbait, jedna technika
- **CB 2-3** (pomaranczowy) — solidny clickbait
- **CB 4-5** (czerwony) — ciezki clickbait
- **CB 6+** (pulsujacy czerwony) — clickbait atomowy

## Inspiracja

Na podstawie felietonu [Clickbait, Decoded](https://www.newyorker.com/humor/shouts-murmurs) (The New Yorker, Jay Martel i Jonathan Stern) oraz teorii luki informacyjnej George'a Loewensteina (1994).

## Licencja

MIT
