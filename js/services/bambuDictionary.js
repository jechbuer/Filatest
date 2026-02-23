// 📚 Bambu Lab Filament Dictionary Service
// Lädt und durchsucht die Bambu PLA Basic Spezifikation

class BambuDictionary {
    constructor() {
        this.specification = null;
        this.colors = new Map(); // name -> color object
        this.skus = new Map();   // sku -> color object
        this.loaded = false;
    }

    // Spezifikation laden
    async load() {
        if (this.loaded) return this.specification;
        
        try {
            const response = await fetch('data/bambu-pla-basic.json');
            if (!response.ok) {
                console.log('Bambu Spezifikation nicht gefunden, überspringe...');
                return null;
            }
            
            this.specification = await response.json();
            this.buildIndexes();
            this.loaded = true;
            
            console.log('✅ Bambu Dictionary geladen:', this.colors.size, 'Farben');
            return this.specification;
        } catch (error) {
            console.log('Bambu Dictionary nicht verfügbar:', error.message);
            return null;
        }
    }

    // Indizes für schnelle Suche aufbauen
    buildIndexes() {
        if (!this.specification?.product?.colors) return;
        
        this.specification.product.colors.forEach(color => {
            // Nach Name indexieren (lowercase für Suche)
            this.colors.set(color.name.toLowerCase(), color);
            
            // Nach SKU indexieren
            this.skus.set(color.sku, color);
            this.skus.set(color.sku_full, color);
            
            // Auch nach einfachen Namen indexieren (ohne Leerzeichen)
            const simpleName = color.name.toLowerCase().replace(/\s+/g, '');
            if (!this.colors.has(simpleName)) {
                this.colors.set(simpleName, color);
            }
        });
    }

    // Farbe nach Name suchen
    findByName(name) {
        if (!name) return null;
        
        const searchName = name.toLowerCase().trim();
        
        // Exakte Übereinstimmung
        if (this.colors.has(searchName)) {
            return this.colors.get(searchName);
        }
        
        // Teilweise Übereinstimmung
        for (const [key, color] of this.colors) {
            if (key.includes(searchName) || searchName.includes(key)) {
                return color;
            }
        }
        
        return null;
    }

    // Farbe nach SKU suchen
    findBySku(sku) {
        if (!sku) return null;
        
        // Exakte Suche
        if (this.skus.has(sku)) {
            return this.skus.get(sku);
        }
        
        // Teilweise Suche (für Barcodes die SKU enthalten)
        for (const [key, color] of this.skus) {
            if (sku.includes(key) || key.includes(sku)) {
                return color;
            }
        }
        
        return null;
    }

    // Barcode/RFID interpretieren
    parseBarcode(barcode) {
        if (!barcode) return null;
        
        // Bambu RFIDs enthalten typischerweise die SKU
        // Format: A00-XXXXX-1.75-1000-SPL oder ähnlich
        
        // Zuerst als SKU versuchen
        let color = this.findBySku(barcode);
        if (color) return color;
        
        // Nach numerischer SKU suchen (z.B. "10100")
        const numericMatch = barcode.match(/(\d{5})/);
        if (numericMatch) {
            color = this.findBySku(numericMatch[1]);
            if (color) return color;
        }
        
        // Nach vollständiger SKU suchen
        const fullSkuMatch = barcode.match(/A00-(\d{5})-[\d.]+-\d+-[A-Z]+/);
        if (fullSkuMatch) {
            color = this.findBySku(fullSkuMatch[0]);
            if (color) return color;
        }
        
        return null;
    }

    // Ähnliche Farben finden (für Vorschläge)
    findSimilar(query, maxResults = 5) {
        if (!query || !this.loaded) return [];
        
        const searchQuery = query.toLowerCase().trim();
        const results = [];
        
        for (const [key, color] of this.colors) {
            const score = this.calculateSimilarity(searchQuery, key, color);
            if (score > 0) {
                results.push({ color, score });
            }
        }
        
        // Nach Score sortieren und Top-Ergebnisse zurückgeben
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(r => r.color);
    }

    // Ähnlichkeit berechnen
    calculateSimilarity(query, key, color) {
        let score = 0;
        
        // Exakte Übereinstimmung
        if (key === query) return 100;
        
        // Enthält Query
        if (key.includes(query)) score += 50;
        if (query.includes(key)) score += 30;
        
        // Wort-Teilübereinstimmungen
        const queryWords = query.split(/\s+/);
        const keyWords = key.split(/\s+/);
        
        queryWords.forEach(qw => {
            keyWords.forEach(kw => {
                if (kw.includes(qw) || qw.includes(kw)) {
                    score += 20;
                }
            });
        });
        
        // Kategorie-Match
        if (color.category?.toLowerCase().includes(query)) {
            score += 10;
        }
        
        return score;
    }

    // Alle Farben als Array zurückgeben
    getAllColors() {
        if (!this.specification?.product?.colors) return [];
        return this.specification.product.colors;
    }

    // Farben nach Kategorie gruppieren
    getColorsByCategory() {
        const colors = this.getAllColors();
        const grouped = {};
        
        colors.forEach(color => {
            const category = color.category || 'Sonstige';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(color);
        });
        
        return grouped;
    }

    // Produktinformationen abrufen
    getProductInfo() {
        if (!this.specification?.product) return null;
        
        return {
            name: this.specification.product.name,
            brand: this.specification.product.brand,
            material: this.specification.product.material,
            diameter: this.specification.product.diameter,
            weight: this.specification.product.weight,
            url: this.specification.product.url,
            description: this.specification.product.description
        };
    }

    // Druckeinstellungen abrufen
    getPrintSettings() {
        return this.specification?.printing_settings || null;
    }

    // Kompatibilität prüfen
    isCompatible(feature) {
        const compat = this.specification?.compatibility;
        if (!compat) return null;
        
        for (const [category, data] of Object.entries(compat)) {
            if (data.recommended?.includes(feature)) return 'recommended';
            if (data.not_recommended?.includes(feature)) return 'not_recommended';
        }
        return null;
    }
}

// Singleton-Instanz exportieren
export const bambuDictionary = new BambuDictionary();
