# Icons für Filatest Pro

## Erforderliche Icon-Größen

Für die PWA müssen folgende Icon-Größen vorhanden sein:

- `icon-72x72.png` - Android Laucher
- `icon-96x96.png` - Android Launcher
- `icon-128x128.png` - Chrome Web Store
- `icon-144x144.png` - Windows 8/10
- `icon-152x152.png` - iOS iPad
- `icon-192x192.png` - Android/iOS Home Screen
- `icon-384x384.png` - Splash Screens
- `icon-512x512.png` - Splash Screens

## Shortcut Icons

- `shortcut-add.png` (96x96) - Neues Filament
- `shortcut-scan.png` (96x96) - Barcode scannen
- `shortcut-stats.png` (96x96) - Statistik

## Generierung aus SVG

Das `icon.svg` kann mit Tools wie:
- [SVG to PNG](https://svgtopng.com/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- ImageMagick: `convert -background none icon.svg -resize 192x192 icon-192x192.png`

in alle benötigten Größen konvertiert werden.
