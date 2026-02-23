# 🧵 Filatest Pro

Ein browserbasierter 3D-Drucker Filament Manager mit Cloud-Synchronisation, Barcode-Scanning und Lager-Verwaltung.

## ✨ Features

- ☁️ **Cloud-Sync** - Daten werden in Firebase gespeichert (geräteübergreifend)
- 📷 **Barcode-Scanning** - Per Kamera direkt im Browser
- 📦 **Lager-Verwaltung** - Verwalte deine Filament-Spulen
- 📊 **Statistiken** - Verbrauch, Material-Übersicht
- 📱 **Mobile-First** - Optimiert für Smartphone/Tablet
- 🏷️ **Etiketten-Druck** - QR-Code Etiketten für Spulen
- 💾 **Offline-First** - Funktioniert auch ohne Internet
- 🔍 **Filter** - Nach Material filtern
- ⚖️ **Tara-Assistent** - Automatische Tara-Berechnung für verschiedene Hersteller

## 🚀 Schnellstart

### Option 1: Direkte Nutzung (GitHub Pages)

Öffne einfach die App im Browser:

```
https://jechbuer.github.io/Filatest/
```

### Option 2: Lokal nutzen

```bash
git clone https://github.com/jechbuer/Filatest.git
cd Filatest

# Einfachen Server starten (Python)
python -m http.server 8000

# Oder mit Node.js
npx serve .
```

Dann im Browser öffnen: `http://localhost:8000`

## 📋 Anwendung

### Filament hinzufügen

1. Klicke auf **"➕ Neues Filament"**
2. Hersteller auswählen (Tara wird automatisch gesetzt)
3. Material und Farbe eingeben
4. Brutto-Gewicht (Spule + Filament) eingeben
5. Netto-Gewicht wird automatisch berechnet
6. **"In Cloud speichern"** klicken

### Verbrauch buchen

1. Bei einer Spule auf **"📉"** (Verbrauch) klicken
2. Verbrauchte Menge eingeben
3. Optional: Notiz hinzufügen
4. **"Buchen"** klicken

### Barcode scannen

1. **"📷 Scan"** Button klicken
2. Barcode/QR-Code in den Rahmen halten
3. Automatisch wird das Filament gefunden oder ein neues angelegt

### Backup erstellen

1. Oben rechts auf **"💾"** (Backup) klicken
2. JSON-Datei wird heruntergeladen

## 🛠️ Technologien

- **HTML5** - Struktur & Semantik
- **Tailwind CSS** - Styling (via CDN)
- **Firebase** - Cloud-Datenbank & Echtzeit-Sync
- **Dexie.js** - Lokale IndexedDB (Offline-Support)
- **html5-qrcode** - Barcode/QR-Code Scanning
- **QRCode.js** - QR-Code Generierung

## 📁 Projektstruktur

```
Filatest/
├── index.html              # Haupt-HTML
├── css/
│   └── styles.css          # Styles
├── js/
│   ├── config/
│   │   ├── firebase.js     # Firebase Config
│   │   └── constants.js    # Konstanten
│   ├── services/
│   │   ├── db.js           # Filament-Service
│   │   └── masterData.js   # Stammdaten-Service
│   ├── ui/
│   │   ├── components.js   # UI-Komponenten
│   │   └── scanner.js      # Barcode Scanner
│   └── app.js              # Hauptanwendung
├── manifest.json           # PWA Manifest
├── sw.js                   # Service Worker
└── pwa-install.js          # PWA Installations-Logik
```

## 🔥 Firebase Einrichtung

Die App verwendet Firebase für die Datenspeicherung:

1. Firebase Projekt erstellen: https://console.firebase.google.com
2. Firestore-Datenbank aktivieren
3. Firebase Config in `js/config/firebase.js` eintragen

### Firebase Collections

- **Filatest** - Filament-Daten
- **Materials** - Material-Stammdaten
- **Brands** - Hersteller-Stammdaten
- **SpoolTypes** - Spulentypen

## 📱 Browser-Unterstützung

- ✅ Chrome/Edge (empfohlen)
- ✅ Firefox
- ✅ Safari (iOS)
- ✅ Chrome (Android)
- ⚠️ Barcode-Scanning benötigt Kamera-Zugriff

## 🔒 Datenschutz

- Alle Daten werden in **Firebase Firestore** gespeichert
- Daten sind nur für dich sichtbar (Firestore Security Rules)
- Keine Weitergabe an Dritte

## 📝 Backup & Restore

- **Export**: Backup-Button klicken → JSON-Datei wird heruntergeladen
- **Wiederherstellen**: Aktuell manuell über Firebase Console

## 🐛 Bekannte Probleme

- Barcode-Scanning funktioniert nicht in allen Lichtverhältnissen
- Bei sehr großen Datenmengen (>1000 Spulen) kann die Performance nachlassen

## 🔮 Roadmap

- [ ] Authentifizierung (Benutzer-Login)
- [ ] Mehrere Benutzer/Teams
- [ ] Projekt-Verwaltung
- [ ] Verbrauchs-Historie
- [ ] Niedriger-Bestand Warnungen
- [ ] Material-Profile für Drucker
- [ ] Preis-Tracking
- [ ] Integration mit OctoPrint

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

## 🤝 Mitwirken

Pull Requests sind willkommen! Für größere Änderungen bitte erst ein Issue öffnen.

---

**Made with ❤️ for the 3D printing community**
