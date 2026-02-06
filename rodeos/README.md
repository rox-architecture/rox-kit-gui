# RODEOS - Semantische Modellierung & Wissensgraph-Toolkit für Robotik-Assets

RODEOS (Robotics Open Data and Ecosystem Ontology System) ist ein Toolkit zur strukturierten Beschreibung von Robotik- und Automatisierungs-Assets. Es ermöglicht die Erstellung validierter semantischer Modell-Instanzen über eine interaktive UI oder Batch-Generierung und deren Transformation in Wissensgraphen für die Analyse in Gephi.

## Schnellstart

```bash
# UI starten (interaktive Modellierung)
uv run streamlit run ui.py
```

---

## Das Semantische Modell verstehen

### Struktur von `semantic_model.json`

Das semantische Modell definiert eine **hierarchische Ontologie** für industrielle Robotik-Assets. Die Struktur basiert auf dem DCAT-Standard (Data Catalog Vocabulary) und erweitert diesen um robotikspezifische Konzepte.

#### Wurzelebene: `dcat:Resource`

Jedes Asset beginnt mit gemeinsamen Metadaten:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `dcterms:title` | text | Name des Assets |
| `dcterms:publisher` | text | Herausgeber/Hersteller |
| `dcterms:identifier` | text | Eindeutige Kennung |
| `dcterms:description` | text | Beschreibung |
| `dcterms:license` | anyUri | Lizenz-URL |
| `dcat:version` | text | Versionsnummer |
| `dcat:keyword` | List[text] | Schlagwörter |
| `rodeos:coreType` | enum[Dataset, Component, Service] | Kerntyp |

#### Union-Typ-Konzept

Der `rodeos:coreType` bestimmt den weiteren Pfad durch die Hierarchie:

```
dcat:Resource
├── rodeos:Dataset           → Datensätze, Streams, Endpunkte
├── rodeos:Component         → Hardware- oder Softwarekomponenten
│   ├── hardwareComponent
│   │   ├── roboter
│   │   │   ├── mobileRobot → agv, amr
│   │   │   └── stationaryRobot → parallelRobot, serielRobot
│   │   │       ├── hexapod, delta
│   │   │       └── cylindrical, articulated, scara, cartesian, polarSpherical
│   │   ├── tooling → weldingTool, gripperTool, cuttingSeparationTool, ...
│   │   ├── controller → robotController, plc, ipc
│   │   ├── sensor → visionSensor, lidarSensor, forceTorqueSensor, ...
│   │   └── workpieceComponent
│   └── softwareComponent
│       ├── robotOperationSoftware
│       ├── motionControlSoftware
│       ├── perceptionVisionSoftware
│       ├── simulationDigitalTwinSoftware
│       ├── aiAnalyticsSoftware
│       └── integrationOrchestration
└── rodeos:Service           → API-Endpunkte, Cloud-Dienste
```

#### Pfad-Konzept

Jede Instanz wird durch einen **Pfad** vom Wurzelknoten bis zum Blattknoten definiert. Beispiel für einen Knickarmroboter:

```
["dcat:Resource", "rodeos:Component", "rodeos:hardwareComponent",
 "rodeos:roboter", "rodeos:stationaryRobot", "rodeos:serielRobot", "rodeos:articulated"]
```

Jede Ebene fügt eigene **mandatory** (Pflicht-) und **optional** (optionale) Felder hinzu. Die Felder aller Ebenen im Pfad werden kumuliert.

#### Unterstützte Feldtypen

| Typ | Beschreibung | Beispiel |
|-----|--------------|----------|
| `enum[A, B, C]` | Auswahl aus festen Werten | `enum[MAG, MIG, SpotWeldingGuns]` |
| `xsd:text` | Freitext | `"KUKA KR 210"` |
| `xsd:integer` | Ganzzahl | `6` |
| `xsd:decimal` | Dezimalzahl | `2036.5` |
| `xsd:boolean` | Wahrheitswert | `true` / `false` |
| `xsd:anyUri` | URI/URL | `"https://example.com/spec"` |
| `xsd:hexBinary` | Hexadezimal | `"A1B2C3"` |
| `xsd:duration` | Zeitdauer | `"PT30M"` |
| `List[...]` | Komma-getrennte Liste | `"ros2, python, c++"` |
| `skos:concept` | Konzept-Bezeichner | `"automotive"` |
| `schema:quantitativeValue` | Strukturierter Wert | `{"value": 6, "unitCode": "AX"}` |

---

## Semantische Modelle erstellen

### Über die Streamlit UI (`ui.py`)

Die UI bietet zwei Modi zur Erstellung von Modell-Instanzen:

```bash
uv run streamlit run ui.py
```

Öffnet die Anwendung unter `http://localhost:8501`.

#### Manueller Modus

**Schritt-für-Schritt-Navigation durch die Hierarchie:**

1. **Wurzelebene**: Alle `dcat:Resource`-Pflichtfelder ausfüllen
2. **Kerntyp wählen**: `rodeos:coreType` → Dataset, Component oder Service
3. **Hierarchie durchlaufen**: Bei Component → Hardware/Software → Unterkategorien
4. **Felder ausfüllen**: Pflichtfelder (rot markiert wenn leer), optionale Felder (grau)
5. **Validierung prüfen**: Fortschrittsanzeige zeigt Vollständigkeit
6. **Export**: JSON-Download wenn alle Pflichtfelder gefüllt

**Visuelle Orientierung:**
- Linke Sidebar zeigt den aktuellen Hierarchie-Pfad als Breadcrumb
- Farbcodierung nach Hierarchieebene (blau → grün → gelb → lila)
- Pflichtfelder: rot bei leer, grün bei gefüllt
- Enum-Felder erscheinen als Dropdown-Auswahl

#### LLM-unterstützter Modus

**Natürlichsprachliche Beschreibung → automatische Formularfüllung:**

1. **Modus wählen**: "🤖 LLM-Assisted" im Dropdown oben
2. **Asset beschreiben**: Freitextfeld mit Details zum Asset
   ```
   Beispiel: "Industrieller Knickarmroboter von KUKA mit 6 Achsen,
   60kg Traglast, für Materialhandling in der Lebensmittelindustrie,
   IP67-Schutzklasse, Floor-mounted"
   ```
3. **"Generate Form Fields" klicken**: LLM analysiert Ebene für Ebene
4. **Vorgeschlagene Werte prüfen**: LLM-gefüllte Felder sind markiert
5. **Anpassen und exportieren**: Manuelle Korrektur möglich

**LLM-Konfiguration (in der Sidebar):**

| Provider | Konfiguration |
|----------|---------------|
| **Local (Ollama)** | Modell aus lokaler Liste wählen, Endpoint konfigurierbar |
| **Remote (OpenRouter)** | Modell-ID eingeben (z.B. `anthropic/claude-3.5-sonnet`), API-Key erforderlich |

**Konfidenz-basierte Navigation:**
- Konfidenz ≥80%: Automatische Auswahl, weiter zur nächsten Ebene
- Konfidenz 50-80%: Auswahl mit Hinweis zur Überprüfung
- Konfidenz <50%: Stopp, manuelle Eingabe erforderlich

#### PDF-Upload-Funktion

Technische Datenblätter können als PDF hochgeladen werden. Der extrahierte Text wird als Basis für die LLM-Analyse verwendet.

---

## Ausgabeformat

### JSON-Struktur generierter Instanzen

Jede Instanz folgt einem geschachtelten `@type` / `properties` / `child` Muster:

```json
{
  "@type": "dcat:Resource",
  "properties": {
    "dcterms:title": "KUKA AG Articulated Robot für Materialhandling",
    "dcterms:publisher": "KUKA AG",
    "dcterms:identifier": "KUKA-ART-MT-FB-001",
    "dcterms:description": "Industrieller Knickarmroboter...",
    "dcterms:license": "https://www.kuka.com/terms",
    "dcat:version": "2.1.3",
    "dcat:keyword": ["articulated robot", "material transport", "KUKA"],
    "dcat:contactPoint": "https://www.kuka.com/contact",
    "rodeos:coreType": "Component"
  },
  "child": {
    "@type": "rodeos:Component",
    "properties": {
      "rodeos:componentType": "hardwareComponent",
      "rodeos:framework": "KUKA System Software (KSS)"
    },
    "child": {
      "@type": "rodeos:hardwareComponent",
      "properties": {
        "rodeos:manufacturer": "KUKA AG"
      },
      "child": {
        "@type": "rodeos:roboter",
        "properties": {
          "rodeos:payload": 60.0,
          "rodeos:maxVelocity": 2.5,
          "rodeos:DOF": 6,
          "rodeos:operatingVoltage": 400.0,
          "rodeos:interface": "KUKA.PLC mxAutomation 2.0"
        },
        "child": {
          "@type": "rodeos:stationaryRobot",
          "properties": {
            "rodeos:mounting": "Floor-mounted",
            "rodeos:positionAccuracy": 0.05,
            "rodeos:repeatability": 0.02,
            "rodeos:isCobot": false
          },
          "child": {
            "@type": "rodeos:serielRobot",
            "child": {
              "@type": "rodeos:articulated",
              "properties": {
                "rodeos:aasSubmodel": "https://industrialdigitaltwin.org/..."
              }
            }
          }
        }
      }
    }
  }
}
```

### Verzeichnisstruktur generierter Modelle

```
assets/generated_models/
└── 2025-12-28_10-56-26/           # Zeitstempel der Generierung
    ├── metadata.json               # Generierungsstatistiken
    ├── model_0001.json             # Einzelne Modell-Instanzen
    ├── model_0002.json
    ├── ...
    ├── groups/                     # Gruppierte Assets
    │   ├── group_001/
    │   │   ├── group_metadata.json # Gemeinsamer Kontext
    │   │   ├── model_robot.json
    │   │   ├── model_gripper.json
    │   │   └── model_controller.json
    │   └── group_002/
    └── generation_log.txt          # Detailliertes Log
```

**Gruppen-Metadaten (`group_metadata.json`):**
```json
{
  "company": "Siemens",
  "industry": "Automotive assembly",
  "application": "Schweißzelle",
  "assets": [
    {"leaf": "rodeos:articulated", "file": "model_robot.json"},
    {"leaf": "rodeos:weldingTool", "file": "model_welding.json"}
  ]
}
```

## Konfiguration

### Umgebungsvariablen (`.env`)

```bash
# LLM-Provider
LLM_PROVIDER=openrouter           # oder: ollama

# Ollama (lokal)
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=llama3

# OpenRouter (cloud)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

### Abhängigkeiten installieren

```bash
# uv installiert automatisch alle Abhängigkeiten
uv sync
```

### Ollama lokal einrichten

```bash
# Ollama installieren (macOS)
brew install ollama

# Modell herunterladen
ollama pull llama3

# Server starten
ollama serve
```

## Technische Details

### Systemvoraussetzungen

- Python 3.12+
- `uv` Package Manager
- Optional: Ollama (für lokale LLM-Nutzung)
