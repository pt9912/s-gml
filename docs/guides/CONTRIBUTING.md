# Contributing Guide

Willkommen zum **s-gml** Projekt! Wir freuen uns über Beiträge zur Verbesserung der Bibliothek.

## 📋 Inhaltsverzeichnis

- [Development Setup](#development-setup)
- [Projektstruktur](#projektstruktur)
- [Coding Standards](#coding-standards)
- [Neuen Builder hinzufügen](#neuen-builder-hinzufügen)
- [Neue Geometrie-Typen unterstützen](#neue-geometrie-typen-unterstützen)
- [Tests schreiben](#tests-schreiben)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Development Setup

### Voraussetzungen

- Node.js ≥ 22.0.0
- pnpm ≥ 8.0.0 (Installieren mit: `npm install -g pnpm`)
- Git

### Repository clonen

```bash
git clone https://github.com/pt9912/s-gml.git
cd s-gml
```

### Dependencies installieren

```bash
pnpm install
```

### Build

```bash
# Alles bauen (ESM + CJS + Types + CLI)
pnpm run build

# Nur ESM
pnpm run build:esm

# Nur Types
pnpm run build:types
```

### Tests ausführen

```bash
# Alle Tests
pnpm test

# Mit Coverage
pnpm run test:coverage

# Nur spezifische Tests
pnpm test -- parser.test.ts
```

### Linting

```bash
# ESLint
pnpm run lint

# Auto-Fix
pnpm run lint --fix
```

### Git Hooks Setup

Das Projekt verwendet Git Hooks für Pre-Push Linting:

```bash
pnpm run setup-hooks
```

---

## Projektstruktur

```
s-gml/
├── src/                      # Source Code
│   ├── parser.ts            # Haupt-Parser (GmlParser)
│   ├── streaming-parser.ts  # Streaming-Parser für große Dateien
│   ├── types.ts             # TypeScript Type-Definitionen
│   ├── utils.ts             # Utility-Funktionen (XML, Koordinaten, etc.)
│   ├── generator.ts         # GML → XML Generierung
│   ├── performance.ts       # Performance-Optimierungen
│   ├── ows-exception.ts     # OWS Exception Handling
│   ├── index.ts             # Public API Exports
│   ├── cli.ts               # Command-Line Interface
│   ├── builders/            # Output-Format Builder
│   │   ├── index.ts         # Builder Registry + getBuilder()
│   │   ├── geojson.ts       # GeoJSON Builder (Standard)
│   │   ├── shapefile.ts     # Shapefile Builder
│   │   ├── geopackage.ts    # GeoPackage Builder
│   │   ├── flatgeobuf.ts    # FlatGeobuf Builder
│   │   ├── csv.ts           # CSV + WKT Builder
│   │   ├── kml.ts           # KML Builder
│   │   ├── wkt.ts           # WKT Builder
│   │   ├── cis-json.ts      # CIS JSON Builder
│   │   └── coveragejson.ts  # CoverageJSON Builder
│   ├── generators/          # XML Generatoren
│   │   └── coverage-generator.ts  # Coverage → WCS XML
│   ├── wcs/                 # WCS-spezifische Funktionalität
│   │   ├── request-builder.ts     # WCS GetCoverage URLs
│   │   └── capabilities-parser.ts # WCS Capabilities Parser
│   ├── utils/               # Zusätzliche Utilities
│   │   └── geotiff-metadata.ts    # GeoTIFF Metadaten
│   └── validator.*.ts       # XSD-Validierung (Browser + Node.js)
├── test/                    # Tests
│   ├── gml/                 # Test-GML-Dateien
│   ├── parser.test.ts       # Parser Tests
│   ├── builders.test.ts     # Builder Tests
│   └── ...
├── docs/                    # Dokumentation
│   ├── architecture/        # Architektur-Diagramme
│   ├── guides/              # Entwickler-Guides
│   └── api/                 # TypeDoc API-Docs (generiert)
├── dist/                    # Build-Output (generiert)
├── scripts/                 # Build- und Release-Scripts
├── rollup.*.js              # Rollup Build-Konfiguration
├── tsconfig.json            # TypeScript Config
├── typedoc.json             # TypeDoc Config
├── jest.config.js           # Jest Test Config
├── package.json             # NPM Package Definition
└── README.md                # Haupt-Dokumentation
```

### Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| `src/index.ts` | Public API Exports - alles was hier exportiert wird ist öffentlich verfügbar |
| `src/types.ts` | Type-Definitionen für GML-Objekte und Builder Interface |
| `src/parser.ts` | Haupt-Parser-Logik |
| `src/builders/index.ts` | Builder Registry - hier neue Builder registrieren |

---

## Coding Standards

### TypeScript

- **Strict Mode**: Aktiviert (`strict: true`)
- **No Implicit Any**: Vermeide `any`, nutze generische Typen
- **Explicit Types**: Funktions-Return-Types explizit angeben
- **Naming Conventions**:
  - Klassen: `PascalCase` (z.B. `GmlParser`)
  - Funktionen/Methoden: `camelCase` (z.B. `parsePoint`)
  - Konstanten: `UPPER_SNAKE_CASE` (z.B. `GEOMETRY_ELEMENT_NAMES`)
  - Private Members: Präfix `_` (z.B. `_builder`) - oder `private` keyword
  - Interfaces/Types: `PascalCase`, kein `I`-Prefix (z.B. `Builder`, nicht `IBuilder`)

### Code Style

- **Indentation**: 4 Spaces (kein Tab)
- **Quotes**: Single Quotes `'` für Strings
- **Semicolons**: Ja, immer
- **Line Length**: Max 120 Zeichen
- **Trailing Commas**: In Multi-Line Arrays/Objects

### Kommentare

- **TSDoc**: Alle public APIs mit TSDoc-Kommentaren dokumentieren
- **Inline Comments**: Nur für komplexe Logik, nicht für Offensichtliches
- **TODOs**: Mit Issue-Nummer: `// TODO(#123): Fix edge case`

**Beispiel:**

```typescript
/**
 * Parsed ein GML Point Element.
 *
 * @param element - XML Element Node
 * @param version - GML Version
 * @returns GmlPoint Objekt
 *
 * @throws {Error} Wenn Koordinaten ungültig sind
 *
 * @example
 * ```typescript
 * const point = this.parsePoint(element, '3.2');
 * console.log(point.coordinates); // [10, 20]
 * ```
 */
private parsePoint(element: any, version: GmlVersion): GmlPoint {
    // Implementation
}
```

---

## Neuen Builder hinzufügen

Builders transformieren GML-Objekte in verschiedene Output-Formate. Hier eine Schritt-für-Schritt-Anleitung:

### Schritt 1: Builder-Datei erstellen

Erstelle `src/builders/my-format.ts`:

```typescript
import {
    Builder,
    GmlPoint,
    GmlLineString,
    GmlPolygon,
    GmlMultiPoint,
    GmlMultiLineString,
    GmlMultiPolygon,
    GmlLinearRing,
    GmlEnvelope,
    GmlBox,
    GmlCurve,
    GmlSurface,
    GmlRectifiedGridCoverage,
    GmlGridCoverage,
    GmlReferenceableGridCoverage,
    GmlMultiPointCoverage,
    GmlFeature,
    GmlFeatureCollection,
} from '../types.js';

/**
 * Builder für [Your Format Name].
 *
 * Konvertiert GML-Objekte zu [Format Description].
 *
 * @example
 * ```typescript
 * const parser = new GmlParser(new MyFormatBuilder());
 * const output = await parser.parse(gmlXml);
 * ```
 *
 * @public
 * @category Builder
 */
export class MyFormatBuilder implements Builder<MyGeometry, MyFeature, MyFeatureCollection> {
    /**
     * Baut ein Point-Objekt.
     */
    buildPoint(gml: GmlPoint): MyGeometry {
        return {
            type: 'MyPoint',
            coords: gml.coordinates,
            crs: gml.srsName
        };
    }

    /**
     * Baut ein LineString-Objekt.
     */
    buildLineString(gml: GmlLineString): MyGeometry {
        return {
            type: 'MyLine',
            coords: gml.coordinates,
            crs: gml.srsName
        };
    }

    /**
     * Baut ein Polygon-Objekt.
     */
    buildPolygon(gml: GmlPolygon): MyGeometry {
        return {
            type: 'MyPolygon',
            rings: gml.coordinates,
            crs: gml.srsName
        };
    }

    // ... Alle weiteren Geometrie-Methoden implementieren
    // (siehe Builder Interface in types.ts)

    buildFeature(gml: GmlFeature): MyFeature {
        return {
            id: gml.id,
            geometry: this.geometryToMyFormat(gml.geometry),
            attributes: gml.properties
        };
    }

    buildFeatureCollection(gml: GmlFeatureCollection): MyFeatureCollection {
        return {
            type: 'MyCollection',
            features: gml.features.map(f => this.buildFeature(f)),
            count: gml.features.length
        };
    }

    private geometryToMyFormat(gml: any): MyGeometry {
        switch (gml.type) {
            case 'Point': return this.buildPoint(gml);
            case 'LineString': return this.buildLineString(gml);
            // ... etc.
            default: throw new Error(`Unsupported geometry: ${gml.type}`);
        }
    }
}
```

### Schritt 2: Types definieren

Füge deine Output-Types zu `src/types.ts` oder einer separaten Datei hinzu:

```typescript
export interface MyGeometry {
    type: string;
    coords: number[] | number[][];
    crs?: string;
}

export interface MyFeature {
    id?: string;
    geometry: MyGeometry;
    attributes: Record<string, any>;
}

export interface MyFeatureCollection {
    type: 'MyCollection';
    features: MyFeature[];
    count: number;
}
```

### Schritt 3: Builder registrieren

Füge den Builder zu `src/builders/index.ts` hinzu:

```typescript
// Import hinzufügen
export { MyFormatBuilder } from './my-format.js';

// In getBuilder() registrieren
export function getBuilder(format: string): Builder {
    switch (format.toLowerCase()) {
        case 'geojson':
            return new GeoJsonBuilder();
        case 'shapefile':
        case 'shp':
            return new ShapefileBuilder();
        // ... andere Builder
        case 'myformat': // Neues Format
            return new MyFormatBuilder();
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}
```

### Schritt 4: Export zur Public API

Füge den Builder zu `src/index.ts` hinzu:

```typescript
export {
    // ... existierende Exports
    MyFormatBuilder,
    type MyGeometry,
    type MyFeature,
    type MyFeatureCollection,
} from './builders/index.js';
```

### Schritt 5: Tests schreiben

Erstelle `test/builders/my-format.test.ts`:

```typescript
import { GmlParser } from '../src/parser.js';
import { MyFormatBuilder } from '../src/builders/my-format.js';

describe('MyFormatBuilder', () => {
    it('should parse Point to MyFormat', async () => {
        const parser = new GmlParser(new MyFormatBuilder());
        const gml = `<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
            <gml:pos>10 20</gml:pos>
        </gml:Point>`;

        const result = await parser.parse(gml);

        expect(result.type).toBe('MyPoint');
        expect(result.coords).toEqual([10, 20]);
    });

    it('should parse FeatureCollection to MyFormat', async () => {
        const parser = new GmlParser(new MyFormatBuilder());
        // ... Test mit FeatureCollection
    });

    // ... weitere Tests
});
```

### Schritt 6: Dokumentation aktualisieren

1. **README.md**: Füge das neue Format zur Builder-Tabelle hinzu
2. **TSDoc**: Vollständige TSDoc-Kommentare zur Builder-Klasse
3. **Example**: Füge ein Verwendungs-Beispiel zum README hinzu

---

## Neue Geometrie-Typen unterstützen

Um einen neuen GML-Geometrie-Typ zu unterstützen:

### 1. Type-Definition hinzufügen

In `src/types.ts`:

```typescript
export interface GmlNewGeometry {
    type: 'NewGeometry';
    coordinates: number[][][]; // Anpassen je nach Struktur
    srsName?: string;
    version: GmlVersion;
}

// Zum Union-Type hinzufügen
export type GmlGeometry =
    | GmlPoint
    | GmlLineString
    | GmlPolygon
    // ... andere
    | GmlNewGeometry; // Neu
```

### 2. Parser-Methode implementieren

In `src/parser.ts`:

```typescript
/**
 * Parsed ein NewGeometry Element.
 */
private parseNewGeometry(element: any, version: GmlVersion): GmlNewGeometry {
    const srsName = element.$?.srsName;
    // ... Parsing-Logik
    return {
        type: 'NewGeometry',
        coordinates: parsedCoords,
        srsName,
        version
    };
}
```

### 3. Element-Namen registrieren

```typescript
const GEOMETRY_ELEMENT_NAMES = new Set([
    'Point',
    'LineString',
    // ... andere
    'NewGeometry', // Neu
]);
```

### 4. Switch-Case erweitern

```typescript
private parseElement(key: string, value: any, version: GmlVersion): GmlGeometry {
    const name = this.getLocalName(key, value);
    switch (name) {
        case 'Point': return this.parsePoint(element, version);
        // ... andere
        case 'NewGeometry': return this.parseNewGeometry(element, version);
    }
}
```

### 5. Builder-Interface erweitern

In `src/types.ts`:

```typescript
export interface Builder<TGeometry, TFeature, TFeatureCollection> {
    // ... existierende Methoden
    buildNewGeometry(gml: GmlNewGeometry): TGeometry;
}
```

### 6. Alle Builder aktualisieren

Füge `buildNewGeometry` zu allen Builder-Implementierungen hinzu:

```typescript
// geojson.ts
buildNewGeometry(gml: GmlNewGeometry): Geometry {
    // Konvertierung zu GeoJSON
}

// shapefile.ts
buildNewGeometry(gml: GmlNewGeometry): Geometry {
    // Delegiere zu GeoJsonBuilder
    return new GeoJsonBuilder().buildNewGeometry(gml);
}
```

### 7. Tests schreiben

```typescript
it('should parse NewGeometry', async () => {
    const parser = new GmlParser();
    const gml = `<gml:NewGeometry ...>...</gml:NewGeometry>`;
    const result = await parser.parse(gml);
    expect(result.type).toBe('ExpectedGeoJSONType');
});
```

---

## Tests schreiben

### Test-Struktur

```typescript
import { GmlParser } from '../src/parser.js';
import { GeoJsonBuilder } from '../src/builders/geojson.js';

describe('GmlParser', () => {
    describe('Point parsing', () => {
        it('should parse GML 3.2 Point', async () => {
            const parser = new GmlParser();
            const gml = `<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
                <gml:pos>10 20</gml:pos>
            </gml:Point>`;

            const result = await parser.parse(gml);

            expect(result.type).toBe('Point');
            expect(result.coordinates).toEqual([10, 20]);
        });

        it('should parse GML 2.1.2 Point', async () => {
            // ... Test für ältere Version
        });

        it('should handle invalid Point', async () => {
            const parser = new GmlParser();
            const gml = `<gml:Point><gml:pos></gml:pos></gml:Point>`;

            await expect(parser.parse(gml)).rejects.toThrow('Invalid GML Point');
        });
    });

    // ... weitere Test-Gruppen
});
```

### Test-GML-Dateien verwenden

```typescript
import { readFileSync } from 'fs';
import { resolve } from 'path';

const gmlFile = readFileSync(resolve(__dirname, 'gml/test-file.xml'), 'utf-8');

it('should parse real WFS response', async () => {
    const parser = new GmlParser();
    const result = await parser.parse(gmlFile);
    expect(result.type).toBe('FeatureCollection');
});
```

### Coverage-Ziele

- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

```bash
pnpm run test:coverage
```

---

## Pull Request Process

### 1. Fork & Clone

```bash
# Fork auf GitHub erstellen, dann:
git clone https://github.com/YOUR_USERNAME/s-gml.git
cd s-gml
git remote add upstream https://github.com/pt9912/s-gml.git
```

### 2. Feature Branch erstellen

```bash
git checkout -b feature/my-awesome-feature
```

Branch-Namen-Konventionen:
- `feature/...` - Neue Features
- `fix/...` - Bug Fixes
- `docs/...` - Dokumentations-Änderungen
- `refactor/...` - Code-Refactorings
- `test/...` - Test-Ergänzungen
- `perf/...` - Performance-Verbesserungen

### 3. Änderungen vornehmen

```bash
# Entwickeln...
pnpm test
pnpm run lint
pnpm run build
```

### 4. Commit

```bash
git add .
git commit -m "feat: add MyFormat builder for custom output

- Implements Builder interface
- Adds comprehensive tests
- Updates documentation"
```

**Commit-Message-Format:**

```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: Neue Features
- `fix`: Bug Fixes
- `docs`: Dokumentation
- `style`: Formatting
- `refactor`: Code-Refactoring
- `test`: Tests hinzufügen
- `chore`: Build/Tooling
- `perf`: Performance-Verbesserungen

### 5. Push & Pull Request

```bash
git push origin feature/my-awesome-feature
```

Dann auf GitHub Pull Request erstellen mit:
- **Titel**: Klare Beschreibung der Änderung
- **Description**: Was, Warum, Wie
- **Tests**: Beschreibe hinzugefügte Tests
- **Breaking Changes**: Falls vorhanden, markieren

### 6. Review-Prozess

- CI/CD muss grün sein (Tests, Linting, Build)
- Mindestens 1 Approval von Maintainer
- Keine Merge-Konflikte
- Coverage darf nicht sinken

---

## Release Process

Nur für Maintainer.

### 1. Version Bump

```bash
# Patch (1.0.0 → 1.0.1)
pnpm run version:bump -- patch

# Minor (1.0.0 → 1.1.0)
pnpm run version:bump -- minor

# Major (1.0.0 → 2.0.0)
pnpm run version:bump -- major
```

### 2. Changelog aktualisieren

```bash
# CHANGELOG.md manuell editieren
# Füge alle Changes seit letztem Release hinzu
```

### 3. Commit & Tag

```bash
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 1.7.0"
git tag v1.7.0
git push origin main --tags
```

### 4. NPM Publish

```bash
pnpm run build
npm publish
```

### 5. GitHub Release

- Gehe zu GitHub Releases
- Erstelle neues Release mit Tag v1.7.0
- Füge Release Notes aus CHANGELOG.md hinzu

---

## Fragen?

- **Issues**: https://github.com/pt9912/s-gml/issues
- **Discussions**: https://github.com/pt9912/s-gml/discussions
- **Email**: [Maintainer-Email einfügen]

Danke für deine Beiträge! 🎉
