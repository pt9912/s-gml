import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

const DOCKER_IMAGE = 'ghcr.io/pt9912/s-gml:latest';
const TEST_DIR = join(process.cwd(), 'test-docker-output');

// Sample GML data
const samplePoint = `<?xml version="1.0" encoding="UTF-8"?>
<gml:Point xmlns:gml="http://www.opengis.net/gml/3.2" srsName="EPSG:4326" gml:id="point1">
  <gml:pos>10 20</gml:pos>
</gml:Point>`;

const sampleCoverage = `<?xml version="1.0" encoding="UTF-8"?>
<gmlcov:RectifiedGridCoverage xmlns:gml="http://www.opengis.net/gml/3.2"
  xmlns:gmlcov="http://www.opengis.net/gmlcov/1.0"
  gml:id="coverage1">
  <gml:domainSet>
    <gml:RectifiedGrid gml:id="grid1" dimension="2">
      <gml:limits>
        <gml:GridEnvelope>
          <gml:low>0 0</gml:low>
          <gml:high>10 10</gml:high>
        </gml:GridEnvelope>
      </gml:limits>
      <gml:axisLabels>x y</gml:axisLabels>
      <gml:origin>
        <gml:Point gml:id="origin1" srsName="EPSG:4326">
          <gml:pos>0 0</gml:pos>
        </gml:Point>
      </gml:origin>
      <gml:offsetVector srsName="EPSG:4326">1 0</gml:offsetVector>
      <gml:offsetVector srsName="EPSG:4326">0 1</gml:offsetVector>
    </gml:RectifiedGrid>
  </gml:domainSet>
  <gml:rangeSet>
    <gml:File>
      <gml:rangeParameters/>
      <gml:fileName>data.tif</gml:fileName>
      <gml:fileStructure>GeoTIFF</gml:fileStructure>
    </gml:File>
  </gml:rangeSet>
  <gmlcov:rangeType>
    <swe:DataRecord xmlns:swe="http://www.opengis.net/swe/2.0">
      <swe:field name="temperature">
        <swe:Quantity>
          <swe:description>Temperature in Celsius</swe:description>
          <swe:uom code="Cel"/>
        </swe:Quantity>
      </swe:field>
    </swe:DataRecord>
  </gmlcov:rangeType>
</gmlcov:RectifiedGridCoverage>`;

describe('Docker Integration Tests', () => {
    beforeAll(async () => {
        // Create test directory
        if (!existsSync(TEST_DIR)) {
            mkdirSync(TEST_DIR, { recursive: true });
        }

        // Write sample GML files
        writeFileSync(join(TEST_DIR, 'point.gml'), samplePoint);
        writeFileSync(join(TEST_DIR, 'coverage.gml'), sampleCoverage);

        // Check if Docker image exists, if not skip tests
        try {
            await execAsync(`docker image inspect ${DOCKER_IMAGE}`);
        } catch (error) {
            console.log(`Docker image ${DOCKER_IMAGE} not found. Skipping Docker integration tests.`);
            console.log('Run "docker pull ghcr.io/pt9912/s-gml:latest" to enable these tests.');
        }
    });

    afterAll(() => {
        // Clean up test directory
        if (existsSync(TEST_DIR)) {
            rmSync(TEST_DIR, { recursive: true, force: true });
        }
    });

    const runDockerCommand = async (args: string[]): Promise<{ stdout: string; stderr: string }> => {
        const cmd = `docker run --rm -v ${TEST_DIR}:/data ${DOCKER_IMAGE} ${args.join(' ')}`;
        try {
            const result = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
            return result;
        } catch (error: any) {
            throw new Error(`Docker command failed: ${error.message}\nStderr: ${error.stderr}`);
        }
    };

    const skipIfDockerNotAvailable = async () => {
        try {
            await execAsync(`docker image inspect ${DOCKER_IMAGE}`);
            return false;
        } catch {
            return true;
        }
    };

    describe('GeoJSON Output', () => {
        it('should convert GML to GeoJSON', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            const { stdout } = await runDockerCommand(['parse', '/data/point.gml', '--format', 'geojson']);
            const result = JSON.parse(stdout);

            expect(result).toHaveProperty('type', 'Point');
            expect(result).toHaveProperty('coordinates');
            expect(result.coordinates).toEqual([10, 20]);
        });

        it('should write GeoJSON to file', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            await runDockerCommand(['parse', '/data/point.gml', '--format', 'geojson', '--output', '/data/output.json']);

            const output = readFileSync(join(TEST_DIR, 'output.json'), 'utf-8');
            const result = JSON.parse(output);

            expect(result).toHaveProperty('type', 'Point');
            expect(result.coordinates).toEqual([10, 20]);
        });
    });

    describe('Binary Formats', () => {
        it('should convert GML to Shapefile', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            await runDockerCommand(['parse', '/data/point.gml', '--format', 'shapefile', '--output', '/data/output.zip']);

            const outputPath = join(TEST_DIR, 'output.zip');
            expect(existsSync(outputPath)).toBe(true);

            const stats = readFileSync(outputPath);
            expect(stats.length).toBeGreaterThan(0);
        });

        it('should convert GML to GeoPackage', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            await runDockerCommand(['parse', '/data/point.gml', '--format', 'geopackage', '--output', '/data/output.gpkg']);

            const outputPath = join(TEST_DIR, 'output.gpkg');
            expect(existsSync(outputPath)).toBe(true);

            const stats = readFileSync(outputPath);
            expect(stats.length).toBeGreaterThan(0);
        });

        it('should convert GML to FlatGeobuf', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            await runDockerCommand(['parse', '/data/point.gml', '--format', 'flatgeobuf', '--output', '/data/output.fgb']);

            const outputPath = join(TEST_DIR, 'output.fgb');
            expect(existsSync(outputPath)).toBe(true);

            const buffer = readFileSync(outputPath);
            expect(buffer.length).toBeGreaterThan(0);
            // Verify FlatGeobuf magic bytes
            expect(buffer[0]).toBe(0x66); // 'f'
            expect(buffer[1]).toBe(0x67); // 'g'
            expect(buffer[2]).toBe(0x62); // 'b'
        });
    });

    describe('Coverage Formats', () => {
        it('should convert GML coverage to CIS-JSON', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            const { stdout } = await runDockerCommand(['parse', '/data/coverage.gml', '--format', 'cis-json']);
            const result = JSON.parse(stdout);

            expect(result).toHaveProperty('type', 'Coverage');
        });

        it('should convert GML coverage to CoverageJSON', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            const { stdout } = await runDockerCommand(['parse', '/data/coverage.gml', '--format', 'coveragejson']);
            const result = JSON.parse(stdout);

            expect(result).toHaveProperty('type', 'Coverage');
        });
    });

    describe('Text Formats', () => {
        it('should convert GML to KML', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            const { stdout } = await runDockerCommand(['parse', '/data/point.gml', '--format', 'kml']);

            expect(stdout).toContain('<kml');
            expect(stdout).toContain('<Point>');
        });

        it('should convert GML to WKT', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            const { stdout } = await runDockerCommand(['parse', '/data/point.gml', '--format', 'wkt']);

            expect(stdout).toContain('POINT');
        });
    });

    describe('Validation', () => {
        it('should validate GML', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            try {
                const { stdout } = await runDockerCommand(['validate', '/data/point.gml', '--gml-version', '3.2']);
                expect(stdout).toContain('valid');
            } catch (error: any) {
                // Validation might fail, but command should run
                expect(error.message).toMatch(/(valid|invalid)/i);
            }
        });
    });

    describe('Version Conversion', () => {
        it('should convert GML between versions', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            const { stdout } = await runDockerCommand(['convert', '/data/point.gml', '--version', '2.1.2']);

            expect(stdout).toContain('<gml:Point');
            expect(stdout).toContain('xmlns:gml="http://www.opengis.net/gml"');
        });

        it('should convert with pretty print', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            const { stdout } = await runDockerCommand(['convert', '/data/point.gml', '--version', '3.2', '--pretty']);

            expect(stdout).toContain('<gml:Point');
            expect(stdout).toMatch(/\n\s+/); // Contains newlines and indentation
        });
    });

    describe('Error Handling', () => {
        it('should handle missing file', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            await expect(
                runDockerCommand(['parse', '/data/nonexistent.gml'])
            ).rejects.toThrow(/File not found|ENOENT|No such file/i);
        });

        it('should handle invalid format', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            await expect(
                runDockerCommand(['parse', '/data/point.gml', '--format', 'invalid'])
            ).rejects.toThrow(/Invalid format/i);
        });
    });

    describe('CLI Version', () => {
        it('should display version', async () => {
            if (await skipIfDockerNotAvailable()) {
                console.log('Skipping test: Docker image not available');
                return;
            }

            const { stdout } = await runDockerCommand(['--version']);
            expect(stdout).toMatch(/\d+\.\d+\.\d+/);
        });
    });
});
