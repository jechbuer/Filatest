// 📚 Universal Filament Dictionary Service
// Unterstützt mehrere Materialien und Marken (Bambu Lab, etc.)

class FilamentDictionary {
    constructor() {
        this.materials = new Map(); // materialName -> spec
        this.colors = new Map();    // "material:colorName" -> color object
        this.skus = new Map();      // sku -> { color, material }
        this.loaded = false;
        this.loadingPromise = null;
        
        // Zu ladende Material-Dateien
        this.specFiles = [
            'data/bambu-pla-basic.json',
            'data/bambu-petg-basic.json',
            'data/bambu-abs.json',
            'data/bambu-tpu.json'
        ];
    }

    // Alle Spezifikationen laden
    async load() {
        if (this.loadingPromise) return this.loadingPromise;
        if (this.loaded) return Promise.resolve();
        
        this.loadingPromise = this.loadAllSpecs();
        return this.loadingPromise;
    }

    async loadAllSpecs() {
        const loadPromises = this.specFiles.map(file => this.loadSpec(file));
        await Promise.all(loadPromises);
        
        this.loaded = this.materials.size > 0;
        console.log(`✅ Filament Dictionary geladen: ${this.materials.size} Materialien, ${this.colors.size} Farben`);
        return this.materials;
    }

    // Einzelne Spezifikation laden
    async loadSpec(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.log(`Spezifikation nicht gefunden: ${filePath}`);
                return null;
            }
            
            const spec = await response.json();
            this.addSpecification(spec);
            return spec;
        } catch (error) {
            console.log(`Fehler beim Laden von ${filePath}:`, error.message);
            return null;
        }
    }

    // Spezifikation zum Index hinzufügen
    addSpecification(spec) {
        if (!spec?.product) return;
        
        const materialName = spec.product.material;
        const brand = spec.product.brand;
        
        // Material speichern
        this.materials.set(materialName.toLowerCase(), spec);
        
        // Farben indexieren
        if (spec.product.colors) {
            spec.product.colors.forEach(color => {
                const key = `${materialName.toLowerCase()}:${color.name.toLowerCase()}`;
                const price = spec.product?.pricing?.single_roll?.price_regular || null;
                this.colors.set(key, { ...color, material: materialName, brand, price });
                
                // SKU indexieren
                if (color.sku) {
                    this.skus.set(color.sku, { color, material: materialName, brand });
                }
                if (color.sku_full) {
                    this.skus.set(color.sku_full, { color, material: materialName, brand });
                }
                
                // Einfacher Name (ohne Leerzeichen)
                const simpleName = color.name.toLowerCase().replace(/\s+/g, '');
                const simpleKey = `${materialName.toLowerCase()}:${simpleName}`;
                if (!this.colors.has(simpleKey)) {
                    this.colors.set(simpleKey, { ...color, material: materialName, brand });
                }
            });
        }
    }

    // Farbe nach Name und Material suchen
    findByName(colorName, materialName = null) {
        if (!colorName) return null;
        
        const searchName = colorName.toLowerCase().trim();
        
        // Wenn Material bekannt ist, direkt suchen
        if (materialName) {
            const key = `${materialName.toLowerCase()}:${searchName}`;
            if (this.colors.has(key)) {
                return this.colors.get(key);
            }
        }
        
        // Sonst in allen Materialien suchen
        for (const [key, color] of this.colors) {
            if (key.includes(searchName) || searchName.includes(color.name.toLowerCase())) {
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
        
        // SKU-Nummer extrahieren (z.B. "10100" aus "A00-10100-1.75-1000-SPL")
        const numericMatch = sku.match(/(\d{5})/);
        if (numericMatch) {
            const found = this.skus.get(numericMatch[1]);
            if (found) return found;
        }
        
        // Teilweise Suche
        for (const [key, data] of this.skus) {
            if (sku.includes(key) || key.includes(sku)) {
                return data;
            }
        }
        
        return null;
    }

    // Barcode/RFID interpretieren
    parseBarcode(barcode) {
        if (!barcode) return null;
        
        // Zuerst als SKU versuchen
        const result = this.findBySku(barcode);
        if (result) return result;
        
        // RFID-Format: A00-XXXXX-1.75-1000-SPL
        const rfidMatch = barcode.match(/A00-(\d{5})-[\d.]+-\d+-[A-Z]+/);
        if (rfidMatch) {
            return this.findBySku(rfidMatch[1]);
        }
        
        // Einfache Nummernsuche (5-stellig)
        const simpleMatch = barcode.match(/(\d{5})/);
        if (simpleMatch) {
            return this.findBySku(simpleMatch[1]);
        }
        
        return null;
    }

    // Material aus SKU bestimmen
    detectMaterialFromSku(sku) {
        if (!sku) return null;
        
        const skuNum = sku.match(/(\d{5})/)?.[1];
        if (!skuNum) return null;
        
        // Bambu SKU-Ranges:
        // 1xxxx = PLA
        // 2xxxx = PETG
        // 3xxxx = ABS/ASA
        // 4xxxx = TPU
        
        const prefix = skuNum[0];
        const materialMap = {
            '1': 'PLA',
            '2': 'PETG',
            '3': 'ABS',
            '4': 'TPU'
        };
        
        return materialMap[prefix] || null;
    }

    // Ähnliche Farben finden
    findSimilar(query, materialName = null, maxResults = 5) {
        if (!query || !this.loaded) return [];
        
        const searchQuery = query.toLowerCase().trim();
        const results = [];
        
        for (const [key, color] of this.colors) {
            // Wenn Material angegeben, nur dieses durchsuchen
            if (materialName && !key.startsWith(materialName.toLowerCase() + ':')) {
                continue;
            }
            
            const score = this.calculateSimilarity(searchQuery, color);
            if (score > 0) {
                results.push({ color, score });
            }
        }
        
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(r => r.color);
    }

    // Ähnlichkeit berechnen
    calculateSimilarity(query, color) {
        let score = 0;
        const name = color.name.toLowerCase();
        
        // Exakte Übereinstimmung
        if (name === query) return 100;
        
        // Enthält Query
        if (name.includes(query)) score += 50;
        if (query.includes(name)) score += 30;
        
        // Wort-Teilübereinstimmungen
        const queryWords = query.split(/\s+/);
        const nameWords = name.split(/\s+/);
        
        queryWords.forEach(qw => {
            nameWords.forEach(nw => {
                if (nw.includes(qw) || qw.includes(nw)) {
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

    // Alle Farben eines Materials
    getColorsByMaterial(materialName) {
        if (!materialName) return [];
        
        const colors = [];
        const prefix = materialName.toLowerCase() + ':';
        
        for (const [key, color] of this.colors) {
            if (key.startsWith(prefix)) {
                colors.push(color);
            }
        }
        
        return colors;
    }

    // Farben nach Kategorie gruppieren
    getColorsByCategory(materialName) {
        const colors = this.getColorsByMaterial(materialName);
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

    // Alle verfügbaren Materialien
    getAvailableMaterials() {
        return Array.from(this.materials.keys());
    }

    // Produktinformationen abrufen
    getProductInfo(materialName) {
        const spec = this.materials.get(materialName?.toLowerCase());
        if (!spec?.product) return null;
        
        return {
            name: spec.product.name,
            brand: spec.product.brand,
            material: spec.product.material,
            diameter: spec.product.diameter,
            weight: spec.product.weight,
            url: spec.product.url,
            description: spec.product.description,
            hardness: spec.product.hardness
        };
    }

    // Druckeinstellungen abrufen
    getPrintSettings(materialName) {
        const spec = this.materials.get(materialName?.toLowerCase());
        return spec?.printing_settings || null;
    }

    // Kompatibilität prüfen
    getCompatibility(materialName) {
        const spec = this.materials.get(materialName?.toLowerCase());
        return spec?.compatibility || null;
    }

    // Alle Daten für ein Material
    getFullSpecification(materialName) {
        return this.materials.get(materialName?.toLowerCase()) || null;
    }

    // Preis pro Gramm berechnen
    getPricePerGram(materialName) {
        const spec = this.materials.get(materialName?.toLowerCase());
        if (!spec?.product) return null;
        
        const price = spec.product.pricing?.single_roll?.price_regular;
        const weightStr = spec.product.weight;
        
        if (!price || !weightStr) return null;
        
        // Gewicht in Gramm extrahieren (z.B. "1kg" -> 1000)
        const weightMatch = weightStr.match(/(\d+(?:\.\d+)?)\s*(kg|g)/i);
        if (!weightMatch) return null;
        
        let weight = parseFloat(weightMatch[1]);
        if (weightMatch[2].toLowerCase() === 'kg') {
            weight *= 1000;
        }
        
        return price / weight;
    }

    // Preis für bestimmte Menge berechnen
    calculateCost(materialName, grams) {
        const pricePerGram = this.getPricePerGram(materialName);
        if (!pricePerGram || !grams) return null;
        return pricePerGram * grams;
    }

    // Suchvorschläge für Autocomplete
    getAutocompleteSuggestions(query, maxResults = 10) {
        if (!query || query.length < 2) return [];
        
        const results = [];
        const queryLower = query.toLowerCase();
        
        // Durch alle Farben suchen
        for (const [key, color] of this.colors) {
            if (color.name.toLowerCase().includes(queryLower)) {
                results.push({
                    name: color.name,
                    material: color.material,
                    brand: color.brand,
                    hex: color.hex,
                    category: color.category
                });
            }
            
            if (results.length >= maxResults) break;
        }
        
        return results;
    }
}

// Singleton-Instanz exportieren
export const filamentDictionary = new FilamentDictionary();
