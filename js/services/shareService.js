// 📤 Web Share API Service
// Teilen von Filament-Daten via nativem OS-Teilen-Dialog

class ShareService {
    constructor() {
        this.isSupported = navigator.share !== undefined;
        this.isFileSupported = navigator.canShare && navigator.canShare({ files: [] });
    }

    // Prüfen ob Teilen unterstützt wird
    canShare() {
        return this.isSupported;
    }

    // Filament als Text teilen
    async shareFilament(filament) {
        if (!this.isSupported) {
            console.log('Web Share API nicht unterstützt');
            this.fallbackShare(filament);
            return false;
        }

        const shareData = this.createShareData(filament);

        try {
            await navigator.share(shareData);
            console.log('✅ Filament geteilt:', filament.Material, filament.Color);
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Teilen abgebrochen');
                return false;
            }
            console.error('Fehler beim Teilen:', error);
            this.fallbackShare(filament);
            return false;
        }
    }

    // QR-Code als Bild teilen
    async shareQRCode(filament, qrCanvas) {
        if (!this.isSupported) {
            this.fallbackShare(filament);
            return false;
        }

        try {
            // Canvas zu Blob konvertieren
            const blob = await new Promise(resolve => qrCanvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], `filament-${filament.Material}-${filament.Color}.png`, { type: 'image/png' });

            const shareData = {
                title: `Filament: ${filament.Material} ${filament.Color}`,
                text: this.createFilamentText(filament),
                files: [file]
            };

            // Prüfen ob Datei-Teilen unterstützt wird
            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                console.log('✅ QR-Code geteilt');
                return true;
            } else {
                // Ohne Datei teilen
                await navigator.share({
                    title: shareData.title,
                    text: shareData.text
                });
                return true;
            }
        } catch (error) {
            console.error('Fehler beim Teilen des QR-Codes:', error);
            this.fallbackShare(filament);
            return false;
        }
    }

    // Mehrere Filamente teilen (als Liste)
    async shareFilamentList(filaments, title = 'Meine Filamente') {
        if (!this.isSupported) {
            const text = this.createListText(filaments);
            this.copyToClipboard(text);
            return false;
        }

        const text = this.createListText(filaments);

        try {
            await navigator.share({
                title: title,
                text: text
            });
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.copyToClipboard(text);
            }
            return false;
        }
    }

    // Etikett als Bild generieren und teilen
    async shareLabel(filament) {
        try {
            // Label als Canvas generieren
            const canvas = await this.generateLabelCanvas(filament);
            
            if (!canvas) {
                this.fallbackShare(filament);
                return false;
            }

            // Zu Blob konvertieren
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], `etikett-${filament.Material}-${filament.Color}.png`, { type: 'image/png' });

            if (this.isSupported && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Etikett: ${filament.Material} ${filament.Color}`,
                    files: [file]
                });
                return true;
            } else {
                // Download als Fallback
                this.downloadCanvas(canvas, `etikett-${filament.Material}-${filament.Color}.png`);
                return false;
            }
        } catch (error) {
            console.error('Fehler beim Teilen des Etiketts:', error);
            this.fallbackShare(filament);
            return false;
        }
    }

    // Label als Canvas generieren
    async generateLabelCanvas(filament) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 62x29mm bei 300dpi = 732x342px
        const width = 732;
        const height = 342;
        canvas.width = width;
        canvas.height = height;
        
        // Weißer Hintergrund
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Rahmen
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, width - 8, height - 8);
        
        // Text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px Arial';
        ctx.fillText(filament.Material || 'Unknown', 20, 70);
        
        ctx.font = '36px Arial';
        ctx.fillStyle = '#333333';
        ctx.fillText(filament.Color || '', 20, 120);
        
        ctx.font = '28px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(filament.Manufakturere || '', 20, 160);
        
        // Gewicht groß
        ctx.font = 'bold 72px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(`${filament.Weightnetto || 0}g`, 20, 260);
        
        // QR-Code Platz (rechts)
        // QR-Code würde hier gerendert werden
        ctx.strokeStyle = '#cccccc';
        ctx.strokeRect(width - 180, 60, 140, 140);
        ctx.font = '20px Arial';
        ctx.fillStyle = '#999999';
        ctx.fillText('QR', width - 140, 140);
        
        return canvas;
    }

    // Share-Daten erstellen
    createShareData(filament) {
        const text = this.createFilamentText(filament);
        const url = this.createDeepLink(filament);

        return {
            title: `Filament: ${filament.Material} ${filament.Color}`,
            text: text,
            url: url
        };
    }

    // Filament-Text erstellen
    createFilamentText(filament) {
        const lines = [
            `🧵 ${filament.Material} ${filament.Color}`,
            `🏭 ${filament.Manufakturere || 'Unbekannt'}`,
            `⚖️ ${filament.Weightnetto || 0}g verfügbar`,
            filament.barcode ? `📷 Barcode: ${filament.barcode}` : ''
        ];
        
        return lines.filter(Boolean).join('\n');
    }

    // Liste als Text erstellen
    createListText(filaments) {
        const header = `📦 Mein Filament-Lager (${filaments.length} Spulen)\n\n`;
        
        const items = filaments.map(f => 
            `• ${f.Material} ${f.Color} (${f.Weightnetto || 0}g)`
        ).join('\n');
        
        const totalWeight = filaments.reduce((sum, f) => sum + (f.Weightnetto || 0), 0);
        const footer = `\n\nGesamtgewicht: ${totalWeight}g`;
        
        return header + items + footer;
    }

    // Deep-Link URL erstellen
    createDeepLink(filament) {
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({
            id: filament.id,
            material: filament.Material,
            color: filament.Color,
            weight: filament.Weightnetto || 0
        });
        return `${baseUrl}?${params.toString()}`;
    }

    // Fallback: In Zwischenablage kopieren
    fallbackShare(filament) {
        const text = this.createFilamentText(filament);
        this.copyToClipboard(text);
    }

    // In Zwischenablage kopieren
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('📋 In Zwischenablage kopiert');
        } catch (err) {
            console.error('Kopieren fehlgeschlagen:', err);
            // Text selektieren für manuelles Kopieren
            this.selectTextForCopy(text);
        }
    }

    // Canvas herunterladen
    downloadCanvas(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // Text für manuelles Kopieren anzeigen
    selectTextForCopy(text) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="glass rounded-2xl p-6 max-w-sm w-full">
                <h3 class="text-lg font-bold mb-4 gradient-text">📋 Kopieren</h3>
                <textarea class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm mb-4" 
                          rows="6" readonly>${text}</textarea>
                <button onclick="this.closest('.fixed').remove()" 
                        class="w-full bg-blue-600 text-white py-2 rounded-lg">Schließen</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Text automatisch selektieren
        const textarea = modal.querySelector('textarea');
        textarea.select();
    }

    // Toast anzeigen
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // Share-Button rendern (für UI)
    renderShareButton(filament, options = {}) {
        const { showLabel = true, className = '' } = options;
        
        const button = document.createElement('button');
        button.className = `flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition text-sm ${className}`;
        button.innerHTML = showLabel ? '📤 Teilen' : '📤';
        
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.innerHTML = '⏳ ...';
            
            const success = await this.shareFilament(filament);
            
            button.disabled = false;
            button.innerHTML = showLabel ? (success ? '✅ Geteilt' : '📤 Teilen') : '📤';
            
            setTimeout(() => {
                button.innerHTML = showLabel ? '📤 Teilen' : '📤';
            }, 2000);
        });
        
        return button;
    }

    // Empfangene Daten verarbeiten (Share Target)
    async handleSharedData() {
        // Prüfen ob Daten via Share Target empfangen wurden
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('share-target')) {
            const sharedData = {
                title: urlParams.get('name'),
                text: urlParams.get('description'),
                url: urlParams.get('link')
            };
            
            console.log('📥 Shared data received:', sharedData);
            return sharedData;
        }
        
        return null;
    }
}

// Singleton-Instanz
export const shareService = new ShareService();

// Global verfügbar machen
window.shareService = shareService;
