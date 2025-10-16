import {
    PerformanceMonitor,
    BatchProcessor,
    processBatch,
    clearPerformanceCaches,
    getCacheStats,
    internString,
    parseCoordinatesOptimized,
    releaseCoordinates,
} from '../src/performance.js';

describe('Performance Utilities', () => {
    describe('PerformanceMonitor', () => {
        it('should track parsing duration', () => {
            const monitor = new PerformanceMonitor();

            monitor.start();
            // Simulate some work
            const start = Date.now();
            while (Date.now() - start < 10) {
                // Wait 10ms
            }
            monitor.stop();

            const duration = monitor.getDuration();
            expect(duration).toBeGreaterThan(0);
            expect(duration).toBeLessThan(1000); // Should be much less than 1 second
        });

        it('should track feature count', () => {
            const monitor = new PerformanceMonitor();

            monitor.start();
            monitor.addFeature(100);
            monitor.addFeature(200);
            monitor.addFeature(150);
            monitor.stop();

            const report = monitor.getReport();
            expect(report.featureCount).toBe(3);
            expect(report.bytesParsed).toBe(450);
        });

        it('should calculate features per second', () => {
            const monitor = new PerformanceMonitor();

            monitor.start();
            for (let i = 0; i < 100; i++) {
                monitor.addFeature();
            }
            monitor.stop();

            const fps = monitor.getFeaturesPerSecond();
            expect(fps).toBeGreaterThan(0);
        });

        it('should track custom metrics', () => {
            const monitor = new PerformanceMonitor();

            monitor.addMetric('parseTime', 100);
            monitor.addMetric('parseTime', 200);
            monitor.addMetric('buildTime', 50);

            expect(monitor.getMetric('parseTime')).toBe(300);
            expect(monitor.getMetric('buildTime')).toBe(50);
        });

        it('should generate performance report', () => {
            const monitor = new PerformanceMonitor();

            monitor.start();
            monitor.addFeature(1000);
            monitor.addFeature(2000);
            monitor.addMetric('test', 42);
            monitor.stop();

            const report = monitor.getReport();

            expect(report.featureCount).toBe(2);
            expect(report.bytesParsed).toBe(3000);
            expect(report.duration).toBeGreaterThan(0);
            expect(report.featuresPerSecond).toBeGreaterThan(0);
            expect(report.bytesPerSecond).toBeGreaterThan(0);
            expect(report.metrics.test).toBe(42);
        });

        it('should reset metrics', () => {
            const monitor = new PerformanceMonitor();

            monitor.start();
            monitor.addFeature(100);
            monitor.addMetric('test', 42);
            monitor.stop();

            monitor.reset();

            const report = monitor.getReport();
            expect(report.featureCount).toBe(0);
            expect(report.bytesParsed).toBe(0);
            expect(report.metrics.test).toBeUndefined();
        });
    });

    describe('BatchProcessor', () => {
        it('should process items in batches', async () => {
            const items = Array.from({ length: 25 }, (_, i) => i);
            const processor = new BatchProcessor<number, number>(
                10,
                (batch) => batch.map(x => x * 2)
            );

            items.forEach(item => processor.add(item));

            const results = await processor.getResults();

            expect(results.length).toBe(25);
            expect(results[0]).toBe(0);
            expect(results[24]).toBe(48);
        });

        it('should handle async processors', async () => {
            const items = Array.from({ length: 15 }, (_, i) => i);
            const processor = new BatchProcessor<number, string>(
                5,
                async (batch) => {
                    // Simulate async work
                    await new Promise(resolve => setTimeout(resolve, 1));
                    return batch.map(x => `item-${x}`);
                }
            );

            items.forEach(item => processor.add(item));

            const results = await processor.getResults();

            expect(results.length).toBe(15);
            expect(results[0]).toBe('item-0');
            expect(results[14]).toBe('item-14');
        });

        it('should flush remaining items', async () => {
            const items = Array.from({ length: 12 }, (_, i) => i);
            const processor = new BatchProcessor<number, number>(
                10,
                (batch) => batch.map(x => x * 2)
            );

            items.forEach(item => processor.add(item));

            const results = await processor.getResults();

            // Should process 10 + 2 items
            expect(results.length).toBe(12);
        });
    });

    describe('processBatch helper', () => {
        it('should batch process an array', async () => {
            const items = Array.from({ length: 30 }, (_, i) => i);

            const results = await processBatch(
                items,
                10,
                (batch) => batch.map(x => x * 3)
            );

            expect(results.length).toBe(30);
            expect(results[0]).toBe(0);
            expect(results[29]).toBe(87);
        });

        it('should handle async batch processors', async () => {
            const items = ['a', 'b', 'c', 'd', 'e'];

            const results = await processBatch(
                items,
                2,
                async (batch) => {
                    await new Promise(resolve => setTimeout(resolve, 1));
                    return batch.map(x => x.toUpperCase());
                }
            );

            expect(results).toEqual(['A', 'B', 'C', 'D', 'E']);
        });
    });

    describe('String Interning', () => {
        it('should intern strings', () => {
            const str1 = 'test-string';
            const str2 = 'test-string';

            const interned1 = internString(str1);
            const interned2 = internString(str2);

            // Should return same reference
            expect(interned1).toBe(interned2);
        });

        it('should handle empty strings', () => {
            const empty = '';
            const interned = internString(empty);

            expect(interned).toBe('');
        });
    });

    describe('Coordinate Parsing Optimization', () => {
        it('should parse coordinates efficiently', () => {
            const text = '10 20 30 40 50 60';

            const coords = parseCoordinatesOptimized(text, ' ', 2);

            expect(coords.length).toBe(3);
            expect(coords[0]).toEqual([10, 20]);
            expect(coords[1]).toEqual([30, 40]);
            expect(coords[2]).toEqual([50, 60]);
        });

        it('should handle 3D coordinates', () => {
            const text = '10 20 100 30 40 200';

            const coords = parseCoordinatesOptimized(text, ' ', 3);

            expect(coords.length).toBe(2);
            expect(coords[0]).toEqual([10, 20, 100]);
            expect(coords[1]).toEqual([30, 40, 200]);
        });

        it('should release coordinates back to pool', () => {
            const text = '10 20 30 40';
            const coords = parseCoordinatesOptimized(text, ' ', 2);

            const statsBefore = getCacheStats();
            releaseCoordinates(coords);
            const statsAfter = getCacheStats();

            expect(statsAfter.coordinatePoolSize).toBeGreaterThan(statsBefore.coordinatePoolSize);
        });
    });

    describe('Cache Management', () => {
        it('should clear all caches', () => {
            internString('test1');
            internString('test2');
            internString('test3');

            const text = '10 20 30 40';
            const coords = parseCoordinatesOptimized(text, ' ', 2);
            releaseCoordinates(coords);

            let stats = getCacheStats();
            expect(stats.stringCacheSize).toBeGreaterThan(0);
            expect(stats.coordinatePoolSize).toBeGreaterThan(0);

            clearPerformanceCaches();

            stats = getCacheStats();
            expect(stats.stringCacheSize).toBe(0);
            expect(stats.coordinatePoolSize).toBe(0);
        });

        it('should report cache statistics', () => {
            clearPerformanceCaches();

            internString('test1');
            internString('test2');

            const stats = getCacheStats();
            expect(stats.stringCacheSize).toBe(2);
        });
    });
});
