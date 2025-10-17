#!/usr/bin/env node
import { GmlParser, OwsExceptionError, getBuilder, ShapefileBuilder, GeoPackageBuilder, FlatGeobufBuilder } from './index.js';
import { validateGml } from './validator.node.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { Command } from 'commander';

type OutputFormat = 'geojson' | 'shapefile' | 'shp' | 'csv' | 'kml' | 'wkt' | 'cis-json' | 'coveragejson' | 'geopackage' | 'gpkg' | 'flatgeobuf' | 'fgb';

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

/**
 * Write output based on format
 */
async function writeOutput(result: any, format: OutputFormat, outputPath?: string): Promise<void> {
    if (format === 'shapefile' || format === 'shp') {
        // Shapefile returns a Buffer/Blob, write as binary
        if (!outputPath) {
            console.error('Error: --output is required for Shapefile format');
            process.exit(1);
        }

        writeFileSync(outputPath, result);
        console.log(`Successfully wrote Shapefile ZIP to ${outputPath}`);
    } else if (format === 'geopackage' || format === 'gpkg') {
        // GeoPackage returns a Buffer, write as binary
        if (!outputPath) {
            console.error('Error: --output is required for GeoPackage format');
            process.exit(1);
        }

        writeFileSync(outputPath, result);
        console.log(`Successfully wrote GeoPackage to ${outputPath}`);
    } else if (format === 'flatgeobuf' || format === 'fgb') {
        // FlatGeobuf returns a Uint8Array, write as binary
        if (!outputPath) {
            console.error('Error: --output is required for FlatGeobuf format');
            process.exit(1);
        }

        writeFileSync(outputPath, result);
        console.log(`Successfully wrote FlatGeobuf to ${outputPath}`);
    } else if (format === 'geojson' || format === 'cis-json' || format === 'coveragejson') {
        // JSON formats
        const jsonOutput = JSON.stringify(result, null, 2);
        if (outputPath) {
            const formatName = format === 'geojson' ? 'GeoJSON' :
                format === 'cis-json' ? 'CIS JSON' :
                    'CoverageJSON';
            writeFileSync(outputPath, jsonOutput);
            console.log(`Successfully wrote ${formatName} to ${outputPath}`);
        } else {
            console.log(jsonOutput);
        }
    } else if (format === 'csv') {
        // CSV can return either string (FeatureCollection) or CsvOutput object
        let csvString: string;
        if (typeof result === 'string') {
            csvString = result;
        } else if (result && typeof result === 'object' && result.type === 'CSV') {
            // CsvOutput object - convert to string
            const headers = result.headers.join(',');
            const rows = result.rows.map((row: any) =>
                result.headers.map((h: string) => {
                    const value = row[h];
                    if (value === null || value === undefined) return '';
                    const str = String(value);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                }).join(',')
            ).join('\n');
            csvString = `${headers}\n${rows}`;
        } else {
            console.error('Error: Unexpected CSV output format');
            process.exit(1);
        }

        if (outputPath) {
            writeFileSync(outputPath, csvString);
            console.log(`Successfully wrote CSV to ${outputPath}`);
        } else {
            console.log(csvString);
        }
    } else {
        // Text formats (KML, WKT)
        if (outputPath) {
            const formatName = format === 'kml' ? 'KML' : 'WKT';
            writeFileSync(outputPath, result);
            console.log(`Successfully wrote ${formatName} to ${outputPath}`);
        } else {
            console.log(result);
        }
    }
}

export function buildProgram(): Command {
    const program = new Command();

    program
        .name('s-gml')
        .description('CLI tool for parsing, converting, and validating GML files')
        .version('1.7.0', '-V, --version')
        .option('--verbose', 'Show detailed error messages with stack traces');

    program
        .command('parse <input>')
        .description('Parse GML to various formats (supports local files and URLs)')
        .option('--output <file>', 'Output file (default: stdout, required for Shapefile)')
        .option('--format <format>', 'Output format: geojson, shapefile, geopackage, flatgeobuf, csv, kml, wkt, cis-json, coveragejson (default: geojson)', 'geojson')
        .action(async (input, options, command) => {
            try {
                const format = options.format as OutputFormat;
                const validFormats = ['geojson', 'shapefile', 'shp', 'geopackage', 'gpkg', 'flatgeobuf', 'fgb', 'csv', 'kml', 'wkt', 'cis-json', 'coveragejson'];

                if (!validFormats.includes(format)) {
                    console.error(`Error: Invalid format '${format}'. Valid formats: ${validFormats.join(', ')}`);
                    process.exit(1);
                }

                // Fetch and parse GML
                const gml = await fetchInput(input);

                // Parse with appropriate builder
                let result: any;

                if (format === 'shapefile' || format === 'shp') {
                    // ShapefileBuilder returns GeoJSON (delegates to GeoJsonBuilder)
                    // We then use toZip() to convert the GeoJSON to Shapefile ZIP
                    const builder = new ShapefileBuilder();
                    const parser = new GmlParser(builder);
                    const geojson = await parser.parse(gml);

                    // Convert GeoJSON to Shapefile ZIP
                    result = await builder.toZip(geojson as any, {
                        outputType: 'arraybuffer',
                        filename: 'shapefile'
                    });

                    // Convert ArrayBuffer to Buffer for Node.js
                    result = Buffer.from(result);
                } else if (format === 'geopackage' || format === 'gpkg') {
                    // GeoPackageBuilder returns GeoJSON
                    // We then use toGeoPackage() to convert the GeoJSON to GeoPackage binary
                    const builder = new GeoPackageBuilder();
                    const parser = new GmlParser(builder);
                    const geojson = await parser.parse(gml);

                    // Convert GeoJSON to GeoPackage
                    result = await builder.toGeoPackage(geojson as any, {
                        tableName: 'features'
                    });
                } else if (format === 'flatgeobuf' || format === 'fgb') {
                    // FlatGeobufBuilder returns GeoJSON
                    // We then use toFlatGeobuf() to convert the GeoJSON to FlatGeobuf binary
                    const builder = new FlatGeobufBuilder();
                    const parser = new GmlParser(builder);
                    const geojson = await parser.parse(gml);

                    // Convert GeoJSON to FlatGeobuf
                    result = builder.toFlatGeobuf(geojson as any);
                } else {
                    // Use appropriate builder - the parser now correctly uses builders for everything
                    const builder = getBuilder(format);
                    const parser = new GmlParser(builder);
                    result = await parser.parse(gml);
                }

                // Write output
                await writeOutput(result, format, options.output);
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
