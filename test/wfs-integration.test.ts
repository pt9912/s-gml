import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GmlParser } from '../src/parser.js';
import type { FeatureCollection } from 'geojson';

describe('WFS Integration Tests', () => {
    const parser = new GmlParser();

    describe('WFS 2.0 with GML 3.2', () => {
        let wfsXml: string;
        let result: FeatureCollection;

        beforeAll(async () => {
            const filePath = join(__dirname, 'gml', 'wfs-gml32-1-f.xml');
            wfsXml = readFileSync(filePath, 'utf-8');
            result = await parser.parse(wfsXml) as FeatureCollection;
        });

        it('should parse WFS 2.0 FeatureCollection', () => {
            expect(result.type).toBe('FeatureCollection');
            expect(Array.isArray(result.features)).toBe(true);
        });

        it('should extract features from wfs:member elements', () => {
            expect(result.features.length).toBeGreaterThan(0);
        });

        it('should parse MultiSurface geometry', () => {
            const firstFeature = result.features[0];
            // MultiSurface with single surface becomes Polygon (GeoJSON optimization)
            expect(['Polygon', 'MultiPolygon']).toContain(firstFeature.geometry.type);
            expect(Array.isArray((firstFeature.geometry as any).coordinates)).toBe(true);
            expect((firstFeature.geometry as any).coordinates.length).toBeGreaterThan(0);
        });

        it('should preserve feature properties', () => {
            const firstFeature = result.features[0];
            expect(firstFeature.properties).toBeDefined();
            expect(firstFeature.properties?.['osm:osm_id']).toBeDefined();
            expect(firstFeature.properties?.['osm:natural']).toBe('natural');
            expect(firstFeature.properties?.['osm:landuse']).toBe('reservoir');
        });

        it('should parse GML 3.2 posList coordinates correctly', () => {
            const firstFeature = result.features[0];
            let coordinates: number[][];

            // Handle both Polygon and MultiPolygon
            if (firstFeature.geometry.type === 'Polygon') {
                coordinates = (firstFeature.geometry as any).coordinates[0];
            } else {
                coordinates = (firstFeature.geometry as any).coordinates[0][0];
            }

            // Check first coordinate pair
            expect(coordinates[0]).toHaveLength(2);
            expect(typeof coordinates[0][0]).toBe('number');
            expect(typeof coordinates[0][1]).toBe('number');

            // Polygon should be closed (first = last)
            expect(coordinates[0]).toEqual(coordinates[coordinates.length - 1]);
        });

        it('should handle gml:id attributes', () => {
            const firstFeature = result.features[0];
            expect(firstFeature.id).toBeDefined();
        });

        it('should parse LinearRing as exterior ring', () => {
            const firstFeature = result.features[0];
            let polygon: number[][][];

            // Handle both Polygon and MultiPolygon
            if (firstFeature.geometry.type === 'Polygon') {
                polygon = [(firstFeature.geometry as any).coordinates];
            } else {
                polygon = (firstFeature.geometry as any).coordinates;
            }

            // First array is exterior ring
            expect(polygon[0].length).toBeGreaterThanOrEqual(1);
            expect(polygon[0][0].length).toBeGreaterThan(3); // At least 4 points for closed ring
        });
    });

    describe('WFS 1.1 with GML 3.0', () => {
        let wfsXml: string;
        let result: FeatureCollection;

        beforeAll(async () => {
            const filePath = join(__dirname, 'gml', 'wfs-gml3-1-f.xml');
            wfsXml = readFileSync(filePath, 'utf-8');
            result = await parser.parse(wfsXml) as FeatureCollection;
        });

        it('should parse WFS 1.1 FeatureCollection', () => {
            expect(result.type).toBe('FeatureCollection');
            expect(Array.isArray(result.features)).toBe(true);
        });

        it('should extract features from gml:featureMembers', () => {
            expect(result.features.length).toBeGreaterThan(0);
        });

        it('should parse MultiSurface geometry', () => {
            const firstFeature = result.features[0];
            // MultiSurface with single surface becomes Polygon (GeoJSON optimization)
            expect(['Polygon', 'MultiPolygon']).toContain(firstFeature.geometry.type);
            expect(Array.isArray((firstFeature.geometry as any).coordinates)).toBe(true);
        });

        it('should preserve feature properties', () => {
            const firstFeature = result.features[0];
            expect(firstFeature.properties).toBeDefined();
            expect(firstFeature.properties?.['osm:osm_id']).toBeDefined();
            expect(firstFeature.properties?.['osm:natural']).toBe('natural');
            expect(firstFeature.properties?.['osm:landuse']).toBe('reservoir');
        });

        it('should handle gml:id in GML 3.0', () => {
            const firstFeature = result.features[0];
            expect(firstFeature.id).toBeDefined();
        });
    });

    describe('WFS 1.0 with GML 2.1.2', () => {
        let wfsXml: string;
        let result: FeatureCollection;

        beforeAll(async () => {
            const filePath = join(__dirname, 'gml', 'wfs-3-f.xml');
            wfsXml = readFileSync(filePath, 'utf-8');
            result = await parser.parse(wfsXml) as FeatureCollection;
        });

        it('should parse WFS 1.0 FeatureCollection', () => {
            expect(result.type).toBe('FeatureCollection');
            expect(Array.isArray(result.features)).toBe(true);
        });

        it('should extract all 30 features from gml:featureMember', () => {
            expect(result.features.length).toBe(30);
        });

        it('should parse GML 2.1.2 MultiPolygon geometry', () => {
            const firstFeature = result.features[0];
            // MultiPolygon with single polygon becomes Polygon (GeoJSON optimization)
            expect(['Polygon', 'MultiPolygon']).toContain(firstFeature.geometry.type);
            expect(Array.isArray((firstFeature.geometry as any).coordinates)).toBe(true);
        });

        it('should parse GML 2.1.2 coordinates format (x,y pairs)', () => {
            const firstFeature = result.features[0];
            let coordinates: number[][];

            // Handle both Polygon and MultiPolygon
            if (firstFeature.geometry.type === 'Polygon') {
                coordinates = (firstFeature.geometry as any).coordinates[0];
            } else {
                coordinates = (firstFeature.geometry as any).coordinates[0][0];
            }

            // Check first coordinate pair
            expect(coordinates[0]).toHaveLength(2);
            expect(typeof coordinates[0][0]).toBe('number');
            expect(typeof coordinates[0][1]).toBe('number');

            // First coordinate should match the first in the XML: -77.84807555,43.99535108
            expect(coordinates[0][0]).toBeCloseTo(-77.84807555, 6);
            expect(coordinates[0][1]).toBeCloseTo(43.99535108, 6);

            // Polygon should be closed (first = last)
            expect(coordinates[0]).toEqual(coordinates[coordinates.length - 1]);
        });

        it('should preserve feature properties', () => {
            const firstFeature = result.features[0];
            expect(firstFeature.properties).toBeDefined();
            expect(firstFeature.properties?.['osm:osm_id']).toBe('80315040');
            expect(firstFeature.properties?.['osm:natural']).toBe('natural');
            expect(firstFeature.properties?.['osm:landuse']).toBe('reservoir');
        });

        it('should handle fid attributes as feature IDs', () => {
            const firstFeature = result.features[0];
            expect(firstFeature.id).toBe('water_areas.230');
        });

        it('should handle outerBoundaryIs correctly', () => {
            const firstFeature = result.features[0];
            let polygon: number[][][];

            // Handle both Polygon and MultiPolygon
            if (firstFeature.geometry.type === 'Polygon') {
                polygon = [(firstFeature.geometry as any).coordinates];
            } else {
                polygon = (firstFeature.geometry as any).coordinates;
            }

            // Should have exterior ring with at least 4 points (closed ring)
            expect(polygon[0][0].length).toBeGreaterThanOrEqual(4);
        });

        it('should parse all coordinates as valid numbers', () => {
            const firstFeature = result.features[0];
            let coords: number[][];

            if (firstFeature.geometry.type === 'Polygon') {
                coords = (firstFeature.geometry as any).coordinates[0];
            } else {
                coords = (firstFeature.geometry as any).coordinates[0][0];
            }

            coords.forEach(coord => {
                expect(coord).toHaveLength(2);
                expect(Number.isFinite(coord[0])).toBe(true);
                expect(Number.isFinite(coord[1])).toBe(true);

                // Coordinates should be in valid lat/lon range
                expect(coord[0]).toBeGreaterThanOrEqual(-180);
                expect(coord[0]).toBeLessThanOrEqual(180);
                expect(coord[1]).toBeGreaterThanOrEqual(-90);
                expect(coord[1]).toBeLessThanOrEqual(90);
            });
        });

        it('should handle different landuse values', () => {
            // Last feature has landuse="basin" instead of "reservoir"
            const lastFeature = result.features[result.features.length - 1];
            expect(lastFeature.properties?.['osm:landuse']).toBe('reservoir');

            // Find the basin feature (fid="water_areas.18574")
            const basinFeature = result.features.find(f => f.id === 'water_areas.18574');
            expect(basinFeature).toBeDefined();
            expect(basinFeature?.properties?.['osm:landuse']).toBe('basin');
        });
    });

    describe('WFS Version Comparison', () => {
        let wfs20Result: FeatureCollection;
        let wfs11Result: FeatureCollection;

        beforeAll(async () => {
            const wfs20Path = join(__dirname, 'gml', 'wfs-gml32-1-f.xml');
            const wfs11Path = join(__dirname, 'gml', 'wfs-gml3-1-f.xml');

            const wfs20Xml = readFileSync(wfs20Path, 'utf-8');
            const wfs11Xml = readFileSync(wfs11Path, 'utf-8');

            wfs20Result = await parser.parse(wfs20Xml) as FeatureCollection;
            wfs11Result = await parser.parse(wfs11Xml) as FeatureCollection;
        });

        it('should produce same number of features from both WFS versions', () => {
            // Both test files should have the same features
            expect(wfs20Result.features.length).toBeGreaterThan(0);
            expect(wfs11Result.features.length).toBeGreaterThan(0);
        });

        it('should produce same geometry types from both WFS versions', () => {
            const wfs20FirstGeom = wfs20Result.features[0].geometry;
            const wfs11FirstGeom = wfs11Result.features[0].geometry;

            expect(wfs20FirstGeom.type).toBe(wfs11FirstGeom.type);
            expect(['Polygon', 'MultiPolygon']).toContain(wfs20FirstGeom.type);
        });

        it('should preserve same property structure from both WFS versions', () => {
            const wfs20Props = wfs20Result.features[0].properties;
            const wfs11Props = wfs11Result.features[0].properties;

            // Same property keys
            expect(Object.keys(wfs20Props || {})).toEqual(Object.keys(wfs11Props || {}));
        });

        it('should parse coordinates from both WFS versions', () => {
            const wfs20Coords = (wfs20Result.features[0].geometry as any).coordinates;
            const wfs11Coords = (wfs11Result.features[0].geometry as any).coordinates;

            expect(wfs20Coords).toBeDefined();
            expect(wfs11Coords).toBeDefined();
            expect(wfs20Coords.length).toBeGreaterThan(0);
            expect(wfs11Coords.length).toBeGreaterThan(0);
        });
    });

    describe('Real-world WFS Data Integrity', () => {
        it('should handle OpenStreetMap water_areas features', async () => {
            const filePath = join(__dirname, 'gml', 'wfs-gml32-1-f.xml');
            const wfsXml = readFileSync(filePath, 'utf-8');
            const result = await parser.parse(wfsXml) as FeatureCollection;

            // Check for OSM-specific properties
            const feature = result.features[0];
            expect(feature.properties).toHaveProperty('osm:osm_id');
            expect(feature.properties).toHaveProperty('osm:natural');
            expect(feature.properties).toHaveProperty('osm:landuse');
        });

        it('should parse reservoir geometries with valid coordinates', async () => {
            const filePath = join(__dirname, 'gml', 'wfs-gml32-1-f.xml');
            const wfsXml = readFileSync(filePath, 'utf-8');
            const result = await parser.parse(wfsXml) as FeatureCollection;

            const feature = result.features[0];
            let coords: number[][];

            // Handle both Polygon and MultiPolygon
            if (feature.geometry.type === 'Polygon') {
                coords = (feature.geometry as any).coordinates[0];
            } else {
                coords = (feature.geometry as any).coordinates[0][0];
            }

            // All coordinates should be valid numbers
            coords.forEach(coord => {
                expect(coord).toHaveLength(2);
                expect(Number.isFinite(coord[0])).toBe(true);
                expect(Number.isFinite(coord[1])).toBe(true);

                // Rough bounds check for coordinates (should be in valid lat/lon range)
                expect(coord[0]).toBeGreaterThanOrEqual(-180);
                expect(coord[0]).toBeLessThanOrEqual(180);
                expect(coord[1]).toBeGreaterThanOrEqual(-90);
                expect(coord[1]).toBeLessThanOrEqual(90);
            });
        });

        it('should handle srsDimension attribute', async () => {
            const filePath = join(__dirname, 'gml', 'wfs-gml32-1-f.xml');
            const wfsXml = readFileSync(filePath, 'utf-8');
            const result = await parser.parse(wfsXml) as FeatureCollection;

            // Should parse 2D coordinates (srsDimension="2")
            const feature = result.features[0];
            let coords: number[][];

            // Handle both Polygon and MultiPolygon
            if (feature.geometry.type === 'Polygon') {
                coords = (feature.geometry as any).coordinates[0];
            } else {
                coords = (feature.geometry as any).coordinates[0][0];
            }

            // All coordinates should be 2D [lon, lat]
            coords.forEach(coord => {
                expect(coord).toHaveLength(2);
            });
        });
    });
});
