import type { Builder } from './types.js';
import { getBuilder } from './builders/browser.js';
import { GmlParser as BaseGmlParser } from './parser-base.js';

export class GmlParser extends BaseGmlParser {
    constructor(targetFormat: string | Builder = 'geojson') {
        super(targetFormat, getBuilder);
    }
}
