#!/usr/bin/env node
import { GmlParser, validateGml, OwsExceptionError } from './index.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { Command } from 'commander';

/**
 * Checks if a string is a URL
 */
function isUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
}

/**
 * Fetches content from a URL or reads from a file
 */
async function fetchInput(input: string): Promise<string> {
    if (isUrl(input)) {
        const response = await fetch(input);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.text();
    }

    try {
        return readFileSync(input, 'utf-8');
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            throw new Error(`File not found: ${input}`);
        }
        throw error;
    }
}

export function buildProgram(): Command {
    const program = new Command();

    program
        .name('s-gml')
        .description('CLI tool for parsing, converting, and validating GML files')
        .version('1.1.3', '-V, --version')
        .option('--verbose', 'Show detailed error messages with stack traces');

    program
        .command('parse <input>')
        .description('Parse GML to GeoJSON (supports local files and URLs)')
        .option('--output <file>', 'Output file (default: stdout)')
        .action(async (input, options, command) => {
            try {
                const parser = new GmlParser();
                const gml = await fetchInput(input);
                const geojson = await parser.parse(gml);
                if (options.output) {
                    writeFileSync(options.output, JSON.stringify(geojson, null, 2));
                    console.log(`Successfully wrote GeoJSON to ${options.output}`);
                } else {
                    console.log(JSON.stringify(geojson, null, 2));
                }
            } catch (error) {
                const verbose = command.parent?.opts().verbose;

                if (error instanceof OwsExceptionError) {
                    console.error('WFS Server returned an error:');
                    console.error(error.getAllMessages());
                    process.exit(1);
                }

                if (error instanceof Error) {
                    if (verbose) {
                        console.error(error.stack);
                    } else {
                        console.error(`Error: ${error.message}`);
                    }
                    process.exit(1);
                }

                throw error;
            }
        });

    program
        .command('convert <input>')
        .description('Convert GML between versions (supports local files and URLs)')
        .requiredOption('--version <version>', 'Target GML version (2.1.2 or 3.2)')
        .option('--pretty', 'Pretty-print XML output')
        .action(async (input, options, command) => {
            try {
                const parser = new GmlParser();
                const gml = await fetchInput(input);
                const converted = await parser.convert(gml, {
                    outputVersion: options.version as '2.1.2' | '3.2',
                    prettyPrint: options.pretty,
                });
                console.log(converted);
            } catch (error) {
                const verbose = command.parent?.opts().verbose;

                if (error instanceof OwsExceptionError) {
                    console.error('WFS Server returned an error:');
                    console.error(error.getAllMessages());
                    process.exit(1);
                }

                if (error instanceof Error) {
                    if (verbose) {
                        console.error(error.stack);
                    } else {
                        console.error(`Error: ${error.message}`);
                    }
                    process.exit(1);
                }

                throw error;
            }
        });

    program
        .command('validate <input>')
        .description('Validate GML against XSD schema (supports local files and URLs)')
        .requiredOption('--gml-version <version>', 'GML version to validate against')
        .action(async (input, options, command) => {
            try {
                const gml = await fetchInput(input);
                const isValid = await validateGml(gml, options.gmlVersion);
                console.log(`GML is ${isValid ? 'valid' : 'invalid'} for version ${options.gmlVersion}`);
                process.exit(isValid ? 0 : 1);
            } catch (error) {
                const verbose = command.parent?.opts().verbose;

                if (error instanceof Error) {
                    if (verbose) {
                        console.error(error.stack);
                    } else {
                        console.error(`Error: ${error.message}`);
                    }
                    process.exit(1);
                }

                throw error;
            }
        });

    return program;
}

export const program = buildProgram();

if (process.env.NODE_ENV !== 'test') {
    program.parse(process.argv);
}
