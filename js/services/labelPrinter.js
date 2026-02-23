// 🏷️ Etiketten-Druck Service
// Generiert 62x29mm Etiketten mit QR-Code für Filament-Spulen

class LabelPrinter {
    constructor() {
        this.labelWidth = 62;  // mm
        this.labelHeight = 29; // mm
        this.dpi = 300;
    }

    // Etiketten-Daten vorbereiten
    prepareLabelData(filament) {
        // Deep-Link URL für die App (für QR-Code)
        const appUrl = this.generateAppUrl(filament);
        
        return {
            material: filament.Material || 'Unknown',
            color: filament.Color || 'Unknown',
            brand: filament.Manufakturere || 'Unknown',
            weight: filament.Weightnetto || 0,
            barcode: filament.barcode || '',
            qrData: appUrl,
            id: filament.id
        };
    }

    // App-URL für Deep-Linking generieren
    generateAppUrl(filament) {
        // In einer echten App wäre dies ein Deep-Link
        // Für jetzt: URL mit Parametern für schnelles Auffüllen
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({
            id: filament.id,
            material: filament.Material,
            color: filament.Color,
            barcode: filament.barcode || ''
        });
        return `${baseUrl}?${params.toString()}`;
    }

    // SVG Etikett generieren
    generateSVG(data) {
        const w = this.labelWidth;
        const h = this.labelHeight;
        
        // QR-Code Größe: ca. 1/3 der Breite
        const qrSize = 20;
        
        return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">
            <defs>
                <style>
                    .bg { fill: white; }
                    .border { fill: none; stroke: #000; stroke-width: 0.5; }
                    .title { font-family: Arial, sans-serif; font-size: 5px; font-weight: bold; fill: #000; }
                    .subtitle { font-family: Arial, sans-serif; font-size: 3.5px; fill: #333; }
                    .weight { font-family: Arial, sans-serif; font-size: 8px; font-weight: bold; fill: #000; }
                    .small { font-family: Arial, sans-serif; font-size: 2.5px; fill: #666; }
                    .qr-placeholder { fill: #f0f0f0; stroke: #ccc; stroke-width: 0.3; }
                </style>
            </defs>
            
            <!-- Hintergrund -->
            <rect class="bg" width="${w}" height="${h}"/>
            
            <!-- Rahmen (nur für Vorschau, nicht beim Druck) -->
            <rect class="border" x="0.5" y="0.5" width="${w-1}" height="${h-1}"/>
            
            <!-- QR-Code Bereich (rechts) -->
            <rect class="qr-placeholder" x="${w-qrSize-3}" y="${(h-qrSize)/2}" width="${qrSize}" height="${qrSize}"/>
            <text class="small" x="${w-qrSize/2-3}" y="${(h-qrSize)/2 + qrSize/2 + 1}" text-anchor="middle">QR</text>
            
            <!-- Text Informationen (links) -->
            <text class="title" x="3" y="7">${this.escapeXml(data.material)}</text>
            <text class="subtitle" x="3" y="12">${this.escapeXml(data.color)}</text>
            <text class="subtitle" x="3" y="16">${this.escapeXml(data.brand)}</text>
            
            <!-- Gewicht (groß) -->
            <text class="weight" x="3" y="25">${data.weight}g</text>
            
            <!-- Barcode klein -->
            ${data.barcode ? `<text class="small" x="3" y="28">${data.barcode.substring(0, 15)}</text>` : ''}
        </svg>
        `;
    }

    // HTML Vorschau generieren (für Modal)
    generatePreviewHTML(filament) {
        const data = this.prepareLabelData(filament);
        
        return `
        <div class="label-preview" style="
            width: 62mm; 
            height: 29mm; 
            background: white; 
            border: 1px dashed #ccc;
            padding: 2mm;
            font-family: Arial, sans-serif;
            position: relative;
            box-sizing: border-box;
        ">
            <div style="display: flex; justify-content: space-between; height: 100%;">
                <!-- Text Bereich -->
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 14px; font-weight: bold; color: #000; line-height: 1.2;">
                        ${data.material}
                    </div>
                    <div style="font-size: 11px; color: #333; margin-top: 2px;">
                        ${data.color}
                    </div>
                    <div style="font-size: 9px; color: #666; margin-top: 1px;">
                        ${data.brand}
                    </div>
                    <div style="font-size: 18px; font-weight: bold; color: #000; margin-top: 4px;">
                        ${data.weight}g
                    </div>
                    ${data.barcode ? `<div style="font-size: 7px; color: #999; margin-top: 2px;">${data.barcode}</div>` : ''}
                </div>
                
                <!-- QR-Code Bereich -->
                <div style="width: 20mm; height: 20mm; display: flex; align-items: center; justify-content: center;">
                    <div id="label-qrcode" style="width: 18mm; height: 18mm;"></div>
                </div>
            </div>
        </div>
        
        <style>
            @media print {
                .label-preview { 
                    border: none !important;
                    page-break-after: always;
                }
            }
        </style>
        `;
    }

    // QR-Code für Etikett generieren
    generateLabelQR(filament, containerId) {
        const data = this.prepareLabelData(filament);
        const container = document.getElementById(containerId);
        
        if (!container || !window.QRCode) return;
        
        container.innerHTML = '';
        
        new QRCode(container, {
            text: data.qrData,
            width: 68,  // ~18mm bei 96dpi
            height: 68,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    // Druckdialog öffnen
    printLabel(filament) {
        const data = this.prepareLabelData(filament);
        const printWindow = window.open('', '_blank', 'width=400,height=300');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Etikett - ${data.material} ${data.color}</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                <style>
                    @page {
                        size: 62mm 29mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                    }
                    .label {
                        width: 62mm;
                        height: 29mm;
                        padding: 2mm;
                        box-sizing: border-box;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .info {
                        flex: 1;
                    }
                    .material {
                        font-size: 14px;
                        font-weight: bold;
                        margin: 0;
                        line-height: 1.2;
                    }
                    .color {
                        font-size: 11px;
                        color: #333;
                        margin: 2px 0 0 0;
                    }
                    .brand {
                        font-size: 9px;
                        color: #666;
                        margin: 1px 0 0 0;
                    }
                    .weight {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 4px 0 0 0;
                    }
                    .barcode {
                        font-size: 7px;
                        color: #999;
                        font-family: monospace;
                        margin: 2px 0 0 0;
                    }
                    .qr-section {
                        width: 20mm;
                        height: 20mm;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    #qrcode {
                        width: 18mm !important;
                        height: 18mm !important;
                    }
                    #qrcode img, #qrcode canvas {
                        width: 100% !important;
                        height: 100% !important;
                    }
                    @media print {
                        body { 
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="label">
                    <div class="info">
                        <p class="material">${data.material}</p>
                        <p class="color">${data.color}</p>
                        <p class="brand">${data.brand}</p>
                        <p class="weight">${data.weight}g</p>
                        ${data.barcode ? `<p class="barcode">${data.barcode}</p>` : ''}
                    </div>
                    <div class="qr-section">
                        <div id="qrcode"></div>
                    </div>
                </div>
                
                <script>
                    window.onload = function() {
                        new QRCode(document.getElementById('qrcode'), {
                            text: '${data.qrData}',
                            width: 68,
                            height: 68,
                            colorDark: '#000000',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.M
                        });
                        
                        setTimeout(function() {
                            window.print();
                            // Optional: Fenster nach Druck schließen
                            // window.close();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    // PDF generieren (für spätere Erweiterung)
    async generatePDF(filament) {
        // Dies würde jsPDF oder ähnliches verwenden
        // Für jetzt verwenden wir den Druckdialog
        this.printLabel(filament);
    }

    // Mehrere Etiketten drucken
    printMultipleLabels(filaments) {
        const printWindow = window.open('', '_blank');
        
        let labelsHTML = filaments.map(f => {
            const data = this.prepareLabelData(f);
            return this.generateSingleLabelHTML(data);
        }).join('<div style="page-break-after: always;"></div>');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Mehrere Etiketten</title>
                <style>
                    @page {
                        size: 62mm 29mm;
                        margin: 0;
                    }
                    body { margin: 0; padding: 0; }
                    .label {
                        width: 62mm;
                        height: 29mm;
                        padding: 2mm;
                        box-sizing: border-box;
                        page-break-after: always;
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .label:last-child { page-break-after: auto; }
                </style>
            </head>
            <body>
                ${labelsHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    // Hilfsmethode für HTML-Escaping
    escapeXml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    // Einzelnes Label HTML
    generateSingleLabelHTML(data) {
        return `
        <div class="label">
            <div style="flex: 1;">
                <p style="font-size: 14px; font-weight: bold; margin: 0;">${data.material}</p>
                <p style="font-size: 11px; color: #333; margin: 2px 0 0 0;">${data.color}</p>
                <p style="font-size: 9px; color: #666; margin: 1px 0 0 0;">${data.brand}</p>
                <p style="font-size: 16px; font-weight: bold; margin: 4px 0 0 0;">${data.weight}g</p>
            </div>
        </div>
        `;
    }
}

export const labelPrinter = new LabelPrinter();
