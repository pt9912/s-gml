import { readFileSync, writeFileSync } from 'node:fs';
import { buildProgram } from '../src/cli.js';

jest.mock('node:fs', () => ({
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
}));

jest.mock('../src/validator.js', () => ({
    validateGml: jest.fn().mockResolvedValue(true),
}));

const mockedReadFile = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockedWriteFile = writeFileSync as jest.MockedFunction<typeof writeFileSync>;

const samplePoint = `
<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326">
  <gml:pos>10 20</gml:pos>
</gml:Point>`;

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

});
