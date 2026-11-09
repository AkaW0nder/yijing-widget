"""Reference fixtures from unmodified app astronomy; normalize only EoT's angle."""
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
samples = [[1900, 1, 1, 0, 0], [1976, 12, 11, 15, 5], [2020, 1, 31, 14, 0],
           [2100, 12, 31, 23, 59]]
samples += [[2026, m, 15, 12, 0] for m in range(1, 13)]
samples += [[2026, 3, d, h, 0] for d in range(19, 24) for h in [0, 6, 12, 18]]
source = 'import Foundation\nlet calendar = NSCalendar(calendarIdentifier: .gregorian)\n'
source += (ROOT / 'upstream/VSOP87D.swift').read_text() + '\n'
source += (ROOT / 'upstream/Astronomy.swift').read_text() + '\n'
source += 'let samples: [[Int]] = ' + json.dumps(samples) + '\n'
source += '''
let astro = Astronomy()
var results = [[String: Any]]()
for sample in samples {
 let jd = astro.UTC_to_julianDate(sample[3], UTC_minute: Double(sample[4]),
  UTC_day: sample[2], UTC_month: sample[1], UTC_year: sample[0])
 let raw = astro.EoT(jd)
 let normalized = ((raw + 180).truncatingRemainder(dividingBy: 360) + 360)
  .truncatingRemainder(dividingBy: 360) - 180
 results.append(["civilUTC": sample, "julianDate": jd, "rawDegrees": raw,
  "equationSeconds": normalized * 240])
}
let json = try JSONSerialization.data(withJSONObject: results, options: [.sortedKeys])
print(String(data: json, encoding: .utf8)!)
'''
with tempfile.TemporaryDirectory(prefix='yijing-swift-') as directory:
    path = Path(directory) / 'reference.swift'
    path.write_text(source)
    output = subprocess.check_output(['swift', '-module-cache-path', '/tmp/yijing-swift-cache', str(path)])
values = json.loads(output)
destination = ROOT / 'tests/fixtures/swift-astronomy.json'
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps(values, indent=2) + '\n')
print(f'Generated {len(values)} reference fixtures from the app.')
