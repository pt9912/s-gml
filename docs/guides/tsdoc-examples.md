# TSDoc-Kommentare: Beispiele und Best Practices

Diese Datei enthält TSDoc-Kommentare für die wichtigsten öffentlichen Klassen und Methoden von **s-gml**.

## GmlParser - Kern-Parser-Klasse

```typescript
/**
 * Haupt-Parser-Klasse für GML-Dokumente (Geography Markup Language).
 *
 * Diese Klasse parsed GML 2.1.2, 3.0, 3.1, 3.2 und 3.3 Dokumente und konvertiert
 * sie in verschiedene Output-Formate mittels dem Builder-Pattern.
 *
 * @example
 * ```typescript
 * // Standard GeoJSON Output
 * const parser = new GmlParser();
 * const geojson = await parser.parse(gmlXml);
 *
 * // Shapefile Output
 * const shpParser = new GmlParser('shapefile');
 * const featureCollection = await shpParser.parse(gmlXml);
 * const zip = await new ShapefileBuilder().toZip(featureCollection);
 *
 * // Custom Builder
 * const customParser = new GmlParser(new MyCustomBuilder());
 * const customOutput = await customParser.parse(gmlXml);
 * ```
 *
 * @public
 * @category Parser
 */
export class GmlParser {
    /**
     * Builder-Instanz zur Transformation von GML in das Zielformat.
     * @private
     */
    private builder: Builder;

    /**
     * Erstellt eine neue GmlParser-Instanz.
     *
     * @param targetFormat - Output-Format oder custom Builder-Instanz.
     *                       Unterstützte Formate: 'geojson', 'shapefile', 'geopackage',
     *                       'flatgeobuf', 'csv', 'kml', 'wkt', 'cis-json', 'coveragejson'
     *
     * @example
     * ```typescript
     * // GeoJSON (Standard)
     * const parser1 = new GmlParser();
     * const parser2 = new GmlParser('geojson');
     *
     * // Andere Formate
     * const csvParser = new GmlParser('csv');
     * const kmlParser = new GmlParser('kml');
     *
     * // Custom Builder
     * const customParser = new GmlParser(new MyBuilder());
     * ```
     *
     * @public
     */
    constructor(targetFormat: string | Builder = 'geojson') {
        this.builder = typeof targetFormat === 'string' ? getBuilder(targetFormat) : targetFormat;
    }

    /**
     * Parsed ein GML-Dokument und konvertiert es in das konfigurierte Zielformat.
     *
     * Unterstützt alle GML-Geometrien (Point, LineString, Polygon, Multi*, Curve, Surface, etc.),
     * Features, FeatureCollections und Coverages (RectifiedGrid, Grid, ReferenceableGrid, MultiPoint).
     *
     * @param xml - GML XML-String zum Parsen
     * @returns Promise mit Geometry, Feature oder FeatureCollection im konfigurierten Zielformat
     *
     * @throws {OwsExceptionError} - Bei WFS/WCS Exception Reports
     * @throws {Error} - Bei ungültigem oder nicht unterstütztem GML
     *
     * @example
     * ```typescript
     * const parser = new GmlParser();
     *
     * // Point parsen
     * const point = await parser.parse(`
     *   <gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
     *     <gml:pos>10.0 20.0</gml:pos>
     *   </gml:Point>
     * `);
     * // { type: 'Point', coordinates: [10, 20] }
     *
     * // FeatureCollection parsen
     * const fc = await parser.parse(wfsResponse);
     * // { type: 'FeatureCollection', features: [...] }
     *
     * // Coverage parsen
     * const coverage = await parser.parse(wcsCoverageXml);
     * // { type: 'Feature', properties: { coverageType: 'RectifiedGridCoverage', ... } }
     * ```
     *
     * @public
     */
    async parse(xml: string): Promise<Geometry | Feature | FeatureCollection> {
        const doc = await parseXml(xml);
        const version = detectGmlVersion(doc);
        const gmlObject = this.parseGml(doc, version);
        return this.toGeoJson(gmlObject);
    }

    /**
     * Lädt und parsed ein GML-Dokument von einer URL.
     *
     * Nützlich für das direkte Laden von WFS GetFeature oder WCS GetCoverage Responses.
     *
     * @param url - URL zum GML-Dokument (z.B. WFS GetFeature Request)
     * @returns Promise mit Geometry, Feature oder FeatureCollection
     *
     * @throws {Error} - Bei HTTP-Fehlern (404, 500, etc.)
     * @throws {OwsExceptionError} - Bei WFS/WCS Exception Reports
     *
     * @example
     * ```typescript
     * const parser = new GmlParser();
     *
     * // WFS GetFeature laden
     * const features = await parser.parseFromUrl(
     *   'https://example.com/wfs?service=WFS&request=GetFeature&typeName=water_areas'
     * );
     *
     * // WCS GetCoverage laden
     * const coverage = await parser.parseFromUrl(
     *   'https://example.com/wcs?service=WCS&request=GetCoverage&coverageId=DEM'
     * );
     * ```
     *
     * @public
     */
    async parseFromUrl(url: string): Promise<Geometry | Feature | FeatureCollection> {
        const xml = await this.fetchXml(url);
        return this.parse(xml);
    }

    /**
     * Konvertiert ein GML-Dokument zwischen verschiedenen GML-Versionen.
     *
     * Unterstützt Konvertierung zwischen GML 2.1.2 und 3.2.
     *
     * @param xml - GML XML-String zum Konvertieren
     * @param options - Konvertierungs-Optionen
     * @returns Promise mit konvertiertem GML XML-String
     *
     * @throws {Error} - Bei nicht unterstützten Versionen oder ungültigem GML
     *
     * @example
     * ```typescript
     * const parser = new GmlParser();
     *
     * // GML 3.2 → 2.1.2 konvertieren
     * const gml32 = `<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2">
     *   <gml:pos>10 20</gml:pos>
     * </gml:Point>`;
     *
     * const gml212 = await parser.convert(gml32, {
     *   outputVersion: '2.1.2',
     *   prettyPrint: true
     * });
     * // <gml:Point xmlns:gml="http://www.opengis.net/gml">
     * //   <gml:coordinates>10,20</gml:coordinates>
     * // </gml:Point>
     * ```
     *
     * @public
     */
    async convert(xml: string, options: GmlConvertOptions): Promise<string> {
        const { outputVersion, prettyPrint = false } = options;
        const doc = await parseXml(xml);
        const inputVersion = options.inputVersion || detectGmlVersion(doc);
        const gmlObject = this.parseGml(doc, inputVersion);
        return generateGml(gmlObject, outputVersion, prettyPrint);
    }

    /**
     * Lädt ein GML-Dokument von einer URL und konvertiert es zu einer anderen Version.
     *
     * @param url - URL zum GML-Dokument
     * @param options - Konvertierungs-Optionen
     * @returns Promise mit konvertiertem GML XML-String
     *
     * @throws {Error} - Bei HTTP-Fehlern oder Konvertierungs-Fehlern
     *
     * @example
     * ```typescript
     * const parser = new GmlParser();
     *
     * const gml212 = await parser.convertFromUrl(
     *   'https://example.com/data.gml',
     *   { outputVersion: '2.1.2', prettyPrint: true }
     * );
     * ```
     *
     * @public
     */
    async convertFromUrl(url: string, options: GmlConvertOptions): Promise<string> {
        const xml = await this.fetchXml(url);
        return this.convert(xml, options);
    }

    /**
     * Konvertiert ein bereits geparsten GML-Objekt zurück zu GML XML.
     *
     * Nützlich für Round-Trip-Konvertierungen oder Modifikationen von GML-Daten.
     *
     * @param gmlObject - Geparste GML-Geometrie, Feature oder FeatureCollection
     * @param options - Output-Optionen (Version, Formatierung)
     * @returns Promise mit GML XML-String
     *
     * @example
     * ```typescript
     * const parser = new GmlParser();
     *
     * // GML parsen
     * const gmlObject = parser.parseGml(doc, '3.2');
     *
     * // Zurück zu XML konvertieren
     * const xml = await parser.convertGeometry(gmlObject, {
     *   outputVersion: '2.1.2',
     *   prettyPrint: true
     * });
     * ```
     *
     * @public
     */
    async convertGeometry(
        gmlObject: GmlGeometry | GmlFeature | GmlFeatureCollection,
        options: Pick<GmlConvertOptions, 'outputVersion' | 'prettyPrint'>
    ): Promise<string> {
        return generateGml(gmlObject, options.outputVersion, options.prettyPrint);
    }
}
```

## StreamingGmlParser - Streaming für große Dateien

```typescript
/**
 * Event-basierter Streaming-Parser für große GML-Dokumente.
 *
 * Ideal für Multi-GB Dateien und WFS-Responses mit Tausenden von Features.
 * Verarbeitet Features in Batches um konstanten Speicherverbrauch zu gewährleisten.
 *
 * @example
 * ```typescript
 * const parser = new StreamingGmlParser({
 *   batchSize: 100,
 *   maxBufferSize: 10485760 // 10MB
 * });
 *
 * parser.on('feature', (feature) => {
 *   console.log('Feature parsed:', feature.id);
 *   // Verarbeite Feature (z.B. DB-Insert)
 * });
 *
 * parser.on('error', (error) => {
 *   console.error('Parse error:', error);
 * });
 *
 * parser.on('end', () => {
 *   console.log('Parsing complete');
 * });
 *
 * await parser.parseFromUrl('https://example.com/large-wfs-response.xml');
 * ```
 *
 * @public
 * @category Parser
 */
export class StreamingGmlParser {
    /**
     * Erstellt eine neue StreamingGmlParser-Instanz.
     *
     * @param options - Parser-Optionen
     * @param options.batchSize - Anzahl Features pro Batch (Standard: 100)
     * @param options.maxBufferSize - Maximale Buffer-Größe in Bytes (Standard: 10MB)
     *
     * @public
     */
    constructor(options?: StreamingParserOptions) {
        // ...
    }

    /**
     * Parsed GML von einem ReadableStream.
     *
     * @param stream - ReadableStream mit GML-Daten
     * @returns Promise mit Anzahl der geparsten Features
     *
     * @fires feature - Wird für jedes geparste Feature emitted
     * @fires error - Wird bei Parsing-Fehlern emitted
     * @fires end - Wird nach Abschluss des Parsings emitted
     *
     * @public
     */
    async parseStream(stream: ReadableStream): Promise<number> {
        // ...
    }

    /**
     * Parsed GML von einer Datei.
     *
     * @param filePath - Pfad zur GML-Datei
     * @returns Promise mit Anzahl der geparsten Features
     *
     * @public
     */
    async parseFile(filePath: string): Promise<number> {
        // ...
    }

    /**
     * Parsed GML von einer URL mit Streaming.
     *
     * @param url - URL zum GML-Dokument
     * @returns Promise mit Anzahl der geparsten Features
     *
     * @public
     */
    async parseFromUrl(url: string): Promise<number> {
        // ...
    }

    /**
     * Registriert einen Event-Handler.
     *
     * @param event - Event-Name ('feature', 'error', 'end')
     * @param callback - Callback-Funktion
     *
     * @public
     */
    on(event: 'feature' | 'error' | 'end', callback: Function): void {
        // ...
    }

    /**
     * Gibt die Anzahl der bisher geparsten Features zurück.
     *
     * @returns Anzahl der geparsten Features
     *
     * @public
     */
    getFeatureCount(): number {
        return this.featureCount;
    }
}
```

## Builder Interface - Output-Format-Definition

```typescript
/**
 * Builder-Interface für die Transformation von GML zu verschiedenen Output-Formaten.
 *
 * Implementierungen dieses Interfaces können als `targetFormat` an den GmlParser
 * übergeben werden um custom Output-Formate zu erstellen.
 *
 * @typeParam TGeometry - Typ für Geometrie-Output (z.B. GeoJSON Geometry, WKT String)
 * @typeParam TFeature - Typ für Feature-Output (z.B. GeoJSON Feature, CSV Row)
 * @typeParam TFeatureCollection - Typ für FeatureCollection-Output
 *
 * @example
 * ```typescript
 * class MyCustomBuilder implements Builder<string, string, string> {
 *   buildPoint(gml: GmlPoint): string {
 *     return `POINT(${gml.coordinates.join(' ')})`;
 *   }
 *
 *   buildFeature(gml: GmlFeature): string {
 *     return `Feature ID: ${gml.id}`;
 *   }
 *
 *   buildFeatureCollection(gml: GmlFeatureCollection): string {
 *     return `Collection with ${gml.features.length} features`;
 *   }
 *
 *   // ... alle weiteren Methoden implementieren
 * }
 *
 * const parser = new GmlParser(new MyCustomBuilder());
 * const output = await parser.parse(gmlXml); // String output
 * ```
 *
 * @public
 * @category Builder
 * @interface
 */
export interface Builder<
    TGeometry = Geometry,
    TFeature = Feature,
    TFeatureCollection = FeatureCollection
> {
    /**
     * Baut ein Point-Objekt aus einem GmlPoint.
     *
     * @param gml - GmlPoint zum Konvertieren
     * @returns Point im Zielformat
     */
    buildPoint(gml: GmlPoint): TGeometry;

    /**
     * Baut ein LineString-Objekt aus einem GmlLineString.
     *
     * @param gml - GmlLineString zum Konvertieren
     * @returns LineString im Zielformat
     */
    buildLineString(gml: GmlLineString): TGeometry;

    /**
     * Baut ein Polygon-Objekt aus einem GmlPolygon.
     *
     * @param gml - GmlPolygon zum Konvertieren
     * @returns Polygon im Zielformat
     */
    buildPolygon(gml: GmlPolygon): TGeometry;

    // ... weitere Geometrie-Methoden

    /**
     * Baut ein Feature-Objekt aus einem GmlFeature.
     *
     * @param gml - GmlFeature zum Konvertieren (inkl. Geometrie und Properties)
     * @returns Feature im Zielformat
     */
    buildFeature(gml: GmlFeature): TFeature;

    /**
     * Baut eine FeatureCollection aus einer GmlFeatureCollection.
     *
     * @param gml - GmlFeatureCollection zum Konvertieren
     * @returns FeatureCollection im Zielformat
     */
    buildFeatureCollection(gml: GmlFeatureCollection): TFeatureCollection;
}
```

## Performance-Klassen

```typescript
/**
 * Performance-Monitor für Tracking von Parsing-Performance.
 *
 * Trackt Durchsatz (Features/Sekunde), Speicherverbrauch und custom Metriken.
 *
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitor();
 * monitor.start();
 *
 * for (const feature of features) {
 *   await parser.parse(feature);
 *   monitor.addFeature(feature.length);
 * }
 *
 * monitor.stop();
 * const report = monitor.getReport();
 *
 * console.log(`Duration: ${report.duration}ms`);
 * console.log(`Throughput: ${report.featuresPerSecond.toFixed(2)} features/sec`);
 * console.log(`Bandwidth: ${(report.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/sec`);
 * ```
 *
 * @public
 * @category Performance
 */
export class PerformanceMonitor {
    /**
     * Startet das Performance-Monitoring.
     *
     * @public
     */
    start(): void {
        this.startTime = Date.now();
    }

    /**
     * Stoppt das Performance-Monitoring.
     *
     * @public
     */
    stop(): void {
        this.endTime = Date.now();
    }

    /**
     * Fügt ein verarbeitetes Feature zum Tracking hinzu.
     *
     * @param bytes - Größe des Features in Bytes (optional)
     *
     * @public
     */
    addFeature(bytes?: number): void {
        this.featureCount++;
        if (bytes) this.totalBytes += bytes;
    }

    /**
     * Fügt eine custom Metrik hinzu.
     *
     * @param name - Metrik-Name (z.B. 'dbWrites', 'cacheHits')
     * @param value - Metrik-Wert
     *
     * @public
     */
    addMetric(name: string, value: number): void {
        this.metrics.set(name, value);
    }

    /**
     * Gibt den Wert einer custom Metrik zurück.
     *
     * @param name - Metrik-Name
     * @returns Metrik-Wert oder undefined
     *
     * @public
     */
    getMetric(name: string): number | undefined {
        return this.metrics.get(name);
    }

    /**
     * Generiert einen Performance-Report.
     *
     * @returns Performance-Report mit Durchsatz, Duration, etc.
     *
     * @public
     */
    getReport(): PerformanceReport {
        const duration = this.endTime - this.startTime;
        return {
            duration,
            featureCount: this.featureCount,
            totalBytes: this.totalBytes,
            featuresPerSecond: (this.featureCount / duration) * 1000,
            bytesPerSecond: (this.totalBytes / duration) * 1000,
            customMetrics: Object.fromEntries(this.metrics)
        };
    }
}

/**
 * Batch-Processor für effiziente Verarbeitung großer Feature-Listen.
 *
 * Gruppiert Features in Batches und verarbeitet diese mit einer Processor-Funktion.
 * Ideal für DB-Bulk-Inserts oder Batch-Transformationen.
 *
 * @typeParam T - Input-Typ (z.B. Feature)
 * @typeParam R - Output-Typ (z.B. DB-Result)
 *
 * @example
 * ```typescript
 * const processor = new BatchProcessor<Feature, DbResult>(
 *   100, // Batch-Größe
 *   async (batch) => {
 *     // Bulk-Insert in Datenbank
 *     return await database.insertMany(batch);
 *   }
 * );
 *
 * features.forEach(feature => processor.add(feature));
 * const results = await processor.getResults();
 * console.log(`Inserted ${results.length} features`);
 * ```
 *
 * @public
 * @category Performance
 */
export class BatchProcessor<T, R> {
    /**
     * Erstellt einen neuen BatchProcessor.
     *
     * @param batchSize - Anzahl Items pro Batch
     * @param processor - Async Funktion zur Batch-Verarbeitung
     *
     * @public
     */
    constructor(batchSize: number, processor: (batch: T[]) => Promise<R>) {
        this.batchSize = batchSize;
        this.processor = processor;
    }

    /**
     * Fügt ein Item zum Batch-Prozessor hinzu.
     *
     * @param item - Item zum Hinzufügen
     *
     * @public
     */
    add(item: T): void {
        // ...
    }

    /**
     * Verarbeitet alle Batches und gibt die Ergebnisse zurück.
     *
     * @returns Promise mit Array aller Batch-Ergebnisse
     *
     * @public
     */
    async getResults(): Promise<R[]> {
        // ...
    }
}
```

## WCS-Klassen

```typescript
/**
 * WCS Request Builder für GetCoverage-Anfragen.
 *
 * Generiert WCS GetCoverage URLs (GET) und XML (POST) für verschiedene WCS-Versionen.
 * Unterstützt Subsetting, Scaling, Range Subsetting und CRS-Transformation.
 *
 * @example
 * ```typescript
 * const builder = new WcsRequestBuilder('https://example.com/wcs', '2.0.1');
 *
 * // GET Request URL
 * const url = builder.buildGetCoverageUrl({
 *   coverageId: 'LANDSAT8',
 *   format: 'image/tiff',
 *   subset: [
 *     { axis: 'Lat', min: -34, max: -33 },
 *     { axis: 'Long', min: 18, max: 19 }
 *   ],
 *   rangeSubset: ['B4', 'B3', 'B2'], // RGB Bänder
 *   scaling: { type: 'size', value: [1024, 1024] }
 * });
 *
 * // POST Request XML
 * const xml = builder.buildGetCoverageXml({
 *   coverageId: 'LANDSAT8',
 *   format: 'image/tiff',
 *   subset: [{ axis: 'time', value: '2024-01-01T10:00:00Z' }]
 * });
 * ```
 *
 * @public
 * @category WCS
 */
export class WcsRequestBuilder {
    /**
     * Erstellt einen neuen WcsRequestBuilder.
     *
     * @param baseUrl - WCS Server Base-URL
     * @param version - WCS Version ('2.0.1', '2.0.0', '1.1.0', '1.0.0')
     *
     * @public
     */
    constructor(baseUrl: string, version: WcsVersion = '2.0.1') {
        this.baseUrl = baseUrl;
        this.version = version;
    }

    /**
     * Baut eine GetCoverage GET Request URL.
     *
     * @param options - GetCoverage Optionen
     * @returns WCS GetCoverage URL mit Query-Parametern
     *
     * @public
     */
    buildGetCoverageUrl(options: WcsGetCoverageOptions): string {
        // ...
    }

    /**
     * Baut eine GetCoverage POST Request XML (nur WCS 2.0).
     *
     * @param options - GetCoverage Optionen
     * @returns WCS GetCoverage XML für POST Request
     *
     * @throws {Error} - Bei nicht unterstützten Versionen (< 2.0)
     *
     * @public
     */
    buildGetCoverageXml(options: WcsGetCoverageOptions): string {
        // ...
    }
}

/**
 * WCS Capabilities Parser für GetCapabilities-Responses.
 *
 * Parsed WCS GetCapabilities XML und extrahiert Service-Informationen,
 * verfügbare Coverages, Formate und unterstützte CRS.
 *
 * @example
 * ```typescript
 * const parser = new WcsCapabilitiesParser();
 * const capabilities = parser.parse(capabilitiesXml);
 *
 * console.log(capabilities.version); // '2.0.1'
 * console.log(capabilities.serviceIdentification?.title);
 * console.log(capabilities.coverages.length);
 *
 * capabilities.coverages.forEach(coverage => {
 *   console.log(`${coverage.coverageId}: ${coverage.title}`);
 * });
 * ```
 *
 * @public
 * @category WCS
 */
export class WcsCapabilitiesParser {
    /**
     * Parsed eine WCS GetCapabilities Response.
     *
     * @param xml - GetCapabilities XML-String
     * @returns WcsCapabilities Objekt mit allen Service-Informationen
     *
     * @throws {Error} - Bei ungültigem XML oder nicht unterstützten Versionen
     *
     * @public
     */
    parse(xml: string): WcsCapabilities {
        // ...
    }
}
```

## Best Practices für TSDoc-Kommentare

### 1. **Öffentliche API vollständig dokumentieren**
   - Alle `export`-Klassen, Interfaces, Functions, Types
   - Parameter mit `@param` beschreiben (inkl. Typ und Bedeutung)
   - Rückgabewerte mit `@returns` erklären
   - Exceptions mit `@throws` dokumentieren

### 2. **Code-Beispiele hinzufügen**
   ```typescript
   /**
    * @example
    * ```typescript
    * const parser = new GmlParser('csv');
    * const csv = await parser.parse(gmlXml);
    * ```
    */
   ```

### 3. **Kategorien verwenden**
   ```typescript
   /**
    * @category Parser
    * @public
    */
   export class GmlParser { }

   /**
    * @category Builder
    * @public
    */
   export class GeoJsonBuilder { }
   ```

### 4. **Deprecations markieren**
   ```typescript
   /**
    * @deprecated Use {@link StreamingGmlParser} for large files instead
    * @public
    */
   export function parseLargeGml(xml: string) { }
   ```

### 5. **Links zu verwandten Typen**
   ```typescript
   /**
    * @see {@link GmlParser} - Haupt-Parser-Klasse
    * @see {@link StreamingGmlParser} - Für große Dateien
    */
   ```

### 6. **Events dokumentieren**
   ```typescript
   /**
    * @fires feature - Emitted für jedes geparste Feature
    * @fires error - Emitted bei Parsing-Fehlern
    */
   ```

### 7. **Type Parameters erklären**
   ```typescript
   /**
    * @typeParam T - Input type
    * @typeParam R - Output type after transformation
    */
   export class BatchProcessor<T, R> { }
   ```

## Implementierung

Um diese TSDoc-Kommentare zum Projekt hinzuzufügen:

1. **parser.ts** - Kommentare für `GmlParser` hinzufügen
2. **streaming-parser.ts** - Kommentare für `StreamingGmlParser`
3. **types.ts** - Kommentare für `Builder` Interface und Type-Definitionen
4. **builders/\*.ts** - Kommentare für alle Builder-Klassen
5. **wcs/\*.ts** - Kommentare für WCS-Klassen
6. **performance.ts** - Kommentare für Performance-Klassen

Danach kann TypeDoc ausgeführt werden:
```bash
pnpm run docs:generate
```

Die generierte Dokumentation erscheint dann in `docs/api/`.
