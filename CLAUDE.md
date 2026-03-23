# Clickbait Dekoder — kontekst projektu

## Co to jest
Chrome extension wykrywajacy clickbaity na polskich portalach informacyjnych.
Dodaje badge (CB 1-10) i tooltip ze snarkiem (zlosliwy komentarz w stylu New Yorkera) przy kazdym clickbaitowym tytule.

## Stan projektu (24 marca 2026)
- **407 wzorcow** regexowych w **21 kategoriach**
- **26 portali** w manifest.json
- **13 portali** szczegolowo zaudytowanych (human review kazdego tytulu)
- Repo: github.com/martinmajsawicki/clickbait-dekoder
- Skrypt auto-audytu w `/audit-tool/` (Puppeteer + Gemini Flash via OpenRouter)

## Architektura
- `clickbait-detector.js` — glowna logika: wzorce, analiza, badge, tooltip, scoreboard
- `styles.css` — style badge, tooltip, scoreboard
- `manifest.json` — Manifest V3, content_scripts na 26 domenach
- `audit-tool/` — POZA folderem rozszerzenia (zeby nie puchlo)

## Kluczowe decyzje edytorskie
1. **Trzy poziomy snarkow**:
   - Pewniaki (wysmiewaj): "nie uwierzysz", "ten trik", "Polacy oszaleli"
   - Ambiwalentne (opisz technike): "dramat", "skandal", "ostrzega"
   - Emocjonalne (opisz emocje): "brutalne", "koszmarne"
2. **Clickbait = ukrywanie informacji**, nie samo slowo
3. **Kontekst sekcji decyduje** — pytanie w [ANALIZA] != clickbait
4. **Sport to osobny swiat** — "rekordowy" bywa doslowny, "niesamowity" tez
5. **Nazwy programow TV** w exclude (Taniec z gwiazdami, The Traitors, itp.)
6. **CAPS exclude** na akronimy (SAFE, NATO, GCAP, PESEL)
7. **"Znany bez nazwiska" = zawsze CB** — gdyby byl znany, podaliby nazwisko

## Audyty ukonczzone
gazeta.pl, onet.pl, wp.pl, fakt.pl, interia.pl, se.pl, tvn24.pl, polsatnews.pl, plotek.pl, o2.pl, natemat.pl, pomponik.pl, dziendobry.tvn.pl, money.pl, noizz.pl, sport.pl

## Audyty do wykonania
- tvrepublika.pl + wyborcza.pl
- radiozet.pl + rmf24.pl + tokfm.pl
- dorzeczy.pl + nczas.com + xyz.pl

## Metodologia audytu
1. Czytaj raport z auto-audytu (tytuly + detekcja + snarki)
2. Prezentuj wykryte i pominiete uzytkownikowi
3. Uzytkownik ocenia kazdy tytul
4. Dodaj nowe wzorce + napraw bugi
5. Aktualizuj docs (README + AUDIT + manifest)
6. Commit + push po kazdym portalu

## Planowane zadania (backlog)
- [ ] Naprawic parser JSON w audit.js (strip markdown z odpowiedzi LLM)
- [ ] Warianty snarkow (3-5 losowych per wzorzec)
- [ ] Popup z podsumowaniem (klik na ikone rozszerzenia)
- [ ] Eksport raportu clickbaitu (screenshot/PDF na social media)
- [ ] Materialy na social media (screenshoty, GIFy, statystyki)
- [ ] Publikacja w Chrome Web Store (~5$ jednorazowo)
- [ ] Firefox Add-on
- [ ] Skrypt auto-testowania: poprawic prompt LLM o definicje clickbaitu

## Wazne zasady
- Kazdy nowy wzorzec wymaga snarka — uniwersalnego, nie dopasowanego do jednego artykulu
- Snarki maja opisywac TECHNIKE manipulacji, nie bagatelizowac tresci
- Po kazdym portalu aktualizuj dokumentacje (README, AUDIT, manifest)
- Git repo jest w TYM katalogu, nie w home directory
- audit-tool/ ma wlasne node_modules — NIE commituj ich do repo rozszerzenia
