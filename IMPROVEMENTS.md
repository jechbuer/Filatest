# 🧵 Filament Store - Projektübersicht & Verbesserungsvorschläge

**Status:** ✅ Projekt angelegt in `Projects/Filament-Store/`  
**Basis:** Filament Manager Pro (HTML/JS Web-App)

---

## 📊 Aktuelle Features (Bestandsaufnahme)

### ✅ Kernfunktionen
- [x] **Barcode-Scanning** - Per Kamera im Browser
- [x] **Tara-Assistent** - Automatische Gewichtsberechnung mit Hersteller-Datenbank
- [x] **Material-Verwaltung** - PLA, PETG, ABS, TPU, ASA, Nylon, PC
- [x] **Projekt-Tracking** - Mit Materialbedarfsberechnung
- [x] **Verbrauchs-Buchung** - Mit Projekt-Zuordnung
- [x] **QR-Code Etiketten** - 62x29mm Format zum Drucken
- [x] **Statistiken** - Gesamtanzahl, Gewicht, Material-Verteilung
- [x] **Offline-First** - IndexedDB Speicherung

### ✅ UI/UX
- [x] Mobile-optimiert (Touch, Responsive)
- [x] Modal-Forms (Slide-up Animation)
- [x] Material-Filter (PLA/PETG/ABS)
- [x] Tab-Navigation (Lager/Projekte/Statistik)

---

## 🚀 Verbesserungsvorschläge

### 1. PWA (Progressive Web App) ✅ ERLEDIGT
**Status:** Implementiert in `manifest.json`, `sw.js`, `pwa-install.js`

```html
<!-- manifest.json -->
{
  "name": "Filament Store",
  "short_name": "Filament",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#3b82f6",
  "theme_color": "#3b82f6",
  "icons": [...]
}
```

**Vorteile:**
- ✅ Installierbar auf Homescreen (wie native App)
- ✅ Offline-Zugriff garantiert
- ✅ Push-Notifications möglich
- ✅ Splash Screen beim Start
- ✅ Auto-Update Benachrichtigungen

**Verwendung:**
1. Öffne `icon-generator.html` und lade Icons herunter
2. Speichere Icons in `icons/` Ordner
3. Füge `<script src="pwa-install.js"></script>` zur HTML-Datei hinzu
4. Deploy — App ist jetzt als PWA installierbar

**Dokumentation:** Siehe `PWA-README.md`

---

### 2. Daten-Export/Import
**Priorität: Hoch**

Aktuell: Daten nur lokal im Browser  
**Verbesserung:**
```javascript
// JSON Export/Import
- Backup erstellen (alle Daten als JSON)
- Import aus JSON
- CSV Export für Excel-Analyse
- Cloud-Backup (optional: GitHub Gist, Dropbox)
```

**UI:**
- Einstellungen → "Daten exportieren"
- Drag & Drop Import
- Auto-Backup täglich

---

### 3. Erweiterte Statistiken & Charts
**Priorität: Mittel**

**Ideen:**
- Verbrauchs-Trend (letzte 30 Tage)
- Kosten-Tracking (Preis pro kg eintragen)
- Beliebteste Materialien
- Druck-Historie pro Projekt
- Geschätzte Restlaufzeit ("reicht noch für ~15 Drucke")

**Technologie:** Chart.js (CDN)

---

### 4. Druck-Profile & Slicer-Integration
**Priorität: Mittel**

**Feature:**
- Profil pro Material speichern (Nozzle/Bed Temp, Speed, Retraction)
- Cura/PrusaSlicer Profile importieren
- Auto-Einstellung beim Starten eines Projekts

**UI:**
```
PLA Galaxy Black
├── Temp: 210°C / 60°C
├── Speed: 50mm/s
└── Profile: [Cura Standard] [Prusa Fast]
```

---

### 5. Spulen-Vorrat & Benachrichtigungen
**Priorität: Mittel**

**Feature:**
- Mindestbestand definieren (z.B. mind. 2x PLA Black)
- Warnung bei niedrigem Bestand
- Einkaufsliste generieren
- Preis-Tracking (historische Preise)

**UI:**
- Badge: "⚠️ Nur noch 200g PLA Black"
- Einkaufsliste mit Links zu Händlern

---

### 6. Multi-Device Sync
**Priorität: Mittel**

**Problem:** Aktuell nur lokal auf einem Gerät

**Lösungen:**
- **Option A:** GitHub Gist als Cloud-Storage (kostenlos)
- **Option B:** Firebase (kostenlos bis 10k User)
- **Option C:** File System Access API (Chrome only)

**Sync:**
- QR-Code zum Teilen der Datenbank
- Auto-Sync bei Änderungen
- Konflikt-Handling

---

### 7. Erweiterte Scan-Funktionen
**Priorität: Mittel**

**Features:**
- Batch-Scan (mehrere Spulen nacheinander)
- QR-Code statt Barcode (mehr Daten)
- Manueller Barcode-Eingang (für beschädigte Codes)
- Nachträgliches Scannen (Spule nachträglich mit Barcode versehen)

---

### 8. Dark Mode
**Priorität: Niedrig**

```css
@media (prefers-color-scheme: dark) {
  /* Dark theme styles */
}
```

Oder Toggle-Button in Einstellungen.

---

### 9. Spulen-Fotos
**Priorität: Niedrig**

- Foto der Spule beim Hinzufügen
- Vorschau in der Liste
- Farberkennung aus Foto

**Technologie:** Camera API + Canvas thumbnail

---

### 10. Community-Features
**Priorität: Niedrig**

- Filament-Bewertungen (Community-Ratings)
- Hersteller-Datenbank (crowdsourced)
- Filament-Tauschbörse (lokal)
- "Was druckst du gerade?" Feed

---

## 🔧 Technische Verbesserungen

### Code-Qualität
- [ ] Modularisierung (ES6 Module)
- [ ] State Management (zustand-lite oder ähnlich)
- [ ] TypeScript (type safety)
- [ ] Unit Tests (Jest)

### Performance
- [ ] Lazy Loading für große Listen (>100 Spulen)
- [ ] Virtual Scrolling
- [ ] Bild-Optimierung
- [ ] Service Worker für Caching

### Accessibility
- [ ] ARIA Labels
- [ ] Keyboard Navigation
- [ ] Screen Reader Support
- [ ] Hoher Kontrast Modus

---

## 📋 Roadmap-Vorschlag

### Phase 1: MVP Enhancement (1-2 Wochen)
- [ ] PWA Setup (manifest + service worker)
- [ ] Daten Export/Import (JSON)
- [ ] Bugfixes & Performance

### Phase 2: Power-User Features (2-3 Wochen)
- [ ] Erweiterte Statistiken (Chart.js)
- [ ] Druck-Profile
- [ ] Mindestbestand Warnungen

### Phase 3: Sync & Cloud (3-4 Wochen)
- [ ] Multi-Device Sync
- [ ] Cloud-Backup
- [ ] Mobile App (Capacitor)

### Phase 4: Community (später)
- [ ] Community-Features
- [ ] Hersteller-Datenbank
- [ ] API für Integrationen

---

## 🎯 Quick Wins (sofort umsetzbar)

1. **manifest.json** hinzufügen → PWA-fähig
2. **Export/Import Buttons** → Daten-Portabilität
3. **Dark Mode** → User Experience
4. **Better Search** → Suche nach Hersteller, Farbe, Material
5. **Sortierung** → Nach Gewicht, Datum, Material

---

## 💡 Ideen für Monetarisierung (optional)

- Premium-Features (Cloud-Sync, unbegrenzte Projekte)
- Affiliate-Links zu Filament-Händlern
- Sponsored Filaments (Hersteller können Produkte bewerben)

---

**Möchtest du einen dieser Punkte als nächstes umsetzen?**
