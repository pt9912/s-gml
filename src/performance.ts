/**
 * Performance Utilities
 *
 * Provides utilities for optimizing GML parsing performance,
 * including object pooling, caching, and batch processing.
 */

/**
 * String interning cache for commonly used strings
 * Reduces memory usage by reusing string instances
 */
class StringCache {
    private cache: Map<string, string> = new Map();
    private maxSize: number;

    constructor(maxSize: number = 10000) {
        this.maxSize = maxSize;
    }

    intern(str: string): string {
        if (!str) return str;

        const cached = this.cache.get(str);
        if (cached) return cached;

        // Add to cache
        if (this.cache.size >= this.maxSize) {
            // Simple FIFO eviction
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(str, str);
        return str;
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

/**
 * Object pool for coordinate arrays
 * Reduces GC pressure by reusing arrays
 */
class CoordinateArrayPool {
    private pool: number[][][] = [];
    private maxPoolSize: number;

    constructor(maxPoolSize: number = 1000) {
        this.maxPoolSize = maxPoolSize;
    }

    acquire(): number[][] {
        if (this.pool.length > 0) {
            const array = this.pool.pop()!;
            array.length = 0; // Clear the array
            return array;
        }
        return [];
    }

    release(array: number[][]): void {
        if (this.pool.length < this.maxPoolSize) {
            array.length = 0; // Clear the array
            this.pool.push(array);
        }
    }

    clear(): void {
        this.pool = [];
    }

    size(): number {
        return this.pool.length;
    }
}

/**
 * Batch processor for processing multiple features efficiently
 */
export class BatchProcessor<T, R> {
    private batchSize: number;
    private batch: T[] = [];
    private processor: (batch: T[]) => R[] | Promise<R[]>;
    private results: R[] = [];

    constructor(batchSize: number, processor: (batch: T[]) => R[] | Promise<R[]>) {
        this.batchSize = batchSize;
        this.processor = processor;
    }

    add(item: T): void {
        this.batch.push(item);
    }

    async flush(): Promise<void> {
        while (this.batch.length > 0) {
            const batchToProcess = this.batch.splice(0, this.batchSize);
            const result = await this.processor(batchToProcess);
            this.results.push(...result);
        }
    }

    async getResults(): Promise<R[]> {
        await this.flush();
        return this.results;
    }
}

/**
 * Performance monitor for tracking parsing metrics
 */
export class PerformanceMonitor {
    private startTime: number = 0;
    private endTime: number = 0;
    private featureCount: number = 0;
    private bytesParsed: number = 0;
    private metrics: Map<string, number> = new Map();

    start(): void {
        this.startTime = performance.now();
    }

    stop(): void {
        this.endTime = performance.now();
    }

    addFeature(bytes: number = 0): void {
        this.featureCount++;
        this.bytesParsed += bytes;
    }

    addMetric(name: string, value: number): void {
        this.metrics.set(name, (this.metrics.get(name) || 0) + value);
    }

    getDuration(): number {
        return this.endTime - this.startTime;
    }

    getFeaturesPerSecond(): number {
        const duration = this.getDuration() / 1000; // Convert to seconds
        return duration > 0 ? this.featureCount / duration : 0;
    }

    getBytesPerSecond(): number {
        const duration = this.getDuration() / 1000; // Convert to seconds
        return duration > 0 ? this.bytesParsed / duration : 0;
    }

    getMetric(name: string): number | undefined {
        return this.metrics.get(name);
    }

    getReport(): PerformanceReport {
        return {
            duration: this.getDuration(),
            featureCount: this.featureCount,
            bytesParsed: this.bytesParsed,
            featuresPerSecond: this.getFeaturesPerSecond(),
            bytesPerSecond: this.getBytesPerSecond(),
            metrics: Object.fromEntries(this.metrics),
        };
    }

    reset(): void {
        this.startTime = 0;
        this.endTime = 0;
        this.featureCount = 0;
        this.bytesParsed = 0;
        this.metrics.clear();
    }
}

export interface PerformanceReport {
    duration: number;
    featureCount: number;
    bytesParsed: number;
    featuresPerSecond: number;
    bytesPerSecond: number;
    metrics: Record<string, number>;
}

/**
 * Global string cache instance
 */
export const stringCache = new StringCache();

/**
 * Global coordinate array pool instance
 */
export const coordinatePool = new CoordinateArrayPool();

/**
 * Optimize coordinate parsing for better performance
 */
export function parseCoordinatesOptimized(
    text: string,
    separator: string = ' ',
    tupleSize: number = 2
): number[][] {
    const pool = coordinatePool.acquire();
    const numbers = text.trim().split(separator);

    for (let i = 0; i < numbers.length; i += tupleSize) {
        const tuple: number[] = [];
        for (let j = 0; j < tupleSize && i + j < numbers.length; j++) {
            tuple.push(parseFloat(numbers[i + j]));
        }
        pool.push(tuple);
    }

    return pool;
}

/**
 * Release coordinate array back to pool
 */
export function releaseCoordinates(coordinates: number[][]): void {
    coordinatePool.release(coordinates);
}

/**
 * Intern a string to reduce memory usage
 */
export function internString(str: string): string {
    return stringCache.intern(str);
}

/**
 * Batch process an array of items
 */
export async function processBatch<T, R>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => R[] | Promise<R[]>
): Promise<R[]> {
    const batchProcessor = new BatchProcessor(batchSize, processor);

    for (const item of items) {
        batchProcessor.add(item);
    }

    return batchProcessor.getResults();
}

/**
 * Clear all caches and pools
 */
export function clearPerformanceCaches(): void {
    stringCache.clear();
    coordinatePool.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
    stringCacheSize: number;
    coordinatePoolSize: number;
} {
    return {
        stringCacheSize: stringCache.size(),
        coordinatePoolSize: coordinatePool.size(),
    };
}
