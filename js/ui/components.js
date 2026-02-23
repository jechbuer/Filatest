// 🎨 UI-Komponenten

// Status-Badge aktualisieren
export function updateConnectionStatus(mode, text = null) {
    const indicator = document.querySelector('#connectionStatus span:first-child');
    const statusText = document.getElementById('statusText');
    
    if (!indicator || !statusText) return;
    
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
    
    indicator.className = `w-2 h-2 rounded-full ${colors[mode] || colors.offline} ${mode === 'connecting' || mode === 'sync' ? 'animate-pulse' : ''}`;
    statusText.textContent = text || texts[mode] || mode;
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
export function renderFilamentList(filaments, containerId = 'filamentList', countBadgeId = 'countBadge') {
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

    container.innerHTML = filaments.map(fil => `
        <div class="filament-card glass rounded-xl p-4 border border-gray-700 relative overflow-hidden animate-in">
            <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full -mr-4 -mt-4"></div>
            
            <div class="relative flex justify-between items-start">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-lg font-bold text-white">${escapeHtml(fil.Material || 'Unbekannt')}</span>
                        <span class="text-sm text-gray-400 truncate">${escapeHtml(fil.Color || '')}</span>
                    </div>
                    <div class="text-xs text-gray-500 mb-2">${escapeHtml(fil.Manufakturere || 'Unbekannter Hersteller')}</div>
                    
                    <div class="flex items-center gap-3 mt-3">
                        <div class="bg-gray-900 rounded-lg px-3 py-1.5 border border-gray-700">
                            <span class="text-xs text-gray-500 block">Verfügbar</span>
                            <span class="text-lg font-bold ${getWeightColor(fil.Weightnetto)}">${fil.Weightnetto || 0}g</span>
                        </div>
                        <div class="text-xs text-gray-600 leading-tight">
                            Brutto: ${fil.Weightbrutto || 0}g<br>
                            Tara: ${fil.Spoolwright || 250}g
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col gap-2 ml-2">
                    <button onclick="window.app.consumeFilament('${fil.id}')" 
                            class="text-gray-400 hover:text-orange-400 transition p-2" 
                            title="Verbrauch buchen">
                        📉
                    </button>
                    <button onclick="window.app.deleteFilament('${fil.id}')" 
                            class="text-gray-400 hover:text-red-400 transition p-2" 
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
export function renderStats(stats, containerId = 'statsContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const materialRows = Object.entries(stats.byMaterial || {})
        .sort((a, b) => b[1] - a[1])
        .map(([mat, count]) => {
            const weight = stats.weightByMaterial[mat] || 0;
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return `
                <div class="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full" style="background: ${getMaterialColor(mat)}"></span>
                        <span class="text-sm">${escapeHtml(mat)}</span>
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
            <div class="glass rounded-xl p-4 text-center">
                <div class="text-3xl font-bold text-blue-400">${stats.total}</div>
                <div class="text-xs text-gray-400">Spulen</div>
            </div>
            <div class="glass rounded-xl p-4 text-center">
                <div class="text-3xl font-bold text-green-400">${stats.totalWeight}g</div>
                <div class="text-xs text-gray-400">Gesamtgewicht</div>
            </div>
        </div>
        <div class="glass rounded-xl p-4">
            <h3 class="font-bold mb-3 text-gray-300">Material-Verteilung</h3>
            ${materialRows || '<p class="text-sm text-gray-500">Keine Daten verfügbar</p>'}
        </div>
    `;
}

// Verbrauchs-Formular anzeigen
export function showConsumeModal(filament, onConfirm) {
    const modal = document.createElement('div');
    modal.id = 'consume-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="glass rounded-2xl p-6 w-full max-w-md animate-in">
            <h2 class="text-xl font-bold mb-4 gradient-text">Verbrauch buchen</h2>
            
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <div class="font-bold text-white">${escapeHtml(filament.Material)} ${escapeHtml(filament.Color)}</div>
                <div class="text-sm text-gray-400">${escapeHtml(filament.Manufakturere || '')}</div>
                <div class="text-sm mt-2">
                    Aktueller Bestand: <span class="font-bold text-green-400">${filament.Weightnetto}g</span>
                </div>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Verbrauch (g)</label>
                    <input type="number" id="consume-amount" 
                           class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 transition"
                           placeholder="z.B. 50" min="1" max="${filament.Weightnetto}">
                </div>
                
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
        
        if (amount <= 0) {
            showMessage('Bitte gib einen gültigen Verbrauch ein', true);
            return;
        }
        
        if (amount > filament.Weightnetto) {
            showMessage('Verbrauch kann nicht größer als Bestand sein', true);
            return;
        }
        
        onConfirm(amount, note);
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
