import { Builder } from '../types.js';
import { GeoJsonBuilder } from './geojson.js';
import { CisJsonBuilder } from './cis-json.js';
import { CoverageJsonBuilder } from './coveragejson.js';
import { CsvBuilder } from './csv.js';
import { KmlBuilder } from './kml.js';
import { WktBuilder } from './wkt.js';
import { ShapefileBuilder } from './shapefile.js';
import { GeoPackageBuilder } from './geopackage.js';
import { FlatGeobufBuilder } from './flatgeobuf.js';

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
        case 'shapefile':
        case 'shp':
            return new ShapefileBuilder();
        case 'geopackage':
        case 'gpkg':
            return new GeoPackageBuilder();
        case 'flatgeobuf':
        case 'fgb':
            return new FlatGeobufBuilder();
        default:
            throw new Error(`Unsupported target format: ${format}. Supported: geojson, cis-json, coveragejson, csv, kml, wkt, shapefile, geopackage, flatgeobuf`);
    }
}

export type { Builder } from '../types.js';
export { GeoJsonBuilder } from './geojson.js';
export { CisJsonBuilder } from './cis-json.js';
export { CoverageJsonBuilder } from './coveragejson.js';
export { CsvBuilder, type CsvRow, type CsvOutput } from './csv.js';
export { KmlBuilder } from './kml.js';
export { WktBuilder, type WktFeature, type WktCollection, wktCollectionToJson, wktCollectionToCsv } from './wkt.js';
export { ShapefileBuilder, toShapefile, type ShapefileOptions } from './shapefile.js';
export { GeoPackageBuilder, toGeoPackage, type GeoPackageOptions } from './geopackage.js';
export { FlatGeobufBuilder, toFlatGeobuf } from './flatgeobuf.js';
