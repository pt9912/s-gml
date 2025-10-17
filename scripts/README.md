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

---

## setup-hooks.sh

Installiert Git Hooks für das Projekt.

### Was es macht

Installiert einen **pre-push Hook**, der automatisch vor jedem `git push` ausgeführt wird:

- Führt `pnpm lint` aus
- Blockiert den Push, wenn Linting-Fehler gefunden werden
- Stellt sicher, dass nur Code mit korrekter Code-Qualität gepusht wird

### Verwendung

```bash
# Via npm script (empfohlen)
npm run setup-hooks

# Oder direkt
bash scripts/setup-hooks.sh
```

### Pre-Push Hook

Der Hook läuft automatisch bei jedem `git push`:

```
Running pre-push checks...

→ Running pnpm lint...

✅ All pre-push checks passed!
```

Falls Linting-Fehler gefunden werden:

```
Running pre-push checks...

→ Running pnpm lint...
/path/to/file.ts
  72:17  error  'error' is defined but never used  @typescript-eslint/no-unused-vars

❌ Lint failed! Please fix the linting errors before pushing.
   Run 'pnpm run lint' to see the errors.
```

### Hook umgehen (nicht empfohlen)

In Notfällen kann der Hook mit `--no-verify` umgangen werden:

```bash
git push --no-verify
```

**Achtung:** Dies sollte nur in Ausnahmefällen verwendet werden!

---

## post-push-actions-check.sh

Automatische GitHub Actions Überwachung nach `git push`.

### Was es macht

Dieses Skript wird automatisch über einen **PostToolUse Hook** nach jedem `git push` ausgeführt:

- Erkennt `git push` Befehle
- Erinnert Claude daran, GitHub Actions zu überwachen
- Aktiviert automatisch den **GitHub Actions Monitor Skill**
- Stellt sicher, dass CI/CD-Pipeline erfolgreich läuft

### Funktionsweise

Das Skript ist in `.claude/settings.json` als PostToolUse Hook konfiguriert:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash(git push*)",
        "hooks": [
          {
            "type": "command",
            "command": "bash scripts/post-push-actions-check.sh"
          }
        ]
      }
    ]
  }
}
```

### Integration mit Skills

Das Skript arbeitet zusammen mit dem **GitHub Actions Monitor Skill**:

1. **PostToolUse Hook** erkennt `git push`
2. Hook sendet Erinnerung an Claude
3. **GitHub Actions Monitor Skill** wird automatisch aktiviert
4. Skill führt `gh run watch` aus
5. Nutzer wird über Actions-Status informiert

### Beispiel-Ablauf

Nach einem `git push`:

```
Running pre-push checks...
✅ All pre-push checks passed!

To https://github.com/pt9912/s-gml.git
   abc123..def456  develop -> develop

⚠️ WICHTIG: Ein 'git push' wurde gerade ausgeführt.
🔍 Überwache GitHub Actions...

→ Running workflow...
✅ All GitHub Actions passed!
```

### Manuelle Verwendung

Das Skript kann auch manuell aufgerufen werden (für Testing):

```bash
echo '{"command":"git push"}' | bash scripts/post-push-actions-check.sh
```

### Konfiguration

Der Hook ist standardmäßig aktiviert für alle Teammitglieder über `.claude/settings.json`.

Um den Hook zu deaktivieren, kann er in der lokalen `.claude/settings.local.json` überschrieben werden.
