// UI-Komponenten fuer Filatest

// Sound-Player fuer KaChing
class SoundPlayer {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.audioContext = null;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    playKaChing() {
        if (!this.enabled) return;
        this.init();
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
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
    }

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
}

export const soundPlayer = new SoundPlayer();

// Status-Badge aktualisieren
export function updateConnectionStatus(mode, text) {
    const connectionStatus = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    
    if (!connectionStatus) return;
    
    const indicator = connectionStatus.querySelector('span:first-child');
    
    const texts = {
        online: 'Cloud',
        offline: 'Offline',
        error: 'Fehler',
        sync: 'Sync',
        connecting: 'Verbinde'
    };
    
    const colors = {
        online: 'bg-green-500',
        offline: 'bg-gray-500',
        error: 'bg-red-500',
        sync: 'bg-blue-500',
        connecting: 'bg-yellow-500'
    };
    
    if (indicator) {
        const baseClasses = 'w-1.5 h-1.5 rounded-full';
        const colorClass = colors[mode] || colors.offline;
        const pulseClass = (mode === 'connecting' || mode === 'sync') ? 'animate-pulse' : '';
        indicator.className = baseClasses + ' ' + colorClass + ' ' + pulseClass;
    }
    
    if (statusText) {
        statusText.textContent = text || texts[mode] || mode;
    }
}

// Nachricht anzeigen
export function showMessage(message, isError, duration) {
    const errorEl = document.getElementById('errorMsg');
    const successEl = document.getElementById('successMsg');
    
    if (!errorEl || !successEl) return;
    
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    
    const targetEl = isError ? errorEl : successEl;
    targetEl.textContent = message;
    targetEl.classList.remove('hidden');
    
    if (duration > 0) {
        setTimeout(() => targetEl.classList.add('hidden'), duration);
    }
}

// Hilfsfunktion fuer HTML-Escaping
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Gewichts-Farbe bestimmen
function getWeightColor(weight) {
    if (weight <= 100) return 'text-red-400';
    if (weight <= 250) return 'text-yellow-400';
    return 'text-green-400';
}

// Material-Farbe bestimmen
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

// Filament-Liste rendern
export function renderFilamentList(filaments, containerId, countBadgeId, lowStockAlert) {
    const container = document.getElementById(containerId || 'filamentList');
    const countBadge = document.getElementById(countBadgeId || 'countBadge');
    
    if (!container) return;
    
    if (countBadge) {
        countBadge.textContent = filaments.length + ' Spule' + (filaments.length !== 1 ? 'n' : '');
    }
    
    if (filaments.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-12 glass rounded-2xl border border-gray-700 border-dashed"><div class="text-4xl mb-2 opacity-50">📭</div><p class="text-sm">Noch keine Filamente</p><p class="text-xs text-gray-600 mt-2">Fuege dein erstes Filament hinzu</p></div>';
        return;
    }

    let html = '';
    for (const fil of filaments) {
        let borderClass = 'border-gray-700';
        let alertBadge = '';
        
        if (lowStockAlert && lowStockAlert.isLowStock && lowStockAlert.isLowStock(fil)) {
            const isCritical = lowStockAlert.isCriticalStock && lowStockAlert.isCriticalStock(fil);
            borderClass = isCritical ? 'border-red-500 ring-2 ring-red-500/30' : 'border-yellow-500';
            alertBadge = '<div class="absolute top-2 left-2 ' + (isCritical ? 'bg-red-500' : 'bg-yellow-500') + ' text-black text-xs font-bold px-2 py-1 rounded-full">' + (isCritical ? '🔴 Kritisch' : '🟡 Wenig') + '</div>';
        }
        
        html += '<div class="filament-card glass rounded-xl p-4 ' + borderClass + ' border relative overflow-hidden animate-in">';
        html += alertBadge;
        html += '<div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full -mr-4 -mt-4"></div>';
        html += '<div class="relative flex justify-between items-start">';
        html += '<div class="flex-1 min-w-0">';
        html += '<div class="flex items-center gap-2 mb-1">';
        html += '<span class="text-lg font-bold text-white">' + escapeHtml(fil.Material || 'Unbekannt') + '</span>';
        html += '<span class="text-sm text-gray-400 truncate">' + escapeHtml(fil.Color || '') + '</span>';
        html += '</div>';
        html += '<div class="text-xs text-gray-500 mb-1">' + escapeHtml(fil.Manufakturere || 'Unbekannter Hersteller') + '</div>';
        if (fil.barcode) {
            html += '<div class="text-xs text-blue-400 font-mono mb-2">📷 ' + escapeHtml(fil.barcode) + '</div>';
        }
        html += '<div class="flex items-center gap-3 mt-3">';
        html += '<div class="bg-gray-900 rounded-lg px-3 py-1.5 border border-gray-700">';
        html += '<span class="text-xs text-gray-500 block">Verfuegbar</span>';
        html += '<span class="text-lg font-bold ' + getWeightColor(fil.Weightnetto) + '">' + (fil.Weightnetto || 0) + 'g</span>';
        html += '</div>';
        html += '<div class="text-xs text-gray-600 leading-tight">';
        html += 'Brutto: ' + (fil.Weightbrutto || 0) + 'g<br>';
        html += 'Tara: ' + (fil.Spoolwright || 250) + 'g';
        if (fil.originalCost > 0) {
            html += '<br><span class="text-yellow-500">€' + fil.originalCost.toFixed(2) + '</span>';
        }
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="flex flex-col gap-1 ml-1">';
        html += '<button onclick="window.app.consumeFilament(\'' + fil.id + '\')" class="text-gray-400 hover:text-orange-400 transition p-1.5 text-sm" title="Verbrauch buchen">📉</button>';
        html += '<button onclick="window.app.printLabel(\'' + fil.id + '\')" class="text-gray-400 hover:text-blue-400 transition p-1.5 text-sm" title="Etikett drucken">🏷️</button>';
        html += '<button onclick="window.app.shareFilament(\'' + fil.id + '\')" class="text-gray-400 hover:text-green-400 transition p-1.5 text-sm" title="Teilen">📤</button>';
        html += '<button onclick="window.app.deleteFilament(\'' + fil.id + '\')" class="text-gray-400 hover:text-red-400 transition p-1.5 text-sm" title="Loeschen">🗑️</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// Material-Dropdown aktualisieren
export function updateMaterialSelect(materials, selectId) {
    const select = document.getElementById(selectId || 'material');
    if (!select) return;
    
    const currentValue = select.value;
    
    let html = '<option value="">Waehlen...</option>';
    for (const m of materials) {
        html += '<option value="' + escapeHtml(m.name) + '" data-color="' + m.color + '" data-nozzle-min="' + m.nozzleTempMin + '" data-nozzle-max="' + m.nozzleTempMax + '" data-bed-min="' + m.bedTempMin + '" data-bed-max="' + m.bedTempMax + '">' + escapeHtml(m.name) + '</option>';
    }
    
    select.innerHTML = html;
    
    if (currentValue) {
        select.value = currentValue;
    }
}

// Hersteller-Dropdown aktualisieren
export function updateBrandSelect(brands, selectId) {
    const select = document.getElementById(selectId || 'f-brand-select');
    if (!select) return;
    
    const grouped = {
        plastic: [],
        cardboard: [],
        other: []
    };
    
    for (const b of brands) {
        if (b.type === 'plastic') grouped.plastic.push(b);
        else if (b.type === 'cardboard') grouped.cardboard.push(b);
        else grouped.other.push(b);
    }
    
    let html = '<option value="">-- Hersteller waehlen --</option>';
    
    if (grouped.plastic.length > 0) {
        html += '<optgroup label="Kunststoffspulen">';
        for (const b of grouped.plastic) {
            html += '<option value="' + b.id + '" data-tara="' + b.tara + '" data-type="' + b.type + '">' + escapeHtml(b.name) + ' (' + b.tara + 'g)</option>';
        }
        html += '</optgroup>';
    }
    
    if (grouped.cardboard.length > 0) {
        html += '<optgroup label="Papp-Spulen (Eco)">';
        for (const b of grouped.cardboard) {
            html += '<option value="' + b.id + '" data-tara="' + b.tara + '" data-type="' + b.type + '">' + escapeHtml(b.name) + ' (' + b.tara + 'g)</option>';
        }
        html += '</optgroup>';
    }
    
    html += '<option value="custom">Eigenes Gewicht...</option>';
    
    select.innerHTML = html;
}

// Statistiken rendern
export function renderStats(stats, containerId, onMaterialClick) {
    const container = document.getElementById(containerId || 'statsContainer');
    if (!container) return;
    
    let materialRows = '';
    const entries = Object.entries(stats.byMaterial || {}).sort((a, b) => b[1] - a[1]);
    
    for (const [mat, count] of entries) {
        const weight = stats.weightByMaterial[mat] || 0;
        const clickable = onMaterialClick ? 'cursor-pointer hover:bg-gray-700/50 transition' : '';
        const clickHandler = onMaterialClick ? 'onclick="window.app.filterByMaterial(\'' + mat + '\')"' : '';
        materialRows += '<div class="flex justify-between items-center py-2 border-b border-gray-700 last:border-0 ' + clickable + ' rounded px-2 -mx-2" ' + clickHandler + '>';
        materialRows += '<div class="flex items-center gap-2">';
        materialRows += '<span class="w-3 h-3 rounded-full" style="background: ' + getMaterialColor(mat) + '"></span>';
        materialRows += '<span class="text-sm">' + escapeHtml(mat) + '</span>';
        if (onMaterialClick) {
            materialRows += '<span class="text-xs text-gray-500">👆</span>';
        }
        materialRows += '</div>';
        materialRows += '<div class="text-right">';
        materialRows += '<span class="text-sm font-medium">' + count + ' Spulen</span>';
        materialRows += '<span class="text-xs text-gray-500 ml-2">(' + weight + 'g)</span>';
        materialRows += '</div>';
        materialRows += '</div>';
    }
    
    let html = '<div class="grid grid-cols-2 gap-4 mb-6">';
    html += '<div class="glass rounded-xl p-4 text-center cursor-pointer hover:bg-gray-800/50 transition" onclick="window.app.switchTab(\'inventory\')">';
    html += '<div class="text-3xl font-bold text-blue-400">' + stats.total + '</div>';
    html += '<div class="text-xs text-gray-400">Spulen</div>';
    html += '<div class="text-xs text-gray-500 mt-1">Zum Lager ➜</div>';
    html += '</div>';
    html += '<div class="glass rounded-xl p-4 text-center">';
    html += '<div class="text-3xl font-bold text-green-400">' + stats.totalWeight + 'g</div>';
    html += '<div class="text-xs text-gray-400">Gesamtgewicht</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="glass rounded-xl p-4">';
    html += '<h3 class="font-bold mb-3 text-gray-300">Material-Verteilung</h3>';
    html += '<p class="text-xs text-gray-500 mb-2">Tippen um nach Material zu filtern</p>';
    html += materialRows || '<p class="text-sm text-gray-500">Keine Daten verfuegbar</p>';
    html += '</div>';
    
    container.innerHTML = html;
}

// Verbrauchs-Modal anzeigen
export function showConsumeModal(filament, onConfirm, projects) {
    const modal = document.createElement('div');
    modal.id = 'consume-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    const costInfo = filament.costPerGram ? '<div class="text-xs text-yellow-400 mt-1">€' + (filament.costPerGram * filament.Weightnetto).toFixed(2) + ' Gesamtwert</div>' : '';
    
    let projectOptions = '';
    if (projects && projects.length > 0) {
        for (const p of projects) {
            projectOptions += '<option value="' + escapeHtml(p.name) + '">' + escapeHtml(p.name) + '</option>';
        }
    }
    
    let html = '<div class="glass rounded-2xl p-6 w-full max-w-md animate-in">';
    html += '<h2 class="text-xl font-bold mb-4 gradient-text">Verbrauch buchen</h2>';
    html += '<div class="bg-gray-800 rounded-lg p-4 mb-4">';
    html += '<div class="font-bold text-white">' + escapeHtml(filament.Material) + ' ' + escapeHtml(filament.Color) + '</div>';
    html += '<div class="text-sm text-gray-400">' + escapeHtml(filament.Manufakturere || '') + '</div>';
    if (filament.barcode) {
        html += '<div class="text-xs text-blue-400 font-mono mt-1">📷 ' + escapeHtml(filament.barcode) + '</div>';
    }
    html += '<div class="text-sm mt-2">Aktueller Bestand: <span class="font-bold text-green-400">' + filament.Weightnetto + 'g</span></div>';
    html += costInfo;
    html += '</div>';
    html += '<div class="space-y-4">';
    html += '<div><label class="block text-sm text-gray-400 mb-1">Verbrauch (g)</label>';
    html += '<input type="number" id="consume-amount" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition" placeholder="z.B. 50" min="1" max="' + filament.Weightnetto + '"></div>';
    
    if (projects && projects.length > 0) {
        html += '<div><label class="block text-sm text-gray-400 mb-1">Projekt</label>';
        html += '<select id="consume-project" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition"><option value="">-- Kein Projekt --</option>' + projectOptions + '</select></div>';
    }
    
    html += '<div><label class="block text-sm text-gray-400 mb-1">Notiz (optional)</label>';
    html += '<input type="text" id="consume-note" class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition" placeholder="z.B. Druck: Benchy"></div>';
    html += '<div class="flex gap-2 pt-2">';
    html += '<button onclick="document.getElementById(\'consume-modal\').remove()" class="flex-1 bg-gray-700 text-white py-2 rounded-xl font-medium hover:bg-gray-600 transition">Abbrechen</button>';
    html += '<button id="confirm-consume" class="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 rounded-xl font-medium hover:from-orange-500 hover:to-red-500 transition">Buchen</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    modal.innerHTML = html;
    document.body.appendChild(modal);
    
    modal.querySelector('#consume-amount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            modal.querySelector('#confirm-consume').click();
        }
    });
    
    modal.querySelector('#confirm-consume').addEventListener('click', () => {
        const amount = parseInt(document.getElementById('consume-amount').value) || 0;
        const note = document.getElementById('consume-note').value;
        const projectSelect = document.getElementById('consume-project');
        const project = projectSelect ? projectSelect.value : '';
        
        if (amount <= 0) {
            showMessage('Bitte gib einen gueltigen Verbrauch ein', true, 3000);
            return;
        }
        
        if (amount > filament.Weightnetto) {
            showMessage('Verbrauch kann nicht groeßer als Bestand sein', true, 3000);
            return;
        }
        
        onConfirm(amount, note, project);
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Button-Loading-Zustand
export function setButtonLoading(buttonId, isLoading, loadingText) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    if (isLoading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = loadingText || '⏳ ...';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.disabled = false;
    }
}
