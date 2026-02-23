// 🎨 UI-Komponenten

// Sound-Player für KaChing
class SoundPlayer {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.audioContext = null;
    }

    // AudioContext initialisieren (muss nach User-Interaction erfolgen)
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // KaChing Sound generieren
    playKaChing() {
        if (!this.enabled) return;
        
        this.init();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // "Ka" - höherer Ton
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        gain1.gain.setValueAtTime(this.volume * 0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);
        
        // "Ching" - tieferer, längerer Ton
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, now + 0.1);
        osc2.frequency.exponentialRampToValueAtTime(300, now + 0.4);
        gain2.gain.setValueAtTime(this.volume * 0.4, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.5);
        
        // Metallischer Klang (Obertöne)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(1800, now);
        osc3.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        gain3.gain.setValueAtTime(this.volume * 0.1, now);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now);
        osc3.stop(now + 0.25);
    }

    // Kurzer Erfolgs-Sound
    playSuccess() {
        if (!this.enabled) return;
        this.init();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Fehler-Sound
    playError() {
        if (!this.enabled) return;
        this.init();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(this.volume * 0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    enable() { this.enabled = true; }
    disable() { this.enabled = false; }
    toggle() { this.enabled = !this.enabled; return this.enabled; }
}

export const soundPlayer = new SoundPlayer();

// Status-Badge aktualisieren
export function updateConnectionStatus(mode, text = null) {
    const connectionStatus = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    
    if (!connectionStatus) return;
    
    // Finde den Indicator (erstes Span-Element im connectionStatus)
    const indicator = connectionStatus.querySelector('span:first-child');
    
    const texts = {
        online: 'Cloud',
        offline: 'Offline',
        error: 'Fehler',
        sync: 'Sync...',
        connecting: 'Verbinde...'
    };
    
    const colors = {
        online: 'bg-green-500',
        offline: 'bg-gray-500',
        error: 'bg-red-500',
        sync: 'bg-blue-500',
        connecting: 'bg-yellow-500'
    };
    
    // Indicator aktualisieren (nur wenn gefunden)
    if (indicator) {
        const baseClasses = 'w-1.5 h-1.5 rounded-full';
        const colorClass = colors[mode] || colors.offline;
        const pulseClass = (mode === 'connecting' || mode === 'sync') ? 'animate-pulse' : '';
        indicator.className = `${baseClasses} ${colorClass} ${pulseClass}`.trim();
    }
    
    // Text aktualisieren
    if (statusText) {
        statusText.textContent = text || texts[mode] || mode;
    }
}

// Nachricht anzeigen
export function showMessage(message, isError = false, duration = 4000) {
    const errorEl = document.getElementById('errorMsg');
    const successEl = document.getElementById('successMsg');
    
    if (!errorEl || !successEl) return;
    
    // Beide zuerst verstecken
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    
    const targetEl = isError ? errorEl : successEl;
    targetEl.textContent = message;
    targetEl.classList.remove('hidden');
    
    if (duration > 0) {
        setTimeout(() => targetEl.classList.add('hidden'), duration);
    }
}

// Filament-Liste rendern
export function renderFilamentList(filaments, containerId = 'filamentList', countBadgeId = 'countBadge', lowStockAlert = null) {
    const container = document.getElementById(containerId);
    const countBadge = document.getElementById(countBadgeId);
    
    if (!container) return;
    
    if (countBadge) {
        countBadge.textContent = `${filaments.length} Spule${filaments.length !== 1 ? 'n' : ''}`;
    }
    
    if (filaments.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-12 glass rounded-2xl border border-gray-700 border-dashed">
                <div class="text-4xl mb-2 opacity-50">📭</div>
                <p class="text-sm">Noch keine Filamente</p>
                <p class="text-xs text-gray-600 mt-2">Füge dein erstes Filament hinzu</p>
            </div>`;
        return;
    }

    container.innerHTML = filaments.map(fil => {
        // Niedriger Bestand Prüfung
        let borderClass = 'border-gray-700';
        let alertBadge = '';
        
        if (lowStockAlert && lowStockAlert.isLowStock(fil)) {
            const isCritical = lowStockAlert.isCriticalStock(fil);
            borderClass = isCritical ? 'border-red-500 ring-2 ring-red-500/30' : 'border-yellow-500';
            alertBadge = `
                <div class="absolute top-2 left-2 ${isCritical ? 'bg-red-500' : 'bg-yellow-500'} text-black text-xs font-bold px-2 py-1 rounded-full">
                    ${isCritical ? '🔴 Kritisch' : '🟡 Wenig'}
                </div>
            `;
        }
        
        return `
        <div class="filament-card glass rounded-xl p-4 ${borderClass} border relative overflow-hidden animate-in">
            ${alertBadge}
            <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full -mr-4 -mt-4"></div>
            
            <div class="relative flex justify-between items-start">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg font-bold text-white">${escapeHtml(fil.Material || 'Unbekannt')}</span>
                        <span class="text-sm text-gray-400 truncate">${escapeHtml(fil.Color || '')}</span>
                    </div>
                    <div class="text-xs text-gray-500 mb-1">${escapeHtml(fil.Manufakturere || 'Unbekannter Hersteller')}</div>
                    ${fil.barcode ? `<div class="text-xs text-blue-400 font-mono mb-2">📷 ${escapeHtml(fil.barcode)}</div>` : ''}
                    
                    <div class="flex items-center gap-3 mt-3">
                        <div class="bg-gray-900 rounded-lg px-3 py-1.5 border border-gray-700">
                            <span class="text-xs text-gray-500 block">Verfügbar</span>
                            <span class="text-lg font-bold ${getWeightColor(fil.Weightnetto)}">${fil.Weightnetto || 0}g</span>
                        </div>
                        <div class="text-xs text-gray-600 leading-tight">
                            Brutto: ${fil.Weightbrutto || 0}g<br>
                            Tara: ${fil.Spoolwright || 250}g
                            ${fil.originalCost > 0 ? `<br><span class="text-yellow-500">€${fil.originalCost.toFixed(2)}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col gap-1 ml-1">
                    <button onclick="window.app.consumeFilament('${fil.id}')" 
                            class="text-gray-400 hover:text-orange-400 transition p-1.5 text-sm" 
                            title="Verbrauch buchen">
                        📉
                    </button>
                    <button onclick="window.app.printLabel('${fil.id}')" 
                            class="text-gray-400 hover:text-blue-400 transition p-1.5 text-sm" 
                            title="Etikett drucken">
                        🏷️
                    </button>
                    <button onclick="window.app.shareFilament('${fil.id}')" 
                            class="text-gray-400 hover:text-green-400 transition p-1.5 text-sm" 
                            title="Teilen">
                        📤
                    </button>
                    <button onclick="window.app.deleteFilament('${fil.id}')" 
                            class="text-gray-400 hover:text-red-400 transition p-1.5 text-sm" 
                            title="Löschen">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Material-Dropdown aktualisieren
export function updateMaterialSelect(materials, selectId = 'material') {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Wählen...</option>' + 
        materials.map(m => `
            <option value="${escapeHtml(m.name)}" data-color="${m.color}" 
                    data-nozzle-min="${m.nozzleTempMin}" data-nozzle-max="${m.nozzleTempMax}"
                    data-bed-min="${m.bedTempMin}" data-bed-max="${m.bedTempMax}">
                ${escapeHtml(m.name)}
            </option>
        `).join('');
    
    if (currentValue) {
        select.value = currentValue;
    }
}

// Hersteller-Dropdown aktualisieren
export function updateBrandSelect(brands, selectId = 'f-brand-select') {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const grouped = {
        plastic: brands.filter(b => b.type === 'plastic'),
        cardboard: brands.filter(b => b.type === 'cardboard'),
        other: brands.filter(b => !b.type || (b.type !== 'plastic' && b.type !== 'cardboard'))
    };
    
    select.innerHTML = `
        <option value="">-- Hersteller wählen --</option>
        <optgroup label="Kunststoffspulen">
            ${grouped.plastic.map(b => `
                <option value="${b.id}" data-tara="${b.tara}" data-type="${b.type}">
                    ${escapeHtml(b.name)} (${b.tara}g)
                </option>
            `).join('')}
        </optgroup>
        <optgroup label="Papp-Spulen (Eco)">
            ${grouped.cardboard.map(b => `
                <option value="${b.id}" data-tara="${b.tara}" data-type="${b.type}">
                    ${escapeHtml(b.name)} (${b.tara}g)
                </option>
            `).join('')}
        </optgroup>
        ${grouped.other.length > 0 ? `
        <optgroup label="Sonstige">
            ${grouped.other.map(b => `
                <option value="${b.id}" data-tara="${b.tara}" data-type="${b.type}">
                    ${escapeHtml(b.name)} (${b.tara}g)
                </option>
            `).join('')}
        </optgroup>
        ` : ''}
        <option value="custom">Eigenes Gewicht...</option>
    `;
}

// Statistiken rendern
export function renderStats(stats, containerId = 'statsContainer', onMaterialClick = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const materialRows = Object.entries(stats.byMaterial || {})
        .sort((a, b) => b[1] - a[1])
        .map(([mat, count]) => {
            const weight = stats.weightByMaterial[mat] || 0;
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const clickable = onMaterialClick ? 'cursor-pointer hover:bg-gray-700/50 transition' : '';
            const clickHandler = onMaterialClick ? `onclick="window.app.filterByMaterial('${mat}')"` : '';
            return `
                <div class="flex justify-between items-center py-2 border-b border-gray-700 last:border-0 ${clickable} rounded px-2 -mx-2" ${clickHandler}>
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full" style="background: ${getMaterialColor(mat)}"></span>
                        <span class="text-sm">${escapeHtml(mat)}</span>
                        ${onMaterialClick ? '<span class="text-xs text-gray-500">👆</span>' : ''}
                    </div>
                    <div class="text-right">
                        <span class="text-sm font-medium">${count} Spulen</span>
                        <span class="text-xs text-gray-500 ml-2">(${weight}g)</span>
                    </div>
                </div>
            `;
        }).join('');
    
    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="glass rounded-xl p-4 text-center cursor-pointer hover:bg-gray-800/50 transition" onclick="window.app.switchTab('inventory')">
                <div class="text-3xl font-bold text-blue-400">${stats.total}</div>
                <div class="text-xs text-gray-400">Spulen</div>
                <div class="text-xs text-gray-500 mt-1">Zum Lager ➜</div>
            </div>
            <div class="glass rounded-xl p-4 text-center">
                <div class="text-3xl font-bold text-green-400">${stats.totalWeight}g</div>
                <div class="text-xs text-gray-400">Gesamtgewicht</div>
            </div>
        </div>
        <div class="glass rounded-xl p-4">
            <h3 class="font-bold mb-3 text-gray-300">Material-Verteilung</h3>
            <p class="text-xs text-gray-500 mb-2">Tippen um nach Material zu filtern</p>
            ${materialRows || '<p class="text-sm text-gray-500">Keine Daten verfügbar</p>'}
        </div>
    `;
}

// Verbrauchs-Formular anzeigen
export function showConsumeModal(filament, onConfirm, projects = []) {
    const modal = document.createElement('div');
    modal.id = 'consume-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    // Kosten anzeigen wenn verfügbar
    const costInfo = filament.costPerGram 
        ? `<div class="text-xs text-yellow-400 mt-1">€${(filament.costPerGram * filament.Weightnetto).toFixed(2)} Gesamtwert</div>`
        : '';
    
    // Projekte für Dropdown
    const projectOptions = projects.length > 0 
        ? projects.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('')
        : '';
    
    modal.innerHTML = `
        <div class="glass rounded-2xl p-6 w-full max-w-md animate-in">
            <h2 class="text-xl font-bold mb-4 gradient-text">Verbrauch buchen</h2>
            
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <div class="font-bold text-white">${escapeHtml(filament.Material)} ${escapeHtml(filament.Color)}</div>
                <div class="text-sm text-gray-400">${escapeHtml(filament.Manufakturere || '')}</div>
                ${filament.barcode ? `<div class="text-xs text-blue-400 font-mono mt-1">📷 ${escapeHtml(filament.barcode)}</div>` : ''}
                <div class="text-sm mt-2">
                    Aktueller Bestand: <span class="font-bold text-green-400">${filament.Weightnetto}g</span>
                </div>
                ${costInfo}
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Verbrauch (g)</label>
                    <input type="number" id="consume-amount" 
                           class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition"
                           placeholder="z.B. 50" min="1" max="${filament.Weightnetto}">
                </div>
                
                ${projects.length > 0 ? `
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Projekt</label>
                    <select id="consume-project" 
                            class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition">
                        <option value="">-- Kein Projekt --</option>
                        ${projectOptions}
                    </select>
                </div>
                ` : ''}
                
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Notiz (optional)</label>
                    <input type="text" id="consume-note" 
                           class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition"
                           placeholder="z.B. Druck: Benchy">
                </div>
                
                <div class="flex gap-3 pt-2">
                    <button onclick="document.getElementById('consume-modal').remove()" 
                            class="flex-1 bg-gray-700 text-white py-3 rounded-xl font-medium hover:bg-gray-600 transition">
                        Abbrechen
                    </button>
                    <button id="confirm-consume" 
                            class="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-medium hover:from-orange-500 hover:to-red-500 transition">
                        Buchen
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Enter-Taste Unterstützung
    modal.querySelector('#consume-amount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('#confirm-consume').click();
        }
    });
    
    modal.querySelector('#confirm-consume').addEventListener('click', () => {
        const amount = parseInt(document.getElementById('consume-amount').value) || 0;
        const note = document.getElementById('consume-note').value;
        const project = document.getElementById('consume-project')?.value || '';
        
        if (amount <= 0) {
            showMessage('Bitte gib einen gültigen Verbrauch ein', true);
            return;
        }
        
        if (amount > filament.Weightnetto) {
            showMessage('Verbrauch kann nicht größer als Bestand sein', true);
            return;
        }
        
        onConfirm(amount, note, project);
        modal.remove();
    });
    
    // Schließen bei Klick außerhalb
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Hilfsfunktionen
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getWeightColor(weight) {
    if (weight <= 100) return 'text-red-400';
    if (weight <= 250) return 'text-yellow-400';
    return 'text-green-400';
}

function getMaterialColor(material) {
    const colors = {
        'PLA': '#4ade80',
        'PETG': '#60a5fa',
        'ABS': '#f87171',
        'TPU': '#fbbf24',
        'ASA': '#a78bfa',
        'Nylon': '#c084fc',
        'PC': '#2dd4bf'
    };
    return colors[material] || '#9ca3af';
}

// Button-Loading-Zustand
export function setButtonLoading(buttonId, isLoading, loadingText = '⏳ ...') {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    if (isLoading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = loadingText;
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.disabled = false;
    }
}
