# Adapting Clickbait Dekoder to English (or any other language)

Clickbait Dekoder is built for Polish news sites, but most of its machinery is language-neutral. This guide lists what is tied to Polish, what you can reuse as is, and a suggested order of work.

## How the extension decides

1. **Regex layer** (`cbd-patterns.js`, `cbd-judge.js`) — 447 Polish patterns in 21 categories, each with a weight (0–2) and a snarky comment. A title that scores 3 or more gets its badge instantly and is not sent anywhere.
2. **Model layer** (`background.js`, `cbd-prompt.js`, `cbd-profiles.js`) — every other title (regex score 0–2) goes, in batches of 15, to a language model through OpenRouter with the user's own API key. The model writes a one-sentence reason first, then a 0–100 score, the clickbait "pillars" and a snarky comment. A score of 40 or more shows a badge (scaled 1–10).
3. **Page layer** (`clickbait-detector.js`) — finds headline links on each supported site, cleans the text (section labels, comment counters, author bylines), places the badge on the article's own image or next to the title, and keeps a scoreboard.

The definition of clickbait the model applies is editorial: four pillars (hides information, exaggerates, replaces facts with emotion, builds a false narrative) plus a set of borderline cases decided by a human editor on real headlines.

## What is tied to Polish

| Part | File | What to do |
|---|---|---|
| Regex patterns and snarks | `cbd-patterns.js` | Replace. Polish patterns rely on Polish morphology and idioms; none carry over. You can start with an empty pattern list (see "Model-first" below). |
| Judge instructions | `cbd-prompt.js` (`JUDGE_SYSTEM_PROMPT`, `DESCRIPTIONS`, borderline cases) | Translate the four pillars and the three boundary tests. Replace every borderline example with real headlines from your target sites; the examples are what makes the model consistent. Drop or replace rules that depend on Polish context ("widely known in Poland"). |
| Site profiles | `cbd-profiles.js` | Replace with your outlets: type (tabloid, news, opinion…) and a one-line description the model reads. |
| Supported sites | `manifest.json` (`matches`), `SITE_SELECTORS` and `TITLE_PARTS` in `clickbait-detector.js` | Add your domains and the CSS selectors of headline links. `TITLE_PARTS` handles sites that put the title, kicker and labels in separate elements. |
| Text cleanup | `clickbait-detector.js` (leading labels, trailing section names, `isAnalytical`, quiz detection in `cbd-patterns.js`) | Replace Polish labels ("PILNE", "TYLKO W WP", "W SKRÓCIE"…) with your sites' equivalents ("BREAKING", "EXCLUSIVE", "LIVE"…). |
| Interface text | `clickbait-detector.js` (tooltip labels, scoreboard), `options.html`, `options.js` | Translate. Strings are inline; extracting them to one object is a small, worthwhile refactor. |

## What you can reuse as is

- The verdict contract (`judge(title) → { cb, pillars, snark, techniques, source, status }`) and the regex → model hand-off.
- The service worker: batching, parallel requests, 7-day cache, retry on rate limits, error reporting to the scoreboard and options page.
- Badge placement on the article's own image, duplicate-title handling, the scoreboard.
- The evaluation workflow in the companion audit tool: scrape real headlines with the real extension code, label them blind, measure precision and recall, review disagreements, turn them into borderline cases, and confirm on a fresh sample.

## Model-first route (recommended start)

The regex layer is the most language-specific part and the least important one now: on a blind test of headlines the regex was unsure about, the model caught about twice as many clickbait headlines as the regex (76% vs 39% of those an editor marked as clickbait, at 96% precision). An English version can ship with an empty or small pattern list:

1. Translate the judge instructions and replace the borderline examples with English headlines.
2. Set `qualifiesForApi` to send every title to the model (it already sends everything below a regex score of 3).
3. Add 20–50 high-precision English patterns later for instant badges ("You won't believe", "What happened next", "This one trick", "X things you didn't know").

## Calibrating for English

Clickbait is an editorial judgment, and the model follows the rules it is given only as well as they are anchored in examples. Plan for at least three rounds:

1. Collect ~60 headlines the extension would send to the model from your target sites.
2. Have an editor label them blind (clickbait / not / unsure).
3. Measure; review the disagreements with the editor's explanations; turn recurring mistakes into borderline cases with contrasting examples.
4. Confirm on a new sample — rules built on a sample always look better on that same sample.

Public datasets such as Webis-Clickbait-17 can help with a first sanity check, but your own editor's labels on your own sites matter more.

## Model choice

Measured on Polish headlines (October 2026), with the same instructions: `google/gemini-3.8-flash` with reasoning effort "low" reached the quality of `gemini-2.5-pro` at a fraction of the cost and with ~10–30 s per batch; `gemini-2.5-flash` ignored many of the rules. Re-run the comparison for your language before settling.

## Effort estimate

- Model-first English version for a handful of sites (prompt, profiles, selectors, UI text): a few days of development plus three labeling rounds by an editor.
- A full regex layer comparable to the Polish one: weeks of iterative audits.

Contributions and forks for other languages are welcome. If you start one, open an issue so others can find it.
