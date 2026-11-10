import { parseCivil } from './core/time.js';

const pad = (n) => String(n).padStart(2, '0');
const locale = (language) => language === 'en' ? 'en-GB' : 'de-AT';

export function parseDateInput(value) {
  const text = String(value).trim();
  const match = /^(\d{2})([-./])(\d{2})\2(\d{4})$/.exec(text);
  // ISO paste is accepted, but the displayed format remains day-month-year.
  const iso = match ? `${match[4]}-${match[3]}-${match[1]}` : text;
  parseCivil(iso, '00:00');
  return iso;
}

export function displayDate(iso) {
  const value = parseCivil(iso, '00:00');
  return `${pad(value.day)}-${pad(value.month)}-${value.year}`;
}

export function normalizeClockInput(value) {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(value).trim());
  if (!match) throw new RangeError('invalidDate');
  const time = `${pad(match[1])}:${match[2]}${match[3] === undefined ? '' : `:${match[3]}`}`;
  parseCivil('2000-01-01', time);
  return time;
}

export function monthNames(language) {
  const formatter = new Intl.DateTimeFormat(locale(language), { month: 'long', timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(Date.UTC(2020, i, 1))));
}

export function weekdayNames(language) {
  const formatter = new Intl.DateTimeFormat(locale(language), { weekday: 'short', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, i) => formatter.format(new Date(Date.UTC(2024, 0, 1 + i))));
}

export function calendarDays(year, month) {
  parseCivil(`${year}-${pad(month)}-01`, '00:00');
  const leading = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: 42 }, (_, i) => i >= leading && i < leading + count ? i - leading + 1 : null);
}

export function installDatePicker({ input, trigger, dialog, getLanguage }) {
  const query = (selector) => dialog.querySelector(selector);
  const monthSelect = query('#calendar-month');
  const yearSelect = query('#calendar-year');
  const grid = query('#calendar-days');
  let year = 2020;
  let month = 1;
  let focusDay = 1;

  for (let value = 1900; value <= 2100; value++) yearSelect.add(new Option(String(value), String(value)));
  const isoFor = (day) => `${year}-${pad(month)}-${pad(day)}`;
  const lastDay = () => new Date(Date.UTC(year, month, 0)).getUTCDate();
  function selectedISO() { try { return parseDateInput(input.value); } catch { return ''; } }

  function render(focus = false) {
    const language = getLanguage();
    const selected = selectedISO();
    const today = new Date().toISOString().slice(0, 10);
    focusDay = Math.min(focusDay, lastDay());
    const names = monthNames(language);
    monthSelect.replaceChildren(...names.map((name, i) => new Option(name, String(i + 1))));
    monthSelect.value = String(month);
    yearSelect.value = String(year);
    query('#calendar-caption').textContent = `${names[month - 1]} ${year}`;
    query('#calendar-weekdays').replaceChildren(...weekdayNames(language).map((name) => {
      const label = document.createElement('span'); label.textContent = name; return label;
    }));
    query('#calendar-previous').disabled = year === 1900 && month === 1;
    query('#calendar-next').disabled = year === 2100 && month === 12;
    const formatter = new Intl.DateTimeFormat(locale(language), {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    });
    grid.replaceChildren(...calendarDays(year, month).map((day) => {
      if (!day) { const blank = document.createElement('span'); blank.setAttribute('aria-hidden', 'true'); return blank; }
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = day; button.dataset.day = day;
      button.tabIndex = day === focusDay ? 0 : -1;
      button.setAttribute('aria-label', formatter.format(new Date(`${isoFor(day)}T00:00:00Z`)));
      button.setAttribute('aria-pressed', String(isoFor(day) === selected));
      if (isoFor(day) === today) button.setAttribute('aria-current', 'date');
      button.addEventListener('click', () => {
        input.value = displayDate(isoFor(day));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        dialog.close();
      });
      button.addEventListener('focus', () => { focusDay = day; });
      return button;
    }));
    if (focus) query(`[data-day="${focusDay}"]`)?.focus({ preventScroll: true });
  }

  function moveMonth(delta, focus = false) {
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    if (date.getUTCFullYear() < 1900 || date.getUTCFullYear() > 2100) return;
    year = date.getUTCFullYear(); month = date.getUTCMonth() + 1; render(focus);
  }

  function positionEmbedded() {
    if (window.parent === window || !dialog.open) return;
    dialog.dataset.embedded = 'true';
    dialog.style.top = `${Math.max(12, trigger.getBoundingClientRect().top + window.scrollY)}px`;
    dialog.style.left = `${Math.max(12, (document.documentElement.clientWidth - dialog.getBoundingClientRect().width) / 2)}px`;
  }

  function open() {
    if (dialog.open) return;
    const value = selectedISO() || new Date().toISOString().slice(0, 10);
    const parsed = parseCivil(value, '00:00');
    year = parsed.year; month = parsed.month; focusDay = parsed.day;
    render(); dialog.showModal(); trigger.setAttribute('aria-expanded', 'true');
    positionEmbedded();
    query(`[data-day="${focusDay}"]`)?.focus({ preventScroll: true });
    // Bring the full dialog into view when a tall iframe sits inside a page.
    dialog.scrollIntoView({ block: 'center', inline: 'nearest' });
  }
  trigger.addEventListener('click', open);
  window.addEventListener('resize', positionEmbedded);
  input.addEventListener('keydown', (event) => {
    if (event.altKey && event.key === 'ArrowDown') { event.preventDefault(); open(); }
  });
  input.addEventListener('blur', () => { try { input.value = displayDate(parseDateInput(input.value)); } catch { /* Keep invalid input for the form's error message. */ } });
  query('#calendar-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { trigger.setAttribute('aria-expanded', 'false'); trigger.focus({ preventScroll: true }); });
  query('#calendar-previous').addEventListener('click', () => moveMonth(-1));
  query('#calendar-next').addEventListener('click', () => moveMonth(1));
  monthSelect.addEventListener('change', () => { month = Number(monthSelect.value); render(); });
  yearSelect.addEventListener('change', () => { year = Number(yearSelect.value); render(); });
  grid.addEventListener('keydown', (event) => {
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault(); moveMonth((event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1), true); return;
    }
    const deltas = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let delta = deltas[event.key];
    if (event.key === 'Home') delta = -((new Date(Date.UTC(year, month - 1, focusDay)).getUTCDay() + 6) % 7);
    if (event.key === 'End') delta = 6 - ((new Date(Date.UTC(year, month - 1, focusDay)).getUTCDay() + 6) % 7);
    if (delta === undefined) return;
    event.preventDefault();
    const target = new Date(Date.UTC(year, month - 1, focusDay + delta));
    if (target.getUTCFullYear() < 1900 || target.getUTCFullYear() > 2100) return;
    year = target.getUTCFullYear(); month = target.getUTCMonth() + 1; focusDay = target.getUTCDate(); render(true);
  });
  return {
    isoValue: () => parseDateInput(input.value),
    setISO: (iso) => { input.value = displayDate(iso); },
    refreshLanguage: () => { if (dialog.open) render(); },
  };
}
