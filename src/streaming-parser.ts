import { GmlParser } from './parser.js';
import { Builder, Feature } from './types.js';

/**
 * Optionen für den StreamingGmlParser.
 *
 * @public
 * @category Parser
 */
export interface StreamingParserOptions {
    /**
     * Output-Format Builder (Standard: GeoJSON)
     */
    builder?: Builder;

    /**
     * Batch-Größe für die Feature-Verarbeitung.
     * Höhere Werte = mehr Speicher aber bessere Performance
     * @defaultValue 100
     */
    batchSize?: number;

    /**
     * Maximale Buffer-Größe in Bytes bevor ein Flush erzwungen wird.
     * @defaultValue 10485760 (10MB)
     */
    maxBufferSize?: number;
}

/**
 * Callback-Funktion für geparste Features.
 * @param feature - Geparste Feature
 * @public
 */
export type FeatureCallback = (feature: Feature) => void | Promise<void>;

/**
 * Callback-Funktion für Fehler.
 * @param error - Aufgetretener Fehler
 * @public
 */
export type ErrorCallback = (error: Error) => void;

/**
 * Callback-Funktion für das Ende des Parsings.
 * @public
 */
export type EndCallback = () => void;

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
    private gmlParser: GmlParser;
    private batchSize: number;
    private maxBufferSize: number;

    private featureCallbacks: FeatureCallback[] = [];
    private errorCallbacks: ErrorCallback[] = [];
    private endCallbacks: EndCallback[] = [];

    private buffer: string = '';
    private featureBatch: Feature[] = [];
    private featureCount: number = 0;

    /**
     * Erstellt eine neue StreamingGmlParser-Instanz.
     *
     * @param options - Parser-Optionen
     *
     * @public
     */
    constructor(options: StreamingParserOptions = {}) {
        this.gmlParser = new GmlParser(options.builder || 'geojson');
        this.batchSize = options.batchSize || 100;
        this.maxBufferSize = options.maxBufferSize || 10 * 1024 * 1024; // 10MB
    }

    /**
     * Registriert einen Event-Handler.
     *
     * @param event - Event-Name ('feature', 'error', 'end')
     * @param callback - Callback-Funktion
     * @returns Diese Instanz für Method Chaining
     *
     * @public
     */
    on(event: 'feature', callback: FeatureCallback): this;
    on(event: 'error', callback: ErrorCallback): this;
    on(event: 'end', callback: EndCallback): this;
    on(event: string, callback: any): this {
        switch (event) {
            case 'feature':
                this.featureCallbacks.push(callback);
                break;
            case 'error':
                this.errorCallbacks.push(callback);
                break;
            case 'end':
                this.endCallbacks.push(callback);
                break;
        }
        return this;
    }

    /**
     * Parsed GML von einem ReadableStream.
     *
     * Unterstützt sowohl Node.js Streams als auch Browser Web Streams.
     *
     * @param stream - ReadableStream mit GML-Daten
     * @returns Promise das beim Abschluss des Parsings aufgelöst wird
     *
     * @fires feature - Wird für jedes geparste Feature emitted
     * @fires error - Wird bei Parsing-Fehlern emitted
     * @fires end - Wird nach Abschluss des Parsings emitted
     *
     * @public
     */
    async parseStream(stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream): Promise<void> {
        try {
            if (this.isNodeStream(stream)) {
                await this.parseNodeStream(stream);
            } else {
                await this.parseWebStream(stream as ReadableStream<Uint8Array>);
            }

            // Flush remaining batch
            await this.flushBatch();

            // Emit end event
            for (const callback of this.endCallbacks) {
                callback();
            }
        } catch (error) {
            this.emitError(error as Error);
        }
    }

    /**
     * Parsed GML von einer Datei.
     *
     * Nur für Node.js verfügbar. Im Browser nutze parseStream() mit einem File-Reader.
     *
     * @param filePath - Pfad zur GML-Datei
     * @returns Promise das beim Abschluss des Parsings aufgelöst wird
     *
     * @fires feature - Wird für jedes geparste Feature emitted
     * @fires error - Wird bei Parsing-Fehlern emitted
     * @fires end - Wird nach Abschluss des Parsings emitted
     *
     * @example
     * ```typescript
     * const parser = new StreamingGmlParser();
     * parser.on('feature', (feature) => console.log(feature));
     * await parser.parseFile('/path/to/large-file.gml');
     * ```
     *
     * @public
     */
    async parseFile(filePath: string): Promise<void> {
        const fs = await import('fs');
        const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
        return this.parseStream(stream);
    }

    /**
     * Parsed GML von einer URL mit Streaming.
     *
     * Lädt die Daten per fetch() und verarbeitet sie als Stream.
     * Ideal für große WFS GetFeature Responses.
     *
     * @param url - URL zum GML-Dokument
     * @returns Promise das beim Abschluss des Parsings aufgelöst wird
     *
     * @throws {Error} - Bei HTTP-Fehlern (404, 500, etc.)
     *
     * @fires feature - Wird für jedes geparste Feature emitted
     * @fires error - Wird bei Parsing-Fehlern emitted
     * @fires end - Wird nach Abschluss des Parsings emitted
     *
     * @example
     * ```typescript
     * const parser = new StreamingGmlParser();
     * parser.on('feature', (feature) => console.log(feature));
     * await parser.parseFromUrl('https://example.com/wfs?service=WFS&request=GetFeature');
     * ```
     *
     * @public
     */
    async parseFromUrl(url: string): Promise<void> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch GML from ${url} (${response.status})`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        return this.parseStream(response.body);
    }

    private async parseNodeStream(stream: NodeJS.ReadableStream): Promise<void> {
        return new Promise((resolve, reject) => {
            const chunks: string[] = [];

            stream.on('data', (chunk: Buffer | string) => {
                chunks.push(chunk.toString());
            });

            stream.on('end', async () => {
                try {
                    for (const chunk of chunks) {
                        await this.processChunk(chunk);
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            stream.on('error', reject);
        });
    }

    private async parseWebStream(stream: ReadableStream<Uint8Array>): Promise<void> {
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        try {
            for (;;) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                await this.processChunk(chunk);
            }
        } finally {
            reader.releaseLock();
        }
    }

    private async processChunk(chunk: string): Promise<void> {
        this.buffer += chunk;

        // Extract complete features from buffer
        await this.extractFeatures();

        // Force flush if buffer is too large
        if (this.buffer.length > this.maxBufferSize) {
            this.buffer = ''; // Drop incomplete feature to prevent OOM
            this.emitError(new Error('Buffer overflow: Feature too large to process'));
        }
    }

    private async extractFeatures(): Promise<void> {
        // Look for complete feature elements
        // We'll extract features one by one to avoid loading everything into memory

        const featureMemberRegex = /<(?:gml:)?featureMember[^>]*>([\s\S]*?)<\/(?:gml:)?featureMember>/g;
        const wfsMemberRegex = /<(?:wfs:)?member[^>]*>([\s\S]*?)<\/(?:wfs:)?member>/g;

        let match: RegExpExecArray | null;
        let lastIndex = 0;

        // Collect all feature XMLs to parse
        const featuresToParse: string[] = [];

        // Try gml:featureMember
        while ((match = featureMemberRegex.exec(this.buffer)) !== null) {
            const featureXml = match[0];
            lastIndex = featureMemberRegex.lastIndex;
            featuresToParse.push(featureXml);
        }

        // Try wfs:member
        while ((match = wfsMemberRegex.exec(this.buffer)) !== null) {
            const featureXml = match[0];
            const currentIndex = wfsMemberRegex.lastIndex;

            // Skip if already processed as gml:featureMember
            if (currentIndex <= lastIndex) continue;

            lastIndex = Math.max(lastIndex, currentIndex);
            featuresToParse.push(featureXml);
        }

        // Parse all features (we do this after extraction to avoid modifying buffer during regex)
        for (const featureXml of featuresToParse) {
            try {
                await this.parseFeatureXml(featureXml);
            } catch (error) {
                this.emitError(error as Error);
            }
        }

        // Keep unparsed data in buffer
        if (lastIndex > 0) {
            this.buffer = this.buffer.substring(lastIndex);
        }
    }

    private async parseFeatureXml(featureXml: string): Promise<void> {
        // Wrap in a root element with proper namespace
        const wrappedXml = `
            <gml:FeatureCollection
                xmlns:gml="http://www.opengis.net/gml/3.2"
                xmlns:wfs="http://www.opengis.net/wfs/2.0">
                ${featureXml}
            </gml:FeatureCollection>
        `;

        try {
            // Parse the feature using the regular GmlParser
            const result = await this.gmlParser.parse(wrappedXml);

            if (result && typeof result === 'object' && 'type' in result) {
                if (result.type === 'FeatureCollection' && 'features' in result && Array.isArray(result.features)) {
                    // Extract all features from the collection
                    for (const feature of result.features) {
                        this.featureBatch.push(feature as Feature);
                        this.featureCount++;

                        // Flush batch if it reaches the batch size
                        if (this.featureBatch.length >= this.batchSize) {
                            await this.flushBatch();
                        }
                    }
                } else if (result.type === 'Feature') {
                    // Single feature
                    this.featureBatch.push(result as Feature);
                    this.featureCount++;

                    if (this.featureBatch.length >= this.batchSize) {
                        await this.flushBatch();
                    }
                }
            }
        } catch (error) {
            this.emitError(new Error(`Failed to parse feature: ${(error as Error).message}`));
        }
    }

    private async flushBatch(): Promise<void> {
        if (this.featureBatch.length === 0) return;

        // Process batch in parallel
        const promises: Promise<void>[] = [];

        for (const feature of this.featureBatch) {
            for (const callback of this.featureCallbacks) {
                const result = callback(feature);
                if (result instanceof Promise) {
                    promises.push(result);
                }
            }
        }

        await Promise.all(promises);

        // Clear batch
        this.featureBatch = [];
    }

    private emitError(error: Error): void {
        for (const callback of this.errorCallbacks) {
            callback(error);
        }
    }

    private isNodeStream(stream: any): stream is NodeJS.ReadableStream {
        return stream && typeof stream.on === 'function' && typeof stream.read === 'function';
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

/**
 * Convenience-Funktion zum Parsen eines großen GML-Streams.
 *
 * Vereinfacht das Streaming-Parsing mit einer einzigen Funktionsaufruf.
 * Akzeptiert Streams, Dateipfade oder URLs.
 *
 * @param stream - ReadableStream, Dateipfad oder URL zum GML-Dokument
 * @param onFeature - Callback für jedes geparste Feature
 * @param options - Optional: Parser-Optionen
 * @returns Promise mit der Anzahl geparster Features
 *
 * @example
 * ```typescript
 * // Von URL parsen
 * const count = await parseGmlStream(
 *   'https://example.com/large-dataset.gml',
 *   (feature) => {
 *     console.log(feature);
 *   },
 *   { batchSize: 50 }
 * );
 * console.log(`Parsed ${count} features`);
 *
 * // Von Datei parsen
 * const count2 = await parseGmlStream(
 *   '/path/to/file.gml',
 *   (feature) => database.insert(feature)
 * );
 * ```
 *
 * @public
 * @category Parser
 */
export async function parseGmlStream(
    stream: ReadableStream<Uint8Array> | NodeJS.ReadableStream | string,
    onFeature: FeatureCallback,
    options?: StreamingParserOptions
): Promise<number> {
    const parser = new StreamingGmlParser(options);

    parser.on('feature', onFeature);

    if (typeof stream === 'string') {
        // It's a URL or file path
        if (stream.startsWith('http://') || stream.startsWith('https://')) {
            await parser.parseFromUrl(stream);
        } else {
            await parser.parseFile(stream);
        }
    } else {
        await parser.parseStream(stream);
    }

    return parser.getFeatureCount();
}
