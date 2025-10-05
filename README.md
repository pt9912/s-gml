# s-gml

[![npm version](https://badge.fury.io/js/s-gml.svg)](https://www.npmjs.com/package/s-gml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**TypeScript-Bibliothek zum Parsen, Konvertieren und Validieren von GML 2.1.2/3.0/3.2** –
optimiert für WFS und GeoJSON mit vollständiger Typunterstützung.

---
## ✨ Features

| Feature                    | Beschreibung                               |
| -------------------------- | ------------------------------------------ |
| **GML → GeoJSON**          | Parsen aller GML-Elemente nach GeoJSON     |
| **Versionen konvertieren** | GML 2.1.2 ↔ 3.2 (inkl. FeatureCollections) |
| **WFS-Unterstützung**      | Parsen von WFS-FeatureCollections          |
| **XSD-Validierung**        | Prüfung gegen offizielle GML-Schemata      |
| **TypeScript-Typen**       | Vollständige Typen für alle GML-Elemente   |

---
## 📦 Installation

```bash
npm install s-gml
```

---
## 🚀 Usage

### GML → GeoJSON parsen

```typescript
import { GmlParser } from 's-gml';

const parser = new GmlParser();
const geojson = await parser.parse(`
  <gml\:Point xmlns\:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
    <gml\:pos>10.0 20.0</gml\:pos>
  </gml\:Point>
`);
console.log(geojson);
// { type: 'Point', coordinates: [10, 20] }
```

### GML-Versionen konvertieren

```typescript
const gml2 = `
<gml\:Point xmlns\:gml="http://www.opengis.net/gml" srsName="EPSG:4326">
  <gml\:coordinates>10.0,20.0</gml\:coordinates>
</gml\:Point>
`;

const gml3 = await parser.convert(gml2, {
  outputVersion: '3.2',
  prettyPrint: true
});
console.log(gml3);
// <gml\:Point srsName="EPSG:4326" xmlns\:gml="http://www.opengis.net/gml/3.2">
//   <gml\:pos>10.0 20.0</gml\:pos>
// </gml\:Point>
```

### WFS-FeatureCollection parsen

```typescript
const wfsResponse = `
<wfs\:FeatureCollection xmlns\:wfs="http://www.opengis.net/wfs" xmlns\:gml="http://www.opengis.net/gml/3.2">
  <gml\:featureMember>
    <my\:Building gml\:id="b1">
      <gml\:name>Rathaus</gml\:name>
      <gml\:location>
        <gml\:Point><gml\:pos>10.0 20.0</gml\:pos></gml\:Point>
      </gml\:location>
    </my\:Building>
  </gml\:featureMember>
</wfs\:FeatureCollection>
`;

const featureCollection = await parser.parse(wfsResponse);
console.log(featureCollection.features[0].properties.name);
// "Rathaus"
```

### GML validieren

```typescript
import { validateGml } from 's-gml';

const isValid = await validateGml(`
  <gml\:Point xmlns\:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
    <gml\:pos>10.0 20.0</gml\:pos>
  </gml\:Point>
`, '3.2');
console.log(isValid); // true
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

---
## 📂 Unterstützte GML-Elemente

| Element             | GML 2.1.2 | GML 3.0/3.2 | GeoJSON-Ausgabe     |
| ------------------- | --------- | ----------- | ------------------- |
| `Point`             | ✅         | ✅           | `Point`             |
| `LineString`        | ✅         | ✅           | `LineString`        |
| `Polygon`           | ✅         | ✅           | `Polygon`           |
| `MultiPoint`        | ✅         | ✅           | `MultiPoint`        |
| `MultiLineString`   | ✅         | ✅           | `MultiLineString`   |
| `MultiPolygon`      | ✅         | ✅           | `MultiPolygon`      |
| `FeatureCollection` | ✅         | ✅           | `FeatureCollection` |

---
## 🛠 Entwicklung

### Vorraussetzungen
- Node.js ≥ 16
- TypeScript ≥ 5.0

### Build & Test
```bash
git clone https://github.com/pt9912/s-gml
cd s-gml
npm install
npm run build
npm test
```

---
## 📄 Lizenz
[MIT](LICENSE) © Dietmar Burkard
