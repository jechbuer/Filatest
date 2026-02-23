// 🚀 Filatest Hauptanwendung
import { initFirebase } from './config/firebase.js';
import { filamentService } from './services/db.js';
import { masterDataService } from './services/masterData.js';
import { filamentDictionary } from './services/filamentDictionary.js';
import { consumptionLogService } from './services/consumptionLog.js';
import { labelPrinter } from './services/labelPrinter.js';
import { lowStockAlert } from './services/lowStockAlert.js';
import { 
    updateConnectionStatus, 
    showMessage, 
    renderFilamentList, 
    updateMaterialSelect,
    updateBrandSelect,
    renderStats,
    showConsumeModal,
    setButtonLoading,
    soundPlayer
} from './ui/components.js';
import { BarcodeScanner } from './ui/scanner.js';

class FilamentApp {
    constructor() {
        this.filaments = [];
        this.materials = [];
        this.brands = [];
        this.scanner = null;
        this.unsubscribe = null;
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.searchTimeout = null;
    }

    // App initialisieren
    async init() {
        try {
            updateConnectionStatus('connecting');
            
            // Firebase initialisieren
            await initFirebase();
            
            // Stammdaten laden
            await this.loadMasterData();
            
            // Filament Dictionary laden (optional)
            await filamentDictionary.load();
            if (filamentDictionary.loaded) {
                this.setupFilamentColorPicker();
            }
            
            // Scanner initialisieren
            this.scanner = new BarcodeScanner((barcode) => this.handleBarcodeScan(barcode));
            
            // Filamente laden und Echtzeit-Updates abonnieren
            this.loadFilaments();
            this.unsubscribe = filamentService.onSnapshot((filaments) => {
                this.filaments = filaments;
                this.renderList();
            });
            
            // UI initialisieren
            this.setupEventListeners();
            this.calculateNetto();
            
            // Niedrigen Bestand prüfen
            this.checkLowStock();
            
            updateConnectionStatus('online');
            console.log('✅ App initialisiert');
            
        } catch (error) {
            console.error('❌ Initialisierungsfehler:', error);
            updateConnectionStatus('error');
            showMessage('Fehler beim Verbinden: ' + error.message, true);
        }
    }

    // Filament Farbwähler einrichten
    setupFilamentColorPicker() {
        const container = document.getElementById('bambuColors');
        const wrapper = document.getElementById('bambuColorPicker');
        const datalist = document.getElementById('colorSuggestions');
        
        if (!container || !wrapper) return;
        
        const colors = filamentDictionary.getColorsByMaterial('PLA');
        if (colors.length === 0) return;
        
        // Datalist für Autocomplete füllen
        if (datalist) {
            const allColors = [];
            filamentDictionary.getAvailableMaterials().forEach(mat => {
                allColors.push(...filamentDictionary.getColorsByMaterial(mat));
            });
            datalist.innerHTML = allColors.slice(0, 50).map(c => 
                `<option value="${c.name}">${c.name} (${c.material} - ${c.brand})</option>`
            ).join('');
        }
        
        // Farb-Chips erstellen (nur eine Auswahl anzeigen)
        const displayColors = colors.slice(0, 12); // Erste 12 Farben
        container.innerHTML = displayColors.map(color => `
            <button type="button" 
                    class="w-8 h-8 rounded-full border-2 border-gray-600 hover:border-white hover:scale-110 transition shadow-lg"
                    style="background-color: ${color.hex};"
                    title="${color.name}"
                    onclick="window.app.selectDictionaryColor('${color.name}', '${color.hex}', 'PLA')">
            </button>
        `).join('');
        
        wrapper.classList.remove('hidden');
    }

    // Farbe aus Dictionary auswählen
    selectDictionaryColor(name, hex, material = 'PLA') {
        const colorInput = document.getElementById('color');
        if (colorInput) {
            colorInput.value = name;
        }
        
        // Material automatisch setzen
        const materialSelect = document.getElementById('material');
        if (materialSelect) {
            materialSelect.value = material;
        }
        
        // Hersteller auf Bambu Lab setzen (wenn aus Dictionary)
        const manufacturerInput = document.getElementById('manufacturer');
        if (manufacturerInput && !manufacturerInput.value) {
            manufacturerInput.value = 'Bambu Lab';
        }
        
        soundPlayer.playSuccess();
        showMessage(`🎨 ${name} ausgewählt`);
    }

    // Stammdaten laden
    async loadMasterData() {
        try {
            const { materials, brands } = await masterDataService.loadAllMasterData();
            this.materials = materials;
            this.brands = brands;
            
            // Dropdowns aktualisieren
            updateMaterialSelect(materials);
            updateBrandSelect(brands);
            
            console.log('✅ Stammdaten geladen:', materials.length, 'Materialien,', brands.length, 'Hersteller');
        } catch (error) {
            console.error('Fehler beim Laden der Stammdaten:', error);
        }
    }

    // Event Listener einrichten
    setupEventListeners() {
        // Formular
        const form = document.getElementById('filamentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFilament();
            });
        }

        // Hersteller-Select Änderung
        const brandSelect = document.getElementById('f-brand-select');
        if (brandSelect) {
            brandSelect.addEventListener('change', () => this.updateTara());
        }

        // Farb-Eingabe - Dictionary Lookup
        const colorInput = document.getElementById('color');
        if (colorInput && filamentDictionary.loaded) {
            colorInput.addEventListener('input', (e) => {
                this.lookupDictionaryColor(e.target.value);
            });
        }

        // Material-Select - Farben aktualisieren
        const materialSelect = document.getElementById('material');
        if (materialSelect) {
            materialSelect.addEventListener('change', (e) => {
                this.updateColorChips(e.target.value);
            });
        }

        // Gewichts-Eingaben
        const bruttoInput = document.getElementById('brutto');
        const taraInput = document.getElementById('tara');
        if (bruttoInput) bruttoInput.addEventListener('input', () => this.calculateNetto());
        if (taraInput) taraInput.addEventListener('input', () => this.calculateNetto());

        // Scanner Button
        const scanBtn = document.getElementById('scanBtn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.startScanner());
        }

        // Export Button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Tab-Navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Log Filter
        const applyLogFilter = document.getElementById('applyLogFilter');
        if (applyLogFilter) {
            applyLogFilter.addEventListener('click', () => this.loadConsumptionLog());
        }

        // Log Datum Defaults
        const logDateFrom = document.getElementById('logDateFrom');
        const logDateTo = document.getElementById('logDateTo');
        if (logDateFrom && logDateTo) {
            // Letzter Monat als Default
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            logDateFrom.value = lastMonth.toISOString().split('T')[0];
            logDateTo.value = now.toISOString().split('T')[0];
        }

        // Filter Buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setFilter(filter);
            });
        });

        // Suche
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    this.search(e.target.value);
                }, 300);
            });
        }

        // Sound Toggle
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    soundPlayer.enable();
                    soundPlayer.playSuccess();
                } else {
                    soundPlayer.disable();
                }
            });
        }
    }

    // Tara aktualisieren basierend auf Hersteller
    updateTara() {
        const select = document.getElementById('f-brand-select');
        if (!select) return;
        
        const option = select.options[select.selectedIndex];
        if (option && option.dataset.tara) {
            document.getElementById('tara').value = option.dataset.tara;
            this.calculateNetto();
        }
    }

    // Nettogewicht berechnen
    calculateNetto() {
        const brutto = parseInt(document.getElementById('brutto')?.value) || 0;
        const tara = parseInt(document.getElementById('tara')?.value) || 0;
        const netto = Math.max(0, brutto - tara);
        
        const nettoDisplay = document.getElementById('nettoAnzeige');
        if (nettoDisplay) {
            nettoDisplay.textContent = netto;
        }
    }

    // Filament speichern
    async saveFilament() {
        const btn = document.getElementById('saveBtn');
        setButtonLoading('saveBtn', true, '⏳ Speichere...');

        try {
            const material = document.getElementById('material').value;
            const color = document.getElementById('color').value;
            const weight = parseInt(document.getElementById('nettoAnzeige').textContent) || 0;
            
            // Preis aus Dictionary ermitteln
            let costPerGram = 0;
            let totalCost = 0;
            const dictColor = filamentDictionary.findByName(color, material);
            if (dictColor?.price) {
                const pricePerGram = filamentDictionary.getPricePerGram(material);
                if (pricePerGram) {
                    costPerGram = pricePerGram;
                    totalCost = pricePerGram * weight;
                }
            }
            
            const data = {
                Material: material,
                Color: color,
                Manufakturere: document.getElementById('manufacturer').value || 'Unbekannt',
                Weightbrutto: parseInt(document.getElementById('brutto').value) || 0,
                Spoolwright: parseInt(document.getElementById('tara').value) || 250,
                Weightnetto: weight,
                barcode: document.getElementById('barcode').value || null,
                costPerGram: costPerGram,
                originalCost: totalCost,
                Zimestamp: new Date().toISOString()
            };

            await filamentService.create(data);
            soundPlayer.playSuccess();
            showMessage(`✅ Filament gespeichert!${totalCost > 0 ? ' Wert: €' + totalCost.toFixed(2) : ''}`);
            
            // Formular zurücksetzen
            document.getElementById('filamentForm').reset();
            this.calculateNetto();
            
        } catch (error) {
            showMessage('❌ Fehler: ' + error.message, true);
        } finally {
            setButtonLoading('saveBtn', false);
        }
    }

    // Filamente laden
    async loadFilaments() {
        try {
            this.filaments = await filamentService.getAll();
            this.renderList();
        } catch (error) {
            showMessage('Fehler beim Laden: ' + error.message, true);
        }
    }

    // Niedrigen Bestand prüfen
    checkLowStock() {
        if (this.filaments.length > 0) {
            lowStockAlert.checkAllFilaments(this.filaments);
        }
    }

    // Etikett drucken
    printLabel(id) {
        const filament = this.filaments.find(f => f.id === id);
        if (!filament) return;
        
        labelPrinter.printLabel(filament);
        soundPlayer.playSuccess();
    }

    // Liste rendern (mit Filter und Suche)
    renderList() {
        let filtered = this.filaments;
        
        // Material-Filter anwenden
        if (this.currentFilter && this.currentFilter !== 'all') {
            filtered = filtered.filter(f => {
                const material = (f.Material || '').toLowerCase();
                return material === this.currentFilter.toLowerCase();
            });
        }
        
        // Suchfilter anwenden
        if (this.searchQuery && this.searchQuery.trim() !== '') {
            const query = this.searchQuery.toLowerCase().trim();
            filtered = filtered.filter(f => {
                // Alle relevanten Felder durchsuchen
                const fields = [
                    f.Material || '',
                    f.Color || '',
                    f.Manufakturere || '',
                    f.barcode || ''
                ];
                
                // Prüfen ob Query in einem der Felder enthalten ist
                return fields.some(field => 
                    field.toString().toLowerCase().includes(query)
                );
            });
            
            // Auch im Filament Dictionary suchen und passende Farben hervorheben
            if (filamentDictionary.loaded) {
                const dictColor = filamentDictionary.findByName(query);
                if (dictColor) {
                    // Zusätzlich nach dieser Farbe suchen
                    const additionalMatches = this.filaments.filter(f => 
                        !filtered.includes(f) && 
                        f.Color?.toLowerCase() === dictColor.name.toLowerCase()
                    );
                    filtered = [...filtered, ...additionalMatches];
                }
            }
        }
        
        renderFilamentList(filtered, 'filamentList', 'countBadge', lowStockAlert);
        
        // Suchergebnis-Info aktualisieren
        const searchInfo = document.getElementById('searchInfo');
        if (searchInfo) {
            if (this.searchQuery && this.searchQuery.trim() !== '') {
                searchInfo.textContent = `${filtered.length} von ${this.filaments.length} Spulen`;
                searchInfo.classList.remove('hidden');
            } else {
                searchInfo.classList.add('hidden');
            }
        }
    }

    // Suche durchführen
    search(query) {
        this.searchQuery = query;
        this.renderList();
    }

    // Filter setzen
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Button-Styles aktualisieren
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('bg-blue-100', 'text-blue-800');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
            } else {
                btn.classList.remove('bg-blue-100', 'text-blue-800');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });
        
        this.renderList();
    }

    // Filament löschen
    async deleteFilament(id) {
        if (!confirm('Wirklich löschen?')) return;
        
        try {
            await filamentService.delete(id);
            soundPlayer.playSuccess();
            showMessage('🗑️ Filament gelöscht');
        } catch (error) {
            soundPlayer.playError();
            showMessage('Fehler beim Löschen: ' + error.message, true);
        }
    }

    // Verbrauch buchen
    async consumeFilament(id) {
        const filament = this.filaments.find(f => f.id === id);
        if (!filament) return;
        
        // Projekte laden
        const projects = await consumptionLogService.getAllProjects();
        
        showConsumeModal(filament, async (amount, note, project) => {
            try {
                // Kosten berechnen
                let costPerGram = filament.costPerGram || 0;
                let totalCost = 0;
                
                // Wenn kein Preis gespeichert, aus Dictionary holen
                if (!costPerGram && filamentDictionary.loaded) {
                    const dictEntry = filamentDictionary.findByName(filament.Color, filament.Material);
                    if (dictEntry) {
                        costPerGram = filamentDictionary.getPricePerGram(filament.Material) || 0;
                    }
                }
                totalCost = costPerGram * amount;
                
                // Verbrauch in Filament-DB buchen
                const result = await filamentService.consume(id, amount);
                
                // Verbrauch in Log-DB speichern
                await consumptionLogService.createLogEntry({
                    filamentId: id,
                    material: filament.Material,
                    color: filament.Color,
                    brand: filament.Manufakturere,
                    amount: amount,
                    costPerGram: costPerGram,
                    totalCost: totalCost,
                    project: project || null,
                    note: note || '',
                    barcode: filament.barcode
                });
                
                // 🎵 KaChing Sound abspielen
                soundPlayer.playKaChing();
                
                const costMsg = totalCost > 0 ? ` (€${totalCost.toFixed(2)})` : '';
                if (result.deleted) {
                    showMessage(`🗑️ Spule aufgebraucht${costMsg}`);
                } else {
                    showMessage(`✅ ${amount}g verbucht${costMsg}. Verbleibend: ${result.newWeight}g`);
                }
            } catch (error) {
                soundPlayer.playError();
                showMessage('Fehler beim Buchen: ' + error.message, true);
            }
        }, projects);
    }

    // Scanner starten
    async startScanner() {
        if (this.scanner) {
            await this.scanner.start();
        }
    }

    // Barcode verarbeiten
    async handleBarcodeScan(barcode) {
        console.log('Barcode gescannt:', barcode);
        
        // 1. Prüfen ob Filament mit diesem Barcode existiert
        const existing = this.filaments.find(f => f.barcode === barcode);
        
        if (existing) {
            // Verbrauch buchen
            this.consumeFilament(existing.id);
            return;
        }
        
        // 2. Im Filament Dictionary suchen
        if (filamentDictionary.loaded) {
            const result = filamentDictionary.parseBarcode(barcode);
            
            if (result) {
                // Filament erkannt - Auto-fill
                this.autoFillDictionaryData(result, barcode);
                soundPlayer.playSuccess();
                showMessage(`🎉 ${result.color.name} (${result.material}) erkannt! Daten wurden ausgefüllt.`);
                return;
            }
        }
        
        // 3. Unbekannter Barcode - manuelle Eingabe
        document.getElementById('barcode').value = barcode;
        showMessage('📷 Barcode erkannt! Bitte fülle die restlichen Daten aus.');
        
        // Zum Neu-Tab wechseln
        this.switchTab('add');
    }

    // Dictionary Daten automatisch ausfüllen
    autoFillDictionaryData(result, barcode) {
        const { color, material, brand } = result;
        // Barcode speichern
        document.getElementById('barcode').value = barcode;
        
        // Farbe setzen
        const colorInput = document.getElementById('color');
        if (colorInput) colorInput.value = color.name;
        
        // Material setzen
        const materialSelect = document.getElementById('material');
        if (materialSelect && material) materialSelect.value = material;
        
        // Hersteller auf Bambu Lab setzen
        const manufacturerInput = document.getElementById('manufacturer');
        if (manufacturerInput) manufacturerInput.value = 'Bambu Lab';
        
        // Zum Neu-Tab wechseln
        this.switchTab('add');
        
        // Farb-Chips hervorheben
        const chips = document.querySelectorAll('#bambuColors button');
        // Material-spezifische Chips aktualisieren
        this.updateColorChips(material);
    }

    // Daten exportieren
    async exportData() {
        try {
            await filamentService.export();
            showMessage('💾 Backup wurde heruntergeladen');
        } catch (error) {
            showMessage('Fehler beim Exportieren: ' + error.message, true);
        }
    }

    // Tab wechseln
    switchTab(tab) {
        // Alle Tabs ausblenden
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Gewählten Tab anzeigen
        const targetTab = document.getElementById(`tab-${tab}`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
        }
        
        // Button-Styles aktualisieren
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Spezielle Aktionen pro Tab
        if (tab === 'stats') {
            this.loadStats();
        }
        if (tab === 'logs') {
            this.loadConsumptionLog();
            this.loadProjectsForLogFilter();
        }
        if (tab === 'settings') {
            this.loadSettings();
        }
    }

    // Statistiken laden
    async loadStats() {
        try {
            const stats = await filamentService.getStats();
            renderStats(stats, 'statsContainer', true);
        } catch (error) {
            console.error('Fehler beim Laden der Statistiken:', error);
        }
    }

    // Farbe beim Tippen nachschlagen
    lookupDictionaryColor(input) {
        if (!filamentDictionary.loaded || !input || input.length < 2) return;
        
        const materialSelect = document.getElementById('material');
        const material = materialSelect?.value;
        
        const color = filamentDictionary.findByName(input, material);
        if (color) {
            // Gefunden! Aber nur vorschlagen, nicht automatisch ausfüllen
            console.log('🎨 Dictionary Farbe gefunden:', color.name, color.hex, color.material);
        }
    }

    // Nach Material aus Statistik filtern
    filterByMaterial(material) {
        // Zum Lager-Tab wechseln
        this.switchTab('inventory');
        // Filter setzen
        this.setFilter(material);
        // Suche zurücksetzen
        this.search('');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    // Verbrauchs-Log laden
    async loadConsumptionLog() {
        try {
            const dateFrom = document.getElementById('logDateFrom')?.value;
            const dateTo = document.getElementById('logDateTo')?.value;
            const project = document.getElementById('logProjectFilter')?.value;
            const material = document.getElementById('logMaterialFilter')?.value;
            
            const filters = {};
            if (dateFrom) filters.dateFrom = dateFrom;
            if (dateTo) filters.dateTo = dateTo;
            if (project) filters.project = project;
            if (material) filters.material = material;
            
            const { logs, stats } = await consumptionLogService.getLogStats(filters);
            
            // Statistiken anzeigen
            document.getElementById('logTotalEntries').textContent = stats.totalEntries;
            document.getElementById('logTotalWeight').textContent = stats.totalWeight.toFixed(0) + 'g';
            document.getElementById('logTotalCost').textContent = '€' + stats.totalCost.toFixed(2);
            
            // Liste rendern
            const container = document.getElementById('logList');
            if (logs.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-500 py-8">
                        <div class="text-3xl mb-2">📋</div>
                        <p class="text-sm">Keine Einträge gefunden</p>
                    </div>`;
                return;
            }
            
            container.innerHTML = logs.map(log => `
                <div class="glass rounded-lg p-3 border border-gray-700">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-semibold text-white">${log.material || 'Unknown'}</span>
                                <span class="text-sm text-gray-400">${log.color || ''}</span>
                                ${log.project ? `<span class="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded">${log.project}</span>` : ''}
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                                ${new Date(log.date).toLocaleString('de-DE')}
                                ${log.note ? '• ' + log.note : ''}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-green-400">${log.amount}g</div>
                            ${log.totalCost > 0 ? `<div class="text-xs text-yellow-400">€${log.totalCost.toFixed(2)}</div>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Fehler beim Laden des Logs:', error);
            showMessage('Fehler beim Laden des Logs', true);
        }
    }

    // Projekte für Log-Filter laden
    async loadProjectsForLogFilter() {
        try {
            const projects = await consumptionLogService.getAllProjects();
            const select = document.getElementById('logProjectFilter');
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Alle Projekte</option>' + 
                    projects.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
                select.value = currentValue;
            }
        } catch (error) {
            console.error('Fehler beim Laden der Projekte:', error);
        }
    }

    // Log als CSV exportieren
    async exportLogToCSV() {
        try {
            const dateFrom = document.getElementById('logDateFrom')?.value;
            const dateTo = document.getElementById('logDateTo')?.value;
            const project = document.getElementById('logProjectFilter')?.value;
            const material = document.getElementById('logMaterialFilter')?.value;
            
            const filters = {};
            if (dateFrom) filters.dateFrom = dateFrom;
            if (dateTo) filters.dateTo = dateTo;
            if (project) filters.project = project;
            if (material) filters.material = material;
            
            const { logs } = await consumptionLogService.getLogStats(filters);
            consumptionLogService.exportToCSV(logs);
            showMessage('✅ Log als CSV exportiert');
        } catch (error) {
            showMessage('Fehler beim Exportieren', true);
        }
    }

    // Einstellungen laden
    loadSettings() {
        const container = document.getElementById('lowStockSettings');
        if (container) {
            container.innerHTML = lowStockAlert.renderSettings();
            
            // Event Listener für Threshold-Änderung
            const thresholdInput = document.getElementById('lowStockThreshold');
            if (thresholdInput) {
                thresholdInput.addEventListener('change', (e) => {
                    lowStockAlert.setThreshold(parseInt(e.target.value));
                });
            }
        }
    }

    // App aufräumen
    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.scanner) {
            this.scanner.stop();
        }
        filamentService.cleanup();
    }
}

// App initialisieren wenn DOM bereit
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FilamentApp();
    window.app.init();
});

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.cleanup();
    }
});

export default FilamentApp;
