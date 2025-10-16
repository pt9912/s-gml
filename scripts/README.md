# Scripts

## bump-version.js

Automatisches Versionsaktualisierungs-Skript für Release-Vorbereitung.

### Was es macht

Das Skript aktualisiert automatisch die Version in allen relevanten Dateien:

1. **`package.json`** - Hauptversion
2. **`Dockerfile`** - OCI Image Label
3. **`src/cli.ts`** - CLI Version Display
4. **`CHANGELOG.md`** - Neue Version-Sektion mit TODOs

### Verwendung

```bash
# Via npm script (empfohlen)
npm run version:bump 1.6.0

# Oder direkt
node scripts/bump-version.js 1.6.0
```

### Workflow für neues Release

1. **Version bumpen:**
   ```bash
   npm run version:bump 1.6.0
   ```

2. **CHANGELOG.md bearbeiten:**
   - TODOs mit tatsächlichen Änderungen ersetzen
   - Kategorien: `Added`, `Changed`, `Fixed`, `Deprecated`, `Removed`, `Security`

3. **Tests und Build:**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Git Commit und Tag:**
   ```bash
   git add .
   git commit -m "chore: release v1.6.0"
   git tag v1.6.0
   ```

5. **Pushen:**
   ```bash
   git push
   git push --tags
   ```

6. **Publish (falls npm):**
   ```bash
   npm publish
   ```

### Validierung

Das Skript validiert die Versionsnummer im Format `x.y.z` (z.B. `1.6.0`).

Ungültige Formate werden abgelehnt:
- ❌ `1.6` (fehlendes Patch)
- ❌ `v1.6.0` (v-Präfix)
- ❌ `1.6.0-beta` (Pre-Release)
- ✅ `1.6.0` (korrekt)

### Beispiel-Output

```
🚀 Aktualisiere Version auf 1.6.0...

   Alte Version: 1.5.0
   Neue Version: 1.6.0

📝 Aktualisiere package.json...
   ✓ package.json aktualisiert

🐳 Aktualisiere Dockerfile...
   ✓ Dockerfile aktualisiert

⚙️  Aktualisiere src/cli.ts...
   ✓ src/cli.ts aktualisiert

📋 Aktualisiere CHANGELOG.md...
   ✓ CHANGELOG.md aktualisiert

✅ Version erfolgreich auf 1.6.0 aktualisiert!

📝 Nächste Schritte:
   1. CHANGELOG.md bearbeiten und TODOs ersetzen
   2. Tests ausführen: npm test
   3. Build erstellen: npm run build
   4. Änderungen committen: git add . && git commit -m "chore: release v1.6.0"
   5. Tag erstellen: git tag v1.6.0
   6. Pushen: git push && git push --tags
```
