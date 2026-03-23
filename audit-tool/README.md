# Clickbait Dekoder — Audit Tool

Automatyczny audyt detekcji clickbaitu na polskich portalach. Puppeteer otwiera portal, wstrzykuje detektor, zbiera tytuły, a LLM (Gemini Flash via OpenRouter) ocenia trafność detekcji i snarków.

## Instalacja

```bash
cd audit-tool
npm install
```

## Konfiguracja

Utwórz plik `.env` w tym katalogu:

```
OPENROUTER_API_KEY=sk-or-v1-...
```

Klucz z [openrouter.ai/keys](https://openrouter.ai/keys). Domyślny model: `google/gemini-2.0-flash-001`.

## Użycie

```bash
# Audyt jednego portalu
node audit.js gazeta.pl

# Audyt kilku portali
node audit.js wp.pl onet.pl fakt.pl

# Audyt wszystkich 24 portali
node audit.js --all

# Tylko zbierz tytuły i statystyki (bez LLM, bez kosztu)
node audit.js gazeta.pl --dry
node audit.js --all --dry

# Szczegółowe logi (debug)
node audit.js gazeta.pl --verbose
node audit.js --all --dry -v
```

### Flagi

| Flaga | Opis |
|-------|------|
| `--all` | Audyt wszystkich 24 portali |
| `--dry` | Bez LLM — zbiera tytuły, detekcję i statystyki (zero kosztów) |
| `--verbose` / `-v` | Szczegółowe logi diagnostyczne |

### Zatrzymanie

| Akcja | Efekt |
|-------|-------|
| `Ctrl+C` | Kończy po bieżącym portalu, zapisuje częściowe wyniki i statystyki |
| `Ctrl+C` ×2 | Natychmiastowe wyjście |

## Wyniki

Raporty trafiają do `audit-tool/reports/`:

| Plik | Format | Do czego |
|------|--------|----------|
| `gazeta.pl-audit.json` | JSON | Maszynowa analiza, import do kodu |
| `gazeta.pl-audit.tsv` | TSV (tab-separated) | Arkusz kalkulacyjny, przeglądanie ręczne |
| `gazeta.pl-titles.json` | JSON | Tylko tytuły (tryb --dry) |
| `summary-2026-03-23.json` | JSON | Podsumowanie wszystkich portali |
| `pattern-stats-2026-03-23.json` | JSON | Ranking technik, profile portali, heatmapa |
| `pattern-stats-2026-03-23.tsv` | TSV | Heatmapa kategoria × portal (do arkusza) |

### Kolumny TSV

| Kolumna | Opis |
|---------|------|
| `portal` | Nazwa portalu (np. gazeta.pl) |
| `tytuł` | Pełny tytuł artykułu |
| `sekcja` | Sekcja strony (sport, biznes, rozrywka...) |
| `wykryty` | TAK/NIE — czy nasz detektor oznaczył |
| `score` | Nasz score (CB 1, CB 2, ...) |
| `kategorie` | Wykryte kategorie (ukryta odpowiedź, superlativ...) |
| `snark` | Wyświetlony komentarz |
| `reguła` | Główna reguła, która odpaliła |
| `cb_llm` | Ocena LLM: tak/nie/graniczny |
| `technika_llm` | Technika wg LLM (ukryta odpowiedź, narracja...) |
| `detekcja_ok` | OK/BŁĄD — czy detekcja trafna |
| `snark_ok` | OK/BŁĄD — czy snark pasuje |
| `snark_problem` | Opis problemu snarku (za ostry, nietrafny...) |

### Pattern Stats (deterministyczny, bez LLM)

Generowany automatycznie po audycie (także --dry). Zawiera:
- **Global ranking** — najczęstsze techniki clickbaitu we wszystkich portalach
- **Portal profiles** — top 5 technik per portal + % clickbaitu
- **Heatmapa** — tabela kategoria × portal (TSV do arkusza)

### Metryki w JSON

- **Precision** — ile z wykrytych to faktycznie clickbait
- **Recall** — ile z clickbaitów wykryliśmy
- **Snark accuracy** — ile snarków pasuje do tytułu
- **False positives** — lista niesłusznie oflagowanych
- **Missed clickbaits** — lista pominiętych z sugerowanymi regexami
- **Category stats** — ile razy każda kategoria trafiła

## Portale (24)

gazeta.pl, onet.pl, wp.pl, fakt.pl, interia.pl, se.pl, tvn24.pl, polsatnews.pl, plotek.pl, o2.pl, natemat.pl, pudelek.pl, pomponik.pl, dziendobry.tvn.pl, money.pl, noizz.pl, sport.pl, tvrepublika.pl, wyborcza.pl, radiozet.pl, rmf24.pl, tokfm.pl, polskieradio24.pl, xyz.pl

## Koszt

Gemini Flash via OpenRouter: ~$0.001-0.003 per portal (15-80 tytułów w batchach po 15). Pełny audyt 24 portali: ~$0.05-0.10.

## Ważne

- `.env` z kluczem API **NIE** jest commitowany do repo (dodany do .gitignore)
- Wyniki w `reports/` też nie są commitowane — to dane per-sesja
- Skrypt NIE modyfikuje detektora — zbiera dane do ręcznej analizy
