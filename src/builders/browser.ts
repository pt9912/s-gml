import type { Builder, FeatureCollection } from '../types.js';
import { GeoJsonBuilder } from './geojson.js';
import { CisJsonBuilder } from './cis-json.js';
import { CoverageJsonBuilder } from './coveragejson.js';
import { CsvBuilder } from './csv.js';
import { KmlBuilder } from './kml.js';
import { WktBuilder } from './wkt.js';
import { FlatGeobufBuilder } from './flatgeobuf.js';
import type { GeoPackageOptions } from './geopackage.js';
import type { ShapefileOptions } from './shapefile.js';

function throwUnsupportedInBrowser(feature: string): never {
    throw new Error(`${feature} is not available in the browser build of @npm9912/s-gml.`);
}

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
        case 'flatgeobuf':
        case 'fgb':
            return new FlatGeobufBuilder();
        case 'shapefile':
        case 'shp':
            return throwUnsupportedInBrowser('Shapefile export');
        case 'geopackage':
        case 'gpkg':
            return throwUnsupportedInBrowser('GeoPackage export');
        default:
            throw new Error(`Unsupported target format: ${format}. Supported in browsers: geojson, cis-json, coveragejson, csv, kml, wkt, flatgeobuf`);
    }
}

export class ShapefileBuilder {
    constructor() {
        throwUnsupportedInBrowser('ShapefileBuilder');
    }
}

export class GeoPackageBuilder {
    constructor() {
        throwUnsupportedInBrowser('GeoPackageBuilder');
    }
}

export async function toShapefile(
    _featureCollection: FeatureCollection,
    _options: ShapefileOptions = {}
): Promise<never> {
    return throwUnsupportedInBrowser('toShapefile');
}

export async function toGeoPackage(
    _featureCollection: FeatureCollection,
    _options: GeoPackageOptions = {}
): Promise<never> {
    return throwUnsupportedInBrowser('toGeoPackage');
}

export type { Builder } from '../types.js';
export { GeoJsonBuilder } from './geojson.js';
export { CisJsonBuilder } from './cis-json.js';
export { CoverageJsonBuilder } from './coveragejson.js';
export { CsvBuilder, type CsvRow, type CsvOutput } from './csv.js';
export { KmlBuilder } from './kml.js';
export { WktBuilder, type WktFeature, type WktCollection, wktCollectionToJson, wktCollectionToCsv } from './wkt.js';
export type { ShapefileOptions } from './shapefile.js';
export type { GeoPackageOptions } from './geopackage.js';
export { FlatGeobufBuilder, toFlatGeobuf } from './flatgeobuf.js';
