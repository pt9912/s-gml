# @npm9912/s-gml


[![npm version](https://badge.fury.io/js/@npm9912%2Fs-gml.svg)](https://badge.fury.io/js/@npm9912%2Fs-gml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%23007ACC.svg)](https://www.typescriptlang.org/)

**TypeScript-Bibliothek zum Parsen, Konvertieren und Validieren von GML 2.1.2/3.0/3.2** –
inkl. **Envelope, Box, Curve, Surface, LinearRing**, WFS-/WCS-Unterstützung und Docker-CLI.

---
## ✨ Features

| Feature                    | Beschreibung                                          |
| -------------------------- | ----------------------------------------------------- |
| **GML → GeoJSON**          | Parsen aller GML-Elemente nach GeoJSON                |
| **Coverage-Unterstützung** | RectifiedGridCoverage, GridCoverage, MultiPointCoverage + GeoTIFF-Metadaten |
| **JSON-Coverage-Formate**  | CIS JSON + CoverageJSON (beide OGC-Standards)         |
| **WCS 2.0 XML Generator**  | Coverage → WCS 2.0 XML mit Multi-band RangeType       |
| **WCS GetCoverage Builder** | Request-URLs und XML für WCS GetCoverage (2.0/1.1/1.0) |
| **WCS Capabilities Parser** | Parsen von GetCapabilities Responses (WCS 2.0/1.1/1.0) |
| **Time-series Coverage**   | Temporale Achse mit ISO 8601 Timestamps & Auflösung   |
| **Versionen konvertieren** | GML 2.1.2 ↔ 3.2 (inkl. FeatureCollections)            |
| **WFS-Unterstützung**      | Parsen von WFS-FeatureCollections                     |
| **URL-Unterstützung**      | Direktes Laden von GML-Daten aus URLs                 |
| **OWS Exception Handling** | Automatische Erkennung und Behandlung von WFS-Fehlern |
| **XSD-Validierung**        | Prüfung gegen offizielle GML-Schemata                 |
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

### GML von URL parsen
```typescript
const parser = new GmlParser();

// WFS GetFeature Request
const geojson = await parser.parseFromUrl(
  'https://example.com/wfs?service=WFS&request=GetFeature&typeName=water_areas'
);
console.log(geojson.type); // 'FeatureCollection'
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

### GML Coverage parsen
```typescript
const coverage = await parser.parse(`
  <gml\:RectifiedGridCoverage xmlns\:gml="http://www.opengis.net/gml/3.2" gml:id="RGC01">
    <gml\:boundedBy>
      <gml\:Envelope srsName="EPSG:4326">
        <gml\:lowerCorner>1.0 1.0</gml\:lowerCorner>
        <gml\:upperCorner>10.0 20.0</gml\:upperCorner>
      </gml\:Envelope>
    </gml\:boundedBy>
    <gml\:domainSet>
      <gml\:RectifiedGrid dimension="2" srsName="EPSG:4326">
        <gml\:limits>
          <gml\:GridEnvelope>
            <gml\:low>0 0</gml\:low>
            <gml\:high>99 199</gml\:high>
          </gml\:GridEnvelope>
        </gml\:limits>
        <gml\:origin>
          <gml\:Point><gml\:pos>10.0 1.0</gml\:pos></gml\:Point>
        </gml\:origin>
        <gml\:offsetVector>0 0.1</gml\:offsetVector>
        <gml\:offsetVector>-0.1 0</gml\:offsetVector>
      </gml\:RectifiedGrid>
    </gml\:domainSet>
    <gml\:rangeSet>
      <gml\:File>
        <gml\:fileName>coverage_data.tif</gml\:fileName>
      </gml\:File>
    </gml\:rangeSet>
  </gml\:RectifiedGridCoverage>
`);

console.log(coverage.type); // 'Feature'
console.log(coverage.properties.coverageType); // 'RectifiedGridCoverage'
console.log(coverage.properties.grid.limits); // { low: [0, 0], high: [99, 199] }
```

### GeoTIFF-Metadaten aus Coverage extrahieren
```typescript
import { extractGeoTiffMetadata, pixelToWorld } from '@npm9912/s-gml';

// Extrahiere GeoTIFF-kompatible Metadaten
const metadata = extractGeoTiffMetadata(gmlCoverageObject);

console.log(metadata.width);      // 100 Pixel
console.log(metadata.height);     // 200 Pixel
console.log(metadata.bbox);       // [1, 1, 10, 20]
console.log(metadata.crs);        // 'EPSG:4326'
console.log(metadata.transform);  // Affine transformation matrix
console.log(metadata.resolution); // [xRes, yRes]

// Konvertiere Pixel- zu Weltkoordinaten
const worldCoords = pixelToWorld(50, 100, metadata);
console.log(worldCoords); // [lon, lat] in Weltkoordinaten
```

### Coverage in JSON-Formaten ausgeben
```typescript
import { GmlParser } from '@npm9912/s-gml';

// 1. CIS JSON (OGC Coverage Implementation Schema)
const cisParser = new GmlParser('cis-json');
const cisJson = await cisParser.parse(coverageGml);
console.log(cisJson);
/* {
  "@context": "http://www.opengis.net/cis/1.1/json",
  "type": "CoverageByDomainAndRangeType",
  "id": "RGC01",
  "domainSet": {
    "type": "GeneralGrid",
    "srsName": "EPSG:4326",
    "axis": [...]
  },
  "rangeSet": {...}
} */

// 2. CoverageJSON (OGC Community Standard - web-optimiert)
const covjsonParser = new GmlParser('coveragejson');
const coveragejson = await covjsonParser.parse(coverageGml);
console.log(coveragejson);
/* {
  "type": "Coverage",
  "domain": {
    "type": "Domain",
    "domainType": "Grid",
    "axes": { "x": {...}, "y": {...} },
    "referencing": [...]
  },
  "parameters": {...},
  "ranges": {...}
} */

// 3. GeoJSON Feature (Standard-Ausgabe)
const geojsonParser = new GmlParser('geojson'); // oder new GmlParser()
const geojson = await geojsonParser.parse(coverageGml);
console.log(geojson);
/* {
  "type": "Feature",
  "geometry": {...},
  "properties": {
    "coverageType": "RectifiedGridCoverage",
    "grid": {...}
  }
} */
```

### Coverage zu WCS 2.0 XML generieren
```typescript
import { CoverageGenerator, generateCoverageXml } from '@npm9912/s-gml';

// Coverage-Objekt erstellen oder aus GML parsen
const coverage = {
  type: 'RectifiedGridCoverage',
  id: 'MY_COVERAGE',
  boundedBy: {
    type: 'Envelope',
    bbox: [5, 10, 15, 20],
    srsName: 'EPSG:4326',
    version: '3.2'
  },
  domainSet: {
    dimension: 2,
    srsName: 'EPSG:4326',
    limits: { low: [0, 0], high: [99, 199] },
    axisLabels: ['Lat', 'Long'],
    origin: [15.0, 5.0],
    offsetVectors: [[0, 0.2], [-0.2, 0]]
  },
  rangeSet: {
    file: {
      fileName: 'coverage_data.tif',
      fileStructure: 'GeoTIFF'
    }
  },
  // Optional: Multi-band RangeType
  rangeType: {
    field: [
      { name: 'red', dataType: 'uint8', uom: 'W.m-2.sr-1' },
      { name: 'green', dataType: 'uint8', uom: 'W.m-2.sr-1' },
      { name: 'blue', dataType: 'uint8', uom: 'W.m-2.sr-1' }
    ]
  },
  version: '3.2'
};

// Variante 1: Mit Generator-Klasse
const generator = new CoverageGenerator();
const xml = generator.generate(coverage);
console.log(xml);
// <gml:RectifiedGridCoverage xmlns:gml="..." gml:id="MY_COVERAGE">...</gml:RectifiedGridCoverage>

// Variante 2: Mit Helper-Funktion
const xmlPretty = generateCoverageXml(coverage, true); // prettyPrint = true
console.log(xmlPretty); // Formatiertes XML

// Round-Trip: GML → Object → GML
const parser = new GmlParser();
const parsedCoverage = await parser.parse(originalXml);
// Extrahiere Coverage-Objekt aus GeoJSON...
const regeneratedXml = generateCoverageXml(coverageObject);
// Ergibt wieder valides WCS 2.0 XML!

// ReferenceableGridCoverage mit unregelmäßigem Georeferencing
const irregularCoverage = {
  type: 'ReferenceableGridCoverage',
  id: 'MODIS_LST',
  boundedBy: {
    type: 'Envelope',
    bbox: [-180, -90, 180, 90],
    srsName: 'EPSG:4326',
    version: '3.2'
  },
  domainSet: {
    dimension: 2,
    limits: { low: [0, 0], high: [719, 359] },
    axisLabels: ['lon', 'lat']
  },
  rangeSet: {
    file: { fileName: 'modis_lst.hdf', fileStructure: 'HDF' }
  },
  rangeType: {
    field: [
      { name: 'LST_Day', dataType: 'uint16', uom: 'K', description: 'Daytime Land Surface Temperature' },
      { name: 'LST_Night', dataType: 'uint16', uom: 'K', description: 'Nighttime Land Surface Temperature' }
    ]
  },
  version: '3.2'
};

const modisXml = generateCoverageXml(irregularCoverage, true);
// <gml:ReferenceableGridCoverage xmlns:gml="..." gml:id="MODIS_LST">...</gml:ReferenceableGridCoverage>

// Time-series Coverage mit temporaler Achse
const timeseriesCoverage = {
  type: 'GridCoverage',
  id: 'WEATHER_FORECAST',
  domainSet: {
    dimension: 2,
    limits: { low: [0, 0], high: [720, 360] },
    axisLabels: ['lon', 'lat']
  },
  rangeSet: {
    file: { fileName: 'weather_forecast.grib2' }
  },
  rangeType: {
    field: [
      { name: 'temperature', dataType: 'float32', uom: 'K', description: 'Air temperature 2m above ground' },
      { name: 'precipitation', dataType: 'float32', uom: 'kg/m2', description: 'Total precipitation' }
    ]
  },
  // Temporale Achse für Zeitreihen
  temporal: {
    axisLabel: 'time',
    startTime: '2024-10-16T00:00:00Z',
    endTime: '2024-10-23T00:00:00Z',
    resolution: 'PT1H', // ISO 8601 Duration: 1 Stunde
    uom: 'ISO8601'
  },
  version: '3.2'
};

const weatherXml = generateCoverageXml(timeseriesCoverage);
// Generiert WCS 2.0 XML mit gmlcov:metadata für temporale Achse

// Landsat Time-series mit 16-Tage Auflösung
const landsatSeries = {
  type: 'RectifiedGridCoverage',
  id: 'LANDSAT_TIMESERIES',
  boundedBy: {
    type: 'Envelope',
    bbox: [-120, 30, -110, 40],
    srsName: 'EPSG:4326',
    version: '3.2'
  },
  domainSet: {
    dimension: 2,
    srsName: 'EPSG:4326',
    limits: { low: [0, 0], high: [1000, 1000] },
    axisLabels: ['x', 'y'],
    origin: [30, -120],
    offsetVectors: [[0.01, 0], [0, 0.01]]
  },
  rangeSet: {
    file: { fileName: 'landsat_series.nc', fileStructure: 'netCDF' }
  },
  temporal: {
    axisLabel: 'time',
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-12-31T23:59:59Z',
    resolution: 'P16D' // 16 Tage (Landsat Wiederholrate)
  },
  version: '3.2'
};

const landsatXml = generateCoverageXml(landsatSeries, true);
```

### WCS GetCoverage Requests generieren
```typescript
import { WcsRequestBuilder, buildWcsGetCoverageUrl, buildWcsGetCoverageXml } from '@npm9912/s-gml';

// 1. GET Request URL generieren
const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');

// Einfache GetCoverage Anfrage
const url = builder.buildGetCoverageUrl({
  coverageId: 'MY_COVERAGE',
  format: 'image/tiff'
});
console.log(url);
// https://example.com/wcs?service=WCS&version=2.0.1&request=GetCoverage&coverageId=MY_COVERAGE&format=image/tiff

// Mit räumlichem Subsetting (Bounding Box)
const urlSubset = builder.buildGetCoverageUrl({
  coverageId: 'LANDSAT_SCENE',
  format: 'image/tiff',
  subset: [
    { axis: 'Lat', min: -34.0, max: -33.0 },
    { axis: 'Long', min: 18.0, max: 19.0 }
  ]
});

// Mit zeitlichem Subsetting
const urlTemporal = builder.buildGetCoverageUrl({
  coverageId: 'WEATHER_DATA',
  format: 'application/netcdf',
  subset: [
    { axis: 'Lat', min: 40, max: 55 },
    { axis: 'Long', min: -10, max: 10 },
    { axis: 'time', min: '2024-10-16T00:00:00Z', max: '2024-10-23T00:00:00Z' }
  ]
});

// Range Subsetting (Band-Auswahl)
const urlRgb = builder.buildGetCoverageUrl({
  coverageId: 'LANDSAT8',
  format: 'image/tiff',
  rangeSubset: ['B4', 'B3', 'B2'], // RGB Bänder
  subset: [
    { axis: 'Lat', min: -34.0, max: -33.0 },
    { axis: 'Long', min: 18.0, max: 19.0 }
  ]
});

// Skalierung (Scaling)
const urlScaled = builder.buildGetCoverageUrl({
  coverageId: 'MY_COVERAGE',
  format: 'image/png',
  scaling: { type: 'size', value: [1024, 1024] } // Auf 1024x1024 Pixel skalieren
});

// Mit Interpolation und CRS-Transformation
const urlComplete = builder.buildGetCoverageUrl({
  coverageId: 'SENTINEL2',
  format: 'image/tiff',
  subset: [
    { axis: 'Lat', min: 50, max: 52 },
    { axis: 'Long', min: 8, max: 10 }
  ],
  rangeSubset: ['B8', 'B4', 'B3'], // NIR-RGB Falschfarben
  scaling: { type: 'size', value: [2048, 2048] },
  outputCrs: 'EPSG:3857', // Web Mercator
  subsettingCrs: 'EPSG:4326', // WGS84 für Subsetting
  interpolation: 'bilinear',
  mediaType: {
    compression: 'DEFLATE'
  }
});

// 2. XML POST Request generieren (WCS 2.0 nur)
const xml = builder.buildGetCoverageXml({
  coverageId: 'LANDSAT8_SCENE',
  format: 'image/tiff',
  subset: [
    { axis: 'Lat', min: -34.0, max: -33.0 },
    { axis: 'Long', min: 18.0, max: 19.0 },
    { axis: 'time', value: '2024-01-01T10:30:00Z' }
  ],
  rangeSubset: ['B4', 'B3', 'B2'],
  scaling: { type: 'size', value: [1024, 1024] }
});

console.log(xml);
/* Ausgabe:
<?xml version="1.0" encoding="UTF-8"?>
<wcs:GetCoverage
 xmlns:wcs="http://www.opengis.net/wcs/2.0"
 xmlns:crs="http://www.opengis.net/wcs/crs/1.0"
 xmlns:rsub="http://www.opengis.net/wcs/range-subsetting/1.0"
 xmlns:scal="http://www.opengis.net/wcs/scaling/1.0"
 service="WCS" version="2.0.1">
  <wcs:CoverageId>LANDSAT8_SCENE</wcs:CoverageId>
  <wcs:format>image/tiff</wcs:format>
  <wcs:DimensionTrim>
    <wcs:Dimension>Lat</wcs:Dimension>
    <wcs:TrimLow>-34.0</wcs:TrimLow>
    <wcs:TrimHigh>-33.0</wcs:TrimHigh>
  </wcs:DimensionTrim>
  ...
</wcs:GetCoverage>
*/

// 3. Unterstützung für ältere WCS-Versionen
const builder11 = new WcsRequestBuilder('https://example.com/wcs', '1.1.0');
const url11 = builder11.buildGetCoverageUrl({
  coverageId: 'MY_COVERAGE',
  format: 'image/tiff'
});
// Verwendet 'identifier' statt 'coverageId' für WCS 1.1.0

const builder10 = new WcsRequestBuilder('https://example.com/wcs', '1.0.0');
const url10 = builder10.buildGetCoverageUrl({
  coverageId: 'MY_COVERAGE',
  format: 'image/tiff'
});
// Verwendet 'coverage' statt 'coverageId' für WCS 1.0.0

// 4. Helper-Funktionen verwenden
const urlHelper = buildWcsGetCoverageUrl(
  'https://example.com/wcs',
  {
    coverageId: 'TEST_COVERAGE',
    format: 'image/png',
    subset: [
      { axis: 'Lat', min: 50, max: 52 },
      { axis: 'Long', min: 8, max: 10 }
    ]
  },
  '2.0.1'
);

const xmlHelper = buildWcsGetCoverageXml(
  {
    coverageId: 'TEST_COVERAGE',
    format: 'image/tiff',
    rangeSubset: ['red', 'green', 'blue']
  },
  '2.0.1'
);
```

### WCS Capabilities parsen
```typescript
import { WcsCapabilitiesParser, parseWcsCapabilities } from '@npm9912/s-gml';

// GetCapabilities Response parsen
const capabilitiesXml = `<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/2.0"
                  xmlns:ows="http://www.opengis.net/ows/2.0"
                  version="2.0.1">
  <ows:ServiceIdentification>
    <ows:Title>My WCS Server</ows:Title>
    <ows:Abstract>WCS Server for satellite imagery</ows:Abstract>
  </ows:ServiceIdentification>
  <wcs:Contents>
    <wcs:CoverageSummary>
      <wcs:CoverageId>LANDSAT8_SCENE</wcs:CoverageId>
      <ows:Title>Landsat 8 Scene</ows:Title>
      <ows:WGS84BoundingBox>
        <ows:LowerCorner>-34.0 18.0</ows:LowerCorner>
        <ows:UpperCorner>-33.0 19.0</ows:UpperCorner>
      </ows:WGS84BoundingBox>
    </wcs:CoverageSummary>
  </wcs:Contents>
</wcs:Capabilities>`;

// Variante 1: Mit Parser-Klasse
const parser = new WcsCapabilitiesParser();
const capabilities = parser.parse(capabilitiesXml);

console.log(capabilities.version); // '2.0.1'
console.log(capabilities.serviceIdentification?.title); // 'My WCS Server'
console.log(capabilities.coverages.length); // 1
console.log(capabilities.coverages[0].coverageId); // 'LANDSAT8_SCENE'
console.log(capabilities.coverages[0].wgs84BoundingBox);
// { lowerCorner: [-34, 18], upperCorner: [-33, 19] }

// Variante 2: Mit Helper-Funktion
const caps = parseWcsCapabilities(capabilitiesXml);

// Verfügbare Coverages auflisten
caps.coverages.forEach(coverage => {
  console.log(`Coverage ID: ${coverage.coverageId}`);
  console.log(`  Title: ${coverage.title}`);
  console.log(`  Subtype: ${coverage.coverageSubtype}`);
  if (coverage.wgs84BoundingBox) {
    console.log(`  Bounds: ${coverage.wgs84BoundingBox.lowerCorner} to ${coverage.wgs84BoundingBox.upperCorner}`);
  }
});

// Service-Informationen
if (caps.serviceIdentification) {
  console.log('Service:', caps.serviceIdentification.title);
  console.log('Abstract:', caps.serviceIdentification.abstract);
  console.log('Keywords:', caps.serviceIdentification.keywords);
}

// Verfügbare Operationen
caps.operations?.forEach(op => {
  console.log(`Operation: ${op.name}`);
  console.log(`  GET: ${op.getUrl}`);
  console.log(`  POST: ${op.postUrl}`);
});

// Unterstützte Formate und CRS
console.log('Supported formats:', caps.formats);
console.log('Supported CRS:', caps.crs);

// Unterstützung für WCS 1.1 und 1.0
const wcs11Xml = `<?xml version="1.0" encoding="UTF-8"?>
<wcs:Capabilities xmlns:wcs="http://www.opengis.net/wcs/1.1"
                  xmlns:ows="http://www.opengis.net/ows/1.1"
                  version="1.1.0">
  <wcs:Contents>
    <wcs:CoverageSummary>
      <ows:Identifier>TEST_COVERAGE</ows:Identifier>
      <ows:Title>Test Coverage</ows:Title>
    </wcs:CoverageSummary>
  </wcs:Contents>
</wcs:Capabilities>`;

const wcs11Caps = parseWcsCapabilities(wcs11Xml);
console.log(wcs11Caps.version); // '1.1.0'
console.log(wcs11Caps.coverages[0].coverageId); // 'TEST_COVERAGE'
```

### GML Versionen konvertieren
```typescript
const parser = new GmlParser();

// Lokale Konvertierung
const gml32 = `<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2"><gml:pos>10 20</gml:pos></gml:Point>`;
const gml212 = await parser.convert(gml32, { outputVersion: '2.1.2', prettyPrint: true });
console.log(gml212);
// <gml:Point xmlns:gml="http://www.opengis.net/gml"><gml:coordinates>10,20</gml:coordinates></gml:Point>

// Von URL konvertieren
const converted = await parser.convertFromUrl('https://example.com/data.gml', {
  outputVersion: '2.1.2',
  prettyPrint: true
});
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
| `Surface`           | ❌         | ✅           | `MultiPolygon`      | 3D-Oberfläche               |
| `MultiSurface`      | ❌         | ✅           | `MultiPolygon`      | Sammlung von Flächen        |
| `MultiPoint`        | ✅         | ✅           | `MultiPoint`        | Sammlung von Punkten        |
| `MultiLineString`   | ✅         | ✅           | `MultiLineString`   | Sammlung von Linien         |
| `MultiPolygon`      | ✅         | ✅           | `MultiPolygon`      | Sammlung von Polygonen      |
| `FeatureCollection` | ✅         | ✅           | `FeatureCollection` | Sammlung von Features       |
| `RectifiedGridCoverage` | ❌    | ✅           | `Feature`           | Georef. Grid mit Transformation |
| `GridCoverage`      | ❌         | ✅           | `Feature`           | Nicht-georef. Grid          |
| `ReferenceableGridCoverage` | ❌ | ✅          | `Feature`           | Unregelmäßig georef. Grid   |
| `MultiPointCoverage` | ❌        | ✅           | `Feature`           | Coverage mit MultiPoint-Domäne |

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
| Methode                                | Beschreibung                            | Rückgabe                |
| -------------------------------------- | --------------------------------------- | ----------------------- |
| `parse(gml: string)`                   | Parsed GML zu GeoJSON/FeatureCollection | `Promise<GeoJSON>`      |
| `parseFromUrl(url: string)`            | Lädt und parsed GML von URL             | `Promise<GeoJSON>`      |
| `convert(gml: string, options)`        | Konvertiert GML zwischen Versionen      | `Promise<string>` (XML) |
| `convertFromUrl(url: string, options)` | Lädt und konvertiert GML von URL        | `Promise<string>` (XML) |
| `convertGeometry(gmlObject, options)`  | Konvertiert GML-Objekte zu XML          | `Promise<string>`       |

**`GmlConvertOptions`**:
```typescript
{
  outputVersion: '2.1.2' | '3.2', // Zielversion
  prettyPrint?: boolean,         // Formatiertes XML
  inputVersion?: '2.1.2' | '3.0' | '3.2' // Manuelle Versionsangabe
}
```

### Custom Builder erstellen

Du kannst eigene Builder implementieren, um GML in andere Formate als GeoJSON zu konvertieren:

```typescript
import { Builder, GmlPoint, GmlLineString, GmlPolygon, GmlFeature, GmlFeatureCollection } from '@npm9912/s-gml';

class MyCustomBuilder implements Builder {
  buildPoint(gml: GmlPoint) {
    return {
      type: 'CustomPoint',
      x: gml.coordinates[0],
      y: gml.coordinates[1]
    };
  }

  buildLineString(gml: GmlLineString) {
    return {
      type: 'CustomLineString',
      points: gml.coordinates
    };
  }

  buildPolygon(gml: GmlPolygon) {
    return {
      type: 'CustomPolygon',
      rings: gml.coordinates
    };
  }

  // ... alle anderen Builder-Methoden implementieren
  // (siehe Builder Interface in types.ts)
}

// Builder direkt im Constructor übergeben
const parser = new GmlParser(new MyCustomBuilder());

const result = await parser.parse(gmlXml);
// Gibt jetzt dein Custom Format zurück
```

**Builder Interface:**
```typescript
interface Builder<TGeometry, TFeature, TFeatureCollection> {
  buildPoint(gml: GmlPoint): TGeometry;
  buildLineString(gml: GmlLineString): TGeometry;
  buildPolygon(gml: GmlPolygon): TGeometry;
  buildMultiPoint(gml: GmlMultiPoint): TGeometry;
  buildMultiLineString(gml: GmlMultiLineString): TGeometry;
  buildMultiPolygon(gml: GmlMultiPolygon): TGeometry;
  buildLinearRing(gml: GmlLinearRing): TGeometry;
  buildEnvelope(gml: GmlEnvelope): TFeature;
  buildBox(gml: GmlBox): TFeature;
  buildCurve(gml: GmlCurve): TGeometry;
  buildSurface(gml: GmlSurface): TGeometry;
  buildFeature(gml: GmlFeature): TFeature;
  buildFeatureCollection(gml: GmlFeatureCollection): TFeatureCollection;
}
```

### `CoverageGenerator`

Generiert WCS 2.0 XML aus Coverage-Objekten:

| Methode                                        | Beschreibung                                    | Rückgabe        |
| ---------------------------------------------- | ----------------------------------------------- | --------------- |
| `generate(coverage: GmlCoverage, prettyPrint)` | Generiert WCS 2.0 XML aus Coverage-Objekt       | `string` (XML)  |
| `generateRectifiedGridCoverage(coverage)`      | Generiert RectifiedGridCoverage XML             | `string` (XML)  |
| `generateGridCoverage(coverage)`               | Generiert GridCoverage XML                      | `string` (XML)  |
| `generateReferenceableGridCoverage(coverage)`  | Generiert ReferenceableGridCoverage XML         | `string` (XML)  |
| `generateMultiPointCoverage(coverage)`         | Generiert MultiPointCoverage XML                | `string` (XML)  |

**Helper-Funktion:**
```typescript
generateCoverageXml(coverage: GmlCoverage, prettyPrint?: boolean): string
```

**Unterstützte Features:**
- ✅ Alle 4 Coverage-Typen (RectifiedGrid, Grid, ReferenceableGrid, MultiPoint)
- ✅ Multi-band RangeType mit SWE DataRecord
- ✅ Time-series Coverage mit temporaler Achse (ISO 8601)
- ✅ XML Escaping für sichere Ausgabe
- ✅ Pretty-Print Option für lesbare XML-Ausgabe
- ✅ Round-Trip Konvertierung (GML → Object → GML)

### `WcsRequestBuilder`

Generiert WCS GetCoverage Request URLs und XML für verschiedene WCS-Versionen:

| Methode                                       | Beschreibung                                       | Rückgabe        |
| --------------------------------------------- | -------------------------------------------------- | --------------- |
| `buildGetCoverageUrl(options)`                | Generiert GET Request URL mit Query-Parametern     | `string` (URL)  |
| `buildGetCoverageXml(options)`                | Generiert POST Request XML (nur WCS 2.0)           | `string` (XML)  |

**Constructor:**
```typescript
new WcsRequestBuilder(baseUrl: string, version: WcsVersion = '2.0.1')
```

**WcsVersion:** `'2.0.1' | '2.0.0' | '1.1.0' | '1.0.0'`

**WcsGetCoverageOptions:**
```typescript
{
  coverageId: string;              // ID des Coverages
  format?: string;                 // Ausgabeformat (Standard: 'image/tiff')
  subset?: WcsSubset[];            // Räumliches/zeitliches Subsetting
  scaling?: WcsScaling;            // Skalierung (size/extent/factor)
  rangeSubset?: string[];          // Band-Auswahl
  outputCrs?: string;              // Ziel-CRS (z.B. 'EPSG:4326')
  subsettingCrs?: string;          // CRS für Subsetting
  interpolation?: string;          // Interpolationsmethode
  mediaType?: Record<string, string>; // Zusätzliche Parameter
}
```

**WcsSubset:**
```typescript
{
  axis: string;                    // Achsenname (z.B. 'Lat', 'Long', 'time')
  min?: string | number;           // Untere Grenze
  max?: string | number;           // Obere Grenze
  value?: string | number;         // Einzelner Wert (Point Subsetting)
}
```

**WcsScaling:**
```typescript
{
  type: 'size' | 'extent' | 'factor';
  value: number | number[];        // Skalierungswert(e)
}
```

**Helper-Funktionen:**
```typescript
buildWcsGetCoverageUrl(baseUrl: string, options: WcsGetCoverageOptions, version?: WcsVersion): string
buildWcsGetCoverageXml(options: WcsGetCoverageOptions, version?: WcsVersion): string
```

**Unterstützte Features:**
- ✅ WCS 2.0.1, 2.0.0, 1.1.0, 1.0.0 Unterstützung
- ✅ GET Request URLs mit Query-Parametern
- ✅ POST Request XML (nur WCS 2.0)
- ✅ Räumliches Subsetting (Bounding Box)
- ✅ Zeitliches Subsetting (ISO 8601 Timestamps)
- ✅ Höhen-Subsetting (Elevation)
- ✅ Range Subsetting (Band-Auswahl)
- ✅ Skalierung (Size, Extent, Factor)
- ✅ CRS-Transformation
- ✅ Interpolationsmethoden
- ✅ XML Escaping für sichere Ausgabe

### `WcsCapabilitiesParser`

Parst WCS GetCapabilities Responses für verschiedene WCS-Versionen:

| Methode         | Beschreibung                                    | Rückgabe              |
| --------------- | ----------------------------------------------- | --------------------- |
| `parse(xml)`    | Parst WCS GetCapabilities XML Response          | `WcsCapabilities`     |

**Constructor:**
```typescript
new WcsCapabilitiesParser()
```

**WcsCapabilities:**
```typescript
{
  version: WcsVersion;                        // WCS Version
  updateSequence?: string;                    // Update Sequenz
  serviceIdentification?: WcsServiceIdentification;
  serviceProvider?: WcsServiceProvider;
  operations?: WcsOperationMetadata[];        // Verfügbare Operationen
  coverages: WcsCoverageSummary[];            // Verfügbare Coverages
  formats?: string[];                         // Unterstützte Formate
  crs?: string[];                             // Unterstützte CRS
}
```

**WcsCoverageSummary:**
```typescript
{
  coverageId: string;                         // Coverage ID
  coverageSubtype?: string;                   // Coverage-Typ (z.B. RectifiedGridCoverage)
  title?: string;                             // Titel
  abstract?: string;                          // Beschreibung
  keywords?: string[];                        // Schlagwörter
  boundingBox?: {                             // Bounding Box
    crs?: string;
    lowerCorner: number[];
    upperCorner: number[];
  };
  wgs84BoundingBox?: {                        // WGS84 Bounding Box
    lowerCorner: number[];
    upperCorner: number[];
  };
}
```

**WcsServiceIdentification:**
```typescript
{
  title?: string;                             // Service-Titel
  abstract?: string;                          // Service-Beschreibung
  keywords?: string[];                        // Schlagwörter
  serviceType?: string;                       // Service-Typ
  serviceTypeVersion?: string[];              // Unterstützte Versionen
  fees?: string;                              // Gebühren
  accessConstraints?: string[];               // Zugriffsbeschränkungen
}
```

**WcsOperationMetadata:**
```typescript
{
  name: string;                               // Operations-Name
  getUrl?: string;                            // GET Endpoint
  postUrl?: string;                           // POST Endpoint
}
```

**Helper-Funktion:**
```typescript
parseWcsCapabilities(xml: string): WcsCapabilities
```

**Unterstützte Features:**
- ✅ WCS 2.0.1, 2.0.0, 1.1.x, 1.0.0 Unterstützung
- ✅ Service Identification und Provider Informationen
- ✅ Operations Metadata (GetCapabilities, DescribeCoverage, GetCoverage)
- ✅ Coverage Summaries mit Bounding Boxes
- ✅ Unterstützte Formate und CRS Listen
- ✅ Automatische Versionserkennung

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
