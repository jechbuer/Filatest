// 🔔 Niedriger Bestand Warnung Service
// Benachrichtigt wenn Filament unter einem bestimmten Schwellenwert fällt

class LowStockAlertService {
    constructor() {
        this.threshold = 100; // Default: 100g
        this.enabled = true;
        this.notifiedIds = new Set(); // Verhindert doppelte Benachrichtigungen
        this.storageKey = 'lowStockAlertSettings';
        this.notifiedKey = 'lowStockNotifiedIds';
        this.loadSettings();
    }

    // Einstellungen laden
    loadSettings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const settings = JSON.parse(saved);
                this.threshold = settings.threshold || 100;
                this.enabled = settings.enabled !== false;
            }
            
            const notified = localStorage.getItem(this.notifiedKey);
            if (notified) {
                this.notifiedIds = new Set(JSON.parse(notified));
            }
        } catch (e) {
            console.log('Konnte Warnungs-Einstellungen nicht laden');
        }
    }

    // Einstellungen speichern
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify({
                threshold: this.threshold,
                enabled: this.enabled
            }));
            localStorage.setItem(this.notifiedKey, JSON.stringify([...this.notifiedIds]));
        } catch (e) {
            console.log('Konnte Warnungs-Einstellungen nicht speichern');
        }
    }

    // Schwellenwert setzen
    setThreshold(grams) {
        this.threshold = Math.max(10, Math.min(1000, grams));
        this.saveSettings();
    }

    // Warnungen aktivieren/deaktivieren
    setEnabled(enabled) {
        this.enabled = enabled;
        this.saveSettings();
    }

    // Prüfen ob ein Filament niedrigen Bestand hat
    isLowStock(filament) {
        if (!this.enabled || !filament) return false;
        const weight = filament.Weightnetto || 0;
        return weight > 0 && weight <= this.threshold;
    }

    // Kritischen Bestand prüfen (sehr niedrig)
    isCriticalStock(filament) {
        if (!this.enabled || !filament) return false;
        const weight = filament.Weightnetto || 0;
        return weight > 0 && weight <= (this.threshold * 0.5);
    }

    // Alle Filamente mit niedrigem Bestand finden
    getLowStockItems(filaments) {
        if (!this.enabled) return [];
        return filaments.filter(f => this.isLowStock(f));
    }

    // Benachrichtigung anzeigen (nur einmal pro Spule)
    notifyIfNeeded(filament) {
        if (!this.enabled || !this.isLowStock(filament)) return false;
        
        // Bereits benachrichtigt?
        if (this.notifiedIds.has(filament.id)) return false;
        
        this.notifiedIds.add(filament.id);
        this.saveSettings();
        
        // Browser-Notification
        this.showBrowserNotification(filament);
        
        return true;
    }

    // Browser-Push-Notification
    async showBrowserNotification(filament) {
        if (!('Notification' in window)) return;
        
        // Berechtigung anfordern
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        
        if (Notification.permission !== 'granted') return;
        
        const isCritical = this.isCriticalStock(filament);
        
        new Notification('⚠️ Niedriger Filament-Bestand', {
            body: `${filament.Material} ${filament.Color} hat nur noch ${filament.Weightnetto}g`,
            icon: '🧵',
            badge: '🧵',
            tag: filament.id,
            requireInteraction: isCritical,
            actions: [
                {
                    action: 'open',
                    title: 'App öffnen'
                },
                {
                    action: 'dismiss',
                    title: 'Ignorieren'
                }
            ]
        });
    }

    // Toast-Notification in der App
    showToast(filament) {
        const isCritical = this.isCriticalStock(filament);
        const color = isCritical ? '#ef4444' : '#f59e0b';
        const icon = isCritical ? '🔴' : '🟡';
        
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-4 z-50 animate-in';
        toast.innerHTML = `
            <div style="
                background: linear-gradient(135deg, ${color}, ${isCritical ? '#b91c1c' : '#d97706'});
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 300px;
                cursor: pointer;
            " onclick="window.app.focusFilament('${filament.id}'); this.remove();">
                <div style="font-weight: bold; margin-bottom: 4px;">
                    ${icon} Niedriger Bestand
                </div>
                <div style="font-size: 14px;">
                    ${filament.Material} ${filament.Color}<br>
                    Nur noch <b>${filament.Weightnetto}g</b> übrig
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Automatisch ausblenden
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, isCritical ? 8000 : 5000);
    }

    // Alle Warnungen für aktuelle Filamente prüfen und anzeigen
    checkAllFilaments(filaments) {
        if (!this.enabled) return;
        
        const lowStockItems = this.getLowStockItems(filaments);
        
        // Nur die ersten 3 anzeigen (nicht zu viele)
        lowStockItems.slice(0, 3).forEach(f => {
            if (!this.notifiedIds.has(f.id)) {
                this.showToast(f);
                this.notifyIfNeeded(f);
            }
        });
        
        return lowStockItems;
    }

    // Benachrichtigung zurücksetzen (z.B. nach Auffüllen)
    resetNotification(filamentId) {
        this.notifiedIds.delete(filamentId);
        this.saveSettings();
    }

    // Alle Benachrichtigungen zurücksetzen
    resetAllNotifications() {
        this.notifiedIds.clear();
        this.saveSettings();
    }

    // Statistik über niedrigen Bestand
    getStats(filaments) {
        const lowStock = this.getLowStockItems(filaments);
        const critical = lowStock.filter(f => this.isCriticalStock(f));
        
        return {
            total: filaments.length,
            lowStock: lowStock.length,
            critical: critical.length,
            healthy: filaments.length - lowStock.length,
            percentage: filaments.length > 0 ? (lowStock.length / filaments.length * 100).toFixed(1) : 0
        };
    }

    // UI-Einstellungen rendern
    renderSettings() {
        return `
        <div class="space-y-4">
            <div class="flex items-center justify-between bg-gray-800 rounded-lg p-4">
                <div>
                    <div class="text-sm text-white font-medium">Niedriger Bestand Warnung</div>
                    <div class="text-xs text-gray-500">Benachrichtigung bei wenig Filament</div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="lowStockEnabled" class="sr-only peer" 
                           ${this.enabled ? 'checked' : ''}
                           onchange="window.lowStockAlert.setEnabled(this.checked)">
                    <div class="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
            </div>
            
            <div class="bg-gray-800 rounded-lg p-4">
                <label class="block text-sm text-white mb-2">Warnschwelle</label>
                <div class="flex items-center gap-3">
                    <input type="range" id="lowStockThreshold" min="50" max="500" step="50"
                           value="${this.threshold}"
                           class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                           oninput="document.getElementById('thresholdValue').textContent = this.value + 'g'">
                    <span id="thresholdValue" class="text-white font-medium w-16 text-right">${this.threshold}g</span>
                </div>
                <div class="text-xs text-gray-500 mt-2">
                    Warnung bei weniger als ${this.threshold}g
                </div>
            </div>
            
            <button onclick="window.lowStockAlert.resetAllNotifications(); alert('Alle Warnungen zurückgesetzt');"
                    class="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition">
                🔄 Alle Warnungen zurücksetzen
            </button>
        </div>
        `;
    }
}

// Singleton-Instanz
export const lowStockAlert = new LowStockAlertService();

// Global verfügbar machen
window.lowStockAlert = lowStockAlert;
