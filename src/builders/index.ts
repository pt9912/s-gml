import { Builder } from '../types.js';
import { GeoJsonBuilder } from './geojson.js';

export function getBuilder(format: string): Builder {
    switch (format) {
        case 'geojson':
            return new GeoJsonBuilder();
        default:
            throw new Error(`Unsupported target format: ${format}`);
    }
}

export type { Builder } from '../types.js';
