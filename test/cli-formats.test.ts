import { readFileSync, writeFileSync } from 'node:fs';
import { buildProgram } from '../src/cli.js';

jest.mock('node:fs', () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
}));

jest.mock('../src/validator.node.js', () => ({
    validateGml: jest.fn().mockResolvedValue(true),
}));

// Mock the parser and builders
jest.mock('../src/index.js', () => ({
    GmlParser: jest.fn().mockImplementation(() => ({
        parse: jest.fn().mockResolvedValue({
            type: 'Point',
            coordinates: [10, 20]
        }),
        convert: jest.fn().mockResolvedValue('<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2"><gml:pos>10 20</gml:pos></gml:Point>'),
    })),
    OwsExceptionError: class OwsExceptionError extends Error {
        constructor(message: string) {
            super(message);
        }
        getAllMessages() {
            return 'Test exception';
        }
    },
    getBuilder: jest.fn(),
    ShapefileBuilder: jest.fn().mockImplementation(() => ({
        toZip: jest.fn().mockResolvedValue(Buffer.from('mock-zip'))
    })),
    GeoPackageBuilder: jest.fn().mockImplementation(() => ({
        toGeoPackage: jest.fn().mockResolvedValue(Buffer.from('mock-gpkg'))
    })),
    FlatGeobufBuilder: jest.fn().mockImplementation(() => ({
        toFlatGeobuf: jest.fn().mockReturnValue(new Uint8Array([0x66, 0x67, 0x62]))
    })),
}));

const mockedReadFile = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockedWriteFile = writeFileSync as jest.MockedFunction<typeof writeFileSync>;

const samplePoint = `<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
  <gml:pos>10 20</gml:pos>
</gml:Point>`;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('CLI Format Support', () => {
    describe('Binary Formats', () => {
        it('accepts shapefile format', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const program = buildProgram();
            program.exitOverride();
            await program.parseAsync(['parse', 'input.gml', '--format', 'shapefile', '--output', 'out.zip'], { from: 'user' }).catch(error => {
                expect(error).toHaveProperty('exitCode', 0);
            });

            expect(mockedWriteFile).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith('Successfully wrote Shapefile ZIP to out.zip');
            logSpy.mockRestore();
        });

        it('accepts shp format alias', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const program = buildProgram();
            program.exitOverride();
            await program.parseAsync(['parse', 'input.gml', '--format', 'shp', '--output', 'out.zip'], { from: 'user' }).catch(error => {
                expect(error).toHaveProperty('exitCode', 0);
            });

            expect(logSpy).toHaveBeenCalledWith('Successfully wrote Shapefile ZIP to out.zip');
            logSpy.mockRestore();
        });

        it('requires --output for shapefile', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
                throw new Error(`process.exit: ${code}`);
            });

            const program = buildProgram();
            await expect(async () => {
                await program.parseAsync(['parse', 'input.gml', '--format', 'shapefile'], { from: 'user' });
            }).rejects.toThrow();

            expect(errorSpy).toHaveBeenCalledWith('Error: --output is required for Shapefile format');
            errorSpy.mockRestore();
            exitSpy.mockRestore();
        });

        it('accepts geopackage format', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const program = buildProgram();
            program.exitOverride();
            await program.parseAsync(['parse', 'input.gml', '--format', 'geopackage', '--output', 'out.gpkg'], { from: 'user' }).catch(error => {
                expect(error).toHaveProperty('exitCode', 0);
            });

            expect(mockedWriteFile).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith('Successfully wrote GeoPackage to out.gpkg');
            logSpy.mockRestore();
        });

        it('accepts gpkg format alias', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const program = buildProgram();
            program.exitOverride();
            await program.parseAsync(['parse', 'input.gml', '--format', 'gpkg', '--output', 'out.gpkg'], { from: 'user' }).catch(error => {
                expect(error).toHaveProperty('exitCode', 0);
            });

            expect(logSpy).toHaveBeenCalledWith('Successfully wrote GeoPackage to out.gpkg');
            logSpy.mockRestore();
        });

        it('requires --output for geopackage', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
                throw new Error(`process.exit: ${code}`);
            });

            const program = buildProgram();
            await expect(async () => {
                await program.parseAsync(['parse', 'input.gml', '--format', 'geopackage'], { from: 'user' });
            }).rejects.toThrow();

            expect(errorSpy).toHaveBeenCalledWith('Error: --output is required for GeoPackage format');
            errorSpy.mockRestore();
            exitSpy.mockRestore();
        });

        it('accepts flatgeobuf format', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const program = buildProgram();
            program.exitOverride();
            await program.parseAsync(['parse', 'input.gml', '--format', 'flatgeobuf', '--output', 'out.fgb'], { from: 'user' }).catch(error => {
                expect(error).toHaveProperty('exitCode', 0);
            });

            expect(mockedWriteFile).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith('Successfully wrote FlatGeobuf to out.fgb');
            logSpy.mockRestore();
        });

        it('accepts fgb format alias', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const program = buildProgram();
            program.exitOverride();
            await program.parseAsync(['parse', 'input.gml', '--format', 'fgb', '--output', 'out.fgb'], { from: 'user' }).catch(error => {
                expect(error).toHaveProperty('exitCode', 0);
            });

            expect(logSpy).toHaveBeenCalledWith('Successfully wrote FlatGeobuf to out.fgb');
            logSpy.mockRestore();
        });

        it('requires --output for flatgeobuf', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
                throw new Error(`process.exit: ${code}`);
            });

            const program = buildProgram();
            await expect(async () => {
                await program.parseAsync(['parse', 'input.gml', '--format', 'flatgeobuf'], { from: 'user' });
            }).rejects.toThrow();

            expect(errorSpy).toHaveBeenCalledWith('Error: --output is required for FlatGeobuf format');
            errorSpy.mockRestore();
            exitSpy.mockRestore();
        });
    });

    describe('Coverage Formats', () => {
        it('accepts cis-json format', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const program = buildProgram();
            program.exitOverride();
            await program.parseAsync(['parse', 'input.gml', '--format', 'cis-json', '--output', 'out.json'], { from: 'user' }).catch(error => {
                expect(error).toHaveProperty('exitCode', 0);
            });

            expect(logSpy).toHaveBeenCalledWith('Successfully wrote CIS JSON to out.json');
            logSpy.mockRestore();
        });

        it('accepts coveragejson format', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const program = buildProgram();
            program.exitOverride();
            await program.parseAsync(['parse', 'input.gml', '--format', 'coveragejson', '--output', 'out.covjson'], { from: 'user' }).catch(error => {
                expect(error).toHaveProperty('exitCode', 0);
            });

            expect(logSpy).toHaveBeenCalledWith('Successfully wrote CoverageJSON to out.covjson');
            logSpy.mockRestore();
        });
    });

    describe('Format Validation', () => {
        it('rejects invalid format', async () => {
            mockedReadFile.mockReturnValueOnce(samplePoint);
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const exitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
                throw new Error(`process.exit: ${code}`);
            });

            const program = buildProgram();
            await expect(async () => {
                await program.parseAsync(['parse', 'input.gml', '--format', 'invalid'], { from: 'user' });
            }).rejects.toThrow();

            expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Error: Invalid format 'invalid'"));
            errorSpy.mockRestore();
            exitSpy.mockRestore();
        });
    });
});
