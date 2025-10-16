#!/usr/bin/env node

/**
 * Bump Version Script
 *
 * Aktualisiert die Version in allen relevanten Dateien:
 * - package.json
 * - Dockerfile
 * - src/cli.ts
 * - CHANGELOG.md
 *
 * Verwendung:
 *   node scripts/bump-version.js <neue-version>
 *   node scripts/bump-version.js 1.6.0
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Neue Version aus Argumenten
const newVersion = process.argv[2];

if (!newVersion) {
    console.error('❌ Fehler: Keine Version angegeben!');
    console.log('Verwendung: node scripts/bump-version.js <version>');
    console.log('Beispiel: node scripts/bump-version.js 1.6.0');
    process.exit(1);
}

// Version validieren (Format: x.y.z)
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(newVersion)) {
    console.error(`❌ Fehler: Ungültiges Versionsformat "${newVersion}"`);
    console.log('Format muss sein: x.y.z (z.B. 1.6.0)');
    process.exit(1);
}

console.log(`🚀 Aktualisiere Version auf ${newVersion}...\n`);

// Aktuelle Version aus package.json lesen
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const oldVersion = packageJson.version;

console.log(`   Alte Version: ${oldVersion}`);
console.log(`   Neue Version: ${newVersion}\n`);

if (oldVersion === newVersion) {
    console.warn('⚠️  Warnung: Neue Version ist identisch mit alter Version!');
    console.log('   Fortfahren? (Strg+C zum Abbrechen)');
}

// 1. package.json aktualisieren
console.log('📝 Aktualisiere package.json...');
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n', 'utf-8');
console.log('   ✓ package.json aktualisiert\n');

// 2. Dockerfile aktualisieren
console.log('🐳 Aktualisiere Dockerfile...');
const dockerfilePath = join(rootDir, 'Dockerfile');
let dockerfile = readFileSync(dockerfilePath, 'utf-8');
dockerfile = dockerfile.replace(
    /LABEL org\.opencontainers\.image\.version="[^"]+"/,
    `LABEL org.opencontainers.image.version="${newVersion}"`
);
writeFileSync(dockerfilePath, dockerfile, 'utf-8');
console.log('   ✓ Dockerfile aktualisiert\n');

// 3. src/cli.ts aktualisieren
console.log('⚙️  Aktualisiere src/cli.ts...');
const cliPath = join(rootDir, 'src', 'cli.ts');
let cliContent = readFileSync(cliPath, 'utf-8');
cliContent = cliContent.replace(
    /\.version\('[^']+', '-V, --version'\)/,
    `.version('${newVersion}', '-V, --version')`
);
writeFileSync(cliPath, cliContent, 'utf-8');
console.log('   ✓ src/cli.ts aktualisiert\n');

// 4. CHANGELOG.md aktualisieren
console.log('📋 Aktualisiere CHANGELOG.md...');
const changelogPath = join(rootDir, 'CHANGELOG.md');
let changelog = readFileSync(changelogPath, 'utf-8');

// Aktuelles Datum im Format YYYY-MM-DD
const today = new Date().toISOString().split('T')[0];

// Neue Sektion am Anfang hinzufügen (nach dem Header)
const newSection = `## [${newVersion}] - ${today}

### Added
- TODO: Neue Features hinzufügen

### Changed
- TODO: Änderungen dokumentieren

### Fixed
- TODO: Bugfixes dokumentieren

`;

// Finde die erste Version-Sektion und füge davor ein
const firstVersionMatch = changelog.match(/## \[\d+\.\d+\.\d+\]/);
if (firstVersionMatch) {
    const insertPos = changelog.indexOf(firstVersionMatch[0]);
    changelog = changelog.slice(0, insertPos) + newSection + changelog.slice(insertPos);
} else {
    // Falls keine Version gefunden, nach "# Changelog" einfügen
    changelog = changelog.replace(/# Changelog\n+/, `# Changelog\n\n${newSection}`);
}

// Link-Referenz am Ende hinzufügen
const linkSection = `[${newVersion}]: https://github.com/pt9912/s-gml/compare/v${oldVersion}...v${newVersion}`;
if (!changelog.includes(linkSection)) {
    // Finde die erste Link-Referenz und füge davor ein
    const firstLinkMatch = changelog.match(/\[\d+\.\d+\.\d+\]: https/);
    if (firstLinkMatch) {
        const insertPos = changelog.indexOf(firstLinkMatch[0]);
        changelog = changelog.slice(0, insertPos) + linkSection + '\n' + changelog.slice(insertPos);
    } else {
        // Falls keine Links vorhanden, am Ende hinzufügen
        changelog += '\n' + linkSection + '\n';
    }
}

writeFileSync(changelogPath, changelog, 'utf-8');
console.log('   ✓ CHANGELOG.md aktualisiert\n');

console.log('✅ Version erfolgreich auf', newVersion, 'aktualisiert!\n');
console.log('📝 Nächste Schritte:');
console.log('   1. CHANGELOG.md bearbeiten und TODOs ersetzen');
console.log('   2. Tests ausführen: npm test');
console.log('   3. Build erstellen: npm run build');
console.log('   4. Änderungen committen: git add . && git commit -m "chore: release v' + newVersion + '"');
console.log('   5. Tag erstellen: git tag v' + newVersion);
console.log('   6. Pushen: git push && git push --tags');
