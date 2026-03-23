#!/usr/bin/env node
/**
 * Clickbait Dekoder — Automated Audit Tool
 *
 * Otwiera portal w headless Chrome, wstrzykuje detektor, zbiera tytuły,
 * wysyła do LLM (Gemini Flash via OpenRouter) do oceny.
 *
 * Użycie:
 *   node audit.js gazeta.pl          # audyt jednego portalu
 *   node audit.js --all              # audyt wszystkich portali
 *   node audit.js wp.pl onet.pl      # audyt wybranych
 *   node audit.js --dry              # zbierz tytuły bez LLM
 *
 * Wymaga: .env z OPENROUTER_API_KEY
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXTENSION_DIR = join(__dirname, '..');

// === CONFIG ===

const PORTALS = [
  'https://www.gazeta.pl',
  'https://www.onet.pl',
  'https://www.wp.pl',
  'https://www.fakt.pl',
  'https://www.interia.pl',
  'https://www.se.pl',
  'https://www.tvn24.pl',
  'https://www.polsatnews.pl',
  'https://www.plotek.pl',
  'https://www.o2.pl',
  'https://natemat.pl',
  'https://www.pudelek.pl',
  'https://www.pomponik.pl',
  'https://dziendobry.tvn.pl',
  'https://www.money.pl',
  'https://noizz.pl',
  'https://www.sport.pl',
  'https://tvrepublika.pl',
  'https://wyborcza.pl',
  'https://www.radiozet.pl',
  'https://www.rmf24.pl',
  'https://www.tokfm.pl',
  'https://polskieradio24.pl',
  'https://xyz.pl',
];

const MODEL = 'google/gemini-2.0-flash-001';
const BATCH_SIZE = 15; // tytułów per LLM request
const MAX_TITLES = 80; // max per portal

// === CLI PARSING ===

const args = process.argv.slice(2);
const isDry = args.includes('--dry');
const isAll = args.includes('--all');
const portalArgs = args.filter(a => !a.startsWith('--'));

let portalsToAudit;
if (isAll) {
  portalsToAudit = PORTALS;
} else if (portalArgs.length > 0) {
  portalsToAudit = portalArgs.map(p => {
    if (p.startsWith('http')) return p;
    return `https://www.${p}`;
  });
} else {
  console.log(`
Clickbait Dekoder — Audit Tool

Użycie:
  node audit.js gazeta.pl          # audyt jednego portalu
  node audit.js wp.pl onet.pl      # audyt wybranych
  node audit.js --all              # audyt wszystkich (${PORTALS.length}) portali
  node audit.js --all --dry        # zbierz tytuły bez LLM (bez kosztu)

Wymaga: plik .env z OPENROUTER_API_KEY
  `);
  process.exit(0);
}

// === OPENROUTER API ===

const API_KEY = process.env.OPENROUTER_API_KEY;
if (!API_KEY && !isDry) {
  console.error('❌ Brak OPENROUTER_API_KEY w .env');
  process.exit(1);
}

async function callLLM(prompt) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/martinmajsawicki/clickbait-dekoder',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1, // deterministic
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// === PUPPETEER: ZBIERANIE TYTUŁÓW ===

async function collectTitles(url) {
  console.log(`\n🔍 Otwieram: ${url}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Block images/fonts for speed
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (['image', 'font', 'media'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.log(`  ⚠️ Timeout na ${url}, kontynuuję z tym co załadowano`);
  }

  // Auto-dismiss cookie popups
  try {
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent.toLowerCase();
        if (t.includes('odrzuc') || t.includes('reject') || t.includes('przejdź do serwisu')) {
          b.click();
          break;
        }
      }
    });
    await page.waitForTimeout(1000);
  } catch (e) { /* no popup */ }

  // Scroll down to load more content
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);
  }

  // Inject clickbait detector
  const detectorJS = readFileSync(join(EXTENSION_DIR, 'clickbait-detector.js'), 'utf8');
  const detectorCSS = readFileSync(join(EXTENSION_DIR, 'styles.css'), 'utf8');

  await page.evaluate((css) => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }, detectorCSS);

  await page.evaluate((js) => {
    const script = document.createElement('script');
    script.textContent = js;
    document.head.appendChild(script);
  }, detectorJS);

  // Wait for detector to run
  await page.waitForTimeout(2000);

  // Collect results
  const results = await page.evaluate((maxTitles) => {
    const allA = document.querySelectorAll('a');
    const seen = new Set();
    const items = [];

    allA.forEach(el => {
      if (items.length >= maxTitles) return;
      const clone = el.cloneNode(true);
      clone.querySelectorAll('.cbd-wrapper').forEach(w => w.remove());
      let t = clone.textContent.trim().replace(/\s+/g, ' ');
      // Strip common prefixes
      t = t.replace(/^(PREMIUM|PILNE|NOWE|NA ŻYWO|TYLKO U NAS|WASZ GŁOS|OPINIA|WYWIAD|KOMENTARZ|WIDEO|DUŻO ZDJĘĆ|ZDJĘCIA|MOCNE|WAŻNE|EXCLUSIVE)\s+/i, '');
      t = t.replace(/^\d{1,2}:\d{2}\s+/, '');
      t = t.replace(/^\d{1,4}\s+/, '');
      t = t.replace(/^(Pon|Wt|Śr|Czw|Pt|Sob|Nie)\s+\d{1,2}:\d{2}\s+/i, '');
      t = t.substring(0, 140).trim();

      if (t.length < 30 || seen.has(t)) return;
      seen.add(t);

      // Detect section from nearest heading or parent section
      let section = '';
      const sectionEl = el.closest('section, [class*="section"], [data-section]');
      if (sectionEl) {
        const heading = sectionEl.querySelector('h2, h3, [class*="header"]');
        if (heading) section = heading.textContent.trim().substring(0, 40);
      }

      const badge = el.querySelector('.cbd-badge');
      const tooltip = el.querySelector('.cbd-tooltip');

      if (badge) {
        const cats = [...(tooltip?.querySelectorAll('.cbd-category') || [])].map(c => c.textContent);
        const snarks = [...(tooltip?.querySelectorAll('.cbd-snark') || [])].map(s => s.textContent.substring(0, 120));
        items.push({
          title: t,
          detected: true,
          score: badge.textContent.trim(),
          categories: cats,
          snarks: snarks,
          section: section,
        });
      } else {
        items.push({
          title: t,
          detected: false,
          score: null,
          categories: [],
          snarks: [],
          section: section,
        });
      }
    });

    return items;
  }, MAX_TITLES);

  await browser.close();

  const detected = results.filter(r => r.detected);
  const missed = results.filter(r => !r.detected);
  console.log(`  📊 Zebrano ${results.length} tytułów: ${detected.length} wykrytych, ${missed.length} bez badge'a`);

  return results;
}

// === LLM AUDIT ===

function extractRulesSummary() {
  const src = readFileSync(join(EXTENSION_DIR, 'clickbait-detector.js'), 'utf8');
  const categories = [];
  const catRegex = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?weight:\s*(\d+)/g;
  let m;
  while ((m = catRegex.exec(src)) !== null) {
    categories.push({ id: m[1], name: m[2], weight: parseInt(m[3]) });
  }
  const totalRules = (src.match(/re:\s*\//g) || []).length;
  const sampleRegex = /id:\s*'([^']+)'[\s\S]*?re:\s*\/([^/]{5,40})\//g;
  const samples = {};
  while ((m = sampleRegex.exec(src)) !== null) {
    if (!samples[m[1]]) samples[m[1]] = m[2];
  }
  return { categories, totalRules, samples };
}

function buildPrompt(items) {
  const rules = extractRulesSummary();

  const ruleContext = `KONTEKST — nasz detektor ma ${rules.totalRules} regexów w ${rules.categories.length} kategoriach:
${rules.categories.map(c => '- ' + c.name + ' (weight ' + c.weight + ') np. /' + (rules.samples[c.id] || '...') + '/').join('\n')}

Trzy poziomy snarków:
1. PEWNIAKI (zawsze clickbait): wyśmiewamy — "Polacy oszaleli", "nie uwierzysz", "mówi wprost"
2. AMBIWALENTNE (bywa uczciwe): opisujemy technikę — "jest reakcja", "zabrał głos", "ostrzega"
3. EMOCJONALNE (może być prawda): opisujemy emocję — "dramat", "brutalny", "koszmarny"

Clickbait to nie SŁOWO, ale UKRYWANIE informacji. "Jest reakcja Tuska" = clickbait (ukrywa JAKA).
"Jest reakcja Tuska: potępia atak" = nie clickbait (ujawnia treść).`;

  const lines = items.map((item, i) => {
    if (item.detected) {
      return (i + 1) + '. [WYKRYTY ' + item.score + '] "' + item.title + '"\n   Kategorie: ' + item.categories.join(', ') + '\n   Snark: ' + (item.snarks[0] || '—');
    } else {
      return (i + 1) + '. [POMINIĘTY] "' + item.title + '"';
    }
  }).join('\n');

  return 'Jesteś ekspertem od clickbaitu w polskich mediach. Oceniasz detektor clickbaitu oparty na regexach.\n\n' +
    ruleContext + '\n\n' +
    'Oceń poniższe tytuły. Dla KAŻDEGO odpowiedz w formacie JSON:\n' +
    '{\n' +
    '  "nr": 1,\n' +
    '  "clickbait": "tak" | "nie" | "graniczny",\n' +
    '  "technika": "ukryta odpowiedź" | "superlativ" | "emocja" | "narracja" | "pytanie retoryczne" | "ukryta cena" | "obiektyfikacja" | "brak",\n' +
    '  "detekcja_ok": true | false,\n' +
    '  "snark_ok": true | false | null,\n' +
    '  "snark_problem": "" | "za ostry" | "za łagodny" | "nietrafny" | "false positive" | "kategoria nietrafna",\n' +
    '  "score_llm": 0-10,\n' +
    '  "false_positive_risk": "" | "ambiwalentne" | "sport" | "analiza" | "program TV",\n' +
    '  "sugerowany_regex": ""\n' +
    '}\n\n' +
    'WAŻNE:\n' +
    '- "sugerowany_regex" wypełnij TYLKO jeśli pominięty clickbait i NIE mamy jeszcze pasującego wzorca\n' +
    '- Przy ocenie snarków pamiętaj o trzech poziomach (pewniaki/ambiwalentne/emocjonalne)\n' +
    '- "detekcja_ok" = false jeśli: wykryty a nie powinien (false positive) LUB pominięty a powinien złapać\n\n' +
    'Odpowiedz TYLKO tablicą JSON.\n\nTytuły:\n' + lines;
}

async function auditBatch(items) {
  const prompt = buildPrompt(items);
  const response = await callLLM(prompt);

  // Parse JSON from response
  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('  ⚠️ Nie udało się sparsować odpowiedzi LLM');
  }
  return [];
}

// === RAPORT ===

function generateReport(portalUrl, items, llmResults) {
  const hostname = new URL(portalUrl).hostname.replace('www.', '');
  const detected = items.filter(i => i.detected);
  const missed = items.filter(i => !i.detected);

  const report = {
    portal: hostname,
    timestamp: new Date().toISOString(),
    model: MODEL,
    summary: {
      total_titles: items.length,
      detected: detected.length,
      missed: missed.length,
      detection_rate: Math.round((detected.length / items.length) * 100) + '%',
    },
    llm_evaluation: null,
    category_stats: {},
    items: items,
  };

  // Category stats
  for (const item of detected) {
    for (const cat of item.categories || []) {
      report.category_stats[cat] = (report.category_stats[cat] || 0) + 1;
    }
  }

  if (llmResults.length > 0) {
    let truePositives = 0, falsePositives = 0, missedClickbaits = 0, correctSkips = 0;
    let snarkOk = 0, snarkBad = 0;
    const suggestedRegexes = [];
    const snarkProblems = [];

    for (const r of llmResults) {
      const item = items[r.nr - 1];
      if (!item) continue;

      if (item.detected) {
        if (r.clickbait === 'tak' || r.clickbait === 'graniczny') truePositives++;
        else falsePositives++;

        if (r.snark_ok === true) snarkOk++;
        else if (r.snark_ok === false) {
          snarkBad++;
          snarkProblems.push({ title: item.title, problem: r.snark_problem });
        }
      } else {
        if (r.clickbait === 'tak') {
          missedClickbaits++;
          if (r.sugerowany_regex) suggestedRegexes.push({ title: item.title, regex: r.sugerowany_regex });
        } else {
          correctSkips++;
        }
      }
    }

    report.llm_evaluation = {
      precision: truePositives + falsePositives > 0
        ? Math.round((truePositives / (truePositives + falsePositives)) * 100) + '%'
        : 'N/A',
      recall: truePositives + missedClickbaits > 0
        ? Math.round((truePositives / (truePositives + missedClickbaits)) * 100) + '%'
        : 'N/A',
      snark_accuracy: snarkOk + snarkBad > 0
        ? Math.round((snarkOk / (snarkOk + snarkBad)) * 100) + '%'
        : 'N/A',
      true_positives: truePositives,
      false_positives: falsePositives,
      missed_clickbaits: missedClickbaits,
      correct_skips: correctSkips,
      snark_problems: snarkProblems,
      suggested_regexes: suggestedRegexes,
    };
  }

  return report;
}

// === PATTERN STATS (deterministyczny, bez LLM) ===

function generatePatternStats(reports, outDir) {
  const date = new Date().toISOString().slice(0, 10);

  // 1. Zbierz dane: kategoria × portal × count
  const catByPortal = {};  // { "Ukryta odpowiedź": { "gazeta.pl": 12, "wp.pl": 5, _total: 17 } }
  const portalTotals = {}; // { "gazeta.pl": { total: 80, detected: 45 } }

  for (const report of reports) {
    const portal = report.portal;
    portalTotals[portal] = {
      total: report.summary.total_titles,
      detected: report.summary.detected,
      rate: report.summary.detection_rate,
    };

    for (const [cat, count] of Object.entries(report.category_stats || {})) {
      if (!catByPortal[cat]) catByPortal[cat] = { _total: 0 };
      catByPortal[cat][portal] = (catByPortal[cat][portal] || 0) + count;
      catByPortal[cat]._total += count;
    }
  }

  // 2. Ranking kategorii (global)
  const globalRanking = Object.entries(catByPortal)
    .sort((a, b) => b[1]._total - a[1]._total)
    .map(([cat, data]) => ({
      kategoria: cat,
      total: data._total,
      portale: Object.entries(data)
        .filter(([k]) => k !== '_total')
        .sort((a, b) => b[1] - a[1])
        .map(([portal, count]) => ({ portal, count })),
    }));

  // 3. Profil per portal (top 5 technik)
  const portalProfiles = {};
  for (const report of reports) {
    const cats = Object.entries(report.category_stats || {})
      .sort((a, b) => b[1] - a[1]);
    portalProfiles[report.portal] = {
      ...portalTotals[report.portal],
      top5: cats.slice(0, 5).map(([cat, count]) => ({ kategoria: cat, count })),
      all_categories: cats.map(([cat, count]) => ({ kategoria: cat, count })),
    };
  }

  // 4. Heatmapa: kategoria × portal (TSV)
  const portals = reports.map(r => r.portal).sort();
  const categories = globalRanking.map(r => r.kategoria);

  let tsv = 'kategoria\ttotal\t' + portals.join('\t') + '\n';
  for (const cat of categories) {
    const data = catByPortal[cat];
    const row = [
      cat,
      data._total,
      ...portals.map(p => data[p] || 0),
    ];
    tsv += row.join('\t') + '\n';
  }

  // Wiersz podsumowania
  tsv += '\n--- PODSUMOWANIE PER PORTAL ---\n';
  tsv += 'portal\ttytułów\twykrytych\t% clickbait\ttop technika\n';
  for (const p of portals) {
    const prof = portalProfiles[p];
    tsv += [p, prof.total, prof.detected, prof.rate, prof.top5[0]?.kategoria || '—'].join('\t') + '\n';
  }

  // JSON
  const stats = {
    date,
    portals_count: reports.length,
    total_titles: Object.values(portalTotals).reduce((s, p) => s + p.total, 0),
    total_detected: Object.values(portalTotals).reduce((s, p) => s + p.detected, 0),
    global_ranking: globalRanking,
    portal_profiles: portalProfiles,
    heatmap: categories.map(cat => ({
      kategoria: cat,
      ...Object.fromEntries(portals.map(p => [p, catByPortal[cat]?.[p] || 0])),
    })),
  };

  const jsonFile = join(outDir, `pattern-stats-${date}.json`);
  const tsvFile = join(outDir, `pattern-stats-${date}.tsv`);
  writeFileSync(jsonFile, JSON.stringify(stats, null, 2));
  writeFileSync(tsvFile, tsv);

  console.log(`\n📊 STATYSTYKI WZORCÓW:`);
  console.log('─'.repeat(70));
  console.log(`Top 10 najczęstszych technik clickbaitu:`);
  for (const r of globalRanking.slice(0, 10)) {
    const topPortal = r.portale[0];
    console.log(`  ${String(r.total).padStart(4)}x  ${r.kategoria.padEnd(35)} (lider: ${topPortal?.portal || '—'})`);
  }
  console.log(`\n💾 JSON: ${jsonFile}`);
  console.log(`💾 TSV:  ${tsvFile}`);
}

// === MAIN ===

async function main() {
  const reportsDir = join(__dirname, 'reports');
  if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });

  const allReports = [];

  for (const portal of portalsToAudit) {
    try {
      const items = await collectTitles(portal);

      if (isDry) {
        // Dry run — save titles + generate report without LLM
        const report = generateReport(portal, items, []);
        allReports.push(report);
        const hostname = new URL(portal).hostname.replace('www.', '');
        const outFile = join(reportsDir, `${hostname}-titles.json`);
        writeFileSync(outFile, JSON.stringify(items, null, 2));
        console.log(`  💾 Zapisano tytuły: ${outFile}`);
        console.log(`  📊 ${report.summary.detected}/${report.summary.total_titles} wykrytych (${report.summary.detection_rate})`);
        continue;
      }

      // LLM audit in batches
      console.log(`  🤖 Wysyłam do LLM (${MODEL})...`);
      const allLlmResults = [];

      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        console.log(`     Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)}...`);
        const results = await auditBatch(batch);
        // Adjust indices
        const adjusted = results.map(r => ({ ...r, nr: r.nr + i }));
        allLlmResults.push(...adjusted);
        // Rate limit
        await new Promise(r => setTimeout(r, 1000));
      }

      const report = generateReport(portal, items, allLlmResults);
      allReports.push(report);

      // Save individual report
      const hostname = new URL(portal).hostname.replace('www.', '');
      const outFile = join(reportsDir, `${hostname}-audit.json`);
      writeFileSync(outFile, JSON.stringify(report, null, 2));
      console.log(`  💾 JSON: ${outFile}`);

      // CSV export — one row per title
      const csvHeader = 'portal\ttytuł\tsekcja\twykryty\tscore\tkategorie\tsnark\treguła\tcb_llm\ttechnika_llm\tdetekcja_ok\tsnark_ok\tsnark_problem\n';
      const csvRows = items.map((item, idx) => {
        const llm = allLlmResults.find(r => r.nr === idx + 1) || {};
        const row = [
          hostname,
          (item.title || '').replace(/\t/g, ' '),
          (item.section || '').replace(/\t/g, ' '),
          item.detected ? 'TAK' : 'NIE',
          item.score || '',
          (item.categories || []).join('; '),
          (item.snarks?.[0] || '').replace(/\t/g, ' '),
          (item.categories?.[0] || ''),
          llm.clickbait || '',
          llm.technika || '',
          llm.detekcja_ok === undefined ? '' : llm.detekcja_ok ? 'OK' : 'BŁĄD',
          llm.snark_ok === undefined ? '' : llm.snark_ok ? 'OK' : 'BŁĄD',
          llm.snark_problem || '',
        ];
        return row.join('\t');
      }).join('\n');
      const csvFile = join(reportsDir, `${hostname}-audit.tsv`);
      writeFileSync(csvFile, csvHeader + csvRows);
      console.log(`  💾 TSV:  ${csvFile}`);

      // Print summary
      const e = report.llm_evaluation;
      if (e) {
        console.log(`  📊 Precision: ${e.precision} | Recall: ${e.recall} | Snark accuracy: ${e.snark_accuracy}`);
        if (e.false_positives > 0) console.log(`  ⚠️  False positives: ${e.false_positives}`);
        if (e.missed_clickbaits > 0) console.log(`  ❌ Pominięte clickbaity: ${e.missed_clickbaits}`);
        if (e.suggested_regexes.length > 0) {
          console.log(`  💡 Sugerowane regexy:`);
          e.suggested_regexes.forEach(s => console.log(`     "${s.title}" → ${s.regex}`));
        }
      }
    } catch (err) {
      console.error(`  ❌ Błąd na ${portal}: ${err.message}`);
    }
  }

  // Summary report + pattern stats
  if (allReports.length >= 1) {
    console.log('\n📋 PODSUMOWANIE WSZYSTKICH PORTALI:');
    console.log('─'.repeat(70));
    for (const r of allReports.sort((a, b) => parseInt(b.summary.detection_rate) - parseInt(a.summary.detection_rate))) {
      const e = r.llm_evaluation;
      console.log(`${r.portal.padEnd(20)} ${r.summary.detection_rate.padStart(4)} clickbait | P:${e?.precision || '?'} R:${e?.recall || '?'} S:${e?.snark_accuracy || '?'}`);
    }

    const summaryFile = join(reportsDir, `summary-${new Date().toISOString().slice(0, 10)}.json`);
    writeFileSync(summaryFile, JSON.stringify(allReports.map(r => ({
      portal: r.portal,
      ...r.summary,
      ...r.llm_evaluation,
    })), null, 2));
    console.log(`\n💾 Podsumowanie: ${summaryFile}`);

    // === PATTERN STATS — deterministyczny raport statystyczny ===
    generatePatternStats(allReports, reportsDir);
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});
