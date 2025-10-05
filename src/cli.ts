#!/usr/bin/env node
import { GmlParser, validateGml } from './index.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { Command } from 'commander';

export function buildProgram(): Command {
    const program = new Command();

    program
        .name('s-gml')
        .description('CLI tool for parsing, converting, and validating GML files')
        .version('1.0.0');

    program
        .command('parse <input>')
        .description('Parse GML to GeoJSON')
        .option('--output <file>', 'Output file (default: stdout)')
        .action(async (input, options) => {
            const parser = new GmlParser();
            const gml = readFileSync(input, 'utf-8');
            const geojson = await parser.parse(gml);
            if (options.output) {
                writeFileSync(options.output, JSON.stringify(geojson, null, 2));
                console.log(`Successfully wrote GeoJSON to ${options.output}`);
            } else {
                console.log(JSON.stringify(geojson, null, 2));
            }
        });

    program
        .command('convert <input>')
        .description('Convert GML between versions')
        .requiredOption('--version <version>', 'Target GML version (2.1.2 or 3.2)')
        .option('--pretty', 'Pretty-print XML output')
        .action(async (input, options) => {
            const parser = new GmlParser();
            const gml = readFileSync(input, 'utf-8');
            const converted = await parser.convert(gml, {
                outputVersion: options.version as '2.1.2' | '3.2',
                prettyPrint: options.pretty,
            });
            console.log(converted);
        });

    program
        .command('validate <input>')
        .description('Validate GML against XSD schema')
        .requiredOption('--version <version>', 'GML version to validate against')
        .action(async (input, options) => {
            const gml = readFileSync(input, 'utf-8');
            const isValid = await validateGml(gml, options.version);
            console.log(`GML is ${isValid ? 'valid' : 'invalid'} for version ${options.version}`);
            process.exit(isValid ? 0 : 1);
        });

    return program;
}

export const program = buildProgram();

if (process.env.NODE_ENV !== 'test') {
    program.parse(process.argv);
}
