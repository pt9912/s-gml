import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Browser Compatibility', () => {
    describe('validator.browser.ts', () => {
        it('should not import Node.js built-in modules', () => {
            const filePath = join(__dirname, '../src/validator.browser.ts');
            const content = readFileSync(filePath, 'utf-8');

            // List of Node.js built-in modules that should NOT be in browser version
            const forbiddenImports = [
                'node:child_process',
                'node:fs',
                'node:os',
                'node:path',
                'node:http',
                'node:https',
                'node:util',
            ];

            for (const forbidden of forbiddenImports) {
                expect(content).not.toContain(`from '${forbidden}'`);
                expect(content).not.toContain(`from "${forbidden}"`);
                expect(content).not.toContain(`require('${forbidden}')`);
                expect(content).not.toContain(`require("${forbidden}")`);
            }
        });

        it('should use fetch API for HTTP requests', () => {
            const filePath = join(__dirname, '../src/validator.browser.ts');
            const content = readFileSync(filePath, 'utf-8');

            // Browser version should use fetch
            expect(content).toContain('fetch(');
        });

        it('should export validateGml function', async () => {
            const { validateGml } = await import('../src/validator.browser.js');
            expect(typeof validateGml).toBe('function');
        });

        it('should export test utilities', async () => {
            const { __setXsdFetcher, __clearXsdCache, __internal } = await import('../src/validator.browser.js');
            expect(typeof __setXsdFetcher).toBe('function');
            expect(typeof __clearXsdCache).toBe('function');
            expect(typeof __internal.loadXsd).toBe('function');
        });
    });

    describe('validator.node.ts', () => {
        it('should import Node.js built-in modules', () => {
            const filePath = join(__dirname, '../src/validator.node.ts');
            const content = readFileSync(filePath, 'utf-8');

            // Node version should use Node.js modules
            expect(content).toContain(`from 'node:child_process'`);
            expect(content).toContain(`from 'node:http'`);
            expect(content).toContain(`from 'node:https'`);
        });

        it('should export validateGml function', async () => {
            const { validateGml } = await import('../src/validator.node.js');
            expect(typeof validateGml).toBe('function');
        });
    });

    describe('index.ts exports', () => {
        it('should export browser validator by default', async () => {
            const indexExports = await import('../src/index.js');
            expect(typeof indexExports.validateGml).toBe('function');
        });

        it('should export GmlParser', async () => {
            const { GmlParser } = await import('../src/index.js');
            expect(typeof GmlParser).toBe('function');
        });

        it('should export OWS exception utilities', async () => {
            const { OwsExceptionError, isOwsExceptionReport, parseOwsExceptionReport } = await import('../src/index.js');
            expect(typeof OwsExceptionError).toBe('function');
            expect(typeof isOwsExceptionReport).toBe('function');
            expect(typeof parseOwsExceptionReport).toBe('function');
        });
    });

    describe('Built distribution', () => {
        it('dist/index.js should not contain direct Node.js module imports', () => {
            const distPath = join(__dirname, '../dist/index.js');
            const content = readFileSync(distPath, 'utf-8');

            // Check that Node.js modules are NOT bundled (should be external or not present)
            // The dist file should not have inline implementations of these modules
            const nodeModules = [
                'child_process',
                'fs/promises',
                'os.tmpdir',
                'path.join',
            ];

            // If these are external, they should appear as imports, not inline code
            // This is a basic check - real verification would need bundler analysis
            for (const mod of nodeModules) {
                // We expect NOT to see these as inline implementations in browser build
                const inlinePattern = new RegExp(`function ${mod.replace('/', '_')}\\(`);
                expect(content).not.toMatch(inlinePattern);
            }
        });

        it('dist/index.js should contain validateGml function', () => {
            const distPath = join(__dirname, '../dist/index.js');
            const content = readFileSync(distPath, 'utf-8');

            // Should contain the browser validator's validateGml
            expect(content).toContain('validateGml');
            expect(content).toContain('Browser-compatible version');
        });

        it('dist/cli.js should contain Node.js validator', () => {
            const distPath = join(__dirname, '../dist/cli.js');
            const content = readFileSync(distPath, 'utf-8');

            // CLI should have native xmllint support
            expect(content).toContain('validateWithNativeXmllint');
            expect(content).toContain('which xmllint');
        });
    });
});
