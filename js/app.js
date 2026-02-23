// 🚀 Filatest Hauptanwendung
import { initFirebase } from './config/firebase.js';
import { filamentService } from './services/db.js';
import { masterDataService } from './services/masterData.js';
import { bambuDictionary } from './services/bambuDictionary.js';
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
            
            // Bambu Dictionary laden (optional)
            await bambuDictionary.load();
            if (bambuDictionary.loaded) {
                this.setupBambuColorPicker();
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
            
            updateConnectionStatus('online');
            console.log('✅ App initialisiert');
            
        } catch (error) {
            console.error('❌ Initialisierungsfehler:', error);
            updateConnectionStatus('error');
            showMessage('Fehler beim Verbinden: ' + error.message, true);
        }
    }

    // Bambu Farbwähler einrichten
    setupBambuColorPicker() {
        const container = document.getElementById('bambuColors');
        const wrapper = document.getElementById('bambuColorPicker');
        const datalist = document.getElementById('colorSuggestions');
        
        if (!container || !wrapper) return;
        
        const colors = bambuDictionary.getAllColors();
        if (colors.length === 0) return;
        
        // Datalist für Autocomplete füllen
        if (datalist) {
            datalist.innerHTML = colors.map(c => 
                `<option value="${c.name}">${c.name} (${c.category})</option>`
            ).join('');
        }
        
        // Farb-Chips erstellen (nur eine Auswahl anzeigen)
        const displayColors = colors.slice(0, 12); // Erste 12 Farben
        container.innerHTML = displayColors.map(color => `
            <button type="button" 
                    class="w-8 h-8 rounded-full border-2 border-gray-600 hover:border-white hover:scale-110 transition shadow-lg"
                    style="background-color: ${color.hex};"
                    title="${color.name}"
                    onclick="window.app.selectBambuColor('${color.name}', '${color.hex}')">
            </button>
        `).join('');
        
        wrapper.classList.remove('hidden');
    }

    // Bambu Farbe auswählen
    selectBambuColor(name, hex) {
        const colorInput = document.getElementById('color');
        if (colorInput) {
            colorInput.value = name;
        }
        
        // Material automatisch auf PLA setzen wenn Bambu
        const materialSelect = document.getElementById('material');
        if (materialSelect && !materialSelect.value) {
            materialSelect.value = 'PLA';
        }
        
        // Hersteller auf Bambu Lab setzen
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

        // Farb-Eingabe - Bambu Lookup
        const colorInput = document.getElementById('color');
        if (colorInput && bambuDictionary.loaded) {
            colorInput.addEventListener('input', (e) => {
                this.lookupBambuColor(e.target.value);
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
            const data = {
                Material: document.getElementById('material').value,
                Color: document.getElementById('color').value,
                Manufakturere: document.getElementById('manufacturer').value || 'Unbekannt',
                Weightbrutto: parseInt(document.getElementById('brutto').value) || 0,
                Spoolwright: parseInt(document.getElementById('tara').value) || 250,
                Weightnetto: parseInt(document.getElementById('nettoAnzeige').textContent) || 0,
                barcode: document.getElementById('barcode').value || null,
                Zimestamp: new Date().toISOString()
            };

            await filamentService.create(data);
            soundPlayer.playSuccess();
            showMessage('✅ Filament gespeichert!');
            
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
            
            // Auch im Bambu Dictionary suchen und passende Farben hervorheben
            if (bambuDictionary.loaded) {
                const bambuColor = bambuDictionary.findByName(query);
                if (bambuColor) {
                    // Zusätzlich nach dieser Farbe suchen
                    const additionalMatches = this.filaments.filter(f => 
                        !filtered.includes(f) && 
                        f.Color?.toLowerCase() === bambuColor.name.toLowerCase()
                    );
                    filtered = [...filtered, ...additionalMatches];
                }
            }
        }
        
        renderFilamentList(filtered);
        
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
        
        showConsumeModal(filament, async (amount, note) => {
            try {
                const result = await filamentService.consume(id, amount);
                
                // 🎵 KaChing Sound abspielen
                soundPlayer.playKaChing();
                
                if (result.deleted) {
                    showMessage('🗑️ Spule aufgebraucht und entfernt');
                } else {
                    showMessage(`✅ ${amount}g verbucht. Verbleibend: ${result.newWeight}g`);
                }
            } catch (error) {
                soundPlayer.playError();
                showMessage('Fehler beim Buchen: ' + error.message, true);
            }
        });
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
        
        // 2. Im Bambu Dictionary suchen
        if (bambuDictionary.loaded) {
            const color = bambuDictionary.parseBarcode(barcode);
            
            if (color) {
                // Bambu Filament erkannt - Auto-fill
                this.autoFillBambuData(color, barcode);
                soundPlayer.playSuccess();
                showMessage(`🎉 ${color.name} erkannt! Daten wurden ausgefüllt.`);
                return;
            }
        }
        
        // 3. Unbekannter Barcode - manuelle Eingabe
        document.getElementById('barcode').value = barcode;
        showMessage('📷 Barcode erkannt! Bitte fülle die restlichen Daten aus.');
        
        // Zum Neu-Tab wechseln
        this.switchTab('add');
    }

    // Bambu Daten automatisch ausfüllen
    autoFillBambuData(color, barcode) {
        // Barcode speichern
        document.getElementById('barcode').value = barcode;
        
        // Farbe setzen
        const colorInput = document.getElementById('color');
        if (colorInput) colorInput.value = color.name;
        
        // Material auf PLA setzen
        const materialSelect = document.getElementById('material');
        if (materialSelect) materialSelect.value = 'PLA';
        
        // Hersteller auf Bambu Lab setzen
        const manufacturerInput = document.getElementById('manufacturer');
        if (manufacturerInput) manufacturerInput.value = 'Bambu Lab';
        
        // Zum Neu-Tab wechseln
        this.switchTab('add');
        
        // Farb-Chips hervorheben
        const chips = document.querySelectorAll('#bambuColors button');
        chips.forEach(chip => {
            if (chip.title === color.name) {
                chip.classList.add('ring-2', 'ring-white', 'scale-125');
                setTimeout(() => {
                    chip.classList.remove('ring-2', 'ring-white', 'scale-125');
                }, 2000);
            }
        });
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

    // Bambu Farbe beim Tippen nachschlagen
    lookupBambuColor(input) {
        if (!bambuDictionary.loaded || !input || input.length < 2) return;
        
        const color = bambuDictionary.findByName(input);
        if (color) {
            // Gefunden! Aber nur vorschlagen, nicht automatisch ausfüllen
            console.log('🎨 Bambu Farbe gefunden:', color.name, color.hex);
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
