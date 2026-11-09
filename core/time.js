/** UTC instants and solar clock readings are deliberately separate values. */
import { equationOfTime } from './astronomy.js';

export function civilTimestamp({ year, month, day, hour, minute, second = 0 }) {
  const fields = [year, month, day, hour, minute, second];
  if (!fields.every(Number.isInteger) || year < 1900 || year > 2100 ||
      month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 ||
      minute < 0 || minute > 59 || second < 0 || second > 59) throw new RangeError('invalidDate');
  const milliseconds = Date.UTC(year, month - 1, day, hour, minute, second);
  const date = new Date(milliseconds);
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new RangeError('invalidDate');
  return milliseconds;
}

export function parseCivil(date, time) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!d || !t) throw new RangeError('invalidDate');
  const civil = { year: +d[1], month: +d[2], day: +d[3], hour: +t[1], minute: +t[2], second: +(t[3] || 0) };
  civilTimestamp(civil);
  return civil;
}

/** State at a real UTC instant, using a versioned, bundled IANA snapshot. */
export function zoneState(database, zone, utcMilliseconds) {
  if (!Object.hasOwn(database.zones, zone)) throw new RangeError('invalidZone');
  const rows = database.zones[zone];
  const seconds = utcMilliseconds / 1000;
  if (!Number.isFinite(seconds) || seconds < database.start || seconds >= database.end) throw new RangeError('invalidDate');
  let low = 0;
  let high = rows.length;
  while (low + 1 < high) {
    const middle = (low + high) >>> 1;
    if (rows[middle][0] <= seconds) low = middle;
    else high = middle;
  }
  const [, offsetSeconds, dstSeconds, abbreviation] = rows[low];
  return { offsetSeconds, dstSeconds, abbreviation };
}

/** 0 candidates = a skipped clock reading; >1 = a repeated clock reading. */
export function resolveCivil(database, zone, civil) {
  const local = civilTimestamp(civil);
  if (!Object.hasOwn(database.zones, zone)) throw new RangeError('invalidZone');
  const rows = database.zones[zone];
  const offsets = [...new Set(rows.map((row) => row[1]))];
  const candidates = [];
  for (const offset of offsets) {
    const utcMilliseconds = local - offset * 1000;
    const state = zoneState(database, zone, utcMilliseconds);
    if (state.offsetSeconds === offset) candidates.push({ utcMilliseconds, ...state });
  }
  return candidates.sort((a, b) => a.utcMilliseconds - b.utcMilliseconds);
}

export function parseLongitude(value) {
  const text = String(value).trim().replace(',', '.');
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) throw new RangeError('invalidLongitude');
  const number = Number(text);
  if (!Number.isFinite(number) || Math.abs(number) > 180) throw new RangeError('invalidLongitude');
  return number;
}

export function parseOffset(value) {
  const match = /^([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(value).trim());
  if (!match) throw new RangeError('invalidOffset');
  const [, sign, hour, minute, second = '0'] = match;
  if (+hour > 14 || +minute > 59 || +second > 59 || (+hour === 14 && (+minute || +second))) {
    throw new RangeError('invalidOffset');
  }
  return (sign === '-' ? -1 : 1) * (+hour * 3600 + +minute * 60 + +second);
}

export function calculateSolarTime(civil, longitude, resolved) {
  civilTimestamp(civil);
  if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new RangeError('invalidLongitude');
  if (!Number.isFinite(resolved.utcMilliseconds) || !Number.isFinite(resolved.offsetSeconds) ||
      Math.abs(resolved.utcMilliseconds + resolved.offsetSeconds * 1000 - civilTimestamp(civil)) > 0.1) {
    throw new RangeError('invalidInstant');
  }
  const longitudeSeconds = longitude * 240;
  const equationSeconds = equationOfTime(resolved.utcMilliseconds);
  const meanSolarMilliseconds = resolved.utcMilliseconds + longitudeSeconds * 1000;
  return { ...resolved, longitude, longitudeSeconds, equationSeconds, meanSolarMilliseconds,
    apparentSolarMilliseconds: meanSolarMilliseconds + equationSeconds * 1000,
    correctionSeconds: longitudeSeconds + equationSeconds - resolved.offsetSeconds };
}

export function formatOffset(seconds) {
  const sign = seconds < 0 ? '−' : '+';
  const value = Math.round(Math.abs(seconds));
  const parts = [Math.floor(value / 3600), Math.floor(value % 3600 / 60)];
  if (value % 60) parts.push(value % 60);
  return `UTC${sign}${parts.map((n) => String(n).padStart(2, '0')).join(':')}`;
}

export function formatDuration(seconds) {
  const value = Math.round(Math.abs(seconds));
  return `${seconds < 0 ? '−' : '+'}${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

export function solarClock(milliseconds) {
  const date = new Date(Math.round(milliseconds / 1000) * 1000);
  return date.toISOString().slice(11, 19);
}

export function solarDate(milliseconds, language) {
  return new Intl.DateTimeFormat(language === 'de' ? 'de-AT' : 'en-GB', {
    timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric',
  }).format(new Date(Math.round(milliseconds / 1000) * 1000));
}
