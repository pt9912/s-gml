/**
 * KML Builder
 *
 * Converts GML to KML (Keyhole Markup Language) format
 * Compatible with Google Earth, Google Maps, and other KML viewers
 *
 * Reference: OGC KML 2.2 Standard (07-147r2)
 */

import {
    Builder,
    GmlPoint,
    GmlLineString,
    GmlPolygon,
    GmlLinearRing,
    GmlEnvelope,
    GmlBox,
    GmlCurve,
    GmlSurface,
    GmlMultiPoint,
    GmlMultiLineString,
    GmlMultiPolygon,
    GmlFeature,
    GmlFeatureCollection,
    GmlRectifiedGridCoverage,
    GmlGridCoverage,
    GmlReferenceableGridCoverage,
    GmlMultiPointCoverage,
    GmlGeometry,
} from '../types.js';

export class KmlBuilder implements Builder<string, string, string> {
    /**
     * Convert Point to KML Point
     */
    buildPoint(gml: GmlPoint): string {
        const [lon, lat, alt] = gml.coordinates;
        const coords = alt !== undefined ? `${lon},${lat},${alt}` : `${lon},${lat}`;
        return `<Point><coordinates>${coords}</coordinates></Point>`;
    }

    /**
     * Convert LineString to KML LineString
     */
    buildLineString(gml: GmlLineString): string {
        const coords = gml.coordinates.map(([lon, lat, alt]) =>
            alt !== undefined ? `${lon},${lat},${alt}` : `${lon},${lat}`
        ).join(' ');
        return `<LineString><coordinates>${coords}</coordinates></LineString>`;
    }

    /**
     * Convert Polygon to KML Polygon
     */
    buildPolygon(gml: GmlPolygon): string {
        const outerRing = gml.coordinates[0];
        const innerRings = gml.coordinates.slice(1);

        const outerCoords = outerRing.map(([lon, lat, alt]) =>
            alt !== undefined ? `${lon},${lat},${alt}` : `${lon},${lat}`
        ).join(' ');

        let kml = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${outerCoords}</coordinates></LinearRing></outerBoundaryIs>`;

        // Add inner boundaries (holes)
        for (const ring of innerRings) {
            const innerCoords = ring.map(([lon, lat, alt]) =>
                alt !== undefined ? `${lon},${lat},${alt}` : `${lon},${lat}`
            ).join(' ');
            kml += `<innerBoundaryIs><LinearRing><coordinates>${innerCoords}</coordinates></LinearRing></innerBoundaryIs>`;
        }

        kml += '</Polygon>';
        return kml;
    }

    /**
     * Convert MultiPoint to KML MultiGeometry with Points
     */
    buildMultiPoint(gml: GmlMultiPoint): string {
        const points = gml.coordinates.map(([lon, lat, alt]) => {
            const coords = alt !== undefined ? `${lon},${lat},${alt}` : `${lon},${lat}`;
            return `<Point><coordinates>${coords}</coordinates></Point>`;
        }).join('');

        return `<MultiGeometry>${points}</MultiGeometry>`;
    }

    /**
     * Convert MultiLineString to KML MultiGeometry with LineStrings
     */
    buildMultiLineString(gml: GmlMultiLineString): string {
        const lines = gml.coordinates.map(line => {
            const coords = line.map(([lon, lat, alt]) =>
                alt !== undefined ? `${lon},${lat},${alt}` : `${lon},${lat}`
            ).join(' ');
            return `<LineString><coordinates>${coords}</coordinates></LineString>`;
        }).join('');

        return `<MultiGeometry>${lines}</MultiGeometry>`;
    }

    /**
     * Convert MultiPolygon to KML MultiGeometry with Polygons
     */
    buildMultiPolygon(gml: GmlMultiPolygon): string {
        const polygons = gml.coordinates.map(polyCoords => {
            const outerRing = polyCoords[0];
            const innerRings = polyCoords.slice(1);

            const outerCoords = outerRing.map(([lon, lat, alt]) =>
                alt !== undefined ? `${lon},${lat},${alt}` : `${lon},${lat}`
            ).join(' ');

            let poly = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${outerCoords}</coordinates></LinearRing></outerBoundaryIs>`;

            for (const ring of innerRings) {
                const innerCoords = ring.map(([lon, lat, alt]) =>
                    alt !== undefined ? `${lon},${lat},${alt}` : `${lon},${lat}`
                ).join(' ');
                poly += `<innerBoundaryIs><LinearRing><coordinates>${innerCoords}</coordinates></LinearRing></innerBoundaryIs>`;
            }

            poly += '</Polygon>';
            return poly;
        }).join('');

        return `<MultiGeometry>${polygons}</MultiGeometry>`;
    }

    /**
     * Convert LinearRing to KML LineString
     */
    buildLinearRing(gml: GmlLinearRing): string {
        return this.buildLineString({
            type: 'LineString',
            coordinates: gml.coordinates,
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    /**
     * Convert Envelope to KML Placemark with Polygon
     */
    buildEnvelope(gml: GmlEnvelope): string {
        const [minLon, minLat, maxLon, maxLat] = gml.bbox;
        const coords = `${minLon},${minLat} ${maxLon},${minLat} ${maxLon},${maxLat} ${minLon},${maxLat} ${minLon},${minLat}`;

        return `<Placemark>
  <name>Envelope</name>
  <Polygon>
    <outerBoundaryIs>
      <LinearRing>
        <coordinates>${coords}</coordinates>
      </LinearRing>
    </outerBoundaryIs>
  </Polygon>
</Placemark>`;
    }

    /**
     * Convert Box to KML Placemark
     */
    buildBox(gml: GmlBox): string {
        return this.buildEnvelope({
            type: 'Envelope',
            bbox: gml.coordinates,
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    /**
     * Convert Curve to KML LineString
     */
    buildCurve(gml: GmlCurve): string {
        return this.buildLineString({
            type: 'LineString',
            coordinates: gml.coordinates,
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    /**
     * Convert Surface to KML MultiGeometry with Polygons
     */
    buildSurface(gml: GmlSurface): string {
        return this.buildMultiPolygon({
            type: 'MultiPolygon',
            coordinates: gml.patches.map(p => p.coordinates),
            srsName: gml.srsName,
            version: gml.version,
        });
    }

    /**
     * Convert RectifiedGridCoverage to KML Placemark
     */
    buildRectifiedGridCoverage(gml: GmlRectifiedGridCoverage): string {
        let geometry = '';
        let description = '';

        if (gml.boundedBy) {
            const [minLon, minLat, maxLon, maxLat] = gml.boundedBy.bbox;
            const coords = `${minLon},${minLat} ${maxLon},${minLat} ${maxLon},${maxLat} ${minLon},${maxLat} ${minLon},${minLat}`;
            geometry = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
        }

        description += `<![CDATA[
<table>
<tr><th>Type</th><td>RectifiedGridCoverage</td></tr>
<tr><th>Dimension</th><td>${gml.domainSet.dimension}</td></tr>
<tr><th>SRS</th><td>${gml.domainSet.srsName || 'N/A'}</td></tr>
<tr><th>Grid Limits</th><td>Low: ${gml.domainSet.limits.low.join(', ')}, High: ${gml.domainSet.limits.high.join(', ')}</td></tr>
<tr><th>Origin</th><td>${gml.domainSet.origin.join(', ')}</td></tr>`;

        if (gml.rangeSet.file) {
            description += `<tr><th>Data File</th><td>${this.escapeXml(gml.rangeSet.file.fileName)}</td></tr>`;
            if (gml.rangeSet.file.fileStructure) {
                description += `<tr><th>File Structure</th><td>${this.escapeXml(gml.rangeSet.file.fileStructure)}</td></tr>`;
            }
        }

        if (gml.rangeType?.field) {
            description += `<tr><th>Bands</th><td>${gml.rangeType.field.map(f => this.escapeXml(f.name)).join(', ')}</td></tr>`;
        }

        description += '</table>]]>';

        return `<Placemark>
  <name>${this.escapeXml(gml.id || 'RectifiedGridCoverage')}</name>
  <description>${description}</description>
  ${geometry}
</Placemark>`;
    }

    /**
     * Convert GridCoverage to KML Placemark
     */
    buildGridCoverage(gml: GmlGridCoverage): string {
        let geometry = '';
        let description = '';

        if (gml.boundedBy) {
            const [minLon, minLat, maxLon, maxLat] = gml.boundedBy.bbox;
            const coords = `${minLon},${minLat} ${maxLon},${minLat} ${maxLon},${maxLat} ${minLon},${maxLat} ${minLon},${minLat}`;
            geometry = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
        }

        description += `<![CDATA[
<table>
<tr><th>Type</th><td>GridCoverage</td></tr>
<tr><th>Dimension</th><td>${gml.domainSet.dimension}</td></tr>
<tr><th>Grid Limits</th><td>Low: ${gml.domainSet.limits.low.join(', ')}, High: ${gml.domainSet.limits.high.join(', ')}</td></tr>`;

        if (gml.rangeSet.file) {
            description += `<tr><th>Data File</th><td>${this.escapeXml(gml.rangeSet.file.fileName)}</td></tr>`;
        }

        if (gml.rangeType?.field) {
            description += `<tr><th>Bands</th><td>${gml.rangeType.field.map(f => this.escapeXml(f.name)).join(', ')}</td></tr>`;
        }

        description += '</table>]]>';

        return `<Placemark>
  <name>${this.escapeXml(gml.id || 'GridCoverage')}</name>
  <description>${description}</description>
  ${geometry}
</Placemark>`;
    }

    /**
     * Convert ReferenceableGridCoverage to KML Placemark
     */
    buildReferenceableGridCoverage(gml: GmlReferenceableGridCoverage): string {
        let geometry = '';
        let description = '';

        if (gml.boundedBy) {
            const [minLon, minLat, maxLon, maxLat] = gml.boundedBy.bbox;
            const coords = `${minLon},${minLat} ${maxLon},${minLat} ${maxLon},${maxLat} ${minLon},${maxLat} ${minLon},${minLat}`;
            geometry = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
        }

        description += `<![CDATA[
<table>
<tr><th>Type</th><td>ReferenceableGridCoverage</td></tr>
<tr><th>Dimension</th><td>${gml.domainSet.dimension}</td></tr>
<tr><th>Grid Limits</th><td>Low: ${gml.domainSet.limits.low.join(', ')}, High: ${gml.domainSet.limits.high.join(', ')}</td></tr>`;

        if (gml.rangeSet.file) {
            description += `<tr><th>Data File</th><td>${this.escapeXml(gml.rangeSet.file.fileName)}</td></tr>`;
        }

        if (gml.rangeType?.field) {
            description += `<tr><th>Bands</th><td>${gml.rangeType.field.map(f => this.escapeXml(f.name)).join(', ')}</td></tr>`;
        }

        description += '</table>]]>';

        return `<Placemark>
  <name>${this.escapeXml(gml.id || 'ReferenceableGridCoverage')}</name>
  <description>${description}</description>
  ${geometry}
</Placemark>`;
    }

    /**
     * Convert MultiPointCoverage to KML Placemark
     */
    buildMultiPointCoverage(gml: GmlMultiPointCoverage): string {
        const geometry = this.buildMultiPoint(gml.domainSet);

        let description = `<![CDATA[
<table>
<tr><th>Type</th><td>MultiPointCoverage</td></tr>
<tr><th>Point Count</th><td>${gml.domainSet.coordinates.length}</td></tr>
<tr><th>SRS</th><td>${gml.domainSet.srsName || 'N/A'}</td></tr>`;

        if (gml.rangeSet.file) {
            description += `<tr><th>Data File</th><td>${this.escapeXml(gml.rangeSet.file.fileName)}</td></tr>`;
        }

        if (gml.rangeType?.field) {
            description += `<tr><th>Bands</th><td>${gml.rangeType.field.map(f => this.escapeXml(f.name)).join(', ')}</td></tr>`;
        }

        description += '</table>]]>';

        return `<Placemark>
  <name>${this.escapeXml(gml.id || 'MultiPointCoverage')}</name>
  <description>${description}</description>
  ${geometry}
</Placemark>`;
    }

    /**
     * Convert Feature to KML Placemark
     */
    buildFeature(gml: GmlFeature): string {
        const geometry = this.buildGeometry(gml.geometry);

        // Build description from properties
        let description = '';
        if (Object.keys(gml.properties).length > 0) {
            description = '<![CDATA[<table>';
            for (const [key, value] of Object.entries(gml.properties)) {
                description += `<tr><th>${this.escapeXml(key)}</th><td>${this.escapeXml(String(value))}</td></tr>`;
            }
            description += '</table>]]>';
        }

        const name = gml.properties.name || gml.properties.title || gml.id || 'Feature';

        return `<Placemark>
  <name>${this.escapeXml(name)}</name>
  ${description ? `<description>${description}</description>` : ''}
  ${geometry}
</Placemark>`;
    }

    /**
     * Convert FeatureCollection to KML Document
     */
    buildFeatureCollection(gml: GmlFeatureCollection): string {
        const placemarks = gml.features.map(feature => this.buildFeature(feature)).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>GML Feature Collection</name>
  <description>Converted from GML ${gml.version}</description>
  ${placemarks}
</Document>
</kml>`;
    }

    /**
     * Helper: Convert geometry to KML
     */
    private buildGeometry(gml: GmlGeometry): string {
        switch (gml.type) {
            case 'Point': return this.buildPoint(gml);
            case 'LineString': return this.buildLineString(gml);
            case 'Polygon': return this.buildPolygon(gml);
            case 'LinearRing': return this.buildLinearRing(gml);
            case 'Envelope': return this.buildEnvelope(gml);
            case 'Box': return this.buildBox(gml);
            case 'Curve': return this.buildCurve(gml);
            case 'Surface': return this.buildSurface(gml);
            case 'MultiPoint': return this.buildMultiPoint(gml);
            case 'MultiLineString': return this.buildMultiLineString(gml);
            case 'MultiPolygon': return this.buildMultiPolygon(gml);
            default:
                throw new Error(`Unsupported geometry type: ${(gml as any).type}`);
        }
    }

    /**
     * Helper: Escape XML special characters
     */
    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}
