"""Generate self-hosted assets. Python 3.13, system IANA tzdata 2026e.

Usage: python3 scripts/generate-data.py --cities /path/cities1000.zip
       --regions /path/admin1CodesASCII.txt --countries /path/countryInfo.txt
       --date YYYY-MM-DD
Downloads are explicit inputs; this script makes no network requests.
"""
import argparse
import ast
import hashlib
import json
import re
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo, available_timezones, reset_tzpath
from zoneinfo._common import load_data

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data'
UTC = timezone.utc
ZONE_ROOT = Path('/usr/share/zoneinfo')


def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n')


def coefficients():
    source = (ROOT / 'upstream/VSOP87D.swift').read_text()
    arrays = {}
    for match in re.finditer(r'let (VSOP87D_[LBR]\d_EARTH|terms)\s*=\s*(\[)', source):
        start = match.end() - 1
        depth = 0
        for end in range(start, len(source)):
            depth += (source[end] == '[') - (source[end] == ']')
            if depth == 0:
                arrays[match[1]] = ast.literal_eval(source[start:end + 1])
                break
    assert len(arrays) == 18 and len(arrays['terms']) == 63
    output = '// Generated from YiJing_Astro/VSOP87D.swift; preserve upstream rights.\n'
    output += 'export const coefficients = ' + json.dumps(arrays, separators=(',', ':')) + ';\n'
    (ROOT / 'core/coefficients.js').write_text(output)
    return hashlib.sha256(source.encode()).hexdigest()


def zone_rows(name, start, end):
    zone = ZoneInfo(name)

    def state(second):
        local = datetime.fromtimestamp(second, UTC).astimezone(zone)
        return [int(local.utcoffset().total_seconds()),
                int(local.dst().total_seconds()), local.tzname()]

    first, last = int(start.timestamp()), int(end.timestamp())
    rows = [[first, *state(first)]]
    # All explicit historical transitions are retained, including very short regimes.
    with open(ZONE_ROOT / name, 'rb') as file:
        _, transitions, *_ = load_data(file)
    for at in transitions:
        if first < at < last:
            value = state(at)
            if value != rows[-1][1:]:
                rows.append([at, *value])
    # The TZif POSIX footer extends rules after the final explicit transition.
    # Daily sampling is only used for that recurring-rule tail.
    cursor = max(first, transitions[-1] if transitions else first)
    previous = state(cursor)
    while cursor < last:
        following = min(cursor + 86400, last)
        value = state(following)
        if value != previous:
            low, high = cursor, following
            while high - low > 1:
                middle = (low + high) // 2
                if state(middle) == previous:
                    low = middle
                else:
                    high = middle
            if high < last:
                rows.append([high, *state(high)])
        cursor, previous = following, value
    return rows


def main():
    global ZONE_ROOT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cities', required=True, type=Path)
    parser.add_argument('--regions', required=True, type=Path)
    parser.add_argument('--countries', required=True, type=Path)
    parser.add_argument('--date', required=True)
    parser.add_argument('--zoneinfo', type=Path, default=ZONE_ROOT)
    parser.add_argument('--tz-profile', choices=['system', 'backzone-zone.tab'], default='system')
    args = parser.parse_args()
    ZONE_ROOT = args.zoneinfo.resolve()
    reset_tzpath([str(ZONE_ROOT)])
    ZoneInfo.clear_cache()
    version = (ZONE_ROOT / '+VERSION').read_text().strip()
    if version != '2026e':
        raise SystemExit('Expected IANA 2026e; review and update the generator/version together.')
    regions = dict(line.split('\t')[:2] for line in args.regions.read_text().splitlines())
    countries = {}
    for line in args.countries.read_text().splitlines():
        if line and not line.startswith('#'):
            fields = line.split('\t')
            countries[fields[0]] = fields[4]
    by_country = {}
    with zipfile.ZipFile(args.cities) as archive:
        for line in archive.read('cities1000.txt').decode().splitlines():
            f = line.split('\t')
            if int(f[14] or 0) < 15000 and f[8] not in ('AT', 'DE', 'CH') and f[7] != 'PPLC':
                continue
            # Keep native/ascii/alternate spellings for private, local search.
            city = {'id': f[0], 'name': f[1], 'country': f[8],
                    'region': regions.get(f[8] + '.' + f[10], ''),
                    'latitude': float(f[4]), 'longitude': float(f[5]),
                    'zone': f[17], 'aliases': f[2] + ',' + f[3], 'population': int(f[14] or 0)}
            if not city['zone']:
                continue
            by_country.setdefault(f[8], []).append(city)
    index = []
    for code, cities in sorted(by_country.items()):
        cities.sort(key=lambda city: (-city['population'], city['name']))
        index.append({'code': code, 'name': countries.get(code, code), 'count': len(cities)})
        write(OUT / 'cities' / (code + '.json'), cities)
    write(OUT / 'countries.json', index)
    # Include all supported named zones for manual input, not just city-linked zones.
    names = sorted(name for name in available_timezones()
                   if '/' in name and not name.startswith(('posix/', 'right/'))
                   and (ZONE_ROOT / name).is_file())
    names.append('UTC')
    start = datetime(1899, 12, 29, tzinfo=UTC)
    end = datetime(2101, 1, 3, tzinfo=UTC)
    zones = {name: zone_rows(name, start, end) for name in names}
    missing = {c['zone'] for group in by_country.values() for c in group} - zones.keys()
    assert not missing, missing
    write(OUT / 'timezones.json', {'version': version, 'profile': args.tz_profile, 'start': int(start.timestamp()),
                                 'end': int(end.timestamp()), 'zones': zones})
    digest = coefficients()
    write(OUT / 'manifest.json', {'generated': args.date, 'tzdata': version, 'tzProfile': args.tz_profile,
          'cityCount': sum(len(c) for c in by_country.values()), 'countries': len(index),
          'coverage': 'Global cities >=15000 inhabitants and capitals; AT/DE/CH cities1000 entries.',
          'geonamesSource': 'https://download.geonames.org/export/dump/cities1000.zip',
          'geonamesSHA256': hashlib.sha256(args.cities.read_bytes()).hexdigest(),
          'coefficientsSHA256': digest})
    print(f'Generated {sum(len(c) for c in by_country.values())} cities, {len(zones)} zones, IANA {version}.')


if __name__ == '__main__':
    main()
