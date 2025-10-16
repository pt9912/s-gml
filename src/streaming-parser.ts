/**
 * Streaming GML Parser
 *
 * Parses large GML files in a streaming fashion without loading
 * the entire file into memory. Ideal for processing large WFS responses
 * or multi-GB GML datasets.
 *
 * Usage:
 * ```typescript
 * const parser = new StreamingGmlParser();
 *
 * parser.on('feature', (feature) => {
 *   console.log('Parsed feature:', feature);
 * });
 *
 * parser.on('end', () => {
 *   console.log('Parsing complete');
 * });
 *
 * await parser.parseStream(readableStream);
 * ```
 */

import { GmlParser } from './parser.js';
import { Builder, Feature } from './types.js';

export interface StreamingParserOptions {
    /**
     * Output format builder
     */
    builder?: Builder;

    /**
     * Batch size for processing features
     * Higher values = more memory but better performance
     * Default: 100
     */
    batchSize?: number;

    /**
     * Maximum buffer size in bytes before forcing a flush
     * Default: 10MB
     */
    maxBufferSize?: number;
}

export type FeatureCallback = (feature: Feature) => void | Promise<void>;
export type ErrorCallback = (error: Error) => void;
export type EndCallback = () => void;

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

    constructor(options: StreamingParserOptions = {}) {
        this.gmlParser = new GmlParser(options.builder || 'geojson');
        this.batchSize = options.batchSize || 100;
        this.maxBufferSize = options.maxBufferSize || 10 * 1024 * 1024; // 10MB
    }

    /**
     * Register a callback for each parsed feature
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
     * Parse a ReadableStream (Node.js or Browser)
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
     * Parse from a file path (Node.js only)
     */
    async parseFile(filePath: string): Promise<void> {
        const fs = await import('fs');
        const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
        return this.parseStream(stream);
    }

    /**
     * Parse from a URL
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
            while (true) {
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
     * Get the total number of features parsed
     */
    getFeatureCount(): number {
        return this.featureCount;
    }
}

/**
 * Convenience function to parse a large GML stream
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
