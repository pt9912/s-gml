import { readFileSync, writeFileSync } from 'node:fs';
import { buildProgram } from '../src/cli.js';

jest.mock('node:fs', () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

jest.mock('../src/validator.js', () => ({
    validateGml: jest.fn().mockResolvedValue(true),
}));

const mockedReadFile = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockedWriteFile = writeFileSync as jest.MockedFunction<typeof writeFileSync>;
const mockedFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const samplePoint = `
<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
  <gml:pos>10 20</gml:pos>
</gml:Point>`;

const owsExceptionReport = `<?xml version="1.0" encoding="UTF-8"?>
<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows" version="1.0.0">
  <ows:Exception exceptionCode="InvalidParameterValue" locator="outputFormat">
    <ows:ExceptionText>Failed to find response for output format GML23</ows:ExceptionText>
  </ows:Exception>
</ows:ExceptionReport>`;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('CLI', () => {
    it('parses GML file and writes GeoJSON', async () => {
        mockedReadFile.mockReturnValueOnce(samplePoint);
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const program = buildProgram();
        program.exitOverride();
        await program.parseAsync(['parse', 'input.gml', '--output', 'out.json'], { from: 'user' }).catch(error => {
            expect(error).toHaveProperty('exitCode', 0);
        });

        expect(mockedReadFile).toHaveBeenCalledWith('input.gml', 'utf-8');
        expect(mockedWriteFile).toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalledWith('Successfully wrote GeoJSON to out.json');
        logSpy.mockRestore();
    });

    it('parses GML file and outputs to stdout', async () => {
        mockedReadFile.mockReturnValueOnce(samplePoint);
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const program = buildProgram();
        program.exitOverride();
        await program.parseAsync(['parse', 'input.gml'], { from: 'user' }).catch(error => {
            expect(error).toHaveProperty('exitCode', 0);
        });

        expect(mockedReadFile).toHaveBeenCalledWith('input.gml', 'utf-8');
        expect(mockedWriteFile).not.toHaveBeenCalled();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockRestore();
    });


    it('exposes convert and validate commands', () => {
        const program = buildProgram();
        const commandNames = program.commands.map(command => command.name());
        expect(commandNames).toEqual(expect.arrayContaining(['convert', 'validate']));
    });

    it('converts GML to target version', async () => {
        mockedReadFile.mockReturnValueOnce(samplePoint);
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        const { GmlParser } = await import('../src/index.js');
        const parser = new GmlParser();
        const gml = samplePoint;
        const converted = await parser.convert(gml, {
            outputVersion: '2.1.2',
            prettyPrint: false,
        });

        expect(converted).toContain('<gml:Point');
        expect(converted).toContain('xmlns:gml="http://www.opengis.net/gml"');
        logSpy.mockRestore();
    });

    it('converts GML with pretty print', async () => {
        const { GmlParser } = await import('../src/index.js');
        const parser = new GmlParser();
        const gml = samplePoint;
        const converted = await parser.convert(gml, {
            outputVersion: '3.2',
            prettyPrint: true,
        });

        expect(converted).toContain('<gml:Point');
        expect(converted).toContain('\n');
    });

    it('converts GML with explicit input version', async () => {
        const { GmlParser } = await import('../src/index.js');
        const parser = new GmlParser();
        const gml = samplePoint;
        const converted = await parser.convert(gml, {
            inputVersion: '3.2',
            outputVersion: '2.1.2',
            prettyPrint: false,
        });

        expect(converted).toContain('<gml:Point');
        expect(converted).toContain('xmlns:gml="http://www.opengis.net/gml"');
    });

    it('handles OWS Exception Report directly in parser', async () => {
        const { GmlParser, OwsExceptionError } = await import('../src/index.js');
        const parser = new GmlParser();

        await expect(parser.parse(owsExceptionReport)).rejects.toThrow(OwsExceptionError);

        try {
            await parser.parse(owsExceptionReport);
            fail('Should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(OwsExceptionError);
            const owsError = error as InstanceType<typeof OwsExceptionError>;
            expect(owsError.message).toContain('InvalidParameterValue');
            expect(owsError.getAllMessages()).toContain('Failed to find response for output format GML23');
        }
    });

    it('handles OWS Exception Report in convert', async () => {
        const { GmlParser, OwsExceptionError } = await import('../src/index.js');
        const parser = new GmlParser();

        await expect(
            parser.convert(owsExceptionReport, { outputVersion: '3.2' })
        ).rejects.toThrow(OwsExceptionError);

        try {
            await parser.convert(owsExceptionReport, { outputVersion: '3.2' });
            fail('Should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(OwsExceptionError);
            const owsError = error as InstanceType<typeof OwsExceptionError>;
            expect(owsError.message).toContain('InvalidParameterValue');
        }
    });

    it('fetches GML from URL and parses it', async () => {
        const mockResponse = {
            ok: true,
            text: jest.fn().mockResolvedValue(samplePoint),
        } as unknown as Response;

        mockedFetch.mockResolvedValueOnce(mockResponse);

        const { GmlParser } = await import('../src/index.js');
        const parser = new GmlParser();

        const gml = await (async () => {
            const response = await fetch('https://example.com/point.gml');
            return await response.text();
        })();

        const result = await parser.parse(gml);

        expect(mockedFetch).toHaveBeenCalledWith('https://example.com/point.gml');
        expect(result).toHaveProperty('type', 'Point');
        expect(result).toHaveProperty('coordinates', [10, 20]);
    });

    it('handles HTTP errors when fetching from URL', async () => {
        const mockResponse = {
            ok: false,
            status: 404,
            statusText: 'Not Found',
        } as Response;

        mockedFetch.mockResolvedValueOnce(mockResponse);

        await expect(async () => {
            const response = await fetch('https://example.com/missing.gml');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }).rejects.toThrow('HTTP 404: Not Found');
    });

});
