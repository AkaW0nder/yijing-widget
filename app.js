import { parseCivil, civilTimestamp, resolveCivil, parseLongitude, parseOffset,
  calculateSolarTime, formatOffset, formatDuration, solarClock, solarDate } from './core/time.js';
import { installPromotion } from './promotion.js';

const words = {
  de: {
    eyebrow: 'ZEIT IM EINKLANG MIT DER SONNE', title: 'Jeder Ort hat seine Zeit.',
    intro: 'Von der Uhrzeit zur Sonnenzeit. Berechne die mittlere und wahre Ortszeit für deinen Geburtsort.',
    inputTitle: 'Deine Angaben', example: 'Beispiel laden', date: 'Geburtsdatum', dateHint: 'Jahre 1900–2100',
    time: 'Lokale Uhrzeit', timeHint: 'Wie am Geburtsort aufgezeichnet', country: 'Land', city: 'Geburtsort',
    cityPlaceholder: 'Stadt suchen …', cityHint: 'Ort auswählen oder Koordinaten unten eingeben.',
    loading: 'Daten werden geladen …', advanced: 'Koordinaten & Zeitzone bearbeiten',
    manualHint: 'Für fehlende Orte: Längengrad und Zeitzone selbst eingeben. Die Zeitzone lässt sich nicht allein aus dem Längengrad ableiten.',
    longitudeInput: 'Längengrad (Dezimalgrad)', longitudeHint: 'Ost positiv, West negativ · −180 bis +180',
    zoneInput: 'Zeitzone des Ortes', override: 'Historischen UTC-Abstand manuell vorgeben',
    offsetInput: 'Abstand zu UTC, inklusive Sommerzeit', offsetHint: '±HH:MM oder ±HH:MM:SS. Ersetzt die automatische Zeitzonenregel vollständig.',
    ambiguous: 'Diese Uhrzeit kommt zweimal vor. Welche ist gemeint?', chooseOccurrence: 'Bitte auswählen',
    calculate: 'Sonnenzeit berechnen', privacy: 'Deine Eingaben bleiben in diesem Browser.',
    outputTitle: 'Deine Sonnenzeit', sample: 'BEISPIEL', emptyTitle: 'Ein anderer Blick auf die Zeit.',
    emptyText: 'Gib Datum, Uhrzeit und Ort ein. Hier siehst du, wie sich die Uhrzeit in Sonnenzeit übersetzt.',
    apparent: 'WAHRE ORTSZEIT · WOZ', longitudeResult: 'Längengrad', zoneResult: 'Zeitzone am gewählten Datum',
    mean: 'Mittlere Ortszeit', equation: 'Zeitgleichung', equationHint: 'Wahre − mittlere Ortszeit', minutesSeconds: 'Minuten : Sekunden',
    historical: 'Vor 1970 sind historische Zeitzonendaten nicht überall vollständig. Prüfe den angezeigten UTC-Abstand; bei Bedarf kannst du ihn manuell vorgeben.',
    breakdown: 'Rechenweg ansehen', longitudeShift: 'Längengrad-Korrektur ab UTC', totalCorrection: 'Gesamtkorrektur der Uhrzeit',
    formula: 'MOZ = UTC + Längengrad × 4 Minuten. WOZ = MOZ + Zeitgleichung. Ein Datumswechsel wird mitgerechnet.',
    accuracy: 'Nach dem astronomischen Modell der Yi-Jing-App. Sekunden sind gerundete Rechenwerte; die Genauigkeit hängt auch von Geburtsangaben und historischen Zeitzonendaten ab.',
    footer: 'Die Uhr folgt der Zeitzone. Die Sonne folgt dem Ort.', dataSources: 'Daten & Hinweise',
    coverage: 'Ortsliste: weltweit größere Städte und Hauptstädte; zusätzliche Orte in Österreich, Deutschland und der Schweiz. Fehlende Orte können manuell eingegeben werden.',
    sources: 'Ortsdaten:', zoneSource: 'Zeitzonen:', notices: 'Quellenhinweise',
    noStorage: 'Keine Cookies, keine Analysewerkzeuge, keine Speicherung deiner Geburtsangaben. Ortssuche und Berechnung erfolgen lokal mit den mitgelieferten Daten.',
    invalidDate: 'Bitte ein gültiges Datum von 1900 bis 2100 und eine gültige lokale Uhrzeit eingeben.',
    invalidLongitude: 'Bitte einen Ort aus der Liste wählen oder einen Längengrad zwischen −180 und +180 eingeben.',
    invalidZone: 'Bitte eine Zeitzone aus der Liste wählen, z. B. Europe/Vienna.',
    invalidOffset: 'Bitte den UTC-Abstand als +HH:MM oder −HH:MM eingeben (maximal ±14:00). Sekunden sind optional.',
    invalidInstant: 'Die Angaben konnten nicht aufgelöst werden. Bitte Datum, Uhrzeit und Zeitzone prüfen.',
    gap: 'Diese lokale Uhrzeit existiert wegen einer Zeitumstellung nicht. Bitte die aufgezeichnete Uhrzeit prüfen oder einen belegten historischen UTC-Abstand manuell eingeben.',
    loadError: 'Die mitgelieferten Daten konnten nicht geladen werden. Bitte die Seite neu laden und sicherstellen, dass alle Widget-Dateien auf dem Server liegen.',
    noMatches: 'Kein passender Ort. Suchbegriff ändern oder Koordinaten manuell eingeben.',
    chooseCity: 'Bitte einen Treffer auswählen. Für fehlende Orte können die Koordinaten manuell eingegeben werden.',
    summer: 'Sommerzeit-Anpassung', noSummer: 'Keine Sommerzeit-Anpassung', manual: 'UTC-Abstand manuell vorgegeben',
    earlier: 'Erstes Vorkommen', later: 'Zweites Vorkommen', correction: 'gegenüber der eingegebenen Uhrzeit',
    nextDay: 'nächster Tag', previousDay: 'vorheriger Tag', dayDifference: 'Tage Unterschied',
    manualPlace: 'Manuell angegebener Ort', dataVersion: 'Orte · Datenstand', tzVersion: 'Zeitzonenstand',
    changeSign: 'Vorzeichen wechseln: Ost oder West',
    promoEyebrow: 'DIE APP ZUM WIDGET', promoTitle: 'Deine Sonnenzeit ist erst der Anfang.',
    promoText: 'Entdecke die volle Yi-Jing-Astrologie: Lebenshexagramme, Zeitspiegel und deine persönlichen Profile – in einer App.',
    promoFeatures: 'Lebenshexagramme · Jahres-, Monats- & Tagesansichten · Profile & Notizen',
    promoCta: 'Im App Store herunterladen', promoPlatform: 'Für iPhone & iPad',
    promoDialogEyebrow: 'VON DER SONNENZEIT ZU DEINEM YI JING',
    promoDialogTitle: 'Mehr entdecken. Zusammenhänge erkennen.',
    promoDialogText: 'Deine Zeitkorrektur ist berechnet. Mit YiJing Astro gehst du weiter: Erkunde deine Lebenshexagramme und verfolge ihre Entwicklung im Zeitspiegel.',
    promoBenefitLife: 'Persönliche Lebens- und Entwicklungshexagramme',
    promoBenefitTime: 'Jahres-, Monats- und Tagesansichten',
    promoBenefitProfiles: 'Geburtsprofile und eigene Notizen an einem Ort',
    promoClose: 'App-Hinweis schließen', promoLater: 'Weiter zum Ergebnis',
  },
  en: {
    eyebrow: 'TIME IN TUNE WITH THE SUN', title: 'Every place has its own time.',
    intro: 'From clock time to solar time. Find the mean and apparent solar time for your birth place.',
    inputTitle: 'Your details', example: 'Load example', date: 'Date of birth', dateHint: 'Years 1900–2100',
    time: 'Local clock time', timeHint: 'As recorded at the birth place', country: 'Country', city: 'Birth place',
    cityPlaceholder: 'Search for a town or city …', cityHint: 'Select a place, or enter coordinates below.',
    loading: 'Loading local data …', advanced: 'Edit coordinates & time zone',
    manualHint: 'For a missing place, enter its longitude and time zone. Longitude alone does not determine the time zone.',
    longitudeInput: 'Longitude (decimal degrees)', longitudeHint: 'East positive, west negative · −180 to +180',
    zoneInput: 'Time zone of the place', override: 'Enter a historical UTC offset manually',
    offsetInput: 'UTC offset, including daylight saving', offsetHint: '±HH:MM or ±HH:MM:SS. Completely replaces the automatic time-zone rule.',
    ambiguous: 'This clock time occurred twice. Which occurrence do you mean?', chooseOccurrence: 'Please select',
    calculate: 'Calculate solar time', privacy: 'Your details stay in this browser.',
    outputTitle: 'Your solar time', sample: 'EXAMPLE', emptyTitle: 'Another way to look at time.',
    emptyText: 'Enter a date, clock time and place. Your conversion to solar time will appear here.',
    apparent: 'APPARENT SOLAR TIME · WOZ', longitudeResult: 'Longitude', zoneResult: 'Time zone on the selected date',
    mean: 'Mean solar time', equation: 'Equation of time', equationHint: 'Apparent − mean solar time', minutesSeconds: 'Minutes : seconds',
    historical: 'Before 1970, historical time-zone data is incomplete in some locations. Check the UTC offset shown; you can enter a documented offset manually if needed.',
    breakdown: 'Show the calculation', longitudeShift: 'Longitude correction from UTC', totalCorrection: 'Total correction to clock time',
    formula: 'Mean solar time = UTC + longitude × 4 minutes. Apparent solar time = mean solar time + equation of time. Date changes are included.',
    accuracy: 'Uses the astronomical model of the Yi Jing app. Seconds are rounded calculated values; accuracy also depends on birth records and historical time-zone data.',
    footer: 'The clock follows the time zone. The sun follows the place.', dataSources: 'Data & notes',
    coverage: 'Place list: larger cities and capitals worldwide, with additional places in Austria, Germany and Switzerland. Missing places can be entered manually.',
    sources: 'Place data:', zoneSource: 'Time zones:', notices: 'Source notices',
    noStorage: 'No cookies, no analytics and no storage of your birth details. Place search and calculation run locally using the bundled data.',
    invalidDate: 'Enter a valid date from 1900 to 2100 and a valid local clock time.',
    invalidLongitude: 'Select a place from the results, or enter a longitude between −180 and +180.',
    invalidZone: 'Select a time zone from the list, for example Europe/Vienna.',
    invalidOffset: 'Enter a UTC offset as +HH:MM or −HH:MM (maximum ±14:00). Seconds are optional.',
    invalidInstant: 'These details could not be resolved. Check the date, clock time and time zone.',
    gap: 'This local clock time did not occur because the clocks changed. Check the recorded time, or enter a documented historical UTC offset manually.',
    loadError: 'The bundled data could not be loaded. Reload the page and check that all widget files are present on the server.',
    noMatches: 'No matching place. Try another spelling, or enter coordinates manually.',
    chooseCity: 'Select a search result. For a missing place you can enter coordinates manually.',
    summer: 'Daylight-saving adjustment', noSummer: 'No daylight-saving adjustment', manual: 'UTC offset entered manually',
    earlier: 'First occurrence', later: 'Second occurrence', correction: 'compared with the entered clock time',
    nextDay: 'next day', previousDay: 'previous day', dayDifference: 'days difference',
    manualPlace: 'Manually entered place', dataVersion: 'places · data snapshot', tzVersion: 'time-zone snapshot',
    changeSign: 'Change sign: east or west',
    promoEyebrow: 'THE APP BEHIND THE WIDGET', promoTitle: 'Your solar time is just the beginning.',
    promoText: 'Explore the full YiJing astrology experience: life hexagrams, the Time Mirror and your personal profiles – together in one app.',
    promoFeatures: 'Life hexagrams · Yearly, monthly & daily views · Profiles & notes',
    promoCta: 'Download on the App Store', promoPlatform: 'For iPhone & iPad',
    promoDialogEyebrow: 'FROM SOLAR TIME TO YOUR YIJING',
    promoDialogTitle: 'Explore more. See the connections.',
    promoDialogText: 'Your time correction is ready. Take the next step with YiJing Astro: explore your life hexagrams and follow their development in the Time Mirror.',
    promoBenefitLife: 'Personal life and development hexagrams',
    promoBenefitTime: 'Yearly, monthly and daily views',
    promoBenefitProfiles: 'Birth profiles and your notes in one place',
    promoClose: 'Close app invitation', promoLater: 'Back to my result',
  },
};

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
let language = ['de', 'en'].includes(params.get('lang')) ? params.get('lang') : 'de';
let database;
let manifest;
let countries = [];
let cities = [];
let selectedPlace = null;
let visibleCities = [];
let activeIndex = -1;
let requestNumber = 0;
let result = null;
let resultCivil = null;
let sample = false;
let ambiguityKey = '';
let errorKey = '';
const cityCache = new Map();
const promotion = installPromotion({
  dialog: $('app-promo-dialog'), links: document.querySelectorAll('[data-app-store]'),
  isResultVisible: () => result !== null && !$('result').hidden,
});
const text = (key) => words[language][key] || key;
const setText = (id, value) => { $(id).textContent = value; };
const fold = (value) => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ß/g, 'ss');
const germanRegions = {
  Vienna: 'Wien', Tyrol: 'Tirol', Styria: 'Steiermark', 'Upper Austria': 'Oberösterreich',
  'Lower Austria': 'Niederösterreich', Carinthia: 'Kärnten', Thuringia: 'Thüringen',
  'Saxony-Anhalt': 'Sachsen-Anhalt', Saxony: 'Sachsen', 'North Rhine-Westphalia': 'Nordrhein-Westfalen',
  'Lower Saxony': 'Niedersachsen', Hesse: 'Hessen', 'State of Berlin': 'Berlin',
  Bavaria: 'Bayern', 'Baden-Wurttemberg': 'Baden-Württemberg',
};
const regionName = (place) => language === 'de' ? germanRegions[place.region] || place.region : place.region;

function countryName(country) {
  try { return new Intl.DisplayNames([language], { type: 'region' }).of(country.code); }
  catch { return country.name; }
}

async function json(path) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error('loadError');
  return response.json();
}

function showError(key) {
  errorKey = key;
  setText('error', text(key));
  $('error').hidden = false;
}

function resetResult() {
  promotion.cancelPending();
  result = null;
  sample = false;
  errorKey = '';
  $('result').hidden = true;
  $('empty-result').hidden = false;
  $('sample-badge').hidden = true;
  $('error').hidden = true;
  $('ambiguity').hidden = true;
  $('occurrence').replaceChildren();
  ambiguityKey = '';
}

function renderCountries() {
  const selected = $('country').value || 'AT';
  $('country').replaceChildren(...[...countries].sort((a, b) => countryName(a).localeCompare(countryName(b), language)).map((country) => {
    const option = new Option(countryName(country), country.code);
    option.selected = country.code === selected;
    return option;
  }));
}

function updatePlace() {
  $('chosen-place').hidden = !selectedPlace;
  if (!selectedPlace) return;
  setText('place-name', selectedPlace.name);
  setText('place-detail', [regionName(selectedPlace), selectedPlace.zone].filter(Boolean).join(' · '));
}

function closeSearch() {
  $('city-results').hidden = true;
  $('city').setAttribute('aria-expanded', 'false');
  $('city').removeAttribute('aria-activedescendant');
  activeIndex = -1;
}

function choosePlace(place) {
  resetResult();
  selectedPlace = place;
  $('city').value = place.name;
  $('longitude').value = String(place.longitude).replace('.', language === 'de' ? ',' : '.');
  $('zone').value = place.zone;
  $('override').checked = false;
  $('offset-field').hidden = true;
  setText('city-help', text('cityHint'));
  closeSearch();
  updatePlace();
}

function renderSearch() {
  const query = fold($('city').value.trim());
  visibleCities = cities.filter((city) => !query || city.search.includes(query))
    .sort((a, b) => Number(fold(b.name).startsWith(query)) - Number(fold(a.name).startsWith(query)) || b.population - a.population)
    .slice(0, 30);
  $('city-results').replaceChildren(...visibleCities.map((city, index) => {
    const item = document.createElement('li');
    item.id = `city-option-${index}`;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    const name = document.createElement('strong');
    name.textContent = city.name;
    const detail = document.createElement('small');
    detail.textContent = [regionName(city), city.zone].filter(Boolean).join(' · ');
    item.append(name, detail);
    item.addEventListener('pointerdown', (event) => event.preventDefault());
    item.addEventListener('click', () => choosePlace(city));
    return item;
  }));
  $('city-results').hidden = !visibleCities.length;
  $('city').setAttribute('aria-expanded', String(!!visibleCities.length));
  $('city').removeAttribute('aria-activedescendant');
  activeIndex = -1;
  setText('city-help', text(visibleCities.length ? 'chooseCity' : 'noMatches'));
}

async function loadCountry(code) {
  const request = ++requestNumber;
  resetResult();
  selectedPlace = null;
  cities = [];
  $('city').value = '';
  $('longitude').value = '';
  $('zone').value = '';
  $('city').disabled = true;
  $('calculate').disabled = true;
  closeSearch();
  updatePlace();
  setText('city-help', text('loading'));
  try {
    if (!cityCache.has(code)) cityCache.set(code, json(`./data/cities/${code}.json`));
    const loaded = await cityCache.get(code);
    if (request !== requestNumber) return false;
    cities = loaded.map((city) => ({ ...city, search: fold(`${city.name} ${city.region} ${germanRegions[city.region] || ''} ${city.aliases}`) }));
    setText('city-help', text('cityHint'));
    return true;
  } catch {
    cityCache.delete(code);
    if (request === requestNumber) showError('loadError');
    return false;
  } finally {
    if (request === requestNumber) {
      $('city').disabled = false;
      $('calculate').disabled = !database;
    }
  }
}

function renderResult() {
  if (!result) return;
  const r = result;
  const number = new Intl.NumberFormat(language, { maximumFractionDigits: 5 });
  const hemisphere = r.longitude < 0 ? 'W' : (language === 'de' ? 'O' : 'E');
  const absolute = Math.abs(r.longitude);
  let degree = Math.floor(absolute);
  let minute = Math.round((absolute - degree) * 6000) / 100;
  if (minute === 60) { degree++; minute = 0; }
  setText('longitude-result', `${number.format(absolute)}° ${hemisphere}`);
  setText('longitude-degrees', `${degree}° ${number.format(minute)}′ ${hemisphere}`);
  setText('offset-result', formatOffset(r.offsetSeconds));
  setText('zone-result', r.manual ? text('manual') : `${r.zone} · ${r.abbreviation}`);
  setText('dst-result', r.manual ? '' : (r.dstSeconds ? `${text('summer')}: ${formatDuration(r.dstSeconds)} min` : text('noSummer')));
  setText('mean-clock', solarClock(r.meanSolarMilliseconds));
  setText('mean-date', solarDate(r.meanSolarMilliseconds, language));
  setText('equation-result', formatDuration(r.equationSeconds));
  setText('apparent-clock', solarClock(r.apparentSolarMilliseconds));
  const solarDay = Math.floor(Math.round(r.apparentSolarMilliseconds / 1000) / 86400);
  const civilDay = Math.floor(civilTimestamp(resultCivil) / 86400000);
  const days = solarDay - civilDay;
  const dayLabel = days === 1 ? text('nextDay') : days === -1 ? text('previousDay') : `${days > 0 ? '+' : ''}${days} ${text('dayDifference')}`;
  setText('apparent-date', solarDate(r.apparentSolarMilliseconds, language) + (days ? ` · ${dayLabel}` : ''));
  setText('correction', `${formatDuration(r.correctionSeconds)} min ${text('correction')}`);
  setText('utc-result', `${solarDate(r.utcMilliseconds, language)} · ${solarClock(r.utcMilliseconds)}`);
  setText('longitude-shift', `${formatDuration(r.longitudeSeconds)} min`);
  setText('total-correction', `${formatDuration(r.correctionSeconds)} min`);
  $('historical').hidden = resultCivil.year >= 1970;
  $('empty-result').hidden = true;
  $('result').hidden = false;
  $('sample-badge').hidden = !sample;
}

function calculate({ promote = false } = {}) {
  promotion.cancelPending();
  errorKey = '';
  $('error').hidden = true;
  $('result').hidden = true;
  $('empty-result').hidden = false;
  try {
    const civil = parseCivil($('date').value, $('time').value);
    const longitude = parseLongitude($('longitude').value);
    const zone = $('zone').value.trim();
    let resolved;
    if ($('override').checked) {
      const offsetSeconds = parseOffset($('offset').value);
      resolved = { utcMilliseconds: civilTimestamp(civil) - offsetSeconds * 1000, offsetSeconds,
        dstSeconds: null, abbreviation: '', manual: true, zone };
      $('ambiguity').hidden = true;
    } else {
      const candidates = resolveCivil(database, zone, civil);
      if (!candidates.length) throw new RangeError('gap');
      if (candidates.length > 1) {
        const key = JSON.stringify([civil, zone]);
        if (key !== ambiguityKey) {
          ambiguityKey = key;
          $('occurrence').replaceChildren(new Option(text('chooseOccurrence'), ''), ...candidates.map((candidate, i) =>
            new Option(`${text(i === 0 ? 'earlier' : 'later')} · ${formatOffset(candidate.offsetSeconds)} · ${candidate.abbreviation}`, String(candidate.utcMilliseconds))));
        }
        $('ambiguity').hidden = false;
        resolved = candidates.find((candidate) => String(candidate.utcMilliseconds) === $('occurrence').value);
        if (!resolved) { $('occurrence').focus(); return; }
      } else {
        $('ambiguity').hidden = true;
        resolved = candidates[0];
      }
      resolved = { ...resolved, zone, manual: false };
    }
    resultCivil = civil;
    result = calculateSolarTime(civil, longitude, resolved);
    renderResult();
    if (promote) promotion.calculationSucceeded(JSON.stringify([civil, longitude, resolved.utcMilliseconds, resolved.offsetSeconds]));
  } catch (error) {
    result = null;
    showError(words[language][error.message] ? error.message : 'invalidInstant');
    if (['invalidLongitude', 'invalidZone', 'invalidOffset'].includes(error.message)) $('advanced').open = true;
  }
}

function translate() {
  document.documentElement.lang = language;
  document.title = language === 'de' ? 'Zeitkorrektur · Yi Jing' : 'Solar time calculator · Yi Jing';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = text(node.dataset.i18n); });
  document.querySelectorAll('[data-placeholder]').forEach((node) => { node.placeholder = text(node.dataset.placeholder); });
  document.querySelectorAll('[data-aria]').forEach((node) => { node.setAttribute('aria-label', text(node.dataset.aria)); });
  document.querySelectorAll('[data-language]').forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.language === language)));
  $('city-results').setAttribute('aria-label', text('city'));
  if (countries.length) renderCountries();
  if (manifest) setText('data-version', `${manifest.cityCount.toLocaleString(language)} ${text('dataVersion')} ${manifest.generated} · IANA ${manifest.tzdata}`);
  if (errorKey) setText('error', text(errorKey));
  if (!$('city-results').hidden) renderSearch();
  if (!$('ambiguity').hidden) {
    const occurrence = $('occurrence').value;
    ambiguityKey = '';
    calculate();
    $('occurrence').value = occurrence;
    if (occurrence) calculate();
  }
  updatePlace();
  renderResult();
}

$('calculator').addEventListener('submit', (event) => { event.preventDefault(); closeSearch(); calculate({ promote: true }); });
$('calculator').addEventListener('input', (event) => {
  if (event.target.id === 'occurrence') return;
  resetResult();
  if (event.target.id === 'city') {
    selectedPlace = null;
    $('longitude').value = '';
    $('zone').value = '';
    updatePlace();
    renderSearch();
  } else if (['longitude', 'zone'].includes(event.target.id)) {
    selectedPlace = null;
    updatePlace();
  }
});
$('country').addEventListener('change', () => loadCountry($('country').value));
$('override').addEventListener('change', () => { $('offset-field').hidden = !$('override').checked; });
$('occurrence').addEventListener('change', () => calculate({ promote: true }));
$('longitude-sign').addEventListener('click', () => {
  const value = $('longitude').value.trim();
  $('longitude').value = value.startsWith('-') ? value.slice(1) : `-${value.replace(/^\+/, '')}`;
  $('longitude').dispatchEvent(new Event('input', { bubbles: true }));
});
$('city').addEventListener('focus', () => { if (!selectedPlace && cities.length) renderSearch(); });
$('city').addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { closeSearch(); return; }
  if (event.key === 'Enter' && !$('city-results').hidden) {
    event.preventDefault();
    if (activeIndex >= 0) choosePlace(visibleCities[activeIndex]);
    return;
  }
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  if ($('city-results').hidden) renderSearch();
  if (!visibleCities.length) return;
  activeIndex = activeIndex === -1 ? (event.key === 'ArrowDown' ? 0 : visibleCities.length - 1) :
    (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + visibleCities.length) % visibleCities.length;
  Array.from($('city-results').children).forEach((node, i) => node.setAttribute('aria-selected', String(i === activeIndex)));
  const item = $(`city-option-${activeIndex}`);
  $('city').setAttribute('aria-activedescendant', item.id);
  item.scrollIntoView({ block: 'nearest' });
});
$('city').addEventListener('blur', closeSearch);
document.addEventListener('pointerdown', (event) => { if (!event.target.closest('.city-field')) closeSearch(); });
document.querySelectorAll('[data-language]').forEach((button) => button.addEventListener('click', () => {
  language = button.dataset.language;
  translate();
}));

async function loadExample() {
  $('country').value = 'AT';
  if (!await loadCountry('AT')) return;
  choosePlace(cities.find((city) => city.name === 'Graz'));
  $('date').value = '2020-01-31';
  $('time').value = '15:00:00';
  $('advanced').open = false;
  sample = true;
  calculate();
}
$('example').addEventListener('click', loadExample);

// Only same-origin, explicitly handshaken parents receive dimensions, never inputs.
let parentOrigin = null;
window.addEventListener('message', (event) => {
  if (event.source !== window.parent || event.origin !== location.origin ||
      event.data?.type !== 'yijing:hello') return;
  parentOrigin = event.origin;
  sendHeight();
});
function sendHeight() {
  if (window.parent !== window && parentOrigin) window.parent.postMessage({
    type: 'yijing:height', height: Math.min(10000, Math.ceil(document.querySelector('.widget').getBoundingClientRect().height)),
  }, parentOrigin);
}
new ResizeObserver(sendHeight).observe(document.body);

translate();
try {
  [database, manifest, countries] = await Promise.all([
    json('./data/timezones.json'), json('./data/manifest.json'), json('./data/countries.json'),
  ]);
  $('zone-options').replaceChildren(...Object.keys(database.zones).sort().map((name) => new Option(name, name)));
  $('country').disabled = false;
  // The loading option has no country value; choose Austria deliberately.
  $('country').replaceChildren(new Option('', 'AT'));
  renderCountries();
  translate();
  await loadExample();
} catch {
  showError('loadError');
}
