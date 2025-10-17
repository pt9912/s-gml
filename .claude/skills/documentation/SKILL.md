---
name: Documentation Manager
description: Verwaltet und aktualisiert die Dokumentation für s-gml. Nutze diesen Skill, wenn neue Features hinzugefügt, APIs geändert oder Dokumentation aktualisiert werden muss.
---

# Documentation Manager Skill

## Zweck

Dieser Skill stellt sicher, dass die Dokumentation immer aktuell bleibt, wenn Code-Änderungen vorgenommen werden.

## Wann dieser Skill aufgerufen wird

Claude sollte diesen Skill **automatisch** verwenden in folgenden Situationen:

- Nach Hinzufügen neuer Builder-Klassen
- Nach Hinzufügen neuer Geometrie-Typen
- Nach API-Änderungen (neue Methoden, geänderte Signaturen)
- Nach Hinzufügen neuer Features
- Wenn der Nutzer explizit um Dokumentations-Updates bittet
- Nach größeren Refactorings

## Anweisungen

### 1. Code-Änderungen analysieren

Prüfe, welche Art von Änderungen vorgenommen wurden:
- **Neue Klassen**: Builder, Parser, Utilities
- **Neue Public APIs**: Exportierte Funktionen/Methoden
- **Breaking Changes**: API-Änderungen, die bestehenden Code brechen
- **Neue Features**: Funktionalität, die Nutzer verwenden können

### 2. TSDoc-Kommentare hinzufügen/aktualisieren

**Für neue oder geänderte Klassen/Methoden:**

- Verwende die Beispiele aus `docs/guides/tsdoc-examples.md` als Vorlage
- Füge vollständige TSDoc-Kommentare hinzu mit:
  - Beschreibung (Was macht die Methode/Klasse?)
  - `@param` für alle Parameter (mit Typ und Beschreibung)
  - `@returns` für Rückgabewerte
  - `@throws` für mögliche Exceptions
  - `@example` mit praktischem Code-Beispiel
  - `@public`, `@category` Tags

**Beispiel für neue Methode:**
```typescript
/**
 * Parsed ein Custom-Format aus GML.
 *
 * @param xml - GML XML-String
 * @param options - Custom-Optionen für das Parsing
 * @returns Promise mit Custom-Format-Objekt
 *
 * @throws {Error} Bei ungültigem XML
 *
 * @example
 * ```typescript
 * const parser = new GmlParser();
 * const result = await parser.parseCustom(gmlXml, { format: 'custom' });
 * ```
 *
 * @public
 * @category Parser
 */
```

### 3. README.md aktualisieren

**Bei neuen Features:**
- Füge Feature zur Feature-Liste hinzu (mit ✅)
- Füge Verwendungs-Beispiel zur Usage-Sektion hinzu
- Aktualisiere API-Tabellen falls nötig

**Bei neuen Buildern:**
- Füge Builder zur Builder-Tabelle hinzu
- Füge Verwendungs-Beispiel hinzu
- Aktualisiere die "Verfügbare Builder" Liste

**Bei Breaking Changes:**
- Füge Hinweis zur README hinzu
- Dokumentiere Migration-Path

### 4. CONTRIBUTING.md aktualisieren

**Bei Architektur-Änderungen:**
- Aktualisiere Projektstruktur-Diagramme
- Aktualisiere Code-Beispiele

**Bei neuen Patterns:**
- Füge Tutorial für neues Pattern hinzu
- Aktualisiere Best Practices

### 5. Architektur-Dokumentation aktualisieren

**Bei neuen Klassen/Komponenten:**
- Aktualisiere `docs/architecture/class-diagram.md`
- Füge neue Klasse zum Mermaid-Diagramm hinzu
- Aktualisiere Interaktions-Matrix

**Bei Workflow-Änderungen:**
- Aktualisiere `docs/architecture/system-overview.md`
- Aktualisiere Datenfluss-Diagramme
- Aktualisiere Sequenz-Diagramme

### 6. API-Dokumentation neu generieren

**Immer nach TSDoc-Änderungen:**
```bash
pnpm run docs:build
```

**Prüfe generierte Dokumentation:**
- Öffne `docs/api/index.html` im Browser
- Verifiziere, dass neue APIs sichtbar sind
- Prüfe, dass Kategorisierung korrekt ist

### 7. CHANGELOG.md vorbereiten

**Für den nächsten Release:**
- Füge Notiz zu CHANGELOG.md hinzu unter "Unreleased"
- Kategorisiere Änderung:
  - **Added**: Neue Features
  - **Changed**: API-Änderungen
  - **Fixed**: Bugfixes
  - **Deprecated**: Bald entfernte Features

Beispiel:
```markdown
## [Unreleased]

### Added
- Neuer `MyFormatBuilder` für Custom-Format-Output
- `parseCustom()` Methode zum GmlParser

### Changed
- `Builder` Interface erweitert um `buildCustomGeometry()` Methode
```

### 8. Dokumentations-Checkliste

Verwende diese Checkliste für jede Code-Änderung:

```
Dokumentation Update Checklist:
□ TSDoc-Kommentare für neue/geänderte Public APIs
□ README.md Features/Usage aktualisiert
□ CONTRIBUTING.md bei Architektur-Änderungen aktualisiert
□ Architektur-Diagramme aktualisiert (falls nötig)
□ API-Dokumentation neu generiert (pnpm run docs:build)
□ CHANGELOG.md "Unreleased" Sektion aktualisiert
□ Code-Beispiele in README getestet
□ Breaking Changes dokumentiert
```

## Spezielle Szenarien

### Neuen Builder hinzugefügt

1. TSDoc-Kommentare zur Builder-Klasse hinzufügen
2. Beispiel zu `docs/guides/tsdoc-examples.md` hinzufügen
3. README.md:
   - Füge Builder zur Tabelle in "Output-Formate" hinzu
   - Füge Verwendungs-Beispiel hinzu
4. CONTRIBUTING.md:
   - Aktualisiere Builder-Liste im Tutorial
5. Architektur-Diagramme:
   - Füge Builder zu `class-diagram.md` hinzu
   - Füge Builder zu `system-overview.md` Transformation-Layer hinzu
6. Generiere API-Docs neu: `pnpm run docs:build`
7. CHANGELOG.md: Füge unter "Added" hinzu

### Neue Geometrie-Typ hinzugefügt

1. TSDoc-Kommentare zu Type-Definition in `types.ts`
2. TSDoc-Kommentare zu Parser-Methode
3. README.md:
   - Füge Geometrie zur unterstützten Elemente-Tabelle hinzu
   - Füge Parsing-Beispiel hinzu
4. CONTRIBUTING.md:
   - Aktualisiere "Unterstützte Geometrie-Typen" Liste
5. Generiere API-Docs neu
6. CHANGELOG.md: Füge unter "Added" hinzu

### API Breaking Change

1. TSDoc mit `@deprecated` für alte API
2. TSDoc für neue API
3. README.md:
   - Füge **Breaking Changes** Sektion hinzu
   - Dokumentiere Migration-Path
4. CHANGELOG.md:
   - Füge unter "Changed" oder neue "Breaking Changes" Sektion hinzu
   - Erkläre Migration-Path
5. Erstelle Migration-Guide in `docs/guides/` (bei größeren Changes)
6. Generiere API-Docs neu

### Performance-Verbesserung

1. README.md:
   - Aktualisiere Performance-Benchmarks (falls vorhanden)
2. `docs/architecture/system-overview.md`:
   - Aktualisiere Performance-Tabelle
   - Aktualisiere Empfehlungen
3. CHANGELOG.md: Füge unter "Changed" oder "Performance" hinzu

## Validierung

Nach jedem Dokumentations-Update:

1. **Build-Check**: `pnpm run build` muss erfolgreich sein
2. **Docs-Check**: `pnpm run docs:generate` darf keine Errors werfen
3. **Link-Check**: Alle Links in Markdown-Dateien prüfen
4. **Code-Examples**: Beispiele in README.md testen (Kopieren → Ausführen)
5. **Mermaid-Check**: Diagramme in Mermaid Live Editor validieren

## Integration mit anderen Skills

- **Release Skill**: Vor jedem Release sollte dieser Skill automatisch laufen
- **Actions Monitor**: Nach Docs-Update GitHub Actions überwachen

## Fehlerbehandlung

- Falls TypeDoc Errors wirft: TSDoc-Syntax in betroffenen Dateien prüfen
- Falls Mermaid-Diagramme nicht rendern: Syntax in Mermaid Live Editor testen
- Falls Links broken: Dateipfade und URLs prüfen

## Tools

- Read: Existierende Dokumentation lesen
- Write/Edit: Dokumentation aktualisieren
- Bash: `pnpm run docs:build`, `pnpm test` ausführen
- TodoWrite: Dokumentations-Checkliste tracken

## Best Practices

1. **Immer Code-Beispiele hinzufügen**: Praktische Beispiele > theoretische Beschreibungen
2. **User-First**: Aus Nutzer-Perspektive schreiben, nicht aus Entwickler-Perspektive
3. **Clear and Concise**: Kurze, prägnante Beschreibungen
4. **Up-to-date**: Dokumentation gleichzeitig mit Code aktualisieren, nicht später
5. **Test Examples**: Alle Code-Beispiele in Docs müssen funktionieren

## Output-Format

Nach Dokumentations-Update zeige Zusammenfassung:

```
📚 Dokumentation aktualisiert:

✅ TSDoc-Kommentare:
  - GmlParser.parseCustom() vollständig dokumentiert
  - MyFormatBuilder Klassen-Dokumentation hinzugefügt

✅ README.md:
  - Neues Feature zu Feature-Liste hinzugefügt
  - Verwendungs-Beispiel für MyFormatBuilder hinzugefügt

✅ Architektur-Dokumentation:
  - MyFormatBuilder zu Klassen-Diagramm hinzugefügt

✅ CHANGELOG.md:
  - "Added: MyFormatBuilder für Custom-Format-Output"

✅ API-Dokumentation:
  - Neu generiert (docs/api/)

🔗 Nächste Schritte:
  - Code-Beispiele testen
  - API-Docs im Browser prüfen: open docs/api/index.html
  - Vor Release: CHANGELOG.md vervollständigen
```
