// 📷 Barcode Scanner Komponente

export class BarcodeScanner {
    constructor(onScanCallback) {
        this.html5QrCode = null;
        this.isScanning = false;
        this.onScanCallback = onScanCallback;
        this.modal = null;
    }

    // Scanner-Modal erstellen
    createModal() {
        if (this.modal) return;
        
        this.modal = document.createElement('div');
        this.modal.id = 'scanner-modal';
        this.modal.className = 'fixed inset-0 bg-black z-50 hidden flex flex-col';
        this.modal.innerHTML = `
            <div class="flex justify-between items-center p-4 bg-black text-white">
                <h2 class="font-bold text-lg">📷 Barcode scannen</h2>
                <button id="close-scanner" class="text-2xl hover:text-red-400 transition">✕</button>
            </div>
            <div id="reader" class="flex-1 flex items-center justify-center bg-gray-900"></div>
            <div class="p-4 bg-gray-900 text-white text-center text-sm">
                <p>Halte den Barcode in den Rahmen</p>
                <p class="text-gray-500 text-xs mt-1">Tippe auf den Bildschirm zum Fokussieren</p>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // Event Listener
        this.modal.querySelector('#close-scanner').addEventListener('click', () => this.stop());
        
        // Schließen bei Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isScanning) {
                this.stop();
            }
        });
    }

    // Scanner starten
    async start() {
        if (this.isScanning) return;
        
        this.createModal();
        this.modal.classList.remove('hidden');
        
        try {
            this.html5QrCode = new Html5Qrcode("reader");
            
            // Kamera wählen (Rückkamera bevorzugen)
            const devices = await Html5Qrcode.getCameras();
            let cameraId = null;
            
            if (devices && devices.length > 0) {
                // Rückkamera finden (enthält oft "back" oder "environment")
                const backCamera = devices.find(d => 
                    d.label.toLowerCase().includes('back') || 
                    d.label.toLowerCase().includes('environment')
                );
                cameraId = backCamera ? backCamera.id : devices[0].id;
            }
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };
            
            await this.html5QrCode.start(
                cameraId || { facingMode: "environment" },
                config,
                (decodedText, decodedResult) => this.handleScan(decodedText, decodedResult),
                (errorMessage) => {
                    // QR Code nicht erkannt - normal während des Scannens
                }
            );
            
            this.isScanning = true;
            console.log('📷 Scanner gestartet');
            
        } catch (err) {
            console.error('Scanner Fehler:', err);
            this.showError('Kamera konnte nicht gestartet werden. Bitte erlaube Kamera-Zugriff.');
        }
    }

    // Scan-Ergebnis verarbeiten
    handleScan(decodedText, decodedResult) {
        console.log('✅ Barcode erkannt:', decodedText);
        
        // Vibration wenn unterstützt
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        // Callback aufrufen
        if (this.onScanCallback) {
            this.onScanCallback(decodedText, decodedResult);
        }
        
        // Scanner stoppen
        this.stop();
    }

    // Scanner stoppen
    async stop() {
        if (!this.isScanning || !this.html5QrCode) {
            this.hideModal();
            return;
        }
        
        try {
            await this.html5QrCode.stop();
            this.isScanning = false;
            console.log('📷 Scanner gestoppt');
        } catch (err) {
            console.error('Fehler beim Stoppen:', err);
        } finally {
            this.hideModal();
        }
    }

    // Modal verstecken
    hideModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    }

    // Fehler anzeigen
    showError(message) {
        const reader = document.getElementById('reader');
        if (reader) {
            reader.innerHTML = `
                <div class="text-center p-8">
                    <div class="text-4xl mb-4">⚠️</div>
                    <p class="text-red-400">${message}</p>
                    <button onclick="document.getElementById('scanner-modal').classList.add('hidden')" 
                            class="mt-4 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                        Schließen
                    </button>
                </div>
            `;
        }
    }

    // Prüfen ob Scanner verfügbar
    static async isAvailable() {
        try {
            const devices = await Html5Qrcode.getCameras();
            return devices && devices.length > 0;
        } catch {
            return false;
        }
    }
}

// QR-Code Generator für Etiketten
export function generateQRCode(text, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const defaultOptions = {
        width: 128,
        height: 128,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    };
    
    const qrOptions = { ...defaultOptions, ...options };
    
    new QRCode(container, {
        text: text,
        ...qrOptions
    });
}

// Etikett für Druck generieren
export function generateLabel(filament, containerId = 'print-area') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const labelHtml = `
        <div class="print-label">
            <div class="flex items-center justify-between h-full">
                <div class="flex-1">
                    <div class="font-bold text-lg" id="print-brand">${escapeHtml(filament.Manufakturere || 'Unknown')}</div>
                    <div class="text-sm" id="print-material">${escapeHtml(filament.Material || '')}</div>
                    <div class="text-sm font-bold" id="print-color">${escapeHtml(filament.Color || '')}</div>
                    <div class="text-xs text-gray-500 mt-1" id="print-weight">${filament.Weightnetto || 0}g</div>
                </div>
                <div id="print-qr"></div>
            </div>
        </div>
    `;
    
    container.innerHTML = labelHtml;
    
    // QR-Code generieren
    setTimeout(() => {
        const qrContainer = document.getElementById('print-qr');
        if (qrContainer && filament.id) {
            new QRCode(qrContainer, {
                text: filament.id,
                width: 50,
                height: 50
            });
        }
    }, 100);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
