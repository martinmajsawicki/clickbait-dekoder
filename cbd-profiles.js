/**
 * Clickbait Dekoder — profile portali (bayesowski prior per portal).
 *
 * Port z audit-tool/audit.js. Ładowany w service workerze (importScripts),
 * wstrzykiwany do promptu modelu, by ocena uwzględniała charakter portalu:
 * tabloid zaczyna z domniemaniem clickbaitu, dziennik opinii — z domniemaniem uczciwości.
 * Ładowany też w content_scripts: cbd-judge.js po typie portalu decyduje,
 * które tytuły idą do modelu (na tabloidach każdy niepewny).
 *
 * Nie dotyka window/document. Eksport: globalThis.CBD.profiles = { PORTAL_PROFILES, getProfile }
 */

(function (root) {
  const CBD = (root.CBD = root.CBD || {});

  const PORTAL_PROFILES = {
    'fakt.pl':          { type: 'tabloid', baseline: 70, note: 'Tabloid. Częste ukrywanie informacji i sensacyjny język.' },
    'se.pl':            { type: 'tabloid', baseline: 70, note: 'Super Express. Tabloid zbliżony do Faktu. Wysoki baseline CB.' },
    'pudelek.pl':       { type: 'tabloid', baseline: 65, note: 'Portal plotkarski. Prawie wszystko oparte na ciekawości, ale w kontekście show-biznesu to gatunek.' },
    'pomponik.pl':      { type: 'tabloid', baseline: 65, note: 'Plotki i lifestyle. Wysoki baseline, ale lżejszy niż Fakt/SE.' },
    'plotek.pl':        { type: 'tabloid', baseline: 60, note: 'Portal plotkarski Gazety. Trochę bardziej powściągliwy niż Pudelek.' },
    'o2.pl':            { type: 'portal', baseline: 55, note: 'Portal ogólny. Mieszanka informacji i lifestyle. Średni baseline.' },
    'noizz.pl':         { type: 'lifestyle', baseline: 50, note: 'Lifestyle/kultura. Kreatywne tytuły bywają clickbaitowe, ale gatunek to toleruje.' },
    'dziendobry.tvn.pl':{ type: 'lifestyle', baseline: 50, note: 'Morning show + lifestyle. Lekki ton, ale sensacja na poziomie tabloidowym.' },
    'gazeta.pl':        { type: 'portal', baseline: 45, note: 'Portal ogólny Agory. Mieszanka informacji, opinii i lifestyle. Sekcja główna umiarkowana, lifestyle clickbaitowy.' },
    'wp.pl':            { type: 'portal', baseline: 45, note: 'Wirtualna Polska. Duży portal ogólny. Sekcja główna OK, podstrony lifestyle bywają CB.' },
    'onet.pl':          { type: 'portal', baseline: 45, note: 'Portal ogólny. Podobny do WP — sekcja główna umiarkowana, lifestyle wyższy CB.' },
    'interia.pl':       { type: 'portal', baseline: 45, note: 'Portal ogólny. Zbliżony do Onet/WP pod względem CB.' },
    'natemat.pl':       { type: 'opinia', baseline: 40, note: 'Portal opiniotwórczy. Prowokacyjne tytuły, ale często z treścią. Sprawdzaj filar 4.' },
    'money.pl':         { type: 'finanse', baseline: 35, note: 'Finanse i gospodarka. Niższy baseline, ale sekcje "oszczędzanie" bywają CB.' },
    'tvn24.pl':         { type: 'info', baseline: 30, note: 'Portal informacyjny. Niski baseline w hard news, wyższy w soft news/lifestyle.' },
    'polsatnews.pl':    { type: 'info', baseline: 30, note: 'Portal informacyjny Polsatu. Zbliżony do TVN24 pod względem CB.' },
    'radiozet.pl':      { type: 'info', baseline: 30, note: 'Radio + portal informacyjny. Umiarkowany baseline.' },
    'rmf24.pl':         { type: 'info', baseline: 25, note: 'Portal informacyjny RMF. Raczej rzetelne nagłówki. UWAGA: ucięte cytaty z "..." na końcu to format portalu, NIE clickbait.' },
    'sport.pl':         { type: 'sport', baseline: 25, note: 'Sport. Emocjonalny język jest normą gatunku. Sprawdzaj czy ukrywa KTO/CO.' },
    'tvrepublika.pl':   { type: 'info-opinia', baseline: 40, note: 'Portal prawicowy. Tytuły polityczne często budują narrację konfliktu (filar 4). W hard news umiarkowany.' },
    'wyborcza.pl':      { type: 'opinia', baseline: 20, note: 'Dziennik opiniotwórczy. Niski baseline. Żywy język analityczny ≠ clickbait. Sekcje lifestyle/kultura bywają wyższe.' },
    'tokfm.pl':         { type: 'opinia', baseline: 20, note: 'Radio opiniotwórcze. Tytuły analityczne. Bardzo niski baseline.' },
    'polskieradio24.pl':{ type: 'info', baseline: 20, note: 'Radio publiczne. Rzetelne nagłówki. Niski baseline.' },
    'dorzeczy.pl':      { type: 'opinia', baseline: 40, note: 'Tygodnik prawicowy. Tytuły opiniotwórcze, czasem narracja konfliktu.' },
    'nczas.com':        { type: 'opinia', baseline: 45, note: 'Portal wolnościowy. Prowokacyjne tytuły, narracja konfliktu częsta.' },
    'xyz.pl':           { type: 'opinia', baseline: 45, note: 'Portal prawicowy. Emocjonalne tytuły, narracja konfliktu.' },
  };

  const DEFAULT_PROFILE = { type: 'unknown', baseline: 40, note: 'Nieznany portal. Oceniaj neutralnie.' };

  // Dopasowanie po sufiksie hosta (np. www.fakt.pl, kobieta.fakt.pl → fakt.pl).
  function getProfile(host) {
    const h = (host || '').toLowerCase().replace(/^www\./, '');
    for (const domain of Object.keys(PORTAL_PROFILES)) {
      if (h === domain || h.endsWith('.' + domain)) return PORTAL_PROFILES[domain];
    }
    return DEFAULT_PROFILE;
  }

  CBD.profiles = { PORTAL_PROFILES, getProfile };
})(typeof globalThis !== 'undefined' ? globalThis : self);
