import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolveCivil, parseCivil } from '../core/time.js';

test('all country shards, zones and generated coefficient provenance are consistent', async () => {
  const data = new URL('../data/', import.meta.url);
  const manifest = JSON.parse(await readFile(new URL('manifest.json', data)));
  const countries = JSON.parse(await readFile(new URL('countries.json', data)));
  const zones = JSON.parse(await readFile(new URL('timezones.json', data)));
  assert.equal(zones.version, manifest.tzdata);
  assert.equal(zones.profile, 'backzone-zone.tab');
  assert.equal(countries.length, manifest.countries);
  let count = 0;
  const ids = new Set();
  for (const country of countries) {
    const cities = JSON.parse(await readFile(new URL(`cities/${country.code}.json`, data)));
    assert.equal(cities.length, country.count);
    for (const city of cities) {
      assert.equal(city.country, country.code);
      assert.ok(city.name && !ids.has(city.id), city.id);
      ids.add(city.id);
      assert.ok(Number.isFinite(city.longitude) && Math.abs(city.longitude) <= 180);
      assert.ok(Number.isFinite(city.latitude) && Math.abs(city.latitude) <= 90);
      assert.ok(Object.hasOwn(zones.zones, city.zone), city.zone);
    }
    count += cities.length;
  }
  assert.equal(count, manifest.cityCount);
  const source = await readFile(new URL('../upstream/VSOP87D.swift', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'), manifest.coefficientsSHA256);
});

test('runtime scripts and styles are self-hosted and contain no persistence/tracking APIs', async () => {
  const root = new URL('../', import.meta.url);
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.ok(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i.test(html));
  for (const name of ['app.js', 'embed.js', 'promotion.js', 'style.css']) {
    const source = await readFile(new URL(name, root), 'utf8');
    assert.ok(!/localStorage|sessionStorage|document\.cookie|sendBeacon|https?:\/\//.test(source), name);
  }
});

test('bundled transition states retain full pre-1970 locality history for Amsterdam', async () => {
  const database = JSON.parse(await readFile(new URL('../data/timezones.json', import.meta.url)));
  const result = resolveCivil(database, 'Europe/Amsterdam', parseCivil('1900-06-15', '12:00:00'));
  assert.equal(result.length, 1);
  assert.equal(result[0].offsetSeconds, 1172);
});
