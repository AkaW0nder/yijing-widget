import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { equationOfTime, julianDate } from '../core/astronomy.js';
import { parseCivil, civilTimestamp, resolveCivil, zoneState, parseLongitude, parseOffset,
  calculateSolarTime, formatDuration, formatOffset, solarClock, solarDate } from '../core/time.js';

const database = JSON.parse(await readFile(new URL('../data/timezones.json', import.meta.url)));
const fixtures = JSON.parse(await readFile(new URL('./fixtures/swift-astronomy.json', import.meta.url)));
const civil = (date, time = '12:00:00') => parseCivil(date, time);
const near = (actual, expected, tolerance = 0.000001) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test('all 36 astronomy fixtures agree with the app, including its corrected wrap', () => {
  for (const fixture of fixtures) {
    const [y, m, d, h, minute] = fixture.civilUTC;
    const ms = Date.UTC(y, m - 1, d, h, minute);
    near(julianDate(ms), fixture.julianDate, 0.000000001);
    near(equationOfTime(ms), fixture.equationSeconds, 0.000001);
  }
});

test('March equinox EoT stays continuous instead of adding an entire solar day', () => {
  const before = equationOfTime(Date.UTC(2026, 2, 20, 12));
  const after = equationOfTime(Date.UTC(2026, 2, 21, 12));
  near(after, -428.284569926, 0.000001);
  assert.ok(Math.abs(after - before) < 25);
  for (let day = 0; day < 366; day++) assert.ok(Math.abs(equationOfTime(Date.UTC(2026, 0, 1 + day, 12))) < 1200);
});

// Independent shorter solar model, used as a broad sanity reference rather
// than claiming identical accuracy. NOAA Solar Calculation Details / Meeus.
function independentEoT(ms) {
  const t = (julianDate(ms) - 2451545) / 36525;
  const rad = Math.PI / 180;
  const l = (280.46646 + t * (36000.76983 + t * 0.0003032)) * rad;
  const m = (357.52911 + t * (35999.05029 - 0.0001537 * t)) * rad;
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const epsilon = (23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 +
    0.00256 * Math.cos((125.04 - 1934.136 * t) * rad)) * rad;
  const y = Math.tan(epsilon / 2) ** 2;
  return 240 / rad * (y * Math.sin(2 * l) - 2 * e * Math.sin(m) +
    4 * e * y * Math.sin(m) * Math.cos(2 * l) - 0.5 * y * y * Math.sin(4 * l) - 1.25 * e * e * Math.sin(2 * m));
}

test('astronomy agrees with independent short Meeus solar model across supported centuries', () => {
  for (const year of [1900, 1950, 2000, 2026, 2100]) for (let month = 0; month < 12; month++) {
    const ms = Date.UTC(year, month, 15, 12);
    near(equationOfTime(ms), independentEoT(ms), 8);
  }
});

test('Graz screenshot example resolves and exposes each requested calculation stage', () => {
  const input = civil('2020-01-31', '15:00:00');
  const [resolved] = resolveCivil(database, 'Europe/Vienna', input);
  assert.equal(resolved.offsetSeconds, 3600);
  assert.equal(resolved.dstSeconds, 0);
  const result = calculateSolarTime(input, 15.4395, resolved);
  assert.equal(solarClock(result.utcMilliseconds), '14:00:00');
  assert.equal(solarClock(result.meanSolarMilliseconds), '15:01:45');
  assert.equal(solarClock(result.apparentSolarMilliseconds), '14:48:23');
  assert.equal(formatDuration(result.equationSeconds), '−13:22');
  assert.equal(formatDuration(result.correctionSeconds), '−11:37');
});

test('Vienna winter/summer and historical wartime summer rules are date-specific', () => {
  const winter = resolveCivil(database, 'Europe/Vienna', civil('2026-01-15'))[0];
  const summer = resolveCivil(database, 'Europe/Vienna', civil('2026-07-15'))[0];
  const oldSummer = resolveCivil(database, 'Europe/Vienna', civil('1943-07-15'))[0];
  assert.equal(winter.offsetSeconds, 3600);
  assert.equal(summer.offsetSeconds, 7200);
  assert.equal(summer.dstSeconds, 3600);
  assert.equal(oldSummer.offsetSeconds, 7200);
});

test('spring gaps are rejected; rollback returns both physical instants', () => {
  assert.deepEqual(resolveCivil(database, 'Europe/Vienna', civil('2026-03-29', '02:30:00')), []);
  const repeated = resolveCivil(database, 'Europe/Vienna', civil('2026-10-25', '02:30:00'));
  assert.equal(repeated.length, 2);
  assert.deepEqual(repeated.map((value) => value.offsetSeconds), [7200, 3600]);
  assert.equal(repeated[1].utcMilliseconds - repeated[0].utcMilliseconds, 3600000);
});

test('Lord Howe half-hour daylight changes and Samoa skipped date are preserved', () => {
  const repeated = resolveCivil(database, 'Australia/Lord_Howe', civil('2026-04-05', '01:45:00'));
  assert.equal(repeated.length, 2);
  assert.equal(repeated[1].utcMilliseconds - repeated[0].utcMilliseconds, 1800000);
  assert.deepEqual(resolveCivil(database, 'Australia/Lord_Howe', civil('2026-10-04', '02:15:00')), []);
  assert.deepEqual(resolveCivil(database, 'Pacific/Apia', civil('2011-12-30')), []);
});

test('quarter-hour offsets, historical seconds and negative DST survive data export', () => {
  assert.equal(resolveCivil(database, 'Asia/Kathmandu', civil('2026-07-15'))[0].offsetSeconds, 20700);
  assert.equal(resolveCivil(database, 'Asia/Kolkata', civil('2026-07-15'))[0].offsetSeconds, 19800);
  assert.equal(resolveCivil(database, 'Europe/Amsterdam', civil('1900-06-15'))[0].offsetSeconds, 1172);
  const dublin = resolveCivil(database, 'Europe/Dublin', civil('2026-01-15'))[0];
  assert.equal(dublin.offsetSeconds, 0);
  assert.equal(dublin.dstSeconds, -3600);
});

test('future recurrence expansion works in 2100 and civil boundary years resolve', () => {
  assert.equal(resolveCivil(database, 'Europe/Vienna', civil('2100-07-15'))[0].offsetSeconds, 7200);
  assert.equal(resolveCivil(database, 'Europe/Vienna', civil('2100-01-15'))[0].offsetSeconds, 3600);
  assert.equal(resolveCivil(database, 'Pacific/Kiritimati', civil('1900-01-01', '00:00:00')).length, 1);
  assert.equal(resolveCivil(database, 'America/New_York', civil('2100-12-31', '23:59:59')).length, 1);
});

test('every bundled time-zone transition has ordered states and exact boundary lookup', () => {
  for (const [zone, rows] of Object.entries(database.zones)) {
    assert.equal(rows[0][0], database.start);
    for (let i = 1; i < rows.length; i++) {
      assert.ok(rows[i][0] > rows[i - 1][0], zone);
      assert.equal(zoneState(database, zone, rows[i][0] * 1000).offsetSeconds, rows[i][1]);
      assert.equal(zoneState(database, zone, rows[i][0] * 1000 - 1).offsetSeconds, rows[i - 1][1]);
    }
  }
});

test('strict dates reject overflow and invalid leaps; seconds are retained', () => {
  for (const date of ['1900-02-29', '2100-02-29', '2026-04-31', '1899-12-31', '2101-01-01', '2026-00-01']) {
    assert.throws(() => civil(date), /invalidDate/);
  }
  assert.throws(() => civil('2026-01-01', '24:00:00'), /invalidDate/);
  assert.throws(() => civil('2026-01-01', '12:00:60'), /invalidDate/);
  assert.equal(civil('2000-02-29', '12:03:47').second, 47);
  const input = civil('2020-01-31', '15:00:37');
  assert.equal(solarClock(resolveCivil(database, 'Europe/Vienna', input)[0].utcMilliseconds), '14:00:37');
});

test('manual offsets replace zone rules entirely and preserve their seconds', () => {
  const input = civil('2026-03-29', '02:30:00');
  const offsetSeconds = parseOffset('+01:00:12');
  const result = calculateSolarTime(input, 16, { utcMilliseconds: civilTimestamp(input) - offsetSeconds * 1000, offsetSeconds });
  assert.equal(solarClock(result.utcMilliseconds), '01:29:48');
  for (const offset of ['01:00', '+14:01', '-15:00', '+00:60', '+01:00:60']) assert.throws(() => parseOffset(offset), /invalidOffset/);
  assert.equal(parseOffset('-03:30'), -12600);
});

test('signed decimal longitudes accept both separators and reject malformed values', () => {
  assert.equal(parseLongitude('-74,5'), -74.5);
  assert.equal(parseLongitude('15.4395'), 15.4395);
  for (const value of ['', ' ', 'NaN', '181', '-181', '15,4,2', '1e2']) assert.throws(() => parseLongitude(value), /invalidLongitude/);
  assert.throws(() => resolveCivil(database, '__proto__', civil('2026-01-01')), /invalidZone/);
});

test('west longitudes and extreme offsets preserve previous/next calendar dates', () => {
  const input = civil('2020-01-01', '00:10:00');
  const offsetSeconds = 14 * 3600;
  const result = calculateSolarTime(input, -170, { utcMilliseconds: civilTimestamp(input) - offsetSeconds * 1000, offsetSeconds });
  assert.ok(result.apparentSolarMilliseconds < Date.UTC(2019, 11, 31));
  const laterInput = civil('2020-12-31', '23:59:00');
  const later = calculateSolarTime(laterInput, 180, { utcMilliseconds: civilTimestamp(laterInput), offsetSeconds: 0 });
  assert.equal(new Date(later.apparentSolarMilliseconds).getUTCFullYear(), 2021);
});

test('rounding carries seconds cleanly and solar dates use the selected language', () => {
  assert.equal(formatDuration(-59.7), '−01:00');
  assert.equal(formatOffset(-12600), 'UTC−03:30');
  assert.equal(formatOffset(1172), 'UTC+00:19:32');
  assert.equal(solarClock(Date.UTC(2020, 0, 31, 23, 59, 59, 800)), '00:00:00');
  assert.match(solarDate(Date.UTC(2020, 0, 31), 'de'), /Jänner|Januar/);
  assert.match(solarDate(Date.UTC(2020, 0, 31), 'en'), /January/);
});

test('browser/device zone cannot change calculation or solar display', () => {
  const module = new URL('../core/time.js', import.meta.url).href;
  const script = `import {parseCivil,calculateSolarTime,solarDate} from ${JSON.stringify(module)};
    const c=parseCivil('2020-01-31','15:00:00');
    const r=calculateSolarTime(c,15.4395,{utcMilliseconds:Date.UTC(2020,0,31,14),offsetSeconds:3600});
    console.log(JSON.stringify([r,solarDate(r.apparentSolarMilliseconds,'de')]));`;
  const values = ['UTC', 'Europe/Vienna', 'America/New_York', 'Asia/Tokyo'].map((TZ) =>
    execFileSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, TZ }, encoding: 'utf8' }));
  assert.equal(new Set(values).size, 1);
});
