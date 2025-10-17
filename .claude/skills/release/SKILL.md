---
name: Release Manager
description: Automatisiert den vollständigen Release-Prozess für s-gml. Nutze diesen Skill, wenn der Nutzer einen neuen Release/Version erstellen möchte oder Begriffe wie "release", "version bump", "neue Version" erwähnt.
---

# Release Manager Skill

## Zweck

Dieser Skill orchestriert den kompletten Release-Prozess für das s-gml Projekt und stellt sicher, dass alle notwendigen Schritte korrekt ausgeführt werden.

## Anweisungen für Release-Prozess

Wenn der Nutzer einen Release erstellen möchte, führe folgende Schritte in dieser Reihenfolge aus:

### 1. Versionsnummer abfragen

- Frage den Nutzer nach der neuen Versionsnummer (Format: `x.y.z`, z.B. `1.8.0`)
- Validiere das Format (muss `x.y.z` entsprechen, kein `v` Präfix)

### 2. Version bumpen

- Führe aus: `npm run version:bump <version>`
- Das Skript aktualisiert automatisch:
  - `package.json`
  - `Dockerfile`
  - `src/cli.ts`
  - `CHANGELOG.md` (erstellt neue Version-Sektion mit TODOs)

### 3. CHANGELOG.md vervollständigen

- **WICHTIG:** Das bump-version Skript hat TODOs im CHANGELOG.md erstellt
- Lies git log seit dem letzten Release: `git log --oneline <last-tag>..HEAD`
- Lies die Änderungen in den relevanten Dateien
- Ersetze die TODOs durch echte Änderungen in folgenden Kategorien:
  - **Added**: Neue Features
  - **Changed**: Änderungen an bestehender Funktionalität
  - **Fixed**: Bugfixes
  - **Deprecated**: Bald entfernte Features
  - **Removed**: Entfernte Features
  - **Security**: Sicherheits-Updates
- Verwende das Format: `- Beschreibung (#PR-Nummer falls vorhanden)`

### 4. RELEASE_NOTES.md erstellen

- **WICHTIG:** Erstelle die RELEASE_NOTES.md vollständig neu
- Lies das gerade aktualisierte CHANGELOG.md für die neue Version
- Lies die aktuelle RELEASE_NOTES.md (falls vorhanden) für das Format
- Erstelle eine umfassende RELEASE_NOTES.md mit:
  - Version und Datum
  - Zusammenfassung der wichtigsten Änderungen
  - Detaillierte Beschreibung aller Features, Bugfixes, etc.
  - Upgrade-Hinweise (falls nötig)
  - Breaking Changes (falls vorhanden)
  - Test-Statistiken (falls relevant)

**Format-Vorlage:**

```markdown
# s-gml v<VERSION>

Released: <DATUM>

## Zusammenfassung

[Kurze Zusammenfassung der wichtigsten Änderungen]

## Neue Features

### Feature 1
[Detaillierte Beschreibung mit Code-Beispielen falls sinnvoll]

### Feature 2
...

## Verbesserungen

- [Verbesserung 1]
- [Verbesserung 2]

## Bugfixes

- [Fix 1]
- [Fix 2]

## Breaking Changes

[Falls vorhanden]

## Installation

```bash
npm install @npm9912/s-gml@<VERSION>
# oder
docker pull ghcr.io/pt9912/s-gml:<VERSION>
```

## Test-Statistiken

- Anzahl Tests: XXX
- Coverage: XX%

## Bekannte Einschränkungen

[Falls vorhanden]
```

### 5. Dokumentation prüfen

- **WICHTIG:** Dokumentation muss aktuell sein vor dem Release
- Führe aus: `pnpm run docs:generate`
- Falls TypeDoc Errors auftreten:
  - Zeige die Fehler an
  - Informiere den Nutzer über fehlende oder fehlerhafte TSDoc-Kommentare
  - Stoppe den Release-Prozess
- Prüfe, dass wichtige Dateien existieren und aktuell sind:
  - `docs/README.md`
  - `docs/architecture/system-overview.md`
  - `docs/architecture/class-diagram.md`
  - `docs/guides/CONTRIBUTING.md`
- Informiere, falls wichtige Dokumentation fehlt

### 6. Lint prüfen

- **WICHTIG:** Lint muss VOR den Tests ausgeführt werden
- Führe aus: `pnpm run lint`
- Falls Fehler auftreten, stoppe den Release-Prozess und informiere den Nutzer

### 7. Tests ausführen

- Führe aus: `pnpm test`
- Falls Fehler auftreten, stoppe den Release-Prozess und informiere den Nutzer

### 8. Build erstellen

- Führe aus: `pnpm run build`
- Falls Fehler auftreten, stoppe den Release-Prozess und informiere den Nutzer

### 9. Git Commit und Tag erstellen

- Führe aus: `git add .`
- Commit-Message: `chore: release v<VERSION>`
- Tag erstellen: `git tag v<VERSION>`
- Füge die übliche Co-Authored-By Signatur hinzu

### 10. Push zu GitHub

- Führe aus: `git push`
- Führe aus: `git push --tags`

### 11. GitHub Actions beobachten (develop)

- **WICHTIG:** Warte auf den Abschluss der GitHub Actions
- Führe aus: `gh run watch` um den Status zu überwachen
- Falls Actions fehlschlagen:
  - Zeige die Fehler-Logs an
  - Stoppe den Release-Prozess
  - Informiere den Nutzer über das Problem
  - Gib Hinweise zur Fehlerbehebung
  - **WICHTIG:** Merge NICHT in main, wenn Actions fehlgeschlagen sind
- Falls Actions erfolgreich sind:
  - Informiere den Nutzer über den Erfolg
  - Fahre mit dem Merge in main fort

### 12. Develop in Main mergen

- **WICHTIG:** Der Release muss auch im main Branch verfügbar sein
- Wechsle zum main Branch: `git checkout main`
- Pull neueste Änderungen: `git pull origin main`
- Merge develop in main: `git merge develop`
- Falls Merge-Konflikte auftreten:
  - Zeige die Konflikte an
  - Informiere den Nutzer
  - Bitte um manuelle Konfliktlösung
  - Warte auf Bestätigung, bevor fortgefahren wird
- Push zu main: `git push origin main`
- **WICHTIG:** Beobachte GitHub Actions für main Branch
- Führe aus: `gh run watch` um den Status zu überwachen
- Falls Actions auf main fehlschlagen:
  - Zeige die Fehler-Logs an
  - Informiere den Nutzer über das Problem
- Wechsle zurück zum develop Branch: `git checkout develop`

### 13. GitHub Release erstellen

- Führe aus: `gh release create v<VERSION> --notes-file RELEASE_NOTES.md`
- Bestätige, dass das Release erfolgreich erstellt wurde
- Zeige die Release-URL an

### 14. Zurück zu develop und synchronisieren

- **WICHTIG:** Develop und Main müssen synchron bleiben
- Wechsle zum develop Branch: `git checkout develop`
- Pull neueste Änderungen von main: `git pull origin main`
- Merge main in develop: `git merge main`
- Falls Merge-Konflikte auftreten (sollte normalerweise nicht passieren):
  - Zeige die Konflikte an
  - Informiere den Nutzer
  - Bitte um manuelle Konfliktlösung
- Push zu develop: `git push origin develop`
- Bestätige, dass develop und main jetzt synchron sind

### 15. Abschluss

- Zeige eine Zusammenfassung aller durchgeführten Schritte
- Informiere über nächste Schritte (npm Publish erfolgt automatisch via GitHub Actions)
- Zeige Links:
  - GitHub Release URL
  - GitHub Actions für develop
  - GitHub Actions für main
  - npm Package URL (nach erfolgreicher Veröffentlichung)
- Bestätige, dass develop und main synchronisiert sind

## Fehlerbehandlung

- Bei jedem Fehler: Stoppe den Prozess sofort
- Informiere den Nutzer über den Fehler
- Gib Hinweise zur Behebung
- Frage, ob der Nutzer den Prozess nach der Fehlerbeseitigung fortsetzen möchte

## Wichtige Hinweise

- Dieser Skill sollte nur im `develop` Branch ausgeführt werden
- Nach erfolgreichem Release muss `develop` in `main` gemergt werden
- Der Skill nutzt automatisch die bestehenden npm Scripts und Git Hooks
- Der Pre-Push Hook läuft automatisch und prüft Linting

## Verwendete Tools

- Bash: Für npm/git Befehle
- Read: Für das Lesen von CHANGELOG.md, git log, etc.
- Write/Edit: Für RELEASE_NOTES.md
- TodoWrite: Für Fortschrittsverfolgung des Release-Prozesses
