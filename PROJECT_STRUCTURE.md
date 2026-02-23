# Filatest - Projektstruktur

## Übersicht

Das Projekt wurde modularisiert und verwendet jetzt eine saubere Trennung von HTML, CSS und JavaScript. Die Stammdaten (Materialien, Hersteller, Spulentypen) werden nun in Firebase gespeichert.

## Verzeichnisstruktur

```
Filatest/
├── index.html              # Haupt-HTML (schlank, lädt Module)
├── css/
│   └── styles.css          # Alle Styles zentralisiert
├── js/
│   ├── config/
│   │   ├── firebase.js     # Firebase Initialisierung
│   │   └── constants.js    # Konstanten & Defaults
│   ├── services/
│   │   ├── db.js           # Filament-Service (CRUD)
│   │   └── masterData.js   # Stammdaten-Service
│   ├── ui/
│   │   ├── components.js   # UI-Komponenten
│   │   └── scanner.js      # Barcode Scanner
│   └── app.js              # Hauptanwendung
├── manifest.json           # PWA Manifest
├── sw.js                   # Service Worker
├── pwa-install.js          # PWA Installations-Logik
└── icons/                  # App-Icons
```

## Module

### 1. Konfiguration (`js/config/`)

#### `firebase.js`
- Firebase Initialisierung
- Verbindungsmanagement
- Export: `initFirebase()`, `getDb()`

#### `constants.js`
- Tara-Datenbank (Hersteller-Gewichte)
- Standard-Materialien
- Spulentypen
- App-Konfiguration

### 2. Services (`js/services/`)

#### `db.js` - FilamentService
Methoden:
- `getAll()` - Alle Filamente laden
- `getById(id)` - Einzelnes Filament
- `getByBarcode(barcode)` - Nach Barcode suchen
- `create(data)` - Neues Filament
- `update(id, data)` - Aktualisieren
- `delete(id)` - Löschen
- `consume(id, amount)` - Verbrauch buchen
- `onSnapshot(callback)` - Echtzeit-Updates
- `getStats()` - Statistiken
- `export()` - JSON Export

#### `masterData.js` - MasterDataService
Methoden:
- `getMaterials()` - Materialien laden
- `initializeMaterials()` - Standard-Materialien anlegen
- `addMaterial(data)` - Material hinzufügen
- `getBrands()` - Hersteller laden
- `initializeBrands()` - Standard-Hersteller anlegen
- `addBrand(data)` - Hersteller hinzufügen
- `getSpoolTypes()` - Spulentypen laden
- `loadAllMasterData()` - Alle Stammdaten laden

### 3. UI-Komponenten (`js/ui/`)

#### `components.js`
- `updateConnectionStatus(mode)` - Verbindungsstatus
- `showMessage(msg, isError)` - Nachrichten anzeigen
- `renderFilamentList(list)` - Liste rendern
- `updateMaterialSelect(materials)` - Material-Dropdown
- `updateBrandSelect(brands)` - Hersteller-Dropdown
- `renderStats(stats)` - Statistiken rendern
- `showConsumeModal(filament, callback)` - Verbrauchs-Modal

#### `scanner.js` - BarcodeScanner
Methoden:
- `start()` - Scanner starten
- `stop()` - Scanner stoppen
- `handleScan()` - Scan verarbeiten

### 4. Hauptanwendung (`js/app.js`)

Klasse `FilamentApp`:
- `init()` - App initialisieren
- `loadMasterData()` - Stammdaten laden
- `saveFilament()` - Filament speichern
- `deleteFilament(id)` - Filament löschen
- `consumeFilament(id)` - Verbrauch buchen
- `renderList()` - Liste anzeigen
- `switchTab(tab)` - Tabs wechseln

## Firebase Collections

```
Filatest/              # Filament-Daten
├── {id}
│   ├── Material
│   ├── Color
│   ├── Manufakturere
│   ├── Weightbrutto
│   ├── Spoolwright
│   ├── Weightnetto
│   ├── Zimestamp
│   ├── createdAt
│   └── updatedAt

Materials/             # Stammdaten: Materialien
├── {id}
│   ├── name
│   ├── color
│   ├── nozzleTempMin
│   ├── nozzleTempMax
│   ├── bedTempMin
│   ├── bedTempMax
│   └── isDefault

Brands/                # Stammdaten: Hersteller
├── {id}
│   ├── name
│   ├── tara
│   ├── type
│   └── isDefault

SpoolTypes/            # Stammdaten: Spulentypen
├── {id}
│   ├── name
│   ├── defaultTara
│   └── icon
```

## Features

### Bestehende Features
- ✅ Filamente hinzufügen (mit Tara-Berechnung)
- ✅ Filamente löschen
- ✅ Verbrauch buchen
- ✅ Echtzeit-Synchronisation
- ✅ Barcode-Scanning
- ✅ Backup Export (JSON)
- ✅ PWA-Support
- ✅ Responsive Design

### Neue Features durch Modularisierung
- ✅ Stammdaten in Firebase (Materialien, Hersteller)
- ✅ Erweiterbare Hersteller-Datenbank
- ✅ Bessere Code-Wartbarkeit
- ✅ Klare Trennung der Verantwortlichkeiten
- ✅ Einfacheres Testing möglich

## Browser-Kompatibilität

- Chrome/Edge (empfohlen)
- Firefox
- Safari (iOS)
- Chrome (Android)

## Entwicklung

### Lokale Entwicklung
```bash
# Einfacher HTTP-Server (Python 3)
python -m http.server 8080

# Oder mit Node.js
npx serve .
```

### Deployment
1. Firebase Projekt erstellen
2. Firestore-Datenbank einrichten
3. Firebase Config in `js/config/firebase.js` aktualisieren
4. Auf Hosting deployen (GitHub Pages, Firebase Hosting, etc.)

## Zukünftige Erweiterungen

- [ ] Authentifizierung (Benutzer-Login)
- [ ] Mehrere Benutzer/Teams
- [ ] Projekt-Verwaltung
- [ ] Verbrauchs-Historie
- [ ] Niedriger-Bestand Warnungen
- [ ] Material-Profile für Drucker
