# YiJing Widget · Zeitkorrektur

[**Rechner öffnen**](https://akaw0nder.github.io/yijing-widget/) · [YiJing Astro im App Store](https://apps.apple.com/us/app/yijing-astro/id6792803742)

Eigenständiger deutscher und englischer Rechner für mittlere und wahre Ortszeit.
Geburtsdatum, lokale Uhrzeit und Geburtsort eingeben; das Widget zeigt Längengrad,
UTC-Abstand einschließlich saisonaler Anpassung, mittlere Ortszeit (MOZ/LMST),
Zeitgleichung und wahre Ortszeit (WOZ). Der vollständige Rechenweg ist einsehbar.

## Auf GitHub Pages testen

Dieses Repository enthält die fertigen HTML-, CSS-, JavaScript- und JSON-Dateien
im Hauptverzeichnis. Es benötigt weder einen Build-Schritt noch zusätzliche
Pakete oder einen Berechnungsserver.

Unter **Settings → Pages** ist als Veröffentlichungsquelle **Deploy from a branch**,
Branch **main**, Ordner **/(root)** vorgesehen. Die Datei `.nojekyll` sorgt für die
unveränderte Auslieferung der statischen Dateien. Nach Änderungen kann die
Veröffentlichung einige Minuten dauern.

- Deutsch: https://akaw0nder.github.io/yijing-widget/?lang=de
- Englisch: https://akaw0nder.github.io/yijing-widget/?lang=en

## Lokal ausprobieren

Mit Node.js (für Tests) und Python 3 (für die Vorschau):

```sh
npm test
npm run preview
```

Anschließend http://127.0.0.1:4173/ im Browser öffnen. Die Vorschau mit Strg+C
beenden. Ein Doppelklick auf `index.html` über `file://` funktioniert wegen der
JavaScript-Module und Datenabrufe nicht zuverlässig; HTTP(S) verwenden.

## In eine Website einbauen

Alle Dateien im Hauptverzeichnis sowie `core/` und `data/` unter einem eigenen
Ordner auf demselben HTTPS-Webserver ablegen, z. B. `/zeitkorrektur-widget/`.
`tests/`, `scripts/` und `upstream/` werden für den Betrieb nicht benötigt.

```html
<iframe
  data-yijing-widget
  src="/zeitkorrektur-widget/index.html?lang=de"
  title="Zeitkorrektur – mittlere und wahre Ortszeit"
  style="display:block;width:100%;height:1500px;border:0"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>
<script type="module" src="/zeitkorrektur-widget/embed.js"></script>
```

`embed.js` passt die Höhe automatisch an, sofern Widget und umgebende Seite dieselbe
Herkunft haben (Protokoll, Domain und Port). `embed-example.html` zeigt einen
vollständigen Einbau. Bei einem von GitHub Pages auf eine andere Domain eingebetteten
Rechner bleibt die feste Rahmenhöhe erhalten; die automatische Höhenanpassung
benötigt eine ausdrücklich angepasste Herkunftsfreigabe. Die Berechnung funktioniert
auch ohne automatische Höhenanpassung. Alte feste Mindestbreiten und die um den
früheren Rechner angeordneten Beschriftungen auf der Hostseite entfernen.

## Funktionsumfang

- Jahre 1900–2100, optionale Sekunden und vollständige Datumswechsel.
- 44.291 Orte in 244 Ländern/Gebieten; zusätzliche AT/DE/CH-Orte.
- 554 benannte Zeitzonen mit mitgelieferten IANA-2026e-Regeln einschließlich
  zusätzlicher historischer Daten (`backzone` / `zone.tab`).
- Manuelle Koordinaten, Zeitzonen oder dokumentierte historische UTC-Abstände.
- Auswahl bei doppelt vorkommenden Uhrzeiten; Ablehnung übersprungener Uhrzeiten.
- Deutsche und englische Oberfläche; responsive Darstellung ab 320 px.
- Banner zur vollständigen YiJing-Astro-App und dezenter Hinweis frühestens nach
  drei unterschiedlichen erfolgreichen Berechnungen und 90 Sekunden Nutzung,
  mit 2,5 Sekunden Abstand zur Berechnung, höchstens einmal pro Seitenaufruf.

## Datenschutz und Genauigkeit

Ortssuche und Berechnung laufen lokal im Browser mit den mitgelieferten Daten.
Keine Cookies, Analysewerkzeuge, externe Schriftarten oder dauerhafte Speicherung
von Geburtsangaben. Auch die Häufigkeitsbegrenzung des App-Hinweises arbeitet nur
im Arbeitsspeicher. An die umgebende Seite werden ausschließlich Maße übertragen.
Beim Anklicken des App-Store-Links wird Apple aufgerufen. Der Hostinganbieter kann
übliche Zugriffsprotokolle führen; GitHub Pages protokolliert IP-Adressen gemäß
seiner [Dokumentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

Die Berechnung übernimmt das astronomische VSOP87D-/Meeus-Modell der YiJing-App,
mit korrigierter Winkel-Normalisierung der Zeitgleichung. Sekunden sind gerundete
Rechenwerte; absolute Genauigkeit auf die Sekunde wird nicht zugesichert. Vor 1970
können historische Zeitzonendaten unvollständig sein. Künftige Regeln müssen bei
gesetzlichen Änderungen aktualisiert werden.

## Quellcode und Prüfungen

- `core/`: wiederverwendbare astronomische und zeitbezogene Berechnung.
- `app.js`, `index.html`, `style.css`: Oberfläche und lokale Ortssuche.
- `promotion.js`: Regeln für den gelegentlichen App-Hinweis.
- `data/manifest.json`: Datenstand, Herkunft und Prüfsummen.
- `tests/`: 24 Tests einschließlich 36 Swift-Vergleichsfällen, Zeitzonenübergängen,
  Datenintegrität, Jahreswechseln und Popup-Begrenzung.
- `upstream/`: ursprüngliche astronomische Swift-Quelldateien zur Nachvollziehbarkeit
  und Erzeugung der Referenzfälle, mit erhaltenen Urheberhinweisen.
- `scripts/`: Erzeugung der Daten und Swift-Referenzfälle. Die Ortsdaten müssen
  separat von GeoNames heruntergeladen werden; der Zeitzonenexport benötigt
  Python 3.13 und die passende IANA-2026e-TZif-Datenbank. Für Referenzfälle ist Swift
  erforderlich. Der normale Betrieb benötigt diese Werkzeuge nicht.

## Quellen und Rechte

[GeoNames](https://www.geonames.org/), CC BY 4.0; IANA Time Zone Database 2026e.
Alle Quellen-, Anpassungs- und Urheberhinweise stehen in [NOTICE.txt](NOTICE.txt).
Die öffentliche Sichtbarkeit dieses Repositorys vergibt keine zusätzliche
Open-Source-Lizenz für bestehenden oder abgeleiteten Code, Tabellen oder Artwork.
