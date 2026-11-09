// Port of Astronomy.swift / VSOP87D.swift (HTL Villach, Kiron Geiger, 2016).
// Same UTC-based model as the app. No claim of TT/UT1 or subsecond precision.
import { coefficients as c } from './coefficients.js';

const RAD = Math.PI / 180;
const normalize = (angle) => ((angle % 360) + 360) % 360;
const obliquity = [-4680.93, -1.55, 1999.25, -51.38, -249.67, -39.05, 7.12, 27.87, 5.79, 2.45];

export function julianDate(utcMilliseconds) {
  if (!Number.isFinite(utcMilliseconds)) throw new RangeError('invalidInstant');
  return utcMilliseconds / 86400000 + 2440587.5;
}

/** Equation of time in seconds: apparent solar time minus mean solar time. */
export function equationOfTime(utcMilliseconds) {
  const jd = julianDate(utcMilliseconds);
  const t = (jd - 2451545) / 365250;
  const century = t * 10;
  const century2 = century * century;
  const century3 = century2 * century;
  function series(axis, count) {
    let total = 0;
    for (let power = 0; power < count; power++) {
      const terms = c[`VSOP87D_${axis}${power}_EARTH`];
      const sum = terms.reduce((value, [a, b, frequency]) => value + a * Math.cos(b + frequency * t), 0);
      total += sum * t ** power;
    }
    return total;
  }
  let longitude = ((series('L', 6) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) + Math.PI;
  const latitude = -series('B', 5);
  const radius = series('R', 6);
  const correctedLongitude = longitude + (-1.397 - 0.00031 * century) * century * RAD;
  const fk5 = -0.09033 / 3600 + 0.03916 / 3600 *
    (Math.cos(correctedLongitude) + Math.sin(correctedLongitude)) * Math.tan(latitude);
  const argumentsInDegrees = [
    297.850363 + 445267.11148 * century - 0.0019142 * century2 + century3 / 189474,
    357.52772 + 35999.05034 * century - 0.0001603 * century2 - century3 / 300000,
    134.96298 + 477198.867398 * century + 0.0086972 * century2 + century3 / 56250,
    93.27191 + 483202.017538 * century - 0.0036825 * century2 + century3 / 327270,
    125.04452 - 1934.136261 * century + 0.0020708 * century2 + century3 / 450000,
  ].map(normalize);
  let deltaPsi = 0;
  let deltaEpsilon = 0;
  for (const row of c.terms) {
    const argument = row.slice(0, 5).reduce((sum, factor, i) => sum + factor * argumentsInDegrees[i], 0) * RAD;
    deltaPsi += (row[5] + row[6] * century) * Math.sin(argument);
    deltaEpsilon += (row[7] + row[8] * century) * Math.cos(argument);
  }
  deltaPsi /= 36000000;
  deltaEpsilon /= 36000000;
  longitude += RAD * (fk5 + deltaPsi - 20.4898 / 3600 / radius);
  const u = t / 10;
  let meanObliquity = 23 + 26 / 60 + 21.448 / 3600;
  for (let i = 0; i < obliquity.length; i++) meanObliquity += obliquity[i] / 3600 * u ** (i + 1);
  const epsilon = (meanObliquity + deltaEpsilon) * RAD;
  const alpha = normalize(Math.atan2(Math.sin(longitude) * Math.cos(epsilon), Math.cos(longitude)) / RAD);
  const meanLongitude = normalize(280.4664567 + t *
    (360007.6982779 + t * (0.03032028 + t * (1 / 49931 - t * (1 / 15299 + t / 1988000)))));
  const rawAngle = meanLongitude - 0.0057183 - alpha + deltaPsi * Math.cos(epsilon);
  // Unlike the legacy return value, normalize the difference across 0°/360°.
  return (normalize(rawAngle + 180) - 180) * 240;
}
