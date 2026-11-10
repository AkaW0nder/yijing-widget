import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { parseDateInput, displayDate, normalizeClockInput, monthNames, weekdayNames, calendarDays } from '../date-picker.js';

test('day-first input is unambiguous and retains ISO for the calculation engine', () => {
  assert.equal(parseDateInput('01-02-2020'), '2020-02-01');
  assert.equal(parseDateInput('31.01.2020'), '2020-01-31');
  assert.equal(parseDateInput('31/01/2020'), '2020-01-31');
  assert.equal(parseDateInput('2020-01-31'), '2020-01-31');
  assert.equal(displayDate('1961-02-04'), '04-02-1961');
  assert.equal(displayDate('1900-01-01'), '01-01-1900');
  assert.equal(displayDate('2100-12-31'), '31-12-2100');
});

test('invalid dates are rejected instead of overflowing into a different month', () => {
  assert.equal(parseDateInput('29-02-2000'), '2000-02-29');
  for (const value of ['29-02-1900', '29-02-2100', '31-04-2020', '00-01-2020',
    '01-13-2020', '01-01-1899', '01-01-2101', '01.02-2020', '01/31/2020', '']) {
    assert.throws(() => parseDateInput(value), /invalidDate/);
  }
});

test('24-hour time permits optional seconds and normalizes a single hour digit', () => {
  assert.equal(normalizeClockInput('7:05'), '07:05');
  assert.equal(normalizeClockInput('00:00'), '00:00');
  assert.equal(normalizeClockInput('23:59:59'), '23:59:59');
  for (const value of ['24:00', '12:60', '12:01:60', '3:30 PM', '15.30', '12:5', '']) {
    assert.throws(() => normalizeClockInput(value), /invalidDate/);
  }
});

test('calendar starts on Monday and includes leap days and supported boundary years', () => {
  assert.equal(calendarDays(2024, 1)[0], 1);
  assert.equal(calendarDays(2020, 1)[2], 1);
  assert.equal(calendarDays(2020, 2).filter(Boolean).length, 29);
  assert.equal(calendarDays(1900, 2).filter(Boolean).length, 28);
  assert.equal(calendarDays(2100, 2).filter(Boolean).length, 28);
  assert.equal(calendarDays(2100, 12).at(-1), null);
  for (const year of [1900, 2000, 2026, 2100]) for (let month = 1; month <= 12; month++) {
    const cells = calendarDays(year, month);
    assert.equal(cells.length, 42);
    assert.equal(cells.filter(Boolean).at(-1), new Date(Date.UTC(year, month, 0)).getUTCDate());
  }
});

test('calendar month and weekday names follow widget language, even on a German system', () => {
  assert.equal(monthNames('en')[0], 'January');
  assert.equal(monthNames('en')[2], 'March');
  assert.equal(monthNames('de')[2], 'März');
  assert.equal(weekdayNames('en')[0], 'Mon');
  assert.match(weekdayNames('de')[0], /^Mo\.?$/);
  const url = new URL('../date-picker.js', import.meta.url).href;
  const script = `import {monthNames,weekdayNames} from ${JSON.stringify(url)};
    console.log(JSON.stringify([monthNames('en'),weekdayNames('en')]));`;
  const values = ['de_AT.UTF-8', 'en_US.UTF-8'].map((LANG) => execFileSync(process.execPath,
    ['--input-type=module', '-e', script], { encoding: 'utf8', env: { ...process.env, LANG, TZ: 'Europe/Vienna' } }));
  assert.equal(values[0], values[1]);
  assert.match(values[0], /January/);
  assert.ok(!values[0].includes('Jänner'));
});
