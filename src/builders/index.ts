import { Builder } from '../types.js';
import { GeoJsonBuilder } from './geojson.js';
import { CisJsonBuilder } from './cis-json.js';
import { CoverageJsonBuilder } from './coveragejson.js';

export function getBuilder(format: string): Builder {
    switch (format) {
        case 'geojson':
            return new GeoJsonBuilder();
        case 'cis-json':
        case 'json-coverage':
            return new CisJsonBuilder();
        case 'coveragejson':
        case 'covjson':
            return new CoverageJsonBuilder();
        default:
            throw new Error(`Unsupported target format: ${format}. Supported: geojson, cis-json, coveragejson`);
    }
}

export type { Builder } from '../types.js';
export { GeoJsonBuilder } from './geojson.js';
export { CisJsonBuilder } from './cis-json.js';
export { CoverageJsonBuilder } from './coveragejson.js';
