# 🚀 PWA Setup für Filament Store

Dieses Verzeichnis enthält alle Dateien für die Progressive Web App (PWA) Funktionalität.

---

## 📁 PWA-Dateien

| Datei | Beschreibung |
|-------|--------------|
| `manifest.json` | App-Metadaten (Name, Icons, Theme, Display-Modus) |
| `sw.js` | Service Worker für Offline-Funktionalität & Caching |
| `pwa-install.js` | Hilfsfunktionen für Installation & Updates |
| `icon-generator.html` | Tool zum Generieren der App-Icons |

---

## ⚡ Features

### ✅ Bereits implementiert:
- [x] **Web App Manifest** — Installierbar auf Homescreen
- [x] **Service Worker** — Offline-Nutzung, Caching
- [x] **Install Prompt** — "Zum Homescreen hinzufügen" Banner
- [x] **Update-Handling** — Automatische Update-Benachrichtigung
- [x] **Apple Meta Tags** — iOS Safari Support

### 📱 PWA-Fähigkeiten:
- **Standalone Display** — Ohne Browser-Chrome
- **Splash Screen** — Beim App-Start
- **Offline-First** — Funktioniert ohne Internet
- **Background Sync** — Daten werden synchronisiert wenn online
- **Push Notifications** — Für niedrigen Bestand (vorbereitet)

---

## 🎨 Icon-Generierung

1. Öffne `icon-generator.html` im Browser
2. Klicke auf "Alle herunterladen"
3. Speichere die PNGs im `icons/` Ordner

**Benötigte Größen:** 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

---

## 📲 Installation

### Android (Chrome):
1. Öffne die App im Browser
2. Warte auf den Install-Banner oder öffne das Menü (⋮)
3. "Zum Startbildschirm hinzufügen"

### iOS (Safari):
1. Öffne die App in Safari
2. Tippe auf "Teilen" (□↑)
3. "Zum Home-Bildschirm"

### Desktop (Chrome/Edge):
1. Öffne die App
2. Klicke auf das 📲 Icon in der Adressleiste
3. "Installieren"

---

## 🔧 HTML Integration

Füge in den `<head>` deiner HTML-Datei ein:

```html
<!-- PWA Manifest -->
<link rel="manifest" href="manifest.json">

<!-- Icons -->
<link rel="icon" type="image/png" sizes="72x72" href="icons/icon-72x72.png">
<link rel="apple-touch-icon" sizes="192x192" href="icons/icon-192x192.png">

<!-- Apple Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Filament Store">
```

Füge vor `</body>` ein:

```html
<script src="pwa-install.js"></script>
```

---

## 🔄 Updates

Wenn du eine neue Version veröffentlichst:

1. Ändere die Version im Service Worker:
   ```javascript
   const CACHE_NAME = 'filament-store-v2'; // Version erhöhen
   ```

2. Der Service Worker erkennt automatisch Änderungen

3. User bekommen eine "Neue Version verfügbar" Benachrichtigung

4. Ein Klick auf "Aktualisieren" lädt die neue Version

---

## 🐛 Troubleshooting

### Service Worker wird nicht registriert
- HTTPS erforderlich (außer localhost)
- Browser-Konsole öffnen für Fehlermeldungen
- `chrome://serviceworker-internals/` (Chrome Dev Tools)

### App erscheint nicht als installierbar
- Manifest.json muss valide sein (testen mit: https://manifest-validator.appspot.com/)
- Icons müssen alle vorhanden sein
- Service Worker muss registriert sein

### Offline funktioniert nicht
- Cache Storage prüfen in DevTools → Application → Cache Storage
- Service Worker muss "activated" sein
- "Update on reload" aktivieren für Entwicklung

---

## 📊 PWA Checkliste

- [ ] HTTPS aktiviert (für Production)
- [ ] Manifest.json valide
- [ ] Alle Icon-Größen vorhanden
- [ ] Service Worker registriert
- [ ] Offline-Funktionalität getestet
- [ ] iOS Meta Tags gesetzt
- [ ] Install-Prompt funktioniert
- [ ] Update-Mechanismus getestet

---

## 🔗 Nützliche Tools

- **Manifest Validator:** https://manifest-validator.appspot.com/
- **PWA Builder:** https://www.pwabuilder.com/
- **Lighthouse:** Chrome DevTools → Audits → PWA
- **Can I Use:** https://caniuse.com/?search=serviceworker

---

## 📝 Lighthouse Score Ziele

| Kategorie | Ziel |
|-----------|------|
| PWA | 100% |
| Performance | >90% |
| Accessibility | >90% |
| Best Practices | >90% |
| SEO | >90% |
