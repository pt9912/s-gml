import { Builder } from '../types.js';
import { GeoJsonBuilder } from './geojson.js';
import { CisJsonBuilder } from './cis-json.js';
import { CoverageJsonBuilder } from './coveragejson.js';
import { CsvBuilder } from './csv.js';
import { KmlBuilder } from './kml.js';
import { WktBuilder } from './wkt.js';

export function getBuilder(format: string): Builder<any, any, any> {
    switch (format) {
        case 'geojson':
            return new GeoJsonBuilder();
        case 'cis-json':
        case 'json-coverage':
            return new CisJsonBuilder();
        case 'coveragejson':
        case 'covjson':
            return new CoverageJsonBuilder();
        case 'csv':
            return new CsvBuilder();
        case 'kml':
            return new KmlBuilder();
        case 'wkt':
            return new WktBuilder();
        default:
            throw new Error(`Unsupported target format: ${format}. Supported: geojson, cis-json, coveragejson, csv, kml, wkt`);
    }
}

export type { Builder } from '../types.js';
export { GeoJsonBuilder } from './geojson.js';
export { CisJsonBuilder } from './cis-json.js';
export { CoverageJsonBuilder } from './coveragejson.js';
export { CsvBuilder, type CsvRow, type CsvOutput } from './csv.js';
export { KmlBuilder } from './kml.js';
export { WktBuilder, type WktFeature, type WktCollection, wktCollectionToJson, wktCollectionToCsv } from './wkt.js';
