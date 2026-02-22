# 🧵 Filament Manager Pro

Ein browserbasierter 3D-Drucker Filament Manager mit Barcode-Scanning, Lager-Verwaltung und Projekt-Tracking.

## ✨ Features

- 📷 **Barcode-Scanning** - Per Kamera direkt im Browser
- 📦 **Lager-Verwaltung** - Verwalte deine Filament-Spulen
- 📊 **Statistiken** - Verbrauch, Material-Übersicht
- 📱 **Mobile-First** - Optimiert für Smartphone/Tablet
- 🏷️ **Etiketten-Druck** - QR-Code Etiketten für Spulen
- 💾 **Offline-First** - Daten werden lokal im Browser gespeichert (IndexedDB)
- 🔍 **Filter & Suche** - Nach Material, Hersteller, Farbe

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

1. Klicke auf **"Scannen"** um einen Barcode zu scannen
2. Oder **"Manuell"** um Daten einzugeben
3. Material, Farbe, Gewicht und Hersteller eintragen
4. Speichern

### Projekt anlegen

1. Wechsle zum Tab **"Projekte"**
2. Klicke auf **"+ Neues Projekt"**
3. Projekt-Details und benötigtes Material eintragen
4. Das System berechnet automatisch ob genug Filament vorhanden ist

### Etiketten drucken

1. Bei einer Spule auf **"Etikett"** klicken
2. QR-Code wird generiert
3. Drucken (optimiert für 62x29mm Etiketten)

## 🛠️ Technologien

- **HTML5** - Struktur & Semantik
- **Tailwind CSS** - Styling (via CDN)
- **Dexie.js** - IndexedDB Wrapper für lokale Speicherung
- **html5-qrcode** - Barcode/QR-Code Scanning
- **QRCode.js** - QR-Code Generierung

## 📱 Browser-Unterstützung

- ✅ Chrome/Edge (empfohlen)
- ✅ Firefox
- ✅ Safari (iOS)
- ⚠️ Barcode-Scanning benötigt Kamera-Zugriff

## 🔒 Datenschutz

Alle Daten werden **lokal in deinem Browser** gespeichert (IndexedDB). Keine Daten werden an Server übertragen.

## 📝 Backup & Restore

Daten können exportiert/importiert werden:
- **Export**: Einstellungen → "Daten exportieren" (JSON)
- **Import**: Einstellungen → "Daten importieren"

## 🐛 Bekannte Probleme

- Barcode-Scanning funktioniert nicht in allen Lichtverhältnissen
- Bei sehr großen Datenmengen (>1000 Spulen) kann die Performance nachlassen

## 🔮 Roadmap

- [ ] Multi-User Support (lokale Benutzer)
- [ ] Cloud-Sync (optional)
- [ ] Filament-Preis-Tracking
- [ ] Verbrauchs-Prognosen
- [ ] Integration mit OctoPrint

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

## 🤝 Mitwirken

Pull Requests sind willkommen! Für größere Änderungen bitte erst ein Issue öffnen.

---

**Made with ❤️ for the 3D printing community**
