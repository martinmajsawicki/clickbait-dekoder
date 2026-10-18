/**
 * Clickbait Dekoder — warstwa kontraktu (content script).
 *
 * Jeden interfejs, za którym silnik (regex / API / cache) jest wymienny.
 * judgeRegex() daje natychmiastowy werdykt regexowy; qualifiesForApi()
 * decyduje, czy tytuł wymaga dosądzenia przez model.
 *
 * Kształt werdyktu (Verdict):
 *   { cb, pillars, snark, techniques, matches?, source, status }
 *
 * Wymaga wcześniej załadowanego cbd-patterns.js (globalThis.CBD.patterns).
 * Eksport: globalThis.CBD.judge = { judgeRegex, qualifiesForApi }
 */

(function (root) {
  const CBD = (root.CBD = root.CBD || {});
  const { analyzeHeadlineCore } = CBD.patterns;

  // Miękkie sygnały dla tytułów, których regex nie złapał (kandydaci na FN).
  const SOFT_QUOTE = /["„“”].+["„“”]/;
  const SOFT_SUPERLATIVE = /\b(naj\w+|rekordow\w*|szokując\w*|niewiarygodn\w*|absolutn\w*)/i;
  const SOFT_QUESTION = /\?\s*$/;

  // Regexowy werdykt wstępny → Verdict.
  function judgeRegex(title, ctx = {}) {
    const r = analyzeHeadlineCore(title, { isAnalytical: ctx.isAnalytical });
    const techniques = [...new Set(r.matches.map((m) => m.name))];
    const pending = qualifiesForApi(title, r, ctx);
    return {
      cb: r.score,
      pillars: r.pillars,
      snark: r.matches[0] ? r.matches[0].snark : '',
      techniques,
      matches: r.matches,
      source: 'regex',
      status: pending ? 'pending' : 'final',
      _rawScore: r.rawScore, // wewnętrzne — do kwalifikacji/debug, UI tego nie używa
    };
  }

  // Czy tytuł zasługuje na dosądzenie przez model?
  // Regex ma ~0% FP, ale niski recall — do API trafia strefa niepewności.
  function qualifiesForApi(title, regexResult, ctx = {}) {
    const t = (title || '').trim();
    if (t.length < 20) return false;

    const raw = regexResult.rawScore;

    // Regex pewny (≥3) — werdykt finalny, oszczędzamy koszt.
    if (raw >= 3) return false;

    // Pure native ad — nie marnujemy wywołania (gatunek, nie clickbait do oceny).
    if (
      regexResult.matches.length > 0 &&
      regexResult.matches.every((m) => m.id === 'native_ad')
    ) {
      return false;
    }

    // Graniczne CB 1–2 — model kalibruje w górę/dół.
    if (raw === 1 || raw === 2) return true;

    // Regex = 0, ale są miękkie sygnały → kandydat na false-negative.
    if (raw === 0) {
      if (SOFT_QUOTE.test(t)) return true;
      if (SOFT_SUPERLATIVE.test(t)) return true;
      if (!ctx.isAnalytical && SOFT_QUESTION.test(t)) return true;
    }

    return false;
  }

  CBD.judge = { judgeRegex, qualifiesForApi };
})(typeof globalThis !== 'undefined' ? globalThis : self);
