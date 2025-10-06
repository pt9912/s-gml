# @npm9912/s-gml

[![npm version](https://badge.fury.io/js/%40npm9912%2Fs-gml.svg)](https://www.npmjs.com/package/@npm9912/s-gml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%23007ACC.svg)](https://www.typescriptlang.org/)

**TypeScript-Bibliothek zum Parsen, Konvertieren und Validieren von GML 2.1.2/3.0/3.2** –
inkl. **Envelope, Box, Curve, Surface, LinearRing**, WFS-Unterstützung und Docker-CLI.

---
## ✨ Features

| Feature                    | Beschreibung                                          |
| -------------------------- | ----------------------------------------------------- |
| **GML → GeoJSON**          | Parsen aller GML-Elemente nach GeoJSON                |
| **Versionen konvertieren** | GML 2.1.2 ↔ 3.2 (inkl. FeatureCollections)            |
| **WFS-Unterstützung**      | Parsen von WFS-FeatureCollections                     |
| **URL-Unterstützung**      | Direktes Laden von GML-Daten aus URLs                 |
| **OWS Exception Handling** | Automatische Erkennung und Behandlung von WFS-Fehlern |
| **XSD-Validierung**        | Prüfung gegen offizielle GML-Schemata                 |
| **Neue GML-Elemente**      | `Envelope`, `Box`, `Curve`, `Surface`, `LinearRing`   |
| **Docker-CLI**             | Bereit als Container-Image für Batch-Verarbeitung     |

---
## 📦 Installation

```bash
pnpm install @npm9912/s-gml
```

---
## 🚀 Usage

### GML → GeoJSON parsen
```typescript
import { GmlParser } from '@npm9912/s-gml';

const parser = new GmlParser();
const geojson = await parser.parse(`
  <gml\:Point xmlns\:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
    <gml\:pos>10.0 20.0</gml\:pos>
  </gml\:Point>
`);
console.log(geojson);
// { type: 'Point', coordinates: [10, 20] }
```

### GML Envelope parsen
```typescript
const envelope = await parser.parse(`
  <gml\:Envelope xmlns\:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
    <gml\:lowerCorner>10.0 20.0</gml\:lowerCorner>
    <gml\:upperCorner>30.0 40.0</gml\:upperCorner>
  </gml\:Envelope>
`);
console.log(envelope.bbox);
// [10, 20, 30, 40]
```

### GML Curve parsen
```typescript
const curve = await parser.parse(`
  <gml\:Curve xmlns\:gml="http://www.opengis.net/gml/3.2">
    <gml\:segments>
      <gml\:LineStringSegment>
        <gml\:posList>10.0 20.0 15.0 25.0 20.0 30.0</gml\:posList>
      </gml\:LineStringSegment>
    </gml\:segments>
  </gml\:Curve>
`);
console.log(curve);
// { type: 'LineString', coordinates: [[10, 20], [15, 25], [20, 30]] }
```

### GML Surface parsen
```typescript
const surface = await parser.parse(`
  <gml\:Surface xmlns\:gml="http://www.opengis.net/gml/3.2">
    <gml\:patches>
      <gml\:PolygonPatch>
        <gml\:exterior>
          <gml\:LinearRing>
            <gml\:posList>0 0 10 0 10 10 0 10 0 0</gml\:posList>
          </gml\:LinearRing>
        </gml\:exterior>
      </gml\:PolygonPatch>
    </gml\:patches>
  </gml\:Surface>
`);
console.log(surface.type);
// "MultiPolygon"
```

### OWS Exception Reports behandeln
```typescript
import { GmlParser, OwsExceptionError } from '@npm9912/s-gml';

const parser = new GmlParser();

try {
  const geojson = await parser.parse(wfsResponse);
  console.log(geojson);
} catch (error) {
  if (error instanceof OwsExceptionError) {
    console.error('WFS Error:', error.message);
    // OWS Exception [InvalidParameterValue]: Failed to find response for output format GML23

    console.error('All errors:', error.getAllMessages());
    // Zeigt alle Exceptions mit Details an

    console.log('Exception Report:', error.report);
    // Zugriff auf das vollständige Report-Objekt
  }
}
```

---
## 📖 Unterstützte GML-Elemente

| Element             | GML 2.1.2 | GML 3.0/3.2 | GeoJSON-Ausgabe     | Beschreibung           |
| ------------------- | --------- | ----------- | ------------------- | ---------------------- |
| `Point`             | ✅         | ✅           | `Point`             | Einzelner Punkt        |
| `LineString`        | ✅         | ✅           | `LineString`        | Linie mit Punkten      |
| `Polygon`           | ✅         | ✅           | `Polygon`           | Geschlossene Fläche    |
| `LinearRing`        | ✅         | ✅           | `LineString`        | Geschlossener Ring     |
| `Envelope`          | ✅         | ✅           | `Feature` + `bbox`  | Begrenzungsbox         |
| `Box`               | ✅         | ✅           | `Feature` + `bbox`  | 2D/3D-Box              |
| `Curve`             | ❌         | ✅           | `LineString`        | Kurve mit Segmenten    |
| `Surface`           | ❌         | ✅           | `MultiPolygon`      | 3D-Oberfläche          |
| `MultiSurface`      | ❌         | ✅           | `MultiPolygon`      | Sammlung von Flächen   |
| `MultiPoint`        | ✅         | ✅           | `MultiPoint`        | Sammlung von Punkten   |
| `MultiLineString`   | ✅         | ✅           | `MultiLineString`   | Sammlung von Linien    |
| `MultiPolygon`      | ✅         | ✅           | `MultiPolygon`      | Sammlung von Polygonen |
| `FeatureCollection` | ✅         | ✅           | `FeatureCollection` | Sammlung von Features  |

---
## 🛠 CLI-Tool (Docker)

### Docker-Image bauen
```bash
docker build -t s-gml-cli .
```

### GML → GeoJSON konvertieren

**Lokale Datei:**
```bash
docker run --rm -v $(pwd)/test/gml:/data s-gml-cli parse /data/wfs-gml3-1-f.xml --verbose --output /data/output.geojson
```

**Von URL:**
```bash
docker run --rm s-gml-cli parse https://example.com/data.gml --output /data/output.geojson
```

### GML-Versionen konvertieren (3.2 → 2.1.2)

**Lokale Datei:**
```bash
docker run --rm -v $(pwd):/data s-gml-cli convert /data/input.gml \
  --version 2.1.2 --pretty > output.gml
```

**Von URL:**
```bash
docker run --rm s-gml-cli convert https://example.com/data.gml \
  --version 2.1.2 --pretty > output.gml
```

### GML validieren

**Lokale Datei:**
```bash
docker run --rm -v $(pwd):/data s-gml-cli validate /data/input.gml --gml-version 3.2
```

**Von URL:**
```bash
docker run --rm s-gml-cli validate https://example.com/data.gml --gml-version 3.2
```

---
## 📖 API

### `GmlParser`
| Methode                               | Beschreibung                            | Rückgabe                |
| ------------------------------------- | --------------------------------------- | ----------------------- |
| `parse(gml: string)`                  | Parsed GML zu GeoJSON/FeatureCollection | `Promise<GeoJSON>`      |
| `convert(gml: string, options)`       | Konvertiert GML zwischen Versionen      | `Promise<string>` (XML) |
| `convertGeometry(gmlObject, options)` | Konvertiert GML-Objekte zu XML          | `Promise<string>`       |

**`GmlConvertOptions`**:
```typescript
{
  outputVersion: '2.1.2' | '3.2', // Zielversion
  prettyPrint?: boolean,         // Formatiertes XML
  inputVersion?: '2.1.2' | '3.0' | '3.2' // Manuelle Versionsangabe
}
```

### `validateGml(gml: string, version: string)`
→ `Promise<boolean>`

### OWS Exception Handling

**`OwsExceptionError`** - Wird geworfen, wenn ein WFS-Server einen Exception Report zurückgibt:

```typescript
class OwsExceptionError extends Error {
  report: OwsExceptionReport;  // Vollständiger Report
  getAllMessages(): string;     // Alle Fehlermeldungen formatiert
}
```

**Hilfsfunktionen**:
- `isOwsExceptionReport(xml: string): boolean` - Prüft, ob XML ein Exception Report ist
- `parseOwsExceptionReport(xml: string): OwsExceptionReport` - Parst Exception Report manuell

---
## 🛠 Entwicklung

### Vorraussetzungen
- Node.js ≥ 16
- TypeScript ≥ 5.0
- Docker (für CLI-Tool)

### Build & Test
```bash
git clone https://github.com/pt9912/s-gml
cd s-gml
pnpm install
pnpm run build
pnpm test
# optional: Coverage-Report
pnpm run test:coverage
```

### Docker-CLI lokal testen
```bash
# Image bauen
docker build -t s-gml-cli .

# Testen mit Beispieldatei
echo '<gml\:Point xmlns\:gml="http://www.opengis.net/gml/3.2"><gml\:pos>10 20</gml\:pos></gml\:Point>' > test.gml
docker run --rm -v \$(pwd):/data s-gml-cli parse /data/test.gml
```

---
## 📂 Beispiel-GML-Dateien

### `envelope.gml`
```xml
<gml\:Envelope xmlns\:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
  <gml\:lowerCorner>10.0 20.0</gml\:lowerCorner>
  <gml\:upperCorner>30.0 40.0</gml\:upperCorner>
</gml\:Envelope>
```

### `curve.gml`
```xml
<gml\:Curve xmlns\:gml="http://www.opengis.net/gml/3.2">
  <gml\:segments>
    <gml\:LineStringSegment>
      <gml\:posList>10.0 20.0 15.0 25.0 20.0 30.0</gml\:posList>
    </gml\:LineStringSegment>
  </gml\:segments>
</gml\:Curve>
```

---
## 📄 Lizenz
[MIT](LICENSE) © Dietmar Burkard
